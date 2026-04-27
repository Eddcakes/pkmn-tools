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

## Google Login Setup

1. Create a Google OAuth 2.0 Client ID (Web application) in Google Cloud Console.
2. Add this redirect URI:
	- `<NEXT_PUBLIC_CONVEX_SITE_URL>/api/auth/callback/google`
3. Add these variables to `.env.local`:

```bash
CONVEX_SITE_URL=https://your-project.convex.site
NEXT_PUBLIC_CONVEX_SITE_URL=https://your-project.convex.site
SITE_URL=http://localhost:3000
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
```

4. Restart your local servers after updating env vars:

```bash
npm run dev
```

If your Convex functions run against a hosted deployment, set the same auth vars in Convex too:

```bash
npx convex env set AUTH_GOOGLE_ID your-google-client-id
npx convex env set AUTH_GOOGLE_SECRET your-google-client-secret
npx convex env set SITE_URL http://localhost:3000
```

`CONVEX_SITE_URL` is a built-in Convex variable and is not set manually via `convex env set`.

### experimental 

Recording gameplay for review, using shareX it's easy to setup automatic naming of the files:

file name: `%y-%mo-%d__T%h%mi%s.mp4`

We then can link up with the notes from Matchup Records pretty loosly as it is unlikely we will save at the same second/even minute, but should be easy to find from there.

### Look into expanding localstorage

We might need to start using a real database or convex 