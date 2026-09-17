import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { createLogger } from "@/lib/logger";
import { isFeatureEnabled } from "@/server/features/state";
import { settleDeduction } from "@/server/billing/services/post-consume";
import {
  createRestorationSchema,
  getRestorationSchema,
  listRestorationsSchema,
} from "./schema";
import {
  createRestoration,
  getRestoration,
  listRestorations,
} from "./service";

const logger = createLogger("photo-restorer-router");

/** Amount of credits charged per restored photo when the credit ledger is available. */
const CREDITS_PER_RESTORATION = 1;

/**
 * Charge 1 credit for a completed restoration. Optional billing: silently skips
 * when the credits feature is disabled or the Velobase ledger is not configured,
 * so the demo keeps working without VELOBASE_API_KEY.
 */
async function chargeRestorationCredit(userId: string, restorationId: string) {
  try {
    if (!(await isFeatureEnabled("credits"))) return;
    await settleDeduction({
      userId,
      amount: CREDITS_PER_RESTORATION,
      businessId: restorationId,
      businessType: "TASK",
      description: "Photo restoration",
    });
  } catch (error) {
    logger.warn(
      { error, userId, restorationId },
      "Credit charge skipped (ledger unavailable)",
    );
  }
}

export const restorationRouter = createTRPCRouter({
  /**
   * Persist a restoration record after the processing endpoint completed.
   * Requires authentication; anonymous demo users simply skip saving.
   */
  create: protectedProcedure
    .input(createRestorationSchema)
    .mutation(async ({ ctx, input }) => {
      const record = await createRestoration({
        userId: ctx.session.user.id,
        mode: input.mode,
        batchId: input.batchId,
        originalUrl: input.originalUrl,
        originalKey: input.originalKey,
        restoredUrl: input.restoredUrl,
        restoredKey: input.restoredKey,
        status: input.status,
        error: input.error,
      });
      if (record.status === "DONE") {
        await chargeRestorationCredit(ctx.session.user.id, record.id);
      }
      return record;
    }),

  /**
   * List the current user's restoration history (cursor paginated).
   */
  list: protectedProcedure
    .input(listRestorationsSchema)
    .query(async ({ ctx, input }) => {
      return listRestorations({
        userId: ctx.session.user.id,
        limit: input?.limit,
        cursor: input?.cursor,
      });
    }),

  /**
   * Get a single restoration owned by the current user.
   */
  get: protectedProcedure
    .input(getRestorationSchema)
    .query(async ({ ctx, input }) => {
      return getRestoration(ctx.session.user.id, input.id);
    }),

  /**
   * Public capability marker used by the landing page.
   */
  health: publicProcedure.query(() => {
    return { status: "ok", module: "photo-restorer" };
  }),
});
