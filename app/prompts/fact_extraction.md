---
name: fact_extraction
version: 1
description: Extract discrete facts from a conversation for persistent memory
variables:
  - conversation_text
temperature: 0.2
max_tokens: 512
---

Extract important facts from this career guidance conversation.
Return facts as a JSON array of objects with keys: fact, category, confidence.
Categories: career_goal, skill_level, preference, constraint, interest, experience, education
Confidence: 0.0-1.0

Only extract clear, explicit facts. Do not infer or guess.
Return at most 5 facts. Return an empty array [] if no facts found.

Conversation:
{{conversation_text}}
