"""Structured JSON logging for production observability."""

from __future__ import annotations

import json
import logging
import sys
from datetime import datetime, timezone
from typing import Any


class JSONFormatter(logging.Formatter):
    """Formats log records as single-line JSON for log aggregators."""

    def format(self, record: logging.LogRecord) -> str:
        log_entry: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Include extra fields passed via logger bindings
        standard_attrs = {
            "name", "msg", "args", "levelname", "levelno", "pathname", "filename",
            "module", "exc_info", "exc_text", "stack_info", "lineno", "funcName",
            "created", "msecs", "relativeCreated", "thread", "threadName", "processName",
            "process", "message", "asctime",
        }
        for key, value in record.__dict__.items():
            if key not in standard_attrs and not key.startswith("_"):
                log_entry[key] = value

        # Exception info
        if record.exc_info and record.exc_info[1]:
            log_entry["exception"] = {
                "type": type(record.exc_info[1]).__name__,
                "message": str(record.exc_info[1]),
            }
            if record.exc_text:
                log_entry["exception"]["traceback"] = record.exc_text

        return json.dumps(log_entry, default=str)


class TextFormatter(logging.Formatter):
    """Human-readable format for local development."""

    def format(self, record: logging.LogRecord) -> str:
        ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        return f"{ts} | {record.levelname:<8} | {record.name} | {record.getMessage()}"


def setup_structured_logging(json_mode: bool = False) -> logging.Logger:
    """Configure structured logging. json_mode=True for production."""
    from app.core.config import get_settings

    settings = get_settings()
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONFormatter() if json_mode else TextFormatter())

    logging.basicConfig(
        level=log_level,
        handlers=[handler],
        force=True,
    )

    logger = logging.getLogger(settings.APP_NAME)
    logger.setLevel(log_level)

    # Quieten noisy libraries
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("openai").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)

    return logger


def get_request_logger(
    request_id: str,
    user_id: str | None = None,
    conversation_id: str | None = None,
) -> logging.LoggerAdapter:
    """Get a logger pre-bound with request context fields."""
    from app.core.config import get_settings

    base = logging.getLogger(get_settings().APP_NAME)
    extra: dict[str, Any] = {"request_id": request_id}
    if user_id:
        extra["user_id"] = user_id
    if conversation_id:
        extra["conversation_id"] = conversation_id

    return logging.LoggerAdapter(base, extra)
