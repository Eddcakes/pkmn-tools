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

- Update the comparrison page in the Next.js application so the user can save lists of Pokémon card decks.
- On the comparison page for each deck we add we should have a button to load a saved deck.
- The data should be saved to local storage so it persists across sessions.
- Create a new page in the Next.js application so the user can view and manage their saved decks.
- We should also be able to import a deck by pasting in the expected format for the deck list and giving it a label.

# Outcome

- The saved decks page should list all the saved decks with their labels.
- We should be able to export the saved deck in the expected format for the deck list which can be found in the [deck format documentation](../../data/limitless.export.txt).
- The export should be done by copying the deck to the clipboard.
- The user should be able to delete a saved deck, removing it from local storage.
