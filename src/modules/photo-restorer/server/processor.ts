import sharp from "sharp";
import { createLogger } from "@/lib/logger";
import { generateFileKey, putObject } from "@/server/storage";
import type { RestorationMode } from "@prisma/client";

const logger = createLogger("photo-restorer-processor");

export interface ProcessImageResult {
  originalKey: string;
  originalUrl: string;
  restoredKey: string;
  restoredUrl: string;
  restoredDataUrl: string;
  provider: "sharp-demo";
}

const MAX_IMAGE_BYTES = 12 * 1024 * 1024; // 12MB decoded

/**
 * Demo restoration pipeline backed by sharp.
 * - restore:        median despeckle + smoothing + sharpen (scratch/crease/spot removal)
 * - enhance:        auto-contrast + brightness/saturation + sharpen (low-res clarity boost)
 * - colorize:       warm-tone recovery + saturation for faded / B&W photos
 * - restore+colorize: combined pass
 *
 * Real AI model providers replace this pipeline in the full MVP while keeping
 * the same input/output contract.
 */
export async function processImage(
  input: Buffer,
  mode: RestorationMode,
): Promise<ProcessImageResult> {
  if (!input.length || input.length > MAX_IMAGE_BYTES) {
    throw new Error("Image payload is empty or exceeds the size limit");
  }

  const pipeline = sharp(input).rotate().resize(2048, 2048, { fit: "inside", withoutEnlargement: true });

  switch (mode) {
    case "RESTORE":
      pipeline
        .median(3)
        .blur(0.3)
        .sharpen({ sigma: 1.2 });
      break;
    case "ENHANCE":
      pipeline
        .normalize()
        .modulate({ brightness: 1.06, saturation: 1.15 })
        .sharpen({ sigma: 1.5 });
      break;
    case "COLORIZE":
      pipeline
        .median(2)
        .normalize()
        .modulate({ saturation: 1.4, brightness: 1.06 })
        .tint({ r: 255, g: 246, b: 236 })
        .sharpen({ sigma: 0.8 });
      break;
    case "RESTORE_COLORIZE":
      pipeline
        .median(3)
        .normalize()
        .modulate({ saturation: 1.35, brightness: 1.08 })
        .tint({ r: 255, g: 246, b: 236 })
        .sharpen({ sigma: 1.2 });
      break;
    default:
      throw new Error(`Unsupported restoration mode: ${String(mode)}`);
  }

  const restored = await pipeline.png({ compressionLevel: 9 }).toBuffer();

  const jobId = crypto.randomUUID();
  const userId = "demo";
  const originalKey = generateFileKey(`original-${jobId}.png`, userId);
  const restoredKey = generateFileKey(`restored-${jobId}.png`, userId);

  const [originalStored, restoredStored] = await Promise.all([
    putObject(input, originalKey, "image/png"),
    putObject(restored, restoredKey, "image/png"),
  ]);

  logger.info(
    { mode, originalKey, restoredKey },
    "Photo restored and persisted",
  );

  return {
    originalKey,
    originalUrl: originalStored.publicUrl,
    restoredKey,
    restoredUrl: restoredStored.publicUrl,
    restoredDataUrl: `data:image/png;base64,${restored.toString("base64")}`,
    provider: "sharp-demo",
  };
}

export function parseMode(value: string): RestorationMode | null {
  const map: Record<string, RestorationMode> = {
    restore: "RESTORE",
    enhance: "ENHANCE",
    colorize: "COLORIZE",
    "restore-colorize": "RESTORE_COLORIZE",
    restore_colorize: "RESTORE_COLORIZE",
  };
  return map[value] ?? null;
}
