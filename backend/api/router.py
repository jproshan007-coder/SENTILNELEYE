import os
import json
import csv
import io
import time
from fastapi import APIRouter, HTTPException, Response, Query, UploadFile, File, Form
from typing import List, Optional
from backend.database.db import get_db_connection
from backend.ai.pipeline import pipeline_instance
from backend.ai.camera_manager import camera_manager_instance
from backend.models.schemas import (
    IncidentResponse, IncidentStatusUpdate,
    RestrictedZoneCreate, RestrictedZoneResponse,
    SettingsModel, StatsResponse
)

router = APIRouter(prefix="/api")

# Directory for uploaded videos
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/cameras")
def get_cameras():
    """Returns status and metadata for all 4 camera feeds."""
    return list(camera_manager_instance.cameras.values())

@router.get("/cameras/{camera_id}")
def get_camera_detail(camera_id: str):
    if camera_id not in camera_manager_instance.cameras:
        raise HTTPException(status_code=404, detail="Camera not found")
    return camera_manager_instance.cameras[camera_id]

@router.post("/camera/connect")
def connect_camera_source(camera_id: str = Form(...), source_type: str = Form(...)):
    """Switches camera source (webcam, video_file, demo, offline)."""
    success = camera_manager_instance.set_camera_source(camera_id, source_type)
    if not success:
        return {"status": "error", "message": f"Failed to connect camera {camera_id} to source {source_type}"}
    return {"status": "success", "camera": camera_manager_instance.cameras[camera_id]}

@router.post("/video/upload")
async def upload_video(file: UploadFile = File(...), camera_id: str = Form(...)):
    """Uploads a video file and attaches it to the specified camera feed."""
    allowed_exts = [".mp4", ".avi", ".mov", ".webm", ".mkv"]
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_exts:
        raise HTTPException(status_code=400, detail="Invalid video file format. Supported: MP4, AVI, MOV, WebM")

    file_path = os.path.join(UPLOAD_DIR, f"{camera_id}_{int(time.time())}{ext}")
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    success = camera_manager_instance.set_camera_source(camera_id, "video_file", file_path)
    return {
        "status": "success",
        "message": f"Video uploaded successfully and assigned to {camera_id}",
        "filename": file.filename,
        "camera_id": camera_id,
        "file_path": file_path
    }

@router.post("/demo/trigger")
def trigger_demo_scenario(scenario: str = Form(...), camera_id: str = Form("CAM-02")):
    """Instant trigger for presentation demo scenarios."""
    now = time.time()
    timestamp_str = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(now))
    cam_info = camera_manager_instance.cameras.get(camera_id, {"name": camera_id, "location": "Sector B - Plaza"})

    if scenario == "altercation":
        alert = {
            "camera_id": camera_id,
            "camera_name": cam_info["name"],
            "location": cam_info["location"],
            "event_type": "Possible Physical Altercation",
            "risk_level": "Critical",
            "risk_score": 94,
            "confidence": 0.92,
            "person_id": "PERSON_201, PERSON_202",
            "timestamp": timestamp_str,
            "bounding_box": {"x": 280, "y": 210, "width": 110, "height": 140},
            "details": {
                "violent_movement": True,
                "body_collision": True,
                "involved_count": 2,
                "reasons": [
                    "2 people detected in rapid, close-contact motion",
                    "Inter-person distance reduced below 45px",
                    "Arm velocity burst: 38.4 px/frame (High energy)",
                    "Aggressive interaction persisted for 3.2 seconds",
                    "AI Detection — Human verification required"
                ]
            }
        }
    elif scenario == "intrusion":
        alert = {
            "camera_id": "CAM-01",
            "camera_name": "Perimeter North Vault",
            "location": "Sector A - Gate 4",
            "event_type": "Restricted Area Intrusion",
            "risk_level": "High",
            "risk_score": 84,
            "confidence": 0.95,
            "person_id": "PERSON_101",
            "timestamp": timestamp_str,
            "bounding_box": {"x": 140, "y": 190, "width": 65, "height": 140},
            "details": {
                "dwell_time_seconds": 4.5,
                "reasons": [
                    "Subject PERSON_101 entered restricted laser zone",
                    "Dwell duration: 4.5s (Threshold: 2.0s)",
                    "Unauthorized presence detected inside geo-fence",
                    "AI Detection — Human verification required"
                ]
            }
        }
    elif scenario == "running":
        alert = {
            "camera_id": "CAM-03",
            "camera_name": "East Corridor Alley",
            "location": "Sector C - Tunnel 2",
            "event_type": "Suspicious Running",
            "risk_level": "Medium",
            "risk_score": 68,
            "confidence": 0.89,
            "person_id": "PERSON_301",
            "timestamp": timestamp_str,
            "bounding_box": {"x": 220, "y": 210, "width": 60, "height": 135},
            "details": {
                "running_speed_m_s": 5.4,
                "direction": "EAST",
                "reasons": [
                    "Person velocity measured at 5.4 m/s (Threshold: 3.5 m/s)",
                    "Direction vector: EAST through enclosed tunnel",
                    "Rapid spatial displacement across consecutive frames"
                ]
            }
        }
    else:
        raise HTTPException(status_code=400, detail="Unknown demo scenario")

    alert['snapshot_url'] = pipeline_instance._create_snapshot_url(alert['camera_id'], None, alert)
    incident_id = pipeline_instance.save_incident_to_db(alert)
    alert['id'] = incident_id

    pipeline_instance.last_alert_time[alert['camera_id']] = now
    pipeline_instance.active_camera_alerts[alert['camera_id']] = alert

    # Broadcast via websocket
    from backend.api.websocket import manager
    import asyncio
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(manager.broadcast({"type": "NEW_ALERT", "data": alert}))
    except Exception:
        pass

    return {"status": "success", "alert": alert}

@router.get("/incidents", response_model=List[IncidentResponse])
def get_incidents(
    camera_id: Optional[str] = None,
    event_type: Optional[str] = None,
    risk_level: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100
):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM incidents WHERE 1=1"
    params = []

    if camera_id:
        query += " AND camera_id = ?"
        params.append(camera_id)
    if event_type:
        query += " AND event_type = ?"
        params.append(event_type)
    if risk_level:
        query += " AND risk_level = ?"
        params.append(risk_level)
    if status:
        query += " AND status = ?"
        params.append(status)
    if search:
        query += " AND (person_id LIKE ? OR camera_name LIKE ? OR event_type LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term])

    query += " ORDER BY id DESC LIMIT ?"
    params.append(limit)

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    result = []
    for r in rows:
        item = dict(r)
        item['details'] = json.loads(item['details_json']) if item['details_json'] else {}
        item['bounding_box'] = json.loads(item['bounding_box_json']) if item['bounding_box_json'] else None
        result.append(item)

    return result

@router.patch("/incidents/{incident_id}/status")
def update_incident_status(incident_id: int, payload: IncidentStatusUpdate):
    if payload.status not in ["Verified", "Dismissed", "Waiting Verification"]:
        raise HTTPException(status_code=400, detail="Invalid status value")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE incidents SET status = ? WHERE id = ?", (payload.status, incident_id))
    conn.commit()
    rows_affected = cursor.rowcount
    conn.close()

    if rows_affected == 0:
        raise HTTPException(status_code=404, detail="Incident not found")

    return {"message": "Status updated successfully", "id": incident_id, "status": payload.status}

@router.get("/incidents/export/csv")
def export_incidents_csv():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, camera_id, camera_name, event_type, risk_level, risk_score, confidence, person_id, timestamp, status FROM incidents ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Camera ID", "Camera Name", "Event Type", "Risk Level", "Risk Score", "Confidence", "Person ID", "Timestamp", "Status"])

    for r in rows:
        writer.writerow([r['id'], r['camera_id'], r['camera_name'], r['event_type'], r['risk_level'], f"{r['risk_score']}%", f"{r['confidence']*100:.1f}%", r['person_id'], r['timestamp'], r['status']])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=cctv_crime_incidents.csv"}
    )

@router.get("/alerts/live", response_model=List[IncidentResponse])
def get_live_alerts():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM incidents ORDER BY id DESC LIMIT 10")
    rows = cursor.fetchall()
    conn.close()

    result = []
    for r in rows:
        item = dict(r)
        item['details'] = json.loads(item['details_json']) if item['details_json'] else {}
        item['bounding_box'] = json.loads(item['bounding_box_json']) if item['bounding_box_json'] else None
        result.append(item)
    return result

@router.get("/zones/{camera_id}", response_model=Optional[RestrictedZoneResponse])
def get_zone(camera_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM restricted_zones WHERE camera_id = ? AND enabled = 1 LIMIT 1", (camera_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    item = dict(row)
    item['points'] = json.loads(item['points_json'])
    item['enabled'] = bool(item['enabled'])
    return item

@router.post("/zones", response_model=RestrictedZoneResponse)
def save_zone(payload: RestrictedZoneCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    points_json = json.dumps([p.dict() for p in payload.points])
    
    cursor.execute("SELECT id FROM restricted_zones WHERE camera_id = ?", (payload.camera_id,))
    existing = cursor.fetchone()
    
    if existing:
        cursor.execute("""
            UPDATE restricted_zones SET zone_name = ?, points_json = ?, enabled = ? WHERE id = ?
        """, (payload.zone_name, points_json, 1 if payload.enabled else 0, existing['id']))
        zone_id = existing['id']
    else:
        cursor.execute("""
            INSERT INTO restricted_zones (camera_id, zone_name, points_json, enabled) VALUES (?, ?, ?, ?)
        """, (payload.camera_id, payload.zone_name, points_json, 1 if payload.enabled else 0))
        zone_id = cursor.lastrowid

    conn.commit()
    conn.close()

    return {
        "id": zone_id,
        "camera_id": payload.camera_id,
        "zone_name": payload.zone_name,
        "points": payload.points,
        "enabled": payload.enabled
    }

@router.get("/settings", response_model=SettingsModel)
def get_settings():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT confidence_threshold, dwell_threshold, speed_threshold, sound_enabled, dark_mode FROM system_settings WHERE id = 1")
    row = cursor.fetchone()
    conn.close()

    if row:
        return {
            "confidence_threshold": row['confidence_threshold'],
            "dwell_threshold": row['dwell_threshold'],
            "speed_threshold": row['speed_threshold'],
            "sound_enabled": bool(row['sound_enabled']),
            "dark_mode": bool(row['dark_mode'])
        }
    return SettingsModel()

@router.post("/settings", response_model=SettingsModel)
def update_settings(payload: SettingsModel):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE system_settings
        SET confidence_threshold = ?, dwell_threshold = ?, speed_threshold = ?, sound_enabled = ?, dark_mode = ?
        WHERE id = 1
    """, (
        payload.confidence_threshold,
        payload.dwell_threshold,
        payload.speed_threshold,
        1 if payload.sound_enabled else 0,
        1 if payload.dark_mode else 0
    ))
    conn.commit()
    conn.close()
    return payload

@router.get("/stats", response_model=StatsResponse)
def get_stats():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM incidents")
    total_alerts = cursor.fetchone()[0]
    conn.close()

    return {
        "today_alerts": total_alerts,
        "people_detected": 142 + (total_alerts * 3),
        "active_cameras": 4,
        "avg_detection_time_ms": 18.4,
        "ai_accuracy_pct": 98.4
    }
