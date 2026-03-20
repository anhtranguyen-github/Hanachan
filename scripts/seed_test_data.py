import os
import sys
from datetime import datetime, timezone

# Add src/fastapi to sys.path to import local modules regardless of launch cwd
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(ROOT, 'src', 'fastapi'))

from app.core.supabase import supabase

TEST_USER_ID = "a1111111-1111-1111-1111-111111111111"

# Knowledge Units data
KUS = [
    {
        "slug": "sakura",
        "character": "桜",
        "meaning": "Cherry Blossom",
        "type": "vocabulary",
        "level": 15,
        "jlpt": 3
    },
    {
        "slug": "hou-ga-ii",
        "character": "ほうがいい",
        "meaning": "had better",
        "type": "grammar",
        "level": 10,
        "jlpt": 3
    },
    {
        "slug": "taberu",
        "character": "食べる",
        "meaning": "to eat",
        "type": "vocabulary",
        "level": 1,
        "jlpt": 5
    }
]

def seed_knowledge_units(supabase):
    print("Seeding knowledge units...")
    for ku in KUS:
        # We use slug as unique identifier for seeding
        res = supabase.table("knowledge_units").select("id").eq("slug", ku["slug"]).execute()
        if res.data:
            ku_id = res.data[0]["id"]
            supabase.table("knowledge_units").update(ku).eq("id", ku_id).execute()
            print(f"Updated KU: {ku['slug']}")
        else:
            supabase.table("knowledge_units").insert(ku).execute()
            print(f"Inserted KU: {ku['slug']}")

def seed_user_states(supabase, user_id):
    print(f"Seeding user learning states for {user_id}...")
    
    # Get KU IDs
    relevant_slugs = [ku["slug"] for ku in KUS]
    res = supabase.table("knowledge_units").select("id, slug").in_("slug", relevant_slugs).execute()
    ku_map = {item["slug"]: item["id"] for item in res.data}
    
    print(f"KU Map: {ku_map}")

    now = datetime.now(timezone.utc).isoformat()
    
    states = [
        {
            "user_id": user_id,
            "ku_id": ku_map["sakura"],
            "facet": "meaning",
            "state": "review",
            "stability": 5.0,
            "difficulty": 3.0,
            "next_review": now,
            "last_review": now
        },
        {
            "user_id": user_id,
            "ku_id": ku_map["hou-ga-ii"],
            "facet": "meaning",
            "state": "learning",
            "stability": 1.0,
            "difficulty": 5.0,
            "next_review": now,
            "last_review": now
        }
    ]

    for state in states:
        # Check if state exists in the user_learning_states table
        res = supabase.table("user_learning_states").select("*").match({
            "user_id": state["user_id"],
            "ku_id": state["ku_id"],
            "facet": state["facet"]
        }).execute()
        
        if res.data:
            supabase.table("user_learning_states").update(state).match({
                "user_id": state["user_id"],
                "ku_id": state["ku_id"],
                "facet": state["facet"]
            }).execute()
            print(f"Updated state for {state['ku_id']}")
        else:
            supabase.table("user_learning_states").insert(state).execute()
            print(f"Inserted state for {state['ku_id']}")
    
    print("User learning states seeded.")

if __name__ == "__main__":
    try:
        seed_knowledge_units(supabase)
        seed_user_states(supabase, TEST_USER_ID)
        print("Seeding completed successfully.")
    except Exception as e:
        print(f"Seeding failed: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
