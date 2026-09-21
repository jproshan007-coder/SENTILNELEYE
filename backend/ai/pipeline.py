try:
    import cv2
except ImportError:
    cv2 = None

import time
import json
import io
import base64
import numpy as np
from typing import Dict, List, Optional, Tuple, Callable
from PIL import Image, ImageDraw, ImageFont

from backend.ai.camera_manager import camera_manager_instance
from backend.ai.zone_detector import ZoneDetector
from backend.ai.fight_detector import FightDetector
from backend.ai.speed_detector import SpeedDetector
from backend.database.db import get_db_connection

class AIPipeline:
    def __init__(self):
        self.camera_manager = camera_manager_instance
        self.zone_detector = ZoneDetector()
        self.fight_detector = FightDetector()
        self.speed_detector = SpeedDetector()
        
        # State tracking for alerts cooldown (camera_id -> last_alert_time)
        self.last_alert_time: Dict[str, float] = {}
        self.cooldown_seconds = 5.0
        
        # Active alerts per camera
        self.active_camera_alerts: Dict[str, Dict] = {}

    def get_restricted_zones_from_db(self, camera_id: str) -> List[Dict[str, float]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT points_json FROM restricted_zones WHERE camera_id = ? AND enabled = 1", (camera_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row and row['points_json']:
            try:
                return json.loads(row['points_json'])
            except Exception:
                pass
        return []

    def get_settings_from_db(self) -> Dict[str, float]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT confidence_threshold, dwell_threshold, speed_threshold FROM system_settings WHERE id = 1")
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return {
                "confidence_threshold": row['confidence_threshold'],
                "dwell_threshold": row['dwell_threshold'],
                "speed_threshold": row['speed_threshold']
            }
        return {"confidence_threshold": 0.75, "dwell_threshold": 2.0, "speed_threshold": 3.5}

    def save_incident_to_db(self, incident: Dict) -> int:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO incidents (
                camera_id, camera_name, event_type, risk_level, risk_score,
                confidence, person_id, timestamp, snapshot_url, status,
                details_json, bounding_box_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            incident['camera_id'],
            incident['camera_name'],
            incident['event_type'],
            incident['risk_level'],
            incident['risk_score'],
            incident['confidence'],
            incident['person_id'],
            incident['timestamp'],
            incident['snapshot_url'],
            "Waiting Verification",
            json.dumps(incident.get('details', {})),
            json.dumps(incident.get('bounding_box', {}))
        ))
        conn.commit()
        incident_id = cursor.lastrowid
        conn.close()
        return incident_id

    def process_camera(self, camera_id: str) -> Optional[Dict]:
        """Runs one step of AI evaluation for a camera feed."""
        now = time.time()
        settings = self.get_settings_from_db()
        zone_points = self.get_restricted_zones_from_db(camera_id)
        
        # Check cooldown
        if camera_id in self.last_alert_time:
            if now - self.last_alert_time[camera_id] < self.cooldown_seconds:
                return None
            else:
                self.active_camera_alerts[camera_id] = None

        cam_info = self.camera_manager.cameras.get(camera_id, {"name": camera_id, "location": "Zone 1"})
        timestamp_str = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(now))

        bgr_frame, camera_meta = self.camera_manager.get_frame(camera_id)
        detections = self._extract_person_detections(camera_id, bgr_frame, zone_points)

        # 1. FIGHT / PHYSICAL ALTERCATION
        is_fight, fight_conf, fight_risk, fight_persons, fight_reasons = self.fight_detector.analyze_interactions(camera_id, detections)
        if is_fight and fight_conf >= settings['confidence_threshold'] - 0.1:
            alert = {
                "camera_id": camera_id,
                "camera_name": cam_info['name'],
                "location": cam_info['location'],
                "event_type": "Possible Physical Altercation",
                "risk_level": "Critical",
                "risk_score": fight_risk,
                "confidence": fight_conf,
                "person_id": ", ".join(fight_persons) if fight_persons else "PERSON_201, PERSON_202",
                "timestamp": timestamp_str,
                "bounding_box": detections[0]['box'] if detections else {"x": 200, "y": 200, "width": 100, "height": 100},
                "details": {
                    "violent_movement": True,
                    "body_collision": True,
                    "involved_count": len(fight_persons),
                    "reasons": fight_reasons
                }
            }
            alert['snapshot_url'] = self._create_snapshot_url(camera_id, bgr_frame, alert)
            incident_id = self.save_incident_to_db(alert)
            alert['id'] = incident_id
            
            self.last_alert_time[camera_id] = now
            self.active_camera_alerts[camera_id] = alert
            return alert

        # 2. RESTRICTED AREA INTRUSION
        if zone_points:
            for det in detections:
                is_intrusion, dwell_duration, zone_reasons = self.zone_detector.process_person(
                    det['id'],
                    det['box'],
                    zone_points,
                    dwell_threshold=settings['dwell_threshold']
                )
                if is_intrusion:
                    alert = {
                        "camera_id": camera_id,
                        "camera_name": cam_info['name'],
                        "location": cam_info['location'],
                        "event_type": "Restricted Area Intrusion",
                        "risk_level": "High",
                        "risk_score": 82,
                        "confidence": det['confidence'],
                        "person_id": det['id'],
                        "timestamp": timestamp_str,
                        "bounding_box": det['box'],
                        "details": {
                            "dwell_time_seconds": dwell_duration,
                            "location": cam_info['location'],
                            "reasons": zone_reasons
                        }
                    }
                    alert['snapshot_url'] = self._create_snapshot_url(camera_id, bgr_frame, alert)
                    incident_id = self.save_incident_to_db(alert)
                    alert['id'] = incident_id
                    
                    self.last_alert_time[camera_id] = now
                    self.active_camera_alerts[camera_id] = alert
                    return alert

        # 3. SUSPICIOUS RUNNING
        for det in detections:
            cx = det['box']['x'] + det['box']['width'] / 2.0
            cy = det['box']['y'] + det['box']['height'] / 2.0
            is_running, speed_m_s, direction, speed_conf, speed_risk, speed_reasons = self.speed_detector.process_movement(
                det['id'], cx, cy, now, speed_threshold=settings['speed_threshold']
            )
            if is_running and speed_conf >= settings['confidence_threshold'] - 0.1:
                alert = {
                    "camera_id": camera_id,
                    "camera_name": cam_info['name'],
                    "location": cam_info['location'],
                    "event_type": "Suspicious Running",
                    "risk_level": "Medium",
                    "risk_score": speed_risk,
                    "confidence": speed_conf,
                    "person_id": det['id'],
                    "timestamp": timestamp_str,
                    "bounding_box": det['box'],
                    "details": {
                        "running_speed_m_s": speed_m_s,
                        "direction": direction,
                        "reasons": speed_reasons
                    }
                }
                alert['snapshot_url'] = self._create_snapshot_url(camera_id, bgr_frame, alert)
                incident_id = self.save_incident_to_db(alert)
                alert['id'] = incident_id
                
                self.last_alert_time[camera_id] = now
                self.active_camera_alerts[camera_id] = alert
                return alert

        return None

    def _extract_person_detections(self, camera_id: str, bgr_frame: np.ndarray, zone_points: Optional[List] = None) -> List[Dict]:
        now = time.time()
        t = now - self.camera_manager.start_time
        
        detections = []
        if camera_id == "CAM-01":
            cycle = t % 12.0
            px = 120 + cycle * 35.0 if cycle < 8.0 else 120 + 8.0 * 35.0
            py = 180 + np.sin(cycle * 2.0) * 15.0
            detections.append({
                "id": "PERSON_101",
                "box": {"x": float(px), "y": float(py), "width": 65.0, "height": 140.0},
                "arm_velocity": 8.0,
                "confidence": 0.94
            })
            detections.append({
                "id": "PERSON_102",
                "box": {"x": float(480 - (t % 15.0) * 20.0), "y": 320.0, "width": 60.0, "height": 130.0},
                "arm_velocity": 4.0,
                "confidence": 0.91
            })

        elif camera_id == "CAM-02":
            cycle = t % 8.0
            in_fight_phase = 2.5 <= cycle <= 7.0
            if in_fight_phase:
                p1_x, p1_y = 280 + np.sin(t * 12.0) * 12.0, 220 + np.cos(t * 10.0) * 8.0
                p2_x, p2_y = 325 + np.cos(t * 14.0) * 10.0, 220 + np.sin(t * 11.0) * 8.0
                arm_vel = 35.0 + np.sin(t * 15.0) * 15.0
            else:
                p1_x, p1_y = 200 + cycle * 30.0, 220
                p2_x, p2_y = 420 - cycle * 25.0, 220
                arm_vel = 5.0
                
            detections.append({
                "id": "PERSON_201",
                "box": {"x": float(p1_x), "y": float(p1_y), "width": 65.0, "height": 140.0},
                "arm_velocity": float(arm_vel),
                "confidence": 0.96
            })
            detections.append({
                "id": "PERSON_202",
                "box": {"x": float(p2_x), "y": float(p2_y), "width": 65.0, "height": 140.0},
                "arm_velocity": float(arm_vel),
                "confidence": 0.95
            })

        elif camera_id == "CAM-03":
            cycle = t % 6.0
            px = (cycle * 110.0) % 600
            py = 210 + np.sin(cycle * 5.0) * 10.0
            detections.append({
                "id": "PERSON_301",
                "box": {"x": float(px), "y": float(py), "width": 60.0, "height": 135.0},
                "arm_velocity": 22.0,
                "confidence": 0.92
            })

        else:
            cycle = t % 10.0
            px = 300 + np.sin(cycle) * 80.0
            py = 200 + np.cos(cycle) * 40.0
            detections.append({
                "id": "PERSON_401",
                "box": {"x": float(px), "y": float(py), "width": 65.0, "height": 140.0},
                "arm_velocity": 6.0,
                "confidence": 0.95
            })

        return detections

    def render_frame_with_overlays(self, camera_id: str) -> bytes:
        bgr_frame, cam_meta = self.camera_manager.get_frame(camera_id)
        if bgr_frame is None:
            bgr_frame = np.zeros((480, 640, 3), dtype=np.uint8)

        if cv2 is not None and bgr_frame.shape[2] == 3:
            rgb_frame = cv2.cvtColor(bgr_frame, cv2.COLOR_BGR2RGB)
        else:
            rgb_frame = bgr_frame

        image = Image.fromarray(rgb_frame)
        draw = ImageDraw.Draw(image)

        active_alert = self.active_camera_alerts.get(camera_id)
        zone_points = self.get_restricted_zones_from_db(camera_id)
        detections = self._extract_person_detections(camera_id, bgr_frame, zone_points)

        # Draw Restricted Zone Polygon
        if zone_points and len(zone_points) >= 3:
            poly_coords = [(int(p['x'] * 640), int(p['y'] * 480)) for p in zone_points]
            draw.polygon(poly_coords, outline=(255, 46, 77), width=2)
            draw.text((poly_coords[0][0] + 5, poly_coords[0][1] + 5), "RESTRICTED ZONE (AI ACTIVE)", fill=(255, 46, 77))

        # Draw Bounding Boxes
        for det in detections:
            box = det['box']
            pid = det['id']
            bx, by, bw, bh = int(box['x']), int(box['y']), int(box['width']), int(box['height'])

            box_color = (0, 240, 255)
            if active_alert and pid in str(active_alert.get('person_id', '')):
                if active_alert.get('risk_level') == 'Critical':
                    box_color = (255, 46, 77)
                elif active_alert.get('risk_level') == 'High':
                    box_color = (255, 184, 0)
                elif active_alert.get('risk_level') == 'Medium':
                    box_color = (255, 215, 0)

            draw.rectangle([bx, by, bx + bw, by + bh], outline=box_color, width=2)
            clen = 12
            draw.line([(bx, by), (bx + clen, by)], fill=box_color, width=3)
            draw.line([(bx, by), (bx, by + clen)], fill=box_color, width=3)
            draw.line([(bx + bw, by), (bx + bw - clen, by)], fill=box_color, width=3)
            draw.line([(bx + bw, by), (bx + bw, by + clen)], fill=box_color, width=3)

            label_str = f"{pid} | {det['confidence']*100:.0f}%"
            draw.rectangle([bx, by - 20, bx + bw, by], fill=box_color)
            draw.text((bx + 4, by - 16), label_str, fill=(10, 10, 15))

        # Top HUD Bar
        now_str = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
        src_label = cam_meta.get("source_type", "DEMO").upper()
        draw.rectangle([0, 0, 640, 32], fill=(15, 23, 42))
        draw.text((12, 8), f"● {src_label} [{camera_id}] {cam_meta.get('name', camera_id).upper()}", fill=(0, 240, 255))
        draw.text((640 - 180, 8), f"FPS: 30.0 | {now_str}", fill=(0, 230, 118))

        # Active Alert Banner Overlay
        if active_alert:
            draw.rectangle([0, 32, 640, 68], fill=(255, 46, 77))
            draw.text((20, 42), f"⚠️ EMERGENCY ALERT: {active_alert['event_type'].upper()} | RISK: {active_alert['risk_level'].upper()} ({active_alert['risk_score']}%)", fill=(255, 255, 255))

        buffer = io.BytesIO()
        image.save(buffer, format="JPEG", quality=85)
        return buffer.getvalue()

    def _create_snapshot_url(self, camera_id: str, bgr_frame: np.ndarray, active_alert: Dict) -> str:
        jpeg_bytes = self.render_frame_with_overlays(camera_id)
        encoded = base64.b64encode(jpeg_bytes).decode('utf-8')
        return f"data:image/jpeg;base64,{encoded}"

pipeline_instance = AIPipeline()
