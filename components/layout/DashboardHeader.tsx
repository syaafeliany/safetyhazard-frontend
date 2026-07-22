"use client";

import { Globe } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";

export function DashboardHeader() {
  const { lang, toggleLang } = useLang();

  return (
    <div className="mb-6 flex items-center justify-end">
      <button
        onClick={toggleLang}
        className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold transition-all duration-150 hover:border-red-300"
        title="Switch language"
      >
        <Globe size={13} className="text-gray-500" />
        <span
          className={
            lang === "en"
              ? "rounded-full bg-red-600 px-1.5 py-0.5 text-white"
              : "text-gray-500"
          }
        >
          EN
        </span>
        <span className="text-gray-300">|</span>
        <span
          className={
            lang === "id"
              ? "rounded-full bg-red-600 px-1.5 py-0.5 text-white"
              : "text-gray-500"
          }
        >
          ID
        </span>
      </button>
    </div>
  );
}
