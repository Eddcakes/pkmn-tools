"use client";

import { useConvexAuth, useMutation } from "convex/react";
import { useEffect, useRef } from "react";
import { api } from "../../convex/_generated/api";
import {
  getMatchupRecords,
  replaceMatchupRecords
} from "../utils/matchupRecords";
import {
  getMatchupSettings,
  saveMatchupSettings
} from "../utils/matchupSettings";
import { getSavedDecks, replaceSavedDecks } from "../utils/savedDecks";

/**
 * Runs once when the user logs in. Merges localStorage data into Convex via a single server-side action.
 * This approach avoids always-on subscriptions and performs the entire sync in one transactional call.
 *
 * For records/decks: merges by clientId, keeping the version with the latest updatedAt.
 * For settings: localStorage wins if Convex has none; otherwise Convex wins.
 */
export function useSyncOnLogin() {
  const { isAuthenticated } = useConvexAuth();
  const hasSynced = useRef(false);
  const syncMutation = useMutation(api.syncLocalData.syncOnLogin);

  useEffect(() => {
    // Reset sync flag on logout so it can re-sync on next login
    if (!isAuthenticated) {
      hasSynced.current = false;
      return;
    }

    // Skip if already synced in this session
    if (hasSynced.current) {
      return;
    }

    hasSynced.current = true;

    // Gather local data and call sync action
    const localDecks = getSavedDecks();
    const localRecords = getMatchupRecords();
    const localSettingsData = getMatchupSettings();

    syncMutation({
      localDecks,
      localRecords: localRecords.map((r) => ({
        ...r,
        updatedAt: r.updatedAt ?? r.createdAt
      })),
      localSettings: {
        defaultFormat: localSettingsData.defaultFormat,
        defaultSet: localSettingsData.defaultSet,
        recentUserPrimary: localSettingsData.recentUserPrimary,
        recentUserSecondary: localSettingsData.recentUserSecondary,
        recentOpponentPrimary: localSettingsData.recentOpponentPrimary,
        recentOpponentSecondary: localSettingsData.recentOpponentSecondary
      }
    })
      .then((result) => {
        replaceSavedDecks(result.decks);
        replaceMatchupRecords(result.records);
        saveMatchupSettings({
          ...localSettingsData,
          defaultFormat: result.settings.defaultFormat,
          defaultSet: result.settings.defaultSet,
          recentUserPrimary:
            result.settings.recentUserPrimary ??
            localSettingsData.recentUserPrimary,
          recentUserSecondary:
            result.settings.recentUserSecondary ??
            localSettingsData.recentUserSecondary,
          recentOpponentPrimary:
            result.settings.recentOpponentPrimary ??
            localSettingsData.recentOpponentPrimary,
          recentOpponentSecondary:
            result.settings.recentOpponentSecondary ??
            localSettingsData.recentOpponentSecondary
        });
      })
      .catch((error) => {
        console.error("Sync on login failed:", error);
        // Reset hasSynced to allow retry on next authentication attempt
        hasSynced.current = false;
      });
  }, [isAuthenticated, syncMutation]);
}
