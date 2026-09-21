import React, { useState } from 'react';
import CameraGrid, { CAMERAS_LIST } from '../components/CameraGrid';
import CameraFeed from '../components/CameraFeed';
import { Video, Edit3, Settings } from 'lucide-react';

export default function CamerasPage({ activeAlertsMap, onSelectZoneEdit }) {
  const [selectedCam, setSelectedCam] = useState(CAMERAS_LIST[0]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="font-display font-bold text-lg text-white tracking-wider flex items-center gap-2">
            <Video className="w-5 h-5 text-cyan-400" /> CAMERA MANAGEMENT & ZONE CONFIGURATION
          </h2>
          <p className="text-xs font-mono text-slate-400">
            Select individual CCTV camera feeds to inspect high-definition video telemetry or draw restricted zone boundaries.
          </p>
        </div>

        <div className="flex gap-2">
          {CAMERAS_LIST.map((cam) => (
            <button
              key={cam.id}
              onClick={() => setSelectedCam(cam)}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition ${
                selectedCam.id === cam.id
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cam.id}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Expanded Camera View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <CameraFeed
            camera={selectedCam}
            activeAlert={activeAlertsMap[selectedCam.id]}
            onSelectZoneEdit={onSelectZoneEdit}
          />
        </div>

        {/* Camera Info Panel */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
              {selectedCam.id}
            </span>
            <h3 className="font-display font-bold text-base text-white mt-1">{selectedCam.name}</h3>
            <p className="text-xs font-mono text-slate-400">{selectedCam.location}</p>
          </div>

          <div className="space-y-2 font-mono text-xs text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-500">AI DETECTOR:</span>
              <span className="text-cyan-400 font-bold">YOLOv11 Person + Pose</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-500">TRACKER:</span>
              <span className="text-cyan-400 font-bold">ByteTrack ID Persistence</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-500">ZONE STATUS:</span>
              <span className="text-emerald-400 font-bold">ACTIVE POLYGON</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">STREAM LATENCY:</span>
              <span className="text-emerald-400 font-bold">18.4 ms</span>
            </div>
          </div>

          <button
            onClick={() => onSelectZoneEdit && onSelectZoneEdit(selectedCam)}
            className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-cyan-500 text-black font-extrabold font-mono text-xs hover:bg-cyan-400 transition shadow-lg shadow-cyan-500/20"
          >
            <Edit3 className="w-4 h-4" />
            <span>EDIT RESTRICTED ZONE FOR {selectedCam.id}</span>
          </button>
        </div>
      </div>

      {/* Grid of all feeds */}
      <CameraGrid
        activeAlertsMap={activeAlertsMap}
        onSelectZoneEdit={onSelectZoneEdit}
      />
    </div>
  );
}
