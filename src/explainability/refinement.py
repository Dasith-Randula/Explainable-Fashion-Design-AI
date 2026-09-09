"""
Explanation-to-refinement rule engine.

Owner: Dewmi
Module: CCS4310 - Deep Learning
Project: Explainable-Fashion-Design-AI
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

import pandas as pd

from .shap_explainer import ExplanationResult, predict_explained_output


CATEGORICAL_PREFIX = "cat__"
NUMERICAL_PREFIX = "num__"
MUTABLE_DESIGN_ATTRIBUTES = ["color", "fabric", "category"]
DEFAULT_MUTABLE_ATTRIBUTES = set(MUTABLE_DESIGN_ATTRIBUTES)


@dataclass
class RefinementSuggestion:
    attribute: str
    current_value: Optional[str]
    suggested_value: str
    reason: str
    shap_value: float
    original_score: Optional[float] = None
    candidate_score: Optional[float] = None
    score_delta: Optional[float] = None


def _valid_alternative_values(validation_data: pd.DataFrame, attribute: str, current_value):
    if validation_data is None or attribute not in validation_data.columns:
        return []
    candidates = pd.Series(validation_data[attribute].dropna().unique())
    candidates = candidates[candidates.astype(str) != str(current_value)]
    return list(candidates)


def generate_refinement_suggestions(
    explanation: ExplanationResult,
    categorical_features: list,
    validation_data: Optional[pd.DataFrame] = None,
    pipeline=None,
    importance_table: Optional[pd.DataFrame] = None,
    top_n_weak_factors: int = 3,
    mutable_attributes: Optional[set] = None,
) -> list:
    """Select negative mutable attributes and use counterfactual rescoring to find the best observed replacement.

    SHAP identifies the currently active attribute that is hurting the model score. The replacement value is then chosen by re-scoring valid alternatives on the development/validation sample, not by interpreting mean_abs_shap as a positive direction.
    """
    mutable = DEFAULT_MUTABLE_ATTRIBUTES if mutable_attributes is None else set(mutable_attributes)
    weak = explanation.attribute_contributions(categorical_features)
    weak = weak[weak.shap_value < 0]
    weak = weak[weak["attribute"].isin(mutable)].head(top_n_weak_factors)
    suggestions: list[RefinementSuggestion] = []

    original_row = explanation.raw_row.copy()
    if pipeline is not None:
        original_score = float(predict_explained_output(pipeline, pd.DataFrame([original_row]))[0])
    else:
        original_score = None

    for _, row in weak.iterrows():
        attribute = row["attribute"]
        current_value = row["current_value"]
        suggested_value = None
        candidate_score = None
        score_delta = None

        if pipeline is not None and validation_data is not None:
            alternatives = _valid_alternative_values(validation_data, attribute, current_value)
            best_value = None
            best_score = None
            for alt in alternatives:
                trial_row = original_row.copy()
                trial_row[attribute] = alt
                trial_df = pd.DataFrame([trial_row])
                trial_score = float(predict_explained_output(pipeline, trial_df)[0])
                if best_score is None or trial_score > best_score:
                    best_score = trial_score
                    best_value = alt
            if best_value is not None and original_score is not None:
                if best_score > original_score:
                    suggested_value = best_value
                    candidate_score = float(best_score)
                    score_delta = float(best_score - original_score)

        if suggested_value is None:
            suggestions.append(
                RefinementSuggestion(
                    attribute=attribute,
                    current_value=current_value,
                    suggested_value="No model-improving observed alternative found.",
                    reason=(
                        f"SHAP identifies '{attribute}={current_value}' as a negative contributor with contribution {row['shap_value']:.3f}. "
                        "Among observed validation values for this controllable attribute, counterfactual rescoring did not produce a model-improving alternative."
                    ),
                    shap_value=float(row["shap_value"]),
                    original_score=original_score,
                    candidate_score=None,
                    score_delta=None,
                )
            )
        else:
            suggestions.append(
                RefinementSuggestion(
                    attribute=attribute,
                    current_value=current_value,
                    suggested_value=suggested_value,
                    reason=(
                        f"SHAP identifies '{attribute}={current_value}' as a negative contributor with contribution {row['shap_value']:.3f}. "
                        f"Among observed validation values for this controllable attribute, counterfactual rescoring produced the highest model-aligned predicted score for '{attribute}={suggested_value}'."
                    ),
                    shap_value=float(row["shap_value"]),
                    original_score=original_score,
                    candidate_score=candidate_score,
                    score_delta=score_delta,
                )
            )

    return suggestions


def apply_refinement(row: pd.Series, suggestions: list, mutable_attributes: Optional[set] = None) -> pd.Series:
    refined = row.copy()
    mutable = DEFAULT_MUTABLE_ATTRIBUTES if mutable_attributes is None else set(mutable_attributes)
    for suggestion in suggestions:
        if suggestion.attribute not in refined.index:
            continue
        if suggestion.attribute not in mutable:
            continue
        if suggestion.suggested_value.startswith("No model-improving"):
            continue
        refined[suggestion.attribute] = suggestion.suggested_value
    return refined


def suggestions_to_prompt_hints(suggestions: list) -> list:
    hints = []
    for suggestion in suggestions:
        if suggestion.suggested_value.startswith("No model-improving"):
            hints.append(f"reconsider the {suggestion.attribute}")
        else:
            hints.append(
                f"use {suggestion.suggested_value} instead of {suggestion.current_value} for the {suggestion.attribute}"
            )
    return hints
