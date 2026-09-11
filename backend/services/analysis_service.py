from __future__ import annotations

import json
from typing import Any

from fastapi import HTTPException, UploadFile

from backend.services.demand_service import DemandService
from backend.services.explainability_service import ExplainabilityService
from backend.services.model_registry import get_model_registry
from backend.services.preference_service import PreferenceService
from backend.services.refinement_service import RefinementService
from backend.services.visual_service import VisualService


class AnalysisService:
    def __init__(self) -> None:
        self._visual_service = VisualService()
        self._demand_service = DemandService()
        self._preference_service = PreferenceService()
        self._explainability_service = ExplainabilityService()
        self._refinement_service = RefinementService()
        self._registry = get_model_registry()

    def get_info(self) -> dict[str, Any]:
        if not self._registry.is_initialized():
            self._registry.initialize()

        components = self._registry.status_payload()["components"]
        generation = components.get("generation", {})

        return {
            "status": "ok",
            "components": {
                "visual": bool(components.get("visual_classifier", {}).get("available", False)),
                "demand": bool(components.get("demand", {}).get("available", False)),
                "preference": bool(components.get("preference", {}).get("available", False)),
                "explainability": bool(components.get("explainability", {}).get("available", False)),
                "refinement": bool(components.get("explainability", {}).get("available", False)),
                "generation": bool(generation.get("available", False)),
            },
            "generation_reason": generation.get("reason"),
        }

    def analyze(
        self,
        image: UploadFile,
        top_k: int,
        demand_features: dict[str, Any] | None,
        preference_features: dict[str, Any] | None,
    ) -> dict[str, Any]:
        visual_payload = self._run_visual(image=image, top_k=top_k)

        demand_payload = self._build_unavailable_component(
            component_name="demand",
            reason="Demand features were not supplied",
            available=False,
        )
        preference_payload = self._build_unavailable_component(
            component_name="preference",
            reason="Preference features were not supplied",
            available=False,
        )
        explainability_payload = self._build_unavailable_component(
            component_name="explainability",
            reason="Demand features were not supplied",
            available=False,
        )
        refinement_payload = self._build_unavailable_component(
            component_name="refinement",
            reason="Demand features were not supplied",
            available=False,
        )

        if demand_features is not None:
            demand_payload = self._run_demand(demand_features)
            explainability_payload = self._run_explainability(demand_features)
            refinement_payload = self._run_refinement(demand_features)

        if preference_features is not None:
            preference_payload = self._run_preference(preference_features)

        generation_payload = self._build_generation_status()

        return {
            "status": "ok",
            "visual": visual_payload,
            "demand": demand_payload,
            "preference": preference_payload,
            "explainability": explainability_payload,
            "refinement": refinement_payload,
            "generation": generation_payload,
        }

    def _run_visual(self, image: UploadFile, top_k: int) -> dict[str, Any]:
        try:
            result = self._visual_service.analyze_image(image=image, top_k=top_k)
            return {
                "available": True,
                "classifier": result.get("classifier", {}),
                "clip": result.get("clip", {}),
            }
        except HTTPException as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Visual analysis failed: {exc}") from exc

    def _run_demand(self, demand_features: dict[str, Any]) -> dict[str, Any]:
        try:
            result = self._demand_service.predict(demand_features)
            return {
                "available": True,
                "prediction": result.get("prediction"),
                "model": result.get("model"),
            }
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Demand analysis failed: {exc}") from exc

    def _run_explainability(self, demand_features: dict[str, Any]) -> dict[str, Any]:
        try:
            result = self._explainability_service.explain(demand_features)
            return {
                "available": True,
                "prediction": result.get("prediction"),
                "base_value": result.get("base_value"),
                "reconstructed_prediction": result.get("reconstructed_prediction"),
                "reconstruction_difference": result.get("reconstruction_difference"),
                "consistent": result.get("consistent"),
                "top_positive_factors": result.get("top_positive_factors", []),
                "top_negative_factors": result.get("top_negative_factors", []),
                "all_contributions": result.get("all_contributions", []),
            }
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Explainability analysis failed: {exc}") from exc

    def _run_refinement(self, demand_features: dict[str, Any]) -> dict[str, Any]:
        try:
            result = self._refinement_service.refine(demand_features)
            return {
                "available": True,
                "original_score": result.get("original_score"),
                "refined_score": result.get("refined_score"),
                "score_difference": result.get("score_difference"),
                "improved": result.get("improved"),
                "changes": result.get("changes", []),
                "suggestions": result.get("suggestions", []),
                "refined_features": result.get("refined_features", {}),
            }
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Refinement analysis failed: {exc}") from exc

    def _run_preference(self, preference_features: dict[str, Any]) -> dict[str, Any]:
        try:
            result = self._preference_service.predict(preference_features)
            return {
                "available": True,
                "preference_score": result.get("preference_score"),
                "model": result.get("model"),
            }
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Preference analysis failed: {exc}") from exc

    def _build_unavailable_component(self, component_name: str, reason: str, available: bool = False) -> dict[str, Any]:
        return {
            "available": available,
            "reason": reason,
            "component": component_name,
        }

    def _build_generation_status(self) -> dict[str, Any]:
        if not self._registry.is_initialized():
            self._registry.initialize()

        components = self._registry.status_payload()["components"]
        generation = components.get("generation", {})

        if generation.get("available", False):
            return {
                "available": True,
                "reason": generation.get("reason"),
                "artifact": generation.get("artifact"),
            }

        return {
            "available": False,
            "reason": "No trained production LoRA artifact available",
            "artifact": generation.get("artifact"),
        }


def parse_json_payload(payload: str | None, field_name: str) -> dict[str, Any] | None:
    if payload is None or payload == "":
        return None

    try:
        data = json.loads(payload)
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid JSON for {field_name}: must be a JSON object ({exc})",
        ) from exc

    if not isinstance(data, dict):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid JSON for {field_name}: must be a JSON object",
        )

    return data
