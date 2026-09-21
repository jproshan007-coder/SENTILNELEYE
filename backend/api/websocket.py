import asyncio
import json
import time
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from typing import List
from backend.ai.pipeline import pipeline_instance

ws_router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()

@ws_router.websocket("/ws/alerts")
async def websocket_alerts_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

async def ai_pipeline_background_loop():
    """Continuously runs the AI detection pipeline and broadcasts live alerts."""
    cameras = ["CAM-01", "CAM-02", "CAM-03", "CAM-04"]
    while True:
        try:
            for cam_id in cameras:
                alert = pipeline_instance.process_camera(cam_id)
                if alert:
                    await manager.broadcast({
                        "type": "NEW_ALERT",
                        "data": alert
                    })
            await asyncio.sleep(0.5)
        except Exception as e:
            print(f"AI Pipeline background loop error: {e}")
            await asyncio.sleep(1.0)

def mjpeg_frame_generator(camera_id: str):
    """Generates real-time MJPEG stream for camera feeds."""
    while True:
        jpeg_bytes = pipeline_instance.render_frame_with_overlays(camera_id)
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + jpeg_bytes + b'\r\n')
        time.sleep(0.04) # ~25 FPS stream tick

@ws_router.get("/api/stream/{camera_id}")
def video_feed_stream(camera_id: str):
    return StreamingResponse(
        mjpeg_frame_generator(camera_id),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )
