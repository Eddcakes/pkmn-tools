---
mode: agent
model: Claude Sonnet 4.5
description: A prompt file for initialising a new page in a React and TypeScript project.
---

# Instructions

- Before start planning or acting you MUST refer to the (instructions)[../instructions/general.md].
- Always respond in a clear and concise manner.
- Use markdown formatting for code snippets and lists.
- When providing code examples, ensure they are relevant to the context of the repository.
- When writing comments use gb english spelling.
- If you encounter a task that requires external information, ask for clarification or additional details.

# Task

- Create a new page in the application that allows users to add records to a matchup database.
- The user should be able to select their deck archetype from a list.
- The page should include a form for entering matchup details such as opponent archetype, win/loss result, and notes.
-

# Outcome

- A new page is created with a form for adding matchup records.
- The form includes a dropdown for selecting the user's deck archetype.
- The form includes fields for entering opponent archetype, win/loss result, and notes.
- The page is integrated into the existing application routing.
- A new link on the homepage navigates to the matchup record page.
- The records are saved to the matchup database (localStorage) upon submission.
- The records will be used to create a matchup chart in a future task.
