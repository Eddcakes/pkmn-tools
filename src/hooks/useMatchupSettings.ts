"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useCallback, useState } from "react";
import { api } from "../../convex/_generated/api";
import {
  getMatchupSettings as lsGet,
  saveMatchupSettings as lsSave,
  type MatchupSettings
} from "../utils/matchupSettings";

export function useMatchupSettings() {
  const { isAuthenticated } = useConvexAuth();

  const convexSettings = useQuery(
    api.matchupSettings.get,
    isAuthenticated ? {} : "skip"
  );

  const convexUpsert = useMutation(api.matchupSettings.upsert);

  const [localSettingsFallback, setLocalSettingsFallback] =
    useState<MatchupSettings>(() => lsGet());

  const settings: MatchupSettings =
    // For authenticated users: prefer Convex data, fall back to localStorage while loading
    isAuthenticated && convexSettings !== undefined && convexSettings !== null
      ? {
          useRecentArchetypes: convexSettings.useRecentArchetypes,
          useFavouriteArchetypes: convexSettings.useFavouriteArchetypes,
          recentArchetypes: convexSettings.recentArchetypes,
          favouriteArchetypes: convexSettings.favouriteArchetypes,
          customArchetypes: convexSettings.customArchetypes,
          defaultSet: convexSettings.defaultSet,
          availableSets:
            convexSettings.availableSets ??
            localSettingsFallback?.availableSets ??
            lsGet().availableSets
        }
      : // For unauthenticated users or while Convex is loading: use localStorage
        localSettingsFallback;

  const saveSettings = useCallback(
    async (newSettings: MatchupSettings) => {
      lsSave(newSettings);
      setLocalSettingsFallback(newSettings);
      if (isAuthenticated) {
        await convexUpsert(newSettings);
      }
    },
    [isAuthenticated, convexUpsert]
  );

  return {
    settings,
    saveSettings,
    isLoading: isAuthenticated && convexSettings === undefined
  };
}
