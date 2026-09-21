import React, { useState } from 'react';
import { Maximize2, ShieldAlert, Edit3, Camera } from 'lucide-react';

export default function CameraFeed({ camera, activeAlert, onSelectZoneEdit, onMaximize }) {
  const [imageError, setImageError] = useState(false);

  const streamUrl = `/api/stream/${camera.id}`;

  const getBorderColor = () => {
    if (!activeAlert) return 'border-slate-800 hover:border-cyan-500/50';
    switch (activeAlert.risk_level) {
      case 'Critical':
        return 'border-red-500 shadow-lg shadow-red-500/20 glow-red animate-pulse';
      case 'High':
        return 'border-amber-500 shadow-lg shadow-amber-500/20 glow-yellow';
      case 'Medium':
        return 'border-yellow-500 shadow-lg shadow-yellow-500/20';
      default:
        return 'border-cyan-500/60';
    }
  };

  return (
    <div className={`relative group rounded-2xl overflow-hidden glass-panel border transition-all duration-300 flex flex-col justify-between ${getBorderColor()}`}>
      {/* Top Overlay Banner */}
      <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-[#0A0E1A]/90 to-transparent z-20 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
            {camera.id}
          </span>
          <div>
            <h4 className="font-display text-xs font-bold text-white tracking-wide">{camera.name}</h4>
            <p className="text-[10px] font-mono text-slate-400">{camera.location}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Status badge */}
          <div className="flex items-center space-x-1.5 bg-slate-900/90 px-2.5 py-1 rounded-full border border-slate-800 text-[10px] font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-emerald-400 font-semibold">30 FPS</span>
          </div>

          {/* Action buttons */}
          {onSelectZoneEdit && (
            <button
              onClick={() => onSelectZoneEdit(camera)}
              className="p-1.5 rounded-lg bg-slate-900/80 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 border border-slate-700 transition"
              title="Edit Restricted Zone"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}

          {onMaximize && (
            <button
              onClick={() => onMaximize(camera)}
              className="p-1.5 rounded-lg bg-slate-900/80 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 border border-slate-700 transition"
              title="Maximize Camera"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Video Stream Container */}
      <div className="relative w-full aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
        {!imageError ? (
          <img
            src={streamUrl}
            alt={`CCTV Feed ${camera.id}`}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-2 text-slate-500 font-mono">
            <Camera className="w-10 h-10 text-slate-600 animate-pulse" />
            <p className="text-xs">CONNECTING AI STREAM ({camera.id})...</p>
          </div>
        )}

        {/* Scanline CRT overlay */}
        <div className="absolute inset-0 pointer-events-none scanline-overlay opacity-30" />

        {/* Alert Alert Banner Overlay */}
        {activeAlert && (
          <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl bg-red-600/90 text-white backdrop-blur-md border border-red-400 z-20 flex items-center justify-between animate-bounce">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-white" />
              <div>
                <p className="text-xs font-bold font-display uppercase tracking-wider">{activeAlert.event_type}</p>
                <p className="text-[10px] font-mono text-red-100">
                  Risk: {activeAlert.risk_level} ({activeAlert.risk_score}%) | ID: {activeAlert.person_id}
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white text-red-600 font-extrabold uppercase">
              ACTION REQ
            </span>
          </div>
        )}
      </div>

      {/* Bottom Telemetry Bar */}
      <div className="px-3 py-2 bg-[#0A0E1A] border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          AI: YOLOv11 + ByteTrack
        </span>
        <span className="text-slate-500">RES: 1080p @ 60Hz</span>
      </div>
    </div>
  );
}
