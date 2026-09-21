import React, { useState, useEffect } from 'react';
import { Shield, Radio, Clock, Cpu, Volume2, VolumeX, AlertTriangle } from 'lucide-react';

export default function Navbar({ soundEnabled, setSoundEnabled, threatLevel = 'MEDIUM' }) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString() + ' | ' + now.toLocaleDateString());
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const getThreatBadge = () => {
    switch (threatLevel) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
    }
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-[#0A0E1A]/90 backdrop-blur-md px-6 flex items-center justify-between z-40 sticky top-0">
      {/* Brand & Logo */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/40">
          <Shield className="w-6 h-6 text-black fill-cyan-300 stroke-cyan-900" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-display font-bold text-lg text-white tracking-wider">AEGIS<span className="text-cyan-400">VISION</span> AI</h1>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              v1.0 SURVEILLANCE
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono">Smart CCTV Crime Detection System</p>
        </div>
      </div>

      {/* Center Metrics & Telemetry */}
      <div className="hidden md:flex items-center space-x-6">
        {/* Live Status Indicator */}
        <div className="flex items-center space-x-2 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-mono text-emerald-400 font-medium">SYSTEM ACTIVE - 4/4 FEEDS</span>
        </div>

        {/* AI Model Badge */}
        <div className="flex items-center space-x-2 bg-slate-900/80 px-3 py-1.5 rounded-full border border-cyan-900/50">
          <Cpu className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
          <span className="text-xs font-mono text-cyan-300">YOLOv11 + ByteTrack + MediaPipe</span>
        </div>

        {/* Threat Level */}
        <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border font-mono text-xs ${getThreatBadge()}`}>
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>THREAT LEVEL: {threatLevel}</span>
        </div>
      </div>

      {/* Right Tools & Clock */}
      <div className="flex items-center space-x-4">
        {/* Clock */}
        <div className="hidden lg:flex items-center space-x-2 font-mono text-xs text-slate-300 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{timeStr}</span>
        </div>

        {/* Audio Mute/Unmute */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-2 rounded-lg border transition-all ${
            soundEnabled
              ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/20'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
          title={soundEnabled ? "Mute Alert Alarms" : "Unmute Alert Alarms"}
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
}
