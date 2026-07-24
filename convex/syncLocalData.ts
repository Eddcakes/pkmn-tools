import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { normalizeOptionalFormatAndSet } from "./matchupCatalog";
import { mutation } from "./_generated/server";

export const syncOnLogin = mutation({
  args: {
    localDecks: v.array(
      v.object({
        id: v.string(),
        label: v.string(),
        deckList: v.string(),
        primaryPokemon: v.optional(v.string()),
        secondaryPokemon: v.optional(v.string()),
        createdAt: v.string(),
        updatedAt: v.string()
      })
    ),
    localRecords: v.array(
      v.object({
        id: v.string(),
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
        updatedAt: v.string()
      })
    ),
    localSettings: v.object({
      defaultFormat: v.optional(v.string()),
      defaultSet: v.optional(v.string()),
      recentUserPrimary: v.optional(v.array(v.string())),
      recentUserSecondary: v.optional(v.array(v.string())),
      recentOpponentPrimary: v.optional(v.array(v.string())),
      recentOpponentSecondary: v.optional(v.array(v.string()))
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
          primaryPokemon: deckArg.primaryPokemon,
          secondaryPokemon: deckArg.secondaryPokemon,
          updatedAt: deckArg.updatedAt
        });
        deckIds.push(existing._id);
      } else {
        const newId = await ctx.db.insert("savedDecks", {
          userId,
          clientId: deckArg.id,
          label: deckArg.label,
          deckList: deckArg.deckList,
          primaryPokemon: deckArg.primaryPokemon,
          secondaryPokemon: deckArg.secondaryPokemon,
          createdAt: deckArg.createdAt,
          updatedAt: deckArg.updatedAt
        });
        deckIds.push(newId);
      }
    }

    // Perform upserts for records
    const recordIds: string[] = [];
    for (const recordArg of recordsToSync) {
      const normalizedFormatAndSet = await normalizeOptionalFormatAndSet(ctx, {
        format: recordArg.format,
        latestSet: recordArg.latestSet
      });

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
          userPrimaryPokemon: recordArg.userPrimaryPokemon,
          userSecondaryPokemon: recordArg.userSecondaryPokemon,
          opponentPrimaryPokemon: recordArg.opponentPrimaryPokemon,
          opponentSecondaryPokemon: recordArg.opponentSecondaryPokemon,
          format: normalizedFormatAndSet.format,
          latestSet: normalizedFormatAndSet.latestSet,
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
          userPrimaryPokemon: recordArg.userPrimaryPokemon,
          userSecondaryPokemon: recordArg.userSecondaryPokemon,
          opponentPrimaryPokemon: recordArg.opponentPrimaryPokemon,
          opponentSecondaryPokemon: recordArg.opponentSecondaryPokemon,
          format: normalizedFormatAndSet.format,
          latestSet: normalizedFormatAndSet.latestSet,
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
      const normalizedDefaults = await normalizeOptionalFormatAndSet(ctx, {
        format: args.localSettings.defaultFormat,
        latestSet: args.localSettings.defaultSet
      });

      const newSettings = {
        userId,
        ...(args.localSettings.defaultFormat !== undefined
          ? { defaultFormat: normalizedDefaults.format }
          : {}),
        ...(args.localSettings.defaultSet !== undefined
          ? { defaultSet: normalizedDefaults.latestSet }
          : {}),
        ...(args.localSettings.recentUserPrimary !== undefined
          ? { recentUserPrimary: args.localSettings.recentUserPrimary }
          : {}),
        ...(args.localSettings.recentUserSecondary !== undefined
          ? { recentUserSecondary: args.localSettings.recentUserSecondary }
          : {}),
        ...(args.localSettings.recentOpponentPrimary !== undefined
          ? { recentOpponentPrimary: args.localSettings.recentOpponentPrimary }
          : {}),
        ...(args.localSettings.recentOpponentSecondary !== undefined
          ? {
              recentOpponentSecondary:
                args.localSettings.recentOpponentSecondary
            }
          : {})
      };
      await ctx.db.insert("matchupSettings", newSettings);
      settingsSynced = true;
    } else {
      const normalizedDefaults = await normalizeOptionalFormatAndSet(ctx, {
        format: serverSettings.defaultFormat ?? args.localSettings.defaultFormat,
        latestSet: serverSettings.defaultSet ?? args.localSettings.defaultSet
      });

      const cleanedSettings = {
        userId,
        ...((serverSettings.defaultFormat ?? args.localSettings.defaultFormat)
          ? {
              defaultFormat: normalizedDefaults.format
            }
          : {}),
        ...((serverSettings.defaultSet ?? args.localSettings.defaultSet)
          ? {
              defaultSet: normalizedDefaults.latestSet
            }
          : {}),
        ...((serverSettings.recentUserPrimary ??
        args.localSettings.recentUserPrimary)
          ? {
              recentUserPrimary:
                serverSettings.recentUserPrimary ??
                args.localSettings.recentUserPrimary
            }
          : {}),
        ...((serverSettings.recentUserSecondary ??
        args.localSettings.recentUserSecondary)
          ? {
              recentUserSecondary:
                serverSettings.recentUserSecondary ??
                args.localSettings.recentUserSecondary
            }
          : {}),
        ...((serverSettings.recentOpponentPrimary ??
        args.localSettings.recentOpponentPrimary)
          ? {
              recentOpponentPrimary:
                serverSettings.recentOpponentPrimary ??
                args.localSettings.recentOpponentPrimary
            }
          : {}),
        ...((serverSettings.recentOpponentSecondary ??
        args.localSettings.recentOpponentSecondary)
          ? {
              recentOpponentSecondary:
                serverSettings.recentOpponentSecondary ??
                args.localSettings.recentOpponentSecondary
            }
          : {})
      };
      await ctx.db.replace(serverSettings._id, cleanedSettings);
    }

    const finalDecks = await ctx.db
      .query("savedDecks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(500);

    const finalRecords = await ctx.db
      .query("matchupRecords")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(1000);

    const finalSettings = await ctx.db
      .query("matchupSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return {
      decksSynced: deckIds.length,
      recordsSynced: recordIds.length,
      settingsSynced,
      decks: finalDecks.map((deck) => ({
        id: deck.clientId,
        label: deck.label,
        deckList: deck.deckList,
        primaryPokemon: deck.primaryPokemon,
        secondaryPokemon: deck.secondaryPokemon,
        createdAt: deck.createdAt,
        updatedAt: deck.updatedAt
      })),
      records: finalRecords.map((record) => ({
        id: record.clientId,
        userArchetype: record.userArchetype,
        opponentArchetype: record.opponentArchetype,
        userPrimaryPokemon: record.userPrimaryPokemon,
        userSecondaryPokemon: record.userSecondaryPokemon,
        opponentPrimaryPokemon: record.opponentPrimaryPokemon,
        opponentSecondaryPokemon: record.opponentSecondaryPokemon,
        format: record.format,
        latestSet: record.latestSet,
        result: record.result,
        notes: record.notes,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      })),
      settings: finalSettings
        ? {
            defaultFormat: finalSettings.defaultFormat,
            defaultSet: finalSettings.defaultSet,
            recentUserPrimary: finalSettings.recentUserPrimary,
            recentUserSecondary: finalSettings.recentUserSecondary,
            recentOpponentPrimary: finalSettings.recentOpponentPrimary,
            recentOpponentSecondary: finalSettings.recentOpponentSecondary
          }
        : args.localSettings
    };
  }
});
