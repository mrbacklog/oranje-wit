"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CelebrationOverlay } from "@/components/celebration-overlay";
import type { ScoutingVraag } from "@/lib/scouting/vragen";
import type { SchaalType, LeeftijdsgroepNaam } from "@/lib/scouting/leeftijdsgroep";
import { logger } from "@oranje-wit/types";
import { StapContext, StapOpmerking, StapSamenvatting, SpelerAvatar } from "./wizard-stappen";
import type { ScoutingContext } from "./wizard-stappen";
import { StapBeoordeling } from "./wizard-beoordelingen";

interface RapportWizardProps {
  speler: {
    id: string;
    roepnaam: string;
    achternaam: string;
    geboortejaar: number;
  };
  leeftijdsgroep: LeeftijdsgroepNaam;
  schaalType: SchaalType;
  maxScore: number;
  vragen: ScoutingVraag[];
}

type WizardStap = "context" | "beoordeling" | "opmerking" | "samenvatting";

const STAPPEN: WizardStap[] = ["context", "beoordeling", "opmerking", "samenvatting"];

export function RapportWizard({
  speler,
  leeftijdsgroep,
  schaalType,
  maxScore,
  vragen,
}: RapportWizardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [stap, setStap] = useState<WizardStap>("context");
  const [context, setContext] = useState<ScoutingContext | null>(null);
  const [contextDetail, setContextDetail] = useState("");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [opmerking, setOpmerking] = useState("");
  const [resultaat, setResultaat] = useState<{
    overall: number;
    xpGained: number;
    badgeUnlocked?: string[];
    kaartIsNieuw: boolean;
    tier: string;
  } | null>(null);
  const [fout, setFout] = useState<string | null>(null);

  const [smileyIndex, setSmileyIndex] = useState(0);

  const stapIndex = STAPPEN.indexOf(stap);
  const aantalIngevuld = Object.keys(scores).length;
  const aantalVragen = vragen.length;
  const alleScoresIngevuld = aantalIngevuld >= aantalVragen;

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
          }),
        });

        const data = await res.json();

        if (!data.ok) {
          setFout(data.error?.message ?? "Er ging iets mis");
          return;
        }

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
  }, [context, contextDetail, scores, opmerking, speler.id]);

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
        onDismiss={() => router.push("/")}
      />
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col">
      <header className="border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <SpelerAvatar roepnaam={speler.roepnaam} leeftijdsgroep={leeftijdsgroep} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold">
              {speler.roepnaam} {speler.achternaam}
            </h1>
            <p className="text-text-secondary text-xs capitalize">{leeftijdsgroep}</p>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-center gap-2 py-3">
        {STAPPEN.map((s, i) => (
          <div
            key={s}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === stapIndex
                ? "bg-ow-oranje w-8"
                : i < stapIndex
                  ? "bg-ow-oranje/50 w-2"
                  : "w-2 bg-white/20"
            }`}
          />
        ))}
      </div>

      <div className="flex-1 px-4 pb-4">
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
            schaalType={schaalType}
            vragen={vragen}
            scores={scores}
            onScore={handleScore}
            leeftijdsgroep={leeftijdsgroep}
            smileyIndex={smileyIndex}
            onSmileyIndexChange={setSmileyIndex}
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
            speler={speler}
            context={context!}
            scores={scores}
            opmerking={opmerking}
            maxScore={maxScore}
            leeftijdsgroep={leeftijdsgroep}
          />
        )}
      </div>

      {fout && (
        <div className="mx-4 mb-2 rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-300">
          {fout}
        </div>
      )}

      <div className="border-t border-white/10 p-4">
        <div className="flex gap-3">
          {stapIndex > 0 && (
            <button
              type="button"
              onClick={vorigeStap}
              className="text-text-secondary active:bg-surface-elevated flex-1 rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold transition-colors"
            >
              Vorige
            </button>
          )}

          {stap === "samenvatting" ? (
            <button
              type="button"
              onClick={handleIndienen}
              disabled={isPending || !context || !alleScoresIngevuld}
              className="bg-ow-oranje flex-1 rounded-xl px-4 py-3 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Bezig met opslaan..." : "Rapport indienen"}
            </button>
          ) : (
            <button
              type="button"
              onClick={volgendeStap}
              disabled={
                (stap === "context" && !context) || (stap === "beoordeling" && !alleScoresIngevuld)
              }
              className="bg-ow-oranje flex-1 rounded-xl px-4 py-3 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {stap === "beoordeling" ? `Volgende (${aantalIngevuld}/${aantalVragen})` : "Volgende"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
