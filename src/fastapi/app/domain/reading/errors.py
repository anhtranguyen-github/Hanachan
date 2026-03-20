"""Reading domain errors."""


class ReadingCoreError(Exception):
    """Base class for reading domain errors."""


class SessionNotFoundError(ReadingCoreError):
    pass


class UnauthorizedSessionAccessError(ReadingCoreError):
    pass


class InvalidSessionStateError(ReadingCoreError):
    pass


class QuestionNotFoundError(ReadingCoreError):
    pass
