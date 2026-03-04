"""
Test Fixtures for Hanachan FastAPI Tests

This module provides reusable test fixtures and helpers.

Usage:
    from tests.fixtures import TEST_USER_ID, TEST_ADMIN_ID
    from tests.fixtures import get_test_user_headers, get_test_admin_headers
"""

from .test_accounts import (
    # Constants
    TEST_USER_ID,
    TEST_USER_EMAIL,
    TEST_USER_PASSWORD,
    TEST_USER_DISPLAY_NAME,
    TEST_ADMIN_ID,
    TEST_ADMIN_EMAIL,
    TEST_ADMIN_PASSWORD,
    TEST_ADMIN_DISPLAY_NAME,
    TEST_ADMIN_ROLE,
    TEST_USER,
    TEST_ADMIN,
    ALL_TEST_ACCOUNTS,
    # Functions
    make_test_token_for_user,
    get_test_user_headers,
    get_test_admin_headers,
    sign_in_test_user,
    sign_in_test_admin,
    verify_test_accounts_exist,
)

try:
    from .test_accounts import (
        # Fixtures (only available when pytest is installed)
        test_user_id,
        test_admin_id,
        test_user_headers,
        test_admin_headers,
    )
except ImportError:
    # pytest not installed, fixtures unavailable
    test_user_id = None  # type: ignore[misc]
    test_admin_id = None  # type: ignore[misc]
    test_user_headers = None  # type: ignore[misc]
    test_admin_headers = None  # type: ignore[misc]

__all__ = [
    # Constants
    "TEST_USER_ID",
    "TEST_USER_EMAIL",
    "TEST_USER_PASSWORD",
    "TEST_USER_DISPLAY_NAME",
    "TEST_ADMIN_ID",
    "TEST_ADMIN_EMAIL",
    "TEST_ADMIN_PASSWORD",
    "TEST_ADMIN_DISPLAY_NAME",
    "TEST_ADMIN_ROLE",
    "TEST_USER",
    "TEST_ADMIN",
    "ALL_TEST_ACCOUNTS",
    # Functions
    "make_test_token_for_user",
    "get_test_user_headers",
    "get_test_admin_headers",
    "sign_in_test_user",
    "sign_in_test_admin",
    "verify_test_accounts_exist",
    # Fixtures (may be None if pytest not installed)
    "test_user_id",
    "test_admin_id",
    "test_user_headers",
    "test_admin_headers",
]
