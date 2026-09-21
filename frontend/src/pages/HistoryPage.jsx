import React, { useState, useEffect } from 'react';
import { fetchIncidents, updateIncidentStatus, getExportCSVUrl } from '../services/api';
import { Download, Search, Filter, ShieldAlert, CheckCircle2, XCircle, Clock, Eye } from 'lucide-react';

export default function HistoryPage({ onSelectAlert }) {
  const [incidents, setIncidents] = useState([]);
  const [search, setSearch] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [riskLevelFilter, setRiskLevelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const loadIncidents = async () => {
    setLoading(true);
    try {
      const data = await fetchIncidents({
        search,
        event_type: eventTypeFilter,
        risk_level: riskLevelFilter,
        status: statusFilter
      });
      setIncidents(data);
    } catch (e) {
      console.error("Failed to load incidents", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, [search, eventTypeFilter, riskLevelFilter, statusFilter]);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await updateIncidentStatus(id, newStatus);
      loadIncidents();
    } catch (e) {
      alert("Failed to update status: " + e.message);
    }
  };

  const getRiskBadge = (level) => {
    switch (level) {
      case 'Critical': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'High': return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      default: return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Verified': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
      case 'Dismissed': return 'bg-slate-800 text-slate-400 border-slate-700';
      default: return 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Top Header & Export */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="font-display font-bold text-lg text-white tracking-wider flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" /> INCIDENT AUDIT HISTORY & AUDIT LOGS
          </h2>
          <p className="text-xs font-mono text-slate-400">
            Searchable historical database of all AI-detected security events, intruder track records & human verification logs.
          </p>
        </div>

        <a
          href={getExportCSVUrl()}
          download="cctv_crime_incidents.csv"
          className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-cyan-500 text-black font-extrabold font-mono text-xs hover:bg-cyan-400 transition shadow-lg shadow-cyan-500/20 shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>EXPORT CSV REPORT</span>
        </a>
      </div>

      {/* Search & Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search Person ID, Camera..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Event Type Filter */}
        <select
          value={eventTypeFilter}
          onChange={(e) => setEventTypeFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
        >
          <option value="">All Event Categories</option>
          <option value="Unauthorized Entry">Unauthorized Entry</option>
          <option value="Fight Detected">Fight Detected</option>
          <option value="Suspicious Running">Suspicious Running</option>
        </select>

        {/* Risk Level Filter */}
        <select
          value={riskLevelFilter}
          onChange={(e) => setRiskLevelFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
        >
          <option value="">All Risk Levels</option>
          <option value="Critical">Critical (90%+)</option>
          <option value="High">High (70-89%)</option>
          <option value="Medium">Medium (40-69%)</option>
          <option value="Low">Low (0-39%)</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
        >
          <option value="">All Statuses</option>
          <option value="Waiting Verification">Waiting Verification</option>
          <option value="Verified">Verified</option>
          <option value="Dismissed">Dismissed</option>
        </select>
      </div>

      {/* Incident History Data Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">TIMESTAMP</th>
                <th className="px-4 py-3">CAMERA</th>
                <th className="px-4 py-3">EVENT CATEGORY</th>
                <th className="px-4 py-3">RISK SCORE</th>
                <th className="px-4 py-3">CONFIDENCE</th>
                <th className="px-4 py-3">PERSON ID</th>
                <th className="px-4 py-3">STATUS</th>
                <th className="px-4 py-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-slate-500">
                    LOADING INCIDENT AUDIT TRAIL...
                  </td>
                </tr>
              ) : incidents.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-slate-500">
                    NO INCIDENTS MATCHING FILTER CRITERIA
                  </td>
                </tr>
              ) : (
                incidents.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 text-cyan-400 font-bold">#{row.id}</td>
                    <td className="px-4 py-3 text-slate-300">{row.timestamp}</td>
                    <td className="px-4 py-3 text-slate-200">{row.camera_id}</td>
                    <td className="px-4 py-3 font-bold text-white">{row.event_type}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getRiskBadge(row.risk_level)}`}>
                        {row.risk_level} ({row.risk_score}%)
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{(row.confidence * 100).toFixed(0)}%</td>
                    <td className="px-4 py-3 text-cyan-300">{row.person_id}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getStatusBadge(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => onSelectAlert && onSelectAlert(row)}
                          className="p-1.5 rounded-lg bg-slate-800 text-cyan-400 hover:bg-slate-700"
                          title="View Snapshot"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {row.status === "Waiting Verification" && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(row.id, "Verified")}
                              className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                              title="Verify Incident"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(row.id, "Dismissed")}
                              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700"
                              title="Dismiss"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
