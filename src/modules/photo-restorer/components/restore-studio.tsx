"use client";

import { useCallback, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ImagePlus,
  Loader2,
  Download,
  Sparkles,
  SlidersHorizontal,
  Palette,
  Layers,
  Wand2,
  Check,
} from "lucide-react";
import { api } from "@/trpc/react";

export type RestoreMode = "restore" | "enhance" | "colorize" | "restore-colorize";

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;

interface RestoreResult {
  restoredDataUrl: string;
  restoredUrl: string;
  restoredKey: string;
  originalKey: string;
  originalUrl: string;
}

const MODE_TO_ENUM: Record<RestoreMode, "RESTORE" | "ENHANCE" | "COLORIZE" | "RESTORE_COLORIZE"> = {
  restore: "RESTORE",
  enhance: "ENHANCE",
  colorize: "COLORIZE",
  "restore-colorize": "RESTORE_COLORIZE",
};

const MODES: { key: RestoreMode; icon: typeof Sparkles; color: string }[] = [
  { key: "restore", icon: Wand2, color: "text-blue-500" },
  { key: "enhance", icon: SlidersHorizontal, color: "text-purple-500" },
  { key: "colorize", icon: Palette, color: "text-amber-500" },
  { key: "restore-colorize", icon: Layers, color: "text-emerald-500" },
];

export async function fileToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

export function RestoreStudio() {
  const t = useTranslations("restore");
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<RestoreMode>("restore");
  const [original, setOriginal] = useState<string | null>(null);
  const [result, setResult] = useState<RestoreResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);

  const saveMutation = api.restoration.create.useMutation();

  const handleFile = useCallback(async (file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("invalidType"));
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error(t("tooLarge"));
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setOriginal(dataUrl);
      setResult(null);
      setSaved(false);
      setSliderPos(50);
    } catch {
      toast.error(t("readFailed"));
    }
  }, [t]);

  const runRestore = useCallback(async () => {
    if (!original) return;
    setProcessing(true);
    setResult(null);
    setSaved(false);
    try {
      const res = await fetch("/api/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: original, mode }),
      });
      const data = (await res.json()) as RestoreResult & { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? t("failed"));
      }
      setResult(data);

      if (session?.user?.id) {
        try {
          await saveMutation.mutateAsync({
            mode: MODE_TO_ENUM[mode],
            status: "DONE",
            originalUrl: data.originalUrl,
            originalKey: data.originalKey,
            restoredUrl: data.restoredUrl,
            restoredKey: data.restoredKey,
          });
          setSaved(true);
        } catch {
          setSaved(false);
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("failed"));
    } finally {
      setProcessing(false);
    }
  }, [original, mode, session, saveMutation, t]);

  const download = useCallback(() => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result.restoredDataUrl;
    a.download = `restored-${Date.now()}.png`;
    a.click();
  }, [result]);

  return (
    <div className="w-full max-w-5xl mx-auto grid gap-8 lg:grid-cols-[1fr_380px]">
      {/* Left: image stage */}
      <div className="space-y-4">
        <div
          className={cn(
            "relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-dashed bg-muted/30",
            result ? "border-border" : "border-foreground/20",
          )}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void handleFile(e.dataTransfer.files?.[0]);
          }}
        >
          {original ? (
            <div className="relative h-full w-full select-none">
              <img
                src={original}
                alt="Original"
                className="absolute inset-0 h-full w-full object-contain"
                draggable={false}
              />
              {result && (
                <div
                  className="absolute inset-0"
                  style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                >
                  <img
                    src={result.restoredDataUrl}
                    alt="Restored"
                    className="h-full w-full object-contain"
                    draggable={false}
                  />
                </div>
              )}

              {result && (
                <div
                  className="absolute inset-y-0 z-10 w-0.5 bg-white/90 shadow-[0_0_12px_rgba(0,0,0,0.4)]"
                  style={{ left: `${sliderPos}%` }}
                >
                  <div className="absolute top-1/2 left-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-black/50 text-white backdrop-blur cursor-ew-resize">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 8-4 4 4 4" /><path d="m15 8 4 4-4 4" />
                    </svg>
                  </div>
                </div>
              )}

              {!result && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white/90 backdrop-blur">
                  {t("dragHint")}
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-full w-full flex-col items-center justify-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <ImagePlus className="h-8 w-8" />
              </div>
              <p className="text-lg font-medium">{t("uploadTitle")}</p>
              <p className="text-sm">{t("uploadHint")}</p>
            </button>
          )}

          {processing && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-background/70 backdrop-blur-sm">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm font-medium">{t("processing")}</p>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />

        {result && (
          <div className="flex items-center justify-center gap-3">
            <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              {t("before")}
            </span>
            <input
              type="range"
              min={5}
              max={95}
              value={sliderPos}
              onChange={(e) => setSliderPos(Number(e.target.value))}
              className="h-2 w-48 cursor-ew-resize accent-primary"
              aria-label={t("sliderLabel")}
            />
            <span className="rounded-full bg-primary/15 px-3 py-1 text-xs text-primary">
              {t("after")}
            </span>
          </div>
        )}

        {result && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            {saved ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-500">
                <Check className="h-4 w-4" /> {t("saved")}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">{t("notSaved")}</span>
            )}
            <Button onClick={download} size="lg" className="gap-2">
              <Download className="h-4 w-4" />
              {t("download")}
            </Button>
          </div>
        )}
      </div>

      {/* Right: controls */}
      <div className="space-y-5">
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-4 w-4" /> {t("modeTitle")}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {MODES.map(({ key, icon: Icon, color }) => (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key)}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all",
                  mode === key
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-foreground/30",
                )}
              >
                <Icon className={cn("h-5 w-5", color)} />
                <span className="text-sm font-medium">{t(`modes.${key}.title`)}</span>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  {t(`modes.${key}.desc`)}
                </span>
              </button>
            ))}
          </div>
        </div>

        <Button
          size="lg"
          className="w-full gap-2"
          disabled={!original || processing}
          onClick={() => void runRestore()}
        >
          {processing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Wand2 className="h-5 w-5" />
          )}
          {t("restoreButton")}
        </Button>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => fileInputRef.current?.click()}
            disabled={processing}
          >
            <ImagePlus className="h-4 w-4" />
            {t("changePhoto")}
          </Button>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          {t("privacyNote")}
        </p>
      </div>
    </div>
  );
}
