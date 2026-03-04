"use client";

import { useEffect, useState } from "react";
import { getDashboardStats } from "@/features/admin/service";
import {
  Users,
  DollarSign,
  AlertTriangle,
  Activity,
  TrendingUp,
  UserX,
} from "lucide-react";

interface DashboardStats {
  total_users: number;
  active_users_24h: number;
  active_users_7d: number;
  new_users_24h: number;
  total_cost_24h: number;
  total_cost_7d: number;
  total_requests_24h: number;
  open_abuse_alerts: number;
  suspended_users: number;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  trend?: { value: number; isPositive: boolean };
}) {
  return (
    <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium">{title}</p>
          <h3 className="text-2xl font-bold text-white mt-2">{value}</h3>
          {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trend.isPositive ? "text-green-400" : "text-red-400"}`}>
              <TrendingUp className={`w-4 h-4 ${!trend.isPositive && "rotate-180"}`} />
              <span>{trend.value}%</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load stats");
      } finally {
        setLoading(false);
      }
    }

    loadStats();
    // Refresh every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

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

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400">Overview of your AI learning platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.total_users.toLocaleString()}
          subtitle={`${stats.new_users_24h} new today`}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Active Users (24h)"
          value={stats.active_users_24h.toLocaleString()}
          subtitle={`${stats.active_users_7d} this week`}
          icon={Activity}
          color="bg-green-500"
        />
        <StatCard
          title="Cost (24h)"
          value={`$${stats.total_cost_24h.toFixed(2)}`}
          subtitle={`$${stats.total_cost_7d.toFixed(2)} this week`}
          icon={DollarSign}
          color="bg-amber-500"
        />
        <StatCard
          title="API Requests (24h)"
          value={stats.total_requests_24h.toLocaleString()}
          icon={TrendingUp}
          color="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">System Alerts</h3>
            {stats.open_abuse_alerts > 0 && (
              <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                {stats.open_abuse_alerts} open
              </span>
            )}
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Abuse Alerts</p>
                  <p className="text-slate-400 text-sm">Open investigations</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-white">{stats.open_abuse_alerts}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <UserX className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Suspended Users</p>
                  <p className="text-slate-400 text-sm">Currently restricted</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-white">{stats.suspended_users}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <a
              href="/admin/users"
              className="p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Users className="w-6 h-6 text-blue-400 mb-2" />
              <p className="text-white font-medium">Manage Users</p>
              <p className="text-slate-400 text-sm">View and suspend accounts</p>
            </a>
            <a
              href="/admin/costs"
              className="p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <DollarSign className="w-6 h-6 text-green-400 mb-2" />
              <p className="text-white font-medium">Cost Analytics</p>
              <p className="text-slate-400 text-sm">Track LLM spending</p>
            </a>
            <a
              href="/admin/abuse-alerts"
              className="p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <AlertTriangle className="w-6 h-6 text-red-400 mb-2" />
              <p className="text-white font-medium">Abuse Alerts</p>
              <p className="text-slate-400 text-sm">Review suspicious activity</p>
            </a>
            <a
              href="/admin/audit-logs"
              className="p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Activity className="w-6 h-6 text-purple-400 mb-2" />
              <p className="text-white font-medium">Audit Logs</p>
              <p className="text-slate-400 text-sm">Track admin actions</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
