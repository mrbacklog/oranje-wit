"use client";

import { useCallback, useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CelebrationOverlay } from "@/components/scouting/celebration-overlay";
import { SpelerContext } from "@/components/scouting/speler-context";
import { DeadlineBadge } from "@/components/scouting/deadline-badge";
import { useDraft } from "@/hooks/scouting/useDraft";
import type { ScoutingVraag } from "@/lib/scouting/vragen";
import type { SchaalType, LeeftijdsgroepNaam } from "@/lib/scouting/leeftijdsgroep";
import { logger, PEILJAAR } from "@oranje-wit/types";
import {
  StapContext,
  StapOpmerking,
  StapSamenvatting,
} from "@/app/(scouting)/scouting/rapport/nieuw/[relCode]/wizard-stappen";
import type { ScoutingContext } from "@/app/(scouting)/scouting/rapport/nieuw/[relCode]/wizard-stappen";
import { StapBeoordelingV3 as StapBeoordeling } from "@/app/(scouting)/scouting/rapport/nieuw/[relCode]/wizard-beoordelingen";

const RELATIE_OPTIES = [
  { value: "GEEN", label: "Geen relatie" },
  { value: "OUDER", label: "Ouder" },
  { value: "FAMILIE", label: "Familie" },
  { value: "BEKENDE", label: "Bekende" },
  { value: "TRAINER", label: "Trainer" },
] as const;

interface VerzoekRapportWizardProps {
  verzoekId: string;
  verzoek: {
    type: string;
    doel: string;
    toelichting: string | null;
    deadline: string | null;
  };
  speler: {
    id: string;
    roepnaam: string;
    achternaam: string;
    tussenvoegsel: string | null;
    geboortejaar: number;
    geslacht: "M" | "V";
    seizoenenActief: number | null;
    heeftFoto: boolean;
  };
  leeftijdsgroep: LeeftijdsgroepNaam;
  schaalType: SchaalType;
  maxScore: number;
  vragen: ScoutingVraag[];
}

type WizardStap = "relatie" | "context" | "beoordeling" | "opmerking" | "samenvatting";
const STAPPEN: WizardStap[] = ["relatie", "context", "beoordeling", "opmerking", "samenvatting"];

export function VerzoekRapportWizard({
  verzoekId,
  verzoek,
  speler,
  leeftijdsgroep,
  schaalType,
  maxScore,
  vragen,
}: VerzoekRapportWizardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { draft, hasDraft, saveDraft, clearDraft } = useDraft(verzoekId, speler.id);

  // State — initialiseer vanuit draft als beschikbaar
  const [stap, setStap] = useState<WizardStap>(
    hasDraft ? (STAPPEN[draft!.stap] ?? "relatie") : "relatie"
  );
  const [relatie, setRelatie] = useState(draft?.relatie ?? "GEEN");
  const [context, setContext] = useState<ScoutingContext | null>(
    (draft?.context as ScoutingContext) ?? null
  );
  const [contextDetail, setContextDetail] = useState(draft?.contextDetail ?? "");
  const [scores, setScores] = useState<Record<string, number>>(draft?.scores ?? {});
  const [opmerking, setOpmerking] = useState(draft?.opmerking ?? "");
  const [smileyIndex, setSmileyIndex] = useState(0);
  const [fout, setFout] = useState<string | null>(null);
  const [savedToast, setSavedToast] = useState(false);
  const [resultaat, setResultaat] = useState<{
    overall: number;
    xpGained: number;
    badgeUnlocked?: string[];
    kaartIsNieuw: boolean;
    tier: string;
  } | null>(null);

  const stapIndex = STAPPEN.indexOf(stap);
  const aantalIngevuld = Object.keys(scores).length;
  const aantalVragen = vragen.length;
  const alleScoresIngevuld = aantalIngevuld >= aantalVragen;

  // Auto-save draft bij elke wijziging
  useEffect(() => {
    saveDraft({
      stap: stapIndex,
      scores,
      relatie,
      context: context ?? "",
      contextDetail,
      opmerking,
    });
    // Toon toast kort
    setSavedToast(true);
    const timer = setTimeout(() => setSavedToast(false), 1500);
    return () => clearTimeout(timer);
  }, [scores, relatie, context, contextDetail, opmerking, stapIndex, saveDraft]);

  const handleScore = useCallback((vraagId: string, waarde: number) => {
    setScores((prev) => ({ ...prev, [vraagId]: waarde }));
  }, []);

  const volgendeStap = useCallback(() => {
    const volgende = STAPPEN[stapIndex + 1];
    if (volgende) setStap(volgende);
  }, [stapIndex]);

  const vorigeStap = useCallback(() => {
    const vorige = STAPPEN[stapIndex - 1];
    if (vorige) setStap(vorige);
  }, [stapIndex]);

  const handleNietBeoordeeld = useCallback(async () => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/scouting/rapport", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            spelerId: speler.id,
            context: context ?? "OVERIG",
            scores: {},
            verzoekId,
            relatie,
            nietBeoordeeld: true,
          }),
        });
        if (res.ok) {
          clearDraft();
          router.push(`/verzoeken/${verzoekId}`);
        }
      } catch (error) {
        logger.warn("Fout bij niet-beoordeeld:", error);
      }
    });
  }, [speler.id, context, verzoekId, relatie, clearDraft, router]);

  const handleIndienen = useCallback(async () => {
    if (!context) return;
    setFout(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/scouting/rapport", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            spelerId: speler.id,
            context,
            contextDetail: contextDetail || undefined,
            scores,
            opmerking: opmerking || undefined,
            verzoekId,
            relatie,
          }),
        });

        const data = await res.json();

        if (!data.ok) {
          setFout(data.error?.message ?? "Er ging iets mis");
          return;
        }

        clearDraft();
        setResultaat({
          overall: data.data.rapport.overall,
          xpGained: data.data.xpGained,
          badgeUnlocked: data.data.badgeUnlocked,
          kaartIsNieuw: !data.data.rapport.id,
          tier: "brons",
        });
      } catch (error) {
        logger.error("Fout bij indienen rapport:", error);
        setFout("Kon rapport niet opslaan. Probeer het opnieuw.");
      }
    });
  }, [context, contextDetail, scores, opmerking, speler.id, verzoekId, relatie, clearDraft]);

  // Celebration overlay na indienen
  if (resultaat) {
    const eersteBadge = resultaat.badgeUnlocked?.[0];
    return (
      <CelebrationOverlay
        xpGained={resultaat.xpGained}
        badgeUnlocked={eersteBadge ? { badge: eersteBadge, naam: eersteBadge } : undefined}
        kaartData={{
          overall: resultaat.overall,
          tier: resultaat.tier,
          isNieuw: resultaat.kaartIsNieuw,
        }}
        onDismiss={() => router.push(`/verzoeken/${verzoekId}`)}
      />
    );
  }

  return (
    <div className="bg-surface-dark flex min-h-[calc(100dvh-4rem)] flex-col">
      {/* Header met speler-context */}
      <header className="border-border-subtle bg-surface-card border-b px-4 py-3">
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (confirm("Concept opslaan en terug naar verzoek?")) {
                router.push(`/verzoeken/${verzoekId}`);
              }
            }}
            className="text-text-muted text-sm"
          >
            ← Terug
          </button>
          <DeadlineBadge deadline={verzoek.deadline} compact />
        </div>
        <SpelerContext
          relCode={speler.id}
          roepnaam={speler.roepnaam}
          achternaam={speler.achternaam}
          tussenvoegsel={speler.tussenvoegsel}
          geboortejaar={speler.geboortejaar}
          korfbalLeeftijd={PEILJAAR - speler.geboortejaar}
          geslacht={speler.geslacht}
          seizoenenActief={speler.seizoenenActief}
          heeftFoto={speler.heeftFoto}
          fotoUrl={`/api/scouting/spelers/${speler.id}/foto`}
          compact
        />
      </header>

      {/* Progress bar */}
      <div className="bg-surface-card flex items-center justify-center gap-2 py-3 shadow-none">
        {STAPPEN.map((s, i) => (
          <div
            key={s}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === stapIndex
                ? "w-8 bg-orange-500"
                : i < stapIndex
                  ? "w-2 bg-orange-300"
                  : "bg-surface-raised w-2"
            }`}
          />
        ))}
        <span className="text-text-muted ml-2 text-[10px]">
          {stapIndex + 1}/{STAPPEN.length}
        </span>
      </div>

      {/* Auto-save indicator */}
      {savedToast && (
        <div className="mx-4 mt-2 rounded-lg bg-green-50 px-3 py-1.5 text-center text-xs text-green-700">
          Concept opgeslagen
        </div>
      )}

      {/* Stappen */}
      <div className="flex-1 px-4 py-4">
        {stap === "relatie" && (
          <div>
            <h2 className="text-text-primary text-lg font-bold">Ken je deze speler?</h2>
            <p className="text-text-muted mt-1 text-sm">
              Dit helpt ons bij het wegen van beoordelingen. Eerlijkheid wordt gewaardeerd.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {RELATIE_OPTIES.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRelatie(opt.value)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    relatie === opt.value
                      ? "bg-orange-500 text-white shadow-md"
                      : "border-border-subtle bg-surface-card text-text-secondary border hover:border-orange-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {stap === "context" && (
          <StapContext
            context={context}
            contextDetail={contextDetail}
            onContextChange={setContext}
            onDetailChange={setContextDetail}
          />
        )}

        {stap === "beoordeling" && (
          <StapBeoordeling
            config={
              {
                naam: leeftijdsgroep,
                schaalType: schaalType as any,
                maxScore,
                pijlers: [],
                vragen: vragen.map((v) => ({
                  ...v,
                  pijler: (v as any).pijler ?? "techniek",
                  label: (v as any).label ?? (v as any).tekst ?? "",
                  schaal: schaalType as any,
                })),
              } as any
            }
            scores={scores}
            onScore={handleScore}
            leeftijdsgroep={leeftijdsgroep}
          />
        )}

        {stap === "opmerking" && (
          <StapOpmerking
            opmerking={opmerking}
            onOpmerkingChange={setOpmerking}
            roepnaam={speler.roepnaam}
          />
        )}

        {stap === "samenvatting" && (
          <StapSamenvatting
            speler={
              {
                id: speler.id,
                roepnaam: speler.roepnaam,
                achternaam: speler.achternaam,
                geboortejaar: speler.geboortejaar,
              } as any
            }
            context={context!}
            scores={scores}
            opmerking={opmerking}
            maxScore={maxScore}
            leeftijdsgroep={leeftijdsgroep}
          />
        )}
      </div>

      {/* Foutmelding */}
      {fout && (
        <div className="mx-4 mb-2 rounded-lg bg-red-100 px-4 py-2 text-sm text-red-700">{fout}</div>
      )}

      {/* Navigatie-balk */}
      <div className="border-border-subtle bg-surface-card border-t p-4">
        <div className="flex items-center gap-3">
          {/* Niet beoordeeld link */}
          {stap !== "samenvatting" && (
            <button
              type="button"
              onClick={handleNietBeoordeeld}
              disabled={isPending}
              className="text-text-muted text-xs underline"
            >
              Niet beoordeeld
            </button>
          )}

          <div className="flex flex-1 gap-3">
            {stapIndex > 0 && (
              <button
                type="button"
                onClick={vorigeStap}
                className="border-border-subtle text-text-secondary active:bg-surface-dark flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors"
              >
                Vorige
              </button>
            )}

            {stap === "samenvatting" ? (
              <button
                type="button"
                onClick={handleIndienen}
                disabled={isPending || !context || !alleScoresIngevuld}
                className="flex-1 rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? "Bezig met opslaan..." : "Verstuur rapport"}
              </button>
            ) : (
              <button
                type="button"
                onClick={volgendeStap}
                disabled={stap === "context" && !context}
                className="flex-1 rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {stap === "beoordeling"
                  ? `Volgende (${aantalIngevuld}/${aantalVragen})`
                  : "Volgende"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
