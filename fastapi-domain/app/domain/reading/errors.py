class ReadingDomainError(Exception):
    """Base class for reading domain errors"""

    pass


class SessionNotFoundError(ReadingDomainError):
    pass


class UnauthorizedSessionAccessError(ReadingDomainError):
    pass


class InvalidSessionStateError(ReadingDomainError):
    pass


class QuestionNotFoundError(ReadingDomainError):
    pass
