export interface MatchupRecord {
  id: string;
  userArchetype: string;
  opponentArchetype: string;
  result: "win" | "loss" | "tie";
  notes?: string;
  createdAt: string;
  // format / set: MEG; -> any value from saving what version of format the record was created in
}

const STORAGE_KEY = "pokemon-matchup-records";

export function getMatchupRecords(): MatchupRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error loading matchup records:", error);
    return [];
  }
}

export function saveMatchupRecord(
  userArchetype: string,
  opponentArchetype: string,
  result: "win" | "loss" | "tie",
  notes?: string
): MatchupRecord {
  const record: MatchupRecord = {
    id: generateId(),
    userArchetype,
    opponentArchetype,
    result,
    notes,
    createdAt: new Date().toISOString()
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
    if (!statsByOpponent.has(opponent)) {
      statsByOpponent.set(opponent, { wins: 0, losses: 0, ties: 0 });
    }

    const stats = statsByOpponent.get(opponent)!;
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
}

export function getMatchupChartData(): MatchupChartData {
  const records = getMatchupRecords();

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

  // Build matrix: userArchetype -> opponentArchetype -> { wins, total }
  const statsMatrix = new Map<
    string,
    Map<string, { wins: number; total: number }>
  >();

  for (const record of records) {
    const userArch = record.userArchetype.toLowerCase();
    const oppArch = record.opponentArchetype.toLowerCase();

    if (!statsMatrix.has(userArch)) {
      statsMatrix.set(userArch, new Map());
    }

    const userStats = statsMatrix.get(userArch)!;
    if (!userStats.has(oppArch)) {
      userStats.set(oppArch, { wins: 0, total: 0 });
    }

    const matchupStats = userStats.get(oppArch)!;
    matchupStats.total++;
    if (record.result === "win") {
      matchupStats.wins++;
    }
    // Losses and ties count as 0 points (no wins added)
  }

  // Convert to win rate matrix (0-1 decimal values)
  const matrix = new Map<string, Map<string, number>>();

  for (const userArch of userArchetypes) {
    matrix.set(userArch, new Map());
    const winRateMap = matrix.get(userArch)!;

    for (const oppArch of opponentArchetypes) {
      const stats = statsMatrix.get(userArch)?.get(oppArch);
      if (stats && stats.total > 0) {
        // Calculate win rate as decimal (0-1)
        const winRate = stats.wins / stats.total;
        // Round to 2 decimal places
        winRateMap.set(oppArch, Math.round(winRate * 100) / 100);
      } else {
        // No data for this matchup
        winRateMap.set(oppArch, -1); // Use -1 to indicate no data
      }
    }
  }

  return {
    userArchetypes,
    opponentArchetypes,
    matrix
  };
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
