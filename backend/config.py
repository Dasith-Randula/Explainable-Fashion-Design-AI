from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
MODELS_DIR = PROJECT_ROOT / "models"
DATA_DIR = PROJECT_ROOT / "data"
OUTPUTS_DIR = PROJECT_ROOT / "outputs"

DEMAND_MODEL_DIR = MODELS_DIR / "demand"
PREFERENCE_MODEL_DIR = MODELS_DIR / "preference"
VISUAL_MODEL_DIR = MODELS_DIR / "visual"
GENERATION_MODEL_DIR = MODELS_DIR / "generation"
VISUAL_FEATURES_DIR = DATA_DIR / "processed" / "visual_features"
VISUAL_LABEL_MAPPING_PATH = DATA_DIR / "interim" / "deepfashion_visual_label_mapping.json"
EXPLAINABILITY_DIR = PROJECT_ROOT / "src" / "explainability"

DEMAND_MODEL_PATH = DEMAND_MODEL_DIR / "best_demand_model.joblib"
DEMAND_CONFIG_PATH = DEMAND_MODEL_DIR / "demand_model_config.json"

# NOTE: the current production preference artifact is the legacy *_dev filename,
# but the verified config JSON shows this is the full-validation run artifact
# (run_type='full_validation', 60,719,724 training rows available, 1,000,000 rows used).
# Do not rename or copy the artifact; load the verified fitted model directly.
PREFERENCE_MODEL_PATH = PREFERENCE_MODEL_DIR / "best_customer_preference_model_dev.joblib"
PREFERENCE_CONFIG_PATH = PREFERENCE_MODEL_DIR / "customer_preference_model_config_dev.json"

VISUAL_MODEL_PATH = VISUAL_MODEL_DIR / "best_visual_attribute_model.pth"
VISUAL_CONFIG_PATH = VISUAL_MODEL_DIR / "visual_model_config.json"

CLIP_EMBEDDINGS_PATH = VISUAL_FEATURES_DIR / "deepfashion_clip_embeddings.npy"
CLIP_METADATA_PATH = VISUAL_FEATURES_DIR / "deepfashion_clip_metadata.csv"
