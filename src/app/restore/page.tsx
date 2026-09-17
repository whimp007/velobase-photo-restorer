"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Header } from "@/components/layout/header";
import { Background } from "@/components/layout/background";
import { RestoreStudio } from "@/modules/photo-restorer/components/restore-studio";
import { BatchRestore } from "@/modules/photo-restorer/components/batch-restore";
import { History, Sparkles } from "lucide-react";

export default function RestorePage() {
  const t = useTranslations("restore");
  const { data: session } = useSession();

  return (
    <div className="min-h-screen">
      <Header />
      <Background />
      <main className="relative mx-auto max-w-6xl px-4 pb-24 pt-12">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {t("badge")}
          </span>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>
          {session && (
            <Link
              href="/restore/history"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              <History className="h-4 w-4" />
              {t("history.badge")}
            </Link>
          )}
        </div>

        <RestoreStudio />

        <div className="mt-16">
          <BatchRestore />
        </div>
      </main>
    </div>
  );
}
