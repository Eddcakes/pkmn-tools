import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { resolvePokemonSlots } from "./archetypePokemon";

const MAX_RECORDS_TO_SCAN = 1000;

export const backfillForCurrentUser = mutation({
  args: {},
  returns: v.object({
    scanned: v.number(),
    updated: v.number(),
    skipped: v.number()
  }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const records = await ctx.db
      .query("matchupRecords")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(MAX_RECORDS_TO_SCAN);

    let updated = 0;

    for (const record of records) {
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

    return {
      scanned: records.length,
      updated,
      skipped: records.length - updated
    };
  }
});
