"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useState } from "react";
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

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const localRecords = mounted && !isAuthenticated ? lsGet() : null;

  const records: MatchupRecord[] = isAuthenticated
    ? (convexRecords ?? []).map((r) => ({
        id: r.clientId,
        userArchetype: r.userArchetype,
        opponentArchetype: r.opponentArchetype,
        result: r.result,
        notes: r.notes,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      }))
    : (localRecords ?? []);

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
    isLoading: !mounted || (isAuthenticated && convexRecords === undefined)
  };
}
