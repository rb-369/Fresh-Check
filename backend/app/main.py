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

from typing import Optional
from backend.app.model_service import FreshCheckModelService
from backend.app.schemas import PredictionResponse, HistoryResponse, HistoryItem
from backend.app.db import db_client
from backend.app.cloudinary_service import cloudinary_service

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
        loaded = model_service.load()
        if loaded:
            model_service.warmup()

@app.get("/api/health")
def health_check():
    """Health check, model readiness, MongoDB Atlas & Cloudinary status probe."""
    return {
        "status": "online",
        "model_ready": model_service.is_ready,
        "classes": model_service.classes,
        "device": "CPU / MobileNetV2",
        "mongodb": db_client.check_health(),
        "cloudinary_ready": cloudinary_service.is_configured
    }

@app.post("/api/predict", response_model=PredictionResponse)
async def predict_freshness(file: UploadFile = File(...)):
    """
    Classifies food item, uploads image to Cloudinary, logs scan in MongoDB Atlas,
    and returns model confidence, visual observations, and food safety advisory.
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
        # Run ML model prediction
        result = model_service.predict_image(contents)

        # Upload image to Cloudinary (if configured)
        cloud_res = cloudinary_service.upload_image_bytes(contents, file.filename)
        if cloud_res:
            result["image_url"] = cloud_res["url"]
            result["cloudinary_public_id"] = cloud_res["public_id"]

        # Persist scan to MongoDB Atlas history (if configured)
        scan_id = db_client.save_scan(result)
        if scan_id:
            result["history_id"] = scan_id

        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

@app.get("/api/history", response_model=HistoryResponse)
def get_scan_history(
    limit: int = 50,
    skip: int = 0,
    produce_type: Optional[str] = None,
    freshness_status: Optional[str] = None
):
    """Retrieves past scan inspections from MongoDB Atlas."""
    records = db_client.get_history(
        limit=limit,
        skip=skip,
        produce_type=produce_type,
        freshness_status=freshness_status
    )
    db_health = db_client.check_health()
    return {
        "items": records,
        "total": len(records),
        "db_connected": db_client.is_connected,
        "db_status": db_health.get("status", "disconnected")
    }

@app.delete("/api/history/{scan_id}")
def delete_scan(scan_id: str):
    """Deletes an inspection from MongoDB Atlas."""
    success = db_client.delete_scan(scan_id)
    if not success:
        raise HTTPException(status_code=404, detail="Scan record not found or database unavailable.")
    return {"status": "deleted", "id": scan_id}

@app.delete("/api/history")
def clear_scan_history():
    """Clears all scan records from MongoDB Atlas."""
    deleted_count = db_client.clear_history()
    return {"status": "cleared", "deleted_count": deleted_count}

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
