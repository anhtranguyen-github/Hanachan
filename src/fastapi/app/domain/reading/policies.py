from app.domain.reading.errors import InvalidSessionStateError, UnauthorizedSessionAccessError
from app.domain.reading.models import ReadingSession


class ReadingPolicy:
    @staticmethod
    def ensure_can_submit_answer(session: ReadingSession, user_id: str) -> None:
        if session.user_id != user_id:
            raise UnauthorizedSessionAccessError("User does not own this reading session")

        if session.status != "active":
            raise InvalidSessionStateError(
                f"Cannot submit answer to a session in '{session.status}' state"
            )
