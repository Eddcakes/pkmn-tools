"use client";

import { useState } from "react";
import { Button } from "../../components/Button";
import { LoadDeckModal } from "../../features/LoadDeckModal";
import { SaveDeckModal } from "../../features/SaveDeckModal";
import { ComparisonTable } from "../../features/ComparisonTable";
import type { SavedDeck } from "../../utils/savedDecks";
import { Link, Card } from "@/components";

const MAX_DECKS = 6;

interface DeckEntry {
  id: string;
  label: string;
  deckList: string;
  archetype: string;
}

interface ParsedCard {
  name: string;
  setCode: string;
  number: string;
  count: number;
  category: string;
}

interface ComparisonCard {
  cardId: string;
  displayName: string;
  category: string;
  counts: Record<string, number>;
}

function parseDeckList(deckListText: string): ParsedCard[] {
  const lines = deckListText.split("\n");
  const cards: ParsedCard[] = [];
  let currentSection = "";

  for (const line of lines) {
    const trimmedLine = line.trim();
    // Skip empty lines
    if (!trimmedLine) {
      continue;
    }

    // Check for section headers - handle both "Pokémon:" and "Pokémon: 16" formats
    if (trimmedLine.includes(":")) {
      const sectionName = trimmedLine.split(":")[0].trim();
      // Normalize section names
      if (
        sectionName.toLowerCase().includes("pokémon") ||
        sectionName.toLowerCase().includes("pokemon")
      ) {
        currentSection = "Pokémon";
      } else if (sectionName.toLowerCase().includes("trainer")) {
        currentSection = "Trainer";
      } else if (sectionName.toLowerCase().includes("energy")) {
        currentSection = "Energy";
      }
      continue;
    }

    // Parse format: "4 Munkidori TWM 95"
    const match = trimmedLine.match(/^(\d+)\s+(.+?)\s+([A-Z]+)\s+(\d+)$/);
    if (match) {
      const [, countStr, name, setCode, number] = match;
      cards.push({
        name: name.trim(),
        setCode,
        number,
        count: parseInt(countStr, 10),
        category: currentSection,
      });
    }
  }

  return cards;
}

interface ComparisonCard {
  cardId: string;
  displayName: string;
  category: string;
  counts: Record<string, number>;
}

function createComparisonData(decks: DeckEntry[]): ComparisonCard[] {
  const cardMap = new Map<string, ComparisonCard>();

  for (const deck of decks) {
    const parsedCards = parseDeckList(deck.deckList);

    for (const card of parsedCards) {
      const cardId = `${card.name} ${card.setCode} ${card.number}`;

      if (!cardMap.has(cardId)) {
        cardMap.set(cardId, {
          cardId,
          displayName: `${card.name} (${card.setCode} ${card.number})`,
          category: card.category,
          counts: {},
        });
      }

      const comparisonCard = cardMap.get(cardId)!;
      comparisonCard.counts[deck.id] = card.count;
    }
  }

  // Define category order
  const categoryOrder = ["Pokémon", "Trainer", "Energy"];

  return Array.from(cardMap.values()).sort((a, b) => {
    // First sort by category
    const aCategoryIndex = categoryOrder.indexOf(a.category);
    const bCategoryIndex = categoryOrder.indexOf(b.category);

    if (aCategoryIndex !== bCategoryIndex) {
      return aCategoryIndex - bCategoryIndex;
    }

    // Then sort alphabetically within the same category
    return a.displayName.localeCompare(b.displayName);
  });
}

export default function ComparisonPage() {
  const [decks, setDecks] = useState<DeckEntry[]>([
    { id: "1", label: "Deck 1", deckList: "", archetype: "" },
  ]);
  const [comparisonData, setComparisonData] = useState<ComparisonCard[]>([]);
  const [loadModalOpen, setLoadModalOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);

  const addDeck = () => {
    if (decks.length < MAX_DECKS) {
      const newId = (
        Math.max(...decks.map((d) => parseInt(d.id))) + 1
      ).toString();
      setDecks([
        ...decks,
        { id: newId, label: `Deck ${newId}`, deckList: "", archetype: "" },
      ]);
    }
  };

  const removeDeck = (deckId: string) => {
    if (decks.length > 1) {
      setDecks(decks.filter((d) => d.id !== deckId));
    }
  };

  const updateDeck = (
    deckId: string,
    field: "label" | "deckList" | "archetype",
    value: string
  ) => {
    setDecks(
      decks.map((d) => (d.id === deckId ? { ...d, [field]: value } : d))
    );
  };

  const updateComparison = () => {
    const data = createComparisonData(decks);
    setComparisonData(data);
  };

  const handleLoadDeck = (savedDeck: SavedDeck) => {
    if (activeDeckId) {
      const taggedArchetype = savedDeck.archetype
        ? savedDeck.archetype.map((tag) => `#${tag}`).join(" ")
        : "";
      setDecks(
        decks.map((d) =>
          d.id === activeDeckId
            ? {
                ...d,
                label: savedDeck.label,
                deckList: savedDeck.deckList,
                archetype: taggedArchetype,
              }
            : d
        )
      );
    }
  };

  const handleSaveDeck = (deckId: string) => {
    const deck = decks.find((d) => d.id === deckId);
    if (deck) {
      setActiveDeckId(deckId);
      setSaveModalOpen(true);
    }
  };

  const handleLoadDeckClick = (deckId: string) => {
    setActiveDeckId(deckId);
    setLoadModalOpen(true);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Pokémon Deck Comparison
        </h1>
        <div className="flex gap-4">
          <Link href="/" variant="button" buttonVariant="secondary">
            Home
          </Link>
          <Link href="/saved-decks" variant="button" buttonVariant="secondary">
            Saved Decks
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {/* Deck Input Section */}
        <div>
          <div className="flex flex-row gap-4 mb-6 flex-wrap">
            <Button onClick={updateComparison}>Update Comparison</Button>
            <Button
              onClick={addDeck}
              disabled={decks.length >= MAX_DECKS}
              variant="secondary"
            >
              Add Deck ({decks.length}/{MAX_DECKS})
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {decks.map((deck) => (
              <Card key={deck.id}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deck Label
                    </label>
                    <input
                      type="text"
                      value={deck.label}
                      onChange={(e) =>
                        updateDeck(deck.id, "label", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edit-deck-archetype"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Deck Archetype
                    </label>
                    <input
                      id="edit-deck-archetype"
                      type="text"
                      value={deck.archetype}
                      onChange={(e) =>
                        updateDeck(deck.id, "archetype", e.target.value)
                      }
                      placeholder="Seperate #, e.g. '#gholdengo #joltik box'"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deck List
                    </label>
                    <textarea
                      value={deck.deckList}
                      onChange={(e) =>
                        updateDeck(deck.id, "deckList", e.target.value)
                      }
                      rows={12}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      placeholder={`Paste your deck list here...

Example format:
Pokémon: 16
4 Munkidori TWM 95
3 Ralts SVI 84
2 Kirlia SVI 85

Trainer: 33
4 Professor's Research JTG 155
4 Iono PAL 185

Energy: 11
7 Psychic Energy SVE 13`}
                    />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleLoadDeckClick(deck.id)}
                    >
                      Load Deck
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleSaveDeck(deck.id)}
                      disabled={!deck.deckList.trim()}
                    >
                      Save Deck
                    </Button>
                  </div>
                </div>
                {decks.length > 1 && (
                  <Button
                    onClick={() => removeDeck(deck.id)}
                    variant="danger"
                    className="mt-4"
                  >
                    Remove Deck
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Comparison Table */}
        {comparisonData.length > 0 && (
          <ComparisonTable comparisonData={comparisonData} decks={decks} />
        )}
      </div>

      {/* Modals */}
      <LoadDeckModal
        isOpen={loadModalOpen}
        onClose={() => setLoadModalOpen(false)}
        onLoadDeck={handleLoadDeck}
      />

      <SaveDeckModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        deckList={
          activeDeckId
            ? decks.find((d) => d.id === activeDeckId)?.deckList || ""
            : ""
        }
        initialLabel={
          activeDeckId
            ? decks.find((d) => d.id === activeDeckId)?.label || ""
            : ""
        }
        archetype={
          activeDeckId
            ? decks.find((d) => d.id === activeDeckId)?.archetype || ""
            : ""
        }
      />
    </div>
  );
}
