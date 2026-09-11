from typing import Any

from pydantic import BaseModel, Field


class RefinementRequest(BaseModel):
    features: dict[str, Any] = Field(..., description="Demand feature payload for refinement")


class RefinementChange(BaseModel):
    feature: str
    from_value: Any
    to_value: Any


class RefinementResponse(BaseModel):
    status: str
    original_score: float
    refined_score: float
    score_difference: float
    improved: bool
    changes: list[RefinementChange]
    suggestions: list[str]
    refined_features: dict[str, Any]
