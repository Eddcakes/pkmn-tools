import { TagType } from "@/components/Tag";

// Archetype keyword mapping to type used in Badge component
export const archetypeMapping: Record<string, TagType> = {
  charizard: "fire",
  grimmsnarl: "darkness",
  ceruledge: "fire",
  gardevoir: "psychic",
  dragapult: "dragon",
  "mega absol": "darkness",
  goldengo: "metal",
  "joltik box": "lightning",
  rocks: "fighting",
  "raging bolt": "dragon",
  other: "colorless",
  terabox: "colorless",
  "n's zoroark": "darkness",
  alakazam: "psychic",
  "mega venusaur": "grass",
  "pidgeot control": "colorless",
  lucario: "fighting",
  crustle: "grass",
  conkeldurr: "fighting",
  "ethan's typhlosion": "fire",
  slowking: "psychic",
  "ho-oh": "fire",
  hydrapple: "grass",
  "mega manectric": "lightning",
  "rocket's mewtwo": "psychic",
  hydreigon: "darkness",
  archaludon: "metal",
  greninja: "fighting",
  "chien-Pao": "water",
  froslass: "water",
  "roaring moon": "darkness",
  wugtrio: "water",
  miraidon: "lightning",
  "mega kangaskhan": "colorless",
};

export const archetypeToTagType = (archetype: string): TagType | undefined => {
  return archetypeMapping[archetype.toLowerCase()];
};
