"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { DeadlineBadge } from "@/components/scouting/deadline-badge";
import { SpelerContext } from "@/components/scouting/speler-context";
import { getAllDrafts } from "@/hooks/scouting/useDraft";
import { logger, grofKorfbalLeeftijd, HUIDIGE_PEILDATUM } from "@oranje-wit/types";

interface VerzoekDetail {
  id: string;
  type: string;
  doel: string;
  status: string;
  toelichting: string | null;
  deadline: string | null;
  anoniem: boolean;
  seizoen: string;
  spelerIds: string[];
  toewijzingen: { id: string; scoutId: string; scoutNaam: string; status: string }[];
  rapporten: {
    id: string;
    spelerId: string;
    scoutNaam: string;
    overallScore: number | null;
    nietBeoordeeld: boolean;
  }[];
}

interface SpelerInfo {
  relCode: string;
  roepnaam: string;
  achternaam: string;
  tussenvoegsel?: string | null;
  geboortejaar: number;
  korfbalLeeftijd: number;
  geslacht: "M" | "V";
  team: string;
  kleur: string;
  seizoenenActief: number | null;
  heeftFoto: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  GENERIEK: "Team beoordeling",
  SPECIFIEK: "Individuele beoordeling",
  VERGELIJKING: "Vergelijking",
};

const DOEL_LABELS: Record<string, string> = {
  DOORSTROOM: "Doorstroom",
  SELECTIE: "Selectie",
  NIVEAUBEPALING: "Niveaubepaling",
  OVERIG: "Overig",
};

export default function VerzoekDetailPage() {
  const router = useRouter();
  const params = useParams();
  const verzoekId = params.id as string;

  const [verzoek, setVerzoek] = useState<VerzoekDetail | null>(null);
  const [spelers, setSpelers] = useState<SpelerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [draftRelCodes, setDraftRelCodes] = useState<Set<string>>(new Set());
  const [isTC, setIsTC] = useState(false);

  const laadData = useCallback(async () => {
    try {
      // Haal verzoek-detail op
      const res = await fetch(`/api/scouting/verzoeken/${verzoekId}`);
      if (!res.ok) throw new Error("Verzoek niet gevonden");
      const data = await res.json();
      setVerzoek(data.data);

      // Check rol
      const profielRes = await fetch("/api/scouting/scout/profiel");
      if (profielRes.ok) {
        const profiel = await profielRes.json();
        setIsTC(profiel.data?.scout?.rol === "TC");
      }

      // Check drafts
      const drafts = getAllDrafts();
      setDraftRelCodes(
        new Set(drafts.filter((d) => d.verzoekId === verzoekId).map((d) => d.relCode))
      );

      // Haal speler-info op voor alle spelerIds
      if (data.data?.spelerIds?.length > 0) {
        const spelerPromises = data.data.spelerIds.map((relCode: string) =>
          fetch(`/api/scouting/spelers/${relCode}`)
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null)
        );
        const spelerResults = await Promise.all(spelerPromises);
        const geladen = spelerResults
          .filter((r) => r?.data)
          .map((r) => {
            const s = r.data;
            const huidig = s.huidig as { team?: string; kleur?: string } | null;
            return {
              relCode: s.id,
              roepnaam: s.roepnaam,
              achternaam: s.achternaam,
              tussenvoegsel: s.tussenvoegsel ?? null,
              geboortejaar: s.geboortejaar,
              korfbalLeeftijd: grofKorfbalLeeftijd(s.geboortejaar, HUIDIGE_PEILDATUM),
              geslacht: s.geslacht as "M" | "V",
              team: huidig?.team ?? "",
              kleur: huidig?.kleur ?? "blauw",
              seizoenenActief: s.seizoenenActief,
              heeftFoto: s.heeftFoto ?? false,
            } as SpelerInfo;
          });
        setSpelers(geladen);
      }
    } catch (error) {
      logger.warn("Fout bij laden verzoek:", error);
    } finally {
      setLoading(false);
    }
  }, [verzoekId]);

  useEffect(() => {
    laadData();
  }, [laadData]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="border-border-default h-8 w-8 animate-spin rounded-full border-2 border-t-orange-500" />
      </div>
    );
  }

  if (!verzoek) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <p className="text-text-muted text-sm">Verzoek niet gevonden</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="mt-4 text-sm font-medium text-orange-500"
        >
          Terug
        </button>
      </div>
    );
  }

  // Bepaal per speler of er al een rapport is
  const rapportPerSpeler = new Map(verzoek.rapporten.map((r) => [r.spelerId, r]));

  return (
    <div className="bg-surface-dark min-h-screen pb-20">
      {/* Header */}
      <div className="bg-surface-card px-4 pt-4 pb-4 shadow-none">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-text-muted mb-3 inline-flex items-center gap-1 text-sm"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Terug
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-text-primary text-lg font-bold">
              {TYPE_LABELS[verzoek.type] ?? verzoek.type}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-text-secondary bg-surface-raised inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium">
                {DOEL_LABELS[verzoek.doel] ?? verzoek.doel}
              </span>
              <span className="text-text-muted text-xs">{verzoek.seizoen}</span>
            </div>
          </div>
          <DeadlineBadge deadline={verzoek.deadline} />
        </div>
      </div>

      <div className="space-y-4 px-4 pt-4">
        {/* TC Toelichting */}
        {verzoek.toelichting && (
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-xs font-semibold tracking-wide text-yellow-700 uppercase">
              Toelichting
            </p>
            <p className="mt-1 text-sm text-yellow-900">{verzoek.toelichting}</p>
          </div>
        )}

        {/* Spelerslijst met start-buttons */}
        <section>
          <h2 className="text-text-muted mb-3 text-xs font-semibold tracking-wide uppercase">
            Te beoordelen spelers ({verzoek.spelerIds.length})
          </h2>

          <div className="space-y-3">
            {verzoek.spelerIds.map((relCode) => {
              const rapport = rapportPerSpeler.get(relCode);
              const heeftDraft = draftRelCodes.has(relCode);
              const isAfgerond = rapport && !rapport.nietBeoordeeld;
              const isNietBeoordeeld = rapport?.nietBeoordeeld;
              const spelerInfo = spelers.find((s) => s.relCode === relCode);

              return (
                <div
                  key={relCode}
                  className="border-border-subtle bg-surface-card rounded-xl border p-4"
                >
                  {/* Speler info met foto, leeftijd, ervaring */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {spelerInfo ? (
                        <SpelerContext
                          relCode={relCode}
                          roepnaam={spelerInfo.roepnaam}
                          achternaam={spelerInfo.achternaam}
                          tussenvoegsel={spelerInfo.tussenvoegsel}
                          geboortejaar={spelerInfo.geboortejaar}
                          korfbalLeeftijd={spelerInfo.korfbalLeeftijd}
                          geslacht={spelerInfo.geslacht}
                          team={spelerInfo.team}
                          kleur={spelerInfo.kleur}
                          seizoenenActief={spelerInfo.seizoenenActief}
                          heeftFoto={spelerInfo.heeftFoto}
                          fotoUrl={`/api/scouting/spelers/${relCode}/foto`}
                          compact
                        />
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="bg-surface-raised h-10 w-10 animate-pulse rounded-full" />
                          <div className="space-y-1">
                            <div className="bg-surface-raised h-4 w-24 animate-pulse rounded" />
                            <div className="bg-surface-card h-3 w-16 animate-pulse rounded" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isAfgerond && (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                          Afgerond
                        </span>
                      )}
                      {isNietBeoordeeld && (
                        <span className="text-text-muted bg-surface-raised inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium">
                          Niet beoordeeld
                        </span>
                      )}
                      {heeftDraft && !isAfgerond && (
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-orange-500" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Start/doorgaan button */}
                  {!isAfgerond && !isNietBeoordeeld && (
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/scouting/verzoeken/${verzoekId}/beoordeel/${relCode}`)
                      }
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-none transition-colors hover:bg-orange-600 active:bg-orange-700"
                    >
                      {heeftDraft ? (
                        <>
                          <span className="relative flex h-2 w-2">
                            <span className="bg-surface-card absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                            <span className="bg-surface-card relative inline-flex h-2 w-2 rounded-full" />
                          </span>
                          Doorgaan met beoordeling
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M6 4l5 4-5 4V4z" fill="currentColor" />
                          </svg>
                          Start beoordeling
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* TC-only: Resultaten sectie */}
        {isTC && verzoek.rapporten.length > 0 && (
          <section>
            <h2 className="text-text-muted mb-3 text-xs font-semibold tracking-wide uppercase">
              Resultaten ({verzoek.rapporten.length} rapporten)
            </h2>
            <div className="border-border-subtle bg-surface-card rounded-xl border p-4">
              <p className="text-text-muted text-xs">
                Resultaten-weergave wordt uitgewerkt in volgende iteratie.
              </p>
            </div>
          </section>
        )}

        {/* TC-only: Scouts sectie */}
        {isTC && verzoek.toewijzingen.length > 0 && (
          <section>
            <h2 className="text-text-muted mb-3 text-xs font-semibold tracking-wide uppercase">
              Toegewezen scouts ({verzoek.toewijzingen.length})
            </h2>
            <div className="space-y-2">
              {verzoek.toewijzingen.map((t) => (
                <div
                  key={t.id}
                  className="border-border-subtle bg-surface-card flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <span className="text-text-secondary text-sm">{t.scoutNaam}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      t.status === "AFGEROND"
                        ? "bg-green-100 text-green-700"
                        : t.status === "GEACCEPTEERD"
                          ? "bg-blue-100 text-blue-700"
                          : t.status === "UITGENODIGD"
                            ? "bg-orange-100 text-orange-700"
                            : "text-text-muted bg-surface-raised"
                    }`}
                  >
                    {t.status.toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
