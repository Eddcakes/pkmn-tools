---
mode: agent
model: Claude Sonnet 4
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

- Create a new page in the Next.js application so the user can compare lists of Pokémon card decks.
- The page should allow users label and paste in their deck in text format.
- The user controls here should be a text box for the label, a larger text area for the deck list and a button to update the comparison if any changes are made.
- We should allow users to keep adding more decks to compare with a limit configured in a constant.
- We should have a button for the user to be able to remove a deck from the comparison.
- The expected format for the deck list can be found in the [deck format documentation](../../data/limitless.export.txt).

# Outcome

- We should be able to resize the textarea for the deck lists so it's easier to see more of the list.
- The comparison should show a table with all the unique cards in the decks and how many copies of each card are in each deck.
- The table should have a header row with the deck labels and a first column with the card names.
- The card names should be the card name followed by the set code and number in parentheses for example the entry '2 Gardevoir ex SVI 86' should appear as 'Gardevoir ex SVI 86', and the number of copies in each deck should be shown in the corresponding cell.
- If a card is not present in a deck, the corresponding cell should be blank.
- The table should be sortable by card name and by the number of copies in each deck.
