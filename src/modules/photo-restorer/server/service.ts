import { db } from "@/server/db";
import { createLogger } from "@/lib/logger";
import { TRPCError } from "@trpc/server";
import type { RestorationMode } from "@prisma/client";

const logger = createLogger("photo-restorer-service");

export interface CreateRestorationInput {
  userId: string;
  mode: RestorationMode;
  batchId?: string;
  originalUrl?: string;
  originalKey?: string;
  restoredUrl?: string;
  restoredKey?: string;
  status: "DONE" | "FAILED";
  error?: string;
}

export interface ListRestorationsInput {
  userId: string;
  limit?: number;
  cursor?: string;
}

/**
 * Persist a completed or failed restoration job.
 * Ownership is enforced from the session-derived userId.
 */
export async function createRestoration(input: CreateRestorationInput) {
  logger.info({ userId: input.userId, mode: input.mode }, "Saving restoration");

  return db.restoration.create({
    data: {
      userId: input.userId,
      mode: input.mode,
      batchId: input.batchId,
      originalUrl: input.originalUrl,
      originalKey: input.originalKey,
      restoredUrl: input.restoredUrl,
      restoredKey: input.restoredKey,
      status: input.status,
      error: input.error,
    },
  });
}

/**
 * List restorations for a user with cursor-based pagination.
 */
export async function listRestorations(input: ListRestorationsInput) {
  const limit = input.limit ?? 20;

  const items = await db.restoration.findMany({
    where: { userId: input.userId },
    take: limit + 1,
    cursor: input.cursor ? { id: input.cursor } : undefined,
    orderBy: { createdAt: "desc" },
  });

  const hasMore = items.length > limit;
  const pageItems = hasMore ? items.slice(0, limit) : items;

  return {
    items: pageItems,
    nextCursor: hasMore ? pageItems[pageItems.length - 1]?.id : null,
  };
}

/**
 * Get a single restoration owned by the user.
 */
export async function getRestoration(userId: string, id: string) {
  const restoration = await db.restoration.findFirst({
    where: { id, userId },
  });

  if (!restoration) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Restoration not found" });
  }

  return restoration;
}
