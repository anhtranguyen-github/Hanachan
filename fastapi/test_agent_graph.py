from __future__ import annotations
import uuid

from app.core.database import init_pool
from app.agents.memory_agent import run_chat

def test_graph_run():
    print("Testing Graph Run with TTS Disabled...")
    
    init_pool()

    test_user_id = str(uuid.uuid4())
    test_session_id = str(uuid.uuid4())

    try:
        result_2 = run_chat(
            user_id=test_user_id,
            message="How do I say 'Apple' in Japanese?",
            session_id=test_session_id,
            tts_enabled=False
        )
        print("Run 2 (TTS=False) Completed!")
        print(f"Response: {result_2.get('response')[:200]}...")
        print(f"Audio File: {result_2.get('audio_file')}")
    except Exception as e:
        print(f"Run 2 Failed: {e}")

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv("../.env")
    test_graph_run()
