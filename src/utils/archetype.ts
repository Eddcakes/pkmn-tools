import type { TagType } from "@/components/Tag";

// Archetype keyword mapping to type used in Badge component
export const archetypeMapping: Record<string, TagType> = {
  "alakazam dudunsparce": "psychic",
  ceruledge: "fire",
  "charizard dragapult": "fire",
  "charizard noctowl": "fire",
  "charizard pidgeot": "fire",
  crustle: "grass",
  "cynthia's garchomp": "fighting",
  dragapult: "dragon",
  "dragapult blaziken": "fire",
  "dragapult dusknoir": "dragon",
  "ethan's typhlosion": "fire",
  "flareon noctowl": "colorless",
  "froslass munkidori": "water",
  gardevoir: "psychic",
  "gardevoir jellicent": "psychic",
  gholdengo: "metal",
  "gholdengo joltik box": "lightning",
  "gholdengo lunatone": "fighting",
  greninja: "fighting",
  "grimmsnarl froslass": "darkness",
  "ho-oh armarouge": "fire",
  "joltik box": "lightning",
  "kangaskhan bouffalant": "colorless",
  "lopunny dusknoir": "colorless",
  "marnie's grimmsnarl": "darkness",
  "mega absol box": "darkness",
  "n's zoroark": "darkness",
  "raging bolt ogerpon": "dragon",
  "sharpedo toxtricity": "darkness",
  slaking: "colorless",
  "tera box": "colorless"
};

export const archetypeToTagType = (archetype: string): TagType | undefined => {
  return archetypeMapping[archetype.toLowerCase()];
};
