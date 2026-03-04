"""
Admin API Schemas — Pydantic models for Admin Control Plane endpoints.
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


# =============================================================================
# USER MANAGEMENT SCHEMAS
# =============================================================================

class UserListItem(BaseModel):
    """User item in list view."""
    id: str
    display_name: Optional[str]
    level: int
    last_activity_at: Optional[str]
    created_at: Optional[str]
    active_learning_items: int
    total_chats: int
    total_messages: int
    is_suspended: bool
    today_cost_usd: float


class UserListResponse(BaseModel):
    """Response for listing users."""
    users: list[UserListItem]
    total: int
    limit: int
    offset: int


class LearningStats(BaseModel):
    """Learning statistics for a user."""
    new_items: int
    learning_items: int
    review_items: int
    burned_items: int
    total_items: int


class ChatStats(BaseModel):
    """Chat statistics for a user."""
    total_sessions: int
    total_messages: int
    last_chat_at: Optional[str]


class CostStats(BaseModel):
    """Cost statistics for a user."""
    last_30_days_cost_usd: float
    last_30_days_tokens: int
    last_30_days_requests: int


class SuspensionInfo(BaseModel):
    """Active suspension information."""
    id: str
    reason: str
    suspended_until: Optional[str]
    type: str
    created_at: str


class RateLimitOverrideInfo(BaseModel):
    """Rate limit override information."""
    id: str
    scope: str
    endpoint_pattern: str
    max_requests_per_minute: Optional[int]
    max_requests_per_hour: Optional[int]
    max_requests_per_day: Optional[int]
    expires_at: str
    reason: str


class UserDetailsResponse(BaseModel):
    """Detailed user information."""
    id: str
    display_name: Optional[str]
    level: int
    last_activity_at: Optional[str]
    created_at: Optional[str]
    learning_stats: LearningStats
    chat_stats: ChatStats
    cost_stats: CostStats
    suspension: Optional[SuspensionInfo]
    rate_limit_overrides: list[RateLimitOverrideInfo]


class SuspendUserRequest(BaseModel):
    """Request to suspend a user."""
    reason: str = Field(..., min_length=1, max_length=500)
    suspension_type: str = Field(default="temporary", pattern="^(temporary|permanent)$")
    duration_hours: Optional[int] = Field(default=None, ge=1, le=8760)  # Max 1 year


class SuspendUserResponse(BaseModel):
    """Response after suspending a user."""
    suspension_id: str
    user_id: str
    reason: str
    type: str
    suspended_until: Optional[str]
    created_at: str


class LiftSuspensionRequest(BaseModel):
    """Request to lift a suspension."""
    reason: str = Field(..., min_length=1, max_length=500)


class LiftSuspensionResponse(BaseModel):
    """Response after lifting a suspension."""
    suspension_id: str
    user_id: str
    lifted_at: str
    reason: str


# =============================================================================
# COST TRACKING SCHEMAS
# =============================================================================

class ModelCostStats(BaseModel):
    """Cost statistics by model."""
    model: str
    cost_usd: float
    tokens: int
    requests: int


class EndpointCostStats(BaseModel):
    """Cost statistics by endpoint."""
    endpoint: str
    cost_usd: float
    tokens: int
    requests: int


class DailyCostStats(BaseModel):
    """Daily cost breakdown."""
    date: str
    cost_usd: float
    tokens: int
    requests: int
    unique_users: int


class TopUserCost(BaseModel):
    """Top user by cost."""
    user_id: str
    display_name: Optional[str]
    cost_usd: float
    tokens: int
    requests: int


class CostAnalyticsResponse(BaseModel):
    """Cost analytics response."""
    period_days: int
    summary: dict
    by_model: list[ModelCostStats]
    by_endpoint: list[EndpointCostStats]
    daily_breakdown: list[DailyCostStats]
    top_users: list[TopUserCost]


class CostLogEntry(BaseModel):
    """Individual cost log entry."""
    id: str
    model: str
    endpoint: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    cost_usd: float
    latency_ms: Optional[int]
    success: bool
    error_message: Optional[str]
    created_at: str


class UserCostHistoryResponse(BaseModel):
    """User cost history response."""
    user_id: str
    period_days: int
    summary: dict
    recent_logs: list[CostLogEntry]


# =============================================================================
# AUDIT LOG SCHEMAS
# =============================================================================

class AuditLogEntry(BaseModel):
    """Individual audit log entry."""
    id: str
    admin_user_id: str
    admin_name: Optional[str]
    action: str
    target_type: str
    target_id: Optional[str]
    old_value: Optional[dict]
    new_value: Optional[dict]
    reason: Optional[str]
    ip_address: Optional[str]
    created_at: str


class AuditLogsResponse(BaseModel):
    """Audit logs response."""
    logs: list[AuditLogEntry]
    total: int
    limit: int
    offset: int


# =============================================================================
# ABUSE DETECTION SCHEMAS
# =============================================================================

class AbuseAlert(BaseModel):
    """Abuse alert entry."""
    id: str
    alert_type: str
    severity: str
    user_id: Optional[str]
    user_name: Optional[str]
    ip_address: Optional[str]
    description: str
    evidence: Optional[dict]
    status: str
    resolved_by: Optional[str]
    resolved_at: Optional[str]
    resolution_notes: Optional[str]
    created_at: str


class AbuseAlertsResponse(BaseModel):
    """Abuse alerts response."""
    alerts: list[AbuseAlert]
    total: int
    limit: int
    offset: int


class CreateAbuseAlertRequest(BaseModel):
    """Request to create an abuse alert."""
    alert_type: str = Field(..., pattern="^(rate_limit_exceeded|cost_spike|suspicious_pattern|data_exfiltration|spam)$")
    severity: str = Field(..., pattern="^(low|medium|high|critical)$")
    description: str = Field(..., min_length=1, max_length=1000)
    user_id: Optional[str] = None
    ip_address: Optional[str] = None
    evidence: Optional[dict] = None


class CreateAbuseAlertResponse(BaseModel):
    """Response after creating an abuse alert."""
    alert_id: str
    alert_type: str
    severity: str
    created_at: str


class ResolveAbuseAlertRequest(BaseModel):
    """Request to resolve an abuse alert."""
    resolution_notes: str = Field(..., min_length=1, max_length=1000)
    status: str = Field(default="resolved", pattern="^(resolved|false_positive)$")


class ResolveAbuseAlertResponse(BaseModel):
    """Response after resolving an abuse alert."""
    alert_id: str
    status: str
    resolved_at: str


# =============================================================================
# RATE LIMIT SCHEMAS
# =============================================================================

class RateLimitOverride(BaseModel):
    """Rate limit override entry."""
    id: str
    user_id: Optional[str]
    user_name: Optional[str]
    ip_address: Optional[str]
    scope: str
    endpoint_pattern: str
    max_requests_per_minute: Optional[int]
    max_requests_per_hour: Optional[int]
    max_requests_per_day: Optional[int]
    expires_at: str
    reason: str
    created_by: str
    created_at: str


class RateLimitOverridesResponse(BaseModel):
    """Rate limit overrides response."""
    overrides: list[RateLimitOverride]


class CreateRateLimitOverrideRequest(BaseModel):
    """Request to create a rate limit override."""
    scope: str = Field(..., pattern="^(user|ip|global)$")
    endpoint_pattern: str = Field(default="*", max_length=100)
    reason: str = Field(..., min_length=1, max_length=500)
    expires_hours: int = Field(default=24, ge=1, le=720)  # Max 30 days
    user_id: Optional[str] = None
    ip_address: Optional[str] = None
    max_requests_per_minute: Optional[int] = Field(default=None, ge=1)
    max_requests_per_hour: Optional[int] = Field(default=None, ge=1)
    max_requests_per_day: Optional[int] = Field(default=None, ge=1)


class CreateRateLimitOverrideResponse(BaseModel):
    """Response after creating a rate limit override."""
    override_id: str
    scope: str
    endpoint_pattern: str
    expires_at: str
    created_at: str


# =============================================================================
# SYSTEM HEALTH SCHEMAS
# =============================================================================

class SystemHealthResponse(BaseModel):
    """System health response."""
    status: str
    db_status: str
    qdrant_status: str
    neo4j_status: str
    degraded: list[str]
    timestamp: str


class AdminDashboardStats(BaseModel):
    """Overview stats for admin dashboard."""
    total_users: int
    active_users_24h: int
    active_users_7d: int
    new_users_24h: int
    total_cost_24h: float
    total_cost_7d: float
    total_requests_24h: int
    open_abuse_alerts: int
    suspended_users: int
