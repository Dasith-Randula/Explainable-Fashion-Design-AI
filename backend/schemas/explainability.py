from typing import Any

from pydantic import BaseModel, Field


class ExplainabilityRequest(BaseModel):
    features: dict[str, Any] = Field(..., description="Demand feature payload for local SHAP explanation")


class FeatureContribution(BaseModel):
    feature: str
    value: Any
    shap_value: float
    direction: str


class ExplainabilityResponse(BaseModel):
    status: str
    prediction: float
    base_value: float | None = None
    reconstructed_prediction: float | None = None
    reconstruction_difference: float | None = None
    consistent: bool | None = None
    top_positive_factors: list[dict[str, Any]] = []
    top_negative_factors: list[dict[str, Any]] = []
    all_contributions: list[FeatureContribution] = []


class ExplainabilityInfoResponse(BaseModel):
    status: str
    explainability_available: bool
    demand_model_available: bool
    shap_method: str
    mutable_design_attributes: list[str]
    reconstruction_consistency_supported: bool
