"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Background } from "@/components/layout/background";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Download,
  History as HistoryIcon,
  Loader2,
  LogIn,
  Sparkles,
  Trash2,
} from "lucide-react";
import { api } from "@/trpc/react";
import { cn } from "@/lib/utils";

type ModeEnum = "RESTORE" | "ENHANCE" | "COLORIZE" | "RESTORE_COLORIZE";

const MODE_KEY: Record<ModeEnum, string> = {
  RESTORE: "restore",
  ENHANCE: "enhance",
  COLORIZE: "colorize",
  RESTORE_COLORIZE: "restore-colorize",
};

function formatDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RestorationHistoryPage() {
  const t = useTranslations("restore");
  const { status } = useSession();
  const router = useRouter();

  const listQuery = api.restoration.list.useInfiniteQuery(
    { limit: 20 },
    {
      enabled: status === "authenticated",
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    },
  );

  const restorations =
    listQuery.data?.pages.flatMap((page) => page.items) ?? [];

  if (status === "loading") {
    return (
      <div className="min-h-screen">
        <Header />
        <Background />
        <main className="relative mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center px-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen">
        <Header />
        <Background />
        <main className="relative mx-auto flex min-h-[60vh] max-w-5xl flex-col items-center justify-center gap-4 px-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <LogIn className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{t("history.signInTitle")}</h1>
          <p className="max-w-md text-muted-foreground">{t("history.signInDesc")}</p>
          <Button onClick={() => router.push("/restore")}>
            <Sparkles className="mr-2 h-4 w-4" />
            {t("history.goRestore")}
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <Background />
      <main className="relative mx-auto max-w-5xl px-4 pb-24 pt-12">
        <div className="mb-10 flex flex-col items-center gap-3 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <HistoryIcon className="h-3.5 w-3.5" />
            {t("history.badge")}
          </span>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("history.title")}
          </h1>
          <p className="text-muted-foreground">{t("history.subtitle")}</p>
        </div>

        {listQuery.isPending ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : restorations.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-16 text-center">
            <Clock className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">{t("history.empty")}</p>
            <Button onClick={() => router.push("/restore")}>
              <Sparkles className="mr-2 h-4 w-4" />
              {t("history.goRestore")}
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {restorations.map((item) => (
              <div
                key={item.id}
                className="group overflow-hidden rounded-2xl border border-border bg-card/40 backdrop-blur-sm"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-muted/30">
                  {item.restoredUrl || item.originalUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.restoredUrl ?? item.originalUrl ?? undefined}
                      alt={t("history.resultAlt")}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <Trash2 className="h-8 w-8" />
                    </div>
                  )}
                  <span
                    className={cn(
                      "absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur",
                      item.status === "DONE"
                        ? "bg-emerald-500/20 text-emerald-500"
                        : item.status === "FAILED"
                          ? "bg-red-500/20 text-red-500"
                          : "bg-amber-500/20 text-amber-500",
                    )}
                  >
                    {t(`history.statuses.${item.status.toLowerCase()}`)}
                  </span>
                  <span className="absolute bottom-3 left-3 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white/90 backdrop-blur">
                    {t(`modes.${MODE_KEY[item.mode] ?? "restore"}.title`)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 p-4">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(item.createdAt)}
                  </span>
                  {item.restoredUrl && (
                    <a
                      href={item.restoredUrl}
                      download
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {t("history.download")}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {listQuery.hasNextPage && (
          <div className="mt-8 flex justify-center">
            <Button
              variant="outline"
              onClick={() => void listQuery.fetchNextPage()}
              disabled={listQuery.isFetchingNextPage}
            >
              {listQuery.isFetchingNextPage ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t("history.loadMore")}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
