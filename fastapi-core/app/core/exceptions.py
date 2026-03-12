class CoreError(Exception):
    """Base class for all core errors."""
    pass

class NotFoundError(CoreError):
    """Raised when a resource is not found."""
    pass

class UnauthorizedError(CoreError):
    """Raised when a user is not authorized to access a resource."""
    pass

class ValidationError(CoreError):
    """Raised when a business rule validation fails."""
    pass
