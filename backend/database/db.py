import sqlite3
import os
from pathlib import Path

DB_PATH = Path(__file__).parent / "cctv_crime.db"

def get_db_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Incidents table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS incidents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        camera_id TEXT NOT NULL,
        camera_name TEXT NOT NULL,
        event_type TEXT NOT NULL,
        risk_level TEXT NOT NULL,
        risk_score INTEGER NOT NULL,
        confidence REAL NOT NULL,
        person_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        snapshot_url TEXT,
        status TEXT NOT NULL DEFAULT 'Waiting Verification',
        details_json TEXT,
        bounding_box_json TEXT
    );
    """)

    # Restricted zones table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS restricted_zones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        camera_id TEXT NOT NULL,
        zone_name TEXT NOT NULL,
        points_json TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1
    );
    """)

    # System settings table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS system_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        confidence_threshold REAL NOT NULL DEFAULT 0.75,
        dwell_threshold REAL NOT NULL DEFAULT 2.0,
        speed_threshold REAL NOT NULL DEFAULT 3.5,
        sound_enabled INTEGER NOT NULL DEFAULT 1,
        dark_mode INTEGER NOT NULL DEFAULT 1
    );
    """)

    # Seed initial settings if table empty
    cursor.execute("SELECT COUNT(*) FROM system_settings;")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO system_settings (id, confidence_threshold, dwell_threshold, speed_threshold, sound_enabled, dark_mode)
        VALUES (1, 0.75, 2.0, 3.5, 1, 1);
        """)

    # Seed initial default restricted zones if empty
    cursor.execute("SELECT COUNT(*) FROM restricted_zones;")
    if cursor.fetchone()[0] == 0:
        # Default zone for Camera 1 (Perimeter Entry)
        cam1_points = '[{"x": 0.15, "y": 0.2}, {"x": 0.55, "y": 0.2}, {"x": 0.55, "y": 0.75}, {"x": 0.15, "y": 0.75}]'
        cursor.execute("INSERT INTO restricted_zones (camera_id, zone_name, points_json, enabled) VALUES (?, ?, ?, 1);",
                       ("CAM-01", "Perimeter Vault Access", cam1_points))
        
        # Default zone for Camera 4 (Server Room Access)
        cam4_points = '[{"x": 0.4, "y": 0.3}, {"x": 0.9, "y": 0.3}, {"x": 0.9, "y": 0.85}, {"x": 0.4, "y": 0.85}]'
        cursor.execute("INSERT INTO restricted_zones (camera_id, zone_name, points_json, enabled) VALUES (?, ?, ?, 1);",
                       ("CAM-04", "Server Room Restricted Zone", cam4_points))

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully.")
