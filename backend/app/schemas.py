"""
FreshCheck Pydantic Schemas
===========================
Defines API request and response data contracts.
"""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field

class PredictionResponse(BaseModel):
    predicted_class: str = Field(..., description="Raw model class, e.g. 'fresh_apple'")
    display_name: str = Field(..., description="Human-readable label, e.g. 'Fresh Apple'")
    produce_type: str = Field(..., description="Detected produce, e.g. 'Apple'")
    freshness_status: str = Field(..., description="'fresh', 'spoiled', or 'uncertain'")
    model_confidence: float = Field(..., ge=0.0, le=1.0, description="Random forest tree ensemble vote fraction")
    model_confidence_percent: str = Field(..., description="Formatted confidence percentage string")
    class_probabilities: Dict[str, float] = Field(..., description="Vote distribution across all classes")
    visual_assessment: str = Field(..., description="Objective surface visual status")
    safety_advisory: str = Field(..., description="Responsible AI food safety and visual-only disclaimer")
    inference_time_ms: float = Field(..., description="Total pipeline latency in milliseconds")
    image_url: Optional[str] = Field(None, description="Cloudinary CDN hosted URL of the uploaded produce image")
    history_id: Optional[str] = Field(None, description="MongoDB Atlas document ID")

class ModelComparisonItem(BaseModel):
    model_name: str
    test_accuracy: float
    macro_f1: float
    weighted_f1: float
    type: str

class PerClassMetric(BaseModel):
    precision: float
    recall: float
    f1_score: float
    support: int

class MetricsResponse(BaseModel):
    dataset_summary: Dict[str, object]
    primary_model: Dict[str, object]
    confusion_matrix: Dict[str, object]
    model_comparison: List[ModelComparisonItem]

class SampleImageItem(BaseModel):
    id: str
    filename: str
    label: str
    displayName: str
    category: str
    url: str

class HistoryItem(BaseModel):
    id: str
    image_url: Optional[str] = None
    predicted_class: str
    display_name: str
    produce_type: str
    freshness_status: str
    model_confidence: float
    model_confidence_percent: str
    visual_assessment: str
    safety_advisory: Optional[str] = None
    inference_time_ms: Optional[float] = None
    class_probabilities: Optional[Dict[str, float]] = None
    created_at: Optional[str] = None

class HistoryResponse(BaseModel):
    items: List[HistoryItem]
    total: int
    db_connected: bool
    db_status: str
