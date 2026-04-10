from __future__ import annotations
from app.core.supabase import get_supabase_client
from app.domain.chat.services import ChatService
from app.tutor.state import TutorSessionState


class TutorPersistence:
    """Handles persistence of tutor behavior state in Supabase."""

    @staticmethod
    async def load(user_id: str, session_id: str) -> TutorSessionState:
        """Loads tutor state from session metadata."""
        if not session_id or session_id == "default":
            return TutorSessionState(user_id=user_id)

        try:
            service = ChatService(get_supabase_client())
            metadata = await service.get_chat_session_metadata(user_id, session_id)
            tutor_data = metadata.get("tutor_behavior", {})
            return TutorSessionState.from_dict(tutor_data)
        except Exception:
            # Fallback to fresh state if DB fails or session missing
            return TutorSessionState(user_id=user_id)

    @staticmethod
    async def save(user_id: str, session_id: str, state: TutorSessionState):
        """Saves tutor state into session metadata."""
        if not session_id or session_id == "default":
            return

        try:
            service = ChatService(get_supabase_client())
            await service.update_chat_session(
                user_id=user_id,
                session_id=session_id,
                metadata={"tutor_behavior": state.to_dict()},
                merge_metadata=True
            )
        except Exception as e:
            # Log error but don't crash the conversation
            import logging
            logging.getLogger(__name__).error(f"Failed to save tutor state: {e}")
