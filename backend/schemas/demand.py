from typing import Any

from pydantic import BaseModel, Field


class DemandPredictionRequest(BaseModel):
    features: dict[str, Any] = Field(..., description="Demand inference feature payload")


class DemandPredictionResponse(BaseModel):
    status: str
    prediction: float
    model: str
    input_features: dict[str, Any]
