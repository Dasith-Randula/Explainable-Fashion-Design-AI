from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
from fastapi import HTTPException

from backend.services.demand_service import DemandService
from backend.services.model_registry import get_demand_config, get_demand_model
from src.explainability.refinement import MUTABLE_DESIGN_ATTRIBUTES
from src.explainability.shap_explainer import (
    check_shap_prediction_consistency,
    explain_row,
    predict_explained_output,
)


class ExplainabilityService:
    def __init__(self) -> None:
        self._demand_service = DemandService()
        self._model = None
        self._config: dict[str, Any] = {}

    def _load_runtime_state(self) -> None:
        model = get_demand_model()
        config = get_demand_config()

        if model is None:
            raise HTTPException(status_code=503, detail="Demand model unavailable")

        if not config:
            raise HTTPException(status_code=503, detail="Demand config unavailable")

        self._model = model
        self._config = config

    def get_info(self) -> dict[str, Any]:
        self._load_runtime_state()

        return {
            "status": "ok",
            "explainability_available": True,
            "demand_model_available": True,
            "shap_method": "TreeExplainer via src.explainability.shap_explainer.compute_shap_values",
            "mutable_design_attributes": list(MUTABLE_DESIGN_ATTRIBUTES),
            "reconstruction_consistency_supported": True,
        }

    def explain(self, features: dict[str, Any]) -> dict[str, Any]:
        self._load_runtime_state()

        feature_columns = list(self._config.get("feature_columns", []))
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
            prediction = float(predict_explained_output(self._model, frame)[0])
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Demand prediction failed: {exc}") from exc

        try:
            explanation = explain_row(self._model, frame, row_index=0)
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"SHAP explanation failed: {exc}") from exc

        consistency = check_shap_prediction_consistency(self._model, frame, row_index=0)

        top_positive = explanation.top_contributions(n=5, direction="positive")
        top_negative = explanation.top_contributions(n=5, direction="negative")

        all_contributions = []
        for feature_name, shap_value in zip(explanation.feature_names, explanation.shap_values):
            raw_value = frame.iloc[0][feature_name] if feature_name in frame.columns else None
            all_contributions.append(
                {
                    "feature": feature_name,
                    "value": self._normalize_value(raw_value),
                    "shap_value": float(shap_value),
                    "direction": "positive" if shap_value > 0 else "negative",
                }
            )

        return {
            "status": "ok",
            "prediction": prediction,
            "base_value": float(explanation.base_value),
            "reconstructed_prediction": float(explanation.predicted_value),
            "reconstruction_difference": float(abs(prediction - explanation.predicted_value)),
            "consistent": bool(consistency.get("consistent", False)),
            "top_positive_factors": top_positive.to_dict(orient="records"),
            "top_negative_factors": top_negative.to_dict(orient="records"),
            "all_contributions": all_contributions,
        }

    def _normalize_value(self, value: Any) -> Any:
        if hasattr(value, "item"):
            return value.item()
        if isinstance(value, (np.ndarray,)):
            return value.tolist()
        return value
