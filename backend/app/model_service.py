"""
FreshCheck Model Inference Service
==================================
Handles real-time image processing, feature extraction, and Random Forest prediction.
"""

import io
import time
import json
import joblib
import numpy as np
from pathlib import Path
from PIL import Image
from typing import Dict, Any

from ml_pipeline.feature_extractor import MobileNetFeatureExtractor
from backend.app.schemas import PredictionResponse

PRODUCE_MAP = {
    "apple": "Apple",
    "banana": "Banana",
    "orange": "Orange"
}

class FreshCheckModelService:
    def __init__(self, models_dir: Path):
        self.models_dir = Path(models_dir)
        self.rf_model_path = self.models_dir / "freshcheck_rf.joblib"
        self.meta_path = self.models_dir / "training_meta.json"
        
        self.model = None
        self.classes = []
        self.feature_extractor = None
        self.is_ready = False

    def load(self):
        """Loads model weights and initializes feature extractor."""
        if not self.rf_model_path.exists() or not self.meta_path.exists():
            print(f"Warning: Model artifacts not found in {self.models_dir}. Need to run training first.")
            return False

        print(f"Loading trained Random Forest model from {self.rf_model_path}...")
        self.model = joblib.load(self.rf_model_path)
        
        with open(self.meta_path, "r", encoding="utf-8") as f:
            meta = json.load(f)
        self.classes = meta["classes"]
        
        print("Initializing MobileNetV2 embedding extractor...")
        self.feature_extractor = MobileNetFeatureExtractor()
        self.is_ready = True
        print(f"FreshCheck Model Service is ready with classes: {self.classes}")
        return True

    def predict_image(self, image_bytes: bytes) -> Dict[str, Any]:
        """Runs end-to-end inference on uploaded image bytes."""
        if not self.is_ready:
            raise RuntimeError("Model service has not been loaded. Please run the training pipeline first.")

        start_time = time.perf_counter()

        # Load & validate image
        try:
            image = Image.open(io.BytesIO(image_bytes))
            if image.mode != "RGB":
                image = image.convert("RGB")
        except Exception as e:
            raise ValueError(f"Invalid or corrupted image format: {str(e)}")

        # Step 1: Extract 1280-D features via MobileNetV2
        features = self.feature_extractor.extract_single(image)
        features_2d = features.reshape(1, -1)

        # Step 2: Random Forest Inference
        pred_idx = self.model.predict(features_2d)[0]
        predicted_class = self.classes[pred_idx]

        # Tree ensemble vote fraction (predict_proba)
        probs = self.model.predict_proba(features_2d)[0]
        confidence = float(probs[pred_idx])

        elapsed_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

        # Identify produce type
        produce_type = "Produce"
        for key, name in PRODUCE_MAP.items():
            if key in predicted_class:
                produce_type = name
                break

        freshness_status = "fresh" if "fresh" in predicted_class else "spoiled"
        display_name = predicted_class.replace("_", " ").title()

        # Class probabilities map
        class_probs = {self.classes[i]: round(float(probs[i]), 4) for i in range(len(self.classes))}

        # Visual description
        if freshness_status == "fresh":
            visual_assessment = (
                f"Surface appearance of the {produce_type} looks visually intact "
                "with normal color uniformity and no apparent rot, bruising, or fungal growth."
            )
        else:
            visual_assessment = (
                f"Surface of the {produce_type} shows visible indications of spoilage, "
                "such as surface discoloration, browning, softening, or fungal mold."
            )

        safety_advisory = (
            "Responsible AI Notice: Visual assessment only. Surface photographs cannot determine "
            "food safety, microbial contamination (bacteria/mold toxins), or internal decay. "
            "Always inspect smell, firmness, and storage history before consuming or discarding."
        )

        return {
            "predicted_class": predicted_class,
            "display_name": display_name,
            "produce_type": produce_type,
            "freshness_status": freshness_status,
            "model_confidence": round(confidence, 4),
            "model_confidence_percent": f"{confidence * 100.0:.1f}%",
            "class_probabilities": class_probs,
            "visual_assessment": visual_assessment,
            "safety_advisory": safety_advisory,
            "inference_time_ms": elapsed_ms
        }
