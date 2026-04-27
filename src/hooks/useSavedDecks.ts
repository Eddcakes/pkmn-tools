"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import {
  deleteSavedDeck as lsDelete,
  getSavedDecks as lsGet,
  saveDeck as lsSave,
  updateSavedDeck as lsUpdate,
  type SavedDeck
} from "../utils/savedDecks";

export function useSavedDecks() {
  const { isAuthenticated } = useConvexAuth();

  const convexDecks = useQuery(
    api.savedDecks.list,
    isAuthenticated ? {} : "skip"
  );

  const convexUpsert = useMutation(api.savedDecks.upsert);
  const convexUpdate = useMutation(api.savedDecks.update);
  const convexRemove = useMutation(api.savedDecks.remove);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const localDecks = mounted && !isAuthenticated ? lsGet() : null;

  const decks: SavedDeck[] = isAuthenticated
    ? (convexDecks ?? []).map((d) => ({
        id: d.clientId,
        label: d.label,
        deckList: d.deckList,
        archetype: d.archetype,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt
      }))
    : (localDecks ?? []);

  const saveDeck = useCallback(
    async (label: string, deckList: string, archetype?: string[]) => {
      // Always write to localStorage
      const deck = lsSave(label, deckList, archetype);

      if (isAuthenticated) {
        await convexUpsert({
          clientId: deck.id,
          label: deck.label,
          deckList: deck.deckList,
          archetype: deck.archetype,
          createdAt: deck.createdAt,
          updatedAt: deck.updatedAt
        });
      }

      return deck;
    },
    [isAuthenticated, convexUpsert]
  );

  const updateDeck = useCallback(
    async (
      id: string,
      label: string,
      deckList: string,
      archetype?: string[]
    ) => {
      const updated = lsUpdate(id, label, deckList, archetype);
      if (!updated) return null;

      if (isAuthenticated) {
        await convexUpdate({
          clientId: id,
          label,
          deckList,
          archetype,
          updatedAt: updated.updatedAt
        });
      }

      return updated;
    },
    [isAuthenticated, convexUpdate]
  );

  const deleteDeck = useCallback(
    async (id: string) => {
      lsDelete(id);

      if (isAuthenticated) {
        await convexRemove({ clientId: id });
      }
    },
    [isAuthenticated, convexRemove]
  );

  return {
    decks,
    saveDeck,
    updateDeck,
    deleteDeck,
    isLoading: !mounted || (isAuthenticated && convexDecks === undefined)
  };
}
