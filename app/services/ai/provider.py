"""Abstract AI provider interface."""

from abc import ABC, abstractmethod

from app.services.ai.models import AIRequest, AIResponse


class AIProvider(ABC):
    """Abstract base class for AI providers."""

    @abstractmethod
    async def complete(self, request: AIRequest) -> AIResponse:
        """Send a completion request and return an AIResponse."""
        ...

    @abstractmethod
    async def health_check(self) -> dict:
        """Check provider connectivity and return status."""
        ...
