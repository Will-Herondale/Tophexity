"""Long-term conversation memory management."""

from datetime import datetime, timezone

from app.core.logging import logger


class ConversationMemory:
    """Manages the working memory window for a conversation.

    Holds recent messages and an optional summary of older history.
    """

    def __init__(
        self,
        recent_messages: list[dict[str, str]] | None = None,
        summary: str | None = None,
        max_recent: int = 50,
    ) -> None:
        self.recent_messages = recent_messages or []
        self.summary = summary
        self.max_recent = max_recent

    def add_message(self, role: str, content: str) -> None:
        self.recent_messages.append({
            "role": role,
            "content": content,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

    def trim(self) -> list[dict[str, str]]:
        """Trim messages beyond max_recent, returning trimmed ones."""
        if len(self.recent_messages) <= self.max_recent:
            return []
        trimmed = self.recent_messages[: len(self.recent_messages) - self.max_recent]
        self.recent_messages = self.recent_messages[len(self.recent_messages) - self.max_recent :]
        return trimmed

    def needs_summarization(self, threshold: int = 20) -> bool:
        return len(self.recent_messages) > threshold

    def build_messages_for_ai(self, system_prompt: str) -> list[dict[str, str]]:
        """Build the message list to send to AI."""
        messages = [{"role": "system", "content": system_prompt}]

        if self.summary:
            messages.append({
                "role": "system",
                "content": f"Summary of earlier conversation:\n{self.summary}",
            })

        for msg in self.recent_messages:
            messages.append({
                "role": msg["role"],
                "content": msg["content"],
            })

        return messages

    def get_message_count(self) -> int:
        return len(self.recent_messages)

    def clear(self) -> None:
        self.recent_messages.clear()
        self.summary = None
