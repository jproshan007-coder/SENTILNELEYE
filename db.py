import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "cctv_crime.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
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
            status TEXT DEFAULT 'Waiting Verification',
            details_json TEXT,
            bounding_box_json TEXT
        )
    """)
    
    # Restricted zones table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS restricted_zones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            camera_id TEXT NOT NULL,
            zone_name TEXT NOT NULL,
            points_json TEXT NOT NULL,
            enabled INTEGER DEFAULT 1
        )
    """)
    
    # System settings table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS system_settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            confidence_threshold REAL DEFAULT 0.75,
            dwell_threshold REAL DEFAULT 2.0,
            speed_threshold REAL DEFAULT 3.5,
            sound_enabled INTEGER DEFAULT 1,
            dark_mode INTEGER DEFAULT 1
        )
    """)

    cursor.execute("""
        INSERT OR IGNORE INTO system_settings (id, confidence_threshold, dwell_threshold, speed_threshold, sound_enabled, dark_mode)
        VALUES (1, 0.75, 2.0, 3.5, 1, 1)
    """)
    
    conn.commit()
    conn.close()
