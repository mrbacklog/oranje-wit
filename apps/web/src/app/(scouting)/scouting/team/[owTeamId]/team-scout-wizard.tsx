"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CelebrationOverlay } from "@/components/scouting/celebration-overlay";
import type { ScoutingGroepConfigV3, ScoutingVraagV3 } from "@/lib/scouting/vragen";
import type { LeeftijdsgroepNaam } from "@/lib/scouting/leeftijdsgroep";
import type { PijlerCode } from "@oranje-wit/types";
import { logger } from "@oranje-wit/types";
import { StapContext, StapRanking, StapOpmerkingen, StapTeamSamenvattingV3 } from "./stappen";
import { StapTeamBeoordelingV3 } from "./stappen/stap-beoordeling";

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
  config: ScoutingGroepConfigV3;
  kernItems: ScoutingVraagV3[];
}

type WizardStap = "context" | "beoordeling" | "ranking" | "opmerkingen" | "samenvatting";
type ScoutingContextType = "WEDSTRIJD" | "TRAINING" | "OVERIG";

const STAPPEN: WizardStap[] = ["context", "beoordeling", "ranking", "opmerkingen", "samenvatting"];

type GroeiIndicator = "geen" | "weinig" | "normaal" | "veel";

// ─── Main Wizard ───

export function TeamScoutWizard({
  team,
  spelers,
  leeftijdsgroep,
  config,
  kernItems,
}: TeamScoutWizardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [stap, setStap] = useState<WizardStap>("context");
  const [context, setContext] = useState<ScoutingContextType | null>(null);
  const [contextDetail, setContextDetail] = useState("");

  // Scores: per speler per item-id
  const [alleScores, setAlleScores] = useState<Record<string, Record<string, number>>>({});

  // Opmerkingen per speler
  const [opmerkingen, setOpmerkingen] = useState<Record<string, string>>({});

  // Rankings per pijler
  const [rankings, setRankings] = useState<Record<string, string[]>>({});

  // Groei-indicator per speler
  const [groeiPerSpeler, setGroeiPerSpeler] = useState<Record<string, GroeiIndicator>>({});

  // Sociale veiligheid per speler
  const [socialeVeiligheidPerSpeler, setSocialeVeiligheidPerSpeler] = useState<
    Record<string, number | boolean>
  >({});

  // Resultaat
  const [resultaat, setResultaat] = useState<{
    xpGained: number;
    rapportenCount: number;
    badgeUnlocked?: { badge: string; naam: string };
  } | null>(null);

  const [fout, setFout] = useState<string | null>(null);

  // Actieve pijler
  const pijlerCodes = useMemo(() => config.pijlers.map((p) => p.code), [config.pijlers]);
  const [actievePijler, setActievePijler] = useState<PijlerCode>(pijlerCodes[0] ?? "AANVALLEN");

  const stapIndex = STAPPEN.indexOf(stap);

  // Voortgang: alleen kern-items tellen
  const totalScoresNeeded = spelers.length * kernItems.length;
  const totalScoresFilled = Object.values(alleScores).reduce(
    (acc, spelerScores) => acc + Object.keys(spelerScores).length,
    0
  );
  const alleScoresIngevuld = totalScoresFilled >= totalScoresNeeded;

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
            groeiIndicator: groeiPerSpeler[s.id] ?? "normaal",
            socialeVeiligheid: socialeVeiligheidPerSpeler[s.id] ?? null,
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
            versie: "v3",
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
  }, [
    context,
    contextDetail,
    spelers,
    alleScores,
    opmerkingen,
    rankings,
    team.id,
    groeiPerSpeler,
    socialeVeiligheidPerSpeler,
  ]);

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
              {spelers.length} spelers - {leeftijdsgroep} - Kernset ({kernItems.length} items)
            </p>
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
                  : "bg-surface-card/20 w-2"
            }`}
          />
        ))}
      </div>

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
          <StapTeamBeoordelingV3
            spelers={spelers}
            kernItems={kernItems}
            config={config}
            actievePijler={actievePijler}
            onPijlerChange={setActievePijler}
            alleScores={alleScores}
            onScore={handleScore}
            groeiPerSpeler={groeiPerSpeler}
            onGroeiChange={(id, v) => setGroeiPerSpeler((prev) => ({ ...prev, [id]: v }))}
            socialeVeiligheidPerSpeler={socialeVeiligheidPerSpeler}
            onSocialeVeiligheidChange={(id, v) =>
              setSocialeVeiligheidPerSpeler((prev) => ({ ...prev, [id]: v }))
            }
          />
        )}

        {stap === "ranking" && (
          <StapRanking
            spelers={spelers}
            pijlers={pijlerCodes as string[]}
            rankings={rankings}
            onUp={handleRankingUp}
            onDown={handleRankingDown}
            leeftijdsgroep={leeftijdsgroep}
            config={config}
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
          <StapTeamSamenvattingV3
            team={team}
            spelers={spelers}
            context={context!}
            alleScores={alleScores}
            opmerkingen={opmerkingen}
            config={config}
            kernItems={kernItems}
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
