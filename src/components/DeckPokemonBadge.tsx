import { resolvePokemonSlots } from "@/utils/archetypePokemon";
import { getPokemonLabel } from "@/utils/pokemon";

interface DeckPokemonBadgeProps {
  label: string;
  primaryPokemon?: string;
  secondaryPokemon?: string;
}

const SUBSTITUTE_IMAGE_URL =
  "https://limitless3.nyc3.cdn.digitaloceanspaces.com/pokemon/substitute.png";

function getPokemonSpriteUrl(pokemon?: string) {
  if (!pokemon) {
    return SUBSTITUTE_IMAGE_URL;
  }

  return `https://r2.limitlesstcg.net/pokemon/gen9/${pokemon}.png`;
}

export function DeckPokemonBadge({
  label,
  primaryPokemon,
  secondaryPokemon
}: DeckPokemonBadgeProps) {
  const resolved = resolvePokemonSlots(label, primaryPokemon, secondaryPokemon);
  const primaryLabel =
    getPokemonLabel(resolved.primaryPokemon) ?? resolved.primaryPokemon;
  const secondaryLabel =
    getPokemonLabel(resolved.secondaryPokemon) ?? resolved.secondaryPokemon;

  const displayLabel = primaryLabel
    ? secondaryLabel
      ? `${primaryLabel} + ${secondaryLabel}`
      : primaryLabel
    : label;

  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700">
      <span className="flex items-center -space-x-1">
        <img
          src={getPokemonSpriteUrl(resolved.primaryPokemon)}
          alt={primaryLabel ?? "Unknown primary Pokemon"}
          className="h-6 w-6 rounded-full border border-white bg-white object-contain"
        />
        {resolved.secondaryPokemon && (
          <img
            src={getPokemonSpriteUrl(resolved.secondaryPokemon)}
            alt={secondaryLabel ?? "Unknown secondary Pokemon"}
            className="h-6 w-6 rounded-full border border-white bg-white object-contain"
          />
        )}
      </span>
      <span>{displayLabel}</span>
    </span>
  );
}
