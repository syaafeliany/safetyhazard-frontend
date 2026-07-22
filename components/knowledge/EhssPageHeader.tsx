"use client";

import { BookOpen } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";

export function EhssPageHeader() {
  const { lang } = useLanguage();
  const t = translations[lang].ehss;

  return (
    <div className="flex items-center gap-3 shrink-0">
      <span className="flex size-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
        <BookOpen className="size-6" strokeWidth={1.75} />
      </span>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t.page_title}
        </h1>
        <p className="text-sm text-muted">{t.page_subtitle}</p>
      </div>
    </div>
  );
}
