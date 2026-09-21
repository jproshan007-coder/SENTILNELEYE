from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class BoundingBox(BaseModel):
    x: float
    y: float
    width: float
    height: float

class IncidentCreate(BaseModel):
    camera_id: str
    camera_name: str
    event_type: str  # "Unauthorized Entry", "Fight Detected", "Suspicious Running"
    risk_level: str  # "Low", "Medium", "High", "Critical"
    risk_score: int  # 0 to 100
    confidence: float  # 0.0 to 1.0
    person_id: str
    snapshot_url: Optional[str] = ""
    status: str = "Waiting Verification"  # "Waiting Verification", "Verified", "Dismissed"
    details: Optional[Dict[str, Any]] = None
    bounding_box: Optional[BoundingBox] = None

class IncidentResponse(IncidentCreate):
    id: int
    timestamp: str

class IncidentStatusUpdate(BaseModel):
    status: str  # "Verified" or "Dismissed"

class RestrictedZonePoint(BaseModel):
    x: float  # Normalized 0.0 to 1.0 or pixel coordinates
    y: float

class RestrictedZoneCreate(BaseModel):
    camera_id: str
    zone_name: str
    points: List[RestrictedZonePoint]
    enabled: bool = True

class RestrictedZoneResponse(RestrictedZoneCreate):
    id: int

class SettingsModel(BaseModel):
    confidence_threshold: float = Field(0.75, ge=0.1, le=1.0)
    dwell_threshold: float = Field(2.0, ge=0.5, le=10.0)  # seconds
    speed_threshold: float = Field(3.5, ge=1.0, le=10.0)  # speed threshold
    sound_enabled: bool = True
    dark_mode: bool = True

class StatsResponse(BaseModel):
    today_alerts: int
    people_detected: int
    active_cameras: int
    avg_detection_time_ms: float
    ai_accuracy_pct: float
