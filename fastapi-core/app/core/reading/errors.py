class ReadingCoreError(Exception):
    """Base class for reading core errors"""

    pass


class SessionNotFoundError(ReadingCoreError):
    pass


class UnauthorizedSessionAccessError(ReadingCoreError):
    pass


class InvalidSessionStateError(ReadingCoreError):
    pass


class QuestionNotFoundError(ReadingCoreError):
    pass
