import React, { useState, useEffect, useRef } from 'react';
import { saveZone, fetchZone } from '../services/api';
import { Save, Trash2, CheckCircle, Edit3, X } from 'lucide-react';

export default function ZoneDrawer({ camera, onClose, onZoneSaved }) {
  const canvasRef = useRef(null);
  const [points, setPoints] = useState([]);
  const [isSaved, setIsSaved] = useState(false);
  const [zoneName, setZoneName] = useState(`${camera.name} Restricted Zone`);

  // Load existing zone points
  useEffect(() => {
    async function loadExisting() {
      try {
        const zone = await fetchZone(camera.id);
        if (zone && zone.points) {
          setPoints(zone.points);
          if (zone.zone_name) setZoneName(zone.zone_name);
        }
      } catch (e) {
        console.error("Failed to fetch zone", e);
      }
    }
    loadExisting();
  }, [camera.id]);

  // Draw points on canvas overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.parentElement.clientWidth || 640;
    const height = canvas.height = canvas.parentElement.clientHeight || 480;

    ctx.clearRect(0, 0, width, height);

    if (points.length > 0) {
      ctx.beginPath();
      const firstPx = { x: points[0].x * width, y: points[0].y * height };
      ctx.moveTo(firstPx.x, firstPx.y);

      points.forEach((p, idx) => {
        const px = p.x * width;
        const py = p.y * height;
        if (idx > 0) ctx.lineTo(px, py);

        // Draw vertex circle
        ctx.fillStyle = '#FF2E4D';
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      if (points.length >= 3) {
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 46, 77, 0.25)';
        ctx.fill();
      }

      ctx.strokeStyle = '#FF2E4D';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
  }, [points]);

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setPoints([...points, { x: roundNorm(x), y: roundNorm(y) }]);
    setIsSaved(false);
  };

  const roundNorm = (val) => Math.round(val * 1000) / 1000;

  const handleClear = () => {
    setPoints([]);
    setIsSaved(false);
  };

  const handleSave = async () => {
    if (points.length < 3) {
      alert("A restricted zone polygon must have at least 3 points.");
      return;
    }
    try {
      await saveZone(camera.id, zoneName, points, true);
      setIsSaved(true);
      if (onZoneSaved) onZoneSaved();
    } catch (e) {
      alert("Failed to save zone: " + e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl glass-panel rounded-2xl border border-cyan-500/40 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Edit3 className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="font-display font-bold text-sm text-white uppercase">
                RESTRICTED ZONE EDITOR - {camera.id}
              </h3>
              <p className="text-xs font-mono text-slate-400">
                Click on video feed to place vertices & draw security perimeter polygon.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Editor Body */}
        <div className="p-6 space-y-4">
          <div className="flex gap-4 items-center">
            <input
              type="text"
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
              placeholder="Zone Name"
            />
            <span className="text-xs font-mono text-slate-400">VERTICES: {points.length}</span>
          </div>

          {/* Canvas Drawer Wrapper */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-cyan-500/30 bg-slate-950">
            <img
              src={`/api/stream/${camera.id}`}
              alt="Camera Feed Background"
              className="w-full h-full object-cover opacity-60"
            />
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              className="absolute inset-0 w-full h-full cursor-crosshair z-20"
            />
            <div className="absolute top-3 left-3 px-3 py-1 rounded bg-black/80 font-mono text-xs text-cyan-400 backdrop-blur-md">
              MODE: CLICK TO PLACE POLYGON POINT
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
          <button
            onClick={handleClear}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-mono text-xs transition"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
            <span>CLEAR POINTS</span>
          </button>

          <div className="flex items-center space-x-3">
            {isSaved && (
              <span className="flex items-center space-x-1 text-xs font-mono text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                <span>ZONE SAVED TO AI ENGINE</span>
              </span>
            )}
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-cyan-500 text-black font-extrabold hover:bg-cyan-400 font-mono text-xs transition shadow-lg shadow-cyan-500/20"
            >
              <Save className="w-4 h-4" />
              <span>SAVE RESTRICTED ZONE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
