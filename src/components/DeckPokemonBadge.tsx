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
        {resolved.primaryPokemon && (
          <PokemonSprite pokemon={resolved.primaryPokemon} />
        )}
        {resolved.secondaryPokemon && (
          <PokemonSprite pokemon={resolved.secondaryPokemon} />
        )}
      </span>
      <span className="hidden min-[480px]:inline">{displayLabel}</span>
    </span>
  );
}

function PokemonSprite({ pokemon }: { pokemon?: string }) {
  const spriteUrl = getPokemonSpriteUrl(pokemon);
  const altText = pokemon
    ? (getPokemonLabel(pokemon) ?? pokemon)
    : "Unknown Pokemon";

  return (
    <img
      src={spriteUrl}
      alt={altText}
      className="size-6 shrink-0 rounded-full border border-white bg-white object-contain"
    />
  );
}
