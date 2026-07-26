import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { internalMutation, query } from "./_generated/server";

// Oldest -> newest so new releases can be appended at max sortOrder + 1.
export const DEFAULT_FORMATS = ["D-on", "E-on", "F-on", "G-on", "H-on"];
export const DEFAULT_LATEST_SETS = ["MEG", "PFL", "ASC", "POR", "CRI", "PBL"];

export type MatchupCatalogCategory = "format" | "set";

interface CatalogItem {
  value: string;
  sortOrder: number;
}

export interface MatchupCatalogSnapshot {
  formats: CatalogItem[];
  latestSets: CatalogItem[];
}

type CatalogQueryContext = Pick<QueryCtx, "db"> | Pick<MutationCtx, "db">;

const DEFAULT_SNAPSHOT: MatchupCatalogSnapshot = {
  formats: DEFAULT_FORMATS.map((value, index) => ({ value, sortOrder: index })),
  latestSets: DEFAULT_LATEST_SETS.map((value, index) => ({
    value,
    sortOrder: index
  }))
};

function trimCatalogValue(value: string): string {
  return value.trim();
}

function normalizeCatalogValue(
  category: MatchupCatalogCategory,
  value: string
): string {
  const trimmed = trimCatalogValue(value);
  return category === "set" ? trimmed.toUpperCase() : trimmed;
}

function dedupeAndSortCatalog(items: CatalogItem[]): CatalogItem[] {
  const seen = new Set<string>();
  const deduped: CatalogItem[] = [];

  for (const item of items) {
    const normalized = item.value.trim();
    if (!normalized) {
      continue;
    }

    const dedupeKey = normalized.toLowerCase();
    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    deduped.push({ value: normalized, sortOrder: item.sortOrder });
  }

  return deduped.sort((a, b) => a.sortOrder - b.sortOrder);
}

async function listCategoryItems(
  ctx: CatalogQueryContext,
  category: MatchupCatalogCategory
): Promise<CatalogItem[]> {
  const docs = await ctx.db
    .query("matchupCatalog")
    .withIndex("by_category_and_sort_order", (q) => q.eq("category", category))
    .collect();

  const activeDocs = docs.filter((doc) => doc.isActive ?? true);
  if (activeDocs.length === 0) {
    return category === "format"
      ? DEFAULT_SNAPSHOT.formats
      : DEFAULT_SNAPSHOT.latestSets;
  }

  return dedupeAndSortCatalog(
    activeDocs.map((doc) => ({
      value: normalizeCatalogValue(category, doc.value),
      sortOrder: doc.sortOrder
    }))
  );
}

export async function getMatchupCatalogSnapshot(
  ctx: CatalogQueryContext
): Promise<MatchupCatalogSnapshot> {
  const [formats, latestSets] = await Promise.all([
    listCategoryItems(ctx, "format"),
    listCategoryItems(ctx, "set")
  ]);

  return { formats, latestSets };
}

function normalizeOptionalSelection(
  value: string | undefined,
  catalogItems: CatalogItem[],
  category: MatchupCatalogCategory
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalized = normalizeCatalogValue(category, value);
  if (!normalized) {
    return undefined;
  }

  return catalogItems.some(
    (item) => item.value.toLowerCase() === normalized.toLowerCase()
  )
    ? normalized
    : undefined;
}

export async function normalizeOptionalFormatAndSet(
  ctx: CatalogQueryContext,
  values: {
    format?: string;
    latestSet?: string;
  }
): Promise<{
  format?: string;
  latestSet?: string;
}> {
  const { formats, latestSets } = await getMatchupCatalogSnapshot(ctx);

  return normalizeOptionalFormatAndSetFromSnapshot(
    {
      formats,
      latestSets
    },
    values
  );
}

export function normalizeOptionalFormatAndSetFromSnapshot(
  snapshot: MatchupCatalogSnapshot,
  values: {
    format?: string;
    latestSet?: string;
  }
): {
  format?: string;
  latestSet?: string;
} {
  const { formats, latestSets } = snapshot;

  return {
    format: normalizeOptionalSelection(values.format, formats, "format"),
    latestSet: normalizeOptionalSelection(values.latestSet, latestSets, "set")
  };
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    return getMatchupCatalogSnapshot(ctx);
  }
});

export const seedDefaults = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString();

    const existing = await ctx.db.query("matchupCatalog").take(1);
    if (existing.length > 0) {
      return { inserted: 0, skipped: true };
    }

    let inserted = 0;

    for (const [sortOrder, value] of DEFAULT_FORMATS.entries()) {
      await ctx.db.insert("matchupCatalog", {
        category: "format",
        value,
        sortOrder,
        isActive: true,
        createdAt: now,
        updatedAt: now
      });
      inserted += 1;
    }

    for (const [sortOrder, value] of DEFAULT_LATEST_SETS.entries()) {
      await ctx.db.insert("matchupCatalog", {
        category: "set",
        value,
        sortOrder,
        isActive: true,
        createdAt: now,
        updatedAt: now
      });
      inserted += 1;
    }

    return { inserted, skipped: false };
  }
});

async function replaceCategoryValuesInDb(
  ctx: MutationCtx,
  category: MatchupCatalogCategory,
  values: string[]
): Promise<number> {
  const normalizedValues = values
    .map((value) => normalizeCatalogValue(category, value))
    .filter((value) => value.length > 0);

  const seen = new Set<string>();
  const uniqueValues = normalizedValues.filter((value) => {
    const key = value.toLowerCase();
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });

  const existing = await ctx.db
    .query("matchupCatalog")
    .withIndex("by_category_and_sort_order", (q) => q.eq("category", category))
    .collect();

  for (const doc of existing) {
    await ctx.db.delete(doc._id);
  }

  const now = new Date().toISOString();

  for (const [sortOrder, value] of uniqueValues.entries()) {
    await ctx.db.insert("matchupCatalog", {
      category,
      value,
      sortOrder,
      isActive: true,
      createdAt: now,
      updatedAt: now
    });
  }

  return uniqueValues.length;
}

export const replaceCategoryValues = internalMutation({
  args: {
    category: v.union(v.literal("format"), v.literal("set")),
    values: v.array(v.string())
  },
  handler: async (ctx, args) => {
    const count = await replaceCategoryValuesInDb(
      ctx,
      args.category,
      args.values
    );

    return {
      category: args.category,
      count
    };
  }
});

export const resetToDefaultOrdering = internalMutation({
  args: {},
  handler: async (ctx) => {
    const formatCount = await replaceCategoryValuesInDb(
      ctx,
      "format",
      DEFAULT_FORMATS
    );
    const setCount = await replaceCategoryValuesInDb(
      ctx,
      "set",
      DEFAULT_LATEST_SETS
    );

    return {
      formats: formatCount,
      sets: setCount
    };
  }
});

export const appendCategoryValue = internalMutation({
  args: {
    category: v.union(v.literal("format"), v.literal("set")),
    value: v.string()
  },
  handler: async (ctx, args) => {
    const normalizedValue = normalizeCatalogValue(args.category, args.value);
    if (!normalizedValue) {
      throw new Error("Value cannot be empty");
    }

    const existingByValue = await ctx.db
      .query("matchupCatalog")
      .withIndex("by_category_and_value", (q) =>
        q.eq("category", args.category).eq("value", normalizedValue)
      )
      .first();

    if (existingByValue) {
      const now = new Date().toISOString();
      await ctx.db.patch(existingByValue._id, {
        isActive: true,
        updatedAt: now
      });

      return {
        category: args.category,
        value: normalizedValue,
        sortOrder: existingByValue.sortOrder,
        created: false,
        reactivated: true
      };
    }

    const categoryItems = await ctx.db
      .query("matchupCatalog")
      .withIndex("by_category_and_sort_order", (q) =>
        q.eq("category", args.category)
      )
      .collect();

    const nextSortOrder =
      categoryItems.reduce(
        (maxOrder, item) => Math.max(maxOrder, item.sortOrder),
        -1
      ) + 1;

    const now = new Date().toISOString();
    const id = await ctx.db.insert("matchupCatalog", {
      category: args.category,
      value: normalizedValue,
      sortOrder: nextSortOrder,
      isActive: true,
      createdAt: now,
      updatedAt: now
    });

    return {
      id,
      category: args.category,
      value: normalizedValue,
      sortOrder: nextSortOrder,
      created: true,
      reactivated: false
    };
  }
});
