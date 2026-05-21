export interface MatchupSettings {
  useRecentArchetypes: boolean; // Enable/disable recent archetypes tracking
  useFavouriteArchetypes: boolean; // Enable/disable favourite archetypes
  recentArchetypes: string[]; // Last 5 recently used archetypes
  favouriteArchetypes: string[]; // Up to 5 favourite archetypes from existing list
  customArchetypes: string; // Custom archetype list as newline-separated text
  defaultFormat?: string; // Default format used when adding records
  defaultLatestSet?: string; // Default latest set used when adding records
}

const STORAGE_KEY = "pokemon-matchup-settings";
const MAX_RECENT = 5;
const MAX_FAVOURITES = 5;

// Keep these newest -> oldest so dropdowns render in the desired order.
// Add newly released values at the start of each array.
export const AVAILABLE_FORMATS = ["H-on", "G-on", "F-on", "E-on", "D-on"];
export const AVAILABLE_LATEST_SETS = ["CRI", "POR", "ASC", "PFL", "MEG"];

function normalizeFormat(format?: string): string | undefined {
  if (!format) return undefined;
  const normalized = format.trim();
  return AVAILABLE_FORMATS.includes(normalized) ? normalized : undefined;
}

function normalizeLatestSet(latestSet?: string): string | undefined {
  if (!latestSet) return undefined;
  const normalized = latestSet.trim().toUpperCase();
  return AVAILABLE_LATEST_SETS.includes(normalized) ? normalized : undefined;
}

function getDefaultSettings(): MatchupSettings {
  return {
    useRecentArchetypes: true,
    useFavouriteArchetypes: false,
    recentArchetypes: [],
    favouriteArchetypes: [],
    customArchetypes: "",
    defaultFormat: undefined,
    defaultLatestSet: undefined
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

    const parsed = JSON.parse(stored) as Partial<MatchupSettings>;
    const settings: MatchupSettings = {
      ...getDefaultSettings(),
      ...parsed,
      defaultFormat: normalizeFormat(parsed.defaultFormat),
      defaultLatestSet: normalizeLatestSet(parsed.defaultLatestSet)
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
      defaultLatestSet: normalizeLatestSet(settings.defaultLatestSet)
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
