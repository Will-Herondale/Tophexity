"""Tests for the AI Conversation Platform — memory, summarizer, fact extraction."""

from unittest.mock import AsyncMock, patch

import pytest


class TestSummarizer:
    """Tests for summarizer module."""

    @pytest.mark.anyio
    async def test_summarize_messages_empty(self):
        from app.services.ai.summarizer import summarize_messages
        result = await summarize_messages([], user_id="test")
        assert result == ""

    @pytest.mark.anyio
    async def test_summarize_delta_empty(self):
        from app.services.ai.summarizer import summarize_delta
        result = await summarize_delta([], user_id="test")
        assert result == ""

    def test_validate_summary_empty(self):
        from app.services.ai.summarizer import validate_summary
        assert validate_summary("") is None
        assert validate_summary("  ") is None
        assert validate_summary(None) is None

    def test_validate_summary_too_long(self):
        from app.services.ai.summarizer import validate_summary
        from app.core.config import get_settings
        settings = get_settings()
        long_summary = "x" * (settings.AI_MAX_SUMMARY_LENGTH + 100)
        result = validate_summary(long_summary)
        assert result is not None
        assert len(result) <= settings.AI_MAX_SUMMARY_LENGTH

    def test_validate_summary_dedup(self):
        from app.services.ai.summarizer import validate_summary
        assert validate_summary("same", existing="same") is None
        assert validate_summary("different", existing="same") == "different"

    def test_merge_summaries(self):
        from app.services.ai.summarizer import merge_summaries
        result = merge_summaries("Part 1", "Part 2")
        assert "Part 1" in result
        assert "Part 2" in result

    def test_merge_summaries_empty_delta(self):
        from app.services.ai.summarizer import merge_summaries
        assert merge_summaries("existing", "") == "existing"

    def test_merge_summaries_empty_existing(self):
        from app.services.ai.summarizer import merge_summaries
        assert merge_summaries("", "delta") == "delta"


class TestFactExtractor:
    """Tests for fact extraction module."""

    def test_dedup_facts(self):
        from app.services.ai.fact_extractor import dedup_facts
        existing = [{"fact": "User likes ML"}]
        new = [{"fact": "User likes ML"}, {"fact": "User has 3 years experience"}]
        result = dedup_facts(existing, new)
        assert len(result) == 1
        assert result[0]["fact"] == "User has 3 years experience"

    def test_dedup_facts_empty(self):
        from app.services.ai.fact_extractor import dedup_facts
        result = dedup_facts([], [{"fact": "New fact"}])
        assert len(result) == 1

    def test_normalize_fact(self):
        from app.services.ai.fact_extractor import _normalize_fact
        result = _normalize_fact({"fact": "test", "category": "interest", "confidence": 0.8})
        assert result["fact"] == "test"
        assert result["category"] == "interest"
        assert result["confidence"] == 0.8
        assert "extracted_at" in result

    def test_normalize_fact_defaults(self):
        from app.services.ai.fact_extractor import _normalize_fact
        result = _normalize_fact({})
        assert result["category"] == "interest"
        assert result["confidence"] == 0.5

    @pytest.mark.anyio
    async def test_extract_facts_too_few_messages(self):
        from app.services.ai.fact_extractor import extract_facts
        result = await extract_facts([{"role": "user", "content": "Hi"}])
        assert result == []

    @pytest.mark.anyio
    async def test_extract_facts_empty(self):
        from app.services.ai.fact_extractor import extract_facts
        result = await extract_facts([])
        assert result == []


class TestConversationMemory:
    """Tests for ConversationMemory."""

    def test_add_message(self):
        from app.services.ai.memory import ConversationMemory
        mem = ConversationMemory()
        mem.add_message("user", "Hello")
        assert len(mem.recent_messages) == 1
        assert mem.recent_messages[0]["role"] == "user"

    def test_trim(self):
        from app.services.ai.memory import ConversationMemory
        mem = ConversationMemory(max_recent=3)
        for i in range(5):
            mem.add_message("user", f"msg {i}")
        trimmed = mem.trim()
        assert len(trimmed) == 2
        assert len(mem.recent_messages) == 3

    def test_needs_summarization(self):
        from app.services.ai.memory import ConversationMemory
        mem = ConversationMemory()
        for i in range(25):
            mem.add_message("user", f"msg {i}")
        assert mem.needs_summarization(threshold=20) is True
        assert mem.needs_summarization(threshold=30) is False

    def test_build_messages_for_ai(self):
        from app.services.ai.memory import ConversationMemory
        mem = ConversationMemory(recent_messages=[
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi!"},
        ], summary="Earlier discussion about ML")
        result = mem.build_messages_for_ai("You are a career advisor.")
        assert len(result) == 4  # system + summary + 2 messages
        assert result[0]["role"] == "system"
        assert "career advisor" in result[0]["content"]
        assert "Earlier discussion" in result[1]["content"]

    def test_build_messages_for_ai_no_summary(self):
        from app.services.ai.memory import ConversationMemory
        mem = ConversationMemory(recent_messages=[
            {"role": "user", "content": "Hello"},
        ])
        result = mem.build_messages_for_ai("System prompt")
        assert len(result) == 2  # system + user message

    def test_clear(self):
        from app.services.ai.memory import ConversationMemory
        mem = ConversationMemory(recent_messages=[{"role": "user", "content": "Hi"}], summary="test")
        mem.clear()
        assert len(mem.recent_messages) == 0
        assert mem.summary is None

    def test_get_message_count(self):
        from app.services.ai.memory import ConversationMemory
        mem = ConversationMemory(recent_messages=[
            {"role": "user", "content": "a"},
            {"role": "assistant", "content": "b"},
        ])
        assert mem.get_message_count() == 2


class TestPromptLoader:
    """Tests for enhanced prompt loader."""

    def test_list_prompts(self):
        from app.services.ai.prompt_loader import list_prompts
        prompts = list_prompts()
        assert "system" in prompts
        assert "chat" in prompts
        assert "summarization" in prompts
        assert "title_generation" in prompts
        assert "fact_extraction" in prompts

    def test_get_prompt_metadata(self):
        from app.services.ai.prompt_loader import get_prompt_metadata
        meta = get_prompt_metadata("title_generation")
        assert meta["name"] == "title_generation"
        assert meta["version"] in ("1", 1)
        assert "char_count" in meta
        assert "estimated_tokens" in meta

    def test_render_prompt(self):
        from app.services.ai.prompt_loader import render_prompt
        result = render_prompt("title_generation", {"first_message": "I want to switch to ML"})
        assert "first_message" not in result
        assert "I want to switch to ML" in result

    def test_render_prompt_no_variables(self):
        from app.services.ai.prompt_loader import render_prompt
        result = render_prompt("chat")
        assert len(result) > 0

    def test_prompt_exists(self):
        from app.services.ai.prompt_loader import prompt_exists
        assert prompt_exists("system") is True
        assert prompt_exists("nonexistent") is False
