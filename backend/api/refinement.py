from typing import Any

from fastapi import APIRouter, HTTPException, status

from backend.schemas.refinement import RefinementRequest, RefinementResponse
from backend.services.refinement_service import RefinementService

router = APIRouter(prefix="/api", tags=["refinement"])
service = RefinementService()


@router.post(
    "/refinement/refine",
    response_model=RefinementResponse,
    summary="Run Dewmi's explain -> refine -> re-score workflow for one demand feature payload",
    status_code=status.HTTP_200_OK,
)
def refine_demand(payload: RefinementRequest) -> dict[str, Any]:
    try:
        return service.refine(payload.features)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unexpected refinement failure: {exc}") from exc
