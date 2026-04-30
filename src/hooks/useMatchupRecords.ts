"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useCallback, useState } from "react";
import { api } from "../../convex/_generated/api";
import {
  deleteMatchupRecord as lsDelete,
  getMatchupRecords as lsGet,
  saveMatchupRecord as lsSave,
  updateMatchupRecord as lsUpdate,
  type MatchupRecord
} from "../utils/matchupRecords";

export function useMatchupRecords() {
  const { isAuthenticated } = useConvexAuth();

  const convexRecords = useQuery(
    api.matchupRecords.list,
    isAuthenticated ? {} : "skip"
  );

  const convexUpsert = useMutation(api.matchupRecords.upsert);
  const convexUpdate = useMutation(api.matchupRecords.update);
  const convexRemove = useMutation(api.matchupRecords.remove);

  const [localRecordsFallback] = useState<MatchupRecord[]>(() => lsGet());

  const records: MatchupRecord[] =
    // For authenticated users: prefer Convex data, fall back to localStorage while loading
    isAuthenticated && convexRecords !== undefined
      ? convexRecords.map((r) => ({
          id: r.clientId,
          userArchetype: r.userArchetype,
          opponentArchetype: r.opponentArchetype,
          result: r.result,
          notes: r.notes,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt
        }))
      : // For unauthenticated users or while Convex is loading: use localStorage
        localRecordsFallback;

  const saveRecord = useCallback(
    async (
      userArchetype: string,
      opponentArchetype: string,
      result: "win" | "loss" | "tie",
      notes?: string
    ) => {
      const record = lsSave(userArchetype, opponentArchetype, result, notes);

      if (isAuthenticated) {
        await convexUpsert({
          clientId: record.id,
          userArchetype: record.userArchetype,
          opponentArchetype: record.opponentArchetype,
          result: record.result,
          notes: record.notes,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt ?? record.createdAt
        });
      }

      return record;
    },
    [isAuthenticated, convexUpsert]
  );

  const updateRecord = useCallback(
    async (
      id: string,
      updates: Partial<Omit<MatchupRecord, "id" | "createdAt">>
    ) => {
      const updated = lsUpdate(id, updates);
      if (!updated) return null;

      if (isAuthenticated) {
        await convexUpdate({
          clientId: id,
          ...updates,
          updatedAt: updated.updatedAt ?? new Date().toISOString()
        });
      }

      return updated;
    },
    [isAuthenticated, convexUpdate]
  );

  const deleteRecord = useCallback(
    async (id: string) => {
      lsDelete(id);
      if (isAuthenticated) {
        await convexRemove({ clientId: id });
      }
    },
    [isAuthenticated, convexRemove]
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
