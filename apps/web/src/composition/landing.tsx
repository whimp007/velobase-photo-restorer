"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/header";
import { Background } from "@/components/layout/background";
import { SiteFooter } from "@/components/layout/site-footer";
import { Features } from "@/components/landing/features";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

function HeroSlider() {
  const t = useTranslations("landing");
  const [pos, setPos] = useState(50);
  const dragging = useRef(false);

  const move = useCallback((clientX: number, rect: DOMRect) => {
    const x = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    setPos(Math.round(x));
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-border/60 shadow-2xl shadow-black/20">
      <div
        className="relative aspect-[4/3] w-full cursor-ew-resize select-none"
        onPointerDown={(e) => {
          dragging.current = true;
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          move(e.clientX, e.currentTarget.getBoundingClientRect());
        }}
        onPointerMove={(e) => {
          if (dragging.current) move(e.clientX, e.currentTarget.getBoundingClientRect());
        }}
        onPointerUp={() => (dragging.current = false)}
      >
        {/* After (cleaner) */}
        <img
          src="/samples/old-photo.jpg"
          alt={t("hero.after")}
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
        {/* Before (more degraded) */}
        <div
          className="absolute inset-0"
          style={{
            clipPath: `inset(0 ${100 - pos}% 0 0)`,
            filter: "sepia(0.6) contrast(1.25) brightness(0.82) saturate(0.7) blur(0.4px)",
          }}
        >
          <img
            src="/samples/old-photo.jpg"
            alt={t("hero.before")}
            className="h-full w-full object-cover"
            draggable={false}
          />
        </div>

        {/* Divider handle */}
        <div
          className="absolute inset-y-0 z-10 w-0.5 bg-white/90 shadow-[0_0_14px_rgba(0,0,0,0.5)]"
          style={{ left: `${pos}%` }}
        >
          <div className="absolute top-1/2 left-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-black/55 text-white backdrop-blur">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 8-4 4 4 4" />
              <path d="m15 8 4 4-4 4" />
            </svg>
          </div>
        </div>

        {/* Labels */}
        <span className="absolute left-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
          {t("hero.before")}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-emerald-500/80 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
          {t("hero.after")}
        </span>
      </div>
    </div>
  );
}

export default function HomePage() {
  const t = useTranslations("landing");

  return (
    <div
      className={cn(
        "w-full bg-background text-foreground font-sans selection:bg-primary/30 relative",
        "min-h-screen overflow-y-auto overflow-x-hidden",
      )}
    >
      <Background />
      <Header />

      <main className="relative z-10 flex w-full flex-col items-center px-4 pb-8 pt-20">
        <div className="relative mx-auto w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 text-center duration-1000 fill-mode-both">
          <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {t("hero.badge")}
          </span>
          <h1 className="font-poppins text-5xl font-medium tracking-tight text-foreground drop-shadow-sm md:text-7xl">
            {t("hero.titleLine1")} <br className="hidden md:block" />
            <span className="animate-gradient-x bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              {t("hero.titleLine2")}
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl font-light tracking-wide text-lg text-muted-foreground/80 md:text-xl">
            {t("hero.subtitle")}
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link href="/restore">
              <Button size="lg" className="gap-2 text-base">
                {t("hero.ctaPrimary")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="text-base">
                {t("hero.ctaSecondary")}
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-16 w-full">
          <HeroSlider />
        </div>
      </main>

      <Features />

      {/* CTA band */}
      <section className="relative w-full overflow-hidden px-6 py-24">
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="relative mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-medium tracking-tight md:text-5xl">
            {t("cta.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            {t("cta.subtitle")}
          </p>
          <Link href="/restore" className="mt-8 inline-block">
            <Button size="lg" className="gap-2 text-base">
              {t("cta.button")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
