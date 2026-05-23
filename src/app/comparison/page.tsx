"use client";

import { useState } from "react";
import { Alert, Card, Link } from "@/components";
import { PkmnSelector } from "../../components/PkmnSelector";
import { Button } from "../../components/Button";
import { ComparisonTable } from "../../features/ComparisonTable";
import { LoadDeckModal } from "../../features/LoadDeckModal";
import { SaveDeckModal } from "../../features/SaveDeckModal";
import type { SavedDeck } from "../../utils/savedDecks";

const MAX_DECKS = 6;

interface DeckEntry {
  id: string;
  label: string;
  deckList: string;
  primaryPokemon: string;
  secondaryPokemon: string;
}

interface ParsedCard {
  name: string;
  setCode: string;
  number: string;
  count: number;
  category: string;
}

// Define valid category names
const VALID_CATEGORIES = ["Pokémon", "Trainer", "Energy"];

function parseDeckList(deckListText: string): ParsedCard[] {
  const lines = deckListText.split("\n");
  const cards: ParsedCard[] = [];
  let currentSection = "";
  let pendingLine = "";

  for (let i = 0; i < lines.length; i++) {
    const trimmedLine = lines[i].trim();

    // Skip empty lines
    if (!trimmedLine) {
      pendingLine = "";
      continue;
    }

    // Combine with pending line if exists
    const fullLine = pendingLine
      ? `${pendingLine} ${trimmedLine}`
      : trimmedLine;

    // Check for section headers - handle both "Pokémon:" and "Pokémon: 16" formats
    // Only treat as section header if it matches a known category
    if (fullLine.includes(":")) {
      const sectionName = fullLine.split(":")[0].trim();
      let isValidSection = false;

      // Normalize section names
      if (
        sectionName.toLowerCase().includes("pokémon") ||
        sectionName.toLowerCase().includes("pokemon")
      ) {
        currentSection = "Pokémon";
        isValidSection = true;
      } else if (sectionName.toLowerCase().includes("trainer")) {
        currentSection = "Trainer";
        isValidSection = true;
      } else if (sectionName.toLowerCase().includes("energy")) {
        currentSection = "Energy";
        isValidSection = true;
      }

      if (isValidSection) {
        pendingLine = "";
        continue;
      }
    }

    // Parse format: "4 Munkidori TWM 95"
    const match = fullLine.match(/^(\d+)\s+(.+?)\s+([A-Z]+)\s+(\d+)$/);
    if (match) {
      const [, countStr, name, setCode, number] = match;
      cards.push({
        name: name.trim(),
        setCode,
        number,
        count: parseInt(countStr, 10),
        category: currentSection
      });
      pendingLine = ""; // Clear pending line after successful parse
    } else {
      // Line doesn't match pattern, save it as pending for next iteration
      pendingLine = fullLine;
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

      let comparisonCard = cardMap.get(cardId);

      if (!comparisonCard) {
        comparisonCard = {
          cardId,
          displayName: `${card.name} (${card.setCode} ${card.number})`,
          category: card.category,
          counts: {}
        };
        cardMap.set(cardId, comparisonCard);
      }

      comparisonCard.counts[deck.id] = card.count;
    }
  }

  return Array.from(cardMap.values()).sort((a, b) => {
    // First sort by category
    const aCategoryIndex = VALID_CATEGORIES.indexOf(a.category);
    const bCategoryIndex = VALID_CATEGORIES.indexOf(b.category);

    if (aCategoryIndex !== bCategoryIndex) {
      return aCategoryIndex - bCategoryIndex;
    }

    // Then sort alphabetically within the same category
    return a.displayName.localeCompare(b.displayName);
  });
}

export default function ComparisonPage() {
  const [decks, setDecks] = useState<DeckEntry[]>([
    {
      id: "1",
      label: "Deck 1",
      deckList: "",
      primaryPokemon: "",
      secondaryPokemon: ""
    }
  ]);
  const [comparisonData, setComparisonData] = useState<ComparisonCard[]>([]);
  const [loadModalOpen, setLoadModalOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);

  const addDeck = () => {
    if (decks.length < MAX_DECKS) {
      const newId = (
        Math.max(...decks.map((d) => parseInt(d.id, 10))) + 1
      ).toString();
      setDecks([
        ...decks,
        {
          id: newId,
          label: `Deck ${newId}`,
          deckList: "",
          primaryPokemon: "",
          secondaryPokemon: ""
        }
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
    field: "label" | "deckList" | "primaryPokemon" | "secondaryPokemon",
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
      setDecks(
        decks.map((d) =>
          d.id === activeDeckId
            ? {
                ...d,
                label: savedDeck.label,
                deckList: savedDeck.deckList,
                primaryPokemon: savedDeck.primaryPokemon ?? "",
                secondaryPokemon: savedDeck.secondaryPokemon ?? ""
              }
            : d
        )
      );
    }
  };

  const handleDeckPokemonChange = (
    deckId: string,
    value: string,
    name?: string
  ) => {
    if (name === "primaryPokemon") {
      updateDeck(deckId, "primaryPokemon", value);
      return;
    }

    if (name === "secondaryPokemon") {
      updateDeck(deckId, "secondaryPokemon", value);
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Pokémon Deck Comparison
        </h1>
      </div>

      <Alert className="mb-4">
        It is recommended either copy lists directly from{" "}
        <Link href="https://limitlesstcg.com/decks">Limitless</Link> or use the
        Limitless tool to{" "}
        <Link href="https://limitlesstcg.com/tools/imggen">
          reset cards to regular versions
        </Link>
      </Alert>

      <div className="flex flex-col gap-8">
        {/* Deck Input Section */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {decks.map((deck) => (
              <Card key={deck.id}>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor={`deckLabel-${deck.id}`}
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Deck Label
                    </label>
                    <input
                      id={`deckLabel-${deck.id}`}
                      type="text"
                      value={deck.label}
                      onChange={(e) =>
                        updateDeck(deck.id, "label", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="grid gap-2">
                    <p className="block text-sm font-medium text-gray-700">
                      Deck Archetype
                    </p>
                    <PkmnSelector
                      id={`deck-primary-pokemon-${deck.id}`}
                      name="primaryPokemon"
                      value={deck.primaryPokemon}
                      onChange={(value, name) =>
                        handleDeckPokemonChange(deck.id, value, name)
                      }
                      label="Primary Pokemon"
                      hideLabel
                      placeholder="Choose primary Pokemon..."
                      required
                    />
                    <PkmnSelector
                      id={`deck-secondary-pokemon-${deck.id}`}
                      name="secondaryPokemon"
                      value={deck.secondaryPokemon}
                      onChange={(value, name) =>
                        handleDeckPokemonChange(deck.id, value, name)
                      }
                      label="Secondary Pokemon (Optional)"
                      hideLabel
                      placeholder="Choose secondary Pokemon..."
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`deckList-${deck.id}`}
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Deck List
                    </label>
                    <textarea
                      id={`deckList-${deck.id}`}
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

            {decks.length < MAX_DECKS && (
              <Card className="flex flex-col items-center justify-center min-h-[400px] bg-gray-50">
                <div className="text-center space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      Add Another Deck
                    </h3>
                    <p className="text-sm text-gray-500">
                      Compare up to {MAX_DECKS} decks side by side
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Button onClick={addDeck}>
                      Add Deck ({decks.length}/{MAX_DECKS})
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        <div className="flex justify-center">
          <Button onClick={updateComparison}>Update Comparison</Button>
        </div>

        {comparisonData.length > 0 && (
          <ComparisonTable comparisonData={comparisonData} decks={decks} />
        )}
      </div>

      {/* Modals */}
      <LoadDeckModal
        key={
          loadModalOpen
            ? `load-deck-${activeDeckId ?? "none"}`
            : "load-deck-closed"
        }
        isOpen={loadModalOpen}
        onClose={() => setLoadModalOpen(false)}
        onLoadDeck={handleLoadDeck}
      />

      <SaveDeckModal
        key={
          saveModalOpen
            ? `save-deck-${activeDeckId ?? "none"}`
            : "save-deck-closed"
        }
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
            ? (() => {
                const activeDeck = decks.find((d) => d.id === activeDeckId);
                if (!activeDeck?.primaryPokemon) {
                  return "";
                }

                return activeDeck.secondaryPokemon
                  ? `#${activeDeck.primaryPokemon}#${activeDeck.secondaryPokemon}`
                  : `#${activeDeck.primaryPokemon}`;
              })()
            : ""
        }
      />
    </div>
  );
}
