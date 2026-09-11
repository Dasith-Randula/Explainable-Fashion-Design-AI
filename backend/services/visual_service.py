from __future__ import annotations

import io
from typing import Any

import numpy as np
import pandas as pd
import torch
import torch.nn.functional as F
from fastapi import HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError

from backend.services.model_registry import get_model_registry


class VisualService:
    def __init__(self) -> None:
        self._registry = get_model_registry()

    def get_info(self) -> dict[str, Any]:
        if not self._registry.is_initialized():
            self._registry.initialize()

        status = self._registry.status_payload()
        components = status["components"]

        return {
            "status": "ok",
            "visual_classifier_available": bool(components.get("visual_classifier", {}).get("available", False)),
            "clip_available": bool(components.get("clip_embeddings", {}).get("available", False)),
            "device": str(self._registry._device),
            "embedding_rows": int(components.get("clip_embeddings", {}).get("rows", 0)),
            "embedding_dimension": int(components.get("clip_embeddings", {}).get("dimensions", 0)),
            "supported_image_types": ["jpeg", "jpg", "png", "webp"],
            "clip_model_name": "openai/clip-vit-base-patch32",
        }

    def analyze_image(self, image: UploadFile, top_k: int) -> dict[str, Any]:
        if top_k < 1 or top_k > 20:
            raise HTTPException(status_code=422, detail="top_k must be between 1 and 20")

        validated_image = self._validate_uploaded_image(image)
        runtime = self._ensure_visual_runtime()

        classifier_result = self._classify_image(validated_image, runtime)
        embedding = self._generate_clip_embedding(validated_image, runtime)
        similar_items = self._find_similar_items(embedding, top_k, runtime)

        return {
            "status": "ok",
            "classifier": classifier_result,
            "clip": {
                "embedding_dimension": int(embedding.shape[0]),
                "similar_items": similar_items,
            },
        }

    def _ensure_visual_runtime(self) -> dict[str, Any]:
        try:
            return self._registry.load_visual_runtime()
        except RuntimeError as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc

    def _validate_uploaded_image(self, image: UploadFile) -> Image.Image:
        if image.filename is None or image.filename == "":
            raise HTTPException(status_code=400, detail="Image upload is required")

        content = image.file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Uploaded image is empty")

        try:
            with Image.open(io.BytesIO(content)) as opened_image:
                opened_image.load()
                return opened_image.convert("RGB")
        except (UnidentifiedImageError, OSError, ValueError) as exc:
            raise HTTPException(status_code=400, detail="Invalid or unreadable image upload") from exc

    def _classify_image(self, image: Image.Image, runtime: dict[str, Any]) -> dict[str, Any]:
        classifier = runtime["classifier"]
        preprocess = runtime["preprocess"]
        device = runtime["device"]

        tensor = preprocess(image).unsqueeze(0).to(device)

        with torch.inference_mode():
            logits = classifier(tensor)
            probs = torch.softmax(logits, dim=1)
            predicted_index = int(torch.argmax(probs, dim=1).item())
            confidence = float(probs[0, predicted_index].item())

        label_mapping = runtime["label_mapping"]["id_to_label"]
        label = label_mapping.get(str(predicted_index), label_mapping.get(predicted_index, str(predicted_index)))

        return {
            "label": label,
            "class_index": predicted_index,
            "confidence": confidence,
        }

    def _generate_clip_embedding(self, image: Image.Image, runtime: dict[str, Any]) -> np.ndarray:
        processor = runtime["clip_processor"]
        model = runtime["clip_model"]
        device = runtime["device"]

        try:
            inputs = processor(images=image, return_tensors="pt")
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Failed to prepare image for CLIP: {exc}") from exc

        inputs = {key: value.to(device) for key, value in inputs.items()}

        with torch.inference_mode():
            image_output = model.get_image_features(**inputs)

        if hasattr(image_output, "image_embeds"):
            embeddings = image_output.image_embeds
        elif hasattr(image_output, "pooler_output"):
            embeddings = image_output.pooler_output
        else:
            embeddings = image_output

        normalized = F.normalize(embeddings, p=2, dim=-1)
        return normalized.float().cpu().numpy().reshape(-1)

    def _find_similar_items(self, embedding: np.ndarray, top_k: int, runtime: dict[str, Any]) -> list[dict[str, Any]]:
        registry = get_model_registry()
        if not registry.is_initialized():
            registry.initialize()

        stored_embeddings = registry._loaded.get("clip_embeddings")
        if stored_embeddings is None:
            raise HTTPException(status_code=503, detail="CLIP embeddings are unavailable")

        stored_dim = int(registry._status.get("clip_embeddings", {}).get("dimensions", 0))
        if stored_dim == 0:
            raise HTTPException(status_code=503, detail="CLIP embedding dimension is unavailable")

        if embedding.shape[0] != stored_dim:
            raise HTTPException(
                status_code=503,
                detail=f"CLIP embedding dimension mismatch: query={embedding.shape[0]} stored={stored_dim}",
            )

        stored_matrix = np.asarray(stored_embeddings)
        stored_norms = np.linalg.norm(stored_matrix, axis=1, keepdims=True)
        stored_norms[stored_norms == 0] = 1.0
        normalized_embeddings = stored_matrix / stored_norms

        query_norm = np.linalg.norm(embedding)
        if query_norm == 0:
            raise HTTPException(status_code=500, detail="Generated CLIP embedding is invalid")

        query_embedding = embedding / query_norm
        scores = normalized_embeddings @ query_embedding

        top_indices = np.argsort(scores)[::-1][:top_k]
        metadata_path = registry._loaded.get("clip_metadata")
        metadata = pd.read_csv(metadata_path) if metadata_path is not None else pd.DataFrame()

        results: list[dict[str, Any]] = []
        for rank, index in enumerate(top_indices, start=1):
            row = metadata.iloc[int(index)] if len(metadata) > int(index) else {}
            result: dict[str, Any] = {
                "rank": rank,
                "similarity": float(scores[int(index)]),
                "metadata": self._normalize_metadata(row),
            }
            results.append(result)

        return results

    def _normalize_metadata(self, row: Any) -> dict[str, Any]:
        if isinstance(row, dict):
            data = row
        else:
            data = row.to_dict()

        normalized: dict[str, Any] = {}
        for key, value in data.items():
            if hasattr(value, "item"):
                normalized[key] = value.item()
            else:
                normalized[key] = value
        return normalized
