"use client";

import { useTranslations } from "next-intl";
import {
  Wand2,
  SlidersHorizontal,
  Palette,
  Layers,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  { icon: Wand2, color: "text-blue-500", key: "restore" },
  { icon: SlidersHorizontal, color: "text-purple-500", key: "enhance" },
  { icon: Palette, color: "text-amber-500", key: "colorize" },
  { icon: Layers, color: "text-emerald-500", key: "batch" },
  { icon: Eye, color: "text-rose-500", key: "compare" },
];

export function Features() {
  const t = useTranslations("landing");

  return (
    <section id="features" className="relative w-full overflow-hidden bg-background px-6 py-32">
      <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-purple-500/5 blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-[1400px]">
        <div className="mb-24 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <h2 className="mb-6 text-sm font-medium uppercase tracking-widest text-blue-500">
              {t("features.eyebrow")}
            </h2>
            <h3 className="text-4xl font-medium leading-[1.1] tracking-tight text-foreground md:text-6xl">
              {t("features.title")}
              <br />
              <span className="text-muted-foreground">{t("features.titleAccent")}</span>
            </h3>
          </div>

          <p className="max-w-sm font-light leading-relaxed text-lg text-muted-foreground">
            {t("features.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-16 md:grid-cols-2 lg:grid-cols-5">
          {features.map(({ icon: Icon, color, key }, index) => (
            <div key={index} className="group flex flex-col items-start">
              <div className="relative mb-8 h-[1px] w-full overflow-hidden bg-border/50">
                <div className="absolute inset-0 h-full w-full -translate-x-full transform bg-foreground transition-transform duration-700 ease-out group-hover:translate-x-0" />
              </div>

              <div
                className={cn(
                  "mb-6 -ml-3 rounded-full p-3 bg-transparent transition-colors duration-300 group-hover:bg-accent/50",
                  color,
                )}
              >
                <Icon className="h-6 w-6" strokeWidth={1.5} />
              </div>

              <h4 className="mb-3 text-xl font-medium tracking-tight text-foreground transition-transform duration-300 group-hover:translate-x-1">
                {t(`features.items.${key}.title`)}
              </h4>

              <p className="text-base font-light leading-relaxed text-muted-foreground">
                {t(`features.items.${key}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
