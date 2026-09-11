from __future__ import annotations

from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from fastapi import HTTPException

from backend.config import DATA_DIR
from backend.services.model_registry import get_preference_config, get_preference_model


class PreferenceService:
    def __init__(self) -> None:
        self._model: Any = None
        self._config: dict[str, Any] = {}

    def _load_runtime_config(self) -> None:
        config = get_preference_config()
        if not config:
            raise HTTPException(status_code=503, detail="Preference config unavailable")

        self._config = config
        self._model = get_preference_model()

    def _load_runtime_state(self) -> None:
        self._load_runtime_config()

        if self._model is None:
            raise HTTPException(status_code=503, detail="Preference model unavailable")

    def get_schema(self) -> dict[str, Any]:
        self._load_runtime_config()

        feature_columns = list(self._config.get("feature_columns", []))
        categorical_features = [
            column for column in self._config.get("categorical_features", []) if column in feature_columns
        ]
        numerical_features = [
            column for column in self._config.get("numerical_features", []) if column in feature_columns
        ]

        return {
            "status": "ok",
            "model_available": self._model is not None,
            "model_name": self._config.get("selected_model", "Unknown"),
            "required_features": feature_columns,
            "categorical_features": categorical_features,
            "numerical_features": numerical_features,
            "ranking_metric": self._config.get("selection_metric"),
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
                detail=f"Unexpected feature(s) not supported by the trained preference model: {', '.join(sorted(unexpected))}",
            )

        frame = self._build_frame(features, feature_columns)
        scores = self._score_frame(frame)
        preference_score = self._extract_positive_probability(scores)

        return {
            "status": "ok",
            "preference_score": float(preference_score),
            "model": self._config.get("selected_model", "Unknown"),
            "input_features": dict(features),
        }

    def rank(self, candidates: list[dict[str, Any]], top_k: int) -> dict[str, Any]:
        if not candidates:
            raise HTTPException(status_code=422, detail="Candidate list cannot be empty")

        if top_k < 1 or top_k > 20:
            raise HTTPException(status_code=422, detail="top_k must be between 1 and 20")

        self._load_runtime_state()

        feature_columns = list(self._config.get("feature_columns", []))
        rows: list[dict[str, Any]] = []
        candidate_ids: list[str | None] = []

        for index, candidate in enumerate(candidates):
            if not isinstance(candidate, dict):
                raise HTTPException(status_code=400, detail=f"Invalid candidate payload at index {index}")

            candidate_id = candidate.get("candidate_id")
            features = candidate.get("features")
            if not isinstance(features, dict):
                raise HTTPException(
                    status_code=400,
                    detail=f"Candidate at index {index} must include a valid 'features' object",
                )

            missing = [column for column in feature_columns if column not in features]
            if missing:
                raise HTTPException(
                    status_code=422,
                    detail=f"Candidate at index {index} is missing required feature(s): {', '.join(missing)}",
                )

            unexpected = set(features) - set(feature_columns)
            if unexpected:
                raise HTTPException(
                    status_code=400,
                    detail=f"Candidate at index {index} contains unsupported feature(s): {', '.join(sorted(unexpected))}",
                )

            rows.append({column: features[column] for column in feature_columns})
            candidate_ids.append(candidate_id)

        frame = pd.DataFrame(rows, columns=feature_columns)
        probabilities = self._score_frame(frame)
        positive_scores = np.asarray(probabilities)[:, 1]

        ranked_entries = sorted(
            zip(candidate_ids, positive_scores.tolist()),
            key=lambda item: (-float(item[1]), str(item[0] or "")),
        )

        ranked: list[dict[str, Any]] = []
        for rank, (candidate_id, score) in enumerate(ranked_entries, start=1):
            ranked.append(
                {
                    "rank": rank,
                    "candidate_id": candidate_id,
                    "preference_score": float(score),
                }
            )

        return {
            "status": "ok",
            "top_k": top_k,
            "ranked_candidates": ranked[:top_k],
        }

    def get_example(self) -> dict[str, Any]:
        config = get_preference_config()
        if not config:
            raise HTTPException(status_code=503, detail="Preference config unavailable")

        feature_columns = list(config.get("feature_columns", []))
        train_path = Path(DATA_DIR) / "interim" / "hm_preference_train.csv"

        if not train_path.exists():
            raise HTTPException(status_code=503, detail="H&M preference training artifact is unavailable")

        try:
            chunks = pd.read_csv(train_path, usecols=feature_columns, chunksize=100000)
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Failed to load H&M preference example data: {exc}") from exc

        for chunk in chunks:
            complete_rows = chunk.dropna(subset=feature_columns)
            if complete_rows.empty:
                continue

            row = complete_rows.iloc[0].to_dict()
            normalized = {key: self._normalize_value(value) for key, value in row.items()}
            return {
                "status": "ok",
                "example_features": normalized,
            }

        raise HTTPException(status_code=404, detail="No complete preference example row was found in the available H&M preference training data")

    def _build_frame(self, features: dict[str, Any], feature_columns: list[str]) -> pd.DataFrame:
        row = {column: features[column] for column in feature_columns}
        try:
            return pd.DataFrame([row], columns=feature_columns)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Invalid feature payload: {exc}") from exc

    def _score_frame(self, frame: pd.DataFrame) -> np.ndarray:
        try:
            probabilities = self._model.predict_proba(frame)
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Preference inference failed: {exc}") from exc

        if probabilities is None or len(probabilities) == 0:
            raise HTTPException(status_code=500, detail="Preference model returned no scores")

        return np.asarray(probabilities)

    def _normalize_value(self, value: Any) -> Any:
        if hasattr(value, "item"):
            return value.item()
        if isinstance(value, (np.ndarray,)):
            return value.tolist()
        return value

    def _extract_positive_probability(self, probabilities: np.ndarray) -> float:
        array = np.asarray(probabilities)
        if array.ndim == 1:
            if array.size < 2:
                raise HTTPException(status_code=500, detail="Preference model returned an invalid probability vector")
            return float(array[1])

        if array.ndim == 2 and array.shape[1] >= 2:
            return float(array[0, 1])

        raise HTTPException(status_code=500, detail="Preference model returned an invalid probability matrix")
