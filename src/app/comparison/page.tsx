"use client";

import {
  ActionButton,
  Button,
  Flex,
  Form,
  Heading,
  TextArea,
  TextField,
  View,
} from "@adobe/react-spectrum";
import { useState } from "react";

const MAX_DECKS = 6;

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

export default function ComparisonPage() {
  const [decks, setDecks] = useState<DeckEntry[]>([
    { id: "1", label: "Deck 1", deckList: "" },
  ]);
  const [comparisonData, setComparisonData] = useState<ComparisonCard[]>([]);

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

  return (
    <View padding="size-400">
      <Heading level={1} marginBottom="size-400">
        Pokémon Deck Comparison
      </Heading>

      <Flex direction="column" gap="size-400">
        {/* Deck Input Section */}
        <View>
          <Flex direction="row" gap="size-200" marginBottom="size-300" wrap>
            <Button variant="primary" onPress={updateComparison}>
              Update Comparison
            </Button>
            <ActionButton
              onPress={addDeck}
              isDisabled={decks.length >= MAX_DECKS}
            >
              Add Deck ({decks.length}/{MAX_DECKS})
            </ActionButton>
          </Flex>

          <Flex direction="row" gap="size-300" wrap>
            {decks.map((deck) => (
              <View key={deck.id} minWidth="size-3600">
                <Form>
                  <TextField
                    label="Deck Label"
                    value={deck.label}
                    onChange={(value) => updateDeck(deck.id, "label", value)}
                    marginBottom="size-200"
                  />
                  <TextArea
                    label="Deck List"
                    value={deck.deckList}
                    onChange={(value) => updateDeck(deck.id, "deckList", value)}
                    height="size-3000"
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
                </Form>
                {decks.length > 1 && (
                  <ActionButton
                    onPress={() => removeDeck(deck.id)}
                    marginTop="size-200"
                  >
                    Remove Deck
                  </ActionButton>
                )}
              </View>
            ))}
          </Flex>
        </View>

        {/* Comparison Table */}
        {comparisonData.length > 0 && (
          <View>
            <Heading level={2} marginBottom="size-300">
              Card Comparison
            </Heading>
            <View
              borderWidth="thin"
              borderColor="default"
              borderRadius="medium"
              overflow="auto"
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "14px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor: "var(--spectrum-global-color-gray-100)",
                    }}
                  >
                    <th
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        borderBottom:
                          "1px solid var(--spectrum-global-color-gray-300)",
                        fontWeight: "bold",
                      }}
                    >
                      Card Name
                    </th>
                    {decks.map((deck) => (
                      <th
                        key={deck.id}
                        style={{
                          padding: "12px 16px",
                          textAlign: "center",
                          borderBottom:
                            "1px solid var(--spectrum-global-color-gray-300)",
                          fontWeight: "bold",
                        }}
                      >
                        {deck.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((item, index) => (
                    <tr
                      key={item.cardId}
                      style={{
                        backgroundColor:
                          index % 2 === 0
                            ? "transparent"
                            : "var(--spectrum-global-color-gray-50)",
                      }}
                    >
                      <td
                        style={{
                          padding: "12px 16px",
                          borderBottom:
                            "1px solid var(--spectrum-global-color-gray-200)",
                        }}
                      >
                        {item.displayName}
                      </td>
                      {decks.map((deck) => (
                        <td
                          key={deck.id}
                          style={{
                            padding: "12px 16px",
                            textAlign: "center",
                            borderBottom:
                              "1px solid var(--spectrum-global-color-gray-200)",
                          }}
                        >
                          {item.counts[deck.id] || ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </View>
          </View>
        )}
      </Flex>
    </View>
  );
}
