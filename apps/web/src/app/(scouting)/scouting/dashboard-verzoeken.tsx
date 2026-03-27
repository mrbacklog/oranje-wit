"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllDrafts } from "@/hooks/scouting/useDraft";
import { logger } from "@oranje-wit/types";

interface Draft {
  verzoekId: string;
  relCode: string;
  laatsteUpdate: string;
}

/**
 * Dashboard-sectie die onafgeronde beoordelingen en actieve verzoeken toont.
 * Client component vanwege localStorage (drafts) en API calls.
 */
export function DashboardVerzoeken() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [aantalVerzoeken, setAantalVerzoeken] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Drafts uit localStorage
    setDrafts(getAllDrafts());

    // Actieve verzoeken
    fetch("/api/scouting/mijn-verzoeken")
      .then((r) => r.json())
      .then((d) => {
        const verzoeken = d.data?.verzoeken ?? [];
        const actief = verzoeken.filter(
          (v: { toewijzingStatus: string }) =>
            v.toewijzingStatus === "UITGENODIGD" || v.toewijzingStatus === "GEACCEPTEERD"
        );
        setAantalVerzoeken(actief.length);
      })
      .catch((error) => {
        logger.warn("Verzoeken ophalen mislukt:", error);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (drafts.length === 0 && aantalVerzoeken === 0) return null;

  return (
    <section className="bg-surface-card rounded-2xl p-5">
      <h2 className="mb-3 text-lg font-semibold">Verzoeken</h2>

      {/* Onafgeronde drafts */}
      {drafts.length > 0 && (
        <div className="mb-3">
          <p className="mb-2 text-xs font-medium tracking-wide text-orange-500 uppercase">
            Onafgeronde beoordelingen
          </p>
          <div className="space-y-2">
            {drafts.slice(0, 3).map((d) => (
              <Link
                key={`${d.verzoekId}-${d.relCode}`}
                href={`/scouting/verzoeken/${d.verzoekId}`}
                className="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 p-3 transition-colors active:bg-orange-100"
              >
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-orange-500" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-orange-900">Speler {d.relCode}</p>
                  <p className="text-xs text-orange-600">
                    {new Date(d.laatsteUpdate).toLocaleDateString("nl-NL")}
                  </p>
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="text-orange-400"
                >
                  <path
                    d="M6 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Actieve verzoeken link */}
      {aantalVerzoeken > 0 && (
        <Link
          href="/scouting/verzoeken"
          className="flex items-center justify-between rounded-lg bg-blue-50 p-3 transition-colors active:bg-blue-100"
        >
          <div>
            <p className="text-sm font-medium text-blue-900">
              {aantalVerzoeken} actie{aantalVerzoeken !== 1 ? "ve" : "f"} verzoek
              {aantalVerzoeken !== 1 ? "en" : ""}
            </p>
            <p className="text-xs text-blue-600">Bekijk je scouting-opdrachten</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-blue-400">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </Link>
      )}
    </section>
  );
}
