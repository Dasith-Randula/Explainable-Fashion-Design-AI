from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
from fastapi import HTTPException

from backend.services.model_registry import get_demand_config, get_demand_model


class DemandService:
    def __init__(self) -> None:
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

    def get_schema(self) -> dict[str, Any]:
        self._load_runtime_state()

        feature_columns = list(self._config.get("feature_columns", []))
        categorical_features = list(self._config.get("categorical_features", []))
        numerical_features = list(self._config.get("numerical_features", []))

        return {
            "status": "ok",
            "model_available": True,
            "required_features": feature_columns,
            "categorical_features": categorical_features,
            "numerical_features": numerical_features,
            "selection_metric": self._config.get("selection_metric"),
            "model_name": self._config.get("selected_model"),
        }

    def predict(self, features: dict[str, Any]) -> dict[str, Any]:
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

        supported_columns = feature_columns
        row = {column: features[column] for column in supported_columns}

        try:
            frame = pd.DataFrame([row], columns=supported_columns)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Invalid feature payload: {exc}") from exc

        try:
            result = self._model.predict(frame)
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Demand inference failed: {exc}") from exc

        if result is None or len(result) == 0:
            raise HTTPException(status_code=500, detail="Demand model returned an invalid prediction")

        prediction = np.asarray(result).reshape(-1)[0]
        if prediction is None or np.isnan(prediction):
            raise HTTPException(status_code=500, detail="Demand model returned an invalid prediction")

        return {
            "status": "ok",
            "prediction": float(prediction),
            "model": self._config.get("selected_model", "Unknown"),
            "input_features": dict(features),
        }
