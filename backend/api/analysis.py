from __future__ import annotations

from typing import Any

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from backend.services.analysis_service import AnalysisService, parse_json_payload

router = APIRouter(prefix="/api", tags=["analysis"])
service = AnalysisService()


@router.get("/analysis/info", summary="Return unified analysis component availability")
def get_analysis_info() -> dict[str, Any]:
    try:
        return service.get_info()
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unexpected analysis info failure: {exc}") from exc


@router.post(
    "/analysis/analyze",
    summary="Run visual, demand, preference, explainability, and refinement analysis in one request",
    status_code=status.HTTP_200_OK,
)
async def analyze(
    image: UploadFile = File(..., description="Image to analyze"),
    top_k: int = Form(5),
    demand_features: str | None = Form(None),
    preference_features: str | None = Form(None),
) -> dict[str, Any]:
    try:
        parsed_demand = parse_json_payload(demand_features, "demand_features")
        parsed_preference = parse_json_payload(preference_features, "preference_features")
        return service.analyze(
            image=image,
            top_k=top_k,
            demand_features=parsed_demand,
            preference_features=parsed_preference,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unexpected analysis failure: {exc}") from exc
