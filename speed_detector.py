import math
from typing import Dict, List, Tuple

class SpeedDetector:
    def __init__(self):
        self.history: Dict[str, List[Tuple[float, float, float]]] = {}

    def get_cardinal_direction(self, dx: float, dy: float) -> str:
        if abs(dx) < 0.1 and abs(dy) < 0.1:
            return "STATIONARY"
        
        angle = math.atan2(-dy, dx)
        deg = math.degrees(angle) % 360
        
        if 22.5 <= deg < 67.5:
            return "NORTH-EAST"
        elif 67.5 <= deg < 112.5:
            return "NORTH"
        elif 112.5 <= deg < 157.5:
            return "NORTH-WEST"
        elif 157.5 <= deg < 202.5:
            return "WEST"
        elif 202.5 <= deg < 247.5:
            return "SOUTH-WEST"
        elif 247.5 <= deg < 292.5:
            return "SOUTH"
        elif 292.5 <= deg < 337.5:
            return "SOUTH-EAST"
        else:
            return "EAST"

    def process_movement(self, track_id: str, current_x: float, current_y: float, timestamp: float, speed_threshold: float = 3.5) -> Tuple[bool, float, str, float, int, List[str]]:
        if track_id not in self.history:
            self.history[track_id] = []
        
        self.history[track_id].append((current_x, current_y, timestamp))
        if len(self.history[track_id]) > 10:
            self.history[track_id].pop(0)
            
        if len(self.history[track_id]) < 3:
            return False, 1.2, "EAST", 0.85, 10, []

        first = self.history[track_id][0]
        last = self.history[track_id][-1]
        dt = last[2] - first[2]
        
        if dt <= 0.05:
            return False, 1.2, "EAST", 0.85, 10, []

        dx = last[0] - first[0]
        dy = last[1] - first[1]
        dist_px = math.sqrt(dx**2 + dy**2)
        
        speed_m_s = round((dist_px / dt) * 0.035, 1)
        direction = self.get_cardinal_direction(dx, dy)
        
        is_running = speed_m_s >= speed_threshold
        confidence = round(min(0.96, 0.78 + (speed_m_s / 10.0)), 2)
        risk_score = min(75, int(45 + (speed_m_s - speed_threshold) * 8)) if is_running else 15

        reasons = [
            f"Person velocity measured at {speed_m_s} m/s (Threshold: {speed_threshold} m/s)",
            f"Direction vector: {direction}",
            f"Rapid spatial displacement across consecutive frames",
            "Potential evasion / panic movement pattern"
        ] if is_running else []

        return is_running, speed_m_s, direction, confidence, risk_score, reasons
