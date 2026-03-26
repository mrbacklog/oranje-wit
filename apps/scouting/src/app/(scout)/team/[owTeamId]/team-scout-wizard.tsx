"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CelebrationOverlay } from "@/components/celebration-overlay";
import type { ScoutingVraag, Pijler } from "@/lib/scouting/vragen";
import { actievePijlers as getActievePijlers } from "@/lib/scouting/vragen";
import type { SchaalType, LeeftijdsgroepNaam } from "@/lib/scouting/leeftijdsgroep";
import { logger } from "@oranje-wit/types";
import {
  StapContext,
  StapTeamBeoordeling,
  StapRanking,
  StapOpmerkingen,
  StapTeamSamenvatting,
} from "./stappen";

// ─── Types ───

interface SpelerInfo {
  id: string;
  roepnaam: string;
  achternaam: string;
  geboortejaar: number;
  heeftFoto: boolean;
}

interface TeamInfo {
  id: number;
  naam: string;
  kleur: string | null;
  leeftijdsgroep: string | null;
}

interface TeamScoutWizardProps {
  team: TeamInfo;
  spelers: SpelerInfo[];
  leeftijdsgroep: LeeftijdsgroepNaam;
  schaalType: SchaalType;
  maxScore: number;
  vragen: ScoutingVraag[];
}

type WizardStap = "context" | "beoordeling" | "ranking" | "opmerkingen" | "samenvatting";
type ScoutingContext = "WEDSTRIJD" | "TRAINING" | "OVERIG";

const STAPPEN: WizardStap[] = ["context", "beoordeling", "ranking", "opmerkingen", "samenvatting"];

// ─── Main Wizard ───

export function TeamScoutWizard({
  team,
  spelers,
  leeftijdsgroep,
  schaalType,
  maxScore,
  vragen,
}: TeamScoutWizardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [stap, setStap] = useState<WizardStap>("context");
  const [context, setContext] = useState<ScoutingContext | null>(null);
  const [contextDetail, setContextDetail] = useState("");

  // Scores: per speler per vraag-id
  const [alleScores, setAlleScores] = useState<Record<string, Record<string, number>>>({});

  // Opmerkingen per speler
  const [opmerkingen, setOpmerkingen] = useState<Record<string, string>>({});

  // Rankings per pijler (optioneel)
  const [rankings, setRankings] = useState<Record<string, string[]>>({});

  // Resultaat na indienen
  const [resultaat, setResultaat] = useState<{
    xpGained: number;
    rapportenCount: number;
    badgeUnlocked?: { badge: string; naam: string };
  } | null>(null);

  const [fout, setFout] = useState<string | null>(null);

  // Actieve pijler in beoordeling-stap
  const pijlers = useMemo(() => getActievePijlers(leeftijdsgroep), [leeftijdsgroep]);
  const [actievePijler, setActievePijler] = useState<Pijler>(pijlers[0] ?? "SCH");

  const stapIndex = STAPPEN.indexOf(stap);

  // Bereken voortgang
  const totalScoresNeeded = spelers.length * vragen.length;
  const totalScoresFilled = Object.values(alleScores).reduce(
    (acc, spelerScores) => acc + Object.keys(spelerScores).length,
    0
  );
  const alleScoresIngevuld = totalScoresFilled >= totalScoresNeeded;

  // Per pijler: hoeveel spelers zijn volledig gescoord
  const pijlerVoortgang = useMemo(() => {
    const result: Record<string, { klaar: number; totaal: number }> = {};
    for (const pijler of pijlers) {
      const pijlerVragen = vragen.filter((v) => v.pijler === pijler);
      let klaar = 0;
      for (const speler of spelers) {
        const scores = alleScores[speler.id] ?? {};
        const alleIngevuld = pijlerVragen.every((v) => scores[v.id] != null);
        if (alleIngevuld) klaar++;
      }
      result[pijler] = { klaar, totaal: spelers.length };
    }
    return result;
  }, [alleScores, pijlers, spelers, vragen]);

  // Team-gemiddelde voor actieve pijler
  const teamGemiddelde = useMemo(() => {
    const pijlerVragen = vragen.filter((v) => v.pijler === actievePijler);
    const waarden: number[] = [];
    for (const speler of spelers) {
      const scores = alleScores[speler.id] ?? {};
      for (const vraag of pijlerVragen) {
        if (scores[vraag.id] != null) {
          waarden.push(scores[vraag.id]);
        }
      }
    }
    if (waarden.length === 0) return null;
    return (waarden.reduce((a, b) => a + b, 0) / waarden.length).toFixed(1);
  }, [alleScores, actievePijler, spelers, vragen]);

  const handleScore = useCallback((spelerId: string, vraagId: string, waarde: number) => {
    setAlleScores((prev) => ({
      ...prev,
      [spelerId]: {
        ...(prev[spelerId] ?? {}),
        [vraagId]: waarde,
      },
    }));
  }, []);

  const handleOpmerking = useCallback((spelerId: string, tekst: string) => {
    setOpmerkingen((prev) => ({ ...prev, [spelerId]: tekst }));
  }, []);

  const handleRankingUp = useCallback(
    (pijler: string, spelerId: string) => {
      setRankings((prev) => {
        const current = prev[pijler] ?? spelers.map((s) => s.id);
        const index = current.indexOf(spelerId);
        if (index <= 0) return prev;
        const nieuw = [...current];
        [nieuw[index - 1], nieuw[index]] = [nieuw[index], nieuw[index - 1]];
        return { ...prev, [pijler]: nieuw };
      });
    },
    [spelers]
  );

  const handleRankingDown = useCallback(
    (pijler: string, spelerId: string) => {
      setRankings((prev) => {
        const current = prev[pijler] ?? spelers.map((s) => s.id);
        const index = current.indexOf(spelerId);
        if (index < 0 || index >= current.length - 1) return prev;
        const nieuw = [...current];
        [nieuw[index], nieuw[index + 1]] = [nieuw[index + 1], nieuw[index]];
        return { ...prev, [pijler]: nieuw };
      });
    },
    [spelers]
  );

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
        const rapportenData = spelers
          .filter((s) => {
            const scores = alleScores[s.id];
            return scores && Object.keys(scores).length > 0;
          })
          .map((s) => ({
            spelerId: s.id,
            scores: alleScores[s.id],
            opmerking: opmerkingen[s.id] || undefined,
          }));

        if (rapportenData.length === 0) {
          setFout("Geen scores ingevuld");
          return;
        }

        const res = await fetch("/api/scouting/team", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            owTeamId: team.id,
            context,
            contextDetail: contextDetail || undefined,
            rapporten: rapportenData,
            rankings: Object.keys(rankings).length > 0 ? rankings : undefined,
          }),
        });

        const data = await res.json();

        if (!data.ok) {
          setFout(data.error?.message ?? "Er ging iets mis");
          return;
        }

        setResultaat({
          xpGained: data.data.xpGained,
          rapportenCount: data.data.rapportenCount,
          badgeUnlocked: data.data.badgeUnlocked,
        });
      } catch (error) {
        logger.error("Fout bij indienen team-scouting:", error);
        setFout("Kon team-scouting niet opslaan. Probeer het opnieuw.");
      }
    });
  }, [context, contextDetail, spelers, alleScores, opmerkingen, rankings, team.id]);

  // Celebration
  if (resultaat) {
    return (
      <CelebrationOverlay
        xpGained={resultaat.xpGained}
        badgeUnlocked={resultaat.badgeUnlocked}
        teamModus
        aantalRapporten={resultaat.rapportenCount}
        onDismiss={() => router.push("/")}
      />
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col">
      {/* Header */}
      <header className="border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: team.kleur ?? "#888" }}
          >
            <span className="text-sm font-bold text-white">{(team.naam ?? "?").charAt(0)}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold">{team.naam}</h1>
            <p className="text-text-secondary text-xs">
              {spelers.length} spelers - {leeftijdsgroep}
            </p>
          </div>
        </div>
      </header>

      {/* Stappen-indicator */}
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

      {/* Stap-inhoud */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {stap === "context" && (
          <StapContext
            context={context}
            contextDetail={contextDetail}
            onContextChange={setContext}
            onDetailChange={setContextDetail}
          />
        )}

        {stap === "beoordeling" && (
          <StapTeamBeoordeling
            spelers={spelers}
            vragen={vragen}
            pijlers={pijlers}
            actievePijler={actievePijler}
            onPijlerChange={setActievePijler}
            alleScores={alleScores}
            onScore={handleScore}
            schaalType={schaalType}
            leeftijdsgroep={leeftijdsgroep}
            pijlerVoortgang={pijlerVoortgang}
            teamGemiddelde={teamGemiddelde}
            maxScore={maxScore}
          />
        )}

        {stap === "ranking" && (
          <StapRanking
            spelers={spelers}
            pijlers={pijlers}
            rankings={rankings}
            onUp={handleRankingUp}
            onDown={handleRankingDown}
            leeftijdsgroep={leeftijdsgroep}
          />
        )}

        {stap === "opmerkingen" && (
          <StapOpmerkingen
            spelers={spelers}
            opmerkingen={opmerkingen}
            onOpmerkingChange={handleOpmerking}
            leeftijdsgroep={leeftijdsgroep}
          />
        )}

        {stap === "samenvatting" && (
          <StapTeamSamenvatting
            team={team}
            spelers={spelers}
            context={context!}
            alleScores={alleScores}
            opmerkingen={opmerkingen}
            vragen={vragen}
            pijlers={pijlers}
            maxScore={maxScore}
            leeftijdsgroep={leeftijdsgroep}
          />
        )}
      </div>

      {/* Foutmelding */}
      {fout && (
        <div className="mx-4 mb-2 rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-300">
          {fout}
        </div>
      )}

      {/* Navigatie */}
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
              {isPending ? "Bezig met opslaan..." : `Indienen (${spelers.length} spelers)`}
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
              {stap === "beoordeling"
                ? `Volgende (${totalScoresFilled}/${totalScoresNeeded})`
                : "Volgende"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
