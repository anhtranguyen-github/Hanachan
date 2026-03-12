from datetime import UTC, datetime


class HanaTime:
    @staticmethod
    def get_now_iso() -> str:
        return datetime.now(UTC).isoformat()

    @staticmethod
    def get_now() -> datetime:
        return datetime.now(UTC)
