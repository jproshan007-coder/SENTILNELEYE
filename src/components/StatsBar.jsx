import React from 'react';
import { AlertOctagon, Users, Video, Zap, CheckCircle } from 'lucide-react';

export default function StatsBar({ stats }) {
  const defaultStats = {
    today_alerts: 0,
    people_detected: 142,
    active_cameras: 4,
    avg_detection_time_ms: 18.4,
    ai_accuracy_pct: 98.4,
    ...stats
  };

  const statItems = [
    {
      label: "TODAY'S ALERTS",
      value: defaultStats.today_alerts,
      unit: "Incidents",
      icon: AlertOctagon,
      color: "text-red-400",
      bg: "bg-red-500/10 border-red-500/30"
    },
    {
      label: "PEOPLE DETECTED",
      value: defaultStats.people_detected,
      unit: "Track IDs",
      icon: Users,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10 border-cyan-500/30"
    },
    {
      label: "ACTIVE CAMERAS",
      value: `${defaultStats.active_cameras}/4`,
      unit: "Feeds Live",
      icon: Video,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/30"
    },
    {
      label: "AVG DETECTION LATENCY",
      value: `${defaultStats.avg_detection_time_ms} ms`,
      unit: "Real-time",
      icon: Zap,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10 border-yellow-500/30"
    },
    {
      label: "AI MODEL ACCURACY",
      value: `${defaultStats.ai_accuracy_pct}%`,
      unit: "mAP@0.50",
      icon: CheckCircle,
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/30"
    }
  ];

  return (
    <div className="h-16 border-t border-slate-800 bg-[#0A0E1A] px-6 flex items-center justify-between z-30 shrink-0">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full">
        {statItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className={`flex items-center space-x-3 px-3 py-2 rounded-xl border glass-panel transition-all ${item.bg}`}
            >
              <div className={`p-2 rounded-lg ${item.bg}`}>
                <Icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">{item.label}</p>
                <div className="flex items-baseline space-x-1.5">
                  <span className={`font-display font-bold text-sm text-white ${item.color}`}>{item.value}</span>
                  <span className="text-[10px] font-mono text-slate-500">{item.unit}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
