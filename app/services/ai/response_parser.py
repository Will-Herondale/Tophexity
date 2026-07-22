"""Parse and extract content from AI responses."""

import json
import re

from app.core.logging import logger
from app.services.ai.exceptions import AIValidationError


def extract_json_from_response(content: str) -> dict | list:
    """Extract JSON from AI response, handling markdown code blocks."""
    content = content.strip()

    patterns = [
        r"```json\s*\n(.*?)\n\s*```",
        r"```\s*\n(.*?)\n\s*```",
        r"```(.*?)```",
    ]
    for pattern in patterns:
        match = re.search(pattern, content, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1).strip())
            except json.JSONDecodeError:
                continue

    try:
        return json.loads(content)
    except json.JSONDecodeError:
        pass

    first_brace = content.find("{")
    first_bracket = content.find("[")
    if first_brace == -1 and first_bracket == -1:
        raise AIValidationError("No JSON found in AI response")

    if first_brace == -1:
        start = first_bracket
    elif first_bracket == -1:
        start = first_brace
    else:
        start = min(first_brace, first_bracket)

    end = max(content.rfind("}"), content.rfind("]"))
    if end <= start:
        raise AIValidationError("Incomplete JSON in AI response")

    try:
        return json.loads(content[start : end + 1])
    except json.JSONDecodeError as e:
        raise AIValidationError(f"Invalid JSON in AI response: {e}") from e


def clean_response_content(content: str) -> str:
    """Remove markdown code block wrappers from plain text responses."""
    content = content.strip()
    if content.startswith("```") and content.endswith("```"):
        lines = content.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        return "\n".join(lines).strip()
    return content


def validate_response_structure(data: dict | list, required_fields: list[str]) -> None:
    """Validate that a dict has required top-level fields."""
    if isinstance(data, list):
        return
    missing = [f for f in required_fields if f not in data]
    if missing:
        raise AIValidationError(f"Missing required fields: {', '.join(missing)}")
