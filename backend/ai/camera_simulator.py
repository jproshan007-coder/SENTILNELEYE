import time
import math
import io
import base64
from typing import Dict, List, Tuple, Optional
from PIL import Image, ImageDraw, ImageFont

class CameraSimulator:
    def __init__(self):
        self.start_time = time.time()
        self.frame_width = 640
        self.frame_height = 480
        
        # Camera meta
        self.cameras = {
            "CAM-01": {"name": "Perimeter North Vault", "location": "Sector A - Gate 4"},
            "CAM-02": {"name": "Main Concourse Atrium", "location": "Sector B - Plaza"},
            "CAM-03": {"name": "East Corridor Alley", "location": "Sector C - Tunnel 2"},
            "CAM-04": {"name": "Server Room Alpha", "location": "Sector D - Restricted Floor"}
        }

    def generate_frame(self, camera_id: str, zone_points: Optional[List[Dict[str, float]]] = None, active_alert: Optional[Dict] = None) -> Tuple[bytes, List[Dict]]:
        """
        Renders a synthetic high-tech CCTV camera frame with animated actors, bounding boxes,
        MediaPipe pose skeleton keypoints, zone overlays, HUD telemetry, and returns (jpeg_bytes, detections).
        """
        now = time.time()
        t = now - self.start_time
        
        # Create dark background image (CCTV CCTV Night vision / Low light dark slate)
        bg_color = (11, 15, 25)
        image = Image.new("RGB", (self.frame_width, self.frame_height), bg_color)
        draw = ImageDraw.Draw(image)
        
        # Draw camera background perspective grid (Cyber HUD)
        grid_color = (20, 30, 48)
        for y in range(0, self.frame_height, 40):
            draw.line([(0, y), (self.frame_width, y)], fill=grid_color, width=1)
        for x in range(0, self.frame_width, 40):
            draw.line([(x, 0), (x, self.frame_height)], fill=grid_color, width=1)
            
        # Draw camera vignette line & crosshair
        cx, cy = self.frame_width // 2, self.frame_height // 2
        draw.line([(cx - 15, cy), (cx + 15, cy)], fill=(0, 240, 255, 120), width=1)
        draw.line([(cx, cy - 15), (cx, cy + 15)], fill=(0, 240, 255, 120), width=1)

        # Draw Restricted Zone Polygon if present
        if zone_points and len(zone_points) >= 3:
            poly_coords = [(int(p['x'] * self.frame_width), int(p['y'] * self.frame_height)) for p in zone_points]
            # Draw semi-transparent laser outline
            draw.polygon(poly_coords, outline=(255, 46, 77), width=2)
            # Fill with subtle hatch pattern or line overlay
            for px in range(min(p[0] for p in poly_coords), max(p[0] for p in poly_coords), 12):
                draw.line([(px, min(p[1] for p in poly_coords)), (px + 10, max(p[1] for p in poly_coords))], fill=(255, 46, 77, 40), width=1)
            
            # Label
            draw.text((poly_coords[0][0] + 5, poly_coords[0][1] + 5), "RESTRICTED ZONE (AI ACTIVE)", fill=(255, 46, 77))

        detections = []
        
        # Camera Specific Animations & Detections
        if camera_id == "CAM-01":
            # Intrusion Scenario: Person 101 walks into restricted zone and lingers
            cycle = t % 12.0
            px = 120 + cycle * 35.0 if cycle < 8.0 else 120 + 8.0 * 35.0
            py = 180 + math.sin(cycle * 2.0) * 15.0
            
            p1 = {
                "id": "PERSON_101",
                "box": {"x": px, "y": py, "width": 65, "height": 140},
                "arm_velocity": 8.0,
                "is_colliding": False,
                "confidence": 0.94
            }
            detections.append(p1)
            
            # Person 102 patrolling outside
            px2 = 480 - (t % 15.0) * 20.0
            py2 = 320
            p2 = {
                "id": "PERSON_102",
                "box": {"x": px2, "y": py2, "width": 60, "height": 130},
                "arm_velocity": 4.0,
                "is_colliding": False,
                "confidence": 0.91
            }
            detections.append(p2)

        elif camera_id == "CAM-02":
            # Fight Detection Scenario: Person 201 & Person 202 collide and engage in rapid movements
            cycle = t % 8.0
            in_fight_phase = 2.5 <= cycle <= 7.0
            
            if in_fight_phase:
                p1_x, p1_y = 280 + math.sin(t * 12.0) * 12.0, 220 + math.cos(t * 10.0) * 8.0
                p2_x, p2_y = 325 + math.cos(t * 14.0) * 10.0, 220 + math.sin(t * 11.0) * 8.0
                arm_vel = 35.0 + math.sin(t * 15.0) * 15.0
                coll = True
            else:
                p1_x, p1_y = 200 + cycle * 30.0, 220
                p2_x, p2_y = 420 - cycle * 25.0, 220
                arm_vel = 5.0
                coll = False
                
            detections.append({
                "id": "PERSON_201",
                "box": {"x": p1_x, "y": p1_y, "width": 65, "height": 140},
                "arm_velocity": arm_vel,
                "is_colliding": coll,
                "confidence": 0.96
            })
            detections.append({
                "id": "PERSON_202",
                "box": {"x": p2_x, "y": p2_y, "width": 65, "height": 140},
                "arm_velocity": arm_vel,
                "is_colliding": coll,
                "confidence": 0.95
            })

        elif camera_id == "CAM-03":
            # Suspicious Running Scenario: Person 301 accelerating through tunnel
            cycle = t % 6.0
            px = (cycle * 110.0) % 600
            py = 210 + math.sin(cycle * 5.0) * 10.0
            
            detections.append({
                "id": "PERSON_301",
                "box": {"x": px, "y": py, "width": 60, "height": 135},
                "arm_velocity": 22.0,
                "is_colliding": False,
                "confidence": 0.92
            })

        else: # CAM-04 Server Room
            cycle = t % 10.0
            px = 300 + math.sin(cycle) * 80.0
            py = 200 + math.cos(cycle) * 40.0
            
            detections.append({
                "id": "PERSON_401",
                "box": {"x": px, "y": py, "width": 65, "height": 140},
                "arm_velocity": 6.0,
                "is_colliding": False,
                "confidence": 0.95
            })

        # Draw Detections on Canvas (Bounding Boxes, Tracking IDs, Pose Skeleton)
        for det in detections:
            box = det['box']
            pid = det['id']
            bx, by, bw, bh = int(box['x']), int(box['y']), int(box['width']), int(box['height'])
            
            # Select bounding box color based on active alert or threat
            box_color = (0, 240, 255) # Cyan default normal
            if active_alert and pid in str(active_alert.get('person_id', '')):
                if active_alert.get('risk_level') == 'Critical':
                    box_color = (255, 46, 77) # Crimson Red
                elif active_alert.get('risk_level') == 'High':
                    box_color = (255, 184, 0) # Amber
                elif active_alert.get('risk_level') == 'Medium':
                    box_color = (255, 215, 0) # Gold
            
            # Draw Bounding Box with Glowing Corners
            draw.rectangle([bx, by, bx + bw, by + bh], outline=box_color, width=2)
            corner_len = 12
            # Top-left corner
            draw.line([(bx, by), (bx + corner_len, by)], fill=box_color, width=4)
            draw.line([(bx, by), (bx, by + corner_len)], fill=box_color, width=4)
            # Top-right corner
            draw.line([(bx + bw, by), (bx + bw - corner_len, by)], fill=box_color, width=4)
            draw.line([(bx + bw, by), (bx + bw, by + corner_len)], fill=box_color, width=4)
            
            # Draw Pose Skeleton Keypoints (Head, Shoulders, Arms, Torso, Legs)
            head_x, head_y = bx + bw // 2, by + 18
            shoulder_l, shoulder_r = (bx + 12, by + 38), (bx + bw - 12, by + 38)
            hip_l, hip_r = (bx + 18, by + 82), (bx + bw - 18, by + 82)
            
            # Pose arm animation
            arm_swing = math.sin(t * 8.0) * (det.get('arm_velocity', 5.0))
            wrist_l = (shoulder_l[0] - 10, int(shoulder_l[1] + 25 + arm_swing))
            wrist_r = (shoulder_r[0] + 10, int(shoulder_r[1] + 25 - arm_swing))
            
            knee_l = (hip_l[0] - 5, by + 110)
            knee_r = (hip_r[0] + 5, by + 110)
            ankle_l = (knee_l[0] - 8, by + bh)
            ankle_r = (knee_r[0] + 8, by + bh)
            
            # Draw skeleton lines
            skeleton_color = (0, 230, 118) # Neon Green keypoints
            draw.ellipse([head_x - 8, head_y - 8, head_x + 8, head_y + 8], outline=skeleton_color, width=2)
            draw.line([shoulder_l, shoulder_r], fill=skeleton_color, width=2)
            draw.line([shoulder_l, wrist_l], fill=skeleton_color, width=2)
            draw.line([shoulder_r, wrist_r], fill=skeleton_color, width=2)
            draw.line([shoulder_l, hip_l], fill=skeleton_color, width=2)
            draw.line([shoulder_r, hip_r], fill=skeleton_color, width=2)
            draw.line([hip_l, hip_r], fill=skeleton_color, width=2)
            draw.line([hip_l, knee_l], fill=skeleton_color, width=2)
            draw.line([hip_r, knee_r], fill=skeleton_color, width=2)
            draw.line([knee_l, ankle_l], fill=skeleton_color, width=2)
            draw.line([knee_r, ankle_r], fill=skeleton_color, width=2)
            
            # Draw Label Tag Badge
            label_text = f"ID: {pid} | {det['confidence']*100:.0f}%"
            draw.rectangle([bx, by - 22, bx + bw, by], fill=box_color)
            draw.text((bx + 4, by - 18), label_text, fill=(10, 10, 15))

        # Top HUD Banner Overlay (CCTV Metadata)
        cam_meta = self.cameras.get(camera_id, {"name": camera_id, "location": "Zone 1"})
        timestamp_str = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(now))
        
        # Draw HUD bar background
        draw.rectangle([0, 0, self.frame_width, 32], fill=(15, 23, 42))
        draw.text((12, 8), f"● LIVE  [{camera_id}] {cam_meta['name'].upper()} - {cam_meta['location']}", fill=(0, 240, 255))
        draw.text((self.frame_width - 180, 8), f"FPS: 30.0 | {timestamp_str}", fill=(0, 230, 118))
        
        # Bottom AI Engine Status Banner
        draw.rectangle([0, self.frame_height - 24, self.frame_width, self.frame_height], fill=(15, 23, 42))
        draw.text((12, self.frame_height - 20), "AI ENGINE: YOLOv11 + BYTETRACK + MEDIAPIPE POSE [ONLINE]", fill=(148, 163, 184))

        # If Active Alert on this camera, draw pulsing Alert HUD overlay banner
        if active_alert:
            draw.rectangle([0, 32, self.frame_width, 68], fill=(255, 46, 77))
            draw.text((20, 42), f"⚠️ ALERT DETECTED: {active_alert['event_type'].upper()} | RISK: {active_alert['risk_level'].upper()} ({active_alert['risk_score']}%)", fill=(255, 255, 255))

        # Convert Image to JPEG bytes
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG", quality=85)
        jpeg_bytes = buffer.getvalue()
        
        return jpeg_bytes, detections

    def get_base64_snapshot(self, camera_id: str, active_alert: Optional[Dict] = None) -> str:
        """Helper to generate base64 data URI string for incident snapshots."""
        jpeg_bytes, _ = self.generate_frame(camera_id, active_alert=active_alert)
        encoded = base64.b64encode(jpeg_bytes).decode('utf-8')
        return f"data:image/jpeg;base64,{encoded}"
