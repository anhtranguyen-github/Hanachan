
import os
import sys
import logging
from typing import Optional

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.agents.memory_agent import run_chat
from app.core.database import init_pool

logging.basicConfig(level=logging.INFO)

def test_agent():
    # Initialize DB pool for real data testing
    init_pool()
    
    user_id = "test-user-id" 
    message = "How is my progress with Kanji?"
    
    print(f"Testing agent with message: {message}")
    try:
        response = run_chat(user_id=user_id, message=message)
        print("\n--- Agent Response ---")
        print(response["response"])
        print("\n--- Metadata ---")
        print(f"Episodic: {response['episodic_context']}")
        print(f"Semantic: {response['semantic_context']}")
        print(f"Thread: {response['thread_context']}")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_agent()
