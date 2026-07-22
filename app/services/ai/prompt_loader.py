"""Load and render external prompt files from disk."""

import re
from datetime import datetime, timezone
from pathlib import Path

from app.core.logging import logger

PROMPTS_DIR = Path(__file__).resolve().parent.parent.parent / "prompts"

_FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)


def load_prompt(name: str) -> str:
    """Load a prompt file by name (without .md extension)."""
    prompt_path = PROMPTS_DIR / f"{name}.md"
    if not prompt_path.exists():
        logger.warning("Prompt file not found: %s", prompt_path)
        raise FileNotFoundError(f"Prompt file not found: {name}.md")
    content = prompt_path.read_text(encoding="utf-8").strip()
    logger.debug("Loaded prompt: %s (%d chars)", name, len(content))
    return content


def _parse_frontmatter(content: str) -> tuple[dict, str]:
    """Parse YAML frontmatter from prompt content. Returns (metadata, body)."""
    match = _FRONTMATTER_RE.match(content)
    if not match:
        return {}, content

    raw_yaml = match.group(1)
    body = content[match.end():]

    metadata: dict = {}
    current_key = None
    list_buffer: list[str] | None = None

    for line in raw_yaml.splitlines():
        stripped = line.strip()
        if not stripped:
            continue

        # List item (indented with -)
        if stripped.startswith("- ") and current_key and list_buffer is not None:
            list_buffer.append(stripped[2:].strip())
            continue

        # If we were collecting a list, flush it
        if list_buffer is not None:
            metadata[current_key] = list(list_buffer)
            list_buffer = None
            current_key = None

        if ":" not in stripped:
            continue

        key, _, value = stripped.partition(":")
        key = key.strip()
        value = value.strip()

        if not value:
            # Could be a YAML list under this key
            current_key = key
            list_buffer = []
            continue

        current_key = None
        if value.lower() == "true":
            metadata[key] = True
        elif value.lower() == "false":
            metadata[key] = False
        elif value.isdigit():
            metadata[key] = int(value)
        else:
            metadata[key] = value

    # Flush any pending list
    if list_buffer is not None and current_key:
        metadata[current_key] = list(list_buffer)

    return metadata, body.strip()


def render_prompt(name: str, variables: dict[str, str] | None = None) -> str:
    """Load a prompt, strip frontmatter, and substitute {{variables}}."""
    raw = load_prompt(name)
    _, body = _parse_frontmatter(raw)
    if variables:
        for key, value in variables.items():
            body = body.replace(f"{{{{{key}}}}}", str(value))
    return body


def get_prompt_metadata(name: str) -> dict:
    """Return frontmatter metadata for a prompt without its body."""
    raw = load_prompt(name)
    metadata, body = _parse_frontmatter(raw)
    metadata.setdefault("name", name)
    metadata.setdefault("version", 1)
    metadata.setdefault("description", "")
    metadata["char_count"] = len(body)
    metadata["estimated_tokens"] = max(1, len(body) // 3)
    metadata["variables"] = metadata.get("variables", [])
    metadata["last_loaded_at"] = datetime.now(timezone.utc).isoformat()
    return metadata


def list_prompts() -> list[str]:
    """List all available prompt names."""
    if not PROMPTS_DIR.exists():
        return []
    return sorted(p.stem for p in PROMPTS_DIR.glob("*.md"))


def prompt_exists(name: str) -> bool:
    """Check if a prompt file exists."""
    return (PROMPTS_DIR / f"{name}.md").exists()
