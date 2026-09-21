import React from 'react';
import CameraGrid from '../components/CameraGrid';
import ThreatGlobe3D from '../components/ThreatGlobe3D';
import LiveAlerts from '../components/LiveAlerts';

export default function DashboardPage({
  alerts,
  activeAlertsMap,
  onVerifyAlert,
  onDismissAlert,
  onSelectAlert,
  onSelectZoneEdit
}) {
  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Main Center Region */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Top Grid & 3D Radar Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: CCTV Camera Grid */}
          <div className="lg:col-span-2">
            <CameraGrid
              activeAlertsMap={activeAlertsMap}
              onSelectZoneEdit={onSelectZoneEdit}
            />
          </div>

          {/* Right 1 Col: 3D Threat Radar */}
          <div className="h-full min-h-[380px]">
            <ThreatGlobe3D activeAlerts={alerts} />
          </div>
        </div>
      </main>

      {/* Right Sidebar: Real-time Live Alerts Stream */}
      <LiveAlerts
        alerts={alerts}
        onVerifyAlert={onVerifyAlert}
        onDismissAlert={onDismissAlert}
        onSelectAlert={onSelectAlert}
      />
    </div>
  );
}
