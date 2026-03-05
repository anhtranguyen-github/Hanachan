"""
Permanent Test Accounts for Automation Testing

This module provides constants and helpers for the permanent test accounts
created by migration 20260303_create_permanent_test_accounts.sql.

These accounts are deterministic and will always exist after running migrations.
Use them for integration tests, e2e tests, and automation.
"""

from __future__ import annotations

# ==========================================
# TEST ACCOUNT CONSTANTS
# ==========================================

# Test User Account (Regular User)
TEST_USER_ID = "a1111111-1111-1111-1111-111111111111"
TEST_USER_EMAIL = "test.user@hanachan.test"
TEST_USER_PASSWORD = "TestPassword123!"
TEST_USER_DISPLAY_NAME = "Test User"

# Test Admin Account (Super Admin)
TEST_ADMIN_ID = "b2222222-2222-2222-2222-222222222222"
TEST_ADMIN_EMAIL = "test.admin@hanachan.test"
TEST_ADMIN_PASSWORD = "AdminPassword123!"
TEST_ADMIN_DISPLAY_NAME = "Test Admin"
TEST_ADMIN_ROLE = "super_admin"

# ==========================================
# ACCOUNT DATA DICTIONARIES
# ==========================================

TEST_USER = {
    "id": TEST_USER_ID,
    "email": TEST_USER_EMAIL,
    "password": TEST_USER_PASSWORD,
    "display_name": TEST_USER_DISPLAY_NAME,
}

TEST_ADMIN = {
    "id": TEST_ADMIN_ID,
    "email": TEST_ADMIN_EMAIL,
    "password": TEST_ADMIN_PASSWORD,
    "display_name": TEST_ADMIN_DISPLAY_NAME,
    "role": TEST_ADMIN_ROLE,
}

ALL_TEST_ACCOUNTS = [TEST_USER, TEST_ADMIN]


# ==========================================
# JWT TOKEN HELPERS
# ==========================================


def make_test_token_for_user(user_id: str, role: str = "authenticated") -> str:
    """
    Generate a test JWT token for a specific user.

    Args:
        user_id: The user's UUID
        role: The user's role (default: "authenticated")

    Returns:
        A test JWT token string
    """
    import base64
    import json

    header = (
        base64.urlsafe_b64encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
        .rstrip(b"=")
        .decode()
    )

    payload = (
        base64.urlsafe_b64encode(
            json.dumps({"sub": user_id, "role": role, "aud": "authenticated"}).encode()
        )
        .rstrip(b"=")
        .decode()
    )

    return f"{header}.{payload}.test-signature"


def get_test_user_headers() -> dict:
    """Get authorization headers for the test user."""
    return {"Authorization": f"Bearer {make_test_token_for_user(TEST_USER_ID)}"}


def get_test_admin_headers() -> dict:
    """Get authorization headers for the test admin."""
    return {
        "Authorization": f"Bearer {make_test_token_for_user(TEST_ADMIN_ID, role='super_admin')}"
    }


# ==========================================
# PYTEST FIXTURES
# ==========================================

# Pytest fixtures are only available when pytest is installed
# Use: from tests.fixtures import test_user_id

try:
    import pytest

    @pytest.fixture
    def test_user_id() -> str:
        """Fixture providing the test user ID."""
        return TEST_USER_ID

    @pytest.fixture
    def test_admin_id() -> str:
        """Fixture providing the test admin ID."""
        return TEST_ADMIN_ID

    @pytest.fixture
    def test_user_headers() -> dict:
        """Fixture providing authorization headers for test user."""
        return get_test_user_headers()

    @pytest.fixture
    def test_admin_headers() -> dict:
        """Fixture providing authorization headers for test admin."""
        return get_test_admin_headers()

except ImportError:
    # pytest not installed, fixtures not available
    test_user_id = None
    test_admin_id = None
    test_user_headers = None
    test_admin_headers = None


# ==========================================
# SUPABASE AUTH HELPERS
# ==========================================


async def sign_in_test_user(supabase_client) -> dict:
    """
    Sign in the test user using Supabase auth.

    Args:
        supabase_client: An initialized Supabase client

    Returns:
        The auth response from Supabase
    """
    return await supabase_client.auth.sign_in_with_password(
        {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
        }
    )


async def sign_in_test_admin(supabase_client) -> dict:
    """
    Sign in the test admin using Supabase auth.

    Args:
        supabase_client: An initialized Supabase client

    Returns:
        The auth response from Supabase
    """
    return await supabase_client.auth.sign_in_with_password(
        {
            "email": TEST_ADMIN_EMAIL,
            "password": TEST_ADMIN_PASSWORD,
        }
    )


# ==========================================
# VERIFICATION HELPERS
# ==========================================


def verify_test_accounts_exist(db_query_func) -> bool:
    """
    Verify that both test accounts exist in the database.

    Args:
        db_query_func: A function that executes a SQL query and returns results

    Returns:
        True if both accounts exist, False otherwise
    """
    try:
        user_result = db_query_func("SELECT id FROM public.users WHERE id = %s", (TEST_USER_ID,))
        admin_result = db_query_func("SELECT id FROM public.users WHERE id = %s", (TEST_ADMIN_ID,))
        admin_role_result = db_query_func(
            "SELECT role FROM public.admin_roles WHERE user_id = %s", (TEST_ADMIN_ID,)
        )

        return bool(
            user_result
            and admin_result
            and admin_role_result
            and admin_role_result[0]["role"] == "super_admin"
        )
    except Exception:
        return False


if __name__ == "__main__":
    # Quick verification script
    print("=" * 60)
    print("PERMANENT TEST ACCOUNTS")
    print("=" * 60)
    print()
    print("Test User:")
    print(f"  ID:       {TEST_USER_ID}")
    print(f"  Email:    {TEST_USER_EMAIL}")
    print(f"  Password: {TEST_USER_PASSWORD}")
    print()
    print("Test Admin:")
    print(f"  ID:       {TEST_ADMIN_ID}")
    print(f"  Email:    {TEST_ADMIN_EMAIL}")
    print(f"  Password: {TEST_ADMIN_PASSWORD}")
    print(f"  Role:     {TEST_ADMIN_ROLE}")
    print()
    print("=" * 60)
    print("Use in your automation tests!")
    print("=" * 60)
