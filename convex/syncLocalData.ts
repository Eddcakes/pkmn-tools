import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const syncOnLogin = mutation({
  args: {
    localDecks: v.array(
      v.object({
        id: v.string(),
        label: v.string(),
        deckList: v.string(),
        archetype: v.optional(v.array(v.string())),
        createdAt: v.string(),
        updatedAt: v.string()
      })
    ),
    localRecords: v.array(
      v.object({
        id: v.string(),
        userArchetype: v.string(),
        opponentArchetype: v.string(),
        result: v.union(v.literal("win"), v.literal("loss"), v.literal("tie")),
        notes: v.optional(v.string()),
        createdAt: v.string(),
        updatedAt: v.string()
      })
    ),
    localSettings: v.object({
      useRecentArchetypes: v.boolean(),
      useFavouriteArchetypes: v.boolean(),
      recentArchetypes: v.array(v.string()),
      favouriteArchetypes: v.array(v.string()),
      customArchetypes: v.string()
    })
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Fetch all server data
    const serverDecks = await ctx.db
      .query("savedDecks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(500);

    const serverRecords = await ctx.db
      .query("matchupRecords")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(1000);

    const serverSettings = await ctx.db
      .query("matchupSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    // Filter decks to sync (client > server version)
    const serverDeckMap = new Map(serverDecks.map((d) => [d.clientId, d]));
    const decksToSync = args.localDecks.filter((local) => {
      const server = serverDeckMap.get(local.id);
      const localTime = new Date(local.updatedAt).getTime();
      const serverTime = server ? new Date(server.updatedAt).getTime() : 0;
      return localTime >= serverTime;
    });

    // Filter records to sync (client > server version)
    const serverRecordMap = new Map(serverRecords.map((r) => [r.clientId, r]));
    const recordsToSync = args.localRecords.filter((local) => {
      const server = serverRecordMap.get(local.id);
      const localTime = new Date(local.updatedAt).getTime();
      const serverTime = server ? new Date(server.updatedAt).getTime() : 0;
      return localTime >= serverTime;
    });

    // Perform upserts for decks
    const deckIds: string[] = [];
    for (const deckArg of decksToSync) {
      const existing = await ctx.db
        .query("savedDecks")
        .withIndex("by_user_and_client_id", (q) =>
          q.eq("userId", userId).eq("clientId", deckArg.id)
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          label: deckArg.label,
          deckList: deckArg.deckList,
          archetype: deckArg.archetype,
          updatedAt: deckArg.updatedAt
        });
        deckIds.push(existing._id);
      } else {
        const newId = await ctx.db.insert("savedDecks", {
          userId,
          clientId: deckArg.id,
          label: deckArg.label,
          deckList: deckArg.deckList,
          archetype: deckArg.archetype,
          createdAt: deckArg.createdAt,
          updatedAt: deckArg.updatedAt
        });
        deckIds.push(newId);
      }
    }

    // Perform upserts for records
    const recordIds: string[] = [];
    for (const recordArg of recordsToSync) {
      const existing = await ctx.db
        .query("matchupRecords")
        .withIndex("by_user_and_client_id", (q) =>
          q.eq("userId", userId).eq("clientId", recordArg.id)
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          userArchetype: recordArg.userArchetype,
          opponentArchetype: recordArg.opponentArchetype,
          result: recordArg.result,
          notes: recordArg.notes,
          updatedAt: recordArg.updatedAt
        });
        recordIds.push(existing._id);
      } else {
        const newId = await ctx.db.insert("matchupRecords", {
          userId,
          clientId: recordArg.id,
          userArchetype: recordArg.userArchetype,
          opponentArchetype: recordArg.opponentArchetype,
          result: recordArg.result,
          notes: recordArg.notes,
          createdAt: recordArg.createdAt,
          updatedAt: recordArg.updatedAt
        });
        recordIds.push(newId);
      }
    }

    // Sync settings if server has none
    let settingsSynced = false;
    if (!serverSettings) {
      await ctx.db.insert("matchupSettings", {
        userId,
        ...args.localSettings
      });
      settingsSynced = true;
    }

    return {
      decksSynced: deckIds.length,
      recordsSynced: recordIds.length,
      settingsSynced
    };
  }
});
