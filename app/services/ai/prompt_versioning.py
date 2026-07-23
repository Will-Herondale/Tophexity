"""Prompt versioning system with directory-based version storage.

Supports:
- Versioned directories: app/prompts/{name}/v{N}.md with metadata.json
- Flat file fallback: app/prompts/{name}.md
- Version validation, listing, and loading
"""

import json
import re
from dataclasses import dataclass, field
from pathlib import Path

from app.core.logging import logger

PROMPTS_DIR = Path(__file__).resolve().parent.parent.parent / "prompts"

_VERSION_RE = re.compile(r"^v(\d+)\.md$")
_METADATA_FILE = "metadata.json"


@dataclass
class PromptMetadata:
    name: str
    version: str
    author: str = ""
    date: str = ""
    description: str = ""
    variables: list[str] = field(default_factory=list)
    dependencies: list[str] = field(default_factory=list)
    supported_models: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "version": self.version,
            "author": self.author,
            "date": self.date,
            "description": self.description,
            "variables": self.variables,
            "dependencies": self.dependencies,
            "supported_models": self.supported_models,
        }


def _get_version_dir(name: str) -> Path:
    return PROMPTS_DIR / name


def _get_flat_file(name: str) -> Path:
    return PROMPTS_DIR / f"{name}.md"


def _parse_version(version_str: str) -> tuple[int, ...]:
    """Parse '1.0.0' into (1, 0, 0) for comparison."""
    try:
        return tuple(int(x) for x in version_str.split("."))
    except (ValueError, AttributeError):
        return (0,)


def _extract_version_int(v: tuple[int, ...]) -> int:
    """Extract major version as an integer from a version tuple."""
    return v[0] if v else 0


def _read_metadata(version_dir: Path) -> PromptMetadata | None:
    """Read metadata.json from a version directory."""
    metadata_path = version_dir / _METADATA_FILE
    if not metadata_path.exists():
        return None
    try:
        raw = json.loads(metadata_path.read_text(encoding="utf-8"))
        return PromptMetadata(
            name=raw.get("name", ""),
            version=raw.get("version", "0.0.0"),
            author=raw.get("author", ""),
            date=raw.get("date", ""),
            description=raw.get("description", ""),
            variables=raw.get("variables", []),
            dependencies=raw.get("dependencies", []),
            supported_models=raw.get("supported_models", []),
        )
    except (json.JSONDecodeError, OSError) as exc:
        logger.warning("Failed to read metadata from %s: %s", metadata_path, exc)
        return None


def _list_version_dirs(name: str) -> dict[int, tuple[str, Path]]:
    """Scan a version directory for v{N}.md files.

    Returns dict mapping major version int -> (version_str, file_path).
    """
    version_dir = _get_version_dir(name)
    if not version_dir.is_dir():
        return {}

    versions: dict[int, tuple[str, Path]] = {}
    for item in version_dir.iterdir():
        match = _VERSION_RE.match(item.name)
        if match:
            major = int(match.group(1))
            versions[major] = (str(major), item)
    return versions


def get_latest_version(name: str) -> int | None:
    """Return the latest major version number for a prompt, or None if no versioned prompts exist."""
    versions = _list_version_dirs(name)
    if not versions:
        return None
    return max(versions.keys())


def list_versions(name: str) -> list[int]:
    """List all available major version numbers for a prompt, sorted ascending."""
    versions = _list_version_dirs(name)
    return sorted(versions.keys())


def has_versioned_prompts(name: str) -> bool:
    """Check if a prompt has versioned directories."""
    return bool(_list_version_dirs(name))


def load_prompt_version(name: str, version: int | None = None) -> tuple[str, int, PromptMetadata | None]:
    """Load a specific or latest version of a prompt.

    Args:
        name: Prompt name.
        version: Major version number. If None, loads latest.

    Returns:
        Tuple of (prompt_content, version_number, metadata).
        metadata is None if no metadata.json found.

    Raises:
        FileNotFoundError: If the requested version doesn't exist.
    """
    versions = _list_version_dirs(name)

    if version is not None:
        if version not in versions:
            raise FileNotFoundError(
                f"Prompt '{name}' version {version} not found"
            )
        major = version
    else:
        if not versions:
            raise FileNotFoundError(
                f"No versioned prompts found for '{name}'"
            )
        major = max(versions.keys())

    _, file_path = versions[major]
    if not file_path.exists():
        raise FileNotFoundError(
            f"Prompt file not found: {file_path}"
        )

    content = file_path.read_text(encoding="utf-8").strip()
    metadata = _read_metadata(file_path.parent)
    if metadata:
        metadata.name = name

    logger.debug("Loaded versioned prompt: %s v%d (%d chars)", name, major, len(content))
    return content, major, metadata


def get_version_metadata(name: str, version: int | None = None) -> PromptMetadata | None:
    """Get metadata for a specific or latest version."""
    if version is None:
        version = get_latest_version(name)
    if version is None:
        return None
    versions = _list_version_dirs(name)
    if version not in versions:
        return None
    _, file_path = versions[version]
    metadata = _read_metadata(file_path.parent)
    if metadata:
        metadata.name = name
    return metadata


@dataclass
class ValidationResult:
    valid: bool
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


def validate_prompt(name: str) -> ValidationResult:
    """Validate a prompt by name.

    Checks:
    - Prompt exists (versioned or flat)
    - File is readable
    - Frontmatter variables are present (for versioned prompts with metadata)
    - Syntax is valid (no unclosed {{ }} blocks)
    """
    errors: list[str] = []
    warnings: list[str] = []

    has_versioned = has_versioned_prompts(name)
    has_flat = _get_flat_file(name).exists()

    if not has_versioned and not has_flat:
        errors.append(f"Prompt '{name}' not found (no versioned dir or flat file)")
        return ValidationResult(valid=False, errors=errors)

    content = None
    metadata = None
    version_used = None

    if has_versioned:
        try:
            content, version_used, metadata = load_prompt_version(name)
        except FileNotFoundError as exc:
            errors.append(str(exc))
            return ValidationResult(valid=False, errors=errors)
    else:
        flat = _get_flat_file(name)
        try:
            content = flat.read_text(encoding="utf-8").strip()
        except OSError as exc:
            errors.append(f"Cannot read prompt file {flat}: {exc}")
            return ValidationResult(valid=False, errors=errors)

    if not content:
        errors.append(f"Prompt '{name}' is empty")
        return ValidationResult(valid=False, errors=errors)

    # Check for unclosed {{ blocks
    open_count = content.count("{{")
    close_count = content.count("}}")
    if open_count != close_count:
        warnings.append(
            f"Mismatched template braces: {open_count} opens, {close_count} closes"
        )

    # Check for unresolved {{variable}} patterns
    import re
    unresolved = re.findall(r"\{\{(\w+)\}\}", content)
    if unresolved:
        declared_vars = metadata.variables if metadata else []
        for var in unresolved:
            if var not in declared_vars:
                warnings.append(f"Undeclared variable '{{{{{var}}}}}' in prompt body")

    if metadata and metadata.variables:
        for var in metadata.variables:
            pattern = f"{{{{{var}}}}}"
            if pattern not in content:
                warnings.append(f"Declared variable '{var}' not found in prompt body")

    logger.debug(
        "Validated prompt '%s': valid=%s, errors=%d, warnings=%d",
        name, not errors, len(errors), len(warnings),
    )
    return ValidationResult(valid=not errors, errors=errors, warnings=warnings)
