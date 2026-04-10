"use client";

import { useEffect, useState } from "react";
import { getRateLimitOverrides, createRateLimitOverride } from "@/features/admin/service";
import { Settings, Plus, Clock, User, Globe } from "lucide-react";

interface Override {
  id: string;
  user_id: string | null;
  user_name: string | null;
  ip_address: string | null;
  scope: string;
  endpoint_pattern: string;
  max_requests_per_minute: number | null;
  max_requests_per_hour: number | null;
  max_requests_per_day: number | null;
  expires_at: string;
  reason: string;
}

export default function RateLimitsPage() {
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Form state
  const [scope, setScope] = useState<"user" | "ip" | "global">("global");
  const [userId, setUserId] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [endpointPattern, setEndpointPattern] = useState("*");
  const [maxPerMinute, setMaxPerMinute] = useState<number | undefined>(undefined);
  const [maxPerHour, setMaxPerHour] = useState<number | undefined>(undefined);
  const [maxPerDay, setMaxPerDay] = useState<number | undefined>(undefined);
  const [expiresHours, setExpiresHours] = useState(24);
  const [reason, setReason] = useState("");

  async function loadOverrides() {
    try {
      setLoading(true);
      const result = await getRateLimitOverrides();
      setOverrides(result.overrides);
    } catch (err) {
      console.error("Failed to load overrides:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOverrides();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createRateLimitOverride({
        scope,
        endpoint_pattern: endpointPattern,
        reason,
        expires_hours: expiresHours,
        user_id: scope === "user" ? userId : undefined,
        ip_address: scope === "ip" ? ipAddress : undefined,
        max_requests_per_minute: maxPerMinute,
        max_requests_per_hour: maxPerHour,
        max_requests_per_day: maxPerDay,
      });
      setShowCreateModal(false);
      resetForm();
      loadOverrides();
    } catch (err) {
      alert(err instanceof Error ? (err instanceof Error ? err.message : String(err)) : "Failed to create override");
    }
  }

  function resetForm() {
    setScope("global");
    setUserId("");
    setIpAddress("");
    setEndpointPattern("*");
    setMaxPerMinute(undefined);
    setMaxPerHour(undefined);
    setMaxPerDay(undefined);
    setExpiresHours(24);
    setReason("");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Rate Limit Overrides</h1>
          <p className="text-slate-400">Manage temporary rate limit adjustments</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Override
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : overrides.length === 0 ? (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center">
          <Settings className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Active Overrides</h3>
          <p className="text-slate-400">All rate limits are using default settings.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {overrides.map((override) => (
            <div
              key={override.id}
              className="bg-slate-900 rounded-xl border border-slate-800 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-500/20 rounded-lg">
                    {override.scope === "user" ? (
                      <User className="w-5 h-5 text-indigo-400" />
                    ) : override.scope === "global" ? (
                      <Globe className="w-5 h-5 text-indigo-400" />
                    ) : (
                      <Settings className="w-5 h-5 text-indigo-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-medium uppercase">
                        {override.scope}
                      </span>
                      <span className="text-slate-400 text-sm">{override.endpoint_pattern}</span>
                    </div>
                    <p className="text-white font-medium">
                      {override.user_name || override.user_id?.slice(0, 8) || override.ip_address || "Global"}
                    </p>
                    <p className="text-slate-400 text-sm mt-1">{override.reason}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      {override.max_requests_per_minute && (
                        <span className="text-slate-500">{override.max_requests_per_minute}/min</span>
                      )}
                      {override.max_requests_per_hour && (
                        <span className="text-slate-500">{override.max_requests_per_hour}/hour</span>
                      )}
                      {override.max_requests_per_day && (
                        <span className="text-slate-500">{override.max_requests_per_day}/day</span>
                      )}
                      <span className="flex items-center gap-1 text-amber-400">
                        <Clock className="w-3 h-3" />
                        Expires {new Date(override.expires_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">Create Rate Limit Override</h2>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Scope</label>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value as "user" | "ip" | "global")}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="global">Global</option>
                  <option value="user">User</option>
                  <option value="ip">IP Address</option>
                </select>
              </div>

              {scope === "user" && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">User ID</label>
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="Enter user UUID"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              )}

              {scope === "ip" && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">IP Address</label>
                  <input
                    type="text"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    placeholder="Enter IP address"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Endpoint Pattern</label>
                <input
                  type="text"
                  value={endpointPattern}
                  onChange={(e) => setEndpointPattern(e.target.value)}
                  placeholder="* for all, or specific like 'chat'"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Max/Min</label>
                  <input
                    type="number"
                    value={maxPerMinute || ""}
                    onChange={(e) => setMaxPerMinute(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Unlimited"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Max/Hour</label>
                  <input
                    type="number"
                    value={maxPerHour || ""}
                    onChange={(e) => setMaxPerHour(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Unlimited"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Max/Day</label>
                  <input
                    type="number"
                    value={maxPerDay || ""}
                    onChange={(e) => setMaxPerDay(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Unlimited"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Expires (hours)</label>
                <input
                  type="number"
                  value={expiresHours}
                  onChange={(e) => setExpiresHours(parseInt(e.target.value) || 1)}
                  min={1}
                  max={720}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Reason</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason for override..."
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  rows={3}
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!reason}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  Create Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
