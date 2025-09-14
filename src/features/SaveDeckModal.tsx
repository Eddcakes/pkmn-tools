import React, { useState } from "react";
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
}

export function SaveDeckModal({
  isOpen,
  onClose,
  deckList,
  initialLabel = "",
  onSaved,
}: SaveDeckModalProps) {
  const [label, setLabel] = useState(initialLabel);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (isOpen) {
      setLabel(initialLabel);
      setError("");
    }
  }, [isOpen, initialLabel]);

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
      await saveDeck(label.trim(), deckList);
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
