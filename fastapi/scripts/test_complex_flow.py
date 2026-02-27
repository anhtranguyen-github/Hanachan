"""
Comprehensive test for the iterative LangGraph memory agent.
Tests multiple scenarios: greetings, memory recall, learning progress,
multi-turn context, and cross-session history.
"""
import os
import sys
import logging
import uuid
import time

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.agents.memory_agent import run_chat
from app.core.database import init_pool, execute_query, close_pool
from app.services.memory import session_memory as sess_mem

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

def box(title, content, width=80):
    print("\n" + "=" * width)
    print(f" {title} ".center(width, "="))
    print("=" * width)
    print(content)
    print("-" * width)

def run_turn(user_id, message, session_id=None):
    """Run one agent turn and return duration + result."""
    start = time.time()
    result = run_chat(user_id=user_id, message=message, session_id=session_id)
    duration = time.time() - start
    return result, duration

def main():
    init_pool()
    logger.info("Connected to cloud Supabase.")

    # Fetch real user IDs
    users = execute_query(
        "SELECT u.id, u.display_name, au.email "
        "FROM public.users u "
        "JOIN auth.users au ON u.id = au.id "
        "WHERE au.email LIKE '%hanachan.test'"
    )
    if not users:
        logger.error("No test users found! Run seed-test-workers.js first.")
        close_pool()
        return

    for u in users:
        logger.info(f"Found user: {u['display_name']} ({u['email']}) -> {u['id']}")

    sakura = next((u for u in users if 'worker_1' in u['email']), None)
    kenji  = next((u for u in users if 'worker_2' in u['email']), None)
    akari  = next((u for u in users if 'worker_3' in u['email']), None)

    if not all([sakura, kenji, akari]):
        logger.error("Could not find all 3 test personas.")
        close_pool()
        return

    # ===================================================================
    # TEST 1: Simple greeting (no tools needed)
    # ===================================================================
    box("TEST 1: Simple Greeting (Sakura)", f"User: {sakura['display_name']}")
    r, d = run_turn(str(sakura['id']), "Hello! How are you today?")
    box(f"Response ({d:.1f}s)", r["response"])

    # ===================================================================
    # TEST 2: Memory recall — episodic (Sakura's past conversations)
    # ===================================================================
    box("TEST 2: Episodic Memory Recall (Sakura)", "Should recall Studio Ghibli / Tokyo interests")
    r, d = run_turn(str(sakura['id']), "Do you remember what my hobbies are?")
    box(f"Response ({d:.1f}s)", r["response"])

    # ===================================================================
    # TEST 3: Semantic fact lookup (Kenji)
    # ===================================================================
    box("TEST 3: Semantic Fact Lookup (Kenji)", "Should recall: Software Engineer, JLPT N3 goal")
    r, d = run_turn(str(kenji['id']), "What do you know about me?")
    box(f"Response ({d:.1f}s)", r["response"])

    # ===================================================================
    # TEST 4: KU search (general Japanese knowledge)
    # ===================================================================
    box("TEST 4: Knowledge Unit Search", "Should search KU database for '水'")
    r, d = run_turn(str(kenji['id']), "What does the kanji 水 mean?")
    box(f"Response ({d:.1f}s)", r["response"])

    # ===================================================================
    # TEST 5: Multi-turn conversation with session history (Akari)
    # ===================================================================
    session_id = str(uuid.uuid4())
    box("TEST 5: Multi-turn Conversation (Akari)", f"Session: {session_id}")

    turns = [
        "Hi! I've been reading Natsume Soseki's 'Kokoro' and I have some questions.",
        "What are the main themes in Kokoro? I'm an advanced learner so give me nuance.",
        "Based on our conversation so far, what level of Japanese do I seem to be at?",
    ]

    for i, msg in enumerate(turns):
        print(f"\n  [Turn {i+1}] User: {msg}")
        r, d = run_turn(str(akari['id']), msg, session_id=session_id)
        box(f"Turn {i+1} Response ({d:.1f}s)", r["response"])

    # ===================================================================
    # TEST 6: Cross-session recall (Akari, new session)
    # ===================================================================
    new_session = str(uuid.uuid4())
    box("TEST 6: Cross-Session Recall (Akari)", f"New session: {new_session}")
    r, d = run_turn(str(akari['id']), "We talked about a Japanese novel recently. Do you remember which one?", session_id=new_session)
    box(f"Response ({d:.1f}s)", r["response"])

    # ===================================================================
    # SUMMARY
    # ===================================================================
    print("\n" + "=" * 80)
    print(" ALL TESTS COMPLETE ".center(80, "="))
    print("=" * 80)

    close_pool()

if __name__ == "__main__":
    main()
