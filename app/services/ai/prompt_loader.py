"""Load external prompt files from disk."""

from pathlib import Path

from app.core.logging import logger

PROMPTS_DIR = Path(__file__).resolve().parent.parent.parent / "prompts"


def load_prompt(name: str) -> str:
    """Load a prompt file by name (without .md extension)."""
    prompt_path = PROMPTS_DIR / f"{name}.md"
    if not prompt_path.exists():
        logger.warning("Prompt file not found: %s", prompt_path)
        raise FileNotFoundError(f"Prompt file not found: {name}.md")
    content = prompt_path.read_text(encoding="utf-8").strip()
    logger.debug("Loaded prompt: %s (%d chars)", name, len(content))
    return content


def list_prompts() -> list[str]:
    """List all available prompt names."""
    if not PROMPTS_DIR.exists():
        return []
    return [p.stem for p in PROMPTS_DIR.glob("*.md")]


def prompt_exists(name: str) -> bool:
    """Check if a prompt file exists."""
    return (PROMPTS_DIR / f"{name}.md").exists()
