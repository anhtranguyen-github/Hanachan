"use client";

import { useEffect, useState } from "react";
import { getAuditLogs } from "@/features/admin/service";
import { FileText, Search } from "lucide-react";

interface AuditLog {
  id: string;
  admin_user_id: string;
  admin_name: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  reason: string | null;
  ip_address: string | null;
  created_at: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState("");
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 50;

  async function loadLogs() {
    try {
      setLoading(true);
      const result = await getAuditLogs({
        limit,
        offset,
        action: actionFilter || undefined,
        days: 30,
      });
      setLogs(result.logs);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset, actionFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
        <p className="text-slate-400">Track all administrative actions</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setOffset(0);
            }}
            placeholder="Filter by action..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Time</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Admin</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Action</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Target</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    Loading logs...
                  </div>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  No audit logs found
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/50">
                  <td className="px-6 py-4 text-slate-400 text-sm">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {log.admin_name || log.admin_user_id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-medium">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-300 text-sm">
                    {log.target_type}: {log.target_id?.slice(0, 12) || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-sm">
                    {log.reason || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between">
          <p className="text-slate-400 text-sm">
            Showing {offset + 1}-{Math.min(offset + limit, total)} of {total} logs
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="px-3 py-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total}
              className="px-3 py-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
