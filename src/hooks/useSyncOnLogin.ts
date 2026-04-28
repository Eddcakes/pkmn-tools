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
 *
 * Uses batch mutations for better performance and only marks sync complete after
 * all mutations succeed, ensuring data integrity on logout/login cycles.
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

  const batchUpsertDecks = useMutation(api.savedDecks.batchUpsert);
  const batchUpsertRecords = useMutation(api.matchupRecords.batchUpsert);
  const upsertSettings = useMutation(api.matchupSettings.upsert);

  useEffect(() => {
    // Reset sync flag on logout so it can re-sync on next login
    if (!isAuthenticated) {
      hasSynced.current = false;
      return;
    }

    // Wait until authenticated and all queries have resolved
    if (
      hasSynced.current ||
      convexDecks === undefined ||
      convexRecords === undefined ||
      convexSettings === undefined
    ) {
      return;
    }

    const localDecks = getSavedDecks();
    const localRecords = getMatchupRecords();
    const localSettingsData = getMatchupSettings();

    // Collect decks that need syncing (newer on client than server)
    const serverDeckMap = new Map(convexDecks.map((d) => [d.clientId, d]));
    const decksToSync = localDecks.filter((local) => {
      const server = serverDeckMap.get(local.id);
      const localTime = new Date(local.updatedAt).getTime();
      const serverTime = server ? new Date(server.updatedAt).getTime() : 0;
      return localTime >= serverTime;
    });

    // Collect records that need syncing (newer on client than server)
    const serverRecordMap = new Map(convexRecords.map((r) => [r.clientId, r]));
    const recordsToSync = localRecords.filter((local) => {
      const server = serverRecordMap.get(local.id);
      const localTime = new Date(local.updatedAt ?? local.createdAt).getTime();
      const serverTime = server ? new Date(server.updatedAt).getTime() : 0;
      return localTime >= serverTime;
    });

    // Execute all mutations and wait for completion before marking sync done
    const syncPromises = [];

    // Batch upsert decks if any need syncing
    if (decksToSync.length > 0) {
      syncPromises.push(
        batchUpsertDecks({
          decks: decksToSync.map((d) => ({
            clientId: d.id,
            label: d.label,
            deckList: d.deckList,
            archetype: d.archetype,
            createdAt: d.createdAt,
            updatedAt: d.updatedAt
          }))
        })
      );
    }

    // Batch upsert records if any need syncing
    if (recordsToSync.length > 0) {
      syncPromises.push(
        batchUpsertRecords({
          records: recordsToSync.map((r) => ({
            clientId: r.id,
            userArchetype: r.userArchetype,
            opponentArchetype: r.opponentArchetype,
            result: r.result,
            notes: r.notes,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt ?? r.createdAt
          }))
        })
      );
    }

    // Upsert settings only if server has none yet
    if (!convexSettings) {
      syncPromises.push(upsertSettings(localSettingsData));
    }

    // Wait for all mutations to complete before marking sync as done
    Promise.all(syncPromises)
      .then(() => {
        hasSynced.current = true;
      })
      .catch((error) => {
        console.error("Sync on login failed:", error);
        // Don't set hasSynced to true, allowing retry on next login
      });
  }, [
    isAuthenticated,
    convexDecks,
    convexRecords,
    convexSettings,
    batchUpsertDecks,
    batchUpsertRecords,
    upsertSettings
  ]);
}
