from typing import Any

from fastapi import APIRouter, HTTPException, status

from backend.schemas.preference import (
    PreferencePredictionRequest,
    PreferencePredictionResponse,
    PreferenceRankingRequest,
    PreferenceRankingResponse,
    PreferenceSchemaResponse,
)
from backend.services.preference_service import PreferenceService

router = APIRouter(prefix="/api", tags=["preference"])
service = PreferenceService()


@router.get("/preference/schema", response_model=PreferenceSchemaResponse, summary="Return the real preference inference contract")
def get_preference_schema() -> dict[str, Any]:
    return service.get_schema()


@router.get("/preference/example", summary="Return one safe real H&M preference example row for manual Swagger testing")
def get_preference_example() -> dict[str, Any]:
    try:
        return service.get_example()
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unexpected preference example failure: {exc}") from exc


@router.post(
    "/preference/predict",
    response_model=PreferencePredictionResponse,
    summary="Score one user/item preference candidate using the trained preference model",
    status_code=status.HTTP_200_OK,
)
def predict_preference(payload: PreferencePredictionRequest) -> dict[str, Any]:
    try:
        return service.predict(payload.features)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unexpected preference inference failure: {exc}") from exc


@router.post(
    "/preference/rank",
    response_model=PreferenceRankingResponse,
    summary="Score and rank multiple preference candidates using the trained preference model",
    status_code=status.HTTP_200_OK,
)
def rank_preference(payload: PreferenceRankingRequest) -> dict[str, Any]:
    try:
        return service.rank([candidate.model_dump() for candidate in payload.candidates], payload.top_k)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unexpected preference ranking failure: {exc}") from exc
