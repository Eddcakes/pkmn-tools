import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  savedDecks: defineTable({
    userId: v.string(),
    label: v.string(),
    deckList: v.string(),
    archetype: v.optional(v.array(v.string())),
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
    useRecentArchetypes: v.boolean(),
    useFavouriteArchetypes: v.boolean(),
    recentArchetypes: v.array(v.string()),
    favouriteArchetypes: v.array(v.string()),
    customArchetypes: v.string()
  }).index("by_user", ["userId"])
});
