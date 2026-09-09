"""
SHAP-based explainability for the demand / preference scoring models.

Owner: Dewmi
Module: CCS4310 - Deep Learning
Project: Explainable-Fashion-Design-AI
"""

from __future__ import annotations

import warnings
from dataclasses import dataclass
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

PREPROCESSOR_ALIASES = ("prep", "preprocess", "preprocessor")
ESTIMATOR_ALIASES = ("model", "classifier", "estimator")


@dataclass
class ExplanationResult:
    feature_names: list
    shap_values: np.ndarray
    base_value: float
    predicted_value: float
    raw_row: pd.Series
    output_type: str = "regression_prediction"

    def attribute_contributions(self, categorical_features: list) -> pd.DataFrame:
        rows = []
        name_to_value = dict(zip(self.feature_names, self.shap_values))
        for attribute in categorical_features:
            if attribute not in self.raw_row.index:
                continue
            current_value = self.raw_row[attribute]
            feature_name = f"cat__{attribute}_{current_value}"
            shap_value = name_to_value.get(feature_name)
            if shap_value is None:
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
        frame = pd.DataFrame({"feature": self.feature_names, "shap_value": self.shap_values})
        if direction == "positive":
            frame = frame[frame.shap_value > 0].sort_values("shap_value", ascending=False)
        elif direction == "negative":
            frame = frame[frame.shap_value < 0].sort_values("shap_value")
        else:
            frame = frame.reindex(frame.shap_value.abs().sort_values(ascending=False).index)
        return frame.head(n).reset_index(drop=True)


@dataclass
class ShapAnalysisBundle:
    values: np.ndarray
    feature_names: list
    base_values: np.ndarray
    explainer: Any
    output_type: str

    def explain_row(self, X: pd.DataFrame, row_index: int = 0) -> ExplanationResult:
        if row_index < 0 or row_index >= len(X):
            raise IndexError(f"row_index {row_index} is out of range for {len(X)} rows.")
        shap_vector = np.asarray(self.values[row_index], dtype=float)
        row_base_value = float(self.base_values[row_index])
        predicted_value = float(row_base_value + shap_vector.sum())
        return ExplanationResult(
            feature_names=self.feature_names,
            shap_values=shap_vector,
            base_value=row_base_value,
            predicted_value=predicted_value,
            raw_row=X.iloc[row_index],
            output_type=self.output_type,
        )


def resolve_pipeline_steps(pipeline) -> tuple:
    """Resolve a supported preprocess + estimator pair from commonly used aliases."""
    if not hasattr(pipeline, "named_steps"):
        raise TypeError(
            f"Expected a fitted sklearn Pipeline with supported preprocessing and estimator steps, got {type(pipeline).__name__}."
        )
    steps = pipeline.named_steps
    preprocessor = None
    estimator = None
    for alias in PREPROCESSOR_ALIASES:
        if alias in steps:
            preprocessor = steps[alias]
            break
    for alias in ESTIMATOR_ALIASES:
        if alias in steps:
            estimator = steps[alias]
            break
    if preprocessor is None or estimator is None:
        raise KeyError(
            f"Unsupported pipeline step names: {list(steps)}. Expected aliases among {PREPROCESSOR_ALIASES} and {ESTIMATOR_ALIASES}."
        )
    return preprocessor, estimator


def _get_prep_and_model(pipeline) -> tuple:
    return resolve_pipeline_steps(pipeline)


def is_tree_based(model: Any) -> bool:
    module = type(model).__module__
    return any(module.startswith(prefix) for prefix in TREE_MODEL_MODULES)


def _is_classifier(model: Any) -> bool:
    return hasattr(model, "predict_proba") and hasattr(model, "classes_")


def _is_xgboost_regressor(model: Any) -> bool:
    return (
        type(model).__module__.startswith("xgboost")
        and not _is_classifier(model)
        and hasattr(model, "get_booster")
    )


def _positive_class_index(model: Any) -> int:
    classes = getattr(model, "classes_", None)
    if classes is None:
        return 1 if hasattr(model, "n_classes_") and model.n_classes_ > 1 else 0
    if len(classes) == 0:
        return 0
    if 1 in classes:
        return int(np.where(np.asarray(classes) == 1)[0][0])
    return max(len(classes) - 1, 0)


def predict_explained_output(pipeline, X: pd.DataFrame):
    """Return the model output that SHAP should explain for the selected pipeline.

    Regression pipelines explain pipeline.predict(X). Binary classifiers explain
    the positive-class probability from pipeline.predict_proba(X), not the hard
    class label.
    """
    _, model = resolve_pipeline_steps(pipeline)
    if _is_classifier(model):
        proba = np.asarray(pipeline.predict_proba(X))
        if proba.ndim == 1:
            return proba
        if proba.shape[1] == 1:
            return proba[:, 0]
        positive_index = _positive_class_index(model)
        return proba[:, positive_index]
    return np.asarray(pipeline.predict(X), dtype=float)


def transform_features(pipeline, X: pd.DataFrame, dense: bool = True) -> tuple:
    prep, _ = resolve_pipeline_steps(pipeline)
    transformed = prep.transform(X)
    if dense and hasattr(transformed, "toarray"):
        transformed = transformed.toarray()
    feature_names = list(prep.get_feature_names_out())
    if dense:
        transformed = np.asarray(transformed, dtype=float)
    return transformed, feature_names


def build_explainer(pipeline, background: Optional[pd.DataFrame] = None):
    _, model = resolve_pipeline_steps(pipeline)
    if is_tree_based(model):
        return shap.TreeExplainer(model)
    if background is None:
        raise ValueError(
            "A background sample (transformed features) is required to build a model-agnostic SHAP explainer for a non-tree model."
        )
    return shap.Explainer(model.predict, background)


def _normalize_shap_values(raw_values, feature_names: list, model: Any, output_type: str):
    values = np.asarray(raw_values, dtype=float)
    if values.ndim == 1:
        values = values.reshape(-1, 1)
    if values.ndim == 3:
        if _is_classifier(model):
            pos_idx = _positive_class_index(model)
            values = values[:, :, pos_idx]
        else:
            values = values[:, :, 0]
    if values.ndim != 2:
        raise ValueError(
            f"SHAP values must resolve to 2D (n_samples, n_features) for {output_type}; got shape {values.shape}."
        )
    if values.shape[1] != len(feature_names):
        raise ValueError(
            f"SHAP column count {values.shape[1]} does not match expected feature count {len(feature_names)}."
        )
    return values


def _normalize_base_values(raw_base, model: Any, output_type: str, n_samples: int):
    if raw_base is None:
        return np.zeros(n_samples, dtype=float)
    base_values = np.asarray(raw_base, dtype=float)
    if base_values.ndim == 0:
        return np.full(n_samples, float(base_values), dtype=float)
    if _is_classifier(model) and base_values.ndim > 1 and base_values.shape[-1] > 1:
        pos_idx = _positive_class_index(model)
        base_values = base_values[:, pos_idx]
    base_values = np.asarray(base_values, dtype=float).reshape(-1)
    if base_values.size == 1:
        return np.full(n_samples, float(base_values[0]), dtype=float)
    if base_values.size != n_samples:
        raise ValueError(
            f"SHAP base values must resolve to one value per sample ({n_samples}); got shape {np.asarray(raw_base).shape}."
        )
    return base_values


def compute_shap_values(pipeline, X: pd.DataFrame, output_type: Optional[str] = None):
    _, model = resolve_pipeline_steps(pipeline)
    if output_type is None:
        output_type = "regression_prediction" if not _is_classifier(model) else "positive_class_probability"

    if _is_xgboost_regressor(model):
        import xgboost as xgb

        transformed, feature_names = transform_features(pipeline, X, dense=False)
        pipeline_predictions = np.asarray(predict_explained_output(pipeline, X), dtype=float).reshape(-1)
        estimator_predictions = np.asarray(model.predict(transformed), dtype=float).reshape(-1)
        if not np.allclose(pipeline_predictions, estimator_predictions, atol=1e-3, rtol=0.0):
            raise RuntimeError("Pipeline prediction and estimator prediction are not aligned.")

        booster = model.get_booster()
        contributions = np.asarray(
            booster.predict(xgb.DMatrix(transformed), pred_contribs=True),
            dtype=float,
        )
        if contributions.ndim != 2 or contributions.shape[1] != len(feature_names) + 1:
            raise RuntimeError(
                "XGBoost native SHAP contributions did not return the expected feature contributions and bias column."
            )

        values = contributions[:, :-1]
        base_values = contributions[:, -1]
        contribution_predictions = contributions.sum(axis=1)
        if not np.allclose(contribution_predictions, pipeline_predictions, atol=1e-3, rtol=0.0):
            raise RuntimeError(
                "XGBoost native SHAP contributions do not reconstruct estimator predictions within 1e-3."
            )

        return values, feature_names, base_values, booster, output_type

    transformed, feature_names = transform_features(pipeline, X)
    explainer = build_explainer(pipeline, background=transformed)
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        explanation = explainer(transformed)
    values = _normalize_shap_values(explanation.values, feature_names, model, output_type)
    base_values = _normalize_base_values(
        getattr(explanation, "base_values", 0.0),
        model,
        output_type,
        len(X),
    )
    return values, feature_names, base_values, explainer, output_type


def global_feature_importance(pipeline, X: pd.DataFrame) -> pd.DataFrame:
    values, feature_names, _, _, _ = compute_shap_values(pipeline, X)
    importance = pd.Series(np.abs(values).mean(axis=0), index=feature_names)
    importance = importance.sort_values(ascending=False)
    return importance.to_frame("mean_abs_shap")


def explain_row(pipeline, X: pd.DataFrame, row_index: int = 0) -> ExplanationResult:
    if row_index < 0 or row_index >= len(X):
        raise IndexError(f"row_index {row_index} is out of range for {len(X)} rows.")
    values, feature_names, base_values, _, output_type = compute_shap_values(pipeline, X)
    shap_vector = np.asarray(values[row_index], dtype=float)
    row_base_value = float(base_values[row_index])
    predicted_value = float(row_base_value + shap_vector.sum())
    return ExplanationResult(
        feature_names=feature_names,
        shap_values=shap_vector,
        base_value=row_base_value,
        predicted_value=predicted_value,
        raw_row=X.iloc[row_index],
        output_type=output_type,
    )


def reconstruct_prediction_from_shap(explanation: ExplanationResult) -> float:
    return float(explanation.base_value + np.asarray(explanation.shap_values, dtype=float).sum())


def check_shap_prediction_consistency(
    pipeline,
    X: pd.DataFrame,
    row_index: int = 0,
    tolerance: float = 1e-3,
) -> dict:
    if row_index < 0 or row_index >= len(X):
        raise IndexError(f"row_index {row_index} is out of range for {len(X)} rows.")
    explanation = explain_row(pipeline, X, row_index=row_index)
    row = pd.DataFrame([X.iloc[row_index]])
    actual_prediction = float(predict_explained_output(pipeline, row)[0])
    reconstructed_prediction = reconstruct_prediction_from_shap(explanation)
    difference = abs(actual_prediction - reconstructed_prediction)
    _, model = resolve_pipeline_steps(pipeline)
    if _is_classifier(model) and difference > tolerance:
        raise ValueError(
            "Unsupported SHAP output scale for classifier consistency: the explainer output "
            "does not match the positive-class probability returned by predict_explained_output()."
        )
    status = difference <= tolerance
    return {
        "row_index": row_index,
        "output_type": explanation.output_type,
        "actual_prediction": actual_prediction,
        "reconstructed_prediction": reconstructed_prediction,
        "difference": difference,
        "tolerance": tolerance,
        "consistent": status,
        "base_value": explanation.base_value,
        "sum_shap_values": float(np.asarray(explanation.shap_values, dtype=float).sum()),
        "message": (
            "SHAP reconstruction is consistent within tolerance."
            if status
            else "SHAP reconstruction differs from the actual model prediction; check model/explainer scale or feature alignment."
        ),
    }


def save_global_importance(
    pipeline,
    X: pd.DataFrame,
    metrics_path: Path,
    figures_path: Path,
    top_n: int = 20,
):
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
