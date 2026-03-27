"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { logger } from "@oranje-wit/types";
import type { LeeftijdsgroepNaamV3 } from "@oranje-wit/types";
import { LEEFTIJDSGROEP_CONFIG } from "@oranje-wit/types";
import { SpelerZoek } from "@/components/speler-zoek";
import { leeftijdNaarGroep } from "@/components/kaart-constanten";
import { PEILJAAR } from "@oranje-wit/types";
import { StapVergelijking } from "./stap-vergelijking";
import { StapVergelijkingSamenvatting } from "./stap-samenvatting";

interface SpelerSelectie {
  id: string;
  roepnaam: string;
  achternaam: string;
  geboortejaar: number;
}

type WizardStap = "selectie" | "vergelijking" | "samenvatting";
const STAPPEN: WizardStap[] = ["selectie", "vergelijking", "samenvatting"];

export function VergelijkingWizard({
  teams,
}: {
  teams: { id: number; naam: string; kleur: string | null; leeftijdsgroep: string | null }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [stap, setStap] = useState<WizardStap>("selectie");
  const [gekozenSpelers, setGekozenSpelers] = useState<SpelerSelectie[]>([]);
  const [context, setContext] = useState<"WEDSTRIJD" | "TRAINING" | "OVERIG">("WEDSTRIJD");
  const [opmerking, setOpmerking] = useState("");

  // Per pijler per speler: positie 0-100
  const [posities, setPosities] = useState<Record<string, Record<string, number>>>({});

  const [fout, setFout] = useState<string | null>(null);
  const [klaar, setKlaar] = useState(false);

  const stapIndex = STAPPEN.indexOf(stap);

  // Bepaal leeftijdsgroep van de geselecteerde spelers
  const groep = useMemo(() => {
    if (gekozenSpelers.length === 0) return "geel" as LeeftijdsgroepNaamV3;
    const gemLeeftijd = PEILJAAR - gekozenSpelers[0].geboortejaar;
    return leeftijdNaarGroep(gemLeeftijd) as LeeftijdsgroepNaamV3;
  }, [gekozenSpelers]);

  const config = LEEFTIJDSGROEP_CONFIG[groep];

  const handleSpelerToevoegen = useCallback(
    (speler: SpelerSelectie) => {
      if (gekozenSpelers.length >= 6) return;
      if (gekozenSpelers.some((s) => s.id === speler.id)) return;
      setGekozenSpelers((prev) => [...prev, speler]);

      setPosities((prev) => {
        const nieuw = { ...prev };
        for (const p of config.pijlers) {
          if (!nieuw[p.code]) nieuw[p.code] = {};
          nieuw[p.code][speler.id] = 50;
        }
        return nieuw;
      });
    },
    [gekozenSpelers, config.pijlers]
  );

  const handleSpelerVerwijderen = useCallback((spelerId: string) => {
    setGekozenSpelers((prev) => prev.filter((s) => s.id !== spelerId));
    setPosities((prev) => {
      const nieuw = { ...prev };
      for (const key of Object.keys(nieuw)) {
        const pijler = { ...nieuw[key] };
        delete pijler[spelerId];
        nieuw[key] = pijler;
      }
      return nieuw;
    });
  }, []);

  const handlePositieChange = useCallback(
    (pijlerCode: string, spelerId: string, waarde: number) => {
      setPosities((prev) => ({
        ...prev,
        [pijlerCode]: {
          ...(prev[pijlerCode] ?? {}),
          [spelerId]: waarde,
        },
      }));
    },
    []
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
    setFout(null);

    startTransition(async () => {
      try {
        const positieData: Array<{
          spelerId: string;
          pijlerCode: string;
          balkPositie: number;
        }> = [];

        for (const [pijlerCode, spelerPosities] of Object.entries(posities)) {
          for (const [spelerId, positie] of Object.entries(spelerPosities)) {
            positieData.push({ spelerId, pijlerCode, balkPositie: positie });
          }
        }

        const res = await fetch("/api/scouting/vergelijking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            context,
            opmerking: opmerking || undefined,
            spelerIds: gekozenSpelers.map((s) => s.id),
            posities: positieData,
          }),
        });

        const data = await res.json();

        if (!data.ok) {
          setFout(data.error?.message ?? "Er ging iets mis");
          return;
        }

        setKlaar(true);
      } catch (error) {
        logger.error("Fout bij indienen vergelijking:", error);
        setFout("Kon vergelijking niet opslaan. Probeer het opnieuw.");
      }
    });
  }, [context, opmerking, gekozenSpelers, posities]);

  if (klaar) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center px-4 text-center">
        <div className="text-5xl">✓</div>
        <h1 className="mt-4 text-2xl font-bold">Vergelijking opgeslagen</h1>
        <p className="text-text-secondary mt-2 text-sm">
          De pijlerscores van {gekozenSpelers.length} spelers zijn vergeleken.
        </p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="bg-ow-oranje mt-6 rounded-xl px-6 py-3 text-sm font-bold text-white"
        >
          Terug naar dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col">
      <header className="border-b border-white/10 px-4 py-3">
        <h1 className="text-lg font-bold">Vergelijking</h1>
        <p className="text-text-secondary text-xs">
          Vergelijk 2-6 spelers per pijler op een continue balk
        </p>
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
        {stap === "selectie" && (
          <StapSpelerSelectie
            gekozenSpelers={gekozenSpelers}
            onToevoegen={handleSpelerToevoegen}
            onVerwijderen={handleSpelerVerwijderen}
            context={context}
            onContextChange={setContext}
          />
        )}

        {stap === "vergelijking" && (
          <StapVergelijking
            spelers={gekozenSpelers}
            pijlers={config.pijlers}
            posities={posities}
            onPositieChange={handlePositieChange}
          />
        )}

        {stap === "samenvatting" && (
          <StapVergelijkingSamenvatting
            spelers={gekozenSpelers}
            pijlers={config.pijlers}
            posities={posities}
            opmerking={opmerking}
            onOpmerkingChange={setOpmerking}
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
              disabled={isPending || gekozenSpelers.length < 2}
              className="bg-ow-oranje flex-1 rounded-xl px-4 py-3 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Bezig met opslaan..." : "Vergelijking opslaan"}
            </button>
          ) : (
            <button
              type="button"
              onClick={volgendeStap}
              disabled={stap === "selectie" && gekozenSpelers.length < 2}
              className="bg-ow-oranje flex-1 rounded-xl px-4 py-3 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Volgende
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Stap: Speler selectie ───

function StapSpelerSelectie({
  gekozenSpelers,
  onToevoegen,
  onVerwijderen,
  context,
  onContextChange,
}: {
  gekozenSpelers: SpelerSelectie[];
  onToevoegen: (s: SpelerSelectie) => void;
  onVerwijderen: (id: string) => void;
  context: string;
  onContextChange: (v: "WEDSTRIJD" | "TRAINING" | "OVERIG") => void;
}) {
  return (
    <div className="animate-[fadeIn_300ms_ease]">
      <h2 className="mb-2 text-xl font-bold">Selecteer spelers</h2>
      <p className="text-text-secondary mb-4 text-sm">
        Kies 2-6 spelers om te vergelijken. Zoek op naam.
      </p>

      {/* Context */}
      <div className="mb-4 flex gap-2">
        {(["WEDSTRIJD", "TRAINING", "OVERIG"] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onContextChange(c)}
            className={`rounded-xl border-2 px-3 py-2 text-xs font-semibold transition-all ${
              context === c
                ? "border-ow-oranje bg-ow-oranje/10 text-ow-oranje"
                : "bg-surface-card text-text-secondary border-white/10"
            }`}
          >
            {c === "WEDSTRIJD" ? "Wedstrijd" : c === "TRAINING" ? "Training" : "Overig"}
          </button>
        ))}
      </div>

      {/* Zoekbalk */}
      {gekozenSpelers.length < 6 && (
        <div className="mb-4">
          <SpelerZoek
            onSelect={(speler) =>
              onToevoegen({
                id: speler.relCode,
                roepnaam: speler.roepnaam,
                achternaam: speler.achternaam,
                geboortejaar: speler.geboortejaar,
              })
            }
          />
        </div>
      )}

      {/* Gekozen spelers */}
      <div className="flex flex-col gap-2">
        {gekozenSpelers.map((speler) => (
          <div
            key={speler.id}
            className="bg-surface-card flex items-center gap-3 rounded-xl border border-white/10 px-4 py-3"
          >
            <div className="bg-ow-oranje/20 flex h-8 w-8 items-center justify-center rounded-full">
              <span className="text-ow-oranje text-sm font-bold">{speler.roepnaam.charAt(0)}</span>
            </div>
            <span className="min-w-0 flex-1 truncate text-sm font-bold">
              {speler.roepnaam} {speler.achternaam}
            </span>
            <button
              type="button"
              onClick={() => onVerwijderen(speler.id)}
              className="text-text-muted rounded-full p-1 hover:bg-red-500/20 hover:text-red-400"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {gekozenSpelers.length < 2 && (
        <p className="text-text-muted mt-4 text-center text-xs">
          Selecteer minimaal 2 spelers om door te gaan
        </p>
      )}
    </div>
  );
}
