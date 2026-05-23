import { useState } from "react";
import { DeckPokemonBadge } from "@/components/DeckPokemonBadge";
import { resolvePokemonSlots } from "@/utils/archetypePokemon";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { ModalFooter } from "../components/ModalFooter";
import { saveDeck } from "../utils/savedDecks";

interface SaveDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  deckList: string;
  initialLabel?: string;
  onSaved?: () => void;
  archetype?: string;
}

export function SaveDeckModal({
  isOpen,
  onClose,
  deckList,
  initialLabel = "",
  onSaved,
  archetype
}: SaveDeckModalProps) {
  const [label, setLabel] = useState(initialLabel);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!label.trim()) {
      setError("Please enter a label for the deck");
      return;
    }

    if (!deckList.trim()) {
      setError("Cannot save empty deck list");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const archetypeList = archetype
        ? archetype.trim().split("#").filter(Boolean)
        : [];
      const archetypeLabel = archetypeList.join(" + ");
      const slots = resolvePokemonSlots(archetypeLabel);

      saveDeck(
        label.trim(),
        deckList,
        slots.primaryPokemon,
        slots.secondaryPokemon
      );
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save deck");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Save Deck" maxWidth="md">
      <div className="space-y-4">
        <div>
          <label
            htmlFor="deck-label"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Deck Label
          </label>
          <input
            id="deck-label"
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter deck name..."
            disabled={saving}
          />
        </div>
        {archetype && (
          <div className="gap-2 flex flex-wrap">
            {archetype
              .trim()
              .split("#")
              .filter(Boolean)
              .map((tag) => (
                <DeckPokemonBadge key={tag} label={tag} />
              ))}
          </div>
        )}
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Deck"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
