"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useCallback, useState, useSyncExternalStore } from "react";
import { api } from "../../convex/_generated/api";
import {
  getMatchupSettings as lsGet,
  saveMatchupSettings as lsSave,
  type MatchupSettings
} from "../utils/matchupSettings";

const DEFAULT_SETTINGS_SNAPSHOT: MatchupSettings = {
  useRecentArchetypes: true,
  useFavouriteArchetypes: false,
  recentArchetypes: [],
  favouriteArchetypes: [],
  customArchetypes: "",
  defaultFormat: undefined,
  defaultLatestSet: undefined
};

let cachedLocalSettingsRaw: string | null | undefined;
let cachedLocalSettingsSnapshot: MatchupSettings = DEFAULT_SETTINGS_SNAPSHOT;

const getLocalSettingsSnapshot = (): MatchupSettings => {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS_SNAPSHOT;
  }

  const raw = window.localStorage.getItem("pokemon-matchup-settings");
  if (raw === cachedLocalSettingsRaw) {
    return cachedLocalSettingsSnapshot;
  }

  cachedLocalSettingsRaw = raw;
  cachedLocalSettingsSnapshot = lsGet();
  return cachedLocalSettingsSnapshot;
};

const getServerSettingsSnapshot = () => DEFAULT_SETTINGS_SNAPSHOT;

const subscribeToSettingsStore = () => () => {};

export function useMatchupSettings() {
  const { isAuthenticated } = useConvexAuth();

  const convexSettings = useQuery(
    api.matchupSettings.get,
    isAuthenticated ? {} : "skip"
  );

  const convexUpsert = useMutation(api.matchupSettings.upsert);

  const localSettingsSnapshot = useSyncExternalStore(
    subscribeToSettingsStore,
    getLocalSettingsSnapshot,
    getServerSettingsSnapshot
  );
  const [localSettingsOverride, setLocalSettingsOverride] =
    useState<MatchupSettings | null>(null);
  const localSettingsFallback = localSettingsOverride ?? localSettingsSnapshot;

  const settings: MatchupSettings =
    // For authenticated users: prefer Convex data, fall back to localStorage while loading
    isAuthenticated && convexSettings !== undefined && convexSettings !== null
      ? {
          useRecentArchetypes: convexSettings.useRecentArchetypes,
          useFavouriteArchetypes: convexSettings.useFavouriteArchetypes,
          recentArchetypes: convexSettings.recentArchetypes,
          favouriteArchetypes: convexSettings.favouriteArchetypes,
          customArchetypes: convexSettings.customArchetypes,
          defaultFormat: convexSettings.defaultFormat,
          defaultLatestSet: convexSettings.defaultLatestSet
        }
      : // For unauthenticated users or while Convex is loading: use localStorage
        localSettingsFallback;

  const saveSettings = useCallback(
    async (newSettings: MatchupSettings) => {
      lsSave(newSettings);
      setLocalSettingsOverride(newSettings);
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
