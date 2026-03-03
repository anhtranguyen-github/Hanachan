"use client";

import { useEffect, useState } from "react";
import { getAbuseAlerts, resolveAbuseAlert } from "@/features/admin/service";
import { ShieldAlert, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface Alert {
  id: string;
  alert_type: string;
  severity: string;
  user_id: string | null;
  user_name: string | null;
  ip_address: string | null;
  description: string;
  status: string;
  created_at: string;
}

const severityColors: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400",
  high: "bg-orange-500/20 text-orange-400",
  medium: "bg-yellow-500/20 text-yellow-400",
  low: "bg-blue-500/20 text-blue-400",
};

const alertTypeLabels: Record<string, string> = {
  rate_limit_exceeded: "Rate Limit Exceeded",
  cost_spike: "Cost Spike",
  suspicious_pattern: "Suspicious Pattern",
  data_exfiltration: "Data Exfiltration",
  spam: "Spam",
};

export default function AbuseAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [resolvingAlert, setResolvingAlert] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolutionStatus, setResolutionStatus] = useState<"resolved" | "false_positive">("resolved");

  async function loadAlerts() {
    try {
      setLoading(true);
      const result = await getAbuseAlerts({
        status: statusFilter || undefined,
        limit: 50,
      });
      setAlerts(result.alerts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAlerts();
  }, [statusFilter]);

  async function handleResolve(alertId: string) {
    try {
      await resolveAbuseAlert(alertId, {
        resolution_notes: resolutionNotes,
        status: resolutionStatus,
      });
      setResolvingAlert(null);
      setResolutionNotes("");
      loadAlerts();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to resolve alert");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Abuse Detection</h1>
          <p className="text-slate-400">Monitor and respond to suspicious activity</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Alerts</option>
          <option value="open">Open</option>
          <option value="investigating">Investigating</option>
          <option value="resolved">Resolved</option>
          <option value="false_positive">False Positive</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center">
          <ShieldAlert className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Alerts</h3>
          <p className="text-slate-400">No abuse alerts found for the selected filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-slate-900 rounded-xl border border-slate-800 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${severityColors[alert.severity] || "bg-slate-700"}`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-white font-medium">
                        {alertTypeLabels[alert.alert_type] || alert.alert_type}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${severityColors[alert.severity] || "bg-slate-700"}`}>
                        {alert.severity}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        alert.status === "open" ? "bg-red-500/20 text-red-400" :
                        alert.status === "investigating" ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-green-500/20 text-green-400"
                      }`}>
                        {alert.status}
                      </span>
                    </div>
                    <p className="text-slate-300 mb-2">{alert.description}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      {alert.user_name && <span>User: {alert.user_name}</span>}
                      {alert.ip_address && <span>IP: {alert.ip_address}</span>}
                      <span>{new Date(alert.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                {alert.status === "open" && (
                  <button
                    onClick={() => setResolvingAlert(alert.id)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Resolve
                  </button>
                )}
              </div>

              {/* Resolution Form */}
              {resolvingAlert === alert.id && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Resolution Notes
                      </label>
                      <textarea
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        placeholder="Describe how this alert was resolved..."
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Resolution
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            value="resolved"
                            checked={resolutionStatus === "resolved"}
                            onChange={(e) => setResolutionStatus(e.target.value as "resolved")}
                            className="text-indigo-500"
                          />
                          <span className="text-slate-300">Resolved</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            value="false_positive"
                            checked={resolutionStatus === "false_positive"}
                            onChange={(e) => setResolutionStatus(e.target.value as "false_positive")}
                            className="text-indigo-500"
                          />
                          <span className="text-slate-300">False Positive</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleResolve(alert.id)}
                        disabled={!resolutionNotes}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4 inline mr-2" />
                        Confirm Resolution
                      </button>
                      <button
                        onClick={() => {
                          setResolvingAlert(null);
                          setResolutionNotes("");
                        }}
                        className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                      >
                        <XCircle className="w-4 h-4 inline mr-2" />
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
