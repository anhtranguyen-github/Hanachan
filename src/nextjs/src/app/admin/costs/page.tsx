"use client";

import { useEffect, useState } from "react";
import { getCostAnalytics } from "@/features/admin/service";
import { DollarSign, TrendingUp, Users, Zap } from "lucide-react";

interface CostData {
  period_days: number;
  summary: {
    total_cost_usd: number;
    total_tokens: number;
    prompt_tokens: number;
    completion_tokens: number;
    total_requests: number;
    unique_users: number;
    avg_latency_ms: number;
  };
  by_model: Array<{
    model: string;
    cost_usd: number;
    tokens: number;
    requests: number;
  }>;
  by_endpoint: Array<{
    endpoint: string;
    cost_usd: number;
    tokens: number;
    requests: number;
  }>;
  daily_breakdown: Array<{
    date: string;
    cost_usd: number;
    tokens: number;
    requests: number;
    unique_users: number;
  }>;
  top_users: Array<{
    user_id: string;
    display_name: string | null;
    cost_usd: number;
    tokens: number;
    requests: number;
  }>;
}

export default function CostsPage() {
  const [data, setData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const result = await getCostAnalytics(days);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? (err instanceof Error ? err.message : String(err)) : "Failed to load cost data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [days]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
        {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Cost Control</h1>
          <p className="text-slate-400">Monitor and manage LLM spending</p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Cost</p>
              <h3 className="text-2xl font-bold text-white">${data.summary.total_cost_usd.toFixed(2)}</h3>
            </div>
            <div className="p-3 bg-green-500/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Tokens</p>
              <h3 className="text-2xl font-bold text-white">{data.summary.total_tokens.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Zap className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Requests</p>
              <h3 className="text-2xl font-bold text-white">{data.summary.total_requests.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Active Users</p>
              <h3 className="text-2xl font-bold text-white">{data.summary.unique_users}</h3>
            </div>
            <div className="p-3 bg-amber-500/20 rounded-lg">
              <Users className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Model */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Cost by Model</h3>
          <div className="space-y-3">
            {data.by_model.map((model) => (
              <div key={model.model} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <span className="text-slate-300">{model.model}</span>
                <div className="text-right">
                  <p className="text-white font-medium">${model.cost_usd.toFixed(2)}</p>
                  <p className="text-slate-500 text-xs">{model.requests.toLocaleString()} requests</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Endpoint */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Cost by Endpoint</h3>
          <div className="space-y-3">
            {data.by_endpoint.map((endpoint) => (
              <div key={endpoint.endpoint} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <span className="text-slate-300">{endpoint.endpoint}</span>
                <div className="text-right">
                  <p className="text-white font-medium">${endpoint.cost_usd.toFixed(2)}</p>
                  <p className="text-slate-500 text-xs">{endpoint.requests.toLocaleString()} requests</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Users */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Top Users by Cost</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">User</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Cost</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Tokens</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Requests</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {data.top_users.map((user) => (
              <tr key={user.user_id} className="hover:bg-slate-800/50">
                <td className="px-4 py-3 text-slate-300">{user.display_name || "Anonymous"}</td>
                <td className="px-4 py-3 text-right text-white font-medium">${user.cost_usd.toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-slate-400">{user.tokens.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-slate-400">{user.requests.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
