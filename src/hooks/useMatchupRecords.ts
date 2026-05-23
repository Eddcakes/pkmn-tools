"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore
} from "react";
import { api } from "../../convex/_generated/api";
import { resolvePokemonSlots } from "../utils/archetypePokemon";
import {
  deleteMatchupRecord as lsDelete,
  getMatchupRecords as lsGet,
  saveMatchupRecord as lsSave,
  updateMatchupRecord as lsUpdate,
  type MatchupRecord
} from "../utils/matchupRecords";

function ensurePokemonSlotFields(record: MatchupRecord): MatchupRecord {
  const userSlots = resolvePokemonSlots(
    record.userArchetype,
    record.userPrimaryPokemon,
    record.userSecondaryPokemon
  );
  const opponentSlots = resolvePokemonSlots(
    record.opponentArchetype,
    record.opponentPrimaryPokemon,
    record.opponentSecondaryPokemon
  );

  return {
    ...record,
    userPrimaryPokemon: userSlots.primaryPokemon,
    userSecondaryPokemon: userSlots.secondaryPokemon,
    opponentPrimaryPokemon: opponentSlots.primaryPokemon,
    opponentSecondaryPokemon: opponentSlots.secondaryPokemon
  };
}

const EMPTY_RECORDS_SNAPSHOT: MatchupRecord[] = [];
const MATCHUP_RECORDS_STORAGE_KEY = "pokemon-matchup-records";
const ARCHETYPE_BACKFILL_FLAG_KEY = "matchup-records-archetype-backfill-v4";

let cachedLocalRecordsRaw: string | null | undefined;
let cachedLocalRecordsSnapshot: MatchupRecord[] = EMPTY_RECORDS_SNAPSHOT;

const getLocalRecordsSnapshot = (): MatchupRecord[] => {
  if (typeof window === "undefined") {
    return EMPTY_RECORDS_SNAPSHOT;
  }

  const raw = window.localStorage.getItem(MATCHUP_RECORDS_STORAGE_KEY);
  if (raw === cachedLocalRecordsRaw) {
    return cachedLocalRecordsSnapshot;
  }

  cachedLocalRecordsRaw = raw;
  cachedLocalRecordsSnapshot = lsGet();
  return cachedLocalRecordsSnapshot;
};

const getServerRecordsSnapshot = () => EMPTY_RECORDS_SNAPSHOT;

const subscribeToRecordsStore = () => () => {};

export function useMatchupRecords() {
  const { isAuthenticated } = useConvexAuth();

  const convexRecords = useQuery(
    api.matchupRecords.list,
    isAuthenticated ? {} : "skip"
  );

  const convexUpsert = useMutation(api.matchupRecords.upsert);
  const convexUpdate = useMutation(api.matchupRecords.update);
  const convexRemove = useMutation(api.matchupRecords.remove);
  const convexBackfillArchetypePokemon = useMutation(
    api.migrateArchetypePokemon.backfillForCurrentUser
  );
  const hasRequestedBackfill = useRef(false);

  const localRecordsSnapshot = useSyncExternalStore(
    subscribeToRecordsStore,
    getLocalRecordsSnapshot,
    getServerRecordsSnapshot
  );
  const [localRecordsOverride, setLocalRecordsOverride] = useState<
    MatchupRecord[] | null
  >(null);
  const localRecordsFallback = localRecordsOverride ?? localRecordsSnapshot;

  useEffect(() => {
    if (
      !isAuthenticated ||
      convexRecords === undefined ||
      hasRequestedBackfill.current
    ) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    if (window.localStorage.getItem(ARCHETYPE_BACKFILL_FLAG_KEY) === "done") {
      return;
    }

    hasRequestedBackfill.current = true;

    void convexBackfillArchetypePokemon({})
      .then(() => {
        window.localStorage.setItem(ARCHETYPE_BACKFILL_FLAG_KEY, "done");
      })
      .catch((error: unknown) => {
        console.error("Failed to backfill archetype pokemon slots:", error);
        hasRequestedBackfill.current = false;
      });
  }, [isAuthenticated, convexRecords, convexBackfillArchetypePokemon]);

  const records: MatchupRecord[] =
    // For authenticated users: prefer Convex data, fall back to localStorage while loading
    isAuthenticated && convexRecords !== undefined
      ? convexRecords
          .map((r) => ({
            id: r.clientId,
            userArchetype: r.userArchetype,
            opponentArchetype: r.opponentArchetype,
            userPrimaryPokemon: r.userPrimaryPokemon,
            userSecondaryPokemon: r.userSecondaryPokemon,
            opponentPrimaryPokemon: r.opponentPrimaryPokemon,
            opponentSecondaryPokemon: r.opponentSecondaryPokemon,
            format: r.format,
            latestSet: r.latestSet,
            result: r.result,
            notes: r.notes,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt
          }))
          .map(ensurePokemonSlotFields)
      : // For unauthenticated users or while Convex is loading: use localStorage
        localRecordsFallback.map(ensurePokemonSlotFields);

  const saveRecord = useCallback(
    async (
      userArchetype: string,
      opponentArchetype: string,
      result: "win" | "loss" | "tie",
      userPrimaryPokemon?: string,
      userSecondaryPokemon?: string,
      opponentPrimaryPokemon?: string,
      opponentSecondaryPokemon?: string,
      latestSet?: string,
      notes?: string,
      format?: string
    ) => {
      const record = lsSave(
        userArchetype,
        opponentArchetype,
        result,
        userPrimaryPokemon,
        userSecondaryPokemon,
        opponentPrimaryPokemon,
        opponentSecondaryPokemon,
        latestSet,
        notes,
        format
      );
      setLocalRecordsOverride((prev) => [
        ...(prev ?? localRecordsFallback),
        record
      ]);

      if (isAuthenticated) {
        await convexUpsert({
          clientId: record.id,
          userArchetype: record.userArchetype,
          opponentArchetype: record.opponentArchetype,
          userPrimaryPokemon: record.userPrimaryPokemon,
          userSecondaryPokemon: record.userSecondaryPokemon,
          opponentPrimaryPokemon: record.opponentPrimaryPokemon,
          opponentSecondaryPokemon: record.opponentSecondaryPokemon,
          format: record.format,
          latestSet: record.latestSet,
          result: record.result,
          notes: record.notes,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt ?? record.createdAt
        });
      }

      return record;
    },
    [isAuthenticated, convexUpsert, localRecordsFallback]
  );

  const updateRecord = useCallback(
    async (
      id: string,
      updates: Partial<Omit<MatchupRecord, "id" | "createdAt">>
    ) => {
      const updated = lsUpdate(id, updates);
      if (!updated) return null;
      setLocalRecordsOverride((prev) =>
        (prev ?? localRecordsFallback).map((record) =>
          record.id === id ? updated : record
        )
      );

      if (isAuthenticated) {
        await convexUpdate({
          clientId: id,
          ...updates,
          updatedAt: updated.updatedAt ?? new Date().toISOString()
        });
      }

      return updated;
    },
    [isAuthenticated, convexUpdate, localRecordsFallback]
  );

  const deleteRecord = useCallback(
    async (id: string) => {
      lsDelete(id);
      setLocalRecordsOverride((prev) =>
        (prev ?? localRecordsFallback).filter((record) => record.id !== id)
      );
      if (isAuthenticated) {
        await convexRemove({ clientId: id });
      }
    },
    [isAuthenticated, convexRemove, localRecordsFallback]
  );

  return {
    records,
    saveRecord,
    updateRecord,
    deleteRecord,
    // Show loading state only while Convex is still fetching for authenticated users
    isLoading: isAuthenticated && convexRecords === undefined
  };
}
