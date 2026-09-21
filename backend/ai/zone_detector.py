import time
from typing import List, Dict, Tuple, Optional

class Point:
    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y

def is_point_in_polygon(point: Point, polygon: List[Point]) -> bool:
    """Ray-casting algorithm for point-in-polygon testing."""
    num_vertices = len(polygon)
    if num_vertices < 3:
        return False
    
    inside = False
    p1 = polygon[0]
    for i in range(num_vertices + 1):
        p2 = polygon[i % num_vertices]
        if point.y > min(p1.y, p2.y):
            if point.y <= max(p1.y, p2.y):
                if point.x <= max(p1.x, p2.x):
                    if p1.y != p2.y:
                        xinters = (point.y - p1.y) * (p2.x - p1.x) / (p2.y - p1.y) + p1.x
                    if p1.x == p2.x or point.x <= xinters:
                        inside = not inside
        p1 = p2
    return inside

class ZoneDetector:
    def __init__(self):
        # track_id -> start_time
        self.entry_times: Dict[str, float] = {}
        # track_id -> total_dwell_time
        self.dwell_times: Dict[str, float] = {}

    def process_person(self, track_id: str, person_box: Dict[str, float], polygon_pts: List[Dict[str, float]], dwell_threshold: float = 2.0) -> Tuple[bool, float, List[str]]:
        """
        Evaluates whether a person's center is inside a restricted zone and has lingered > dwell_threshold.
        Returns: (is_alert, dwell_duration, explainable_reasons)
        """
        cx = (person_box['x'] + person_box['width'] / 2.0) / 640.0
        cy = (person_box['y'] + person_box['height']) / 480.0
        
        poly = [Point(p['x'], p['y']) for p in polygon_pts]
        inside = is_point_in_polygon(Point(cx, cy), poly)
        
        now = time.time()
        if inside:
            if track_id not in self.entry_times:
                self.entry_times[track_id] = now
            
            dwell_duration = now - self.entry_times[track_id]
            self.dwell_times[track_id] = dwell_duration
            
            is_alert = dwell_duration >= dwell_threshold
            reasons = [
                f"Subject {track_id} entered restricted perimeter zone",
                f"Dwell time: {dwell_duration:.1f}s (Threshold: {dwell_threshold:.1f}s)",
                f"Unauthorized presence detected inside geo-fence",
                "Human operator verification required"
            ] if is_alert else []

            return is_alert, round(dwell_duration, 1), reasons
        else:
            if track_id in self.entry_times:
                del self.entry_times[track_id]
            if track_id in self.dwell_times:
                del self.dwell_times[track_id]
            return False, 0.0, []
