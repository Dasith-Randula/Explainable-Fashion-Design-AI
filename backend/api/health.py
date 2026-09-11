from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health", summary="Health check")
def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "Explainable Fashion Design AI API",
        "version": "1.0.0",
    }
