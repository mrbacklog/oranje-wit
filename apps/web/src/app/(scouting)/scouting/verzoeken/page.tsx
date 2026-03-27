"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { VerzoekKaart } from "@/components/scouting/verzoek-kaart";
import { getAllDrafts } from "@/hooks/scouting/useDraft";
import { logger } from "@oranje-wit/types";

interface Verzoek {
  id: string;
  type: "GENERIEK" | "SPECIFIEK" | "VERGELIJKING";
  doel: "DOORSTROOM" | "SELECTIE" | "NIVEAUBEPALING" | "OVERIG";
  status: "OPEN" | "ACTIEF" | "AFGEROND" | "GEANNULEERD";
  toelichting: string | null;
  deadline: string | null;
  seizoen: string;
  aantalSpelers: number;
  heeftTeam: boolean;
  teamNaam?: string;
  toewijzingId: string;
  toewijzingStatus: string;
  aantalRapporten: number;
  // TC-only velden
  aantalToewijzingen?: number;
  voortgang?: { afgerond: number; totaal: number };
}

interface ScoutInfo {
  id: string;
  rol: "SCOUT" | "TC";
}

export default function VerzoekenPage() {
  const router = useRouter();
  const [verzoeken, setVerzoeken] = useState<Verzoek[]>([]);
  const [scout, setScout] = useState<ScoutInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [draftVerzoekIds, setDraftVerzoekIds] = useState<Set<string>>(new Set());

  const isTC = scout?.rol === "TC";

  const laadVerzoeken = useCallback(async () => {
    try {
      // Haal scout-profiel op voor rol-check
      const profielRes = await fetch("/api/scouting/scout/profiel");
      if (profielRes.ok) {
        const profielData = await profielRes.json();
        setScout({ id: profielData.data?.scout?.id, rol: profielData.data?.scout?.rol ?? "SCOUT" });
      }

      // Haal verzoeken op (eigen verzoeken voor scout, alle voor TC)
      const res = await fetch("/api/scouting/mijn-verzoeken");
      if (!res.ok) throw new Error("Verzoeken ophalen mislukt");
      const data = await res.json();
      setVerzoeken(data.data?.verzoeken ?? []);

      // Check drafts in localStorage
      const drafts = getAllDrafts();
      setDraftVerzoekIds(new Set(drafts.map((d) => d.verzoekId)));
    } catch (error) {
      logger.warn("Fout bij laden verzoeken:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    laadVerzoeken();
  }, [laadVerzoeken]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-orange-500" />
      </div>
    );
  }

  const openVerzoeken = verzoeken.filter((v) => v.status === "OPEN" || v.status === "ACTIEF");
  const afgerondeVerzoeken = verzoeken.filter(
    (v) => v.status === "AFGEROND" || v.status === "GEANNULEERD"
  );

  return (
    <div className="bg-surface-dark min-h-screen pb-20">
      {/* Header */}
      <div className="bg-surface-card px-4 pt-6 pb-4 shadow-none">
        <div className="flex items-center justify-between">
          <h1 className="text-text-primary text-xl font-bold">Verzoeken</h1>
          {isTC && (
            <button
              type="button"
              onClick={() => router.push("/verzoeken/nieuw")}
              className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-orange-600 active:bg-orange-700"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 3v10M3 8h10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              Nieuw
            </button>
          )}
        </div>
        <p className="text-text-muted mt-1 text-sm">
          {isTC ? "Beheer scouting-opdrachten en bekijk resultaten" : "Jouw scouting-opdrachten"}
        </p>
      </div>

      <div className="space-y-6 px-4 pt-4">
        {/* Actieve verzoeken */}
        {openVerzoeken.length > 0 && (
          <section>
            <h2 className="text-text-muted mb-2 text-xs font-semibold tracking-wide uppercase">
              Actief ({openVerzoeken.length})
            </h2>
            <div className="space-y-3">
              {openVerzoeken.map((v) => (
                <VerzoekKaart
                  key={v.id}
                  id={v.id}
                  type={v.type}
                  doel={v.doel}
                  status={v.status}
                  toelichting={v.toelichting}
                  deadline={v.deadline}
                  teamNaam={v.teamNaam}
                  aantalSpelers={v.aantalSpelers}
                  voortgang={v.voortgang}
                  toewijzingStatus={v.toewijzingStatus}
                  heeftDraft={draftVerzoekIds.has(v.id)}
                  onClick={() => router.push(`/verzoeken/${v.id}`)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Afgeronde verzoeken */}
        {afgerondeVerzoeken.length > 0 && (
          <section>
            <h2 className="text-text-muted mb-2 text-xs font-semibold tracking-wide uppercase">
              Afgerond ({afgerondeVerzoeken.length})
            </h2>
            <div className="space-y-3">
              {afgerondeVerzoeken.map((v) => (
                <VerzoekKaart
                  key={v.id}
                  id={v.id}
                  type={v.type}
                  doel={v.doel}
                  status={v.status}
                  toelichting={v.toelichting}
                  deadline={v.deadline}
                  teamNaam={v.teamNaam}
                  aantalSpelers={v.aantalSpelers}
                  voortgang={v.voortgang}
                  onClick={() => router.push(`/verzoeken/${v.id}`)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Lege staat */}
        {verzoeken.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                className="text-text-muted"
              >
                <path
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <rect
                  x="9"
                  y="3"
                  width="6"
                  height="4"
                  rx="1"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
            <p className="text-text-primary text-sm font-medium">Geen verzoeken</p>
            <p className="text-text-muted mt-1 text-xs">
              {isTC
                ? "Maak een nieuw scouting-verzoek aan"
                : "Je hebt nog geen scouting-opdrachten ontvangen"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
