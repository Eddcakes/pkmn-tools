"use client";

import { useEffect, useState } from "react";
import type { MatchupChartData } from "../utils/matchupRecords";

interface MatchupChartProps {
  data: MatchupChartData;
  onCellClick?: (userArchetype: string, opponentArchetype: string) => void;
  isCellActive?: (userArchetype: string, opponentArchetype: string) => boolean;
}

// Colour configuration for win rates
const WIN_RATE_COLORS = {
  veryLow: "bg-red-200",
  low: "bg-red-100",
  belowAverage: "bg-rose-50",
  average: "bg-gray-50",
  aboveAverage: "bg-emerald-50",
  high: "bg-emerald-100",
  veryHigh: "bg-emerald-200"
} as const;

const SHOW_COUNTS_STORAGE_KEY = "matchup-chart-show-counts";

function getWinRateColorClass(winRate: number): string {
  if (winRate < 0) {
    // No data
    return "bg-gray-100";
  }

  if (winRate >= 0.8) {
    return WIN_RATE_COLORS.veryHigh;
  } else if (winRate >= 0.65) {
    return WIN_RATE_COLORS.high;
  } else if (winRate >= 0.55) {
    return WIN_RATE_COLORS.aboveAverage;
  } else if (winRate >= 0.45) {
    return WIN_RATE_COLORS.average;
  } else if (winRate >= 0.35) {
    return WIN_RATE_COLORS.belowAverage;
  } else if (winRate >= 0.2) {
    return WIN_RATE_COLORS.low;
  } else {
    return WIN_RATE_COLORS.veryLow;
  }
}

function formatWinRate(winRate: number): string {
  if (winRate < 0) {
    return "-";
  }
  return winRate.toFixed(2);
}

export function MatchupChart({
  data,
  onCellClick,
  isCellActive
}: MatchupChartProps) {
  const { userArchetypes, opponentArchetypes, matrix, counts, rowTotals } =
    data;
  const [showCounts, setShowCounts] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }

    const storedValue = window.localStorage.getItem(SHOW_COUNTS_STORAGE_KEY);
    if (storedValue === null) {
      return true;
    }

    return storedValue === "true";
  });

  useEffect(() => {
    window.localStorage.setItem(SHOW_COUNTS_STORAGE_KEY, String(showCounts));
  }, [showCounts]);

  if (userArchetypes.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-500">
          No matchup data yet. Add some matchup records to see the chart.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Matchup Win Rate Chart
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Win rates for each archetype matchup (rows = your deck, columns =
          opponent deck)
        </p>
      </div>

      {/* Colour Legend */}
      <div className="p-4 bg-blue-50 border-b border-blue-200">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-sm font-medium text-blue-900">
            Win Rate Colour Legend:
          </span>
          <label className="inline-flex items-center gap-2 text-xs text-gray-700 select-none">
            <input
              type="checkbox"
              checked={showCounts}
              onChange={(event) => setShowCounts(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Show counts (W-L-T)
          </label>
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div
              className={`w-4 h-4 ${WIN_RATE_COLORS.veryLow} rounded border`}
            ></div>
            <span className="text-gray-700">&lt; 20%</span>
          </div>
          <div className="flex items-center gap-1">
            <div
              className={`w-4 h-4 ${WIN_RATE_COLORS.low} rounded border`}
            ></div>
            <span className="text-gray-700">20-35%</span>
          </div>
          <div className="flex items-center gap-1">
            <div
              className={`w-4 h-4 ${WIN_RATE_COLORS.belowAverage} rounded border`}
            ></div>
            <span className="text-gray-700">35-45%</span>
          </div>
          <div className="flex items-center gap-1">
            <div
              className={`w-4 h-4 ${WIN_RATE_COLORS.average} rounded border`}
            ></div>
            <span className="text-gray-700">45-55%</span>
          </div>
          <div className="flex items-center gap-1">
            <div
              className={`w-4 h-4 ${WIN_RATE_COLORS.aboveAverage} rounded border`}
            ></div>
            <span className="text-gray-700">55-65%</span>
          </div>
          <div className="flex items-center gap-1">
            <div
              className={`w-4 h-4 ${WIN_RATE_COLORS.high} rounded border`}
            ></div>
            <span className="text-gray-700">65-80%</span>
          </div>
          <div className="flex items-center gap-1">
            <div
              className={`w-4 h-4 ${WIN_RATE_COLORS.veryHigh} rounded border`}
            ></div>
            <span className="text-gray-700">&ge; 80%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-gray-100 rounded border"></div>
            <span className="text-gray-700">No Data</span>
          </div>
        </div>
      </div>

      {/* Matchup Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider border-b border-r border-gray-200 sticky left-0 z-30 bg-gray-50 whitespace-nowrap">
                Your Deck ▼
              </th>
              {opponentArchetypes.map((archetype) => (
                <th
                  key={archetype}
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 capitalize tracking-wider border-b border-gray-200 min-w-25"
                >
                  {archetype}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {userArchetypes.map((userArchetype, rowIndex) => {
              const winRates = matrix.get(userArchetype);
              if (!winRates) return null;

              return (
                <tr
                  key={userArchetype}
                  className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="px-4 py-3 text-xs font-medium text-gray-900 border-b border-r border-gray-200 sticky left-0 z-20 bg-inherit capitalize tracking-wider">
                    {userArchetype}
                    {showCounts && (
                      <span className="absolute top-1 right-1 text-xs text-gray-500 transition-opacity opacity-100">
                        {rowTotals.get(userArchetype)?.wins ?? 0}-
                        {rowTotals.get(userArchetype)?.losses ?? 0}-
                        {rowTotals.get(userArchetype)?.ties ?? 0}
                      </span>
                    )}
                  </td>
                  {opponentArchetypes.map((opponentArchetype) => {
                    const winRate = winRates.get(opponentArchetype) ?? -1;
                    const colorClass = getWinRateColorClass(winRate);
                    const cellCounts = counts
                      .get(userArchetype)
                      ?.get(opponentArchetype);
                    const hasData =
                      cellCounts &&
                      cellCounts.wins + cellCounts.losses + cellCounts.ties > 0;
                    const isActive = Boolean(
                      hasData &&
                        isCellActive?.(userArchetype, opponentArchetype)
                    );

                    return (
                      <td
                        key={opponentArchetype}
                        className={`p-0 text-sm text-gray-900 text-center border-b border-gray-200 ${colorClass} relative ${
                          isActive ? "ring-2 ring-inset ring-blue-500" : ""
                        }`}
                      >
                        {hasData && cellCounts ? (
                          <button
                            type="button"
                            onClick={() =>
                              onCellClick?.(userArchetype, opponentArchetype)
                            }
                            aria-pressed={isActive}
                            aria-label={`${
                              isActive ? "Clear deck filters for" : "Filter records for"
                            } ${userArchetype} vs ${opponentArchetype}`}
                            className="absolute inset-0 flex items-center justify-center px-4 py-3 cursor-pointer hover:bg-black/5"
                          >
                            <span
                              className={`absolute top-1 right-1 text-xs text-gray-500 transition-opacity ${
                                showCounts
                                  ? "opacity-100"
                                  : "opacity-0 pointer-events-none"
                              }`}
                            >
                              {cellCounts.wins}-{cellCounts.losses}-
                              {cellCounts.ties}
                            </span>
                            {formatWinRate(winRate)}
                          </button>
                        ) : (
                          <div className="px-4 py-3">
                            {formatWinRate(winRate)}
                          </div>
                        )}
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
  );
}
