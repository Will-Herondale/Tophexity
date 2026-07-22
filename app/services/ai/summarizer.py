"""Conversation summarization for long conversations."""

from app.core.logging import logger
from app.services.ai.client import get_ai_client
from app.services.ai.prompt_cache import prompt_cache
from app.services.ai.response_parser import clean_response_content


async def summarize_messages(
    messages: list[dict[str, str]],
    user_id: str | None = None,
) -> str:
    """Summarize a list of conversation messages into a concise summary.

    Args:
        messages: List of {"role": ..., "content": ...} dicts.
        user_id: Optional user ID for rate limiting.

    Returns:
        A concise summary string.
    """
    if not messages:
        return ""

    conversation_text = "\n".join(
        f"{m['role'].upper()}: {m['content']}" for m in messages
    )

    summary_template = prompt_cache.get("system")
    system_prompt = (
        "You are a conversation summarizer. "
        "Summarize the following conversation concisely, preserving key facts, "
        "user preferences, career goals, and important decisions. "
        "Keep the summary under 500 words.\n\n"
        f"Additional context:\n{summary_template}"
    )

    user_prompt = (
        "Summarize this conversation:\n\n"
        f"{conversation_text}\n\n"
        "Provide a concise summary that preserves all important information."
    )

    client = get_ai_client()
    try:
        response = await client.chat(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_tokens=1000,
            user_id=user_id,
        )
        summary = clean_response_content(response.content)
        logger.info("Conversation summarized: %d messages -> %d chars", len(messages), len(summary))
        return summary
    except Exception as e:
        logger.error("Summarization failed: %s", str(e)[:200])
        # Fallback: create a simple summary from the first and last messages
        first = messages[0]["content"][:200] if messages else ""
        last = messages[-1]["content"][:200] if len(messages) > 1 else ""
        return f"Conversation summary (auto-generated): Started with '{first}'. Last message: '{last}'."
