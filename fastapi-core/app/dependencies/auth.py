from typing import Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.auth.jwt import verify_supabase_jwt

security = HTTPBearer()

async def get_current_user(res: HTTPAuthorizationCredentials = Depends(security)) -> dict[str, Any]:
    """
    Dependency to get the current authenticated user from Supabase JWT.
    Returns the decoded payload.
    """
    payload = await verify_supabase_jwt(res.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing sub claim",
        )
    # Include original JWT for potential service-to-service calls
    payload["jwt"] = res.credentials
    return payload

from app.core.config import settings
from supabase import create_client, Client

def get_supabase_client() -> Client:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

# Repositories
from app.repositories.learning import SupabaseLearningRepository, ILearningRepository
from app.repositories.reading import SupabaseReadingRepository, IReadingRepository

def get_learning_repo(client: Client = Depends(get_supabase_client)) -> ILearningRepository:
    return SupabaseLearningRepository(client)

def get_reading_repo(client: Client = Depends(get_supabase_client)) -> IReadingRepository:
    return SupabaseReadingRepository(client)

# Services
from app.services.learning import LearningService
from app.services.reading import ReadingService

def get_learning_service(repo: ILearningRepository = Depends(get_learning_repo)) -> LearningService:
    return LearningService(repo)

def get_reading_service(repo: IReadingRepository = Depends(get_reading_repo)) -> ReadingService:
    return ReadingService(repo)

async def get_current_user_id(user: dict[str, Any] = Depends(get_current_user)) -> str:
    """Dependency to get only the user ID."""
    return str(user["sub"])
