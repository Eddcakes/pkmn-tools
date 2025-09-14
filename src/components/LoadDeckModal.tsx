import React, { useState } from "react";
import { Button } from "./Button";
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Load Saved Deck</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {savedDecks.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No saved decks found.
          </p>
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

        <div className="mt-6 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
