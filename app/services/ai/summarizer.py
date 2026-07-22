"""Conversation summarization for long conversations.

Supports full summarization, delta (incremental) summarization,
summary merging, and validation before storage.
"""

from app.core.config import get_settings
from app.core.logging import logger
from app.services.ai.client import get_ai_client
from app.services.ai.prompt_loader import render_prompt
from app.services.ai.response_parser import clean_response_content

settings = get_settings()


def validate_summary(summary: str, existing: str | None = None) -> str | None:
    """Validate a summary before storing. Returns None if invalid."""
    if not summary or not summary.strip():
        return None
    summary = summary.strip()
    if len(summary) > settings.AI_MAX_SUMMARY_LENGTH:
        logger.warning("Summary too long (%d chars), truncating", len(summary))
        summary = summary[: settings.AI_MAX_SUMMARY_LENGTH]
    if existing and summary.strip() == existing.strip():
        logger.debug("Summary unchanged, skipping update")
        return None
    return summary


async def summarize_messages(
    messages: list[dict[str, str]],
    user_id: str | None = None,
) -> str:
    """Summarize a list of conversation messages into a concise summary."""
    if not messages:
        return ""

    conversation_text = "\n".join(
        f"{m['role'].upper()}: {m['content']}" for m in messages
    )

    system_prompt = render_prompt("summarization", {"conversation_text": ""})

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
        first = messages[0]["content"][:200] if messages else ""
        last = messages[-1]["content"][:200] if len(messages) > 1 else ""
        return f"Conversation summary (auto-generated): Started with '{first}'. Last message: '{last}'."


async def summarize_delta(
    messages: list[dict[str, str]],
    user_id: str | None = None,
) -> str:
    """Summarize only the new (delta) messages since last summary."""
    if not messages:
        return ""

    conversation_text = "\n".join(
        f"{m['role'].upper()}: {m['content']}" for m in messages
    )

    system_prompt = (
        "You are a conversation summarizer. "
        "Summarize ONLY the new messages below. "
        "These are ADDITIONS to an existing conversation. "
        "Preserve key facts, preferences, and decisions. "
        "Keep it concise (under 300 words)."
    )

    user_prompt = (
        "New messages since last summary:\n\n"
        f"{conversation_text}\n\n"
        "Provide a concise delta summary of just these new messages."
    )

    client = get_ai_client()
    try:
        response = await client.chat(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_tokens=600,
            user_id=user_id,
        )
        return clean_response_content(response.content)
    except Exception as e:
        logger.error("Delta summarization failed: %s", str(e)[:200])
        return ""


def merge_summaries(existing: str, delta: str) -> str:
    """Merge an existing summary with a delta summary."""
    if not delta:
        return existing
    if not existing:
        return delta
    combined = f"{existing}\n\n{delta}"
    if len(combined) > settings.AI_MAX_SUMMARY_LENGTH:
        combined = combined[: settings.AI_MAX_SUMMARY_LENGTH]
    return combined
