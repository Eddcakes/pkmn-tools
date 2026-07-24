import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { normalizeOptionalFormatAndSet } from "./matchupCatalog";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const settings = await ctx.db
      .query("matchupSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!settings) return null;

    return {
      defaultFormat: settings.defaultFormat,
      defaultSet: settings.defaultSet,
      recentUserPrimary: settings.recentUserPrimary,
      recentUserSecondary: settings.recentUserSecondary,
      recentOpponentPrimary: settings.recentOpponentPrimary,
      recentOpponentSecondary: settings.recentOpponentSecondary
    };
  }
});

export const upsert = mutation({
  args: {
    defaultFormat: v.optional(v.string()),
    defaultSet: v.optional(v.string()),
    recentUserPrimary: v.optional(v.array(v.string())),
    recentUserSecondary: v.optional(v.array(v.string())),
    recentOpponentPrimary: v.optional(v.array(v.string())),
    recentOpponentSecondary: v.optional(v.array(v.string()))
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const normalizedFormatAndSet = await normalizeOptionalFormatAndSet(ctx, {
      format: args.defaultFormat,
      latestSet: args.defaultSet
    });

    const normalizedSettings = {
      ...(args.defaultFormat !== undefined
        ? { defaultFormat: normalizedFormatAndSet.format }
        : {}),
      ...(args.defaultSet !== undefined
        ? { defaultSet: normalizedFormatAndSet.latestSet }
        : {}),
      ...(args.recentUserPrimary !== undefined
        ? { recentUserPrimary: args.recentUserPrimary }
        : {}),
      ...(args.recentUserSecondary !== undefined
        ? { recentUserSecondary: args.recentUserSecondary }
        : {}),
      ...(args.recentOpponentPrimary !== undefined
        ? { recentOpponentPrimary: args.recentOpponentPrimary }
        : {}),
      ...(args.recentOpponentSecondary !== undefined
        ? { recentOpponentSecondary: args.recentOpponentSecondary }
        : {})
    };

    const existing = await ctx.db
      .query("matchupSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, normalizedSettings);
    } else {
      await ctx.db.insert("matchupSettings", { userId, ...normalizedSettings });
    }
  }
});
