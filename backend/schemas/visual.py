from typing import Any

from pydantic import BaseModel, Field


class VisualClassificationResult(BaseModel):
    label: str
    class_index: int
    confidence: float


class SimilarProductResult(BaseModel):
    rank: int
    similarity: float
    metadata: dict[str, Any]


class VisualAnalysisResponse(BaseModel):
    status: str
    classifier: VisualClassificationResult
    clip: dict[str, Any]


class VisualInfoResponse(BaseModel):
    status: str
    visual_classifier_available: bool
    clip_available: bool
    device: str
    embedding_rows: int
    embedding_dimension: int
    supported_image_types: list[str]
    clip_model_name: str
