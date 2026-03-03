"""
Admin Security Layer — Role-based access control for the Admin Control Plane.

Implements:
- Admin role validation
- Permission checking
- Admin audit logging
- User suspension verification
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from enum import Enum
from functools import wraps
from typing import Optional, Callable

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer

from .database import get_db_pool
from .security import require_auth

logger = logging.getLogger(__name__)

_bearer = HTTPBearer()


class AdminRole(str, Enum):
    """Admin role hierarchy from least to most privileged."""
    VIEWER = "viewer"
    MODERATOR = "moderator"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"


# Role hierarchy for permission checking (higher index = more permissions)
ROLE_HIERARCHY = [
    AdminRole.VIEWER,
    AdminRole.MODERATOR,
    AdminRole.ADMIN,
    AdminRole.SUPER_ADMIN,
]


class AdminPermission(str, Enum):
    """Specific admin permissions."""
    VIEW_USERS = "view_users"
    EDIT_USERS = "edit_users"
    SUSPEND_USERS = "suspend_users"
    VIEW_COSTS = "view_costs"
    MANAGE_COST_LIMITS = "manage_cost_limits"
    VIEW_AUDIT_LOGS = "view_audit_logs"
    VIEW_SYSTEM_HEALTH = "view_system_health"
    MANAGE_RATE_LIMITS = "manage_rate_limits"
    VIEW_AI_TRACES = "view_ai_traces"
    MANAGE_AI_CONFIG = "manage_ai_config"
    VIEW_ABUSE_ALERTS = "view_abuse_alerts"
    MANAGE_ABUSE_ALERTS = "manage_abuse_alerts"
    MANAGE_ADMINS = "manage_admins"


# Default permissions per role
DEFAULT_ROLE_PERMISSIONS: dict[AdminRole, list[AdminPermission]] = {
    AdminRole.VIEWER: [
        AdminPermission.VIEW_USERS,
        AdminPermission.VIEW_COSTS,
        AdminPermission.VIEW_AUDIT_LOGS,
        AdminPermission.VIEW_SYSTEM_HEALTH,
        AdminPermission.VIEW_AI_TRACES,
        AdminPermission.VIEW_ABUSE_ALERTS,
    ],
    AdminRole.MODERATOR: [
        AdminPermission.VIEW_USERS,
        AdminPermission.EDIT_USERS,
        AdminPermission.VIEW_COSTS,
        AdminPermission.VIEW_AUDIT_LOGS,
        AdminPermission.VIEW_SYSTEM_HEALTH,
        AdminPermission.VIEW_AI_TRACES,
        AdminPermission.VIEW_ABUSE_ALERTS,
        AdminPermission.MANAGE_ABUSE_ALERTS,
    ],
    AdminRole.ADMIN: [
        AdminPermission.VIEW_USERS,
        AdminPermission.EDIT_USERS,
        AdminPermission.SUSPEND_USERS,
        AdminPermission.VIEW_COSTS,
        AdminPermission.MANAGE_COST_LIMITS,
        AdminPermission.VIEW_AUDIT_LOGS,
        AdminPermission.VIEW_SYSTEM_HEALTH,
        AdminPermission.MANAGE_RATE_LIMITS,
        AdminPermission.VIEW_AI_TRACES,
        AdminPermission.MANAGE_AI_CONFIG,
        AdminPermission.VIEW_ABUSE_ALERTS,
        AdminPermission.MANAGE_ABUSE_ALERTS,
    ],
    AdminRole.SUPER_ADMIN: list(AdminPermission),  # All permissions
}


async def is_admin(user_id: str) -> bool:
    """Check if a user has any admin role."""
    pool = get_db_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT 1 FROM admin_roles
            WHERE user_id = $1 AND is_active = true
            AND (revoked_at IS NULL OR revoked_at > now())
            """,
            user_id,
        )
        return row is not None


async def get_admin_role(user_id: str) -> Optional[AdminRole]:
    """Get the admin role for a user."""
    pool = get_db_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT role FROM admin_roles
            WHERE user_id = $1 AND is_active = true
            AND (revoked_at IS NULL OR revoked_at > now())
            """,
            user_id,
        )
        if row:
            return AdminRole(row["role"])
        return None


async def has_permission(user_id: str, permission: AdminPermission) -> bool:
    """Check if an admin user has a specific permission."""
    role = await get_admin_role(user_id)
    if not role:
        return False
    
    # Check explicit permissions first
    pool = get_db_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT permissions FROM admin_roles
            WHERE user_id = $1 AND is_active = true
            """,
            user_id,
        )
        if row and row["permissions"]:
            explicit_perms = row["permissions"]
            if permission.value in explicit_perms:
                return True
    
    # Fall back to role-based permissions
    return permission in DEFAULT_ROLE_PERMISSIONS.get(role, [])


async def check_suspension(user_id: str) -> Optional[dict]:
    """Check if a user is currently suspended. Returns suspension details if active."""
    pool = get_db_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT id, reason, suspended_until, suspension_type
            FROM user_suspensions
            WHERE user_id = $1 AND is_active = true
            AND (suspended_until IS NULL OR suspended_until > now())
            ORDER BY created_at DESC
            LIMIT 1
            """,
            user_id,
        )
        if row:
            return {
                "suspension_id": str(row["id"]),
                "reason": row["reason"],
                "suspended_until": row["suspended_until"],
                "type": row["suspension_type"],
            }
        return None


async def require_admin(
    token: dict = Depends(require_auth),
) -> dict:
    """
    Dependency to require admin access.
    Returns the token payload if user is an admin.
    """
    user_id = token.get("sub")
    
    # Service role bypass
    if token.get("role") == "service_role":
        return token
    
    if not user_id or user_id == "service_role":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if not await is_admin(user_id):
        logger.warning("admin_access_denied", extra={"user_id": user_id})
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if user is suspended
    suspension = await check_suspension(user_id)
    if suspension:
        logger.warning("admin_access_suspended", extra={
            "user_id": user_id,
            "suspension_id": suspension["suspension_id"]
        })
        raise HTTPException(
            status_code=403,
            detail=f"Account suspended: {suspension['reason']}"
        )
    
    return token


async def require_permission(permission: AdminPermission):
    """
    Factory for dependencies that require specific admin permissions.
    Usage: Depends(require_permission(AdminPermission.VIEW_USERS))
    """
    async def checker(token: dict = Depends(require_auth)) -> dict:
        user_id = token.get("sub")
        
        # Service role bypass
        if token.get("role") == "service_role":
            return token
        
        if not user_id:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        if not await has_permission(user_id, permission):
            logger.warning("admin_permission_denied", extra={
                "user_id": user_id,
                "permission": permission.value
            })
            raise HTTPException(
                status_code=403,
                detail=f"Permission required: {permission.value}"
            )
        
        return token
    return checker


async def log_admin_action(
    admin_user_id: str,
    action: str,
    target_type: str,
    target_id: Optional[str] = None,
    old_value: Optional[dict] = None,
    new_value: Optional[dict] = None,
    reason: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> None:
    """Log an admin action to the audit log."""
    pool = get_db_pool()
    try:
        async with pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO admin_audit_logs
                (admin_user_id, action, target_type, target_id, old_value, new_value, reason, ip_address, user_agent)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                """,
                admin_user_id,
                action,
                target_type,
                target_id,
                old_value,
                new_value,
                reason,
                ip_address,
                user_agent,
            )
        logger.info("admin_action_logged", extra={
            "admin_user_id": admin_user_id,
            "action": action,
            "target_type": target_type,
            "target_id": target_id,
        })
    except Exception as exc:
        logger.error("admin_audit_log_failed", extra={
            "error": str(exc),
            "admin_user_id": admin_user_id,
            "action": action,
        })
        # Don't raise - audit logging should not break operations


class AdminContext:
    """Context object for admin operations containing user info and audit trail."""
    
    def __init__(
        self,
        user_id: str,
        role: AdminRole,
        request: Optional[Request] = None,
    ):
        self.user_id = user_id
        self.role = role
        self.request = request
        self.action_logs: list[dict] = []
    
    async def has_permission(self, permission: AdminPermission) -> bool:
        """Check if this admin context has a specific permission."""
        # Service role has all permissions
        if self.role == AdminRole.SUPER_ADMIN:
            return True
        
        return permission in DEFAULT_ROLE_PERMISSIONS.get(self.role, [])
    
    async def log_action(
        self,
        action: str,
        target_type: str,
        target_id: Optional[str] = None,
        old_value: Optional[dict] = None,
        new_value: Optional[dict] = None,
        reason: Optional[str] = None,
    ) -> None:
        """Log an action within this context."""
        ip_address = None
        user_agent = None
        
        if self.request:
            # Get client IP, considering X-Forwarded-For
            forwarded_for = self.request.headers.get("x-forwarded-for")
            if forwarded_for:
                ip_address = forwarded_for.split(",")[0].strip()
            else:
                ip_address = self.request.client.host if self.request.client else None
            
            user_agent = self.request.headers.get("user-agent")
        
        await log_admin_action(
            admin_user_id=self.user_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            old_value=old_value,
            new_value=new_value,
            reason=reason,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        
        self.action_logs.append({
            "action": action,
            "target_type": target_type,
            "target_id": target_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })


async def get_admin_context(
    request: Request,
    token: dict = Depends(require_admin),
) -> AdminContext:
    """Dependency to get an AdminContext for the current request."""
    user_id = token.get("sub")
    role = await get_admin_role(user_id)
    
    if not role:
        raise HTTPException(status_code=403, detail="Admin role not found")
    
    return AdminContext(user_id=user_id, role=role, request=request)


def admin_permission_required(permission: AdminPermission):
    """
    Decorator for requiring admin permissions on endpoint functions.
    Note: This is for internal use; prefer Depends(require_permission(...)) for endpoints.
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract token from kwargs if passed
            token = kwargs.get("token")
            if not token:
                raise HTTPException(status_code=403, detail="Authentication required")
            
            user_id = token.get("sub")
            if not await has_permission(user_id, permission):
                raise HTTPException(
                    status_code=403,
                    detail=f"Permission required: {permission.value}"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator
