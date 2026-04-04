"use client";

import { useState, useCallback, useMemo } from "react";
// Tijdelijke stubs — worden in Task 4 vervangen door werkindeling wizard-actions
async function createScenarioVanuitBlauwdruk(
  _blauwdrukId: string,
  _naam: string,
  _data: any
): Promise<string> {
  throw new Error("createScenarioVanuitBlauwdruk: nog niet geïmplementeerd voor werkindeling");
}
async function createLeegScenario(_blauwdrukId: string, _naam: string): Promise<string> {
  throw new Error("createLeegScenario: nog niet geïmplementeerd voor werkindeling");
}
async function kopieerScenario(_scenarioId: string, _naam: string): Promise<string> {
  throw new Error("kopieerScenario: nog niet geïmplementeerd voor werkindeling");
}
import { berekenBTeamVoorstel, berekenLeeftijdVerdeling } from "@/lib/teamindeling/teamstructuur";
import type { SpelerBasis, ACatConfig, BTeamVoorstel } from "@/lib/teamindeling/teamstructuur";
import { PEILJAAR } from "@oranje-wit/types";
import {
  WizardHeader,
  WizardFooter,
  StapSenioren,
  StapACat,
  StapBTeams,
  StapBevestig,
} from "./wizard-stappen";
import StapMethode from "./StapMethode";
import type { Methode } from "./StapMethode";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WizardStap =
  | "methode"
  | "naam"
  | "senioren"
  | "acat"
  | "bteams"
  | "bevestig"
  | "kopieer"
  | "leeg";

interface ScenarioSamenvatting {
  id: string;
  naam: string;
  status: string;
  aantalTeams: number;
}

interface NieuwScenarioWizardProps {
  blauwdrukId: string;
  spelers: SpelerBasis[];
  bestaandeScenarios: ScenarioSamenvatting[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const UITGESLOTEN_STATUSSEN = new Set(["GAAT_STOPPEN", "ALGEMEEN_RESERVE"]);
const BLAUWDRUK_STAPPEN: WizardStap[] = ["naam", "senioren", "acat", "bteams", "bevestig"];

export default function NieuwScenarioWizard({
  blauwdrukId,
  spelers,
  bestaandeScenarios,
}: NieuwScenarioWizardProps) {
  const [open, setOpen] = useState(false);
  const [stap, setStap] = useState<WizardStap>("methode");
  const [methode, setMethode] = useState<Methode | null>(null);
  const [bezig, setBezig] = useState(false);

  // Formulier-state
  const [naam, setNaam] = useState("");
  const [seniorenOverride, setSeniorenOverride] = useState<number | null>(null);
  const [aCat, setACat] = useState<Record<string, number>>({
    U15: 1,
    U17: 1,
    U19: 1,
  });
  const [bOverrides, setBOverrides] = useState<Record<string, number>>({});
  const [kopieerBron, setKopieerBron] = useState("");

  // Leeftijdsverdeling (eenmalig berekend)
  const leeftijdVerdeling = useMemo(() => berekenLeeftijdVerdeling(spelers, PEILJAAR), [spelers]);

  const seniorenBeschikbaar = useMemo(() => {
    const beschikbaar = spelers.filter((s) => !UITGESLOTEN_STATUSSEN.has(s.status));
    return beschikbaar.filter((s) => PEILJAAR - s.geboortejaar >= 19);
  }, [spelers]);

  const seniorenAantal = seniorenBeschikbaar.length;
  const seniorenVoorstel = useMemo(
    () => (seniorenAantal > 0 ? Math.max(1, Math.round(seniorenAantal / 10)) : 0),
    [seniorenAantal]
  );
  const aantalSenioren = seniorenOverride ?? seniorenVoorstel;

  // A-cat config + B-team voorstel
  const aCatTeams: ACatConfig[] = useMemo(
    () =>
      (["U15", "U17", "U19"] as const).map((niveau) => ({
        niveau,
        aantalTeams: aCat[niveau] ?? 0,
      })),
    [aCat]
  );

  const bVoorstel: BTeamVoorstel[] = useMemo(
    () => berekenBTeamVoorstel(spelers, PEILJAAR, aantalSenioren, aCatTeams),
    [spelers, aantalSenioren, aCatTeams]
  );

  const bTeamAantallen = useMemo(() => {
    const result: Record<string, number> = {};
    for (const v of bVoorstel) {
      result[v.kleur] = bOverrides[v.kleur] ?? v.aantalTeams;
    }
    return result;
  }, [bVoorstel, bOverrides]);

  const totaalTeams = useMemo(() => {
    const sen = aantalSenioren;
    const aCatTotaal = Object.values(aCat).reduce((a, b) => a + b, 0);
    const bTotaal = Object.values(bTeamAantallen).reduce((a, b) => a + b, 0);
    return sen + aCatTotaal + bTotaal;
  }, [aantalSenioren, aCat, bTeamAantallen]);

  // Reset
  const handleReset = useCallback(() => {
    setNaam("");
    setSeniorenOverride(null);
    setACat({ U15: 1, U17: 1, U19: 1 });
    setBOverrides({});
    setKopieerBron("");
    setMethode(null);
    setStap("methode");
    setOpen(false);
  }, []);

  const handleKiesMethode = useCallback((m: Methode) => {
    setMethode(m);
    if (m === "blauwdruk") setStap("naam");
    else if (m === "kopieer") setStap("kopieer");
    else setStap("leeg");
  }, []);

  // Submit
  const handleSubmit = useCallback(async () => {
    if (bezig) return;
    setBezig(true);
    try {
      if (methode === "blauwdruk") {
        await createScenarioVanuitBlauwdruk(
          blauwdrukId,
          naam.trim(),
          aantalSenioren,
          aCatTeams,
          Object.keys(bOverrides).length > 0 ? bOverrides : undefined
        );
      } else if (methode === "kopieer") {
        await kopieerScenario(kopieerBron, naam.trim());
      } else {
        await createLeegScenario(blauwdrukId, naam.trim());
      }
    } catch {
      // redirect gooit NEXT_REDIRECT — normaal
    } finally {
      setBezig(false);
    }
  }, [bezig, methode, blauwdrukId, naam, aantalSenioren, aCatTeams, bOverrides, kopieerBron]);

  // Navigatie
  const huidigeIndex = BLAUWDRUK_STAPPEN.indexOf(stap);

  const volgende = useCallback(() => {
    if (huidigeIndex >= 0 && huidigeIndex < BLAUWDRUK_STAPPEN.length - 1) {
      setStap(BLAUWDRUK_STAPPEN[huidigeIndex + 1]);
    }
  }, [huidigeIndex]);

  const vorige = useCallback(() => {
    if (huidigeIndex > 0) {
      setStap(BLAUWDRUK_STAPPEN[huidigeIndex - 1]);
    } else {
      setStap("methode");
      setMethode(null);
    }
  }, [huidigeIndex]);

  const terugNaarMethode = useCallback(() => {
    setStap("methode");
    setMethode(null);
  }, []);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary">
        + Nieuw scenario
      </button>
    );
  }

  return (
    <div className="dialog-overlay" onClick={(e) => e.target === e.currentTarget && handleReset()}>
      <div className="dialog-panel max-h-[90vh] w-full max-w-xl overflow-y-auto">
        {stap === "methode" && (
          <StapMethode
            heeftScenarios={bestaandeScenarios.length > 0}
            onKies={handleKiesMethode}
            onAnnuleer={handleReset}
          />
        )}

        {stap === "naam" && (
          <>
            <WizardHeader stap={1} totaal={5} titel="Scenarionaam" />
            <div className="dialog-body">
              <div>
                <label htmlFor="wiz-naam" className="mb-1 block text-sm font-medium text-gray-700">
                  Naam *
                </label>
                <input
                  id="wiz-naam"
                  type="text"
                  value={naam}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNaam(e.target.value)}
                  placeholder="Bijv. Standaard indeling"
                  className="input"
                  autoFocus
                />
              </div>
            </div>
            <WizardFooter
              onVorige={vorige}
              onVolgende={volgende}
              vorigeLabel="Terug"
              volgendeDisabled={!naam.trim()}
            />
          </>
        )}

        {stap === "senioren" && (
          <StapSenioren
            seniorenAantal={seniorenAantal}
            seniorenVoorstel={seniorenVoorstel}
            aantalSenioren={aantalSenioren}
            seniorenOverride={seniorenOverride}
            onOverrideChange={setSeniorenOverride}
            onOverrideReset={() => setSeniorenOverride(null)}
            onVorige={vorige}
            onVolgende={volgende}
          />
        )}

        {stap === "acat" && (
          <StapACat
            aCat={aCat}
            leeftijdVerdeling={leeftijdVerdeling}
            onACatChange={(niveau, aantal) => setACat((prev) => ({ ...prev, [niveau]: aantal }))}
            onVorige={vorige}
            onVolgende={volgende}
          />
        )}

        {stap === "bteams" && (
          <StapBTeams
            bVoorstel={bVoorstel}
            bTeamAantallen={bTeamAantallen}
            onBOverride={(kleur, aantal) => setBOverrides((prev) => ({ ...prev, [kleur]: aantal }))}
            onVorige={vorige}
            onVolgende={volgende}
          />
        )}

        {stap === "bevestig" && (
          <StapBevestig
            naam={naam}
            totaalTeams={totaalTeams}
            aantalSenioren={aantalSenioren}
            aCat={aCat}
            bVoorstel={bVoorstel}
            bTeamAantallen={bTeamAantallen}
            bezig={bezig}
            onVorige={vorige}
            onSubmit={handleSubmit}
          />
        )}

        {stap === "kopieer" && (
          <>
            <div className="dialog-header">
              <h3 className="text-lg font-bold text-gray-900">Kopieer scenario</h3>
              <p className="mt-1 text-sm text-gray-500">
                Kies een bestaand scenario als basis en geef een nieuwe naam.
              </p>
            </div>
            <div className="dialog-body">
              <div>
                <label
                  htmlFor="wiz-kopieer-naam"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Nieuwe naam *
                </label>
                <input
                  id="wiz-kopieer-naam"
                  type="text"
                  value={naam}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNaam(e.target.value)}
                  placeholder="Bijv. Variant A"
                  className="input"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Bronscenario *
                </label>
                <div className="space-y-2">
                  {bestaandeScenarios.map((s) => (
                    <label
                      key={s.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-colors ${kopieerBron === s.id ? "border-orange-400 bg-orange-50" : "border-gray-200 hover:border-gray-300"}`}
                    >
                      <input
                        type="radio"
                        name="bron"
                        value={s.id}
                        checked={kopieerBron === s.id}
                        onChange={() => setKopieerBron(s.id)}
                        className="sr-only"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{s.naam}</div>
                        <p className="text-xs text-gray-400">
                          {s.aantalTeams} teams &middot; {s.status.toLowerCase()}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="dialog-footer">
              <button onClick={terugNaarMethode} disabled={bezig} className="btn-ghost">
                Terug
              </button>
              <button
                onClick={handleSubmit}
                disabled={bezig || !naam.trim() || !kopieerBron}
                className="btn-primary"
              >
                {bezig ? "Kopiëren..." : "Scenario kopiëren"}
              </button>
            </div>
          </>
        )}

        {stap === "leeg" && (
          <>
            <div className="dialog-header">
              <h3 className="text-lg font-bold text-gray-900">Leeg scenario</h3>
              <p className="mt-1 text-sm text-gray-500">
                Begin met een leeg scenario zonder teams.
              </p>
            </div>
            <div className="dialog-body">
              <div>
                <label
                  htmlFor="wiz-leeg-naam"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Naam *
                </label>
                <input
                  id="wiz-leeg-naam"
                  type="text"
                  value={naam}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNaam(e.target.value)}
                  placeholder="Bijv. Experiment"
                  className="input"
                  autoFocus
                />
              </div>
            </div>
            <div className="dialog-footer">
              <button onClick={terugNaarMethode} disabled={bezig} className="btn-ghost">
                Terug
              </button>
              <button
                onClick={handleSubmit}
                disabled={bezig || !naam.trim()}
                className="btn-primary"
              >
                {bezig ? "Aanmaken..." : "Leeg scenario aanmaken"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
