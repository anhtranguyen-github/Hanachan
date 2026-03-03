"""
Tests for the security / authentication module.

Architecture Note:
  JWT authentication has been REMOVED from FastAPI per architecture rules.
  These tests verify that auth functions now raise ArchitectureViolationError.
  Auth must be handled by Supabase/Next.js (BFF pattern).
"""
from __future__ import annotations

import pytest
from fastapi import HTTPException


class TestArchitectureViolationError:
    """Test that auth functions raise ArchitectureViolationError."""

    def test_require_auth_raises_architecture_violation(self):
        """require_auth should raise ArchitectureViolationError."""
        from app.core.security import require_auth, ArchitectureViolationError

        with pytest.raises(ArchitectureViolationError) as exc_info:
            require_auth()

        assert exc_info.value.status_code == 500
        assert "Architecture Violation" in str(exc_info.value.detail)
        assert "JWT authentication is not allowed" in str(exc_info.value.detail)

    def test_require_own_user_raises_architecture_violation(self):
        """require_own_user should raise ArchitectureViolationError."""
        from app.core.security import require_own_user, ArchitectureViolationError

        with pytest.raises(ArchitectureViolationError) as exc_info:
            require_own_user(user_id="user-123")

        assert exc_info.value.status_code == 500
        assert "Architecture Violation" in str(exc_info.value.detail)

    def test_architecture_violation_is_http_exception(self):
        """ArchitectureViolationError should be an HTTPException."""
        from app.core.security import ArchitectureViolationError

        # Verify it can be caught as HTTPException
        with pytest.raises(HTTPException):
            raise ArchitectureViolationError("test message")


class TestAdminSecurityArchitectureViolation:
    """Test that admin auth functions raise ArchitectureViolationError."""

    @pytest.mark.asyncio
    async def test_require_admin_raises_architecture_violation(self):
        """require_admin should raise ArchitectureViolationError."""
        from app.core.admin_security import require_admin, ArchitectureViolationError

        with pytest.raises(ArchitectureViolationError) as exc_info:
            await require_admin()

        assert exc_info.value.status_code == 500
        assert "Architecture Violation" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_require_permission_raises_architecture_violation(self):
        """require_permission should raise ArchitectureViolationError."""
        from app.core.admin_security import require_permission, AdminPermission, ArchitectureViolationError

        permission_checker = require_permission(AdminPermission.VIEW_USERS)

        with pytest.raises(ArchitectureViolationError) as exc_info:
            await permission_checker()

        assert exc_info.value.status_code == 500
        assert "Architecture Violation" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_get_admin_context_raises_architecture_violation(self):
        """get_admin_context should raise ArchitectureViolationError."""
        from app.core.admin_security import get_admin_context, ArchitectureViolationError

        with pytest.raises(ArchitectureViolationError) as exc_info:
            await get_admin_context()

        assert exc_info.value.status_code == 500
        assert "Architecture Violation" in str(exc_info.value.detail)


class TestSecurityExports:
    """Test that security modules export expected symbols."""

    def test_security_module_exports(self):
        """security.py should export expected symbols."""
        from app.core import security

        # These should be exported for backward compatibility
        assert hasattr(security, "ArchitectureViolationError")
        assert hasattr(security, "require_auth")
        assert hasattr(security, "require_own_user")

        # Verify ArchitectureViolationError is the new error type
        assert security.ArchitectureViolationError is not None

    def test_admin_security_module_exports(self):
        """admin_security.py should export expected symbols."""
        from app.core import admin_security

        # These should be exported for backward compatibility
        assert hasattr(admin_security, "ArchitectureViolationError")
        assert hasattr(admin_security, "AdminRole")
        assert hasattr(admin_security, "AdminPermission")
        assert hasattr(admin_security, "AdminContext")
        assert hasattr(admin_security, "require_admin")
        assert hasattr(admin_security, "require_permission")


class TestDeprecationWarnings:
    """Test that deprecation warnings are emitted."""

    def test_require_auth_emits_deprecation_warning(self):
        """require_auth should emit a DeprecationWarning."""
        import warnings
        from app.core.security import require_auth

        with warnings.catch_warnings(record=True) as w:
            warnings.simplefilter("always")
            with pytest.raises(Exception):
                require_auth()

            # Check that a DeprecationWarning was emitted
            deprecation_warnings = [x for x in w if issubclass(x.category, DeprecationWarning)]
            assert len(deprecation_warnings) > 0
            assert "deprecated" in str(deprecation_warnings[0].message).lower()
