import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import StatsBar from './components/StatsBar';
import AlertModal from './components/AlertModal';
import ZoneDrawer from './components/ZoneDrawer';
import DemoControlBar from './components/DemoControlBar';
import VideoUploader from './components/VideoUploader';

import DashboardPage from './pages/DashboardPage';
import CamerasPage from './pages/CamerasPage';
import AlertsPage from './pages/AlertsPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';

import { fetchLiveAlerts, updateIncidentStatus, fetchStats } from './services/api';
import { alertWebSocket } from './services/websocket';
import { playAlertChime } from './services/audio';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [alerts, setAlerts] = useState([]);
  const [activeAlertsMap, setActiveAlertsMap] = useState({});
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [editingZoneCam, setEditingZoneCam] = useState(null);
  const [showUploaderModal, setShowUploaderModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [stats, setStats] = useState({});
  const [threatLevel, setThreatLevel] = useState('MEDIUM');

  const lastSpokenRef = useRef(0);

  // Dynamic Browser Text-to-Speech vocal announcement
  const speakVoiceAlert = (alert) => {
    if (!soundEnabled || !('speechSynthesis' in window)) return;
    const now = Date.now();
    if (now - lastSpokenRef.current < 4000) return; // Cooldown 4s
    lastSpokenRef.current = now;

    try {
      window.speechSynthesis.cancel(); // Clear backlog
      const camNumber = alert.camera_id ? alert.camera_id.replace('CAM-0', '').replace('CAM-', '') : '1';
      const eventType = alert.event_type || 'Suspicious Activity';
      const prefix = alert.risk_level === 'Critical' ? 'Emergency.' : 'Warning.';
      const text = `${prefix} ${eventType} detected on Camera ${camNumber}.`;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis error:', e);
    }
  };

  // Load initial alerts & stats
  useEffect(() => {
    async function loadData() {
      try {
        const liveAlerts = await fetchLiveAlerts();
        setAlerts(liveAlerts);

        const initialMap = {};
        liveAlerts.forEach((a) => {
          if (!initialMap[a.camera_id]) initialMap[a.camera_id] = a;
        });
        setActiveAlertsMap(initialMap);

        const currentStats = await fetchStats();
        setStats(currentStats);
      } catch (e) {
        console.error('Failed to load initial CCTV telemetry data', e);
      }
    }
    loadData();

    // Connect WebSocket
    alertWebSocket.connect();
    const unsubscribe = alertWebSocket.subscribe((msg) => {
      if (msg.type === 'NEW_ALERT') {
        const newAlert = msg.data;
        setAlerts((prev) => [newAlert, ...prev.filter((a) => a.id !== newAlert.id)]);
        setActiveAlertsMap((prev) => ({ ...prev, [newAlert.camera_id]: newAlert }));

        // Trigger Audio Siren & Voice Alert
        if (soundEnabled) {
          playAlertChime(newAlert.risk_level);
          speakVoiceAlert(newAlert);
        }

        // Auto trigger modal & highlight for Critical or High alerts
        if (newAlert.risk_level === 'Critical' || newAlert.risk_level === 'High') {
          setSelectedAlert(newAlert);
          setThreatLevel(newAlert.risk_level.toUpperCase());
        }

        // Refresh stats
        fetchStats().then(setStats).catch(() => {});
      }
    });

    return () => {
      unsubscribe();
    };
  }, [soundEnabled]);

  const handleVerifyAlert = async (id) => {
    try {
      await updateIncidentStatus(id, 'Verified');
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'Verified' } : a))
      );
      if (selectedAlert && selectedAlert.id === id) {
        setSelectedAlert((prev) => ({ ...prev, status: 'Verified' }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDismissAlert = async (id) => {
    try {
      await updateIncidentStatus(id, 'Dismissed');
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      if (selectedAlert && selectedAlert.id === id) {
        setSelectedAlert(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const unreadAlertsCount = alerts.filter(
    (a) => a.status === 'Waiting Verification'
  ).length;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#070A11] text-slate-100 overflow-hidden font-sans">
      {/* Top Navbar */}
      <Navbar
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        threatLevel={threatLevel}
      />

      {/* Hackathon Demo Control Bar */}
      <DemoControlBar onOpenUploader={() => setShowUploaderModal(true)} />

      {/* Main View Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          unreadAlertsCount={unreadAlertsCount}
        />

        {/* Tab Page Routing */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#070A11]">
          {activeTab === 'dashboard' && (
            <DashboardPage
              alerts={alerts}
              activeAlertsMap={activeAlertsMap}
              onVerifyAlert={handleVerifyAlert}
              onDismissAlert={handleDismissAlert}
              onSelectAlert={(a) => setSelectedAlert(a)}
              onSelectZoneEdit={(c) => setEditingZoneCam(c)}
            />
          )}

          {activeTab === 'cameras' && (
            <CamerasPage
              activeAlertsMap={activeAlertsMap}
              onSelectZoneEdit={(c) => setEditingZoneCam(c)}
            />
          )}

          {activeTab === 'alerts' && (
            <AlertsPage
              alerts={alerts}
              onVerifyAlert={handleVerifyAlert}
              onDismissAlert={handleDismissAlert}
              onSelectAlert={(a) => setSelectedAlert(a)}
              soundEnabled={soundEnabled}
              setSoundEnabled={setSoundEnabled}
            />
          )}

          {activeTab === 'history' && (
            <HistoryPage onSelectAlert={(a) => setSelectedAlert(a)} />
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              onSelectZoneEdit={(c) => setEditingZoneCam(c)}
              soundEnabled={soundEnabled}
              setSoundEnabled={setSoundEnabled}
            />
          )}
        </div>
      </div>

      {/* Bottom Stats Metrics Bar */}
      <StatsBar stats={stats} />

      {/* Alert Verification Modal */}
      {selectedAlert && (
        <AlertModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onVerify={handleVerifyAlert}
          onDismiss={handleDismissAlert}
          soundEnabled={soundEnabled}
        />
      )}

      {/* Video Uploader Modal */}
      {showUploaderModal && (
        <VideoUploader
          onClose={() => setShowUploaderModal(false)}
          onUploadSuccess={() => setActiveTab('dashboard')}
        />
      )}

      {/* Restricted Zone Drawer Modal */}
      {editingZoneCam && (
        <ZoneDrawer
          camera={editingZoneCam}
          onClose={() => setEditingZoneCam(null)}
          onZoneSaved={() => setEditingZoneCam(null)}
        />
      )}
    </div>
  );
}
