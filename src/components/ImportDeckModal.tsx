import React, { useState } from "react";
import { Button } from "./Button";
import { saveDeck } from "../utils/savedDecks";

interface ImportDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported?: () => void;
}

export function ImportDeckModal({
  isOpen,
  onClose,
  onImported,
}: ImportDeckModalProps) {
  const [label, setLabel] = useState("");
  const [deckList, setDeckList] = useState("");
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
      await saveDeck(label.trim(), deckList.trim());
      onImported?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import deck");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Import Deck</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deck Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter deck name..."
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deck List
            </label>
            <textarea
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

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={saving}>
            {saving ? "Importing..." : "Import Deck"}
          </Button>
        </div>
      </div>
    </div>
  );
}
