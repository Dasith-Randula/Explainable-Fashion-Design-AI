from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.demand import router as demand_router
from backend.api.health import router as health_router
from backend.api.models import router as models_router
from backend.api.preference import router as preference_router
from backend.api.visual import router as visual_router
from backend.services.model_registry import get_model_registry

APP_TITLE = "Explainable Fashion Design AI API"
APP_VERSION = "1.0.0"


@asynccontextmanager
async def lifespan(_: FastAPI):
    registry = get_model_registry()
    registry.initialize()
    yield


app = FastAPI(title=APP_TITLE, version=APP_VERSION, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(models_router)
app.include_router(demand_router)
app.include_router(preference_router)
app.include_router(visual_router)


@app.get("/", tags=["root"])
def read_root() -> dict[str, str]:
    return {"message": "Explainable Fashion Design AI API is running."}
