from typing import Any

from fastapi import APIRouter, HTTPException, status

from backend.schemas.demand import DemandPredictionRequest, DemandPredictionResponse
from backend.services.demand_service import DemandService

router = APIRouter(prefix="/api", tags=["demand"])
service = DemandService()


@router.get("/demand/schema", summary="Return the real demand inference contract")
def get_demand_schema() -> dict[str, Any]:
    return service.get_schema()


@router.post(
    "/demand/predict",
    response_model=DemandPredictionResponse,
    summary="Predict demand using the saved trained demand model",
    status_code=status.HTTP_200_OK,
)
def predict_demand(payload: DemandPredictionRequest) -> dict[str, Any]:
    try:
        return service.predict(payload.features)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unexpected demand inference failure: {exc}") from exc
