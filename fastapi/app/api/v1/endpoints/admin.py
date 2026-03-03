"""
Admin API Endpoints — Admin Control Plane for the AI Japanese Learning Application.

⚠️  ARCHITECTURE VIOLATION WARNING ⚠️
This module contains admin endpoints that should be called through Next.js BFF.
FastAPI = Agents ONLY (stateless, no auth).
Admin auth must be handled by Supabase/Next.js (BFF pattern).

This module implements the CONTROL PLANE functionality:
- User management (view, suspend, audit)
- System monitoring (health, metrics)
- Cost tracking (LLM usage, rate limits)
- Abuse detection
- Audit logging

Architecture Note:
  Auth removed from FastAPI per architecture rules.
  Pass admin_user_id in request params from trusted Next.js layer.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.concurrency import run_in_threadpool

from ....core.database import get_db_pool, check_db_health
from ....schemas.admin import (
    AuditLogsResponse,
    AbuseAlertsResponse,
    AdminDashboardStats,
    CostAnalyticsResponse,
    CreateAbuseAlertRequest,
    CreateAbuseAlertResponse,
    CreateRateLimitOverrideRequest,
    CreateRateLimitOverrideResponse,
    LiftSuspensionRequest,
    LiftSuspensionResponse,
    RateLimitOverridesResponse,
    ResolveAbuseAlertRequest,
    ResolveAbuseAlertResponse,
    SuspendUserRequest,
    SuspendUserResponse,
    SystemHealthResponse,
    UserCostHistoryResponse,
    UserDetailsResponse,
    UserListResponse,
)
from ....services import admin_service
from ....services.memory import episodic_memory as ep_mem
from ....services.memory import semantic_memory as sem_mem

logger = logging.getLogger(__name__)

router = APIRouter()


# =============================================================================
# DASHBOARD OVERVIEW
# =============================================================================

@router.get(
    "/admin/dashboard/stats",
    response_model=AdminDashboardStats,
    tags=["Admin Dashboard"],
)
async def get_dashboard_stats(
    admin_user_id: str = Query(..., description="Admin User ID (validated by Next.js/Supabase)"),
) -> AdminDashboardStats:
    """Get overview statistics for the admin dashboard.

    Architecture Note:
      Auth is handled by Next.js/Supabase. admin_user_id is trusted.
    """
    pool = get_db_pool()
    
    async with pool.acquire() as conn:
        # Total users
        total_users = await conn.fetchval("SELECT COUNT(*) FROM users")
        
        # Active users (24h, 7d)
        active_24h = await conn.fetchval(
            """
            SELECT COUNT(DISTINCT user_id) FROM llm_usage_logs
            WHERE created_at >= now() - interval '24 hours'
            """
        )
        active_7d = await conn.fetchval(
            """
            SELECT COUNT(DISTINCT user_id) FROM llm_usage_logs
            WHERE created_at >= now() - interval '7 days'
            """
        )
        
        # New users (24h)
        new_users_24h = await conn.fetchval(
            """
            SELECT COUNT(*) FROM users
            WHERE created_at >= now() - interval '24 hours'
            """
        )
        
        # Cost (24h, 7d)
        cost_24h = await conn.fetchval(
            """
            SELECT COALESCE(SUM(estimated_cost_usd), 0) FROM llm_usage_logs
            WHERE created_at >= now() - interval '24 hours'
            """
        ) or 0
        cost_7d = await conn.fetchval(
            """
            SELECT COALESCE(SUM(estimated_cost_usd), 0) FROM llm_usage_logs
            WHERE created_at >= now() - interval '7 days'
            """
        ) or 0
        
        # Requests (24h)
        requests_24h = await conn.fetchval(
            """
            SELECT COUNT(*) FROM llm_usage_logs
            WHERE created_at >= now() - interval '24 hours'
            """
        )
        
        # Open abuse alerts
        open_alerts = await conn.fetchval(
            """
            SELECT COUNT(*) FROM abuse_alerts
            WHERE status = 'open'
            """
        )
        
        # Suspended users
        suspended = await conn.fetchval(
            """
            SELECT COUNT(DISTINCT user_id) FROM user_suspensions
            WHERE is_active = true
            AND (suspended_until IS NULL OR suspended_until > now())
            """
        )
    
    return AdminDashboardStats(
        total_users=total_users,
        active_users_24h=active_24h,
        active_users_7d=active_7d,
        new_users_24h=new_users_24h,
        total_cost_24h=float(cost_24h),
        total_cost_7d=float(cost_7d),
        total_requests_24h=requests_24h,
        open_abuse_alerts=open_alerts,
        suspended_users=suspended,
    )


# =============================================================================
# USER MANAGEMENT
# =============================================================================

@router.get(
    "/admin/users",
    response_model=UserListResponse,
    tags=["Admin Users"],
)
async def list_users(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    search: Optional[str] = None,
    is_suspended: Optional[bool] = None,
    min_level: Optional[int] = Query(None, ge=1, le=60),
    max_level: Optional[int] = Query(None, ge=1, le=60),
    admin_user_id: str = Query(..., description="Admin User ID (validated by Next.js/Supabase)"),
) -> UserListResponse:
    """List users with filtering and pagination.

    Architecture Note:
      Auth is handled by Next.js/Supabase. admin_user_id is trusted.
    """
    return await admin_service.list_users(
        limit=limit,
        offset=offset,
        search=search,
        is_suspended=is_suspended,
        min_level=min_level,
        max_level=max_level,
    )


@router.get(
    "/admin/users/{user_id}",
    response_model=UserDetailsResponse,
    tags=["Admin Users"],
)
async def get_user_details(
    user_id: str,
    admin_user_id: str = Query(..., description="Admin User ID (validated by Next.js/Supabase)"),
) -> UserDetailsResponse:
    """Get detailed information about a specific user.

    Architecture Note:
      Auth is handled by Next.js/Supabase. admin_user_id is trusted.
    """
    user = await admin_service.get_user_details(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserDetailsResponse(**user)


@router.post(
    "/admin/users/{user_id}/suspend",
    response_model=SuspendUserResponse,
    tags=["Admin Users"],
)
async def suspend_user(
    user_id: str,
    request: Request,
    body: SuspendUserRequest,
    admin_user_id: str = Query(..., description="Admin User ID (validated by Next.js/Supabase)"),
) -> SuspendUserResponse:
    """Suspend a user account.

    Architecture Note:
      Auth is handled by Next.js/Supabase. admin_user_id is trusted.
      Permission checks should be done by Next.js BFF.
    """
    # Check if user exists
    user = await admin_service.get_user_details(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent self-suspension
    if user_id == admin_user_id:
        raise HTTPException(status_code=400, detail="Cannot suspend yourself")

    result = await admin_service.suspend_user(
        user_id=user_id,
        suspended_by=admin_user_id,
        reason=body.reason,
        suspension_type=body.suspension_type,
        duration_hours=body.duration_hours,
    )

    logger.warning("user_suspended", extra={
        "admin_user_id": admin_user_id,
        "suspended_user_id": user_id,
        "suspension_type": body.suspension_type,
    })

    return SuspendUserResponse(**result)


@router.post(
    "/admin/suspensions/{suspension_id}/lift",
    response_model=LiftSuspensionResponse,
    tags=["Admin Users"],
)
async def lift_suspension(
    suspension_id: str,
    request: Request,
    body: LiftSuspensionRequest,
    admin_user_id: str = Query(..., description="Admin User ID (validated by Next.js/Supabase)"),
) -> LiftSuspensionResponse:
    """Lift a user suspension.

    Architecture Note:
      Auth is handled by Next.js/Supabase. admin_user_id is trusted.
      Permission checks should be done by Next.js BFF.
    """
    try:
        result = await admin_service.lift_suspension(
            suspension_id=suspension_id,
            lifted_by=admin_user_id,
            reason=body.reason,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    logger.info("suspension_lifted", extra={
        "admin_user_id": admin_user_id,
        "suspension_id": suspension_id,
    })

    return LiftSuspensionResponse(**result)


# =============================================================================
# COST TRACKING
# =============================================================================

@router.get(
    "/admin/costs/analytics",
    response_model=CostAnalyticsResponse,
    tags=["Admin Costs"],
)
async def get_cost_analytics(
    days: int = Query(30, ge=1, le=365),
    user_id: Optional[str] = None,
    admin_user_id: str = Query(..., description="Admin User ID (validated by Next.js/Supabase)"),
) -> CostAnalyticsResponse:
    """Get cost analytics for the specified period.

    Architecture Note:
      Auth is handled by Next.js/Supabase. admin_user_id is trusted.
    """
    result = await admin_service.get_cost_analytics(days=days, user_id=user_id)
    return CostAnalyticsResponse(**result)


@router.get(
    "/admin/users/{user_id}/costs",
    response_model=UserCostHistoryResponse,
    tags=["Admin Costs"],
)
async def get_user_cost_history(
    user_id: str,
    days: int = Query(30, ge=1, le=90),
    admin_user_id: str = Query(..., description="Admin User ID (validated by Next.js/Supabase)"),
) -> UserCostHistoryResponse:
    """Get detailed cost history for a specific user.

    Architecture Note:
      Auth is handled by Next.js/Supabase. admin_user_id is trusted.
    """
    result = await admin_service.get_user_cost_history(user_id=user_id, days=days)
    return UserCostHistoryResponse(**result)


# =============================================================================
# AUDIT LOGS
# =============================================================================

@router.get(
    "/admin/audit-logs",
    response_model=AuditLogsResponse,
    tags=["Admin Audit"],
)
async def get_audit_logs(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    admin_user_id_filter: Optional[str] = None,
    action: Optional[str] = None,
    target_type: Optional[str] = None,
    target_id: Optional[str] = None,
    days: int = Query(30, ge=1, le=90),
    admin_user_id: str = Query(..., description="Admin User ID (validated by Next.js/Supabase)"),
) -> AuditLogsResponse:
    """Query admin audit logs with filtering.

    Architecture Note:
      Auth is handled by Next.js/Supabase. admin_user_id is trusted.
    """
    result = await admin_service.get_audit_logs(
        limit=limit,
        offset=offset,
        admin_user_id=admin_user_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        days=days,
    )
    return AuditLogsResponse(**result)


# =============================================================================
# ABUSE DETECTION
# =============================================================================

@router.get(
    "/admin/abuse-alerts",
    response_model=AbuseAlertsResponse,
    tags=["Admin Abuse Detection"],
)
async def get_abuse_alerts(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    status: Optional[str] = Query(None, pattern="^(open|investigating|resolved|false_positive)$"),
    severity: Optional[str] = Query(None, pattern="^(low|medium|high|critical)$"),
    alert_type: Optional[str] = Query(None, pattern="^(rate_limit_exceeded|cost_spike|suspicious_pattern|data_exfiltration|spam)$"),
    admin_user_id: str = Query(..., description="Admin User ID (validated by Next.js/Supabase)"),
) -> AbuseAlertsResponse:
    """Get abuse detection alerts.

    Architecture Note:
      Auth is handled by Next.js/Supabase. admin_user_id is trusted.
    """
    result = await admin_service.get_abuse_alerts(
        limit=limit,
        offset=offset,
        status=status,
        severity=severity,
        alert_type=alert_type,
    )
    return AbuseAlertsResponse(**result)


@router.post(
    "/admin/abuse-alerts",
    response_model=CreateAbuseAlertResponse,
    tags=["Admin Abuse Detection"],
)
async def create_abuse_alert(
    request: Request,
    body: CreateAbuseAlertRequest,
    admin_user_id: str = Query(..., description="Admin User ID (validated by Next.js/Supabase)"),
) -> CreateAbuseAlertResponse:
    """Create a new abuse alert (typically called automatically by detection systems).

    Architecture Note:
      Auth is handled by Next.js/Supabase. admin_user_id is trusted.
      Permission checks should be done by Next.js BFF.
    """
    result = await admin_service.create_abuse_alert(
        alert_type=body.alert_type,
        severity=body.severity,
        description=body.description,
        user_id=body.user_id,
        ip_address=body.ip_address,
        evidence=body.evidence,
    )

    logger.warning("abuse_alert_created", extra={
        "admin_user_id": admin_user_id,
        "alert_type": body.alert_type,
        "severity": body.severity,
        "target_user_id": body.user_id,
    })

    return CreateAbuseAlertResponse(**result)


@router.post(
    "/admin/abuse-alerts/{alert_id}/resolve",
    response_model=ResolveAbuseAlertResponse,
    tags=["Admin Abuse Detection"],
)
async def resolve_abuse_alert(
    alert_id: str,
    request: Request,
    body: ResolveAbuseAlertRequest,
    admin_user_id: str = Query(..., description="Admin User ID (validated by Next.js/Supabase)"),
) -> ResolveAbuseAlertResponse:
    """Resolve an abuse alert.

    Architecture Note:
      Auth is handled by Next.js/Supabase. admin_user_id is trusted.
      Permission checks should be done by Next.js BFF.
    """
    try:
        result = await admin_service.resolve_abuse_alert(
            alert_id=alert_id,
            resolved_by=admin_user_id,
            resolution_notes=body.resolution_notes,
            status=body.status,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    logger.info("abuse_alert_resolved", extra={
        "admin_user_id": admin_user_id,
        "alert_id": alert_id,
        "status": body.status,
    })

    return ResolveAbuseAlertResponse(**result)


# =============================================================================
# RATE LIMIT MANAGEMENT
# =============================================================================

@router.get(
    "/admin/rate-limits",
    response_model=RateLimitOverridesResponse,
    tags=["Admin Rate Limits"],
)
async def get_rate_limit_overrides(
    limit: int = Query(50, ge=1, le=100),
    admin_user_id: str = Query(..., description="Admin User ID (validated by Next.js/Supabase)"),
) -> RateLimitOverridesResponse:
    """Get all active rate limit overrides.

    Architecture Note:
      Auth is handled by Next.js/Supabase. admin_user_id is trusted.
    """
    result = await admin_service.get_active_rate_limit_overrides(limit=limit)
    return RateLimitOverridesResponse(**result)


@router.post(
    "/admin/rate-limits",
    response_model=CreateRateLimitOverrideResponse,
    tags=["Admin Rate Limits"],
)
async def create_rate_limit_override(
    request: Request,
    body: CreateRateLimitOverrideRequest,
    admin_user_id: str = Query(..., description="Admin User ID (validated by Next.js/Supabase)"),
) -> CreateRateLimitOverrideResponse:
    """Create a rate limit override.

    Architecture Note:
      Auth is handled by Next.js/Supabase. admin_user_id is trusted.
      Permission checks should be done by Next.js BFF.
    """
    # Validate scope-specific fields
    if body.scope == "user" and not body.user_id:
        raise HTTPException(status_code=400, detail="user_id required for user scope")
    if body.scope == "ip" and not body.ip_address:
        raise HTTPException(status_code=400, detail="ip_address required for ip scope")

    result = await admin_service.create_rate_limit_override(
        created_by=admin_user_id,
        scope=body.scope,
        endpoint_pattern=body.endpoint_pattern,
        reason=body.reason,
        expires_hours=body.expires_hours,
        user_id=body.user_id,
        ip_address=body.ip_address,
        max_requests_per_minute=body.max_requests_per_minute,
        max_requests_per_hour=body.max_requests_per_hour,
        max_requests_per_day=body.max_requests_per_day,
    )

    logger.info("rate_limit_override_created", extra={
        "admin_user_id": admin_user_id,
        "scope": body.scope,
        "user_id": body.user_id,
    })

    return CreateRateLimitOverrideResponse(**result)


# =============================================================================
# SYSTEM HEALTH
# =============================================================================

@router.get(
    "/admin/health",
    response_model=SystemHealthResponse,
    tags=["Admin System"],
)
async def get_system_health(
    admin_user_id: str = Query(..., description="Admin User ID (validated by Next.js/Supabase)"),
) -> SystemHealthResponse:
    """Get detailed system health status (admin view).

    Architecture Note:
      Auth is handled by Next.js/Supabase. admin_user_id is trusted.
    """
    # Check database
    db_status = await run_in_threadpool(check_db_health)
    
    # Check Qdrant
    qdrant_status = await run_in_threadpool(ep_mem.health_check)
    
    # Check Neo4j
    neo4j_status = await run_in_threadpool(sem_mem.health_check)
    
    # Determine overall status
    degraded = []
    if db_status != "ok":
        degraded.append(f"db:{db_status}")
    if qdrant_status != "ok":
        degraded.append(f"qdrant:{qdrant_status}")
    if neo4j_status != "ok":
        degraded.append(f"neo4j:{neo4j_status}")
    
    status = "ok" if not degraded else "degraded"
    
    return SystemHealthResponse(
        status=status,
        db_status=db_status,
        qdrant_status=qdrant_status,
        neo4j_status=neo4j_status,
        degraded=degraded,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


# =============================================================================
# AI DEBUGGING
# =============================================================================

@router.get(
    "/admin/users/{user_id}/traces",
    tags=["Admin AI Debugging"],
)
async def get_user_agent_traces(
    user_id: str,
    limit: int = Query(50, ge=1, le=100),
    agent_name: Optional[str] = None,
    admin_user_id: str = Query(..., description="Admin User ID (validated by Next.js/Supabase)"),
):
    """Get AI agent traces for a user.

    Architecture Note:
      Auth is handled by Next.js/Supabase. admin_user_id is trusted.
    """
    """Get agent execution traces for a user."""
    pool = get_db_pool()
    
    conditions = ["user_id = $1"]
    params = [user_id]
    param_idx = 2
    
    if agent_name:
        conditions.append(f"agent_name = ${param_idx}")
        params.append(agent_name)
        param_idx += 1
    
    where_clause = " AND ".join(conditions)
    
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            f"""
            SELECT
                id, agent_name, trace_type, step_number,
                input_data, output_data, latency_ms, model,
                tokens_used, error_message, created_at
            FROM agent_traces
            WHERE {where_clause}
            ORDER BY created_at DESC
            LIMIT ${param_idx}
            """,  # noqa: S608
            *params,
            limit,
        )
    
    return {
        "traces": [
            {
                "id": str(r["id"]),
                "agent_name": r["agent_name"],
                "trace_type": r["trace_type"],
                "step_number": r["step_number"],
                "input_data": r["input_data"],
                "output_data": r["output_data"],
                "latency_ms": r["latency_ms"],
                "model": r["model"],
                "tokens_used": r["tokens_used"],
                "error_message": r["error_message"],
                "created_at": r["created_at"].isoformat(),
            }
            for r in rows
        ],
    }


@router.get(
    "/admin/users/{user_id}/memory/episodic",
    tags=["Admin AI Debugging"],
)
async def get_user_episodic_memory(
    user_id: str,
    limit: int = Query(50, ge=1, le=100),
    token: dict = Depends(require_permission(AdminPermission.VIEW_AI_TRACES)),
):
    """Get episodic memories for a user (for debugging)."""
    from ....services.memory.episodic_memory import search_memories
    
    memories = await run_in_threadpool(search_memories, user_id, "", limit=limit)
    
    return {
        "user_id": user_id,
        "memories": memories,
    }


@router.get(
    "/admin/users/{user_id}/memory/semantic",
    tags=["Admin AI Debugging"],
)
async def get_user_semantic_memory(
    user_id: str,
    token: dict = Depends(require_permission(AdminPermission.VIEW_AI_TRACES)),
):
    """Get semantic memory graph for a user (for debugging)."""
    from ....services.memory.semantic_memory import get_user_graph
    
    graph = await run_in_threadpool(get_user_graph, user_id)
    
    return {
        "user_id": user_id,
        "graph": graph,
    }
