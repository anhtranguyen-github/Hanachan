import sys
import os
import asyncio

# Add the fastapi folder to path so we can import the app
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'fastapi'))

from app.core.database import init_pool
from app.agents.memory_agent import run_chat

user_id = "test_user_id"
message = "Please add a note to the kanji '一' saying 'Agent explicit note update test success!'"

print("Sending message to agent...")
init_pool()
result = run_chat(user_id=user_id, message=message, session_id=None, tts_enabled=False)

print("Agent Response:")
print(result["response"])
print(result["response"])
