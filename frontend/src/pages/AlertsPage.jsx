import React, { useState } from 'react';
import LiveAlerts from '../components/LiveAlerts';
import { ShieldAlert, Volume2, VolumeX, CheckCircle2, Filter } from 'lucide-react';

export default function AlertsPage({ alerts, onVerifyAlert, onDismissAlert, onSelectAlert, soundEnabled, setSoundEnabled }) {
  const [filterLevel, setFilterLevel] = useState('ALL');

  const filteredAlerts = alerts.filter(a => {
    if (filterLevel === 'ALL') return true;
    return a.risk_level.toUpperCase() === filterLevel;
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="font-display font-bold text-lg text-white tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" /> REAL-TIME SECURITY ALERTS MONITOR
          </h2>
          <p className="text-xs font-mono text-slate-400">
            Live AI crime detection telemetry stream. Instant snapshot capture, risk classification & security dispatch trigger.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl border font-mono text-xs transition ${
              soundEnabled
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? "SOUND ALARM ON" : "SOUND MUTED"}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3">
        {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((lvl) => (
          <button
            key={lvl}
            onClick={() => setFilterLevel(lvl)}
            className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition ${
              filterLevel === lvl
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {lvl} ALERTS ({lvl === 'ALL' ? alerts.length : alerts.filter(a => a.risk_level.toUpperCase() === lvl).length})
          </button>
        ))}
      </div>

      {/* Expanded Alert Stream */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAlerts.map((alert) => (
          <div
            key={alert.id || alert.timestamp}
            onClick={() => onSelectAlert && onSelectAlert(alert)}
            className="glass-panel rounded-2xl p-4 border border-slate-800 hover:border-cyan-500/50 transition cursor-pointer space-y-3"
          >
            {alert.snapshot_url && (
              <div className="relative w-full h-40 rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                <img src={alert.snapshot_url} alt={alert.event_type} className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2 px-2.5 py-1 rounded text-xs font-mono font-bold bg-black/80 text-cyan-400">
                  {alert.camera_id}
                </div>
                <div className="absolute top-2 right-2 px-2.5 py-1 rounded text-xs font-mono font-bold bg-red-600 text-white">
                  RISK {alert.risk_score}%
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <h3 className="font-display font-bold text-sm text-white uppercase">{alert.event_type}</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/40">
                {alert.risk_level}
              </span>
            </div>

            <div className="text-xs font-mono text-slate-400 space-y-1 border-t border-slate-800 pt-2">
              <p>Camera: <span className="text-slate-200">{alert.camera_name}</span></p>
              <p>Timestamp: <span className="text-slate-200">{alert.timestamp}</span></p>
              <p>Track Person: <span className="text-cyan-400">{alert.person_id}</span></p>
              <p>Confidence: <span className="text-emerald-400">{(alert.confidence * 100).toFixed(0)}%</span></p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => onVerifyAlert && onVerifyAlert(alert.id)}
                className="py-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40 font-mono text-xs font-bold transition"
              >
                VERIFY
              </button>
              <button
                onClick={() => onDismissAlert && onDismissAlert(alert.id)}
                className="py-2 rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700 font-mono text-xs transition"
              >
                DISMISS
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
