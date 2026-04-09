"use client";

import type { ValidatieMelding } from "@/lib/teamindeling/validatie/regels";

interface TeamKaartFooterProps {
  meldingen: ValidatieMelding[];
  aantalSpelers: number;
  gemLeeftijd: string;
  footerBorder: string;
  jIndicatie?: string;
  teamSterkte?: number;
}

export default function TeamKaartFooter({
  meldingen,
  aantalSpelers,
  gemLeeftijd,
  footerBorder,
  jIndicatie,
  teamSterkte,
}: TeamKaartFooterProps) {
  return (
    <div
      style={{ height: 28 }}
      className={`flex items-center justify-between px-1.5 py-0.5 ${footerBorder}`}
    >
      <div className="flex items-center gap-1">
        {meldingen.length > 0 && (
          <span className="group relative" title={meldingen.map((m) => m.bericht).join("\n")}>
            <svg
              className={`h-3 w-3 ${
                meldingen.some((m) => m.ernst === "kritiek")
                  ? "text-red-500"
                  : meldingen.some((m) => m.ernst === "aandacht")
                    ? "text-orange-400"
                    : "text-blue-400"
              }`}
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
            </svg>
            {meldingen.length > 1 && (
              <span className="absolute -top-1 -right-1 flex h-2.5 min-w-2.5 items-center justify-center rounded-full bg-red-500 px-0.5 text-[6px] font-bold text-white">
                {meldingen.length}
              </span>
            )}
          </span>
        )}
        <span className="text-text-secondary text-[7px]">{aantalSpelers} sp</span>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {jIndicatie && (
          <span className="rounded bg-indigo-900/30 px-1 text-[8px] font-bold text-indigo-300">
            {jIndicatie}
            {teamSterkte != null && (
              <span className="font-normal text-indigo-400"> ({teamSterkte})</span>
            )}
          </span>
        )}
        <span className="text-text-secondary text-[8px] tabular-nums">gem. {gemLeeftijd}</span>
      </div>
    </div>
  );
}
