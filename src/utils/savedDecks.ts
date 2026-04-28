export interface SavedDeck {
  id: string;
  label: string;
  deckList: string;
  archetype?: string[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "pokemon-saved-decks";

function normalizeSavedDeck(rawDeck: unknown): SavedDeck | null {
  if (!rawDeck || typeof rawDeck !== "object") {
    return null;
  }

  const deck = rawDeck as Record<string, unknown>;

  if (
    typeof deck.id !== "string" ||
    typeof deck.label !== "string" ||
    typeof deck.deckList !== "string" ||
    typeof deck.createdAt !== "string"
  ) {
    return null;
  }

  const updatedAt =
    typeof deck.updatedAt === "string" ? deck.updatedAt : deck.createdAt;
  const rawArchetype = Array.isArray(deck.archetype)
    ? deck.archetype
    : Array.isArray(deck.archetypes)
      ? deck.archetypes
      : undefined;
  const archetype = rawArchetype?.filter(
    (value): value is string => typeof value === "string"
  );

  return {
    id: deck.id,
    label: deck.label,
    deckList: deck.deckList,
    ...(archetype && archetype.length > 0 ? { archetype } : {}),
    createdAt: deck.createdAt,
    updatedAt
  };
}

function normalizeSavedDecks(rawDecks: unknown): SavedDeck[] {
  if (!Array.isArray(rawDecks)) {
    return [];
  }

  return rawDecks
    .map(normalizeSavedDeck)
    .filter((deck): deck is SavedDeck => deck !== null);
}

export function getSavedDecks(): SavedDeck[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsedDecks = stored ? JSON.parse(stored) : [];
    const decks = normalizeSavedDecks(parsedDecks);

    if (stored && JSON.stringify(parsedDecks) !== JSON.stringify(decks)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
    }

    // Sort by updatedAt descending (most recently updated first)
    return decks.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } catch (error) {
    console.error("Error loading saved decks:", error);
    return [];
  }
}

export function saveDeck(
  label: string,
  deckList: string,
  archetype?: string[]
): SavedDeck {
  const deck: SavedDeck = {
    id: generateId(),
    label,
    deckList,
    ...(archetype && archetype.length > 0 && { archetype }),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const decks = getSavedDecks();
  decks.push(deck);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
  } catch (error) {
    console.error("Error saving deck:", error);
    throw new Error("Failed to save deck to local storage");
  }

  return deck;
}

export function updateSavedDeck(
  id: string,
  label: string,
  deckList: string,
  archetype?: string[]
): SavedDeck | null {
  const decks = getSavedDecks();
  const deckIndex = decks.findIndex((deck) => deck.id === id);

  if (deckIndex === -1) return null;

  decks[deckIndex] = {
    ...decks[deckIndex],
    label,
    deckList,
    ...(archetype !== undefined && { archetype }),
    updatedAt: new Date().toISOString()
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
  } catch (error) {
    console.error("Error updating deck:", error);
    throw new Error("Failed to update deck in local storage");
  }

  return decks[deckIndex];
}

export function deleteSavedDeck(id: string): boolean {
  const decks = getSavedDecks();
  const filteredDecks = decks.filter((deck) => deck.id !== id);

  if (filteredDecks.length === decks.length) {
    return false; // Deck not found
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredDecks));
    return true;
  } catch (error) {
    console.error("Error deleting deck:", error);
    throw new Error("Failed to delete deck from local storage");
  }
}

export function getSavedDeckById(id: string): SavedDeck | null {
  const decks = getSavedDecks();
  return decks.find((deck) => deck.id === id) || null;
}

export function exportDeckToClipboard(deckList: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    return navigator.clipboard.writeText(deckList);
  } else {
    // Fallback for older browsers
    return new Promise((resolve, reject) => {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = deckList;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
