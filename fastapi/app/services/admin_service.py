"""
Admin Service — Business logic for the Admin Control Plane.

Handles:
- User management (view, suspend, audit)
- Cost tracking and analytics
- System health monitoring
- Abuse detection
- Audit log queries
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from ..core.database import get_db_pool

logger = logging.getLogger(__name__)


# =============================================================================
# USER MANAGEMENT
# =============================================================================

async def list_users(
    limit: int = 50,
    offset: int = 0,
    search: Optional[str] = None,
    is_suspended: Optional[bool] = None,
    min_level: Optional[int] = None,
    max_level: Optional[int] = None,
) -> dict:
    """List users with filtering and pagination."""
    pool = get_db_pool()
    
    # Build dynamic query
    conditions = []
    params = []
    param_idx = 1
    
    if search:
        conditions.append(f"(u.display_name ILIKE ${param_idx} OR u.id::text = ${param_idx})")
        params.append(f"%{search}%")
        param_idx += 1
    
    if is_suspended is not None:
        if is_suspended:
            conditions.append(f"EXISTS (SELECT 1 FROM user_suspensions s WHERE s.user_id = u.id AND s.is_active = true AND (s.suspended_until IS NULL OR s.suspended_until > now()))")
        else:
            conditions.append(f"NOT EXISTS (SELECT 1 FROM user_suspensions s WHERE s.user_id = u.id AND s.is_active = true AND (s.suspended_until IS NULL OR s.suspended_until > now()))")
    
    if min_level is not None:
        conditions.append(f"u.level >= ${param_idx}")
        params.append(min_level)
        param_idx += 1
    
    if max_level is not None:
        conditions.append(f"u.level <= ${param_idx}")
        params.append(max_level)
        param_idx += 1
    
    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    
    async with pool.acquire() as conn:
        # Get total count
        count_query = f"""
            SELECT COUNT(*) FROM users u
            {where_clause}
        """
        total = await conn.fetchval(count_query, *params)
        
        # Get paginated results with aggregated data
        query = f"""
            SELECT 
                u.id,
                u.display_name,
                u.level,
                u.last_activity_at,
                u.created_at,
                COALESCE(ls.active_items, 0) as active_learning_items,
                COALESCE(cs.chat_count, 0) as total_chats,
                COALESCE(cs.message_count, 0) as total_messages,
                EXISTS (
                    SELECT 1 FROM user_suspensions s 
                    WHERE s.user_id = u.id AND s.is_active = true 
                    AND (s.suspended_until IS NULL OR s.suspended_until > now())
                ) as is_suspended,
                COALESCE(cost.daily_cost, 0) as today_cost_usd
            FROM users u
            LEFT JOIN (
                SELECT user_id, COUNT(*) as active_items 
                FROM user_learning_states 
                WHERE state IN ('learning', 'review')
                GROUP BY user_id
            ) ls ON ls.user_id = u.id
            LEFT JOIN (
                SELECT 
                    cs.user_id,
                    COUNT(DISTINCT cs.id) as chat_count,
                    COUNT(cm.id) as message_count
                FROM chat_sessions cs
                LEFT JOIN chat_messages cm ON cm.session_id = cs.id
                GROUP BY cs.user_id
            ) cs ON cs.user_id = u.id
            LEFT JOIN (
                SELECT user_id, SUM(estimated_cost_usd) as daily_cost
                FROM llm_usage_logs
                WHERE created_at >= CURRENT_DATE
                GROUP BY user_id
            ) cost ON cost.user_id = u.id
            {where_clause}
            ORDER BY u.last_activity_at DESC NULLS LAST
            LIMIT ${param_idx} OFFSET ${param_idx + 1}
        """
        params.extend([limit, offset])
        
        rows = await conn.fetch(query, *params)
        
        users = []
        for row in rows:
            users.append({
                "id": str(row["id"]),
                "display_name": row["display_name"],
                "level": row["level"],
                "last_activity_at": row["last_activity_at"].isoformat() if row["last_activity_at"] else None,
                "created_at": row["created_at"].isoformat() if row["created_at"] else None,
                "active_learning_items": row["active_learning_items"],
                "total_chats": row["total_chats"],
                "total_messages": row["total_messages"],
                "is_suspended": row["is_suspended"],
                "today_cost_usd": float(row["today_cost_usd"]) if row["today_cost_usd"] else 0,
            })
        
        return {
            "users": users,
            "total": total,
            "limit": limit,
            "offset": offset,
        }


async def get_user_details(user_id: str) -> Optional[dict]:
    """Get detailed information about a specific user."""
    pool = get_db_pool()
    
    async with pool.acquire() as conn:
        # Basic user info
        user_row = await conn.fetchrow(
            """
            SELECT 
                u.id,
                u.display_name,
                u.level,
                u.last_activity_at,
                u.created_at
            FROM users u
            WHERE u.id = $1
            """,
            UUID(user_id),
        )
        
        if not user_row:
            return None
        
        # Learning stats
        learning_stats = await conn.fetchrow(
            """
            SELECT 
                COUNT(*) FILTER (WHERE state = 'new') as new_items,
                COUNT(*) FILTER (WHERE state = 'learning') as learning_items,
                COUNT(*) FILTER (WHERE state = 'review') as review_items,
                COUNT(*) FILTER (WHERE state = 'burned') as burned_items,
                COUNT(*) as total_items
            FROM user_learning_states
            WHERE user_id = $1
            """,
            UUID(user_id),
        )
        
        # Chat stats
        chat_stats = await conn.fetchrow(
            """
            SELECT 
                COUNT(DISTINCT cs.id) as total_sessions,
                COUNT(cm.id) as total_messages,
                MAX(cs.created_at) as last_chat_at
            FROM chat_sessions cs
            LEFT JOIN chat_messages cm ON cm.session_id = cs.id
            WHERE cs.user_id = $1
            """,
            UUID(user_id),
        )
        
        # Cost stats (last 30 days)
        cost_stats = await conn.fetchrow(
            """
            SELECT 
                SUM(estimated_cost_usd) as total_cost,
                SUM(total_tokens) as total_tokens,
                COUNT(*) as total_requests
            FROM llm_usage_logs
            WHERE user_id = $1 AND created_at >= now() - interval '30 days'
            """,
            UUID(user_id),
        )
        
        # Suspension status
        suspension = await conn.fetchrow(
            """
            SELECT 
                id, reason, suspended_until, suspension_type, created_at
            FROM user_suspensions
            WHERE user_id = $1 AND is_active = true
            AND (suspended_until IS NULL OR suspended_until > now())
            ORDER BY created_at DESC
            LIMIT 1
            """,
            UUID(user_id),
        )
        
        # Rate limit overrides
        rate_overrides = await conn.fetch(
            """
            SELECT 
                id, scope, endpoint_pattern, max_requests_per_minute,
                max_requests_per_hour, max_requests_per_day, expires_at, reason
            FROM rate_limit_overrides
            WHERE (user_id = $1 OR scope = 'global') AND expires_at > now()
            ORDER BY created_at DESC
            """,
            UUID(user_id),
        )
        
        return {
            "id": str(user_row["id"]),
            "display_name": user_row["display_name"],
            "level": user_row["level"],
            "last_activity_at": user_row["last_activity_at"].isoformat() if user_row["last_activity_at"] else None,
            "created_at": user_row["created_at"].isoformat() if user_row["created_at"] else None,
            "learning_stats": {
                "new_items": learning_stats["new_items"] or 0,
                "learning_items": learning_stats["learning_items"] or 0,
                "review_items": learning_stats["review_items"] or 0,
                "burned_items": learning_stats["burned_items"] or 0,
                "total_items": learning_stats["total_items"] or 0,
            },
            "chat_stats": {
                "total_sessions": chat_stats["total_sessions"] or 0,
                "total_messages": chat_stats["total_messages"] or 0,
                "last_chat_at": chat_stats["last_chat_at"].isoformat() if chat_stats["last_chat_at"] else None,
            },
            "cost_stats": {
                "last_30_days_cost_usd": float(cost_stats["total_cost"]) if cost_stats["total_cost"] else 0,
                "last_30_days_tokens": cost_stats["total_tokens"] or 0,
                "last_30_days_requests": cost_stats["total_requests"] or 0,
            },
            "suspension": {
                "id": str(suspension["id"]),
                "reason": suspension["reason"],
                "suspended_until": suspension["suspended_until"].isoformat() if suspension["suspended_until"] else None,
                "type": suspension["suspension_type"],
                "created_at": suspension["created_at"].isoformat(),
            } if suspension else None,
            "rate_limit_overrides": [
                {
                    "id": str(r["id"]),
                    "scope": r["scope"],
                    "endpoint_pattern": r["endpoint_pattern"],
                    "max_requests_per_minute": r["max_requests_per_minute"],
                    "max_requests_per_hour": r["max_requests_per_hour"],
                    "max_requests_per_day": r["max_requests_per_day"],
                    "expires_at": r["expires_at"].isoformat(),
                    "reason": r["reason"],
                }
                for r in rate_overrides
            ],
        }


async def suspend_user(
    user_id: str,
    suspended_by: str,
    reason: str,
    suspension_type: str = "temporary",
    duration_hours: Optional[int] = None,
) -> dict:
    """Suspend a user account."""
    pool = get_db_pool()
    
    suspended_until = None
    if duration_hours and suspension_type == "temporary":
        suspended_until = datetime.now(timezone.utc) + timedelta(hours=duration_hours)
    
    async with pool.acquire() as conn:
        # Deactivate any existing active suspensions
        await conn.execute(
            """
            UPDATE user_suspensions
            SET is_active = false, lifted_at = now(), lift_reason = 'Superseded by new suspension'
            WHERE user_id = $1 AND is_active = true
            """,
            UUID(user_id),
        )
        
        # Create new suspension
        row = await conn.fetchrow(
            """
            INSERT INTO user_suspensions
            (user_id, suspended_by, reason, suspension_type, suspended_until)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, created_at
            """,
            UUID(user_id),
            UUID(suspended_by),
            reason,
            suspension_type,
            suspended_until,
        )
        
        return {
            "suspension_id": str(row["id"]),
            "user_id": user_id,
            "reason": reason,
            "type": suspension_type,
            "suspended_until": suspended_until.isoformat() if suspended_until else None,
            "created_at": row["created_at"].isoformat(),
        }


async def lift_suspension(
    suspension_id: str,
    lifted_by: str,
    reason: str,
) -> dict:
    """Lift a user suspension."""
    pool = get_db_pool()
    
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            UPDATE user_suspensions
            SET is_active = false, lifted_by = $2, lifted_at = now(), lift_reason = $3
            WHERE id = $1 AND is_active = true
            RETURNING user_id
            """,
            UUID(suspension_id),
            UUID(lifted_by),
            reason,
        )
        
        if not row:
            raise ValueError("Suspension not found or already lifted")
        
        return {
            "suspension_id": suspension_id,
            "user_id": str(row["user_id"]),
            "lifted_at": datetime.now(timezone.utc).isoformat(),
            "reason": reason,
        }


# =============================================================================
# COST TRACKING & ANALYTICS
# =============================================================================

async def get_cost_analytics(
    days: int = 30,
    user_id: Optional[str] = None,
) -> dict:
    """Get cost analytics for the specified period."""
    pool = get_db_pool()
    
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    async with pool.acquire() as conn:
        # Overall stats
        overall_stats = await conn.fetchrow(
            """
            SELECT 
                SUM(estimated_cost_usd) as total_cost,
                SUM(total_tokens) as total_tokens,
                SUM(prompt_tokens) as prompt_tokens,
                SUM(completion_tokens) as completion_tokens,
                COUNT(*) as total_requests,
                COUNT(DISTINCT user_id) as unique_users,
                AVG(latency_ms) as avg_latency_ms
            FROM llm_usage_logs
            WHERE created_at >= $1
            """ + (" AND user_id = $2" if user_id else ""),
            start_date,
            *(UUID(user_id),) if user_id else (),
        )
        
        # Stats by model
        model_stats = await conn.fetch(
            """
            SELECT 
                model,
                SUM(estimated_cost_usd) as cost,
                SUM(total_tokens) as tokens,
                COUNT(*) as requests
            FROM llm_usage_logs
            WHERE created_at >= $1
            GROUP BY model
            ORDER BY cost DESC
            """,
            start_date,
        )
        
        # Stats by endpoint
        endpoint_stats = await conn.fetch(
            """
            SELECT 
                endpoint,
                SUM(estimated_cost_usd) as cost,
                SUM(total_tokens) as tokens,
                COUNT(*) as requests
            FROM llm_usage_logs
            WHERE created_at >= $1
            GROUP BY endpoint
            ORDER BY cost DESC
            """,
            start_date,
        )
        
        # Daily breakdown
        daily_stats = await conn.fetch(
            """
            SELECT 
                DATE(created_at) as date,
                SUM(estimated_cost_usd) as cost,
                SUM(total_tokens) as tokens,
                COUNT(*) as requests,
                COUNT(DISTINCT user_id) as unique_users
            FROM llm_usage_logs
            WHERE created_at >= $1
            GROUP BY DATE(created_at)
            ORDER BY date DESC
            """,
            start_date,
        )
        
        # Top users by cost
        top_users = await conn.fetch(
            """
            SELECT 
                u.id,
                u.display_name,
                SUM(l.estimated_cost_usd) as cost,
                SUM(l.total_tokens) as tokens,
                COUNT(*) as requests
            FROM llm_usage_logs l
            JOIN users u ON u.id = l.user_id
            WHERE l.created_at >= $1
            GROUP BY u.id, u.display_name
            ORDER BY cost DESC
            LIMIT 20
            """,
            start_date,
        )
        
        return {
            "period_days": days,
            "summary": {
                "total_cost_usd": float(overall_stats["total_cost"]) if overall_stats["total_cost"] else 0,
                "total_tokens": overall_stats["total_tokens"] or 0,
                "prompt_tokens": overall_stats["prompt_tokens"] or 0,
                "completion_tokens": overall_stats["completion_tokens"] or 0,
                "total_requests": overall_stats["total_requests"] or 0,
                "unique_users": overall_stats["unique_users"] or 0,
                "avg_latency_ms": round(overall_stats["avg_latency_ms"]) if overall_stats["avg_latency_ms"] else 0,
            },
            "by_model": [
                {
                    "model": r["model"],
                    "cost_usd": float(r["cost"]),
                    "tokens": r["tokens"],
                    "requests": r["requests"],
                }
                for r in model_stats
            ],
            "by_endpoint": [
                {
                    "endpoint": r["endpoint"],
                    "cost_usd": float(r["cost"]),
                    "tokens": r["tokens"],
                    "requests": r["requests"],
                }
                for r in endpoint_stats
            ],
            "daily_breakdown": [
                {
                    "date": r["date"].isoformat(),
                    "cost_usd": float(r["cost"]),
                    "tokens": r["tokens"],
                    "requests": r["requests"],
                    "unique_users": r["unique_users"],
                }
                for r in daily_stats
            ],
            "top_users": [
                {
                    "user_id": str(r["id"]),
                    "display_name": r["display_name"],
                    "cost_usd": float(r["cost"]),
                    "tokens": r["tokens"],
                    "requests": r["requests"],
                }
                for r in top_users
            ],
        }


async def get_user_cost_history(
    user_id: str,
    days: int = 30,
) -> dict:
    """Get detailed cost history for a specific user."""
    pool = get_db_pool()
    
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    async with pool.acquire() as conn:
        # Summary
        summary = await conn.fetchrow(
            """
            SELECT 
                SUM(estimated_cost_usd) as total_cost,
                SUM(total_tokens) as total_tokens,
                COUNT(*) as total_requests,
                AVG(latency_ms) as avg_latency
            FROM llm_usage_logs
            WHERE user_id = $1 AND created_at >= $2
            """,
            UUID(user_id),
            start_date,
        )
        
        # Detailed logs
        logs = await conn.fetch(
            """
            SELECT 
                id,
                model,
                endpoint,
                prompt_tokens,
                completion_tokens,
                total_tokens,
                estimated_cost_usd,
                latency_ms,
                success,
                error_message,
                created_at
            FROM llm_usage_logs
            WHERE user_id = $1 AND created_at >= $2
            ORDER BY created_at DESC
            LIMIT 100
            """,
            UUID(user_id),
            start_date,
        )
        
        return {
            "user_id": user_id,
            "period_days": days,
            "summary": {
                "total_cost_usd": float(summary["total_cost"]) if summary["total_cost"] else 0,
                "total_tokens": summary["total_tokens"] or 0,
                "total_requests": summary["total_requests"] or 0,
                "avg_latency_ms": round(summary["avg_latency"]) if summary["avg_latency"] else 0,
            },
            "recent_logs": [
                {
                    "id": str(r["id"]),
                    "model": r["model"],
                    "endpoint": r["endpoint"],
                    "prompt_tokens": r["prompt_tokens"],
                    "completion_tokens": r["completion_tokens"],
                    "total_tokens": r["total_tokens"],
                    "cost_usd": float(r["estimated_cost_usd"]),
                    "latency_ms": r["latency_ms"],
                    "success": r["success"],
                    "error_message": r["error_message"],
                    "created_at": r["created_at"].isoformat(),
                }
                for r in logs
            ],
        }


# =============================================================================
# AUDIT LOGS
# =============================================================================

async def get_audit_logs(
    limit: int = 50,
    offset: int = 0,
    admin_user_id: Optional[str] = None,
    action: Optional[str] = None,
    target_type: Optional[str] = None,
    target_id: Optional[str] = None,
    days: int = 30,
) -> dict:
    """Query admin audit logs with filtering."""
    pool = get_db_pool()
    
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    conditions = ["created_at >= $1"]
    params = [start_date]
    param_idx = 2
    
    if admin_user_id:
        conditions.append(f"admin_user_id = ${param_idx}")
        params.append(UUID(admin_user_id))
        param_idx += 1
    
    if action:
        conditions.append(f"action = ${param_idx}")
        params.append(action)
        param_idx += 1
    
    if target_type:
        conditions.append(f"target_type = ${param_idx}")
        params.append(target_type)
        param_idx += 1
    
    if target_id:
        conditions.append(f"target_id = ${param_idx}")
        params.append(target_id)
        param_idx += 1
    
    where_clause = " AND ".join(conditions)
    
    async with pool.acquire() as conn:
        # Count
        count_query = f"""
            SELECT COUNT(*) FROM admin_audit_logs
            WHERE {where_clause}
        """
        total = await conn.fetchval(count_query, *params)
        
        # Fetch logs
        query = f"""
            SELECT 
                l.id,
                l.admin_user_id,
                a.display_name as admin_name,
                l.action,
                l.target_type,
                l.target_id,
                l.old_value,
                l.new_value,
                l.reason,
                l.ip_address,
                l.created_at
            FROM admin_audit_logs l
            LEFT JOIN users a ON a.id = l.admin_user_id
            WHERE {where_clause}
            ORDER BY l.created_at DESC
            LIMIT ${param_idx} OFFSET ${param_idx + 1}
        """
        params.extend([limit, offset])
        
        rows = await conn.fetch(query, *params)
        
        return {
            "logs": [
                {
                    "id": str(r["id"]),
                    "admin_user_id": str(r["admin_user_id"]),
                    "admin_name": r["admin_name"],
                    "action": r["action"],
                    "target_type": r["target_type"],
                    "target_id": r["target_id"],
                    "old_value": r["old_value"],
                    "new_value": r["new_value"],
                    "reason": r["reason"],
                    "ip_address": str(r["ip_address"]) if r["ip_address"] else None,
                    "created_at": r["created_at"].isoformat(),
                }
                for r in rows
            ],
            "total": total,
            "limit": limit,
            "offset": offset,
        }


# =============================================================================
# ABUSE DETECTION
# =============================================================================

async def get_abuse_alerts(
    limit: int = 50,
    offset: int = 0,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    alert_type: Optional[str] = None,
) -> dict:
    """Get abuse detection alerts."""
    pool = get_db_pool()
    
    conditions = []
    params = []
    param_idx = 1
    
    if status:
        conditions.append(f"status = ${param_idx}")
        params.append(status)
        param_idx += 1
    
    if severity:
        conditions.append(f"severity = ${param_idx}")
        params.append(severity)
        param_idx += 1
    
    if alert_type:
        conditions.append(f"alert_type = ${param_idx}")
        params.append(alert_type)
        param_idx += 1
    
    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    
    async with pool.acquire() as conn:
        # Count
        count_query = f"""
            SELECT COUNT(*) FROM abuse_alerts
            {where_clause}
        """
        total = await conn.fetchval(count_query, *params)
        
        # Fetch alerts
        query = f"""
            SELECT 
                a.id,
                a.alert_type,
                a.severity,
                a.user_id,
                u.display_name as user_name,
                a.ip_address,
                a.description,
                a.evidence,
                a.status,
                a.resolved_by,
                a.resolved_at,
                a.resolution_notes,
                a.created_at
            FROM abuse_alerts a
            LEFT JOIN users u ON u.id = a.user_id
            {where_clause}
            ORDER BY 
                CASE a.severity
                    WHEN 'critical' THEN 1
                    WHEN 'high' THEN 2
                    WHEN 'medium' THEN 3
                    WHEN 'low' THEN 4
                END,
                a.created_at DESC
            LIMIT ${param_idx} OFFSET ${param_idx + 1}
        """
        params.extend([limit, offset])
        
        rows = await conn.fetch(query, *params)
        
        return {
            "alerts": [
                {
                    "id": str(r["id"]),
                    "alert_type": r["alert_type"],
                    "severity": r["severity"],
                    "user_id": str(r["user_id"]) if r["user_id"] else None,
                    "user_name": r["user_name"],
                    "ip_address": str(r["ip_address"]) if r["ip_address"] else None,
                    "description": r["description"],
                    "evidence": r["evidence"],
                    "status": r["status"],
                    "resolved_by": str(r["resolved_by"]) if r["resolved_by"] else None,
                    "resolved_at": r["resolved_at"].isoformat() if r["resolved_at"] else None,
                    "resolution_notes": r["resolution_notes"],
                    "created_at": r["created_at"].isoformat(),
                }
                for r in rows
            ],
            "total": total,
            "limit": limit,
            "offset": offset,
        }


async def create_abuse_alert(
    alert_type: str,
    severity: str,
    description: str,
    user_id: Optional[str] = None,
    ip_address: Optional[str] = None,
    evidence: Optional[dict] = None,
) -> dict:
    """Create a new abuse alert."""
    pool = get_db_pool()
    
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO abuse_alerts
            (alert_type, severity, user_id, ip_address, description, evidence)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, created_at
            """,
            alert_type,
            severity,
            UUID(user_id) if user_id else None,
            ip_address,
            description,
            evidence,
        )
        
        return {
            "alert_id": str(row["id"]),
            "alert_type": alert_type,
            "severity": severity,
            "created_at": row["created_at"].isoformat(),
        }


async def resolve_abuse_alert(
    alert_id: str,
    resolved_by: str,
    resolution_notes: str,
    status: str = "resolved",
) -> dict:
    """Resolve an abuse alert."""
    pool = get_db_pool()
    
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            UPDATE abuse_alerts
            SET status = $3, resolved_by = $2, resolved_at = now(), resolution_notes = $4
            WHERE id = $1
            RETURNING id
            """,
            UUID(alert_id),
            UUID(resolved_by),
            status,
            resolution_notes,
        )
        
        if not row:
            raise ValueError("Alert not found")
        
        return {
            "alert_id": alert_id,
            "status": status,
            "resolved_at": datetime.now(timezone.utc).isoformat(),
        }


# =============================================================================
# RATE LIMIT MANAGEMENT
# =============================================================================

async def create_rate_limit_override(
    created_by: str,
    scope: str,
    endpoint_pattern: str,
    reason: str,
    expires_hours: int = 24,
    user_id: Optional[str] = None,
    ip_address: Optional[str] = None,
    max_requests_per_minute: Optional[int] = None,
    max_requests_per_hour: Optional[int] = None,
    max_requests_per_day: Optional[int] = None,
) -> dict:
    """Create a rate limit override."""
    pool = get_db_pool()
    
    expires_at = datetime.now(timezone.utc) + timedelta(hours=expires_hours)
    
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO rate_limit_overrides
            (user_id, ip_address, scope, endpoint_pattern, max_requests_per_minute,
             max_requests_per_hour, max_requests_per_day, expires_at, reason, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, created_at
            """,
            UUID(user_id) if user_id else None,
            ip_address,
            scope,
            endpoint_pattern,
            max_requests_per_minute,
            max_requests_per_hour,
            max_requests_per_day,
            expires_at,
            reason,
            UUID(created_by),
        )
        
        return {
            "override_id": str(row["id"]),
            "scope": scope,
            "endpoint_pattern": endpoint_pattern,
            "expires_at": expires_at.isoformat(),
            "created_at": row["created_at"].isoformat(),
        }


async def get_active_rate_limit_overrides(limit: int = 50) -> dict:
    """Get all active rate limit overrides."""
    pool = get_db_pool()
    
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT 
                r.id,
                r.user_id,
                u.display_name as user_name,
                r.ip_address,
                r.scope,
                r.endpoint_pattern,
                r.max_requests_per_minute,
                r.max_requests_per_hour,
                r.max_requests_per_day,
                r.expires_at,
                r.reason,
                r.created_by,
                r.created_at
            FROM rate_limit_overrides r
            LEFT JOIN users u ON u.id = r.user_id
            WHERE r.expires_at > now()
            ORDER BY r.created_at DESC
            LIMIT $1
            """,
            limit,
        )
        
        return {
            "overrides": [
                {
                    "id": str(r["id"]),
                    "user_id": str(r["user_id"]) if r["user_id"] else None,
                    "user_name": r["user_name"],
                    "ip_address": str(r["ip_address"]) if r["ip_address"] else None,
                    "scope": r["scope"],
                    "endpoint_pattern": r["endpoint_pattern"],
                    "max_requests_per_minute": r["max_requests_per_minute"],
                    "max_requests_per_hour": r["max_requests_per_hour"],
                    "max_requests_per_day": r["max_requests_per_day"],
                    "expires_at": r["expires_at"].isoformat(),
                    "reason": r["reason"],
                    "created_by": str(r["created_by"]),
                    "created_at": r["created_at"].isoformat(),
                }
                for r in rows
            ],
        }
