"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useState } from "react";
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

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const localSettings = mounted ? lsGet() : null;

  const settings: MatchupSettings =
    isAuthenticated && convexSettings
      ? {
          useRecentArchetypes: convexSettings.useRecentArchetypes,
          useFavouriteArchetypes: convexSettings.useFavouriteArchetypes,
          recentArchetypes: convexSettings.recentArchetypes,
          favouriteArchetypes: convexSettings.favouriteArchetypes,
          customArchetypes: convexSettings.customArchetypes
        }
      : (localSettings ?? lsGet());

  const saveSettings = useCallback(
    async (newSettings: MatchupSettings) => {
      lsSave(newSettings);
      if (isAuthenticated) {
        await convexUpsert(newSettings);
      }
    },
    [isAuthenticated, convexUpsert]
  );

  return {
    settings,
    saveSettings,
    isLoading: !mounted || (isAuthenticated && convexSettings === undefined)
  };
}
