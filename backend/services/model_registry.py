from __future__ import annotations

import csv
import json
from threading import Lock
from typing import Any

import joblib
import numpy as np
import torch
from torchvision.models import ResNet50_Weights, resnet50
from transformers import CLIPModel, CLIPProcessor

from backend.config import (
    CLIP_EMBEDDINGS_PATH,
    CLIP_METADATA_PATH,
    DEMAND_CONFIG_PATH,
    DEMAND_MODEL_PATH,
    EXPLAINABILITY_DIR,
    GENERATION_MODEL_DIR,
    PREFERENCE_CONFIG_PATH,
    PREFERENCE_MODEL_PATH,
    VISUAL_CONFIG_PATH,
    VISUAL_LABEL_MAPPING_PATH,
    VISUAL_MODEL_PATH,
)


class ModelRegistry:
    def __init__(self) -> None:
        self._lock = Lock()
        self._initialized = False
        self._loaded: dict[str, Any] = {}
        self._status: dict[str, Any] = {}
        self._device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    def initialize(self) -> None:
        with self._lock:
            if self._initialized:
                return

            self._loaded = {}
            self._status = {
                "demand": {
                    "available": False,
                    "artifact": DEMAND_MODEL_PATH.name,
                },
                "preference": {
                    "available": False,
                    "artifact": PREFERENCE_MODEL_PATH.name,
                },
                "visual_classifier": {
                    "available": False,
                    "artifact": VISUAL_MODEL_PATH.name,
                },
                "clip_embeddings": {
                    "available": False,
                    "artifact": CLIP_EMBEDDINGS_PATH.name,
                },
                "explainability": {"available": False, "modules": []},
                "generation": {
                    "available": False,
                    "reason": "No trained production LoRA artifact available",
                },
            }

            self._load_demand()
            self._load_preference()
            self._load_visual()
            self._load_clip()
            self._detect_explainability()
            self._detect_generation()
            self._initialized = True
            self._print_summary()

    def is_initialized(self) -> bool:
        return self._initialized

    def status_payload(self) -> dict[str, Any]:
        if not self._initialized:
            self.initialize()

        return {
            "status": "ok",
            "components": self._status,
        }

    def _load_demand(self) -> None:
        model_path = DEMAND_MODEL_PATH
        config_path = DEMAND_CONFIG_PATH

        if not model_path.exists():
            self._status["demand"]["reason"] = "Demand model artifact is missing"
            return

        if not config_path.exists():
            self._status["demand"]["reason"] = "Demand config artifact is missing"
            return

        try:
            self._loaded["demand_model"] = joblib.load(model_path)
            self._loaded["demand_config"] = self._read_json(config_path)
            self._status["demand"]["available"] = True
        except Exception as exc:
            self._status["demand"]["available"] = False
            self._status["demand"]["reason"] = f"Demand model failed to load: {exc}"

    def _load_preference(self) -> None:
        model_path = PREFERENCE_MODEL_PATH
        config_path = PREFERENCE_CONFIG_PATH

        if not model_path.exists():
            self._status["preference"]["reason"] = "Preference model artifact is missing"
            return

        if not config_path.exists():
            self._status["preference"]["reason"] = "Preference config artifact is missing"
            return

        try:
            # The production preference artifact uses the legacy *_dev filename, but the
            # matching config confirms it is the full-validation fitted model, not a dev subset.
            self._loaded["preference_model"] = joblib.load(model_path)
            self._loaded["preference_config"] = self._read_json(config_path)
            model = self._loaded["preference_model"]
            self._status["preference"]["available"] = hasattr(model, "predict_proba")
            self._status["preference"]["model_type"] = getattr(model, "__class__", type(model)).__name__
            if not self._status["preference"]["available"]:
                self._status["preference"]["reason"] = (
                    "Preference model artifact does not expose predict_proba(); no trained production preference model is available"
                )
            else:
                self._status["preference"]["reason"] = "Preference model loaded successfully"
        except Exception as exc:
            self._status["preference"]["available"] = False
            self._status["preference"]["reason"] = f"Preference model failed to load: {exc}"

    def _load_visual(self) -> None:
        checkpoint_path = VISUAL_MODEL_PATH
        config_path = VISUAL_CONFIG_PATH

        if not checkpoint_path.exists():
            self._status["visual_classifier"]["reason"] = "Visual classifier checkpoint is missing"
            return

        if not config_path.exists():
            self._status["visual_classifier"]["reason"] = "Visual classifier config is missing"
            return

        try:
            self._loaded["visual_config"] = self._read_json(config_path)
            self._loaded["visual_label_mapping"] = self._read_json(VISUAL_LABEL_MAPPING_PATH)
            self._status["visual_classifier"]["available"] = True
        except Exception as exc:
            self._status["visual_classifier"]["available"] = False
            self._status["visual_classifier"]["reason"] = f"Visual config failed to load: {exc}"

    def _load_clip(self) -> None:
        embeddings_path = CLIP_EMBEDDINGS_PATH
        metadata_path = CLIP_METADATA_PATH

        if not embeddings_path.exists() or not metadata_path.exists():
            self._status["clip_embeddings"]["reason"] = "CLIP embeddings or metadata artifact is missing"
            return

        try:
            embeddings = np.load(embeddings_path, mmap_mode="r")
            metadata_rows = 0
            with metadata_path.open("r", encoding="utf-8", newline="") as handle:
                reader = csv.reader(handle)
                next(reader, None)
                for _ in reader:
                    metadata_rows += 1

            rows = int(embeddings.shape[0]) if hasattr(embeddings, "shape") else 0
            dimensions = int(embeddings.shape[1]) if len(embeddings.shape) > 1 else 0

            self._loaded["clip_embeddings"] = embeddings
            self._status["clip_embeddings"]["available"] = rows > 0 and rows == metadata_rows
            self._status["clip_embeddings"]["rows"] = rows
            self._status["clip_embeddings"]["dimensions"] = dimensions
            self._loaded["clip_metadata"] = metadata_path

            if rows != metadata_rows:
                self._status["clip_embeddings"]["reason"] = (
                    f"CLIP embedding row count ({rows}) does not match metadata row count ({metadata_rows})"
                )
        except Exception as exc:
            self._status["clip_embeddings"]["available"] = False
            self._status["clip_embeddings"]["reason"] = f"CLIP artifacts failed to load: {exc}"

    def load_visual_runtime(self) -> dict[str, Any]:
        if not self._initialized:
            self.initialize()

        if self._loaded.get("visual_runtime") is not None:
            return self._loaded["visual_runtime"]

        if not self._status.get("visual_classifier", {}).get("available"):
            raise RuntimeError("Visual classifier artifacts are unavailable")

        if not self._status.get("clip_embeddings", {}).get("available"):
            raise RuntimeError("CLIP embeddings are unavailable")

        device = self._device

        try:
            visual_runtime = {
                "device": device,
                "clip_processor": CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32"),
                "clip_model": CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device),
                "clip_model_name": "openai/clip-vit-base-patch32",
            }
            visual_runtime["clip_model"].eval()

            classifier = resnet50(weights=ResNet50_Weights.DEFAULT)
            classifier.fc = torch.nn.Linear(classifier.fc.in_features, int(self._loaded["visual_config"]["num_classes"]))
            checkpoint = torch.load(VISUAL_MODEL_PATH, map_location=device)
            classifier.load_state_dict(checkpoint["model_state_dict"])
            classifier.to(device)
            classifier.eval()

            visual_runtime["classifier"] = classifier
            visual_runtime["classifier_checkpoint"] = VISUAL_MODEL_PATH.name
            visual_runtime["label_mapping"] = self._loaded["visual_label_mapping"]
            visual_runtime["image_size"] = 224
            visual_runtime["preprocess"] = ResNet50_Weights.DEFAULT.transforms()
            self._loaded["visual_runtime"] = visual_runtime
            return visual_runtime
        except Exception as exc:
            raise RuntimeError(f"Failed to initialize visual runtime: {exc}") from exc

    def _detect_explainability(self) -> None:
        expected_modules = [
            "closed_loop.py",
            "refinement.py",
            "shap_explainer.py",
            "similar_products.py",
        ]
        available_modules = [
            module
            for module in expected_modules
            if (EXPLAINABILITY_DIR / module).exists()
        ]

        self._status["explainability"] = {
            "available": len(available_modules) == len(expected_modules),
            "modules": available_modules,
        }

        if len(available_modules) != len(expected_modules):
            self._status["explainability"]["reason"] = (
                "One or more explainability modules are missing from src/explainability"
            )

    def _detect_generation(self) -> None:
        production_artifacts = []
        for candidate in GENERATION_MODEL_DIR.iterdir():
            if candidate.is_file() and candidate.suffix.lower() in {".joblib", ".pkl", ".bin", ".pt", ".safetensors", ".ckpt"}:
                production_artifacts.append(candidate.name)

        self._status["generation"] = {
            "available": len(production_artifacts) > 0,
            "artifact": production_artifacts[0] if production_artifacts else None,
            "reason": (
                "No trained production LoRA artifact available"
                if not production_artifacts
                else "Production generation artifact detected"
            ),
        }

    def _read_json(self, path: Any) -> dict[str, Any]:
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)

    def _print_summary(self) -> None:
        print("Model registry")
        print("--------------")
        print(f"Demand: {'available' if self._status['demand']['available'] else 'unavailable'}")
        print(f"Preference: {'available' if self._status['preference']['available'] else 'unavailable'}")
        print(f"Visual classifier: {'available' if self._status['visual_classifier']['available'] else 'unavailable'}")
        print(f"CLIP embeddings: {'available' if self._status['clip_embeddings']['available'] else 'unavailable'}")
        print(f"Explainability: {'available' if self._status['explainability']['available'] else 'unavailable'}")
        print(f"Generation: {'available' if self._status['generation']['available'] else 'unavailable'}")


_registry = ModelRegistry()


def get_model_registry() -> ModelRegistry:
    return _registry


def get_demand_model() -> Any:
    registry = get_model_registry()
    if not registry.is_initialized():
        registry.initialize()
    return registry._loaded.get("demand_model")


def get_demand_config() -> dict[str, Any]:
    registry = get_model_registry()
    if not registry.is_initialized():
        registry.initialize()
    return registry._loaded.get("demand_config", {})


def get_preference_model() -> Any:
    registry = get_model_registry()
    if not registry.is_initialized():
        registry.initialize()
    model = registry._loaded.get("preference_model")
    if model is None or not hasattr(model, "predict_proba"):
        return None
    return model


def get_preference_config() -> dict[str, Any]:
    registry = get_model_registry()
    if not registry.is_initialized():
        registry.initialize()
    return registry._loaded.get("preference_config", {})
