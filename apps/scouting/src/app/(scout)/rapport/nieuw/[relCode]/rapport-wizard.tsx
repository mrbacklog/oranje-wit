"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CelebrationOverlay } from "@/components/celebration-overlay";
import type { ScoutingGroepConfigV3 } from "@/lib/scouting/vragen";
import type { LeeftijdsgroepNaam } from "@/lib/scouting/leeftijdsgroep";
import { logger } from "@oranje-wit/types";
import { StapContext, StapOpmerking, SpelerAvatar } from "./wizard-stappen";
import type { ScoutingContext } from "./wizard-stappen";
import { StapBeoordelingV3 } from "./wizard-beoordelingen";
import { StapSamenvattingV3 } from "./wizard-samenvatting-v3";

interface RapportWizardProps {
  speler: {
    id: string;
    roepnaam: string;
    achternaam: string;
    geboortejaar: number;
  };
  leeftijdsgroep: LeeftijdsgroepNaam;
  config: ScoutingGroepConfigV3;
}

type GroeiIndicator = "geen" | "weinig" | "normaal" | "veel";

type WizardStap = "context" | "beoordeling" | "extra" | "opmerking" | "samenvatting";

const STAPPEN: WizardStap[] = ["context", "beoordeling", "extra", "opmerking", "samenvatting"];

export function RapportWizard({ speler, leeftijdsgroep, config }: RapportWizardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [stap, setStap] = useState<WizardStap>("context");
  const [context, setContext] = useState<ScoutingContext | null>(null);
  const [contextDetail, setContextDetail] = useState("");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [opmerking, setOpmerking] = useState("");

  // V3: extra velden
  const [groeiIndicator, setGroeiIndicator] = useState<GroeiIndicator>("normaal");
  const [socialeVeiligheid, setSocialeVeiligheid] = useState<number | boolean | null>(null);
  const [fysiekProfiel, setFysiekProfiel] = useState<{
    lengte: string;
    lichaamsbouw: string;
    atletisch: string;
  }>({ lengte: "", lichaamsbouw: "", atletisch: "" });
  const [veldZaal, setVeldZaal] = useState<"veld" | "zaal">("veld");

  const [resultaat, setResultaat] = useState<{
    overall: number;
    xpGained: number;
    badgeUnlocked?: string[];
    kaartIsNieuw: boolean;
    tier: string;
  } | null>(null);
  const [fout, setFout] = useState<string | null>(null);

  const stapIndex = STAPPEN.indexOf(stap);
  const aantalIngevuld = Object.keys(scores).length;
  const aantalVragen = config.items.length;
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
            groeiIndicator,
            socialeVeiligheid,
            fysiekProfiel: config.heeftFysiekProfiel ? fysiekProfiel : undefined,
            veldZaal,
            versie: "v3",
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
  }, [
    context,
    contextDetail,
    scores,
    opmerking,
    speler.id,
    groeiIndicator,
    socialeVeiligheid,
    fysiekProfiel,
    veldZaal,
    config.heeftFysiekProfiel,
  ]);

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
                  : "w-2 bg-surface-card/20"
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
          <StapBeoordelingV3
            config={config}
            scores={scores}
            onScore={handleScore}
            leeftijdsgroep={leeftijdsgroep}
          />
        )}

        {stap === "extra" && (
          <StapExtraVelden
            groeiIndicator={groeiIndicator}
            onGroeiChange={setGroeiIndicator}
            socialeVeiligheid={socialeVeiligheid}
            onSocialeVeiligheidChange={setSocialeVeiligheid}
            config={config}
            fysiekProfiel={fysiekProfiel}
            onFysiekProfielChange={setFysiekProfiel}
            veldZaal={veldZaal}
            onVeldZaalChange={setVeldZaal}
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
          <StapSamenvattingV3
            speler={speler}
            context={context!}
            scores={scores}
            opmerking={opmerking}
            config={config}
            groeiIndicator={groeiIndicator}
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

// ─── Extra velden stap ───

function StapExtraVelden({
  groeiIndicator,
  onGroeiChange,
  socialeVeiligheid,
  onSocialeVeiligheidChange,
  config,
  fysiekProfiel,
  onFysiekProfielChange,
  veldZaal,
  onVeldZaalChange,
}: {
  groeiIndicator: GroeiIndicator;
  onGroeiChange: (v: GroeiIndicator) => void;
  socialeVeiligheid: number | boolean | null;
  onSocialeVeiligheidChange: (v: number | boolean | null) => void;
  config: ScoutingGroepConfigV3;
  fysiekProfiel: { lengte: string; lichaamsbouw: string; atletisch: string };
  onFysiekProfielChange: (v: { lengte: string; lichaamsbouw: string; atletisch: string }) => void;
  veldZaal: "veld" | "zaal";
  onVeldZaalChange: (v: "veld" | "zaal") => void;
}) {
  const GROEI_OPTIES: { value: GroeiIndicator; label: string }[] = [
    { value: "geen", label: "Geen groei" },
    { value: "weinig", label: "Weinig groei" },
    { value: "normaal", label: "Normaal" },
    { value: "veel", label: "Veel groei" },
  ];

  return (
    <div className="flex animate-[fadeIn_300ms_ease] flex-col gap-6">
      <h2 className="text-xl font-bold">Extra observaties</h2>

      {/* Veld/Zaal context */}
      <div>
        <label className="text-text-secondary mb-2 block text-sm font-medium">Context</label>
        <div className="flex gap-2">
          {(["veld", "zaal"] as const).map((optie) => (
            <button
              key={optie}
              type="button"
              onClick={() => onVeldZaalChange(optie)}
              className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold capitalize transition-all ${
                veldZaal === optie
                  ? "border-ow-oranje bg-ow-oranje/10 text-ow-oranje"
                  : "bg-surface-card text-text-secondary border-white/10"
              }`}
            >
              {optie}
            </button>
          ))}
        </div>
      </div>

      {/* Groei-indicator */}
      <div>
        <label className="text-text-secondary mb-2 block text-sm font-medium">
          Groei-indicator
        </label>
        <div className="grid grid-cols-2 gap-2">
          {GROEI_OPTIES.map((optie) => (
            <button
              key={optie.value}
              type="button"
              onClick={() => onGroeiChange(optie.value)}
              className={`rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-all ${
                groeiIndicator === optie.value
                  ? "border-ow-oranje bg-ow-oranje/10 text-ow-oranje"
                  : "bg-surface-card text-text-secondary border-white/10"
              }`}
            >
              {optie.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sociale veiligheid */}
      {config.heeftSignaalvlag && (
        <div>
          <label className="text-text-secondary mb-2 block text-sm font-medium">
            Sociale veiligheid
          </label>
          {config.signaalvlagType === "ja_nee" ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onSocialeVeiligheidChange(true)}
                className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
                  socialeVeiligheid === true
                    ? "border-green-500 bg-green-500/10 text-green-400"
                    : "bg-surface-card text-text-secondary border-white/10"
                }`}
              >
                Ja, veilig
              </button>
              <button
                type="button"
                onClick={() => onSocialeVeiligheidChange(false)}
                className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
                  socialeVeiligheid === false
                    ? "border-red-500 bg-red-500/10 text-red-400"
                    : "bg-surface-card text-text-secondary border-white/10"
                }`}
              >
                Nee, signaal
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={config.band === "geel" ? 5 : 10}
                value={(socialeVeiligheid as number) ?? (config.band === "geel" ? 3 : 5)}
                onChange={(e) => onSocialeVeiligheidChange(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-ow-oranje w-8 text-center text-lg font-bold">
                {(socialeVeiligheid as number) ?? "-"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Fysiek profiel (vanaf Geel) */}
      {config.heeftFysiekProfiel && (
        <div className="bg-surface-card rounded-2xl border border-white/10 p-4">
          <h3 className="mb-3 text-sm font-bold">Fysiek profiel</h3>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-text-muted mb-1 block text-xs">Lengte (relatief)</label>
              <select
                value={fysiekProfiel.lengte}
                onChange={(e) =>
                  onFysiekProfielChange({ ...fysiekProfiel, lengte: e.target.value })
                }
                className="bg-surface-elevated text-text-primary w-full rounded-lg border border-white/10 px-3 py-2 text-sm"
              >
                <option value="">Selecteer...</option>
                <option value="onder_gemiddeld">Onder gemiddeld</option>
                <option value="gemiddeld">Gemiddeld</option>
                <option value="bovengemiddeld">Bovengemiddeld</option>
                <option value="uitzonderlijk">Uitzonderlijk</option>
              </select>
            </div>
            <div>
              <label className="text-text-muted mb-1 block text-xs">Lichaamsbouw</label>
              <select
                value={fysiekProfiel.lichaamsbouw}
                onChange={(e) =>
                  onFysiekProfielChange({ ...fysiekProfiel, lichaamsbouw: e.target.value })
                }
                className="bg-surface-elevated text-text-primary w-full rounded-lg border border-white/10 px-3 py-2 text-sm"
              >
                <option value="">Selecteer...</option>
                <option value="licht">Licht</option>
                <option value="gemiddeld">Gemiddeld</option>
                <option value="stevig">Stevig</option>
              </select>
            </div>
            <div>
              <label className="text-text-muted mb-1 block text-xs">Atletisch type</label>
              <select
                value={fysiekProfiel.atletisch}
                onChange={(e) =>
                  onFysiekProfielChange({ ...fysiekProfiel, atletisch: e.target.value })
                }
                className="bg-surface-elevated text-text-primary w-full rounded-lg border border-white/10 px-3 py-2 text-sm"
              >
                <option value="">Selecteer...</option>
                <option value="onder_gemiddeld">Onder gemiddeld</option>
                <option value="gemiddeld">Gemiddeld</option>
                <option value="bovengemiddeld">Bovengemiddeld</option>
                <option value="uitzonderlijk">Uitzonderlijk</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
