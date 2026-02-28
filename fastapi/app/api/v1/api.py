from fastapi import APIRouter
from .endpoints import chat, session, memory, maintenance, reading

api_router = APIRouter()
api_router.include_router(chat.router, tags=["Chat"])
api_router.include_router(session.router, prefix="/memory", tags=["Session"])
api_router.include_router(memory.router, prefix="/memory", tags=["Memory"])
api_router.include_router(maintenance.router, tags=["Maintenance"])
api_router.include_router(reading.router, tags=["Reading"])
