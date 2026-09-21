const API_BASE = '/api';

export async function fetchCameras() {
  const res = await fetch(`${API_BASE}/cameras`);
  if (!res.ok) throw new Error('Failed to fetch cameras');
  return res.json();
}

export async function connectCameraSource(cameraId, sourceType) {
  const formData = new FormData();
  formData.append('camera_id', cameraId);
  formData.append('source_type', sourceType);

  const res = await fetch(`${API_BASE}/camera/connect`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('Failed to connect camera source');
  return res.json();
}

export async function uploadVideoFile(file, cameraId) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('camera_id', cameraId);

  const res = await fetch(`${API_BASE}/video/upload`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('Failed to upload video');
  return res.json();
}

export async function triggerDemoScenario(scenario, cameraId = 'CAM-02') {
  const formData = new FormData();
  formData.append('scenario', scenario);
  formData.append('camera_id', cameraId);

  const res = await fetch(`${API_BASE}/demo/trigger`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('Failed to trigger demo scenario');
  return res.json();
}

export async function fetchIncidents(params = {}) {
  const query = new URLSearchParams();
  if (params.camera_id) query.append('camera_id', params.camera_id);
  if (params.event_type) query.append('event_type', params.event_type);
  if (params.risk_level) query.append('risk_level', params.risk_level);
  if (params.status) query.append('status', params.status);
  if (params.search) query.append('search', params.search);

  const res = await fetch(`${API_BASE}/incidents?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch incidents');
  return res.json();
}

export async function updateIncidentStatus(id, status) {
  const res = await fetch(`${API_BASE}/incidents/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error('Failed to update incident status');
  return res.json();
}

export async function fetchLiveAlerts() {
  const res = await fetch(`${API_BASE}/alerts/live`);
  if (!res.ok) throw new Error('Failed to fetch live alerts');
  return res.json();
}

export async function fetchZone(cameraId) {
  const res = await fetch(`${API_BASE}/zones/${cameraId}`);
  if (!res.ok) return null;
  return res.json();
}

export async function saveZone(camera_id, zone_name, points, enabled = true) {
  const res = await fetch(`${API_BASE}/zones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ camera_id, zone_name, points, enabled })
  });
  if (!res.ok) throw new Error('Failed to save zone');
  return res.json();
}

export async function fetchSettings() {
  const res = await fetch(`${API_BASE}/settings`);
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

export async function saveSettings(settings) {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  if (!res.ok) throw new Error('Failed to save settings');
  return res.json();
}

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export function getExportCSVUrl() {
  return `${API_BASE}/incidents/export/csv`;
}
