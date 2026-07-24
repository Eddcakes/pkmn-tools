"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  AVAILABLE_FORMATS,
  AVAILABLE_LATEST_SETS
} from "../utils/matchupSettings";

export function useMatchupCatalog() {
  const catalog = useQuery(api.matchupCatalog.list, {});

  return {
    formats: catalog?.formats.map((item) => item.value) ?? AVAILABLE_FORMATS,
    latestSets:
      catalog?.latestSets.map((item) => item.value) ?? AVAILABLE_LATEST_SETS,
    isLoading: catalog === undefined
  };
}
