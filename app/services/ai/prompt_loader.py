"""Load and render external prompt files from disk.

Supports both flat files (app/prompts/{name}.md) and versioned directories
(app/prompts/{name}/v{N}.md) with full backward compatibility.
"""

import re
from datetime import datetime, timezone
from pathlib import Path

from app.core.logging import logger
from app.services.ai.prompt_versioning import (
    PromptMetadata,
    get_latest_version,
    has_versioned_prompts,
    load_prompt_version,
)

PROMPTS_DIR = Path(__file__).resolve().parent.parent.parent / "prompts"

_FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)


def _parse_frontmatter(content: str) -> tuple[dict, str]:
    """Parse YAML-like frontmatter from prompt content. Returns (metadata, body).

    Handles:
    - Simple key: value pairs
    - Boolean values (true/false)
    - Integer values
    - List items (lines starting with -)
    - Nested list continuation
    """
    match = _FRONTMATTER_RE.match(content)
    if not match:
        return {}, content

    raw_yaml = match.group(1)
    body = content[match.end():]

    metadata: dict = {}
    current_key: str | None = None
    list_buffer: list[str] | None = None

    for line in raw_yaml.splitlines():
        stripped = line.strip()
        if not stripped:
            # Flush list on blank line
            if list_buffer is not None and current_key:
                metadata[current_key] = list(list_buffer)
                list_buffer = None
                current_key = None
            continue

        # List item (indented with -)
        if stripped.startswith("- ") and current_key and list_buffer is not None:
            list_buffer.append(stripped[2:].strip())
            continue

        # If we were collecting a list and hit a non-list line, flush it
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

        # Handle quoted strings
        if (value.startswith('"') and value.endswith('"')) or (
            value.startswith("'") and value.endswith("'")
        ):
            metadata[key] = value[1:-1]
        elif value.lower() == "true":
            metadata[key] = True
        elif value.lower() == "false":
            metadata[key] = False
        elif value.isdigit() or (value.startswith("-") and value[1:].isdigit()):
            metadata[key] = int(value)
        else:
            metadata[key] = value

    # Flush any pending list
    if list_buffer is not None and current_key:
        metadata[current_key] = list(list_buffer)

    return metadata, body.strip()


def load_prompt(name: str) -> str:
    """Load a prompt file by name (without .md extension).

    Falls back to flat files if no versioned directory exists.
    """
    # Try versioned prompts first
    if has_versioned_prompts(name):
        try:
            content, _version, _meta = load_prompt_version(name)
            logger.debug("Loaded versioned prompt: %s (v%d, %d chars)", name, _version, len(content))
            return content
        except FileNotFoundError:
            logger.debug("Versioned load failed for '%s', falling back to flat file", name)

    # Fallback to flat file (backward compatibility)
    prompt_path = PROMPTS_DIR / f"{name}.md"
    if not prompt_path.exists():
        logger.warning("Prompt file not found: %s", prompt_path)
        raise FileNotFoundError(f"Prompt file not found: {name}.md")
    content = prompt_path.read_text(encoding="utf-8").strip()
    logger.debug("Loaded prompt: %s (%d chars)", name, len(content))
    return content


def render_prompt(name: str, variables: dict[str, str] | None = None) -> str:
    """Load a prompt, strip frontmatter, and substitute {{variables}}.

    Tracks which version was used via logging.
    """
    version_used: int | None = None

    if has_versioned_prompts(name):
        try:
            raw, version_used, _meta = load_prompt_version(name)
            logger.debug("Rendering versioned prompt '%s' v%d", name, version_used)
        except FileNotFoundError:
            raw = load_prompt(name)
            logger.debug("Rendering flat prompt '%s'", name)
    else:
        raw = load_prompt(name)
        logger.debug("Rendering flat prompt '%s'", name)

    _, body = _parse_frontmatter(raw)
    if variables:
        for key, value in variables.items():
            body = body.replace(f"{{{{{key}}}}}", str(value))

    return body


def get_prompt_metadata(name: str) -> dict:
    """Return frontmatter metadata for a prompt without its body.

    Prefers versioned metadata.json when available, falls back to
    frontmatter parsing for flat files.
    """
    # Try versioned metadata first
    if has_versioned_prompts(name):
        version_meta = load_prompt_version(name)[2]
        if version_meta:
            meta_dict = version_meta.to_dict()
            meta_dict["name"] = name
            meta_dict.setdefault("char_count", 0)
            meta_dict["last_loaded_at"] = datetime.now(timezone.utc).isoformat()
            return meta_dict

    # Fallback to flat file frontmatter
    raw = load_prompt(name)
    metadata, body = _parse_frontmatter(raw)
    metadata.setdefault("name", name)
    metadata.setdefault("version", "1")
    metadata["version"] = str(metadata["version"])
    metadata.setdefault("description", "")
    metadata["char_count"] = len(body)
    metadata["estimated_tokens"] = max(1, len(body) // 3)
    metadata["variables"] = metadata.get("variables", [])
    metadata["last_loaded_at"] = datetime.now(timezone.utc).isoformat()
    return metadata


def list_prompts() -> list[str]:
    """List all available prompt names (flat files and versioned dirs)."""
    if not PROMPTS_DIR.exists():
        return []

    names: set[str] = set()

    # Flat files
    for p in PROMPTS_DIR.glob("*.md"):
        names.add(p.stem)

    # Versioned directories
    for p in PROMPTS_DIR.iterdir():
        if p.is_dir():
            # Check if it contains any v{N}.md files
            if any(p.glob("v*.md")):
                names.add(p.name)

    return sorted(names)


def prompt_exists(name: str) -> bool:
    """Check if a prompt exists (versioned or flat)."""
    if has_versioned_prompts(name):
        return True
    return (PROMPTS_DIR / f"{name}.md").exists()
