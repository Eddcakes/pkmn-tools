---
mode: agent
model: Claude Sonnet 4.5
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

- Investigate and implement a matchup chart feature.
- Investigate if the matchup chart should be a table or a graphical chart.
- Update the matchup-records/page.tsx file in the Next.js application add a matchup chart.
- The chart should display win rates between different archetypes based on the matchup records stored in the application.
- A win counts as 1 point, a loss and tie as 0 points.

# Outcome

- A matchup chart table that displays the win rates between different archetypes. For example:
  | | Garde | Pult | Bolt |
  |-------|-------|------|------|
  | Garde | 1 | 0.66 | 0.33 |
  | Pult | 0.33 | 0.66 | 0.33 |
  | Bolt | 1 | 0.33 | 0.66 |
  Would be generated from the following records
  Garde win Garde
  Garde win Pult
  Garde loss Bolt
  Garde win Garde
  Garde loss Pult
  Garde loss Bolt
  Garde win Garde
  Garde win Pult
  Garde win Bolt
  Pult loss Garde
  Pult win Pult
  Pult loss Bolt
  Pult tie Garde
  Pult win Pult
  Pult win Bolt
  Pult win Garde
  Pult loss Pult
  Pult tie Bolt
  Bolt win Garde
  Bolt loss Pult
  Bolt win Bolt
  Bolt win Garde
  Bolt tie Pult
  Bolt win Bolt
  Bolt win Garde
  Bolt win Pult
  Bolt loss Bolt

- The chart should be dynamically generated based on the matchup records stored in the application.
- The chart should be styled in a similar way to the comparison table page with the highlight differences in win rates using colours (e.g., green for higher win rates, red for lower win rates).
