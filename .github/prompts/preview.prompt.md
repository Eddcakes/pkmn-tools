---
mode: agent
model: Claude Sonnet 4
description: A prompt file for updating an existing page in a React and TypeScript project.
---

# Instructions

- Before start planning or acting you MUST refer to the (instructions)[../instructions/general.md].
- Always respond in a clear and concise manner.
- Use markdown formatting for code snippets and lists.
- When providing code examples, ensure they are relevant to the context of the repository.
- When writing comments use gb english spelling.
- If you encounter a task that requires external information, ask for clarification or additional details.

# Task

- Update the comparrison table page in the Next.js application so the user can see a preview of the card on hover of the card name.
- The preview should be a image of the card in a popover or tooltip.
- Consider if we should use a floating-ui library for the popover or tooltip or if we should implement it ourselves.

# Outcome

- The image should be fetched from the URL constructed using the set code and number in parentheses for example for the entry '2 Gardevoir ex SVI 86' the URL would be: https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/SVI/SVI_86_R_EN_LG.png
