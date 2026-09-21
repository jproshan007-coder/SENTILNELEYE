import React, { useState } from 'react';
import { Video, Flame, Zap, ShieldAlert, Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import { connectCameraSource, triggerDemoScenario } from '../services/api';

export default function DemoControlBar({ onOpenUploader }) {
  const [loadingAction, setLoadingAction] = useState(null);
  const [notification, setNotification] = useState(null);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleConnectWebcam = async () => {
    setLoadingAction('webcam');
    try {
      const res = await connectCameraSource('CAM-01', 'webcam');
      if (res.status === 'success') {
        showNotification('🎥 Webcam connected successfully to CAM-01!');
      } else {
        showNotification('⚠️ Webcam unavailable. Check webcam permissions.');
      }
    } catch (e) {
      showNotification('⚠️ Failed to connect webcam.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleTriggerScenario = async (scenario, camId, name) => {
    setLoadingAction(scenario);
    try {
      await triggerDemoScenario(scenario, camId);
      showNotification(`⚠️ Emergency alert triggered: ${name} on ${camId}`);
    } catch (e) {
      showNotification('Failed to trigger scenario');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="w-full bg-[#0A0E1A] border-b border-slate-800/80 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
      {/* Left Title */}
      <div className="flex items-center space-x-2">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
        </span>
        <span className="font-bold text-cyan-400 font-display uppercase tracking-wider">HACKATHON DEMO CONTROL PANEL:</span>
      </div>

      {/* Center Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Webcam Connect Button */}
        <button
          onClick={handleConnectWebcam}
          disabled={loadingAction === 'webcam'}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 border border-cyan-500/30 transition disabled:opacity-50"
        >
          <Video className="w-3.5 h-3.5 text-cyan-400" />
          <span>CONNECT WEBCAM (CAM-01)</span>
        </button>

        {/* Fight Simulation Button */}
        <button
          onClick={() => handleTriggerScenario('altercation', 'CAM-02', 'Fight / Physical Altercation')}
          disabled={loadingAction === 'altercation'}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/40 transition disabled:opacity-50 font-bold"
        >
          <Flame className="w-3.5 h-3.5 text-red-400 animate-pulse" />
          <span>SIMULATE FIGHT (CAM-02)</span>
        </button>

        {/* Intrusion Simulation Button */}
        <button
          onClick={() => handleTriggerScenario('intrusion', 'CAM-01', 'Restricted Area Intrusion')}
          disabled={loadingAction === 'intrusion'}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 transition disabled:opacity-50"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span>SIMULATE INTRUSION (CAM-01)</span>
        </button>

        {/* Running Simulation Button */}
        <button
          onClick={() => handleTriggerScenario('running', 'CAM-03', 'Suspicious Running')}
          disabled={loadingAction === 'running'}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 border border-yellow-500/40 transition disabled:opacity-50"
        >
          <Zap className="w-3.5 h-3.5 text-yellow-400" />
          <span>SIMULATE RUNNING (CAM-03)</span>
        </button>

        {/* Video Upload Button */}
        <button
          onClick={onOpenUploader}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition"
        >
          <Upload className="w-3.5 h-3.5 text-slate-300" />
          <span>UPLOAD VIDEO FILE</span>
        </button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="flex items-center space-x-2 text-cyan-300 bg-cyan-950/80 px-3 py-1 rounded-md border border-cyan-800 text-[11px] animate-fade-in">
          <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
          <span>{notification}</span>
        </div>
      )}
    </div>
  );
}
