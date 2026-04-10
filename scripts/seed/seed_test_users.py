"""
Seed test users with sample progress data.
Creates test user + admin accounts and some starter assignments.
"""
from __future__ import annotations

import os
import sys
from datetime import datetime, timezone

from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL", "http://127.0.0.1:54421")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

TEST_USER = {
    "email": "test.user@hanachan.test",
    "password": "TestPassword123!",
    "display_name": "Test User",
}
TEST_ADMIN = {
    "email": "test.admin@hanachan.test",
    "password": "AdminPassword123!",
    "display_name": "Test Admin",
}


def seed_test_users():
    print("━━━ Hanachan: Seeding Test Users ━━━")
    client = create_client(SUPABASE_URL, SUPABASE_KEY)

    for account in [TEST_USER, TEST_ADMIN]:
        email = account["email"]
        print(f"\n→ Creating {email}...")
        try:
            result = client.auth.admin.create_user({
                "email": email,
                "password": account["password"],
                "email_confirm": True,
                "user_metadata": {"display_name": account["display_name"]},
            })
            user_id = result.user.id
            print(f"  ✅ Created: {user_id}")
        except Exception as e:
            if "already been registered" in str(e).lower() or "already exists" in str(e).lower():
                # Fetch existing
                users = client.auth.admin.list_users()
                user = next((u for u in users if getattr(u, "email", None) == email), None)
                if user:
                    user_id = user.id
                    print(f"  ↳ Already exists: {user_id}")
                else:
                    print(f"  ❌ Could not find existing user: {e}")
                    continue
            else:
                print(f"  ❌ Failed: {e}")
                continue

        # Create profile
        now = datetime.now(timezone.utc).isoformat()
        client.table("users_profile").upsert({
            "auth_user_id": user_id,
            "username": account["display_name"],
            "level": 1,
            "started_at": now,
        }, on_conflict="auth_user_id").execute()
        print(f"  ✅ Profile created")

        # Create level 1 progression
        client.table("level_progressions").upsert({
            "user_id": user_id,
            "level": 1,
            "unlocked_at": now,
            "started_at": now,
        }, on_conflict="user_id,level").execute()

    # Create sample assignments for test user
    print("\n→ Creating sample assignments for test user...")
    # Get first 5 level-1 subjects
    subjects_res = client.table("subjects").select("id, type").eq("level", 1).limit(5).execute()
    if subjects_res.data:
        users_res = client.auth.admin.list_users()
        test_user = next(
            (u for u in users_res if getattr(u, "email", None) == TEST_USER["email"]),
            None,
        )
        if test_user:
            now = datetime.now(timezone.utc).isoformat()
            for subj in subjects_res.data:
                client.table("assignments").upsert({
                    "user_id": test_user.id,
                    "subject_id": subj["id"],
                    "subject_type": subj["type"],
                    "srs_stage": 0,
                    "unlocked_at": now,
                }, on_conflict="user_id,subject_id").execute()
            print(f"  ✅ Created {len(subjects_res.data)} assignments")

    print("\n✅ Test users seeded successfully")
    print(f"  User:  {TEST_USER['email']} / {TEST_USER['password']}")
    print(f"  Admin: {TEST_ADMIN['email']} / {TEST_ADMIN['password']}")


if __name__ == "__main__":
    try:
        seed_test_users()
    except Exception as e:
        print(f"\n❌ Seeding failed: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
