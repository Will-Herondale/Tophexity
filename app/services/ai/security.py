"""Security module for AI request validation and sanitization.

Provides prompt injection detection, jailbreak detection, input sanitization,
secret masking, and a unified SecurityMiddleware that orchestrates all checks.
"""

import re
from pydantic import BaseModel

from app.core.config import get_settings
from app.core.logging import logger


class SecurityCheckResult(BaseModel):
    """Result of a unified security check."""

    passed: bool
    injection_detected: bool = False
    jailbreak_detected: bool = False
    risk_score: float = 0.0
    blocked_reason: str | None = None
    sanitized_content: str = ""


class PromptInjectionDetector:
    """Detect prompt injection attempts in user messages."""

    PATTERNS: list[str] = [
        r"ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|rules?)",
        r"reveal\s+(your|the)\s+(system\s+)?prompt",
        r"delete\s+(all\s+)?(memory|context|history|conversation)",
        r"show\s+(me\s+)?(hidden|secret|system)\s+(prompt|instructions?)",
        r"you\s+are\s+now\s+(a|an)\s+",
        r"pretend\s+(you\s+are|to\s+be)",
        r"disregard\s+(all|any|your)\s+",
        r"override\s+(your|the)\s+(instructions?|rules?|programming)",
        r"new\s+instructions?:",
        r"system\s*:\s*",
        r"<\|im_start\|>",
        r"<\|im_end\|>",
        r"\[INST\]",
        r"\[/INST\]",
        r"###\s*(system|assistant|human)\s*:",
    ]

    def __init__(self) -> None:
        self._compiled = [re.compile(p, re.IGNORECASE) for p in self.PATTERNS]

    def detect(self, text: str) -> tuple[bool, list[str]]:
        """Scan *text* for injection patterns.

        Returns:
            ``(is_suspicious, matched_patterns)`` where *matched_patterns*
            contains the human-readable descriptions of every pattern that
            fired.
        """
        matches: list[str] = []
        for pattern in self._compiled:
            if pattern.search(text):
                matches.append(pattern.pattern)
        return bool(matches), matches

    def get_risk_score(self, text: str) -> float:
        """Return a 0.0–1.0 risk score based on how many patterns match."""
        _, matches = self.detect(text)
        if not matches:
            return 0.0
        # Each match adds ~0.15, capped at 1.0
        return min(len(matches) * 0.15, 1.0)


class JailbreakDetector:
    """Detect common jailbreak attempts."""

    PATTERNS: list[str] = [
        r"do\s+anything\s+now",
        r"developer\s+mode",
        r"jailbreak",
        r"bypass\s+(all\s+)?(safety|filters?|moderation|restrictions?)",
        r"(nsfw|explicit)\s+(content|mode)",
        r"unrestricted\s+(mode|ai|gpt)",
        r"DAN\s+mode",
        r"ignore\s+(content\s+)?(policies?|guidelines?|restrictions?|filters?)",
    ]

    def __init__(self) -> None:
        self._compiled = [re.compile(p, re.IGNORECASE) for p in self.PATTERNS]

    def detect(self, text: str) -> tuple[bool, list[str]]:
        """Scan *text* for jailbreak patterns.

        Returns:
            ``(is_suspicious, matched_patterns)``.
        """
        matches: list[str] = []
        for pattern in self._compiled:
            if pattern.search(text):
                matches.append(pattern.pattern)
        return bool(matches), matches


class InputSanitizer:
    """Sanitize user inputs before processing."""

    _HTML_TAG_RE = re.compile(r"<[^>]+>", re.IGNORECASE)
    _EVENT_HANDLER_RE = re.compile(
        r"\s+on\w+\s*=\s*(?:\"[^\"]*\"|'[^']*'|[^\s>]+)",
        re.IGNORECASE,
    )
    _JS_URI_RE = re.compile(r"javascript\s*:", re.IGNORECASE)
    _MD_IMG_RE = re.compile(r"!\[([^\]]*)\]\((https?://[^)]+)\)", re.IGNORECASE)
    _MD_LINK_RE = re.compile(r"\[([^\]]+)\]\((https?://[^)]+)\)", re.IGNORECASE)
    _NESTED_MD_RE = re.compile(r"(```[\s\S]*?```)", re.IGNORECASE)

    def sanitize_html(self, text: str) -> str:
        """Remove HTML tags, event handlers, and javascript: URIs."""
        text = self._EVENT_HANDLER_RE.sub("", text)
        text = self._JS_URI_RE.sub("", text)
        text = self._HTML_TAG_RE.sub("", text)
        return text

    def sanitize_markdown(self, text: str) -> str:
        """Remove image tags with external URLs and link references that
        could be tracking. Limits nesting depth of fenced code blocks."""
        text = self._MD_IMG_RE.sub(r"![\1](redacted)", text)
        # Strip link text but keep a benign placeholder
        text = self._MD_LINK_RE.sub(r"[\1](redacted)", text)
        # Limit code-block nesting to 1 level
        blocks = self._NESTED_MD_RE.findall(text)
        for block in blocks:
            inner = re.sub(r"```[\s\S]*?```", "[nested-block]", block, count=1)
            if inner != block:
                text = text.replace(block, inner)
        return text

    def check_token_limit(
        self, text: str, max_tokens: int = 8000
    ) -> tuple[bool, int]:
        """Check if *text* exceeds *max_tokens*.

        Uses a rough heuristic: ~4 chars per token for English, ~2 for CJK.
        Returns ``(exceeds, estimated_tokens)``.
        """
        cjk_count = sum(1 for ch in text if "\u4e00" <= ch <= "\u9fff"
                        or "\u3040" <= ch <= "\u30ff"
                        or "\uac00" <= ch <= "\ud7af")
        non_cjk_chars = len(text) - cjk_count
        estimated = (cjk_count // 2) + (non_cjk_chars // 4)
        return estimated > max_tokens, estimated


class SecretProtector:
    """Ensure secrets are never logged or exposed."""

    PATTERNS_TO_MASK: list[tuple[str, str]] = [
        (r'api[_-]?key["\s:=]+\S+', "api_key=***"),
        (r'password["\s:=]+\S+', "password=***"),
        (r"Bearer\s+\S+", "Bearer ***"),
        (r"eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+", "[JWT_TOKEN]"),
        (r"sk-[A-Za-z0-9]{20,}", "[API_KEY]"),
    ]

    def __init__(self) -> None:
        self._compiled = [
            (re.compile(pat, re.IGNORECASE), replacement)
            for pat, replacement in self.PATTERNS_TO_MASK
        ]

    def mask_secrets(self, text: str) -> str:
        """Replace all secret patterns with masked versions."""
        for pattern, replacement in self._compiled:
            text = pattern.sub(replacement, text)
        return text


class SecurityMiddleware:
    """Unified security check for AI requests.

    Orchestrates all sub-detectors and the input sanitizer, returning a
    single :class:`SecurityCheckResult`.
    """

    def __init__(self) -> None:
        self.injection_detector = PromptInjectionDetector()
        self.jailbreak_detector = JailbreakDetector()
        self.sanitizer = InputSanitizer()
        self.secret_protector = SecretProtector()

    def check_message(
        self, content: str, settings: object | None = None
    ) -> SecurityCheckResult:
        """Run all security checks on a user message.

        Args:
            content: The raw user message text.
            settings: Optional settings object; falls back to
                :func:`get_settings` when *None*.

        Returns:
            A :class:`SecurityCheckResult` with all findings.
        """
        if settings is None:
            settings = get_settings()

        injection_enabled = getattr(settings, "AI_PROMPT_INJECTION_ENABLED", True)
        jailbreak_enabled = getattr(settings, "AI_JAILBREAK_DETECTION_ENABLED", True)
        max_tokens = getattr(settings, "AI_MAX_INPUT_TOKENS", 8000)

        # --- Sanitize ---
        sanitized = self.sanitizer.sanitize_html(content)
        sanitized = self.sanitizer.sanitize_markdown(sanitized)

        # --- Token limit ---
        exceeds, estimated = self.sanitizer.check_token_limit(sanitized, max_tokens)
        if exceeds:
            logger.warning("Input exceeds token limit: %d > %d", estimated, max_tokens)
            return SecurityCheckResult(
                passed=False,
                risk_score=1.0,
                blocked_reason=f"Input exceeds token limit ({estimated} > {max_tokens})",
                sanitized_content=sanitized,
            )

        # --- Injection ---
        injection_detected = False
        injection_patterns: list[str] = []
        if injection_enabled:
            injection_detected, injection_patterns = self.injection_detector.detect(
                sanitized
            )
            if injection_detected:
                logger.warning(
                    "Prompt injection detected — %d pattern(s) matched: %s",
                    len(injection_patterns),
                    injection_patterns,
                )

        # --- Jailbreak ---
        jailbreak_detected = False
        jailbreak_patterns: list[str] = []
        if jailbreak_enabled:
            jailbreak_detected, jailbreak_patterns = self.jailbreak_detector.detect(
                sanitized
            )
            if jailbreak_detected:
                logger.warning(
                    "Jailbreak attempt detected — %d pattern(s) matched: %s",
                    len(jailbreak_patterns),
                    jailbreak_patterns,
                )

        # --- Risk score ---
        risk_score = self.injection_detector.get_risk_score(sanitized)
        if jailbreak_detected:
            risk_score = max(risk_score, 0.9)

        # --- Block decision ---
        passed = True
        blocked_reason: str | None = None
        if injection_detected:
            passed = False
            blocked_reason = "Prompt injection attempt detected"
        elif jailbreak_detected:
            passed = False
            blocked_reason = "Jailbreak attempt detected"

        # --- Mask secrets in the sanitized output for downstream safety ---
        sanitized = self.secret_protector.mask_secrets(sanitized)

        if passed:
            logger.info("Security check passed (risk_score=%.2f)", risk_score)

        return SecurityCheckResult(
            passed=passed,
            injection_detected=injection_detected,
            jailbreak_detected=jailbreak_detected,
            risk_score=risk_score,
            blocked_reason=blocked_reason,
            sanitized_content=sanitized,
        )
