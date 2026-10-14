"""
FreshCheck FastAPI Application
==============================
Main API service powering the FreshCheck food freshness classifier.
Exposes endpoints for image prediction, live empirical metrics, and sample presets.
"""

import os
import json
from pathlib import Path
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.model_service import FreshCheckModelService
from backend.app.schemas import PredictionResponse

BASE_DIR = Path(__file__).resolve().parent.parent.parent
MODELS_DIR = BASE_DIR / "models"
SAMPLES_DIR = BASE_DIR / "backend" / "app" / "samples"

app = FastAPI(
    title="FreshCheck API",
    description="Food Freshness Classifier Service powered by MobileNetV2 + Random Forest",
    version="1.0.0"
)

# Enable CORS for React frontend (supports Vercel HTTPS deployments & tunnels)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Mount sample images directory for 1-click test gallery
if SAMPLES_DIR.exists():
    app.mount("/samples", StaticFiles(directory=str(SAMPLES_DIR)), name="samples")

# Mount models directory for confusion matrix plot
if MODELS_DIR.exists():
    app.mount("/model-artifacts", StaticFiles(directory=str(MODELS_DIR)), name="artifacts")

# Initialize model service
model_service = FreshCheckModelService(MODELS_DIR)

@app.on_event("startup")
async def startup_event():
    print("Starting FreshCheck API...")
    if MODELS_DIR.exists():
        model_service.load()

@app.get("/api/health")
def health_check():
    """Health check and model readiness probe."""
    return {
        "status": "online",
        "model_ready": model_service.is_ready,
        "classes": model_service.classes,
        "device": "CPU / MobileNetV2"
    }

@app.post("/api/predict", response_model=PredictionResponse)
async def predict_freshness(file: UploadFile = File(...)):
    """
    Classifies food item and returns model confidence, visual observations,
    and responsible food safety advisory.
    """
    if not model_service.is_ready:
        loaded = model_service.load()
        if not loaded:
            raise HTTPException(
                status_code=503,
                detail="Model is not ready. Please run the training and evaluation pipeline first."
            )

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        result = model_service.predict_image(contents)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

@app.get("/api/metrics")
def get_evaluation_metrics():
    """
    Returns actual empirical test metrics computed by evaluate.py.
    Guaranteed dynamic: zero hardcoded metrics.
    """
    metrics_path = MODELS_DIR / "metrics.json"
    if not metrics_path.exists():
        raise HTTPException(
            status_code=404,
            detail="No evaluation metrics found. Run the test evaluation pipeline to generate metrics.json."
        )

    with open(metrics_path, "r", encoding="utf-8") as f:
        metrics_data = json.load(f)

    return metrics_data

@app.get("/api/sample-images")
def get_sample_images():
    """Returns pre-loaded test samples for 1-click viva demonstrations."""
    manifest_file = SAMPLES_DIR / "samples.json"
    if not manifest_file.exists():
        return []

    with open(manifest_file, "r", encoding="utf-8") as f:
        samples = json.load(f)

    for s in samples:
        s["url"] = f"/samples/{s['filename']}"

    return samples
