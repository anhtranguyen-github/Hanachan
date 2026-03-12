from __future__ import annotations

import os
import secrets
import time

from supabase import create_client


def _env(*names: str) -> str:
    for n in names:
        v = os.getenv(n)
        if v:
            return v
    return ""


def main() -> None:
    supabase_url = _env("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL")
    service_key = _env("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_KEY", "SUPABASE_SERVICE_KEY")
    anon_key = _env("NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY", "SUPABASE_KEY")

    if not supabase_url or not service_key or not anon_key:
        raise SystemExit(
            "Missing env. Need SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY), "
            "and NEXT_PUBLIC_SUPABASE_ANON_KEY."
        )

    email = os.getenv("TEST_SEED_EMAIL") or f"test+{int(time.time())}@example.com"
    password = os.getenv("TEST_SEED_PASSWORD") or secrets.token_urlsafe(18)

    admin = create_client(supabase_url, service_key)

    # Create or update the user (admin API)
    try:
        created = admin.auth.admin.create_user(
            {
                "email": email,
                "password": password,
                "email_confirm": True,
            }
        )
        user_id = created.user.id
        created_new = True
    except Exception:
        # If already exists, update password + confirm email
        found = admin.auth.admin.list_users()
        user = next((u for u in found.users if getattr(u, "email", None) == email), None)
        if not user:
            raise
        user_id = user.id
        admin.auth.admin.update_user_by_id(
            user_id,
            {"password": password, "email_confirm": True},
        )
        created_new = False

    # Sign in as the user to get a real access token (JWT)
    public = create_client(supabase_url, anon_key)
    session = public.auth.sign_in_with_password({"email": email, "password": password}).session

    print("Seeded test user:")
    print(f"  created_new: {created_new}")
    print(f"  user_id: {user_id}")
    print(f"  email: {email}")
    print(f"  password: {password}")
    print("Auth tokens:")
    print(f"  access_token: {session.access_token}")
    print(f"  refresh_token: {session.refresh_token}")


if __name__ == "__main__":
    main()

