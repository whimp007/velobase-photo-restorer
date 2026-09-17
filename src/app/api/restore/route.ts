import { NextResponse } from "next/server";
import { z } from "zod";
import { parseMode, processImage } from "@/modules/photo-restorer/server/processor";
import { createLogger } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 60;

const logger = createLogger("api-restore");

const bodySchema = z.object({
  image: z.string().min(32).max(20 * 1024 * 1024),
  mode: z.string().min(1).max(64),
});

/**
 * Public photo restoration endpoint.
 * Accepts a base64 image and a mode, runs the demo sharp pipeline, and
 * returns the restored image (data URL) plus persisted storage keys.
 */
export async function POST(req: Request) {
  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const mode = parseMode(parsed.mode);
  if (!mode) {
    return NextResponse.json(
      { error: `Unsupported mode: ${parsed.mode}` },
      { status: 400 },
    );
  }

  if (!/^data:image\/(png|jpe?g|webp|gif|avif|bmp)/i.test(parsed.image)) {
    return NextResponse.json(
      { error: "Image must be a PNG/JPEG/WebP/GIF/AVIF data URL" },
      { status: 400 },
    );
  }

  let input: Buffer;
  try {
    input = Buffer.from(parsed.image.split(",")[1] ?? "", "base64");
  } catch {
    return NextResponse.json(
      { error: "Image is not valid base64" },
      { status: 400 },
    );
  }

  try {
    const result = await processImage(input, mode);
    return NextResponse.json(result);
  } catch (err) {
    logger.error(
      { err, mode },
      "Photo restoration failed",
    );
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Restoration failed. Please try a smaller image.",
      },
      { status: 422 },
    );
  }
}
