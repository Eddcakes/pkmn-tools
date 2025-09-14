import React, { useState } from "react";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { ModalFooter } from "../components/ModalFooter";
import { getSavedDecks } from "../utils/savedDecks";
import type { SavedDeck } from "../utils/savedDecks";

interface LoadDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadDeck: (deck: SavedDeck) => void;
}

export function LoadDeckModal({
  isOpen,
  onClose,
  onLoadDeck,
}: LoadDeckModalProps) {
  const [savedDecks, setSavedDecks] = useState<SavedDeck[]>([]);

  React.useEffect(() => {
    if (isOpen) {
      setSavedDecks(getSavedDecks());
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Load Saved Deck"
      maxWidth="lg"
    >
      {savedDecks.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No saved decks found.</p>
      ) : (
        <div className="space-y-3">
          {savedDecks.map((deck) => (
            <div
              key={deck.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{deck.label}</h3>
                  <p className="text-sm text-gray-500">
                    Created: {new Date(deck.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    onLoadDeck(deck);
                    onClose();
                  }}
                >
                  Load
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
}
