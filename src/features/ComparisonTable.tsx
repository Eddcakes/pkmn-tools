import { useState } from "react";
import { Alert, Card } from "@/components";
import { CardPreview } from "@/components/CardPreview";

// Color configuration for count differences
const COUNT_COLORS = {
  muchLower: "bg-rose-100",
  lower: "bg-rose-50",
  average: "",
  higher: "bg-emerald-50",
  muchHigher: "bg-emerald-100",
} as const;

interface ComparisonCard {
  cardId: string;
  displayName: string;
  category: string;
  counts: Record<string, number>;
}

interface DeckInfo {
  id: string;
  label: string;
}

interface ComparisonTableProps {
  comparisonData: ComparisonCard[];
  decks: DeckInfo[];
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

export function ComparisonTable({
  comparisonData,
  decks,
}: ComparisonTableProps) {
  const [highlightDifferences, setHighlightDifferences] = useState(false);
  const [hideIdenticalRows, setHideIdenticalRows] = useState(false);

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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Card Comparison</h2>
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
        <Alert className="mb-4">
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
        </Alert>
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
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
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
  );
}
