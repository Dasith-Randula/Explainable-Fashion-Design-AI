from typing import Any

from pydantic import BaseModel, Field


class PreferenceCandidate(BaseModel):
    candidate_id: str | None = None
    features: dict[str, Any] = Field(..., description="Preference inference feature payload for one candidate")


class PreferencePredictionRequest(BaseModel):
    features: dict[str, Any] = Field(..., description="Preference inference feature payload")


class PreferenceRankingRequest(BaseModel):
    candidates: list[PreferenceCandidate] = Field(..., description="List of preference candidates to rank")
    top_k: int = Field(default=12, ge=1, le=20, description="Number of ranked candidates to return")


class PreferencePredictionResponse(BaseModel):
    status: str
    preference_score: float
    model: str
    input_features: dict[str, Any]


class PreferenceRankingResponse(BaseModel):
    status: str
    top_k: int
    ranked_candidates: list[dict[str, Any]]


class PreferenceSchemaResponse(BaseModel):
    status: str
    model_available: bool
    model_name: str
    required_features: list[str]
    categorical_features: list[str]
    numerical_features: list[str]
    ranking_metric: str | None = None
