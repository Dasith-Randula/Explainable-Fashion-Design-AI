"""
Closed-loop explain -> refine -> re-evaluate orchestration.

Owner: Dewmi
Module: CCS4310 - Deep Learning
Project: Explainable-Fashion-Design-AI

Ties together the other explainability modules into the single workflow
described in Section 09 of the project document ("Proposed Closed-Loop
Architecture"): score a design, explain the score, generate refinement
suggestions, apply them, re-score, and report the before/after comparison.

This module deliberately does not depend on any specific dataset schema
beyond the ('prep', 'model') pipeline convention used across the project,
so the same function works for the demand model today and the customer
preference model once it is a tree-based winner.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

import pandas as pd

from .shap_explainer import explain_row, global_feature_importance
from .refinement import (
    apply_refinement,
    generate_refinement_suggestions,
    suggestions_to_prompt_hints,
)


@dataclass
class ClosedLoopResult:
    original_row: pd.Series
    refined_row: pd.Series
    original_score: float
    refined_score: float
    suggestions: list
    prompt_hints: list

    @property
    def improved(self) -> bool:
        return self.refined_score > self.original_score

    @property
    def score_delta(self) -> float:
        return self.refined_score - self.original_score

    def as_summary_row(self) -> dict:
        return {
            "original_score": self.original_score,
            "refined_score": self.refined_score,
            "score_delta": self.score_delta,
            "improved": self.improved,
            "n_suggestions": len(self.suggestions),
            "prompt_hints": "; ".join(self.prompt_hints),
        }


def run_closed_loop(
    pipeline,
    X: pd.DataFrame,
    categorical_features: list,
    row_index: int = 0,
    importance_table: Optional[pd.DataFrame] = None,
    top_n_weak_factors: int = 3,
) -> ClosedLoopResult:
    """Run one full explain -> refine -> re-evaluate cycle for a single design.

    Parameters
    ----------
    pipeline:
        A fitted sklearn ``Pipeline`` with ``('prep', 'model')`` steps, as
        saved by e.g. ``models/demand/best_demand_model.joblib``.
    X:
        Feature DataFrame containing (at least) the design at ``row_index``.
        A larger, representative sample is recommended so SHAP's background
        distribution and the global importance table are meaningful.
    categorical_features:
        Original (pre-one-hot) categorical column names, e.g.
        ``config['categorical_features']`` from the saved model config.
    importance_table:
        Optional precomputed output of
        :func:`src.explainability.shap_explainer.global_feature_importance`.
        Computed on ``X`` automatically if not supplied (slower, since it
        re-runs SHAP over the whole sample).
    """
    if importance_table is None:
        importance_table = global_feature_importance(pipeline, X)

    explanation = explain_row(pipeline, X, row_index=row_index)
    suggestions = generate_refinement_suggestions(
        explanation,
        categorical_features=categorical_features,
        importance_table=importance_table,
        top_n_weak_factors=top_n_weak_factors,
    )
    original_row = X.iloc[row_index]
    refined_row = apply_refinement(original_row, suggestions)

    original_score = float(pipeline.predict(pd.DataFrame([original_row]))[0])
    refined_score = float(pipeline.predict(pd.DataFrame([refined_row]))[0])

    return ClosedLoopResult(
        original_row=original_row,
        refined_row=refined_row,
        original_score=original_score,
        refined_score=refined_score,
        suggestions=suggestions,
        prompt_hints=suggestions_to_prompt_hints(suggestions),
    )


def run_closed_loop_batch(
    pipeline,
    X: pd.DataFrame,
    categorical_features: list,
    row_indices: Optional[list] = None,
    top_n_weak_factors: int = 3,
) -> pd.DataFrame:
    """Run :func:`run_closed_loop` over several designs and return a
    comparison table (one row per design) suitable for saving as a CSV
    metric artifact and for a before/after bar chart.
    """
    if row_indices is None:
        row_indices = list(range(len(X)))

    importance_table = global_feature_importance(pipeline, X)
    rows = []
    for idx in row_indices:
        result = run_closed_loop(
            pipeline,
            X,
            categorical_features=categorical_features,
            row_index=idx,
            importance_table=importance_table,
            top_n_weak_factors=top_n_weak_factors,
        )
        rows.append({"row_index": idx, **result.as_summary_row()})
    return pd.DataFrame(rows)
