from __future__ import annotations

from typing import Any

import pandas as pd
from fastapi import HTTPException

from backend.services.explainability_service import ExplainabilityService
from backend.services.model_registry import get_demand_config, get_demand_model
from src.explainability.closed_loop import run_closed_loop
from src.explainability.refinement import MUTABLE_DESIGN_ATTRIBUTES, apply_refinement, generate_refinement_suggestions


class RefinementService:
    def __init__(self) -> None:
        self._explainability_service = ExplainabilityService()

    def refine(self, features: dict[str, Any]) -> dict[str, Any]:
        self._explainability_service._load_runtime_state()
        model = get_demand_model()
        config = get_demand_config()

        if model is None:
            raise HTTPException(status_code=503, detail="Demand model unavailable")

        if not config:
            raise HTTPException(status_code=503, detail="Demand config unavailable")

        feature_columns = list(config.get("feature_columns", []))
        missing = [column for column in feature_columns if column not in features]
        if missing:
            raise HTTPException(
                status_code=422,
                detail=f"Missing required feature(s): {', '.join(missing)}",
            )

        unexpected = set(features) - set(feature_columns)
        if unexpected:
            raise HTTPException(
                status_code=400,
                detail=f"Unexpected feature(s) not supported by the trained demand model: {', '.join(sorted(unexpected))}",
            )

        frame = pd.DataFrame([{column: features[column] for column in feature_columns}], columns=feature_columns)

        try:
            result = run_closed_loop(
                pipeline=model,
                X=frame,
                categorical_features=list(config.get("categorical_features", [])),
                row_index=0,
                mutable_attributes=set(MUTABLE_DESIGN_ATTRIBUTES),
            )
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Refinement failed: {exc}") from exc

        changes = []
        for suggestion in result.suggestions:
            if suggestion.suggested_value.startswith("No model-improving"):
                continue
            changes.append(
                {
                    "feature": suggestion.attribute,
                    "from_value": suggestion.current_value,
                    "to_value": suggestion.suggested_value,
                }
            )

        refined_features = result.refined_row.to_dict()
        suggestions_text = [
            f"Use {suggestion.suggested_value} instead of {suggestion.current_value} for the {suggestion.attribute}."
            if not suggestion.suggested_value.startswith("No model-improving")
            else f"No beneficial refinement identified for {suggestion.attribute}; existing value retained."
            for suggestion in result.suggestions
        ]

        return {
            "status": "ok",
            "original_score": float(result.original_score),
            "refined_score": float(result.refined_score),
            "score_difference": float(result.score_delta),
            "improved": bool(result.improved),
            "changes": changes,
            "suggestions": suggestions_text,
            "refined_features": refined_features,
        }
