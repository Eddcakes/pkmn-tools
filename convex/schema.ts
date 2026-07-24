import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  savedDecks: defineTable({
    userId: v.string(),
    label: v.string(),
    deckList: v.string(),
    primaryPokemon: v.optional(v.string()),
    secondaryPokemon: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
    // client-side id so we can match/merge with localStorage records
    clientId: v.string()
  })
    .index("by_user", ["userId"])
    .index("by_user_and_client_id", ["userId", "clientId"]),

  matchupRecords: defineTable({
    userId: v.string(),
    userArchetype: v.string(),
    opponentArchetype: v.string(),
    userPrimaryPokemon: v.optional(v.string()),
    userSecondaryPokemon: v.optional(v.string()),
    opponentPrimaryPokemon: v.optional(v.string()),
    opponentSecondaryPokemon: v.optional(v.string()),
    format: v.optional(v.string()),
    latestSet: v.optional(v.string()),
    result: v.union(v.literal("win"), v.literal("loss"), v.literal("tie")),
    notes: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
    clientId: v.string()
  })
    .index("by_user", ["userId"])
    .index("by_user_and_client_id", ["userId", "clientId"]),

  matchupSettings: defineTable({
    userId: v.string(),
    defaultFormat: v.optional(v.string()),
    defaultSet: v.optional(v.string()),
    // Legacy fields retained as optional for migration compatibility.
    defaultLatestSet: v.optional(v.string()),
    useRecentArchetypes: v.optional(v.boolean()),
    useFavouriteArchetypes: v.optional(v.boolean()),
    recentArchetypes: v.optional(v.array(v.string())),
    favouriteArchetypes: v.optional(v.array(v.string())),
    customArchetypes: v.optional(v.string()),
    availableSets: v.optional(v.array(v.string())),
    recentUserPrimary: v.optional(v.array(v.string())),
    recentUserSecondary: v.optional(v.array(v.string())),
    recentOpponentPrimary: v.optional(v.array(v.string())),
    recentOpponentSecondary: v.optional(v.array(v.string()))
  }).index("by_user", ["userId"]),

  matchupCatalog: defineTable({
    category: v.union(v.literal("format"), v.literal("set")),
    value: v.string(),
    sortOrder: v.number(),
    isActive: v.optional(v.boolean()),
    createdAt: v.string(),
    updatedAt: v.string()
  })
    .index("by_category_and_sort_order", ["category", "sortOrder"])
    .index("by_category_and_value", ["category", "value"])
});
