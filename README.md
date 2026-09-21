# 🛡️ SMART CCTV CRIME DETECTION AI (SENTINEL EYE)

A full-stack AI security command center application designed for real-time surveillance monitoring, physical altercation detection, restricted area intrusion detection, suspicious running identification, and automated emergency alerting.

---

## 🌟 Key Features

1. **4-Camera Surveillance Matrix (`CAM-01` to `CAM-04`)**:
   - 2x2 camera grid wall UI with high-contrast cyber blue-black styling.
   - Real-time FPS telemetry, person count indicators, and laser restricted-zone bounding boxes.
   - Focus mode for single-camera expansion.

2. **Multi-Mode Camera Input Manager**:
   - **Mode A — Live Laptop Webcam**: Connect laptop webcam (`cv2.VideoCapture`) directly to `CAM-01`.
   - **Mode B — Video Upload & AI Analysis**: Upload MP4, AVI, MOV, or WebM files to any camera feed (`CAM-01` to `CAM-04`) for frame extraction and computer vision processing.
   - **Mode C — High-Tech Demo Streams**: Synthetic streams with animated human actors, MediaPipe pose keypoints, and HUD crosshairs.

3. **AI Computer Vision & Behavior Analysis Pipeline**:
   - **Physical Altercation / Fight Detection**: Multi-person proximity matrix ($d < 100\text{px}$) + relative motion velocity calculation persistent across consecutive frames ($N = 4\text{--}8$ frames).
   - **Restricted Area Intrusion**: Point-in-polygon ray-casting algorithm with dwell-time tracking.
   - **Suspicious Running**: Spatial velocity calculation with cardinal movement direction vectors.
   - **Risk Scoring**: Configurable 0–100 risk score engine (Normal, Suspicious, High, Critical).
   - **Explainable AI (XAI)**: Diagnostic breakdown detailing *why* an alert was generated (e.g. proximity distance, velocity, duration).

4. **Emergency Alerts, Highlighting & Voice Announcements**:
   - **Automated Highlighting**: High-risk camera card pulses with an animated crimson emergency border and `CRITICAL ALERT` badge.
   - **Web Audio Siren Alarm**: Synthesized multi-tone alarm chime.
   - **Dynamic Text-to-Speech**: Browser SpeechSynthesis dynamically announces vocal warnings (*"Emergency. Possible physical altercation detected on Camera 2."*).

5. **Human Verification & SQLite Audit Trail**:
   - Operator review modal with `[CONFIRM INCIDENT]` and `[REJECT / FALSE POSITIVE]` buttons.
   - Saves all incidents, explainable metrics, snapshots, and verification logs to SQLite (`cctv_crime.db`) with 1-click CSV audit log export.

6. **Hackathon Presentation Control Bar**:
   - Quick one-click buttons at the top of the dashboard for testing live scenarios: `CONNECT WEBCAM`, `SIMULATE FIGHT`, `SIMULATE INTRUSION`, `SIMULATE RUNNING`, and `UPLOAD VIDEO FILE`.

---

## 🛠️ Project Structure

```
/smart_cctv_crime_detection
├── backend/
│   ├── ai/
│   │   ├── camera_manager.py    # Multi-mode input manager (Webcam, Video, Demo)
│   │   ├── fight_detector.py    # Multi-person proximity & interaction engine
│   │   ├── zone_detector.py     # Restricted area intrusion & polygon geofence
│   │   ├── speed_detector.py    # Spatial velocity & direction tracking
│   │   └── pipeline.py          # Unified AI vision pipeline & frame overlay renderer
│   ├── api/
│   │   ├── router.py            # REST API (Cameras, Incidents, Uploads, Settings)
│   │   └── websocket.py         # Real-time WebSocket alerts & MJPEG stream server
│   ├── database/
│   │   └── db.py                # SQLite database connection & schema initialization
│   ├── main.py                  # FastAPI application entry point & static server
│   └── requirements.txt         # Backend Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/          # React UI components (CameraFeed, CameraGrid, AlertModal, etc.)
│   │   ├── pages/               # Dashboard, Cameras, Alerts, History, Settings pages
│   │   ├── services/            # API, WebSocket, and Web Audio API services
│   │   ├── App.jsx              # Main React application entry & TTS controller
│   │   └── index.css            # Tailwind CSS design system & cyber dark theme
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Start Backend & Unified Server

```bash
# Navigate to backend directory and activate virtual environment
cd backend
source venv/bin/activate

# Install dependencies if needed
pip install -r requirements.txt

# Launch FastAPI server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

### 2. Access the Application

Open your browser at **`http://localhost:8000`** to access the Smart CCTV Command Center.
