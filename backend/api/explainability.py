from typing import Any

from fastapi import APIRouter, HTTPException, status

from backend.schemas.explainability import ExplainabilityInfoResponse, ExplainabilityRequest, ExplainabilityResponse
from backend.services.explainability_service import ExplainabilityService

router = APIRouter(prefix="/api", tags=["explainability"])
service = ExplainabilityService()


@router.get(
    "/explainability/info",
    response_model=ExplainabilityInfoResponse,
    summary="Return explainability availability and SHAP/refinement capabilities",
)
def get_explainability_info() -> dict[str, Any]:
    try:
        return service.get_info()
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unexpected explainability info failure: {exc}") from exc


@router.post(
    "/explainability/explain",
    response_model=ExplainabilityResponse,
    summary="Generate a local SHAP explanation for one real demand feature payload",
    status_code=status.HTTP_200_OK,
)
def explain_demand(payload: ExplainabilityRequest) -> dict[str, Any]:
    try:
        return service.explain(payload.features)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unexpected explainability failure: {exc}") from exc
