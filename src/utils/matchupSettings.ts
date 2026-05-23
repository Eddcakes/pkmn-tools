export interface MatchupSettings {
  useRecentArchetypes: boolean; // Enable/disable recent archetypes tracking
  useFavouriteArchetypes: boolean; // Enable/disable favourite archetypes
  recentArchetypes: string[]; // Last 5 recently used archetypes
  favouriteArchetypes: string[]; // Up to 5 favourite archetypes from existing list
  customArchetypes: string; // Custom archetype list as newline-separated text
  defaultFormat?: string; // Default format used when adding records
  defaultSet?: string; // Default set used when adding records
  recentUserPrimary: string[]; // Last 5 unique user primary Pokemon
  recentUserSecondary: string[]; // Last 5 unique user secondary Pokemon
  recentOpponentPrimary: string[]; // Last 5 unique opponent primary Pokemon
  recentOpponentSecondary: string[]; // Last 5 unique opponent secondary Pokemon
}

const STORAGE_KEY = "pokemon-matchup-settings";
const MAX_RECENT = 5;
const MAX_FAVOURITES = 5;
const MAX_RECENT_POKEMON = 5;

// Keep these newest -> oldest so dropdowns render in the desired order.
// Add newly released values at the start of each array.
export const AVAILABLE_FORMATS = ["H-on", "G-on", "F-on", "E-on", "D-on"];
export const AVAILABLE_LATEST_SETS = ["CRI", "POR", "ASC", "PFL", "MEG"];

function normalizeFormat(format?: string): string | undefined {
  if (!format) return undefined;
  const normalized = format.trim();
  return AVAILABLE_FORMATS.includes(normalized) ? normalized : undefined;
}

function normalizeSet(setValue?: string): string | undefined {
  if (!setValue) return undefined;
  const normalized = setValue.trim().toUpperCase();
  return AVAILABLE_LATEST_SETS.includes(normalized) ? normalized : undefined;
}

function normalizeRecentPokemonList(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const value of values) {
    if (typeof value !== "string") {
      continue;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      continue;
    }

    const dedupeKey = trimmed.toLowerCase();
    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    normalized.push(trimmed);

    if (normalized.length >= MAX_RECENT_POKEMON) {
      break;
    }
  }

  return normalized;
}

function prependRecentPokemon(existing: string[], nextValue?: string): string[] {
  if (!nextValue) {
    return existing;
  }

  const trimmed = nextValue.trim();
  if (!trimmed) {
    return existing;
  }

  const dedupeKey = trimmed.toLowerCase();
  const filtered = existing.filter((value) => value.toLowerCase() !== dedupeKey);

  return [trimmed, ...filtered].slice(0, MAX_RECENT_POKEMON);
}

function getDefaultSettings(): MatchupSettings {
  return {
    useRecentArchetypes: true,
    useFavouriteArchetypes: false,
    recentArchetypes: [],
    favouriteArchetypes: [],
    customArchetypes: "",
    defaultFormat: undefined,
    defaultSet: undefined,
    recentUserPrimary: [],
    recentUserSecondary: [],
    recentOpponentPrimary: [],
    recentOpponentSecondary: []
  };
}

export function getMatchupSettings(): MatchupSettings {
  if (typeof window === "undefined") {
    return getDefaultSettings();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return getDefaultSettings();
    }

    const parsed = JSON.parse(stored) as Partial<MatchupSettings> & {
      defaultLatestSet?: string;
    };
    const settings: MatchupSettings = {
      ...getDefaultSettings(),
      ...parsed,
      defaultFormat: normalizeFormat(parsed.defaultFormat),
      defaultSet: normalizeSet(parsed.defaultSet ?? parsed.defaultLatestSet),
      recentUserPrimary: normalizeRecentPokemonList(parsed.recentUserPrimary),
      recentUserSecondary: normalizeRecentPokemonList(parsed.recentUserSecondary),
      recentOpponentPrimary: normalizeRecentPokemonList(parsed.recentOpponentPrimary),
      recentOpponentSecondary: normalizeRecentPokemonList(
        parsed.recentOpponentSecondary
      )
    };

    return settings;
  } catch (error) {
    console.error("Error loading matchup settings:", error);
    return getDefaultSettings();
  }
}

export function saveMatchupSettings(settings: MatchupSettings): void {
  try {
    const normalized: MatchupSettings = {
      ...settings,
      defaultFormat: normalizeFormat(settings.defaultFormat),
      defaultSet: normalizeSet(settings.defaultSet),
      recentUserPrimary: normalizeRecentPokemonList(settings.recentUserPrimary),
      recentUserSecondary: normalizeRecentPokemonList(settings.recentUserSecondary),
      recentOpponentPrimary: normalizeRecentPokemonList(
        settings.recentOpponentPrimary
      ),
      recentOpponentSecondary: normalizeRecentPokemonList(
        settings.recentOpponentSecondary
      )
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch (error) {
    console.error("Error saving matchup settings:", error);
    throw new Error("Failed to save matchup settings to local storage");
  }
}

export function addRecentArchetype(archetype: string): void {
  const settings = getMatchupSettings();

  // Only track if enabled
  if (!settings.useRecentArchetypes) {
    return;
  }

  // Remove archetype if it already exists
  const filtered = settings.recentArchetypes.filter(
    (a) => a.toLowerCase() !== archetype.toLowerCase()
  );

  // Add to front of array
  const updated = [archetype, ...filtered].slice(0, MAX_RECENT);

  saveMatchupSettings({
    ...settings,
    recentArchetypes: updated
  });
}

export function addFavouriteArchetype(archetype: string): void {
  const settings = getMatchupSettings();

  // Check if already in favourites
  if (
    settings.favouriteArchetypes.some(
      (a) => a.toLowerCase() === archetype.toLowerCase()
    )
  ) {
    return;
  }

  // Add to favourites (up to max)
  if (settings.favouriteArchetypes.length < MAX_FAVOURITES) {
    saveMatchupSettings({
      ...settings,
      favouriteArchetypes: [...settings.favouriteArchetypes, archetype]
    });
  }
}

export function removeFavouriteArchetype(archetype: string): void {
  const settings = getMatchupSettings();

  saveMatchupSettings({
    ...settings,
    favouriteArchetypes: settings.favouriteArchetypes.filter(
      (a) => a.toLowerCase() !== archetype.toLowerCase()
    )
  });
}

export function getCustomArchetypesArray(): string[] {
  const settings = getMatchupSettings();
  return settings.customArchetypes
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function clearRecentArchetypes(): void {
  const settings = getMatchupSettings();

  saveMatchupSettings({
    ...settings,
    recentArchetypes: []
  });
}

interface RecentPokemonSelections {
  userPrimary?: string;
  userSecondary?: string;
  opponentPrimary?: string;
  opponentSecondary?: string;
}

export function updateRecentPokemonSettings(
  settings: MatchupSettings,
  selections: RecentPokemonSelections
): MatchupSettings {
  return {
    ...settings,
    recentUserPrimary: prependRecentPokemon(
      settings.recentUserPrimary,
      selections.userPrimary
    ),
    recentUserSecondary: prependRecentPokemon(
      settings.recentUserSecondary,
      selections.userSecondary
    ),
    recentOpponentPrimary: prependRecentPokemon(
      settings.recentOpponentPrimary,
      selections.opponentPrimary
    ),
    recentOpponentSecondary: prependRecentPokemon(
      settings.recentOpponentSecondary,
      selections.opponentSecondary
    )
  };
}
