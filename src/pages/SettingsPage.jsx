import React, { useState, useEffect } from 'react';
import { fetchSettings, saveSettings } from '../services/api';
import { CAMERAS_LIST } from '../components/CameraGrid';
import { Sliders, Save, CheckCircle, Edit3, Shield, Bell, Moon } from 'lucide-react';

export default function SettingsPage({ onSelectZoneEdit, soundEnabled, setSoundEnabled }) {
  const [settings, setSettings] = useState({
    confidence_threshold: 0.75,
    dwell_threshold: 2.0,
    speed_threshold: 3.5,
    sound_enabled: true,
    dark_mode: true
  });
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const s = await fetchSettings();
        setSettings(s);
      } catch (e) {
        console.error("Failed to fetch settings", e);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    try {
      await saveSettings(settings);
      setSoundEnabled(settings.sound_enabled);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (e) {
      alert("Failed to save settings: " + e.message);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="font-display font-bold text-lg text-white tracking-wider flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" /> SYSTEM & AI PARAMETER SETTINGS
          </h2>
          <p className="text-xs font-mono text-slate-400">
            Tune computer vision thresholds, intrusion timers, running speed parameters & restricted zone geometry.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-cyan-500 text-black font-extrabold font-mono text-xs hover:bg-cyan-400 transition shadow-lg shadow-cyan-500/20"
        >
          <Save className="w-4 h-4" />
          <span>{isSaved ? "SETTINGS SAVED!" : "SAVE CONFIGURATION"}</span>
        </button>
      </div>

      {/* AI Model Detection Thresholds */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
        <h3 className="font-display font-bold text-sm text-cyan-400 uppercase tracking-wider flex items-center gap-2">
          <Shield className="w-4 h-4" /> AI BEHAVIOR ENGINE THRESHOLDS
        </h3>

        <div className="space-y-5">
          {/* Confidence Threshold */}
          <div className="space-y-2">
            <div className="flex justify-between font-mono text-xs">
              <label className="text-slate-200 font-bold">Detection Confidence Threshold:</label>
              <span className="text-cyan-400 font-bold">{(settings.confidence_threshold * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.50"
              max="0.95"
              step="0.05"
              value={settings.confidence_threshold}
              onChange={(e) => setSettings({ ...settings, confidence_threshold: parseFloat(e.target.value) })}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <p className="text-[10px] font-mono text-slate-500">
              Minimum YOLO/MediaPipe confidence score required before triggering alerts.
            </p>
          </div>

          {/* Dwell Time Threshold */}
          <div className="space-y-2">
            <div className="flex justify-between font-mono text-xs">
              <label className="text-slate-200 font-bold">Unauthorized Zone Dwell Time Threshold:</label>
              <span className="text-amber-400 font-bold">{settings.dwell_threshold} Seconds</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="10.0"
              step="0.5"
              value={settings.dwell_threshold}
              onChange={(e) => setSettings({ ...settings, dwell_threshold: parseFloat(e.target.value) })}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <p className="text-[10px] font-mono text-slate-500">
              Duration a person must linger inside a restricted zone to trigger High Risk Intrusion alert.
            </p>
          </div>

          {/* Running Speed Threshold */}
          <div className="space-y-2">
            <div className="flex justify-between font-mono text-xs">
              <label className="text-slate-200 font-bold">Suspicious Running Speed Threshold:</label>
              <span className="text-yellow-400 font-bold">{settings.speed_threshold} m/s</span>
            </div>
            <input
              type="range"
              min="1.5"
              max="8.0"
              step="0.5"
              value={settings.speed_threshold}
              onChange={(e) => setSettings({ ...settings, speed_threshold: parseFloat(e.target.value) })}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-400"
            />
            <p className="text-[10px] font-mono text-slate-500">
              Movement velocity threshold for detecting rapid running or sudden acceleration.
            </p>
          </div>
        </div>
      </div>

      {/* Restricted Zone Perimeter Editor */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <h3 className="font-display font-bold text-sm text-cyan-400 uppercase tracking-wider flex items-center gap-2">
          <Edit3 className="w-4 h-4" /> CAMERA RESTRICTED ZONE EDITOR
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CAMERAS_LIST.map((cam) => (
            <div
              key={cam.id}
              className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center"
            >
              <div>
                <span className="text-xs font-mono font-bold text-cyan-400">{cam.id}</span>
                <h4 className="font-display font-bold text-xs text-white">{cam.name}</h4>
                <p className="text-[10px] font-mono text-slate-500">{cam.location}</p>
              </div>

              <button
                onClick={() => onSelectZoneEdit && onSelectZoneEdit(cam)}
                className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/30 font-mono text-xs font-bold transition"
              >
                DRAW ZONE
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* System Preferences */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <h3 className="font-display font-bold text-sm text-cyan-400 uppercase tracking-wider flex items-center gap-2">
          <Bell className="w-4 h-4" /> NOTIFICATIONS & INTERFACE
        </h3>

        <div className="flex items-center justify-between py-2 border-b border-slate-800/60 font-mono text-xs">
          <span className="text-slate-200">Audio Alarm Synth Sound Effects:</span>
          <button
            onClick={() => setSettings({ ...settings, sound_enabled: !settings.sound_enabled })}
            className={`px-4 py-1.5 rounded-xl font-bold transition ${
              settings.sound_enabled ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {settings.sound_enabled ? 'ENABLED' : 'MUTED'}
          </button>
        </div>

        <div className="flex items-center justify-between py-2 font-mono text-xs">
          <span className="text-slate-200">Cybersecurity Dark Theme (Glassmorphism):</span>
          <span className="text-cyan-400 font-bold flex items-center gap-1">
            <Moon className="w-4 h-4" /> ACTIVE (DARK MODE)
          </span>
        </div>
      </div>
    </div>
  );
}
