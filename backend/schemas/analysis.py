from typing import Any

from pydantic import BaseModel, Field


class AnalysisVisualClassifier(BaseModel):
    label: str | None = None
    class_index: int | None = None
    confidence: float | None = None


class AnalysisVisualClip(BaseModel):
    embedding_dimension: int | None = None
    similar_items: list[dict[str, Any]] = Field(default_factory=list)


class AnalysisVisualResponse(BaseModel):
    available: bool
    classifier: AnalysisVisualClassifier | None = None
    clip: AnalysisVisualClip | None = None
    reason: str | None = None


class AnalysisDemandResponse(BaseModel):
    available: bool
    prediction: float | None = None
    model: str | None = None
    reason: str | None = None


class AnalysisPreferenceResponse(BaseModel):
    available: bool
    preference_score: float | None = None
    model: str | None = None
    reason: str | None = None


class AnalysisExplainabilityResponse(BaseModel):
    available: bool
    prediction: float | None = None
    base_value: float | None = None
    reconstructed_prediction: float | None = None
    reconstruction_difference: float | None = None
    consistent: bool | None = None
    top_positive_factors: list[dict[str, Any]] = Field(default_factory=list)
    top_negative_factors: list[dict[str, Any]] = Field(default_factory=list)
    all_contributions: list[dict[str, Any]] = Field(default_factory=list)
    reason: str | None = None


class AnalysisRefinementResponse(BaseModel):
    available: bool
    original_score: float | None = None
    refined_score: float | None = None
    score_difference: float | None = None
    improved: bool | None = None
    changes: list[dict[str, Any]] = Field(default_factory=list)
    suggestions: list[str] = Field(default_factory=list)
    refined_features: dict[str, Any] = Field(default_factory=dict)
    reason: str | None = None


class AnalysisGenerationResponse(BaseModel):
    available: bool
    reason: str | None = None
    artifact: str | None = None


class AnalysisResponse(BaseModel):
    status: str
    visual: AnalysisVisualResponse
    demand: AnalysisDemandResponse
    preference: AnalysisPreferenceResponse
    explainability: AnalysisExplainabilityResponse
    refinement: AnalysisRefinementResponse
    generation: AnalysisGenerationResponse
