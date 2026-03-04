from typing import Any, Dict
from supabase import Client
from app.api.deps import get_current_user, get_user_client
from fastapi import Depends
