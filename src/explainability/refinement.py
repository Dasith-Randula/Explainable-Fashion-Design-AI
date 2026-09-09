"""
Explanation-to-refinement rule engine.

Owner: Dewmi
Module: CCS4310 - Deep Learning
Project: Explainable-Fashion-Design-AI

Converts a SHAP :class:`~src.explainability.shap_explainer.ExplanationResult`
for one generated design into concrete, structured refinement suggestions
(e.g. "the 'colour' attribute is hurting the score; try 'black' instead of
'orange'"), and applies the chosen suggestion to produce a refined feature
row that can be re-scored by the same model.

This is a *rule-based* refinement layer, matching the "Prompt rules +
score-guided search" entry in the project's model table (Section 08 of the
project document). It intentionally does not call the generative model
directly - it only decides *what should change*; turning that into an
updated text prompt for the diffusion model (Maleesha's component) is a
simple string-formatting step done by the caller.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

import pandas as pd

from .shap_explainer import ExplanationResult, global_feature_importance


# One-hot encoded feature names produced by this project's ColumnTransformer
# pipelines look like "cat__<original_column>_<category_value>". This prefix
# is used everywhere (demand and preference notebooks alike).
CATEGORICAL_PREFIX = "cat__"
NUMERICAL_PREFIX = "num__"


@dataclass
class RefinementSuggestion:
    """One actionable change: 'set <attribute> to <new_value>'."""

    attribute: str
    current_value: Optional[str]
    suggested_value: str
    reason: str
    shap_value: float


def _owning_attribute(feature_name: str, categorical_features: list) -> Optional[str]:
    """Resolve which categorical attribute a one-hot feature name belongs to.

    Some attribute names are prefixes of others in this project's schema
    (e.g. ``season`` and ``season_from_time``), so ``cat__season_from_time_
    spring`` also starts with ``cat__season_``. A plain ``str.startswith``
    check would therefore wrongly attribute that column to ``season``.
    This picks the *longest* matching attribute name among
    ``categorical_features``, which resolves the ambiguity correctly since
    a genuine one-hot name is always ``cat__<attribute>_<value>`` for
    exactly one attribute in the known list.
    """
    if not feature_name.startswith(CATEGORICAL_PREFIX):
        return None
    remainder = feature_name[len(CATEGORICAL_PREFIX):]
    candidates = [a for a in categorical_features if remainder.startswith(f"{a}_")]
    if not candidates:
        return None
    return max(candidates, key=len)


def generate_refinement_suggestions(
    explanation: ExplanationResult,
    categorical_features: list,
    importance_table: Optional[pd.DataFrame] = None,
    top_n_weak_factors: int = 3,
) -> list:
    """Turn the weakest attributes of one design into refinement suggestions.

    ``categorical_features`` must be the *original* column names (e.g.
    ``['season', 'category', 'color', 'fabric']``), not one-hot names. This
    is used to look up, for this specific design, the SHAP contribution of
    the value it actually has for each attribute (see
    :meth:`ExplanationResult.attribute_contributions`) - not just whichever
    one-hot dummy happens to carry the largest negative SHAP value, which
    can belong to a category the design does not even have.

    For each of the ``top_n_weak_factors`` worst (most negative) attributes,
    this looks for a *different* value of the same attribute that
    historically has the strongest positive average SHAP contribution (from
    ``importance_table``, typically produced by
    :func:`src.explainability.shap_explainer.global_feature_importance` on a
    representative sample) and suggests switching to it.

    If ``importance_table`` is not supplied, or no alternative value is on
    record, the suggestion falls back to "this attribute is hurting the
    score; consider changing it" without naming a specific replacement.
    """
    weak = explanation.attribute_contributions(categorical_features)
    weak = weak[weak.shap_value < 0].head(top_n_weak_factors)
    suggestions: list[RefinementSuggestion] = []

    for _, row in weak.iterrows():
        attribute, current_value = row["attribute"], row["current_value"]
        current_feature_name = f"{CATEGORICAL_PREFIX}{attribute}_{current_value}"

        suggested_value = None
        if importance_table is not None:
            attribute_prefix = f"{CATEGORICAL_PREFIX}{attribute}_"
            same_attribute = [
                idx for idx in importance_table.index
                if idx != current_feature_name
                and _owning_attribute(idx, categorical_features) == attribute
            ]
            if same_attribute:
                best = importance_table.loc[same_attribute].sort_values(
                    importance_table.columns[0], ascending=False
                ).index[0]
                # Slice using the known attribute name's length rather than
                # guessing where the attribute ends and the value begins:
                # attribute names such as 'season_from_time' or 'shop_label'
                # contain underscores themselves, so a naive first-underscore
                # split would misparse the value (e.g. 'from_time_winter'
                # instead of 'winter').
                suggested_value = best[len(attribute_prefix):]

        if suggested_value is None:
            suggestions.append(
                RefinementSuggestion(
                    attribute=attribute,
                    current_value=current_value,
                    suggested_value="(no alternative on record; try a visually distinct option)",
                    reason=(
                        f"'{attribute}={current_value}' contributes "
                        f"{row['shap_value']:.3f} to the predicted score "
                        "(negative = hurting demand)."
                    ),
                    shap_value=float(row["shap_value"]),
                )
            )
        else:
            suggestions.append(
                RefinementSuggestion(
                    attribute=attribute,
                    current_value=current_value,
                    suggested_value=suggested_value,
                    reason=(
                        f"'{attribute}={current_value}' contributes "
                        f"{row['shap_value']:.3f} to the predicted score; "
                        f"'{attribute}={suggested_value}' has the strongest "
                        "average positive SHAP contribution for this attribute."
                    ),
                    shap_value=float(row["shap_value"]),
                )
            )
    return suggestions


def apply_refinement(row: pd.Series, suggestions: list) -> pd.Series:
    """Return a copy of ``row`` with each suggested attribute value applied.

    Only suggestions with a concrete ``suggested_value`` (not the
    "no alternative on record" placeholder) are applied.
    """
    refined = row.copy()
    for suggestion in suggestions:
        if suggestion.attribute not in refined.index:
            continue
        if suggestion.suggested_value.startswith("(no alternative"):
            continue
        refined[suggestion.attribute] = suggestion.suggested_value
    return refined


def suggestions_to_prompt_hints(suggestions: list) -> list:
    """Convert refinement suggestions into short natural-language hints
    that can be appended to a generation prompt for Maleesha's diffusion
    model, e.g. "use black instead of orange for the colour".
    """
    hints = []
    for suggestion in suggestions:
        if suggestion.suggested_value.startswith("(no alternative"):
            hints.append(f"reconsider the {suggestion.attribute}")
        else:
            hints.append(
                f"use {suggestion.suggested_value} instead of "
                f"{suggestion.current_value} for the {suggestion.attribute}"
            )
    return hints
