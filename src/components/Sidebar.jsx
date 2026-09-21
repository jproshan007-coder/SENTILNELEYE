import React from 'react';
import { LayoutGrid, Video, ShieldAlert, FileText, Sliders, Activity } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, unreadAlertsCount = 0 }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'cameras', label: 'Live Cameras', icon: Video },
    { id: 'alerts', label: 'Live Alerts', icon: ShieldAlert, badge: unreadAlertsCount },
    { id: 'history', label: 'Incident History', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Sliders },
  ];

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-[#0A0E1A] flex flex-col justify-between p-4 z-30 shrink-0">
      {/* Primary Navigation */}
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold mb-3">
            Surveillance Hub
          </p>
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-400 border border-cyan-500/30 font-semibold shadow-lg shadow-cyan-500/10'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 border border-transparent'
                  }`}
                >
                  {/* Left indicator line */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-cyan-400 rounded-r-full glow-cyan" />
                  )}

                  <div className="flex items-center space-x-3">
                    <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge > 0 && (
                    <span className="px-2 py-0.5 text-xs font-mono rounded-full bg-red-500 text-white font-bold animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer System Status Panel */}
      <div className="glass-panel p-3.5 rounded-xl border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-mono flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" /> AI Engine
          </span>
          <span className="text-emerald-400 font-mono font-semibold">OPTIMAL</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full w-[94%]" />
        </div>
        <div className="text-[10px] font-mono text-slate-500 flex justify-between">
          <span>GPU Load: 28%</span>
          <span>RAM: 3.2 GB</span>
        </div>
      </div>
    </aside>
  );
}
