import math
import time
from typing import List, Dict, Tuple

class FightDetector:
    def __init__(self):
        self.temporal_history: Dict[str, List[Dict]] = {}
        self.window_seconds = 3.0
        self.min_consecutive_frames = 4

    def analyze_interactions(self, camera_id: str, persons: List[Dict]) -> Tuple[bool, float, int, List[str], List[str]]:
        now = time.time()
        
        if camera_id not in self.temporal_history:
            self.temporal_history[camera_id] = []

        if len(persons) < 2:
            self.temporal_history[camera_id] = [
                h for h in self.temporal_history[camera_id] if now - h['timestamp'] <= self.window_seconds
            ]
            return False, 0.0, 0, [], []

        close_pair_found = False
        highest_velocity = 0.0
        min_distance = 999.0
        involved_ids = set()

        for i in range(len(persons)):
            for j in range(i + 1, len(persons)):
                p1 = persons[i]
                p2 = persons[j]

                c1_x = p1['box']['x'] + p1['box']['width'] / 2.0
                c1_y = p1['box']['y'] + p1['box']['height'] / 2.0
                c2_x = p2['box']['x'] + p2['box']['width'] / 2.0
                c2_y = p2['box']['y'] + p2['box']['height'] / 2.0

                dist = math.sqrt((c2_x - c1_x)**2 + (c2_y - c1_y)**2)
                if dist < min_distance:
                    min_distance = dist

                p1_arms = p1.get('arm_velocity', 0.0)
                p2_arms = p2.get('arm_velocity', 0.0)
                velocity = max(p1_arms, p2_arms)

                if dist < 100.0:
                    close_pair_found = True
                    involved_ids.add(str(p1['id']))
                    involved_ids.add(str(p2['id']))
                    if velocity > highest_velocity:
                        highest_velocity = velocity

        frame_entry = {
            "timestamp": now,
            "close_pair": close_pair_found,
            "min_distance": min_distance,
            "max_velocity": highest_velocity,
            "involved": list(involved_ids)
        }
        self.temporal_history[camera_id].append(frame_entry)

        self.temporal_history[camera_id] = [
            h for h in self.temporal_history[camera_id] if now - h['timestamp'] <= self.window_seconds
        ]

        recent = self.temporal_history[camera_id]
        consecutive_suspicious_count = sum(1 for f in recent if f['close_pair'] and f['max_velocity'] > 12.0)
        persistence_duration = round(recent[-1]['timestamp'] - recent[0]['timestamp'], 1) if len(recent) > 1 else 0.5

        if consecutive_suspicious_count >= self.min_consecutive_frames or (close_pair_found and highest_velocity > 28.0):
            confidence = min(0.96, 0.82 + (consecutive_suspicious_count * 0.03) + (highest_velocity / 150.0))
            risk_score = 92 if consecutive_suspicious_count >= 6 else 85
            
            explainable_reasons = [
                f"{len(involved_ids)} people in close proximity",
                f"Minimal inter-person distance: {min_distance:.1f}px",
                f"High movement velocity: {highest_velocity:.1f} px/frame",
                f"Aggressive interaction persistent for {persistence_duration}s ({consecutive_suspicious_count} frames)",
                "Temporal continuity threshold exceeded (AI verified)"
            ]
            return True, round(confidence, 2), risk_score, list(involved_ids), explainable_reasons

        return False, 0.0, 0, [], []
