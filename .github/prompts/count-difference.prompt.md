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

- Update the comparrison table page in the Next.js application so the user can see at a glance how card counts differ between multiple deck lists.

# Outcome

- The table should highlight cells in red for counts lower than the average, green for counts higher than the average, and no background for average counts.
- This should be an optional feature that can be toggled on and off by the user.
- Additionally, implement a feature to hide rows where the card counts are the same across all lists, also as an optional toggle.
- Ensure that these features are user-friendly and enhance the usability of the comparison table.
- We should have 5 levels of colours, red, light red, no colour, light green, green.
