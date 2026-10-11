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
    freshness_status: str = Field(..., description="'fresh' or 'spoiled'")
    model_confidence: float = Field(..., ge=0.0, le=1.0, description="Random forest tree ensemble vote fraction")
    model_confidence_percent: str = Field(..., description="Formatted confidence percentage string")
    class_probabilities: Dict[str, float] = Field(..., description="Vote distribution across all classes")
    visual_assessment: str = Field(..., description="Objective surface visual status")
    safety_advisory: str = Field(..., description="Responsible AI food safety and visual-only disclaimer")
    inference_time_ms: float = Field(..., description="Total pipeline latency in milliseconds")

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
