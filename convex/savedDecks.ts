import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const MAX_SAVED_DECKS = 500;

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return ctx.db
      .query("savedDecks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(MAX_SAVED_DECKS);
  }
});

export const upsert = mutation({
  args: {
    clientId: v.string(),
    label: v.string(),
    deckList: v.string(),
    archetype: v.optional(v.array(v.string())),
    createdAt: v.string(),
    updatedAt: v.string()
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("savedDecks")
      .withIndex("by_user_and_client_id", (q) =>
        q.eq("userId", userId).eq("clientId", args.clientId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        label: args.label,
        deckList: args.deckList,
        archetype: args.archetype,
        updatedAt: args.updatedAt
      });
      return existing._id;
    }

    return ctx.db.insert("savedDecks", { userId, ...args });
  }
});

export const update = mutation({
  args: {
    clientId: v.string(),
    label: v.string(),
    deckList: v.string(),
    archetype: v.optional(v.array(v.string())),
    updatedAt: v.string()
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("savedDecks")
      .withIndex("by_user_and_client_id", (q) =>
        q.eq("userId", userId).eq("clientId", args.clientId)
      )
      .first();

    if (!existing) throw new Error("Not found");

    await ctx.db.patch(existing._id, {
      label: args.label,
      deckList: args.deckList,
      archetype: args.archetype,
      updatedAt: args.updatedAt
    });
  }
});

export const remove = mutation({
  args: { clientId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("savedDecks")
      .withIndex("by_user_and_client_id", (q) =>
        q.eq("userId", userId).eq("clientId", args.clientId)
      )
      .first();

    if (!existing) return;

    await ctx.db.delete(existing._id);
  }
});
