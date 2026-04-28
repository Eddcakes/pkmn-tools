import React, { useState } from "react";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { ModalFooter } from "../components/ModalFooter";
import { saveDeck } from "../utils/savedDecks";

interface ImportDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported?: () => void;
  onSaveDeck?: (
    label: string,
    deckList: string,
    archetype?: string[]
  ) => Promise<unknown>;
}

export function ImportDeckModal({
  isOpen,
  onClose,
  onImported,
  onSaveDeck
}: ImportDeckModalProps) {
  const [label, setLabel] = useState("");
  const [deckList, setDeckList] = useState("");
  const [archetype, setArchetype] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (isOpen) {
      setLabel("");
      setDeckList("");
      setError("");
    }
  }, [isOpen]);

  const handleImport = async () => {
    if (!label.trim()) {
      setError("Please enter a label for the deck");
      return;
    }

    if (!deckList.trim()) {
      setError("Please paste the deck list");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (onSaveDeck) {
        await onSaveDeck(label.trim(), deckList.trim());
      } else {
        saveDeck(label.trim(), deckList.trim());
      }
      onImported?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import deck");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Deck" maxWidth="lg">
      <div className="space-y-4">
        <div>
          <label
            htmlFor={`deckName`}
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Deck Label
          </label>
          <input
            id={`deckName`}
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter deck name..."
            disabled={saving}
          />
        </div>
        <div>
          <label
            htmlFor="edit-deck-archetype"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Deck Archetype
          </label>
          <input
            id="edit-deck-archetype"
            type="text"
            value={archetype}
            onChange={(e) => setArchetype(e.target.value)}
            placeholder="Seperate #, e.g. '#gholdengo #joltik box'"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
        </div>
        <div>
          <label
            htmlFor={`deckList`}
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Deck List
          </label>
          <textarea
            id={`deckList`}
            value={deckList}
            onChange={(e) => setDeckList(e.target.value)}
            rows={12}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            placeholder={`Paste your deck list here...

Expected format:
Pokémon: 16
4 Munkidori TWM 95
3 Ralts SVI 84
2 Kirlia SVI 85

Trainer: 33
4 Professor's Research JTG 155
4 Iono PAL 185

Energy: 11
7 Psychic Energy SVE 13`}
            disabled={saving}
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleImport} disabled={saving}>
          {saving ? "Importing..." : "Import Deck"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
