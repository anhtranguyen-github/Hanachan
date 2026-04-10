// Admin Service — Business logic for the Admin Control Plane.
// Migrated from FastAPI to Next.js as part of Phase 2 architectural remediation
// Now uses Supabase directly instead of HTTP calls to FastAPI

import { supabase } from "@/lib/supabase";
import { HanaTime } from "@/lib/time";

// Types
export interface DashboardStats {
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

export interface UserListItem {
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

export interface UserListResult {
  users: UserListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface UserDetails {
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
}

// =============================================================================
// DASHBOARD STATS
// =============================================================================

export async function getDashboardStats(): Promise<DashboardStats> {
  const client = supabase;
  
  // Total users
  const { count: totalUsers } = await client
    .from('users')
    .select('*', { count: 'exact', head: true });
  
  // Active users (24h, 7d) - using llm_usage_logs as activity indicator
  const { data: active24h } = await client
    .from('llm_usage_logs')
    .select('user_id')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  
  const { data: active7d } = await client
    .from('llm_usage_logs')
    .select('user_id')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
  
  // New users (24h)
  const { count: newUsers24h } = await client
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  
  // Cost stats
  const { data: cost24h } = await client
    .from('llm_usage_logs')
    .select('estimated_cost_usd')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  
  const { data: cost7d } = await client
    .from('llm_usage_logs')
    .select('estimated_cost_usd')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
  
  // Requests (24h)
  const { count: requests24h } = await client
    .from('llm_usage_logs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  
  // Open abuse alerts
  const { count: openAlerts } = await client
    .from('abuse_alerts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open');
  
  // Suspended users
  const { count: suspendedUsers } = await client
    .from('user_suspensions')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .or('suspended_until.is.null,suspended_until.gt.' + new Date().toISOString());
  
  const uniqueActive24h = new Set(active24h?.map(r => r.user_id)).size;
  const uniqueActive7d = new Set(active7d?.map(r => r.user_id)).size;
  
  const totalCost24h = cost24h?.reduce((sum, r) => sum + (r.estimated_cost_usd || 0), 0) || 0;
  const totalCost7d = cost7d?.reduce((sum, r) => sum + (r.estimated_cost_usd || 0), 0) || 0;
  
  return {
    total_users: totalUsers || 0,
    active_users_24h: uniqueActive24h,
    active_users_7d: uniqueActive7d,
    new_users_24h: newUsers24h || 0,
    total_cost_24h: totalCost24h,
    total_cost_7d: totalCost7d,
    total_requests_24h: requests24h || 0,
    open_abuse_alerts: openAlerts || 0,
    suspended_users: suspendedUsers || 0,
  };
}

// =============================================================================
// USER MANAGEMENT
// =============================================================================

export async function listUsers(params?: {
  limit?: number;
  offset?: number;
  search?: string;
  is_suspended?: boolean;
  min_level?: number;
  max_level?: number;
}): Promise<UserListResult> {
  const client = supabase;
  const limit = params?.limit || 50;
  const offset = params?.offset || 0;
  
  // Build query
  let query = client.from('users').select('*', { count: 'exact' });
  
  if (params?.search) {
    query = query.or(`display_name.ilike.%${params.search}%,id.eq.${params.search}`);
  }
  
  if (params?.min_level !== undefined) {
    query = query.gte('level', params.min_level);
  }
  
  if (params?.max_level !== undefined) {
    query = client.from('users').select('*', { count: 'exact' }).lte('level', params.max_level);
  }
  
  // Get paginated results
  const { data: users, error, count } = await query
    .order('last_activity_at', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);
  
  if (error) {
    console.error('Error listing users:', error);
    return { users: [], total: 0, limit, offset };
  }
  
  // Get user stats in parallel
  const userIds = users?.map(u => u.id) || [];
  
  const [learningStats, chatStats, costStats, suspensions] = await Promise.all([
    // Learning stats
    client.from('user_learning_states')
      .select('user_id')
      .in('user_id', userIds)
      .in('state', ['learning', 'review']),
    
    // Chat stats
    client.from('chat_sessions')
      .select('user_id, chat_messages(count)')
      .in('user_id', userIds),
    
    // Cost stats (today)
    client.from('llm_usage_logs')
      .select('user_id, estimated_cost_usd')
      .in('user_id', userIds)
      .gte('created_at', new Date().toISOString().split('T')[0]),
    
    // Suspensions
    client.from('user_suspensions')
      .select('user_id')
      .in('user_id', userIds)
      .eq('is_active', true)
      .or('suspended_until.is.null,suspended_until.gt.' + new Date().toISOString()),
  ]);
  
  // Aggregate stats
  const learningCount = new Map<string, number>();
  learningStats.data?.forEach(r => {
    learningCount.set(r.user_id, (learningCount.get(r.user_id) || 0) + 1);
  });
  
  const chatCount = new Map<string, number>();
  const messageCount = new Map<string, number>();
  chatStats.data?.forEach((r: any) => {
    chatCount.set(r.user_id, (chatCount.get(r.user_id) || 0) + 1);
    messageCount.set(r.user_id, (messageCount.get(r.user_id) || 0) + (r.chat_messages?.[0]?.count || 0));
  });
  
  const costMap = new Map<string, number>();
  costStats.data?.forEach(r => {
    costMap.set(r.user_id, (costMap.get(r.user_id) || 0) + (r.estimated_cost_usd || 0));
  });
  
  const suspendedSet = new Set(suspensions.data?.map(r => r.user_id));
  
  const resultUsers: UserListItem[] = (users || []).map(u => ({
    id: u.id,
    display_name: u.display_name,
    level: u.level,
    last_activity_at: u.last_activity_at,
    created_at: u.created_at,
    active_learning_items: learningCount.get(u.id) || 0,
    total_chats: chatCount.get(u.id) || 0,
    total_messages: messageCount.get(u.id) || 0,
    is_suspended: suspendedSet.has(u.id),
    today_cost_usd: costMap.get(u.id) || 0,
  }));
  
  // Filter by suspension status if requested
  let filteredUsers = resultUsers;
  if (params?.is_suspended !== undefined) {
    filteredUsers = resultUsers.filter(u => u.is_suspended === params.is_suspended);
  }
  
  return {
    users: filteredUsers,
    total: count || 0,
    limit,
    offset,
  };
}

export async function getUserDetails(userId: string): Promise<UserDetails | null> {
  const client = supabase;
  
  // Get basic user info
  const { data: user, error } = await client
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error || !user) {
    console.error('Error fetching user:', error);
    return null;
  }
  
  // Get learning stats
  const { data: learningStates } = await client
    .from('user_learning_states')
    .select('state')
    .eq('user_id', userId);
  
  const newItems = learningStates?.filter(s => s.state === 'new').length || 0;
  const learningItems = learningStates?.filter(s => s.state === 'learning').length || 0;
  const reviewItems = learningStates?.filter(s => s.state === 'review').length || 0;
  const burnedItems = learningStates?.filter(s => s.state === 'burned').length || 0;
  
  // Get chat stats
  const { data: chatSessions } = await client
    .from('chat_sessions')
    .select('id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  const chatIds = chatSessions?.map(c => c.id) || [];
  let messageCount = 0;
  
  if (chatIds.length > 0) {
    const { count } = await client
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .in('session_id', chatIds);
    messageCount = count || 0;
  }
  
  // Get cost stats (30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { data: costLogs } = await client
    .from('llm_usage_logs')
    .select('estimated_cost_usd, prompt_tokens, completion_tokens')
    .eq('user_id', userId)
    .gte('created_at', thirtyDaysAgo.toISOString());
  
  const totalCost = costLogs?.reduce((sum, r) => sum + (r.estimated_cost_usd || 0), 0) || 0;
  const totalTokens = costLogs?.reduce((sum, r) => sum + (r.prompt_tokens || 0) + (r.completion_tokens || 0), 0) || 0;
  
  // Get suspension info
  const { data: suspension } = await client
    .from('user_suspensions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .or('suspended_until.is.null,suspended_until.gt.' + new Date().toISOString())
    .maybeSingle();
  
  // Get rate limit overrides
  const { data: rateLimits } = await client
    .from('rate_limit_overrides')
    .select('*')
    .eq('user_id', userId)
    .gt('expires_at', new Date().toISOString());
  
  return {
    id: user.id,
    display_name: user.display_name,
    level: user.level,
    last_activity_at: user.last_activity_at,
    created_at: user.created_at,
    learning_stats: {
      new_items: newItems,
      learning_items: learningItems,
      review_items: reviewItems,
      burned_items: burnedItems,
      total_items: learningStates?.length || 0,
    },
    chat_stats: {
      total_sessions: chatSessions?.length || 0,
      total_messages: messageCount,
      last_chat_at: chatSessions?.[0]?.created_at || null,
    },
    cost_stats: {
      last_30_days_cost_usd: totalCost,
      last_30_days_tokens: totalTokens,
      last_30_days_requests: costLogs?.length || 0,
    },
    suspension: suspension ? {
      id: suspension.id,
      reason: suspension.reason,
      suspended_until: suspension.suspended_until,
      type: suspension.suspension_type,
      created_at: suspension.created_at,
    } : null,
    rate_limit_overrides: (rateLimits || []).map(r => ({
      id: r.id,
      scope: r.scope,
      endpoint_pattern: r.endpoint_pattern,
      max_requests_per_minute: r.max_requests_per_minute,
      max_requests_per_hour: r.max_requests_per_hour,
      max_requests_per_day: r.max_requests_per_day,
      expires_at: r.expires_at,
      reason: r.reason,
    })),
  };
}

export async function suspendUser(userId: string, data: {
  reason: string;
  suspension_type: "temporary" | "permanent";
  duration_hours?: number;
}) {
  const client = supabase;
  
  let suspendedUntil = null;
  if (data.suspension_type === 'temporary' && data.duration_hours) {
    suspendedUntil = new Date(Date.now() + data.duration_hours * 60 * 60 * 1000).toISOString();
  }
  
  const { data: suspension, error } = await client
    .from('user_suspensions')
    .insert({
      user_id: userId,
      reason: data.reason,
      suspension_type: data.suspension_type,
      suspended_until: suspendedUntil,
      is_active: true,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error suspending user:', error);
    throw new Error('Failed to suspend user');
  }
  
  return {
    suspension_id: suspension.id,
    user_id: suspension.user_id,
    reason: suspension.reason,
    type: suspension.suspension_type,
    suspended_until: suspension.suspended_until,
    created_at: suspension.created_at,
  };
}

export async function liftSuspension(suspensionId: string, reason: string) {
  const client = supabase;
  
  const { data: suspension, error } = await client
    .from('user_suspensions')
    .update({
      is_active: false,
      lifted_at: new Date().toISOString(),
      lift_reason: reason,
    })
    .eq('id', suspensionId)
    .select()
    .single();
  
  if (error) {
    console.error('Error lifting suspension:', error);
    throw new Error('Failed to lift suspension');
  }
  
  return {
    suspension_id: suspension.id,
    user_id: suspension.user_id,
    lifted_at: suspension.lifted_at,
    reason: reason,
  };
}

// =============================================================================
// COST ANALYTICS
// =============================================================================

export async function getCostAnalytics(days: number = 30, userId?: string) {
  const client = supabase;
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  let query = client
    .from('llm_usage_logs')
    .select('*')
    .gte('created_at', startDate.toISOString());
  
  if (userId) {
    query = query.eq('user_id', userId);
  }
  
  const { data: logs, error } = await query;
  
  if (error) {
    console.error('Error fetching cost analytics:', error);
    throw new Error('Failed to fetch cost analytics');
  }
  
  // Calculate summary
  const totalCost = logs?.reduce((sum, r) => sum + (r.estimated_cost_usd || 0), 0) || 0;
  const promptTokens = logs?.reduce((sum, r) => sum + (r.prompt_tokens || 0), 0) || 0;
  const completionTokens = logs?.reduce((sum, r) => sum + (r.completion_tokens || 0), 0) || 0;
  const totalTokens = promptTokens + completionTokens;
  const uniqueUsers = new Set(logs?.map(r => r.user_id)).size;
  const avgLatency = logs?.length 
    ? (logs.reduce((sum, r) => sum + (r.latency_ms || 0), 0) / logs.length) 
    : 0;
  
  // Group by model
  const byModel = new Map<string, { cost: number; tokens: number; requests: number }>();
  logs?.forEach(r => {
    const existing = byModel.get(r.model) || { cost: 0, tokens: 0, requests: 0 };
    existing.cost += r.estimated_cost_usd || 0;
    existing.tokens += (r.prompt_tokens || 0) + (r.completion_tokens || 0);
    existing.requests += 1;
    byModel.set(r.model, existing);
  });
  
  // Group by endpoint
  const byEndpoint = new Map<string, { cost: number; tokens: number; requests: number }>();
  logs?.forEach(r => {
    const existing = byEndpoint.get(r.endpoint) || { cost: 0, tokens: 0, requests: 0 };
    existing.cost += r.estimated_cost_usd || 0;
    existing.tokens += (r.prompt_tokens || 0) + (r.completion_tokens || 0);
    existing.requests += 1;
    byEndpoint.set(r.endpoint, existing);
  });
  
  // Daily breakdown
  const dailyMap = new Map<string, { cost: number; tokens: number; requests: number; users: Set<string> }>();
  logs?.forEach(r => {
    const date = r.created_at.split('T')[0];
    const existing = dailyMap.get(date) || { cost: 0, tokens: 0, requests: 0, users: new Set() };
    existing.cost += r.estimated_cost_usd || 0;
    existing.tokens += (r.prompt_tokens || 0) + (r.completion_tokens || 0);
    existing.requests += 1;
    existing.users.add(r.user_id);
    dailyMap.set(date, existing);
  });
  
  // Top users
  const userMap = new Map<string, { cost: number; tokens: number; requests: number }>();
  logs?.forEach(r => {
    const existing = userMap.get(r.user_id) || { cost: 0, tokens: 0, requests: 0 };
    existing.cost += r.estimated_cost_usd || 0;
    existing.tokens += (r.prompt_tokens || 0) + (r.completion_tokens || 0);
    existing.requests += 1;
    userMap.set(r.user_id, existing);
  });
  
  return {
    period_days: days,
    summary: {
      total_cost_usd: totalCost,
      total_tokens: totalTokens,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_requests: logs?.length || 0,
      unique_users: uniqueUsers,
      avg_latency_ms: Math.round(avgLatency),
    },
    by_model: Array.from(byModel.entries()).map(([model, stats]) => ({
      model,
      cost_usd: stats.cost,
      tokens: stats.tokens,
      requests: stats.requests,
    })),
    by_endpoint: Array.from(byEndpoint.entries()).map(([endpoint, stats]) => ({
      endpoint,
      cost_usd: stats.cost,
      tokens: stats.tokens,
      requests: stats.requests,
    })),
    daily_breakdown: Array.from(dailyMap.entries()).map(([date, stats]) => ({
      date,
      cost_usd: stats.cost,
      tokens: stats.tokens,
      requests: stats.requests,
      unique_users: stats.users.size,
    })),
    top_users: Array.from(userMap.entries())
      .sort((a, b) => b[1].cost - a[1].cost)
      .slice(0, 10)
      .map(([userId, stats]) => ({
        user_id: userId,
        display_name: null, // Would need to fetch user names
        cost_usd: stats.cost,
        tokens: stats.tokens,
        requests: stats.requests,
      })),
  };
}

export async function getUserCostHistory(userId: string, days: number = 30) {
  const client = supabase;
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const { data: logs, error } = await client
    .from('llm_usage_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching user cost history:', error);
    throw new Error('Failed to fetch user cost history');
  }
  
  const totalCost = logs?.reduce((sum, r) => sum + (r.estimated_cost_usd || 0), 0) || 0;
  const totalTokens = logs?.reduce((sum, r) => sum + (r.prompt_tokens || 0) + (r.completion_tokens || 0), 0) || 0;
  const avgLatency = logs?.length 
    ? (logs.reduce((sum, r) => sum + (r.latency_ms || 0), 0) / logs.length) 
    : 0;
  
  return {
    user_id: userId,
    period_days: days,
    summary: {
      total_cost_usd: totalCost,
      total_tokens: totalTokens,
      total_requests: logs?.length || 0,
      avg_latency_ms: Math.round(avgLatency),
    },
    recent_logs: (logs || []).map(r => ({
      id: r.id,
      model: r.model,
      endpoint: r.endpoint,
      prompt_tokens: r.prompt_tokens,
      completion_tokens: r.completion_tokens,
      total_tokens: (r.prompt_tokens || 0) + (r.completion_tokens || 0),
      cost_usd: r.estimated_cost_usd,
      latency_ms: r.latency_ms,
      success: r.success,
      error_message: r.error_message,
      created_at: r.created_at,
    })),
  };
}

// =============================================================================
// AUDIT LOGS
// =============================================================================

export async function getAuditLogs(params?: {
  limit?: number;
  offset?: number;
  admin_user_id?: string;
  action?: string;
  target_type?: string;
  target_id?: string;
  days?: number;
}) {
  const client = supabase;
  
  const limit = params?.limit || 50;
  const offset = params?.offset || 0;
  
  let query = client.from('admin_audit_logs').select('*', { count: 'exact' });
  
  if (params?.admin_user_id) {
    query = query.eq('admin_user_id', params.admin_user_id);
  }
  
  if (params?.action) {
    query = query.eq('action', params.action);
  }
  
  if (params?.target_type) {
    query = query.eq('target_type', params.target_type);
  }
  
  if (params?.target_id) {
    query = query.eq('target_id', params.target_id);
  }
  
  if (params?.days) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - params.days);
    query = query.gte('created_at', startDate.toISOString());
  }
  
  const { data: logs, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (error) {
    console.error('Error fetching audit logs:', error);
    throw new Error('Failed to fetch audit logs');
  }
  
  return {
    logs: (logs || []).map(r => ({
      id: r.id,
      admin_user_id: r.admin_user_id,
      admin_name: r.admin_name,
      action: r.action,
      target_type: r.target_type,
      target_id: r.target_id,
      old_value: r.old_value,
      new_value: r.new_value,
      reason: r.reason,
      ip_address: r.ip_address,
      created_at: r.created_at,
    })),
    total: count || 0,
    limit,
    offset,
  };
}

// =============================================================================
// ABUSE ALERTS
// =============================================================================

export async function getAbuseAlerts(params?: {
  limit?: number;
  offset?: number;
  status?: string;
  severity?: string;
  alert_type?: string;
}) {
  const client = supabase;
  
  const limit = params?.limit || 50;
  const offset = params?.offset || 0;
  
  let query = client.from('abuse_alerts').select('*', { count: 'exact' });
  
  if (params?.status) {
    query = query.eq('status', params.status);
  }
  
  if (params?.severity) {
    query = query.eq('severity', params.severity);
  }
  
  if (params?.alert_type) {
    query = query.eq('alert_type', params.alert_type);
  }
  
  const { data: alerts, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (error) {
    console.error('Error fetching abuse alerts:', error);
    throw new Error('Failed to fetch abuse alerts');
  }
  
  return {
    alerts: (alerts || []).map(r => ({
      id: r.id,
      alert_type: r.alert_type,
      severity: r.severity,
      user_id: r.user_id,
      user_name: r.user_name,
      ip_address: r.ip_address,
      description: r.description,
      evidence: r.evidence,
      status: r.status,
      resolved_by: r.resolved_by,
      resolution_notes: r.resolution_notes,
      created_at: r.created_at,
      resolved_at: r.resolved_at,
    })),
    total: count || 0,
    limit,
    offset,
  };
}

export async function resolveAbuseAlert(
  alertId: string,
  resolution: { resolution_notes: string; status: "resolved" | "false_positive" }
) {
  const client = supabase;
  
  const { data: alert, error } = await client
    .from('abuse_alerts')
    .update({
      status: resolution.status,
      resolution_notes: resolution.resolution_notes,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', alertId)
    .select()
    .single();
  
  if (error) {
    console.error('Error resolving abuse alert:', error);
    throw new Error('Failed to resolve abuse alert');
  }
  
  return {
    alert_id: alert.id,
    status: alert.status,
    resolved_at: alert.resolved_at,
  };
}

// =============================================================================
// SYSTEM HEALTH
// =============================================================================

export async function getSystemHealth(): Promise<{
  status: string;
  db_status: string;
  qdrant_status: string;
  neo4j_status: string;
  degraded: string[];
  timestamp: string;
}> {
  const client = supabase;
  const degraded: string[] = [];
  
  // Check database connectivity
  const startTime = Date.now();
  const { error: dbError } = await client.from('users').select('id', { count: 'exact', head: true });
  const dbLatency = Date.now() - startTime;
  
  if (dbError) {
    degraded.push('database');
  }
  
  // For Phase 2, we report on the services we can check
  // Qdrant and Neo4j are managed by FastAPI backend
  const dbStatus = dbError ? 'error' : 'ok';
  
  return {
    status: degraded.length > 0 ? 'degraded' : 'healthy',
    db_status: dbStatus,
    qdrant_status: 'unknown', // Managed by FastAPI
    neo4j_status: 'unknown',  // Managed by FastAPI
    degraded,
    timestamp: new Date().toISOString(),
  };
}

// =============================================================================
// DEBUG / MEMORY (Stub implementations for Phase 2)
// These functions connect to the FastAPI backend for agent debugging
// =============================================================================

export interface AgentTrace {
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
}

export async function getUserAgentTraces(userId: string, limit: number = 50) {
  // Phase 2: This would query the FastAPI backend
  // For now, return empty result to satisfy type checking
  return {
    traces: [] as AgentTrace[],
  };
}

export async function getUserEpisodicMemory(userId: string, limit: number = 20) {
  // Phase 2: This would query the FastAPI backend
  return {
    memories: [] as Array<{
      id: string;
      content: string;
      importance: number;
      created_at: string;
    }>,
  };
}

export async function getUserSemanticMemory(userId: string, query?: string, limit: number = 10) {
  // Phase 2: This would query the FastAPI backend
  return {
    graph: {
      nodes: [] as unknown[],
      relationships: [] as unknown[],
    },
  };
}

// =============================================================================
// RATE LIMIT OVERRIDES (Stub implementations for Phase 2)
// =============================================================================

export interface RateLimitOverride {
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
  created_at: string;
}

export async function getRateLimitOverrides() {
  const client = supabase;
  const now = new Date().toISOString();

  const { data, error } = await client
    .from('rate_limit_overrides')
    .select('*')
    .gt('expires_at', now)
    .order('expires_at', { ascending: true });

  if (error) {
    console.error('Error loading rate limit overrides:', error);
    throw new Error('Failed to load rate limit overrides');
  }

  return {
    overrides: (data || []) as RateLimitOverride[],
  };
}

export async function createRateLimitOverride(override: {
  scope: string;
  endpoint_pattern: string;
  reason: string;
  expires_hours: number;
  user_id?: string;
  user_name?: string;
  ip_address?: string;
  max_requests_per_minute: number | null;
  max_requests_per_hour: number | null;
  max_requests_per_day: number | null;
}): Promise<RateLimitOverride> {
  const client = supabase;
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError || !authData.user) {
    throw new Error('Admin authentication required');
  }

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + override.expires_hours);

  const { data, error } = await client
    .from('rate_limit_overrides')
    .insert({
      user_id: override.user_id || null,
      ip_address: override.ip_address || null,
      scope: override.scope,
      endpoint_pattern: override.endpoint_pattern,
      max_requests_per_minute: override.max_requests_per_minute,
      max_requests_per_hour: override.max_requests_per_hour,
      max_requests_per_day: override.max_requests_per_day,
      expires_at: expiresAt.toISOString(),
      reason: override.reason,
      created_by: authData.user.id,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Error creating rate limit override:', error);
    throw new Error('Failed to create rate limit override');
  }

  return data as RateLimitOverride;
}
