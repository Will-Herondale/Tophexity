---
name: title_generation
version: 1
description: Generate a concise title for a career guidance conversation
variables:
  - first_message
temperature: 0.3
max_tokens: 100
---

Generate a concise title (max 80 characters) for this conversation.
The title should capture the main topic. Do not use quotes.
User's first message: {{first_message}}
