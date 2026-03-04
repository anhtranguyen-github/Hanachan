from datetime import datetime, timezone

class HanaTime:
    @staticmethod
    def get_now_iso() -> str:
        return datetime.now(timezone.utc).isoformat()
    
    @staticmethod
    def get_now() -> datetime:
        return datetime.now(timezone.utc)
