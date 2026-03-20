from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client

from app.auth.jwt import verify_supabase_jwt
from app.core.supabase import get_supabase_client
from app.domain.chat.deck_service import DeckService
from app.domain.chat.services import ChatService
from app.domain.learning.services import LearningService
from app.domain.reading.services import ReadingService
from app.repositories.learning import ILearningRepository, SupabaseLearningRepository
from app.repositories.reading import IReadingRepository, SupabaseReadingRepository

security = HTTPBearer()


async def get_current_user(
    res: HTTPAuthorizationCredentials = Depends(security),
) -> dict[str, Any]:
    payload = await verify_supabase_jwt(res.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing sub claim",
        )
    payload["jwt"] = res.credentials
    return payload


async def get_current_user_id(user: dict[str, Any] = Depends(get_current_user)) -> str:
    return str(user["sub"])


def get_client() -> Client:
    return get_supabase_client()


def get_learning_repo(client: Client = Depends(get_client)) -> ILearningRepository:
    return SupabaseLearningRepository(client)


def get_reading_repo(client: Client = Depends(get_client)) -> IReadingRepository:
    return SupabaseReadingRepository(client)


def get_learning_service(
    repo: ILearningRepository = Depends(get_learning_repo),
) -> LearningService:
    return LearningService(repo)


def get_reading_service(
    repo: IReadingRepository = Depends(get_reading_repo),
) -> ReadingService:
    return ReadingService(repo)


def get_chat_service(client: Client = Depends(get_client)) -> ChatService:
    return ChatService(client)


def get_deck_service(client: Client = Depends(get_client)) -> DeckService:
    return DeckService(client)
