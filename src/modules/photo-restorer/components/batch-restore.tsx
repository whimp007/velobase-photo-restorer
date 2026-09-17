"use client";

import { useCallback, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Images,
  Loader2,
  Download,
  Wand2,
  Check,
  X,
} from "lucide-react";
import { api } from "@/trpc/react";
import { fileToDataUrl, type RestoreMode } from "./restore-studio";

const MODE_TO_ENUM: Record<RestoreMode, "RESTORE" | "ENHANCE" | "COLORIZE" | "RESTORE_COLORIZE"> = {
  restore: "RESTORE",
  enhance: "ENHANCE",
  colorize: "COLORIZE",
  "restore-colorize": "RESTORE_COLORIZE",
};

interface BatchItem {
  id: string;
  name: string;
  original: string;
  result?: { restoredDataUrl: string; restoredUrl: string; restoredKey: string; originalKey: string; originalUrl: string };
  failed?: boolean;
}

const MAX_BATCH = 10;

export function BatchRestore() {
  const t = useTranslations("restore");
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<RestoreMode>("restore");
  const [items, setItems] = useState<BatchItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [current, setCurrent] = useState(0);

  const saveMutation = api.restoration.create.useMutation();

  const addFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const valid: File[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          toast.error(t("invalidType"));
          continue;
        }
        if (file.size > 15 * 1024 * 1024) {
          toast.error(t("tooLarge"));
          continue;
        }
        valid.push(file);
      }
      const remaining = MAX_BATCH - items.length;
      if (valid.length > remaining) {
        toast.error(t("batch.maxReached", { max: MAX_BATCH }));
        valid.length = remaining;
      }
      if (valid.length === 0) return;

      const loaded: BatchItem[] = [];
      for (const file of valid) {
        try {
          loaded.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: file.name,
            original: await fileToDataUrl(file),
          });
        } catch {
          toast.error(t("readFailed"));
        }
      }
      setItems((prev) => [...prev, ...loaded]);
    },
    [items.length, t],
  );

  const processAll = useCallback(async () => {
    if (items.length === 0 || processing) return;
    const batchId = `batch_${Date.now()}`;
    setProcessing(true);
    setCurrent(0);

    for (const [i, item] of items.entries()) {
      if (item.result || item.failed) {
        setCurrent(i + 1);
        continue;
      }
      try {
        const res = await fetch("/api/restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: item.original, mode }),
        });
        const data = (await res.json()) as BatchItem["result"] & { error?: string };
        if (!res.ok) throw new Error(data.error ?? t("failed"));

        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, result: data } : it)),
        );

        if (session?.user?.id) {
          await saveMutation
            .mutateAsync({
              mode: MODE_TO_ENUM[mode],
              batchId,
              status: "DONE",
              originalUrl: data.originalUrl,
              originalKey: data.originalKey,
              restoredUrl: data.restoredUrl,
              restoredKey: data.restoredKey,
            })
            .catch(() => undefined);
        }
      } catch {
        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, failed: true } : it)),
        );
      }
      setCurrent(i + 1);
    }
    setProcessing(false);
    toast.success(t("batch.done"));
  }, [items, mode, processing, saveMutation, session, t]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
    setCurrent(0);
  }, []);

  const doneCount = items.filter((it) => it.result).length;
  const failedCount = items.filter((it) => it.failed).length;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-border bg-card/40 p-5 backdrop-blur-sm sm:flex-row sm:items-center">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Images className="h-5 w-5 text-primary" />
            {t("batch.title")}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("batch.subtitle")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as RestoreMode)}
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            aria-label={t("modeTitle")}
          >
            {(Object.keys(MODE_TO_ENUM) as RestoreMode[]).map((key) => (
              <option key={key} value={key}>
                {t(`modes.${key}.title`)}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={processing}
          >
            <Images className="h-4 w-4" />
            {t("batch.addPhotos")}
          </Button>
          <Button
            size="lg"
            className="gap-2"
            disabled={items.length === 0 || processing}
            onClick={() => void processAll()}
          >
            {processing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Wand2 className="h-5 w-5" />
            )}
            {processing
              ? t("batch.processing", { current, total: items.length })
              : t("batch.restoreAll")}
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          void addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {items.length > 0 && (
        <>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {t("batch.queued", { count: items.length })}
              {doneCount > 0 && ` · ${t("batch.doneCount", { count: doneCount })}`}
              {failedCount > 0 && ` · ${t("batch.failedCount", { count: failedCount })}`}
            </span>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              {t("batch.clear")}
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card/40"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-muted/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.result?.restoredDataUrl ?? item.original}
                    alt={item.name}
                    className={cn(
                      "h-full w-full object-cover transition-opacity",
                      item.result && "group-hover:opacity-40",
                    )}
                  />
                  {item.result && (
                    <div className="absolute inset-0 hidden items-center justify-center group-hover:flex">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.original}
                        alt={`${item.name} original`}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <span className="relative rounded-full bg-black/60 px-2.5 py-1 text-xs text-white backdrop-blur">
                        {t("before")}
                      </span>
                    </div>
                  )}
                  {item.failed && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                      <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs text-red-500">
                        <X className="h-3.5 w-3.5" />
                        {t("batch.failedItem")}
                      </span>
                    </div>
                  )}
                  {item.result && (
                    <div className="absolute right-3 top-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const a = document.createElement("a");
                          a.href = item.result!.restoredDataUrl;
                          a.download = `restored-${Date.now()}.png`;
                          a.click();
                        }}
                        className="rounded-full bg-black/60 p-2 text-white backdrop-blur transition-colors hover:bg-black/80"
                        aria-label={t("download")}
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="rounded-full bg-black/60 p-2 text-white/80 backdrop-blur transition-colors hover:bg-black/80 hover:text-white"
                        aria-label={t("batch.remove")}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  {!item.result && !item.failed && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white/80 backdrop-blur transition-colors hover:bg-black/80 hover:text-white"
                      aria-label={t("batch.remove")}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  {item.result && (
                    <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-500 backdrop-blur">
                      <Check className="h-3.5 w-3.5" />
                      {t("history.statuses.done")}
                    </span>
                  )}
                </div>
                <div className="truncate px-3 py-2 text-xs text-muted-foreground">
                  {item.name}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="text-xs leading-relaxed text-muted-foreground">
        {t("privacyNote")}
      </p>
    </div>
  );
}
