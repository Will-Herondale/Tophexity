"""Extract discrete facts from conversation messages for persistent memory."""

import json
import re
from datetime import datetime, timezone

from app.core.logging import logger
from app.services.ai.client import get_ai_client
from app.services.ai.prompt_loader import render_prompt
from app.services.ai.response_parser import clean_response_content


VALID_CATEGORIES = frozenset({
    "career_goal", "skill_level", "preference", "constraint",
    "interest", "experience", "education",
})


def _parse_facts(raw: str) -> list[dict]:
    """Parse JSON array of facts from AI response."""
    cleaned = clean_response_content(raw)
    # Try to find a JSON array in the response
    match = re.search(r"\[.*\]", cleaned, re.DOTALL)
    if not match:
        return []
    try:
        facts = json.loads(match.group())
        if not isinstance(facts, list):
            return []
        return [f for f in facts if isinstance(f, dict) and "fact" in f]
    except (json.JSONDecodeError, TypeError):
        logger.warning("Failed to parse fact extraction response as JSON")
        return []


def _normalize_fact(fact: dict) -> dict:
    """Normalize a fact dict with defaults."""
    return {
        "fact": str(fact.get("fact", "")).strip(),
        "category": fact.get("category", "interest"),
        "confidence": float(fact.get("confidence", 0.5)),
        "extracted_at": datetime.now(timezone.utc).isoformat(),
    }


def dedup_facts(existing: list[dict], new_facts: list[dict]) -> list[dict]:
    """Remove duplicate facts by simple text similarity."""
    existing_texts = {f.get("fact", "").lower().strip() for f in existing}
    deduped = []
    for fact in new_facts:
        text = fact.get("fact", "").lower().strip()
        if text and text not in existing_texts:
            existing_texts.add(text)
            deduped.append(fact)
    return deduped


async def extract_facts(
    messages: list[dict[str, str]],
    user_id: str | None = None,
) -> list[dict]:
    """Extract facts from conversation messages using AI."""
    if not messages or len(messages) < 2:
        return []

    conversation_text = "\n".join(
        f"{m['role'].upper()}: {m['content']}" for m in messages
    )

    system_prompt = render_prompt("fact_extraction", {"conversation_text": ""})

    user_prompt = (
        "Extract facts from this conversation:\n\n"
        f"{conversation_text}\n\n"
        "Return a JSON array of facts."
    )

    client = get_ai_client()
    try:
        response = await client.chat(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
            max_tokens=512,
            user_id=user_id,
        )
        raw_facts = _parse_facts(response.content)
        normalized = [_normalize_fact(f) for f in raw_facts]
        # Filter to valid categories
        valid = [f for f in normalized if f["category"] in VALID_CATEGORIES]
        logger.info("Extracted %d facts from %d messages", len(valid), len(messages))
        return valid
    except Exception as e:
        logger.error("Fact extraction failed: %s", str(e)[:200])
        return []
