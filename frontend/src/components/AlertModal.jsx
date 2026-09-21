import React, { useEffect } from 'react';
import { ShieldAlert, CheckCircle2, XCircle, X, MapPin, Clock, Cpu, User, HelpCircle } from 'lucide-react';

export default function AlertModal({ alert, onClose, onVerify, onDismiss, soundEnabled = true }) {
  if (!alert) return null;

  useEffect(() => {
    if (soundEnabled) {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } catch (e) {}
    }
  }, [alert, soundEnabled]);

  const getRiskColor = (level) => {
    switch (level) {
      case 'Critical': return 'text-red-500 bg-red-500/10 border-red-500/40';
      case 'High': return 'text-amber-400 bg-amber-500/10 border-amber-500/40';
      case 'Medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/40';
      default: return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/40';
    }
  };

  const reasonsList = alert.details && alert.details.reasons ? alert.details.reasons : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl glass-panel bg-[#090D18] rounded-2xl border border-red-500/50 overflow-hidden shadow-2xl glow-red animate-scale-in">
        {/* Top Header Banner */}
        <div className="p-4 bg-gradient-to-r from-red-950 via-slate-900 to-slate-950 border-b border-red-500/30 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-red-600/30 text-red-400 border border-red-500/50">
              <ShieldAlert className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-red-300 font-bold uppercase tracking-wider">
                AI DETECTION — HUMAN VERIFICATION REQUIRED
              </span>
              <h3 className="font-display text-lg font-bold text-white uppercase">{alert.event_type}</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Snapshot Image */}
          {alert.snapshot_url ? (
            <div className="relative w-full h-60 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shadow-inner">
              <img
                src={alert.snapshot_url}
                alt={alert.event_type}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-black/80 text-cyan-400 border border-cyan-800">
                {alert.camera_id} - {alert.camera_name}
              </div>
              <div className="absolute top-3 right-3 px-3 py-1 rounded-md text-xs font-mono font-extrabold bg-red-600 text-white shadow-lg">
                RISK SCORE: {alert.risk_score}%
              </div>
            </div>
          ) : (
            <div className="w-full h-48 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 font-mono text-xs">
              NO SNAPSHOT IMAGE AVAILABLE
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <p className="text-slate-500 text-[10px] flex items-center gap-1">
                <MapPin className="w-3 h-3 text-cyan-400" /> CAMERA ID
              </p>
              <p className="font-bold text-cyan-400 mt-1">{alert.camera_id}</p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <p className="text-slate-500 text-[10px] flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan-400" /> TIMESTAMP
              </p>
              <p className="font-bold text-slate-200 mt-1">{alert.timestamp}</p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <p className="text-slate-500 text-[10px] flex items-center gap-1">
                <User className="w-3 h-3 text-cyan-400" /> PERSON ID
              </p>
              <p className="font-bold text-slate-200 mt-1">{alert.person_id}</p>
            </div>

            <div className={`p-2.5 rounded-xl border ${getRiskColor(alert.risk_level)}`}>
              <p className="text-[10px] flex items-center gap-1 opacity-80">
                <Cpu className="w-3 h-3" /> RISK LEVEL
              </p>
              <p className="font-bold text-sm mt-1">{alert.risk_level} ({alert.risk_score}%)</p>
            </div>
          </div>

          {/* Explainable AI Alert Reasons Section */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-cyan-500/30 font-mono text-xs text-slate-200 space-y-2">
            <div className="flex items-center space-x-1.5 text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span>WHY WAS THIS ALERT GENERATED? (EXPLAINABLE AI):</span>
            </div>
            {reasonsList.length > 0 ? (
              <ul className="space-y-1 text-slate-300 text-[11px]">
                {reasonsList.map((reason, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-400 text-[11px]">
                Multi-person interaction threshold crossed, rapid body movement intensity persistent across consecutive frames.
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800/80 flex justify-end space-x-3">
          <button
            onClick={() => {
              onDismiss && onDismiss(alert.id);
              onClose();
            }}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-red-950/40 text-red-300 hover:bg-red-900/60 border border-red-800/80 font-mono text-xs font-semibold transition"
          >
            <XCircle className="w-4 h-4 text-red-400" />
            <span>REJECT / FALSE POSITIVE</span>
          </button>
          <button
            onClick={() => {
              onVerify && onVerify(alert.id);
              onClose();
            }}
            className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-extrabold hover:bg-emerald-400 font-mono text-xs transition shadow-lg shadow-emerald-500/20"
          >
            <CheckCircle2 className="w-4 h-4 text-slate-950" />
            <span>CONFIRM INCIDENT</span>
          </button>
        </div>
      </div>
    </div>
  );
}
