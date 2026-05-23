import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { ModalFooter } from "../components/ModalFooter";
import { PkmnSelector } from "../components/PkmnSelector";
import { resolvePokemonSlots } from "../utils/archetypePokemon";
import { type SavedDeck, updateSavedDeck } from "../utils/savedDecks";

interface EditDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  deck: SavedDeck | null;
  onUpdateDeck?: (
    id: string,
    label: string,
    deckList: string,
    primaryPokemon?: string,
    secondaryPokemon?: string
  ) => Promise<unknown>;
}

export function EditDeckModal({
  isOpen,
  onClose,
  onUpdated,
  deck,
  onUpdateDeck
}: EditDeckModalProps) {
  const initialArchetypeLabel =
    deck?.primaryPokemon && deck?.secondaryPokemon
      ? `${deck.primaryPokemon} + ${deck.secondaryPokemon}`
      : deck?.primaryPokemon ?? "";
  const initialSlots = resolvePokemonSlots(
    initialArchetypeLabel,
    deck?.primaryPokemon,
    deck?.secondaryPokemon
  );
  const [label, setLabel] = useState(() => deck?.label ?? "");
  const [primaryPokemon, setPrimaryPokemon] = useState(
    () => initialSlots.primaryPokemon ?? ""
  );
  const [secondaryPokemon, setSecondaryPokemon] = useState(
    () => initialSlots.secondaryPokemon ?? ""
  );
  const [deckList, setDeckList] = useState(() => deck?.deckList ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleDeckPokemonChange = (value: string, name?: string) => {
    switch (name) {
      case "editDeckPrimaryPokemon":
        setPrimaryPokemon(value);
        break;
      case "editDeckSecondaryPokemon":
        setSecondaryPokemon(value);
        break;
      default:
        break;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!deck) return;

    if (!label.trim()) {
      setError("Please enter a deck label");
      return;
    }

    if (!deckList.trim()) {
      setError("Please enter a deck list");
      return;
    }

    if (!primaryPokemon.trim()) {
      setError("Please select a deck primary Pokemon");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      let updatedDeck: SavedDeck | boolean | null;
      if (onUpdateDeck) {
        await onUpdateDeck(
          deck.id,
          label.trim(),
          deckList.trim(),
          primaryPokemon.trim(),
          secondaryPokemon.trim() || undefined
        );
        updatedDeck = true;
      } else {
        updatedDeck = updateSavedDeck(
          deck.id,
          label.trim(),
          deckList.trim(),
          primaryPokemon.trim(),
          secondaryPokemon.trim() || undefined
        );
      }
      if (updatedDeck) {
        onUpdated();
        onClose();
      } else {
        setError("Failed to update deck - deck not found");
      }
    } catch (error) {
      console.error("Error updating deck:", error);
      setError("Failed to update deck. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen || !deck) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Deck"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div>
          <label
            htmlFor="edit-deck-label"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Deck Label
          </label>
          <input
            id="edit-deck-label"
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Enter deck name..."
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
        </div>
        <div className="grid gap-2">
          <p className="block text-sm font-medium text-gray-700">
            Deck Archetype
          </p>
          <PkmnSelector
            id="edit-deck-primary-pokemon"
            name="editDeckPrimaryPokemon"
            value={primaryPokemon}
            onChange={handleDeckPokemonChange}
            label="Primary Pokemon"
            hideLabel
            placeholder="Choose primary Pokemon..."
            disabled={isSubmitting}
            required
          />
          <PkmnSelector
            id="edit-deck-secondary-pokemon"
            name="editDeckSecondaryPokemon"
            value={secondaryPokemon}
            onChange={handleDeckPokemonChange}
            label="Secondary Pokemon (Optional)"
            hideLabel
            placeholder="Choose secondary Pokemon..."
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label
            htmlFor="edit-deck-list"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Deck List
          </label>
          <textarea
            id="edit-deck-list"
            value={deckList}
            onChange={(e) => setDeckList(e.target.value)}
            placeholder="Paste your deck list here..."
            disabled={isSubmitting}
            rows={15}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm disabled:opacity-50"
          />
        </div>

        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
          <p className="font-medium mb-1">Format example:</p>
          <pre className="whitespace-pre-wrap">
            {`Pokémon: 16
4 Gardevoir ex SVI 86
4 Kirlia SIT 68
4 Ralts ASR 60
...

Trainer: 32
4 Professor's Research SVI 189
4 Battle VIP Pass FST 225
...

Energy: 12
4 Psychic Energy SVE 5
4 Twin Energy RCL 174
...`}
          </pre>
        </div>
      </form>

      <ModalFooter>
        <Button
          type="button"
          variant="secondary"
          onClick={handleClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={isSubmitting || !label.trim() || !deckList.trim()}
        >
          {isSubmitting ? "Updating..." : "Update Deck"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
