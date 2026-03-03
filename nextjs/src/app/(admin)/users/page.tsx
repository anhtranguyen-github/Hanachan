"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listUsers, suspendUser } from "@/features/admin/service";
import {
  Search,
  Filter,
  MoreVertical,
  Ban,
  UserCheck,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface User {
  id: string;
  display_name: string | null;
  level: number;
  last_activity_at: string | null;
  created_at: string | null;
  active_learning_items: number;
  total_chats: number;
  total_messages: number;
  is_suspended: boolean;
  today_cost_usd: number;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [isSuspended, setIsSuspended] = useState<boolean | undefined>(undefined);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendType, setSuspendType] = useState<"temporary" | "permanent">("temporary");
  const [suspendDuration, setSuspendDuration] = useState(24);
  const limit = 20;

  async function loadUsers() {
    try {
      setLoading(true);
      const data = await listUsers({
        limit,
        offset,
        search: search || undefined,
        is_suspended: isSuspended,
      });
      setUsers(data.users);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, [offset, isSuspended]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    loadUsers();
  };

  const handleSuspend = async () => {
    if (!selectedUser || !suspendReason) return;

    try {
      await suspendUser(selectedUser.id, {
        reason: suspendReason,
        suspension_type: suspendType,
        duration_hours: suspendType === "temporary" ? suspendDuration : undefined,
      });
      setShowSuspendModal(false);
      setSelectedUser(null);
      setSuspendReason("");
      loadUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to suspend user");
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString();
  };

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-slate-400">View and manage user accounts</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <form onSubmit={handleSearch} className="flex-1 min-w-[300px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </form>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={isSuspended === undefined ? "" : isSuspended.toString()}
            onChange={(e) => {
              const value = e.target.value;
              setIsSuspended(value === "" ? undefined : value === "true");
              setOffset(0);
            }}
            className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Users</option>
            <option value="false">Active Only</option>
            <option value="true">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">User</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Level</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Activity</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Learning</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Cost (24h)</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    Loading users...
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white font-medium">
                        {user.display_name || "Anonymous"}
                      </p>
                      <p className="text-slate-500 text-sm">{user.id.slice(0, 8)}...</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-medium">
                      Level {user.level}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-300 text-sm">
                      <p>Last: {formatDate(user.last_activity_at)}</p>
                      <p className="text-slate-500">Joined: {formatDate(user.created_at)}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-300 text-sm">
                      <p>{user.active_learning_items} items</p>
                      <p className="text-slate-500">{user.total_chats} chats</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-white font-medium">
                      ${user.today_cost_usd.toFixed(4)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.is_suspended ? (
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">
                        Suspended
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => router.push(`/admin/users/${user.id}`)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {!user.is_suspended ? (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowSuspendModal(true);
                          }}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Suspend user"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded-lg transition-colors"
                          title="Lift suspension"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between">
          <p className="text-slate-400 text-sm">
            Showing {offset + 1}-{Math.min(offset + limit, total)} of {total} users
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-slate-400 text-sm">
              Page {currentPage} of {totalPages || 1}
            </span>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Suspend Modal */}
      {showSuspendModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Suspend User</h2>
            <p className="text-slate-400 mb-4">
              Suspending: <span className="text-white font-medium">{selectedUser.display_name || "Anonymous"}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Reason</label>
                <textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Enter suspension reason..."
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="temporary"
                      checked={suspendType === "temporary"}
                      onChange={(e) => setSuspendType(e.target.value as "temporary")}
                      className="text-indigo-500 focus:ring-indigo-500"
                    />
                    <span className="text-slate-300">Temporary</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="permanent"
                      checked={suspendType === "permanent"}
                      onChange={(e) => setSuspendType(e.target.value as "permanent")}
                      className="text-indigo-500 focus:ring-indigo-500"
                    />
                    <span className="text-slate-300">Permanent</span>
                  </label>
                </div>
              </div>

              {suspendType === "temporary" && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Duration (hours)
                  </label>
                  <input
                    type="number"
                    value={suspendDuration}
                    onChange={(e) => setSuspendDuration(parseInt(e.target.value) || 1)}
                    min={1}
                    max={720}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowSuspendModal(false);
                  setSelectedUser(null);
                  setSuspendReason("");
                }}
                className="flex-1 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspend}
                disabled={!suspendReason}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Suspend User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
