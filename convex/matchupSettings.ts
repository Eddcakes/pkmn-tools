import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return ctx.db
      .query("matchupSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  }
});

export const upsert = mutation({
  args: {
    useRecentArchetypes: v.boolean(),
    useFavouriteArchetypes: v.boolean(),
    recentArchetypes: v.array(v.string()),
    favouriteArchetypes: v.array(v.string()),
    availableSets: v.optional(v.array(v.string())),
    customArchetypes: v.string(),
    defaultFormat: v.optional(v.string()),
    defaultLatestSet: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const normalizedSettings = {
      useRecentArchetypes: args.useRecentArchetypes,
      useFavouriteArchetypes: args.useFavouriteArchetypes,
      recentArchetypes: args.recentArchetypes,
      favouriteArchetypes: args.favouriteArchetypes,
      customArchetypes: args.customArchetypes,
      ...(args.availableSets !== undefined
        ? { availableSets: args.availableSets }
        : {}),
      ...(args.defaultFormat !== undefined
        ? { defaultFormat: args.defaultFormat }
        : {}),
      ...(args.defaultLatestSet !== undefined
        ? { defaultLatestSet: args.defaultLatestSet }
        : {})
    };

    const existing = await ctx.db
      .query("matchupSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.replace(existing._id, { userId, ...normalizedSettings });
    } else {
      await ctx.db.insert("matchupSettings", { userId, ...normalizedSettings });
    }
  }
});
