import { useState } from "react";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { ModalFooter } from "../components/ModalFooter";
import { PkmnSelector } from "../components/PkmnSelector";
import { saveDeck } from "../utils/savedDecks";

interface SaveDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  deckList: string;
  initialLabel?: string;
  onSaved?: () => void;
  primaryPokemon?: string;
  secondaryPokemon?: string;
}

export function SaveDeckModal({
  isOpen,
  onClose,
  deckList,
  initialLabel = "",
  onSaved,
  primaryPokemon: initialPrimaryPokemon = "",
  secondaryPokemon: initialSecondaryPokemon = ""
}: SaveDeckModalProps) {
  const [label, setLabel] = useState(initialLabel);
  const [primaryPokemon, setPrimaryPokemon] = useState(initialPrimaryPokemon);
  const [secondaryPokemon, setSecondaryPokemon] = useState(
    initialSecondaryPokemon
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleDeckPokemonChange = (value: string, name?: string) => {
    switch (name) {
      case "savePrimaryPokemon":
        setPrimaryPokemon(value);
        break;
      case "saveSecondaryPokemon":
        setSecondaryPokemon(value);
        break;
      default:
        break;
    }
  };

  const handleSave = async () => {
    if (!label.trim()) {
      setError("Please enter a label for the deck");
      return;
    }

    if (!deckList.trim()) {
      setError("Cannot save empty deck list");
      return;
    }

    if (!primaryPokemon.trim()) {
      setError("Please select a deck primary Pokemon");
      return;
    }

    setSaving(true);
    setError("");

    try {
      saveDeck(
        label.trim(),
        deckList,
        primaryPokemon.trim(),
        secondaryPokemon.trim() || undefined
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
        <div className="grid gap-2">
          <p className="block text-sm font-medium text-gray-700">
            Deck Archetype
          </p>
          <PkmnSelector
            id="save-primary-pokemon"
            name="savePrimaryPokemon"
            value={primaryPokemon}
            onChange={handleDeckPokemonChange}
            label="Primary Pokemon"
            hideLabel
            placeholder="Choose primary Pokemon..."
            disabled={saving}
            required
          />
          <PkmnSelector
            id="save-secondary-pokemon"
            name="saveSecondaryPokemon"
            value={secondaryPokemon}
            onChange={handleDeckPokemonChange}
            label="Secondary Pokemon (Optional)"
            hideLabel
            placeholder="Choose secondary Pokemon..."
            disabled={saving}
          />
        </div>
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
