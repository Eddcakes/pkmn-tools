import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { mutation } from "./_generated/server";
import { resolvePokemonSlots } from "./archetypePokemon";

const MAX_RECORDS_TO_SCAN_PER_RUN = 50;
const MAX_PATCHES_PER_RUN = 50;

export const backfillForCurrentUser = mutation({
  args: {
    cursor: v.optional(v.union(v.string(), v.null()))
  },
  returns: v.object({
    scanned: v.number(),
    updated: v.number(),
    skipped: v.number(),
    done: v.boolean(),
    scheduled: v.boolean(),
    nextCursor: v.union(v.string(), v.null())
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const page = await ctx.db
      .query("matchupRecords")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .paginate({
        numItems: MAX_RECORDS_TO_SCAN_PER_RUN,
        cursor: args.cursor ?? null
      });

    let updated = 0;
    let scanned = 0;

    for (const record of page.page) {
      scanned += 1;
      if (updated >= MAX_PATCHES_PER_RUN) {
        break;
      }

      const userSlots = resolvePokemonSlots(
        record.userArchetype,
        record.userPrimaryPokemon,
        record.userSecondaryPokemon
      );
      const opponentSlots = resolvePokemonSlots(
        record.opponentArchetype,
        record.opponentPrimaryPokemon,
        record.opponentSecondaryPokemon
      );

      const patch: {
        userPrimaryPokemon?: string;
        userSecondaryPokemon?: string;
        opponentPrimaryPokemon?: string;
        opponentSecondaryPokemon?: string;
      } = {};

      if (
        userSlots.primaryPokemon &&
        record.userPrimaryPokemon !== userSlots.primaryPokemon
      ) {
        patch.userPrimaryPokemon = userSlots.primaryPokemon;
      }
      if (
        userSlots.secondaryPokemon &&
        record.userSecondaryPokemon !== userSlots.secondaryPokemon
      ) {
        patch.userSecondaryPokemon = userSlots.secondaryPokemon;
      }
      if (
        opponentSlots.primaryPokemon &&
        record.opponentPrimaryPokemon !== opponentSlots.primaryPokemon
      ) {
        patch.opponentPrimaryPokemon = opponentSlots.primaryPokemon;
      }
      if (
        opponentSlots.secondaryPokemon &&
        record.opponentSecondaryPokemon !== opponentSlots.secondaryPokemon
      ) {
        patch.opponentSecondaryPokemon = opponentSlots.secondaryPokemon;
      }

      if (Object.keys(patch).length === 0) {
        continue;
      }

      await ctx.db.patch(record._id, patch);
      updated += 1;
    }

    const done = page.isDone;
    const nextCursor = done ? null : page.continueCursor;

    if (!done && nextCursor) {
      await ctx.scheduler.runAfter(
        0,
        api.migrateArchetypePokemon.backfillForCurrentUser,
        { cursor: nextCursor }
      );
    }

    return {
      scanned,
      updated,
      skipped: scanned - updated,
      done,
      scheduled: !done,
      nextCursor
    };
  }
});
