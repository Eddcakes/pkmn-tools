export type MatchupResult = "win" | "loss" | "tie";
import { resolvePokemonSlots } from "./archetypePokemon";

export const MATCHUP_RESULT_OPTIONS: Array<{
  value: MatchupResult;
  label: string;
}> = [
  { value: "win", label: "Win" },
  { value: "loss", label: "Loss" },
  { value: "tie", label: "Tie" }
];

export interface MatchupRecord {
  id: string;
  userArchetype: string;
  opponentArchetype: string;
  userPrimaryPokemon?: string;
  userSecondaryPokemon?: string;
  opponentPrimaryPokemon?: string;
  opponentSecondaryPokemon?: string;
  format?: string;
  latestSet?: string;
  result: MatchupResult;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

function ensurePokemonSlotFields(record: MatchupRecord): MatchupRecord {
  const userSlots = resolvePokemonSlots(
    record.userArchetype,
    record.userPrimaryPokemon,
    record.userSecondaryPokemon
  );
  const opponentSlots = resolvePokemonSlots(
    record.opponentArchetype,
    record.opponentPrimaryPokemon,
    record.opponentSecondaryPokemon
  );

  return {
    ...record,
    userPrimaryPokemon: userSlots.primaryPokemon,
    userSecondaryPokemon: userSlots.secondaryPokemon,
    opponentPrimaryPokemon: opponentSlots.primaryPokemon,
    opponentSecondaryPokemon: opponentSlots.secondaryPokemon
  };
}

const STORAGE_KEY = "pokemon-matchup-records";

function migrateStoredRecords(records: MatchupRecord[]): MatchupRecord[] {
  let needsMigration = false;

  const migratedRecords = records.map((record) => {
    const withUpdatedAt = !record.updatedAt
      ? {
          ...record,
          updatedAt: record.createdAt
        }
      : record;

    if (!record.updatedAt) {
      needsMigration = true;
    }

    const normalized = ensurePokemonSlotFields(withUpdatedAt);
    if (
      normalized.userPrimaryPokemon !== withUpdatedAt.userPrimaryPokemon ||
      normalized.userSecondaryPokemon !== withUpdatedAt.userSecondaryPokemon ||
      normalized.opponentPrimaryPokemon !== withUpdatedAt.opponentPrimaryPokemon ||
      normalized.opponentSecondaryPokemon !== withUpdatedAt.opponentSecondaryPokemon
    ) {
      needsMigration = true;
    }

    return normalized;
  });

  if (needsMigration) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedRecords));
    } catch (error) {
      console.error("Error migrating matchup records:", error);
    }
  }

  return migratedRecords;
}

export function getMatchupRecords(): MatchupRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const records = stored ? JSON.parse(stored) : [];
    return migrateStoredRecords(records);
  } catch (error) {
    console.error("Error loading matchup records:", error);
    return [];
  }
}

export function replaceMatchupRecords(records: MatchupRecord[]): void {
  try {
    const recordsWithUpdatedAt = records.map((record) => ({
      ...record,
      updatedAt: record.updatedAt ?? record.createdAt
    }));

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(migrateStoredRecords(recordsWithUpdatedAt))
    );
  } catch (error) {
    console.error("Error replacing matchup records:", error);
    throw new Error("Failed to replace matchup records in local storage");
  }
}

export function saveMatchupRecord(
  userArchetype: string,
  opponentArchetype: string,
  result: MatchupResult,
  userPrimaryPokemon?: string,
  userSecondaryPokemon?: string,
  opponentPrimaryPokemon?: string,
  opponentSecondaryPokemon?: string,
  latestSet?: string,
  notes?: string,
  format?: string
): MatchupRecord {
  const now = new Date().toISOString();
  const userSlots = resolvePokemonSlots(
    userArchetype,
    userPrimaryPokemon,
    userSecondaryPokemon
  );
  const opponentSlots = resolvePokemonSlots(
    opponentArchetype,
    opponentPrimaryPokemon,
    opponentSecondaryPokemon
  );

  const record: MatchupRecord = {
    id: generateId(),
    userArchetype,
    opponentArchetype,
    userPrimaryPokemon: userSlots.primaryPokemon,
    userSecondaryPokemon: userSlots.secondaryPokemon,
    opponentPrimaryPokemon: opponentSlots.primaryPokemon,
    opponentSecondaryPokemon: opponentSlots.secondaryPokemon,
    format,
    latestSet,
    result,
    notes,
    createdAt: now,
    updatedAt: now
  };

  const records = getMatchupRecords();
  records.push(record);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    console.error("Error saving matchup record:", error);
    throw new Error("Failed to save matchup record to local storage");
  }

  return record;
}

export function deleteMatchupRecord(id: string): boolean {
  const records = getMatchupRecords();
  const filteredRecords = records.filter((record) => record.id !== id);

  if (filteredRecords.length === records.length) {
    return false; // Record not found
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredRecords));
    return true;
  } catch (error) {
    console.error("Error deleting matchup record:", error);
    throw new Error("Failed to delete matchup record from local storage");
  }
}

export function updateMatchupRecord(
  id: string,
  updates: {
    userArchetype?: string;
    opponentArchetype?: string;
    userPrimaryPokemon?: string;
    userSecondaryPokemon?: string;
    opponentPrimaryPokemon?: string;
    opponentSecondaryPokemon?: string;
    format?: string;
    latestSet?: string;
    result?: MatchupResult;
    notes?: string;
  }
): MatchupRecord | null {
  const records = getMatchupRecords();
  const recordIndex = records.findIndex((record) => record.id === id);

  if (recordIndex === -1) {
    return null; // Record not found
  }

  const existingRecord = records[recordIndex];
  const updatedRecord: MatchupRecord = {
    ...existingRecord,
    ...updates,
    updatedAt: new Date().toISOString(),
    // Ensure createdAt is never changed
    createdAt: existingRecord.createdAt
  };

  const normalizedRecord = ensurePokemonSlotFields(updatedRecord);

  records[recordIndex] = normalizedRecord;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    return normalizedRecord;
  } catch (error) {
    console.error("Error updating matchup record:", error);
    throw new Error("Failed to update matchup record in local storage");
  }
}

export function getMatchupRecordById(id: string): MatchupRecord | null {
  const records = getMatchupRecords();
  return records.find((record) => record.id === id) || null;
}

export function getMatchupStatsByArchetype(userArchetype: string): {
  opponentArchetype: string;
  wins: number;
  losses: number;
  ties: number;
  total: number;
  winRate: number;
}[] {
  const records = getMatchupRecords().filter(
    (r) => r.userArchetype.toLowerCase() === userArchetype.toLowerCase()
  );

  const statsByOpponent = new Map<
    string,
    { wins: number; losses: number; ties: number }
  >();

  for (const record of records) {
    const opponent = record.opponentArchetype;
    let stats = statsByOpponent.get(opponent);

    if (!stats) {
      stats = { wins: 0, losses: 0, ties: 0 };
      statsByOpponent.set(opponent, stats);
    }

    if (record.result === "win") stats.wins++;
    else if (record.result === "loss") stats.losses++;
    else if (record.result === "tie") stats.ties++;
  }

  return Array.from(statsByOpponent.entries()).map(
    ([opponentArchetype, stats]) => {
      const total = stats.wins + stats.losses + stats.ties;
      const winRate = total > 0 ? (stats.wins / total) * 100 : 0;
      return {
        opponentArchetype,
        wins: stats.wins,
        losses: stats.losses,
        ties: stats.ties,
        total,
        winRate: Math.round(winRate * 10) / 10 // Round to 1 decimal
      };
    }
  );
}

export interface MatchupChartData {
  userArchetypes: string[]; // Archetypes the user has played (rows)
  opponentArchetypes: string[]; // All archetypes faced (columns)
  matrix: Map<string, Map<string, number>>; // userArchetype -> opponentArchetype -> winRate
  counts: Map<
    string,
    Map<string, { wins: number; losses: number; ties: number }>
  >; // userArchetype -> opponentArchetype -> counts
}

export function getMatchupChartData(
  records: MatchupRecord[]
): MatchupChartData {
  // Get archetypes the user has played (userArchetype in records)
  const userArchetypesSet = new Set<string>();
  // Get archetypes opponents have played (opponentArchetype in records)
  const opponentArchetypesSet = new Set<string>();

  for (const record of records) {
    userArchetypesSet.add(record.userArchetype.toLowerCase());
    opponentArchetypesSet.add(record.opponentArchetype.toLowerCase());
  }

  const userArchetypes = Array.from(userArchetypesSet).sort();
  const opponentArchetypes = Array.from(opponentArchetypesSet).sort();

  // Build matrix: userArchetype -> opponentArchetype -> { wins, losses, ties }
  const statsMatrix = new Map<
    string,
    Map<string, { wins: number; losses: number; ties: number }>
  >();

  for (const record of records) {
    const userArch = record.userArchetype.toLowerCase();
    const oppArch = record.opponentArchetype.toLowerCase();

    let userStats = statsMatrix.get(userArch);
    if (!userStats) {
      userStats = new Map();
      statsMatrix.set(userArch, userStats);
    }

    let matchupStats = userStats.get(oppArch);
    if (!matchupStats) {
      matchupStats = { wins: 0, losses: 0, ties: 0 };
      userStats.set(oppArch, matchupStats);
    }

    if (record.result === "win") {
      matchupStats.wins++;
    } else if (record.result === "loss") {
      matchupStats.losses++;
    } else if (record.result === "tie") {
      matchupStats.ties++;
    }
  }

  // Convert to win rate matrix (0-1 decimal values)
  const matrix = new Map<string, Map<string, number>>();
  const counts = new Map<
    string,
    Map<string, { wins: number; losses: number; ties: number }>
  >();

  for (const userArch of userArchetypes) {
    const winRateMap = new Map<string, number>();
    const countsMap = new Map<
      string,
      { wins: number; losses: number; ties: number }
    >();
    matrix.set(userArch, winRateMap);
    counts.set(userArch, countsMap);

    for (const oppArch of opponentArchetypes) {
      const stats = statsMatrix.get(userArch)?.get(oppArch);
      if (stats) {
        const total = stats.wins + stats.losses + stats.ties;
        if (total > 0) {
          // Calculate win rate as decimal (0-1)
          const winRate = stats.wins / total;
          // Round to 2 decimal places
          winRateMap.set(oppArch, Math.round(winRate * 100) / 100);
          countsMap.set(oppArch, {
            wins: stats.wins,
            losses: stats.losses,
            ties: stats.ties
          });
        } else {
          winRateMap.set(oppArch, -1);
          countsMap.set(oppArch, { wins: 0, losses: 0, ties: 0 });
        }
      } else {
        // No data for this matchup
        winRateMap.set(oppArch, -1); // Use -1 to indicate no data
        countsMap.set(oppArch, { wins: 0, losses: 0, ties: 0 });
      }
    }
  }

  return {
    userArchetypes,
    opponentArchetypes,
    matrix,
    counts
  };
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
