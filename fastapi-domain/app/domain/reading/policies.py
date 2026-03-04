from .models import ReadingSession
from .errors import UnauthorizedSessionAccessError, InvalidSessionStateError

class ReadingPolicy:
    @staticmethod
    def ensure_can_submit_answer(session: ReadingSession, user_id: str):
        # Rule: Only the session owner can submit answers
        if session.user_id != user_id:
            raise UnauthorizedSessionAccessError("User does not own this reading session")
        
        # Rule: Answers can only be submitted to active sessions
        if session.status != "active":
            raise InvalidSessionStateError(f"Cannot submit answer to a session in '{session.status}' state")
