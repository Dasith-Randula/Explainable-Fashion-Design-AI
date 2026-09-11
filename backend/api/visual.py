from typing import Any

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from backend.schemas.visual import VisualAnalysisResponse, VisualInfoResponse
from backend.services.visual_service import VisualService

router = APIRouter(prefix="/api", tags=["visual"])
service = VisualService()


@router.get("/visual/info", response_model=VisualInfoResponse, summary="Return visual artifact availability and runtime info")
def get_visual_info() -> dict[str, Any]:
    return service.get_info()


@router.post(
    "/visual/analyze",
    response_model=VisualAnalysisResponse,
    summary="Classify an image and find similar DeepFashion items using CLIP embeddings",
    status_code=status.HTTP_200_OK,
)
async def analyze_visual(
    image: UploadFile = File(...),
    top_k: int = 5,
) -> dict[str, Any]:
    try:
        return service.analyze_image(image=image, top_k=top_k)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unexpected visual analysis failure: {exc}") from exc
