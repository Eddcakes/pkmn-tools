# Pokémon TCG Tools

A collection of tools for Pokémon Trading Card Game players to track matchups, compare decks, and save deck lists.

## Features

- **Deck Comparison**: Compare multiple Pokémon TCG deck lists side-by-side
- **Matchup Records**: Track your game results against different archetypes
- **Saved Decks**: Import and save deck lists for quick access

## Usage

Visit [https://eddcakes.github.io/pkmn-tools/](https://eddcakes.github.io/pkmn-tools/)

### Importing Decks
Paste your deck list in PTCGL format (e.g., "4 Pikachu ex MEW 123")

## Development

```bash
npm install
npm run dev
```

### experimental 

Recording gameplay for review, using shareX it's easy to setup automatic naming of the files:

file name: `%y-%mo-%d__T%h%mi%s.mp4`

We then can link up with the notes from Matchup Records pretty loosly as it is unlikely we will save at the same second/even minute, but should be easy to find from there.

### Look into expanding localstorage

We might need to start using a real database or convex 