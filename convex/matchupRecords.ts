import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import {
  getMatchupCatalogSnapshot,
  normalizeOptionalFormatAndSet,
  normalizeOptionalFormatAndSetFromSnapshot
} from "./matchupCatalog";
import { mutation, query } from "./_generated/server";

const MAX_MATCHUP_RECORDS = 1000;

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return ctx.db
      .query("matchupRecords")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(MAX_MATCHUP_RECORDS);
  }
});

export const upsert = mutation({
  args: {
    clientId: v.string(),
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
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const normalizedFormatAndSet = await normalizeOptionalFormatAndSet(ctx, {
      format: args.format,
      latestSet: args.latestSet
    });

    const existing = await ctx.db
      .query("matchupRecords")
      .withIndex("by_user_and_client_id", (q) =>
        q.eq("userId", userId).eq("clientId", args.clientId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        userArchetype: args.userArchetype,
        opponentArchetype: args.opponentArchetype,
        userPrimaryPokemon: args.userPrimaryPokemon,
        userSecondaryPokemon: args.userSecondaryPokemon,
        opponentPrimaryPokemon: args.opponentPrimaryPokemon,
        opponentSecondaryPokemon: args.opponentSecondaryPokemon,
        format: normalizedFormatAndSet.format,
        latestSet: normalizedFormatAndSet.latestSet,
        result: args.result,
        notes: args.notes,
        updatedAt: args.updatedAt
      });
      return existing._id;
    }

    return ctx.db.insert("matchupRecords", {
      userId,
      ...args,
      format: normalizedFormatAndSet.format,
      latestSet: normalizedFormatAndSet.latestSet
    });
  }
});

export const batchUpsert = mutation({
  args: {
    records: v.array(
      v.object({
        clientId: v.string(),
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
    )
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const ids: string[] = [];
    const catalogSnapshot = await getMatchupCatalogSnapshot(ctx);

    for (const recordArg of args.records) {
      const normalizedFormatAndSet = normalizeOptionalFormatAndSetFromSnapshot(
        catalogSnapshot,
        {
          format: recordArg.format,
          latestSet: recordArg.latestSet
        }
      );

      const existing = await ctx.db
        .query("matchupRecords")
        .withIndex("by_user_and_client_id", (q) =>
          q.eq("userId", userId).eq("clientId", recordArg.clientId)
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
        ids.push(existing._id);
      } else {
        const newId = await ctx.db.insert("matchupRecords", {
          userId,
          ...recordArg,
          format: normalizedFormatAndSet.format,
          latestSet: normalizedFormatAndSet.latestSet
        });
        ids.push(newId);
      }
    }

    return ids;
  }
});

export const update = mutation({
  args: {
    clientId: v.string(),
    userArchetype: v.optional(v.string()),
    opponentArchetype: v.optional(v.string()),
    userPrimaryPokemon: v.optional(v.string()),
    userSecondaryPokemon: v.optional(v.string()),
    opponentPrimaryPokemon: v.optional(v.string()),
    opponentSecondaryPokemon: v.optional(v.string()),
    format: v.optional(v.string()),
    latestSet: v.optional(v.string()),
    result: v.optional(
      v.union(v.literal("win"), v.literal("loss"), v.literal("tie"))
    ),
    notes: v.optional(v.string()),
    updatedAt: v.string()
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const normalizedFormatAndSet = await normalizeOptionalFormatAndSet(ctx, {
      format: args.format,
      latestSet: args.latestSet
    });

    const existing = await ctx.db
      .query("matchupRecords")
      .withIndex("by_user_and_client_id", (q) =>
        q.eq("userId", userId).eq("clientId", args.clientId)
      )
      .first();

    if (!existing) throw new Error("Not found");

    const { clientId, ...updates } = args;
    await ctx.db.patch(existing._id, {
      ...updates,
      ...(args.format !== undefined
        ? { format: normalizedFormatAndSet.format }
        : {}),
      ...(args.latestSet !== undefined
        ? { latestSet: normalizedFormatAndSet.latestSet }
        : {})
    });
  }
});

export const remove = mutation({
  args: { clientId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("matchupRecords")
      .withIndex("by_user_and_client_id", (q) =>
        q.eq("userId", userId).eq("clientId", args.clientId)
      )
      .first();

    if (!existing) return;

    await ctx.db.delete(existing._id);
  }
});
