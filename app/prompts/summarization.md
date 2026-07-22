---
name: summarization
version: 1
description: Summarize a conversation for persistent memory storage
variables:
  - conversation_text
temperature: 0.3
max_tokens: 1024
---

Summarize the following career guidance conversation.
Focus on:
- Key topics discussed
- User's goals, constraints, and preferences
- Decisions made or recommendations given
- Action items or next steps

Keep the summary under 500 words. Be factual and concise.
Do not include filler or greetings.

Conversation:
{{conversation_text}}
