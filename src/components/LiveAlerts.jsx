import React from 'react';
import { ShieldAlert, CheckCircle2, XCircle, AlertCircle, Clock, Video } from 'lucide-react';

export default function LiveAlerts({ alerts = [], onVerifyAlert, onDismissAlert, onSelectAlert }) {
  const getRiskBadge = (level, score) => {
    switch (level) {
      case 'Critical':
        return 'bg-red-500/20 text-red-400 border-red-500/50 shadow-red-500/20';
      case 'High':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-amber-500/20';
      case 'Medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 shadow-yellow-500/20';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-emerald-500/20';
    }
  };

  return (
    <aside className="w-80 border-l border-slate-800 bg-[#0A0E1A] p-4 flex flex-col z-30 shrink-0 space-y-4">
      {/* Sidebar Title Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
          <h3 className="font-display font-bold text-sm uppercase tracking-wider text-white">LIVE ALERTS</h3>
        </div>
        <span className="px-2 py-0.5 text-xs font-mono rounded bg-red-950 text-red-400 border border-red-800 font-bold">
          {alerts.length} NEW
        </span>
      </div>

      {/* Live Alerts Stream List */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center space-y-2 text-slate-500 font-mono">
            <AlertCircle className="w-8 h-8 text-slate-600" />
            <p className="text-xs">NO ACTIVE ALERTS DETECTED</p>
            <p className="text-[10px] text-slate-600">Surveillance AI monitoring feeds...</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id || alert.timestamp}
              className={`rounded-xl p-3 glass-card border transition-all duration-200 hover:border-cyan-500/40 cursor-pointer ${getRiskBadge(alert.risk_level, alert.risk_score)}`}
              onClick={() => onSelectAlert && onSelectAlert(alert)}
            >
              {/* Card Header: Snapshot preview */}
              {alert.snapshot_url && (
                <div className="relative w-full h-28 rounded-lg overflow-hidden mb-2.5 border border-slate-700/80 bg-slate-950">
                  <img
                    src={alert.snapshot_url}
                    alt={alert.event_type}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-950/80 text-white backdrop-blur-sm">
                    {alert.camera_id}
                  </div>
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-600 text-white">
                    RISK {alert.risk_score}%
                  </div>
                </div>
              )}

              {/* Event Title & Metadata */}
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-display text-xs font-bold text-white tracking-wide">{alert.event_type}</h4>
                <span className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded border ${getRiskBadge(alert.risk_level)}`}>
                  {alert.risk_level}
                </span>
              </div>

              <div className="space-y-1 text-[11px] font-mono text-slate-300 mb-3">
                <div className="flex items-center space-x-1 text-slate-400">
                  <Video className="w-3 h-3 text-cyan-400" />
                  <span>{alert.camera_name}</span>
                </div>
                <div className="flex items-center space-x-1 text-slate-400">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span>{alert.timestamp}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                  <span>CONFIDENCE: {(alert.confidence * 100).toFixed(0)}%</span>
                  <span>ID: {alert.person_id}</span>
                </div>
              </div>

              {/* Action Buttons: Verify / Dismiss */}
              <div className="grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onVerifyAlert && onVerifyAlert(alert.id)}
                  className="flex items-center justify-center space-x-1 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs font-mono transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>VERIFY</span>
                </button>
                <button
                  onClick={() => onDismissAlert && onDismissAlert(alert.id)}
                  className="flex items-center justify-center space-x-1 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700 text-xs font-mono transition"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>DISMISS</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
