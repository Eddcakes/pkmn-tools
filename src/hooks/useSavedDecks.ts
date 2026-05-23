"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useCallback, useSyncExternalStore } from "react";
import { api } from "../../convex/_generated/api";
import {
  deleteSavedDeck as lsDelete,
  getSavedDecks as lsGet,
  saveDeck as lsSave,
  updateSavedDeck as lsUpdate,
  type SavedDeck,
  subscribeSavedDecks
} from "../utils/savedDecks";

const EMPTY_SAVED_DECKS: SavedDeck[] = [];

let cachedLocalDecksSnapshot: SavedDeck[] = EMPTY_SAVED_DECKS;
let cachedLocalDecksSerialized = "";

function getLocalDecksSnapshot(): SavedDeck[] {
  const nextDecks = lsGet();
  const nextSerialized = JSON.stringify(nextDecks);

  if (nextSerialized === cachedLocalDecksSerialized) {
    return cachedLocalDecksSnapshot;
  }

  cachedLocalDecksSerialized = nextSerialized;
  cachedLocalDecksSnapshot = nextDecks;
  return nextDecks;
}

function getLocalDecksServerSnapshot(): SavedDeck[] {
  return EMPTY_SAVED_DECKS;
}

export function useSavedDecks() {
  const { isAuthenticated } = useConvexAuth();

  const convexDecks = useQuery(
    api.savedDecks.list,
    isAuthenticated ? {} : "skip"
  );

  const convexUpsert = useMutation(api.savedDecks.upsert);
  const convexUpdate = useMutation(api.savedDecks.update);
  const convexRemove = useMutation(api.savedDecks.remove);

  const localDecksFallback = useSyncExternalStore<SavedDeck[]>(
    subscribeSavedDecks,
    getLocalDecksSnapshot,
    getLocalDecksServerSnapshot
  );

  const decks: SavedDeck[] =
    // For authenticated users: prefer Convex data, fall back to localStorage while loading
    isAuthenticated && convexDecks !== undefined
      ? convexDecks.map((d) => ({
          id: d.clientId,
          label: d.label,
          deckList: d.deckList,
          primaryPokemon: d.primaryPokemon,
          secondaryPokemon: d.secondaryPokemon,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt
        }))
      : // For unauthenticated users or while Convex is loading: use localStorage
        localDecksFallback;

  const saveDeck = useCallback(
    async (
      label: string,
      deckList: string,
      primaryPokemon?: string,
      secondaryPokemon?: string
    ) => {
      // Always write to localStorage
      const deck = lsSave(label, deckList, primaryPokemon, secondaryPokemon);

      if (isAuthenticated) {
        await convexUpsert({
          clientId: deck.id,
          label: deck.label,
          deckList: deck.deckList,
          primaryPokemon: deck.primaryPokemon,
          secondaryPokemon: deck.secondaryPokemon,
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
      primaryPokemon?: string | null,
      secondaryPokemon?: string | null
    ) => {
      const updated = lsUpdate(
        id,
        label,
        deckList,
        primaryPokemon,
        secondaryPokemon
      );
      if (!updated) return null;

      if (isAuthenticated) {
        const hasPrimaryPokemonUpdate = primaryPokemon !== undefined;
        const hasSecondaryPokemonUpdate = secondaryPokemon !== undefined;
        const normalizedPrimaryPokemon = primaryPokemon?.trim()
          ? primaryPokemon.trim()
          : undefined;
        const normalizedSecondaryPokemon = secondaryPokemon?.trim()
          ? secondaryPokemon.trim()
          : undefined;

        await convexUpdate({
          clientId: id,
          label,
          deckList,
          ...(hasPrimaryPokemonUpdate
            ? { primaryPokemon: normalizedPrimaryPokemon }
            : {}),
          ...(hasSecondaryPokemonUpdate
            ? { secondaryPokemon: normalizedSecondaryPokemon }
            : {}),
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
    isLoading: isAuthenticated && convexDecks === undefined
  };
}
