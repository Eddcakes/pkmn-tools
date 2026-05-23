export interface PokemonSlots {
  primaryPokemon?: string;
  secondaryPokemon?: string;
}

const ARCHETYPE_TO_POKEMON: Record<string, PokemonSlots> = {
  "alakazam dudunsparce": {
    primaryPokemon: "alakazam",
    secondaryPokemon: "dudunsparce"
  },
  ceruledge: { primaryPokemon: "ceruledge" },
  "charizard dragapult": {
    primaryPokemon: "charizard",
    secondaryPokemon: "dragapult"
  },
  "charizard noctowl": {
    primaryPokemon: "charizard",
    secondaryPokemon: "noctowl"
  },
  "charizard pidgeot": {
    primaryPokemon: "charizard",
    secondaryPokemon: "pidgeot"
  },
  crustle: { primaryPokemon: "crustle" },
  "cynthia's garchomp": {
    primaryPokemon: "garchomp",
    secondaryPokemon: "roserade"
  },
  dragapult: { primaryPokemon: "dragapult" },
  "dragapult blaziken": {
    primaryPokemon: "dragapult",
    secondaryPokemon: "blaziken"
  },
  "dragapult dusknoir": {
    primaryPokemon: "dragapult",
    secondaryPokemon: "dusknoir"
  },
  "ethan's typhlosion": { primaryPokemon: "typhlosion" },
  "flareon noctowl": {
    primaryPokemon: "flareon",
    secondaryPokemon: "noctowl"
  },
  "froslass munkidori": {
    primaryPokemon: "froslass",
    secondaryPokemon: "munkidori"
  },
  gardevoir: { primaryPokemon: "gardevoir" },
  "gardevoir jellicent": {
    primaryPokemon: "gardevoir",
    secondaryPokemon: "jellicent"
  },
  gholdengo: { primaryPokemon: "gholdengo" },
  "gholdengo joltik box": {
    primaryPokemon: "gholdengo",
    secondaryPokemon: "joltik"
  },
  "gholdengo lunatone": {
    primaryPokemon: "gholdengo",
    secondaryPokemon: "lunatone"
  },
  greninja: { primaryPokemon: "greninja" },
  "grimmsnarl froslass": {
    primaryPokemon: "grimmsnarl",
    secondaryPokemon: "froslass"
  },
  "ho-oh armarouge": {
    primaryPokemon: "ho-oh",
    secondaryPokemon: "armarouge"
  },
  "joltik box": {
    primaryPokemon: "joltik",
    secondaryPokemon: "pikachu"
  },
  "kangaskhan bouffalant": {
    primaryPokemon: "kangaskhan-mega",
    secondaryPokemon: "bouffalant"
  },
  "lopunny dusknoir": {
    primaryPokemon: "lopunny-mega",
    secondaryPokemon: "dusknoir"
  },
  "marnie's grimmsnarl": { primaryPokemon: "grimmsnarl" },
  "mega absol box": { primaryPokemon: "absol-mega" },
  "n's zoroark": { primaryPokemon: "zoroark" },
  "raging bolt ogerpon": {
    primaryPokemon: "raging-bolt",
    secondaryPokemon: "ogerpon"
  },
  "sharpedo toxtricity": {
    primaryPokemon: "sharpedo",
    secondaryPokemon: "toxtricity"
  },
  slaking: { primaryPokemon: "slaking" },
  "tera box": {
    primaryPokemon: "noctowl",
    secondaryPokemon: "ogerpon-wellspring"
  },
  other: { primaryPokemon: "unown" }
};

const normalizeApostrophes = (value: string) => value.replace(/[’`]/g, "'");
const POKEMON_SLUG_PATTERN = /^[a-z0-9-]+$/;
const POKEMON_ALIAS_TO_SLUG: Record<string, string> = {
  "raging bolt": "raging-bolt",
  "mega gengar": "gengar-mega",
  "mega kangaskhan": "kangaskhan-mega",
  "mega lopunny": "lopunny-mega",
  "mega absol": "absol-mega",
  "wellspring ogerpon": "ogerpon-wellspring"
};

function normalizeExistingPokemonSlot(value?: string): string | undefined {
  const trimmed = normalizeApostrophes(value ?? "")
    .trim()
    .toLowerCase();
  if (!trimmed) {
    return undefined;
  }

  const normalizedWhitespace = trimmed.replace(/\s+/g, " ");
  if (POKEMON_SLUG_PATTERN.test(normalizedWhitespace)) {
    return normalizedWhitespace;
  }

  return POKEMON_ALIAS_TO_SLUG[normalizedWhitespace];
}

export function normalizeArchetypeKey(archetype: string): string {
  return normalizeApostrophes(archetype)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function splitDeckLabel(archetype: string): PokemonSlots {
  const parts = archetype
    .split("+")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  return {
    primaryPokemon: normalizeExistingPokemonSlot(parts[0]),
    secondaryPokemon: normalizeExistingPokemonSlot(parts[1])
  };
}

export function mapArchetypeToPokemon(
  archetype: string
): PokemonSlots | undefined {
  return ARCHETYPE_TO_POKEMON[normalizeArchetypeKey(archetype)];
}

export function resolvePokemonSlots(
  archetype: string,
  existingPrimaryPokemon?: string,
  existingSecondaryPokemon?: string
): PokemonSlots {
  const trimmedPrimary = normalizeExistingPokemonSlot(existingPrimaryPokemon);
  const trimmedSecondary = normalizeExistingPokemonSlot(
    existingSecondaryPokemon
  );

  if (trimmedPrimary && trimmedSecondary) {
    return {
      primaryPokemon: trimmedPrimary,
      secondaryPokemon: trimmedSecondary
    };
  }

  const mapped = mapArchetypeToPokemon(archetype);

  if (mapped) {
    return {
      primaryPokemon: mapped.primaryPokemon ?? trimmedPrimary,
      secondaryPokemon: mapped.secondaryPokemon ?? trimmedSecondary
    };
  }

  const fallback = splitDeckLabel(archetype);

  return {
    primaryPokemon: trimmedPrimary ?? fallback.primaryPokemon,
    secondaryPokemon: trimmedSecondary ?? fallback.secondaryPokemon
  };
}
