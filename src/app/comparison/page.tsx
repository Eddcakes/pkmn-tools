"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "../../components/Button";
import { LoadDeckModal } from "../../features/LoadDeckModal";
import { SaveDeckModal } from "../../features/SaveDeckModal";
import { CardPreview } from "../../components/CardPreview";
import type { SavedDeck } from "../../utils/savedDecks";

const MAX_DECKS = 6;

// Color configuration for count differences
const COUNT_COLORS = {
  muchLower: "bg-rose-100",
  lower: "bg-rose-50",
  average: "",
  higher: "bg-emerald-50",
  muchHigher: "bg-emerald-100",
} as const;

interface DeckEntry {
  id: string;
  label: string;
  deckList: string;
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

function calculateCountStatistics(counts: number[]): {
  average: number;
  min: number;
  max: number;
} {
  if (counts.length === 0) {
    return { average: 0, min: 0, max: 0 };
  }

  // Include all counts (including zeros) for proper comparison
  const sum = counts.reduce((acc, count) => acc + count, 0);
  const average = sum / counts.length;
  const min = Math.min(...counts);
  const max = Math.max(...counts);

  return { average, min, max };
}

function getCountColorClass(
  count: number,
  statistics: { average: number; min: number; max: number }
): string {
  if (count === 0 || statistics.average === 0) {
    return "";
  }

  const { average, min, max } = statistics;
  const range = max - min;

  // If all counts are the same, no colouring
  if (range === 0) {
    return "";
  }

  const deviation = count - average;
  const normalizedDeviation = deviation / (range / 2); // Normalize to -1 to 1 range

  if (normalizedDeviation <= -0.6) {
    return COUNT_COLORS.muchLower;
  } else if (normalizedDeviation <= -0.2) {
    return COUNT_COLORS.lower;
  } else if (normalizedDeviation >= 0.6) {
    return COUNT_COLORS.muchHigher;
  } else if (normalizedDeviation >= 0.2) {
    return COUNT_COLORS.higher;
  }

  return COUNT_COLORS.average;
}

function areCountsIdentical(
  comparisonCard: ComparisonCard,
  deckIds: string[]
): boolean {
  const counts = deckIds.map((deckId) => comparisonCard.counts[deckId] || 0);
  const firstCount = counts[0];
  return counts.every((count) => count === firstCount);
}

export default function ComparisonPage() {
  const [decks, setDecks] = useState<DeckEntry[]>([
    { id: "1", label: "Deck 1", deckList: "" },
  ]);
  const [comparisonData, setComparisonData] = useState<ComparisonCard[]>([]);
  const [loadModalOpen, setLoadModalOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [highlightDifferences, setHighlightDifferences] = useState(false);
  const [hideIdenticalRows, setHideIdenticalRows] = useState(false);

  const addDeck = () => {
    if (decks.length < MAX_DECKS) {
      const newId = (
        Math.max(...decks.map((d) => parseInt(d.id))) + 1
      ).toString();
      setDecks([...decks, { id: newId, label: `Deck ${newId}`, deckList: "" }]);
    }
  };

  const removeDeck = (deckId: string) => {
    if (decks.length > 1) {
      setDecks(decks.filter((d) => d.id !== deckId));
    }
  };

  const updateDeck = (
    deckId: string,
    field: "label" | "deckList",
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

  // Filter comparison data based on hideIdenticalRows setting
  const filteredComparisonData = hideIdenticalRows
    ? comparisonData.filter(
        (item) =>
          !areCountsIdentical(
            item,
            decks.map((d) => d.id)
          )
      )
    : comparisonData;

  const handleLoadDeck = (savedDeck: SavedDeck) => {
    if (activeDeckId) {
      setDecks(
        decks.map((d) =>
          d.id === activeDeckId
            ? { ...d, label: savedDeck.label, deckList: savedDeck.deckList }
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
          <Link href="/">
            <Button variant="secondary">Home</Button>
          </Link>
          <Link href="/saved-decks">
            <Button variant="secondary">Saved Decks</Button>
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
              <div
                key={deck.id}
                className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
              >
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
              </div>
            ))}
          </div>
        </div>

        {/* Comparison Table */}
        {comparisonData.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Card Comparison
              </h2>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={highlightDifferences}
                    onChange={(e) => setHighlightDifferences(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Highlight Differences
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideIdenticalRows}
                    onChange={(e) => setHideIdenticalRows(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Hide Identical Rows
                  </span>
                </label>
              </div>
            </div>

            {highlightDifferences && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-blue-900">
                    Colour Legend:
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div
                      className={`w-4 h-4 ${COUNT_COLORS.muchLower} rounded border`}
                    ></div>
                    <span className="text-gray-700">Much Lower</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div
                      className={`w-4 h-4 ${COUNT_COLORS.lower} rounded border`}
                    ></div>
                    <span className="text-gray-700">Lower</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-gray-200 rounded border"></div>
                    <span className="text-gray-700">Average</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div
                      className={`w-4 h-4 ${COUNT_COLORS.higher} rounded border`}
                    ></div>
                    <span className="text-gray-700">Higher</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div
                      className={`w-4 h-4 ${COUNT_COLORS.muchHigher} rounded border`}
                    ></div>
                    <span className="text-gray-700">Much Higher</span>
                  </div>
                </div>
              </div>
            )}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                        Card Name
                      </th>
                      {decks.map((deck) => (
                        <th
                          key={deck.id}
                          className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200"
                        >
                          {deck.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredComparisonData.map((item, index) => {
                      // Calculate statistics for this row when highlighting is enabled
                      const deckIds = decks.map((d) => d.id);
                      const counts = deckIds.map(
                        (deckId) => item.counts[deckId] || 0
                      );
                      const statistics = highlightDifferences
                        ? calculateCountStatistics(counts)
                        : null;

                      return (
                        <tr
                          key={item.cardId}
                          className={
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }
                        >
                          <td className="px-6 py-4 text-sm text-gray-900 border-b border-gray-200">
                            <CardPreview cardName={item.displayName}>
                              <span className="hover:text-blue-600 hover:underline transition-colors">
                                {item.displayName}
                              </span>
                            </CardPreview>
                          </td>
                          {decks.map((deck) => {
                            const count = item.counts[deck.id] || 0;
                            const colorClass =
                              highlightDifferences && statistics
                                ? getCountColorClass(count, statistics)
                                : "";

                            return (
                              <td
                                key={deck.id}
                                className={`px-6 py-4 text-sm text-gray-900 text-center border-b border-gray-200 ${colorClass}`}
                              >
                                {count || ""}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
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
      />
    </div>
  );
}
