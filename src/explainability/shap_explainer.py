"""
SHAP-based explainability for the demand / preference scoring models.

Owner: Dewmi
Module: CCS4310 - Deep Learning
Project: Explainable-Fashion-Design-AI

This module is intentionally generic: it works on any fitted scikit-learn
``Pipeline`` that exposes a ``prep`` step (a ``ColumnTransformer``) and a
``model`` step (a tree-based estimator such as XGBoost, LightGBM or
RandomForest). That is exactly the shape of the pipelines saved by the
demand-forecasting notebook (``models/demand/best_demand_model.joblib``) and
is the shape expected from the customer-preference notebook once a tree
model is selected as the winner.

The functions here do not read or write files on their own (except for the
small convenience helpers at the bottom): they take a fitted pipeline and a
raw feature DataFrame and return SHAP values / explanations so that they can
be reused from a notebook, a script, or (later) the backend explainability
service described in the project README.
"""

from __future__ import annotations

import warnings
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional

import numpy as np
import pandas as pd

try:
    import shap
except ImportError as exc:  # pragma: no cover - surfaced to the caller
    raise ImportError(
        "The 'shap' package is required for src.explainability.shap_explainer. "
        "Install it with `pip install shap`."
    ) from exc


TREE_MODEL_MODULES = (
    "xgboost",
    "lightgbm",
    "sklearn.ensemble",
    "sklearn.tree",
)


@dataclass
class ExplanationResult:
    """Container for a single-row (local) SHAP explanation."""

    feature_names: list
    shap_values: np.ndarray
    base_value: float
    predicted_value: float
    raw_row: pd.Series

    def attribute_contributions(self, categorical_features: list) -> pd.DataFrame:
        """SHAP contribution of each attribute's *currently active* value.

        For one-hot encoded categorical columns, SHAP can assign a non-zero
        value to a dummy column even when it is not active for this row
        (tree interaction effects). Ranking raw one-hot columns by SHAP
        value can therefore point at a category the design does not even
        have. This method instead looks up, for every attribute in
        ``categorical_features``, the one-hot column that matches this
        row's actual value (from ``raw_row``) and reports only that
        column's SHAP value - the correct "how much is what this design
        currently has hurting/helping the score" answer.
        """
        rows = []
        name_to_value = dict(zip(self.feature_names, self.shap_values))
        for attribute in categorical_features:
            if attribute not in self.raw_row.index:
                continue
            current_value = self.raw_row[attribute]
            feature_name = f"cat__{attribute}_{current_value}"
            shap_value = name_to_value.get(feature_name)
            if shap_value is None:
                # Category unseen at fit time (handle_unknown='ignore') or a
                # different one-hot naming scheme; skip rather than guess.
                continue
            rows.append(
                {
                    "attribute": attribute,
                    "current_value": current_value,
                    "shap_value": float(shap_value),
                }
            )
        frame = pd.DataFrame(rows)
        if not frame.empty:
            frame = frame.sort_values("shap_value").reset_index(drop=True)
        return frame

    def top_contributions(self, n: int = 5, direction: str = "both") -> pd.DataFrame:
        """Return the ``n`` largest SHAP contributions for this row.

        Parameters
        ----------
        direction:
            ``"positive"`` returns only features pushing the prediction up,
            ``"negative"`` returns only features pushing it down, ``"both"``
            (default) ranks by absolute magnitude regardless of sign.
        """
        frame = pd.DataFrame(
            {"feature": self.feature_names, "shap_value": self.shap_values}
        )
        if direction == "positive":
            frame = frame[frame.shap_value > 0].sort_values(
                "shap_value", ascending=False
            )
        elif direction == "negative":
            frame = frame[frame.shap_value < 0].sort_values("shap_value")
        else:
            frame = frame.reindex(
                frame.shap_value.abs().sort_values(ascending=False).index
            )
        return frame.head(n).reset_index(drop=True)


def _get_prep_and_model(pipeline) -> tuple:
    """Fetch the ('prep', ColumnTransformer) and ('model', estimator) steps.

    Raises a clear error if the pipeline does not follow the project's
    saved-pipeline convention, instead of failing with a confusing
    AttributeError deep inside shap.
    """
    if not hasattr(pipeline, "named_steps"):
        raise TypeError(
            "Expected a fitted sklearn Pipeline with 'prep' and 'model' steps, "
            f"got {type(pipeline).__name__} instead. Baseline / dict-style "
            "artifacts (e.g. 'Historical Mean', 'Global Popularity') are not "
            "explainable with SHAP and should be skipped."
        )
    steps = pipeline.named_steps
    if "prep" not in steps or "model" not in steps:
        raise KeyError(
            f"Pipeline steps {list(steps)} do not match the expected "
            "('prep', 'model') convention used across this project."
        )
    return steps["prep"], steps["model"]


def is_tree_based(model: Any) -> bool:
    """Best-effort check for whether a model can use SHAP's fast TreeExplainer."""
    module = type(model).__module__
    return any(module.startswith(prefix) for prefix in TREE_MODEL_MODULES)


def transform_features(pipeline, X: pd.DataFrame) -> tuple:
    """Run only the ``prep`` step of the pipeline and return a dense matrix
    plus the resulting (one-hot expanded) feature names.
    """
    prep, _ = _get_prep_and_model(pipeline)
    transformed = prep.transform(X)
    if hasattr(transformed, "toarray"):
        transformed = transformed.toarray()
    feature_names = list(prep.get_feature_names_out())
    return np.asarray(transformed, dtype=float), feature_names


def build_explainer(pipeline, background: Optional[pd.DataFrame] = None):
    """Build a SHAP explainer for the ``model`` step of ``pipeline``.

    Uses ``shap.TreeExplainer`` for tree-based models (fast, exact) and
    falls back to ``shap.Explainer`` with a background sample otherwise.
    """
    _, model = _get_prep_and_model(pipeline)
    if is_tree_based(model):
        return shap.TreeExplainer(model)
    if background is None:
        raise ValueError(
            "A background sample (transformed features) is required to "
            "build a model-agnostic SHAP explainer for a non-tree model."
        )
    return shap.Explainer(model.predict, background)


def compute_shap_values(pipeline, X: pd.DataFrame):
    """Compute SHAP values for every row in ``X``.

    Returns
    -------
    values : np.ndarray of shape (n_rows, n_transformed_features)
    feature_names : list[str]
    base_value : float
    explainer : the underlying shap explainer (kept for reuse / plotting)
    """
    transformed, feature_names = transform_features(pipeline, X)
    explainer = build_explainer(pipeline, background=transformed)
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        explanation = explainer(transformed)
    values = np.asarray(explanation.values)
    base_value = explanation.base_values
    base_value = float(np.mean(base_value)) if hasattr(base_value, "__len__") else float(base_value)
    return values, feature_names, base_value, explainer


def global_feature_importance(pipeline, X: pd.DataFrame) -> pd.DataFrame:
    """Mean absolute SHAP value per feature, sorted descending.

    This is the SHAP counterpart to the ``feature_importances_``-based table
    already produced by the demand-forecasting notebook, and is intended to
    be compared against it in the explainability report.
    """
    values, feature_names, _, _ = compute_shap_values(pipeline, X)
    importance = pd.Series(np.abs(values).mean(axis=0), index=feature_names)
    importance = importance.sort_values(ascending=False)
    return importance.to_frame("mean_abs_shap")


def explain_row(pipeline, X: pd.DataFrame, row_index: int = 0) -> ExplanationResult:
    """Produce a local (per-design) explanation for a single row of ``X``."""
    if row_index < 0 or row_index >= len(X):
        raise IndexError(f"row_index {row_index} is out of range for {len(X)} rows.")
    values, feature_names, base_value, _ = compute_shap_values(pipeline, X)
    predicted_value = float(base_value + values[row_index].sum())
    return ExplanationResult(
        feature_names=feature_names,
        shap_values=values[row_index],
        base_value=base_value,
        predicted_value=predicted_value,
        raw_row=X.iloc[row_index],
    )


def save_global_importance(
    pipeline,
    X: pd.DataFrame,
    metrics_path: Path,
    figures_path: Path,
    top_n: int = 20,
):
    """Compute global SHAP importance and persist a CSV + bar-chart figure.

    Kept as a thin convenience wrapper so the notebook cell stays short;
    all the real logic lives in :func:`global_feature_importance` above.
    """
    import matplotlib.pyplot as plt

    importance = global_feature_importance(pipeline, X)
    importance.to_csv(metrics_path, header=True)

    top = importance.head(top_n)
    fig, ax = plt.subplots(figsize=(9, 6))
    top.sort_values("mean_abs_shap").plot.barh(ax=ax, legend=False)
    ax.set_xlabel("mean |SHAP value|")
    ax.set_title(f"Global SHAP feature importance (top {top_n})")
    fig.tight_layout()
    fig.savefig(figures_path, dpi=150)
    plt.close(fig)
    return importance
