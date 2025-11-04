"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { ImportDeckModal } from "../../features/ImportDeckModal";
import { EditDeckModal } from "../../features/EditDeckModal";
import {
  getSavedDecks,
  deleteSavedDeck,
  exportDeckToClipboard,
  type SavedDeck,
} from "../../utils/savedDecks";
import { Tag } from "@/components/Tag";
import { archetypeToTagType } from "@/utils/archetype";
import { Alert } from "@/components/Alert";

export default function SavedDecksPage() {
  const [savedDecks, setSavedDecks] = useState<SavedDeck[]>([]);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<SavedDeck | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadSavedDecks();
  }, []);

  const loadSavedDecks = () => {
    setLoading(true);
    const decks = getSavedDecks();
    setSavedDecks(decks);
    setLoading(false);
  };

  const handleDeleteDeck = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this deck?")) {
      try {
        const success = deleteSavedDeck(id);
        if (success) {
          loadSavedDecks();
          setMessage("Deck deleted successfully");
          setTimeout(() => setMessage(""), 3000);
        }
      } catch (error) {
        setMessage("Failed to delete deck");
        setTimeout(() => setMessage(""), 3000);
      }
    }
  };

  const handleExportDeck = async (deck: SavedDeck) => {
    try {
      await exportDeckToClipboard(deck.deckList);
      setMessage("Deck copied to clipboard!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("Failed to copy deck to clipboard");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleEditDeck = (deck: SavedDeck) => {
    setEditingDeck(deck);
    setEditModalOpen(true);
  };

  const handleImportComplete = () => {
    loadSavedDecks();
    setMessage("Deck imported successfully!");
    setTimeout(() => setMessage(""), 3000);
  };

  const handleEditComplete = () => {
    loadSavedDecks();
    setMessage("Deck updated successfully!");
    setTimeout(() => setMessage(""), 3000);
  };

  const handleEditModalClose = () => {
    setEditModalOpen(false);
    setEditingDeck(null);
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="text-center">Loading saved decks...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Saved Decks</h1>
        <div className="flex gap-4">
          <Link href="/">
            <Button variant="secondary">Home</Button>
          </Link>
          <Link href="/comparison">
            <Button variant="secondary">Back to Comparison</Button>
          </Link>
          <Button onClick={() => setImportModalOpen(true)}>Import Deck</Button>
        </div>
      </div>

      {message && (
        <Alert
          intent="success"
          dismissible
          onDismiss={() => setMessage("")}
          className="pb-4"
        >
          {message}
        </Alert>
      )}

      {savedDecks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            {/* move to icons */}
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No saved decks
          </h3>
          <p className="text-gray-500 mb-6">
            Get started by importing a deck or saving one from the comparison
            page.
          </p>
          <Button onClick={() => setImportModalOpen(true)}>
            Import Your First Deck
          </Button>
        </div>
      ) : (
        <div className="grid gap-6">
          {savedDecks.map((deck) => (
            <Card key={deck.id}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {deck.label}
                  </h2>
                  {deck.archetype && (
                    <div className="gap-2 flex flex-wrap">
                      {deck.archetype.map((tag) => (
                        <Tag
                          key={tag}
                          label={tag}
                          type={archetypeToTagType(tag)}
                        />
                      ))}
                    </div>
                  )}
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>
                      Created: {new Date(deck.createdAt).toLocaleDateString()}
                    </p>
                    <p>
                      Updated: {new Date(deck.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleEditDeck(deck)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleExportDeck(deck)}
                  >
                    Copy to Clipboard
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDeleteDeck(deck.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-md p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Deck List Preview:
                </h3>
                <pre className="text-xs text-gray-600 font-mono whitespace-pre-wrap overflow-auto max-h-48">
                  {deck.deckList.split("\n").slice(0, 10).join("\n")}
                  {deck.deckList.split("\n").length > 10 && "\n..."}
                </pre>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Import Modal */}
      <ImportDeckModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImported={handleImportComplete}
      />

      {/* Edit Modal */}
      <EditDeckModal
        isOpen={editModalOpen}
        onClose={handleEditModalClose}
        onUpdated={handleEditComplete}
        deck={editingDeck}
      />
    </div>
  );
}
