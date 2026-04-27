import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return ctx.db
      .query("savedDecks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
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
      .withIndex("by_client_id", (q) => q.eq("clientId", args.clientId))
      .first();

    if (existing) {
      // Only update if we own it
      if (existing.userId !== userId) throw new Error("Forbidden");
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
      .withIndex("by_client_id", (q) => q.eq("clientId", args.clientId))
      .first();

    if (!existing) throw new Error("Not found");
    if (existing.userId !== userId) throw new Error("Forbidden");

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
      .withIndex("by_client_id", (q) => q.eq("clientId", args.clientId))
      .first();

    if (!existing) return;
    if (existing.userId !== userId) throw new Error("Forbidden");

    await ctx.db.delete(existing._id);
  }
});
