// Admin Service — API client for Admin Control Plane endpoints.

import { supabase } from "@/lib/supabase";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8765";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  if (!token) {
    throw new Error("Not authenticated");
  }
  
  return {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
  
  return response.json();
}

// Dashboard Stats
export async function getDashboardStats() {
  return fetchApi<{
    total_users: number;
    active_users_24h: number;
    active_users_7d: number;
    new_users_24h: number;
    total_cost_24h: number;
    total_cost_7d: number;
    total_requests_24h: number;
    open_abuse_alerts: number;
    suspended_users: number;
  }>("/admin/dashboard/stats");
}

// User Management
export async function listUsers(params?: {
  limit?: number;
  offset?: number;
  search?: string;
  is_suspended?: boolean;
  min_level?: number;
  max_level?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.set("limit", params.limit.toString());
  if (params?.offset) queryParams.set("offset", params.offset.toString());
  if (params?.search) queryParams.set("search", params.search);
  if (params?.is_suspended !== undefined) queryParams.set("is_suspended", params.is_suspended.toString());
  if (params?.min_level) queryParams.set("min_level", params.min_level.toString());
  if (params?.max_level) queryParams.set("max_level", params.max_level.toString());
  
  return fetchApi<{
    users: Array<{
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
    }>;
    total: number;
    limit: number;
    offset: number;
  }>(`/admin/users?${queryParams.toString()}`);
}

export async function getUserDetails(userId: string) {
  return fetchApi<{
    id: string;
    display_name: string | null;
    level: number;
    last_activity_at: string | null;
    created_at: string | null;
    learning_stats: {
      new_items: number;
      learning_items: number;
      review_items: number;
      burned_items: number;
      total_items: number;
    };
    chat_stats: {
      total_sessions: number;
      total_messages: number;
      last_chat_at: string | null;
    };
    cost_stats: {
      last_30_days_cost_usd: number;
      last_30_days_tokens: number;
      last_30_days_requests: number;
    };
    suspension: {
      id: string;
      reason: string;
      suspended_until: string | null;
      type: string;
      created_at: string;
    } | null;
    rate_limit_overrides: Array<{
      id: string;
      scope: string;
      endpoint_pattern: string;
      max_requests_per_minute: number | null;
      max_requests_per_hour: number | null;
      max_requests_per_day: number | null;
      expires_at: string;
      reason: string;
    }>;
  }>(`/admin/users/${userId}`);
}

export async function suspendUser(userId: string, data: {
  reason: string;
  suspension_type: "temporary" | "permanent";
  duration_hours?: number;
}) {
  return fetchApi<{
    suspension_id: string;
    user_id: string;
    reason: string;
    type: string;
    suspended_until: string | null;
    created_at: string;
  }>(`/admin/users/${userId}/suspend`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function liftSuspension(suspensionId: string, reason: string) {
  return fetchApi<{
    suspension_id: string;
    user_id: string;
    lifted_at: string;
    reason: string;
  }>(`/admin/suspensions/${suspensionId}/lift`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

// Cost Analytics
export async function getCostAnalytics(days: number = 30, userId?: string) {
  const queryParams = new URLSearchParams();
  queryParams.set("days", days.toString());
  if (userId) queryParams.set("user_id", userId);
  
  return fetchApi<{
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
  }>(`/admin/costs/analytics?${queryParams.toString()}`);
}

export async function getUserCostHistory(userId: string, days: number = 30) {
  return fetchApi<{
    user_id: string;
    period_days: number;
    summary: {
      total_cost_usd: number;
      total_tokens: number;
      total_requests: number;
      avg_latency_ms: number;
    };
    recent_logs: Array<{
      id: string;
      model: string;
      endpoint: string;
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
      cost_usd: number;
      latency_ms: number | null;
      success: boolean;
      error_message: string | null;
      created_at: string;
    }>;
  }>(`/admin/users/${userId}/costs?days=${days}`);
}

// Audit Logs
export async function getAuditLogs(params?: {
  limit?: number;
  offset?: number;
  admin_user_id?: string;
  action?: string;
  target_type?: string;
  target_id?: string;
  days?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.set("limit", params.limit.toString());
  if (params?.offset) queryParams.set("offset", params.offset.toString());
  if (params?.admin_user_id) queryParams.set("admin_user_id", params.admin_user_id);
  if (params?.action) queryParams.set("action", params.action);
  if (params?.target_type) queryParams.set("target_type", params.target_type);
  if (params?.target_id) queryParams.set("target_id", params.target_id);
  if (params?.days) queryParams.set("days", params.days.toString());
  
  return fetchApi<{
    logs: Array<{
      id: string;
      admin_user_id: string;
      admin_name: string | null;
      action: string;
      target_type: string;
      target_id: string | null;
      old_value: Record<string, unknown> | null;
      new_value: Record<string, unknown> | null;
      reason: string | null;
      ip_address: string | null;
      created_at: string;
    }>;
    total: number;
    limit: number;
    offset: number;
  }>(`/admin/audit-logs?${queryParams.toString()}`);
}

// Abuse Alerts
export async function getAbuseAlerts(params?: {
  limit?: number;
  offset?: number;
  status?: string;
  severity?: string;
  alert_type?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.set("limit", params.limit.toString());
  if (params?.offset) queryParams.set("offset", params.offset.toString());
  if (params?.status) queryParams.set("status", params.status);
  if (params?.severity) queryParams.set("severity", params.severity);
  if (params?.alert_type) queryParams.set("alert_type", params.alert_type);
  
  return fetchApi<{
    alerts: Array<{
      id: string;
      alert_type: string;
      severity: string;
      user_id: string | null;
      user_name: string | null;
      ip_address: string | null;
      description: string;
      evidence: Record<string, unknown> | null;
      status: string;
      resolved_by: string | null;
      resolved_at: string | null;
      resolution_notes: string | null;
      created_at: string;
    }>;
    total: number;
    limit: number;
    offset: number;
  }>(`/admin/abuse-alerts?${queryParams.toString()}`);
}

export async function resolveAbuseAlert(alertId: string, data: {
  resolution_notes: string;
  status: "resolved" | "false_positive";
}) {
  return fetchApi<{
    alert_id: string;
    status: string;
    resolved_at: string;
  }>(`/admin/abuse-alerts/${alertId}/resolve`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Rate Limits
export async function getRateLimitOverrides() {
  return fetchApi<{
    overrides: Array<{
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
      created_by: string;
      created_at: string;
    }>;
  }>("/admin/rate-limits");
}

export async function createRateLimitOverride(data: {
  scope: "user" | "ip" | "global";
  endpoint_pattern: string;
  reason: string;
  expires_hours: number;
  user_id?: string;
  ip_address?: string;
  max_requests_per_minute?: number;
  max_requests_per_hour?: number;
  max_requests_per_day?: number;
}) {
  return fetchApi<{
    override_id: string;
    scope: string;
    endpoint_pattern: string;
    expires_at: string;
    created_at: string;
  }>("/admin/rate-limits", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// System Health
export async function getSystemHealth() {
  return fetchApi<{
    status: string;
    db_status: string;
    qdrant_status: string;
    neo4j_status: string;
    degraded: string[];
    timestamp: string;
  }>("/admin/health");
}

// AI Debugging
export async function getUserAgentTraces(userId: string, limit: number = 50) {
  return fetchApi<{
    traces: Array<{
      id: string;
      agent_name: string;
      trace_type: string;
      step_number: number;
      input_data: Record<string, unknown> | null;
      output_data: Record<string, unknown> | null;
      latency_ms: number | null;
      model: string | null;
      tokens_used: number | null;
      error_message: string | null;
      created_at: string;
    }>;
  }>(`/admin/users/${userId}/traces?limit=${limit}`);
}

export async function getUserEpisodicMemory(userId: string) {
  return fetchApi<{
    user_id: string;
    memories: Array<{
      id: string;
      content: string;
      importance: number;
      created_at: string;
    }>;
  }>(`/admin/users/${userId}/memory/episodic`);
}

export async function getUserSemanticMemory(userId: string) {
  return fetchApi<{
    user_id: string;
    graph: {
      nodes: Array<{
        id: string;
        type: string;
        properties: Record<string, unknown>;
      }>;
      relationships: Array<{
        source: string;
        target: string;
        type: string;
      }>;
    };
  }>(`/admin/users/${userId}/memory/semantic`);
}
