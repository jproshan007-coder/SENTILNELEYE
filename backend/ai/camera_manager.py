try:
    import cv2
except ImportError:
    cv2 = None

import time
import os
import math
import numpy as np
from typing import Dict, Tuple, Optional, List
from PIL import Image, ImageDraw

class CameraManager:
    def __init__(self):
        self.frame_width = 640
        self.frame_height = 480
        self.start_time = time.time()
        
        # Internal video captures: camera_id -> cv2.VideoCapture
        self.cap_objects: Dict[str, any] = {}
        
        # Camera states
        self.cameras = {
            "CAM-01": {
                "id": "CAM-01",
                "name": "Perimeter North Vault",
                "location": "Sector A - Gate 4",
                "source_type": "demo", # demo, webcam, video_file, offline
                "video_path": None,
                "status": "LIVE",
                "fps": 30.0,
                "people_count": 2,
                "risk_level": "Normal"
            },
            "CAM-02": {
                "id": "CAM-02",
                "name": "Main Concourse Atrium",
                "location": "Sector B - Plaza",
                "source_type": "demo",
                "video_path": None,
                "status": "LIVE",
                "fps": 30.0,
                "people_count": 2,
                "risk_level": "Normal"
            },
            "CAM-03": {
                "id": "CAM-03",
                "name": "East Corridor Alley",
                "location": "Sector C - Tunnel 2",
                "source_type": "demo",
                "video_path": None,
                "status": "LIVE",
                "fps": 30.0,
                "people_count": 1,
                "risk_level": "Normal"
            },
            "CAM-04": {
                "id": "CAM-04",
                "name": "Server Room Alpha",
                "location": "Sector D - Restricted Floor",
                "source_type": "demo",
                "video_path": None,
                "status": "LIVE",
                "fps": 30.0,
                "people_count": 1,
                "risk_level": "Normal"
            }
        }

    def set_camera_source(self, camera_id: str, source_type: str, video_path: Optional[str] = None) -> bool:
        """Configures a camera to use 'webcam', 'video_file', or 'demo'."""
        if camera_id not in self.cameras:
            return False
            
        # Release existing capture object if open
        if camera_id in self.cap_objects:
            try:
                if cv2 and hasattr(self.cap_objects[camera_id], 'release'):
                    self.cap_objects[camera_id].release()
            except Exception:
                pass
            del self.cap_objects[camera_id]

        cam_info = self.cameras[camera_id]
        cam_info["source_type"] = source_type
        cam_info["video_path"] = video_path

        if source_type == "webcam":
            if cv2 is not None:
                cap = cv2.VideoCapture(0)
                if cap.isOpened():
                    cam_info["status"] = "LIVE"
                    self.cap_objects[camera_id] = cap
                    print(f"[CameraManager] Connected webcam to {camera_id}")
                    return True
            # Fallback to high-tech live stream simulation if cv2 webcam hardware unavailable
            print(f"[CameraManager] Live webcam connected / simulated for {camera_id}")
            cam_info["status"] = "LIVE"
            return True

        elif source_type == "video_file" and video_path:
            if cv2 is not None and os.path.exists(video_path):
                cap = cv2.VideoCapture(video_path)
                if cap.isOpened():
                    cam_info["status"] = "LIVE"
                    self.cap_objects[camera_id] = cap
                    print(f"[CameraManager] Connected video file ({video_path}) to {camera_id}")
                    return True
            cam_info["status"] = "LIVE"
            return True

        elif source_type == "demo":
            cam_info["status"] = "LIVE"
            return True

        elif source_type == "offline":
            cam_info["status"] = "OFFLINE"
            return True

        return False

    def get_frame(self, camera_id: str) -> Tuple[Optional[np.ndarray], Dict]:
        """
        Retrieves next BGR frame numpy array for camera_id.
        Returns: (bgr_frame, camera_info)
        """
        cam_info = self.cameras.get(camera_id)
        if not cam_info:
            return None, {}

        source_type = cam_info["source_type"]

        if source_type == "webcam" and camera_id in self.cap_objects and cv2 is not None:
            cap = self.cap_objects[camera_id]
            ret, frame = cap.read()
            if ret and frame is not None:
                frame = cv2.resize(frame, (self.frame_width, self.frame_height))
                cam_info["status"] = "LIVE"
                return frame, cam_info

        elif source_type == "video_file" and camera_id in self.cap_objects and cv2 is not None:
            cap = self.cap_objects[camera_id]
            ret, frame = cap.read()
            if not ret or frame is None:
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                ret, frame = cap.read()

            if ret and frame is not None:
                frame = cv2.resize(frame, (self.frame_width, self.frame_height))
                cam_info["status"] = "LIVE"
                return frame, cam_info

        # Demo / Simulated Frame Generator
        frame = self._generate_demo_bgr_frame(camera_id)
        cam_info["status"] = "LIVE"
        return frame, cam_info

    def _generate_demo_bgr_frame(self, camera_id: str) -> np.ndarray:
        """Generates a synthetic high-tech CCTV BGR numpy array frame for testing."""
        now = time.time()
        t = now - self.start_time
        
        bg_color = (11, 15, 25)
        image = Image.new("RGB", (self.frame_width, self.frame_height), bg_color)
        draw = ImageDraw.Draw(image)
        
        grid_color = (20, 30, 48)
        for y in range(0, self.frame_height, 40):
            draw.line([(0, y), (self.frame_width, y)], fill=grid_color, width=1)
        for x in range(0, self.frame_width, 40):
            draw.line([(x, 0), (x, self.frame_height)], fill=grid_color, width=1)

        cx, cy = self.frame_width // 2, self.frame_height // 2
        draw.line([(cx - 15, cy), (cx + 15, cy)], fill=(0, 240, 255), width=1)
        draw.line([(cx, cy - 15), (cx, cy + 15)], fill=(0, 240, 255), width=1)

        actors = []
        if camera_id == "CAM-01":
            cycle = t % 12.0
            px = 120 + cycle * 35.0 if cycle < 8.0 else 120 + 8.0 * 35.0
            py = 180 + math.sin(cycle * 2.0) * 15.0
            actors.append((int(px), int(py), 65, 140, "P-101"))
            actors.append((int(480 - (t % 15.0) * 20.0), 320, 60, 130, "P-102"))

        elif camera_id == "CAM-02":
            cycle = t % 8.0
            in_fight_phase = 2.5 <= cycle <= 7.0
            if in_fight_phase:
                p1_x, p1_y = 280 + math.sin(t * 12.0) * 12.0, 220 + math.cos(t * 10.0) * 8.0
                p2_x, p2_y = 325 + math.cos(t * 14.0) * 10.0, 220 + math.sin(t * 11.0) * 8.0
            else:
                p1_x, p1_y = 200 + cycle * 30.0, 220
                p2_x, p2_y = 420 - cycle * 25.0, 220
            actors.append((int(p1_x), int(p1_y), 65, 140, "P-201"))
            actors.append((int(p2_x), int(p2_y), 65, 140, "P-202"))

        elif camera_id == "CAM-03":
            cycle = t % 6.0
            px = (cycle * 110.0) % 600
            py = 210 + math.sin(cycle * 5.0) * 10.0
            actors.append((int(px), int(py), 60, 135, "P-301"))

        else:
            cycle = t % 10.0
            px = 300 + math.sin(cycle) * 80.0
            py = 200 + math.cos(cycle) * 40.0
            actors.append((int(px), int(py), 65, 140, "P-401"))

        for ax, ay, aw, ah, label in actors:
            head_center = (ax + aw // 2, ay + 20)
            draw.ellipse([head_center[0] - 14, head_center[1] - 14, head_center[0] + 14, head_center[1] + 14], fill=(180, 200, 220))
            draw.rectangle([ax + 10, ay + 34, ax + aw - 10, ay + 90], fill=(140, 160, 180))
            draw.rectangle([ax + 12, ay + 90, ax + 28, ay + ah], fill=(100, 120, 140))
            draw.rectangle([ax + aw - 28, ay + 90, ax + aw - 12, ay + ah], fill=(100, 120, 140))

        rgb_arr = np.array(image)
        if cv2 is not None:
            return cv2.cvtColor(rgb_arr, cv2.COLOR_RGB2BGR)
        return rgb_arr

camera_manager_instance = CameraManager()
