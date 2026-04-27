"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEffect, useRef } from "react";
import { api } from "../../convex/_generated/api";
import { getMatchupRecords } from "../utils/matchupRecords";
import { getMatchupSettings } from "../utils/matchupSettings";
import { getSavedDecks } from "../utils/savedDecks";

/**
 * Runs once when the user logs in. Merges localStorage data into Convex:
 * - For records/decks: merge by clientId, keeping the version with the latest updatedAt.
 * - For settings: localStorage wins if Convex has none; otherwise Convex wins.
 */
export function useSyncOnLogin() {
  const { isAuthenticated } = useConvexAuth();
  const hasSynced = useRef(false);

  const convexDecks = useQuery(
    api.savedDecks.list,
    isAuthenticated ? {} : "skip"
  );
  const convexRecords = useQuery(
    api.matchupRecords.list,
    isAuthenticated ? {} : "skip"
  );
  const convexSettings = useQuery(
    api.matchupSettings.get,
    isAuthenticated ? {} : "skip"
  );

  const upsertDeck = useMutation(api.savedDecks.upsert);
  const upsertRecord = useMutation(api.matchupRecords.upsert);
  const upsertSettings = useMutation(api.matchupSettings.upsert);

  useEffect(() => {
    // Wait until authenticated and all queries have resolved
    if (
      !isAuthenticated ||
      hasSynced.current ||
      convexDecks === undefined ||
      convexRecords === undefined ||
      convexSettings === undefined
    ) {
      return;
    }

    hasSynced.current = true;

    const localDecks = getSavedDecks();
    const localRecords = getMatchupRecords();
    const localSettingsData = getMatchupSettings();

    // Merge saved decks — for each local deck, upsert only if newer than server version
    const serverDeckMap = new Map(convexDecks.map((d) => [d.clientId, d]));
    for (const local of localDecks) {
      const server = serverDeckMap.get(local.id);
      const localTime = new Date(local.updatedAt).getTime();
      const serverTime = server ? new Date(server.updatedAt).getTime() : 0;

      if (localTime >= serverTime) {
        upsertDeck({
          clientId: local.id,
          label: local.label,
          deckList: local.deckList,
          archetype: local.archetype,
          createdAt: local.createdAt,
          updatedAt: local.updatedAt
        }).catch(console.error);
      }
    }

    // Merge matchup records
    const serverRecordMap = new Map(convexRecords.map((r) => [r.clientId, r]));
    for (const local of localRecords) {
      const server = serverRecordMap.get(local.id);
      const localTime = new Date(local.updatedAt ?? local.createdAt).getTime();
      const serverTime = server ? new Date(server.updatedAt).getTime() : 0;

      if (localTime >= serverTime) {
        upsertRecord({
          clientId: local.id,
          userArchetype: local.userArchetype,
          opponentArchetype: local.opponentArchetype,
          result: local.result,
          notes: local.notes,
          createdAt: local.createdAt,
          updatedAt: local.updatedAt ?? local.createdAt
        }).catch(console.error);
      }
    }

    // Merge settings — only push local if server has no settings yet
    if (!convexSettings) {
      upsertSettings(localSettingsData).catch(console.error);
    }
  }, [
    isAuthenticated,
    convexDecks,
    convexRecords,
    convexSettings,
    upsertDeck,
    upsertRecord,
    upsertSettings
  ]);
}
