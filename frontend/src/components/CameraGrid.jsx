import React, { useState } from 'react';
import CameraFeed from './CameraFeed';
import { Grid, Minimize2 } from 'lucide-react';

export const CAMERAS_LIST = [
  { id: "CAM-01", name: "Perimeter North Vault", location: "Sector A - Gate 4" },
  { id: "CAM-02", name: "Main Concourse Atrium", location: "Sector B - Plaza" },
  { id: "CAM-03", name: "East Corridor Alley", location: "Sector C - Tunnel 2" },
  { id: "CAM-04", name: "Server Room Alpha", location: "Sector D - Restricted Floor" }
];

export default function CameraGrid({ activeAlertsMap = {}, onSelectZoneEdit }) {
  const [maximizedCam, setMaximizedCam] = useState(null);

  if (maximizedCam) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center space-x-2 font-mono text-sm">
            <span className="text-cyan-400 font-bold">FOCUS MODE:</span>
            <span className="text-slate-200">[{maximizedCam.id}] {maximizedCam.name}</span>
          </div>
          <button
            onClick={() => setMaximizedCam(null)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/40 font-mono text-xs transition"
          >
            <Minimize2 className="w-4 h-4" />
            <span>GRID VIEW</span>
          </button>
        </div>

        <div className="w-full">
          <CameraFeed
            camera={maximizedCam}
            activeAlert={activeAlertsMap[maximizedCam.id]}
            onSelectZoneEdit={onSelectZoneEdit}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Section Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 font-display font-bold text-sm text-cyan-400 uppercase tracking-wider">
          <Grid className="w-4 h-4" />
          <span>SURVEILLANCE MATRIX (4 FEEDS)</span>
        </div>
        <span className="text-xs font-mono text-slate-400">FPS: 30.0 | AI: ONLINE</span>
      </div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CAMERAS_LIST.map((cam) => (
          <CameraFeed
            key={cam.id}
            camera={cam}
            activeAlert={activeAlertsMap[cam.id]}
            onSelectZoneEdit={onSelectZoneEdit}
            onMaximize={(c) => setMaximizedCam(c)}
          />
        ))}
      </div>
    </div>
  );
}
