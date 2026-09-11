from typing import Any

from fastapi import APIRouter

from backend.services.model_registry import get_model_registry

router = APIRouter(prefix="/api", tags=["models"])


@router.get("/models/status", summary="Return discovered model artifact availability")
def get_models_status() -> dict[str, Any]:
    registry = get_model_registry()
    return registry.status_payload()
