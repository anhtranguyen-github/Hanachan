"use client";

import { useEffect, useState } from "react";
import { getSystemHealth } from "@/features/admin/service";
import { Activity, Database, Server, HardDrive, RefreshCw } from "lucide-react";

interface HealthData {
  status: string;
  db_status: string;
  qdrant_status: string;
  neo4j_status: string;
  degraded: string[];
  timestamp: string;
}

function StatusIndicator({ status, label }: { status: string; label: string }) {
  const isHealthy = status === "ok";
  return (
    <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${isHealthy ? "bg-green-500" : "bg-red-500"}`} />
        <span className="text-slate-300">{label}</span>
      </div>
      <span className={`text-sm font-medium ${isHealthy ? "text-green-400" : "text-red-400"}`}>
        {status.toUpperCase()}
      </span>
    </div>
  );
}

export default function HealthPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadHealth() {
    try {
      setLoading(true);
      const data = await getSystemHealth();
      setHealth(data);
    } catch (err) {
      setError(err instanceof Error ? (err instanceof Error ? err.message : String(err)) : "Failed to load health data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">System Health</h1>
          <p className="text-slate-400">Monitor system status and performance</p>
        </div>
        <button
          onClick={loadHealth}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading && "animate-spin"}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {health && (
        <>
          <div className={`p-6 rounded-xl border ${
            health.status === "ok"
              ? "bg-green-500/10 border-green-500/20"
              : "bg-yellow-500/10 border-yellow-500/20"
          }`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${
                health.status === "ok" ? "bg-green-500/20" : "bg-yellow-500/20"
              }`}>
                <Activity className={`w-6 h-6 ${
                  health.status === "ok" ? "text-green-400" : "text-yellow-400"
                }`} />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${
                  health.status === "ok" ? "text-green-400" : "text-yellow-400"
                }`}>
                  System {health.status === "ok" ? "Operational" : "Degraded"}
                </h2>
                <p className="text-slate-400 text-sm">
                  Last updated: {new Date(health.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Database</h3>
              </div>
              <StatusIndicator status={health.db_status} label="PostgreSQL" />
            </div>

            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Server className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Vector Store</h3>
              </div>
              <StatusIndicator status={health.qdrant_status} label="Qdrant" />
            </div>

            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <div className="flex items-center gap-3 mb-4">
                <HardDrive className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-semibold text-white">Graph DB</h3>
              </div>
              <StatusIndicator status={health.neo4j_status} label="Neo4j" />
            </div>
          </div>

          {health.degraded.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-red-400 mb-4">Degraded Services</h3>
              <ul className="space-y-2">
                {health.degraded.map((service, index) => (
                  <li key={index} className="flex items-center gap-2 text-slate-300">
                    <span className="w-2 h-2 bg-red-500 rounded-full" />
                    {service}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
