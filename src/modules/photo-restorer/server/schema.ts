import { z } from "zod";

export const restorationModeSchema = z.enum([
  "RESTORE",
  "ENHANCE",
  "COLORIZE",
  "RESTORE_COLORIZE",
]);

export const createRestorationSchema = z.object({
  mode: restorationModeSchema,
  batchId: z.string().max(64).optional(),
  originalUrl: z.string().max(2048).optional(),
  originalKey: z.string().max(512).optional(),
  restoredUrl: z.string().max(2048).optional(),
  restoredKey: z.string().max(512).optional(),
  status: z.enum(["DONE", "FAILED"]).default("DONE"),
  error: z.string().max(2000).optional(),
});

export const listRestorationsSchema = z
  .object({
    limit: z.number().int().min(1).max(100).default(20),
    cursor: z.string().optional(),
  })
  .optional();

export const getRestorationSchema = z.object({
  id: z.string().min(1).max(128),
});
