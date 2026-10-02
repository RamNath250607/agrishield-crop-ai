from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime, date

# Telemetry Schemas
class TelemetryBase(BaseModel):
    temperature: float
    humidity: float
    soil_moisture: float
    solar_radiation: float
    status_label: str

class TelemetryCreate(TelemetryBase):
    pass

class TelemetryResponse(TelemetryBase):
    id: int
    recorded_at: datetime

    class Config:
        from_attributes = True

# Task Schemas
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    type: str # chemical, organic, cultural
    status: str = "pending" # pending, completed
    due_date: date

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    status: str

class TaskResponse(TaskBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Bounding Box Schema
class BoundingBox(BaseModel):
    x: float
    y: float
    w: float
    h: float
    label: str

# Scan Schemas
class ScanResponse(BaseModel):
    id: int
    crop_type: str
    disease_name: str
    scientific_name: Optional[str] = None
    pathogen_type: Optional[str] = None
    severity_percentage: float
    severity_level: str
    confidence: float
    bounding_boxes: Optional[List[Any]] = None
    pesticide_name: Optional[str] = None
    pesticide_dosage: Optional[str] = None
    pesticide_safety_instructions: Optional[str] = None
    cultural_care_instructions: Optional[str] = None
    image_path: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
