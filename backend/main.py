import os
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.database.db import init_db
from backend.api.router import router as api_router
from backend.api.websocket import ws_router, ai_pipeline_background_loop

app = FastAPI(
    title="Smart CCTV Crime Detection AI API",
    description="Backend API & Real-time AI Vision Pipeline for CCTV Crime Detection",
    version="1.0.0"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API and WebSocket routers
app.include_router(api_router)
app.include_router(ws_router)

# Mount frontend build static files if available
FRONTEND_DIST = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
if os.path.exists(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Ignore API and WebSocket paths
        if full_path.startswith("api") or full_path.startswith("ws"):
            return None
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))

@app.on_event("startup")
async def startup_event():
    init_db()
    print("[Smart CCTV] Database initialized successfully.")
    asyncio.create_task(ai_pipeline_background_loop())
    print("[Smart CCTV] Real-time AI Vision Pipeline background loop active.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
