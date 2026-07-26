"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useMatchupCatalog() {
  const catalog = useQuery(api.matchupCatalog.list, {});

  const formats = catalog?.formats.map((item) => item.value) ?? [];
  const latestSets = catalog?.latestSets.map((item) => item.value) ?? [];

  return {
    formats: [...formats].reverse(),
    latestSets: [...latestSets].reverse(),
    isLoading: catalog === undefined
  };
}
