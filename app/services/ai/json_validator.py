"""Validate AI-generated JSON against Pydantic models."""

import json
from typing import TypeVar
from uuid import UUID

from pydantic import BaseModel, ValidationError

from app.core.logging import logger
from app.services.ai.exceptions import AIValidationError
from app.services.ai.response_parser import extract_json_from_response

T = TypeVar("T", bound=BaseModel)


def validate_json_response(
    content: str,
    model: type[T],
    required_fields: list[str] | None = None,
) -> T:
    """Parse AI response content and validate against a Pydantic model.

    Returns validated model instance or raises AIValidationError.
    """
    try:
        data = extract_json_from_response(content)
    except AIValidationError:
        raise
    except Exception as e:
        raise AIValidationError(f"Failed to parse AI response: {e}") from e

    if required_fields and isinstance(data, dict):
        missing = [f for f in required_fields if f not in data]
        if missing:
            raise AIValidationError(f"Missing required fields: {', '.join(missing)}")

    try:
        return model.model_validate(data)
    except ValidationError as e:
        errors = []
        for err in e.errors():
            loc = " -> ".join(str(l) for l in err["loc"])
            errors.append(f"{loc}: {err['msg']}")
        raise AIValidationError(
            f"Response validation failed: {'; '.join(errors)}"
        ) from e


def validate_json_raw(content: str) -> dict | list:
    """Parse and return raw validated JSON without a Pydantic model."""
    return extract_json_from_response(content)


def make_json_serializable(obj: object) -> object:
    """Convert objects to JSON-serializable types (UUID, datetime, etc.)."""
    if isinstance(obj, UUID):
        return str(obj)
    if isinstance(obj, dict):
        return {k: make_json_serializable(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [make_json_serializable(v) for v in obj]
    return obj
