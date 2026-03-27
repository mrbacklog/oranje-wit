"use client";

import { useCallback, useEffect, useState } from "react";
import { logger } from "@oranje-wit/types";
import { LeeftijdsgroepBadge } from "./leeftijdsgroep-badge";
import { SpelersKaart, type AchterkantData } from "./spelers-kaart";

export interface SpelerProfielData {
  relCode: string;
  roepnaam: string;
  achternaam: string;
  volleAchternaam: string;
  geboortejaar: number;
  geslacht: string;
  leeftijd: number;
  kleur: string;
  lidSinds: string | null;
  seizoenenActief: number | null;
  status: string;
  notitie: string | null;
  rating: number | null;
  huidig: {
    team: string | null;
    categorie: string | null;
    kleur: string;
    leeftijd: number;
  } | null;
  spelerspad: Array<{
    seizoen: string;
    team: string;
    kleur?: string;
    niveau?: string;
    spelvorm?: string;
    categorie?: string;
  }>;
  heeftFoto: boolean;
  fotoUrl: string | null;
  scoutingRapporten: Array<{
    id: string;
    seizoen: string;
    datum: string;
    context: string;
    overallScore: number | null;
    opmerking: string | null;
  }>;
  spelersKaart: {
    overall: number;
    schot: number;
    aanval: number;
    passing: number;
    verdediging: number;
    fysiek: number;
    mentaal: number;
    aantalRapporten: number;
    betrouwbaarheid: string;
  } | null;
  evaluaties: Array<{
    id: string;
    seizoen: string;
    ronde: number;
    type: string;
    scores: unknown;
    opmerking: string | null;
    coach: string | null;
    teamNaam: string | null;
  }>;
}

/** Profiel tab: basisgegevens, spelerspad, seizoenen actief */
export function ProfielTab({ profiel }: { profiel: SpelerProfielData }) {
  return (
    <div className="flex flex-col gap-4">
      <section className="bg-surface-card rounded-2xl p-4">
        <h3 className="text-text-secondary mb-3 text-sm font-semibold">Basisgegevens</h3>
        <dl className="grid grid-cols-2 gap-3">
          <InfoItem label="Geslacht" value={profiel.geslacht === "M" ? "Jongen" : "Meisje"} />
          <InfoItem label="Geboortejaar" value={String(profiel.geboortejaar)} />
          <InfoItem label="Leeftijd" value={`${profiel.leeftijd} jaar`} />
          <InfoItem label="Kleur" value={profiel.kleur} />
          {profiel.huidig?.categorie && (
            <InfoItem label="Categorie" value={profiel.huidig.categorie} />
          )}
          {profiel.seizoenenActief && (
            <InfoItem label="Seizoenen actief" value={String(profiel.seizoenenActief)} />
          )}
          <InfoItem label="Status" value={statusLabel(profiel.status)} />
          {profiel.rating && <InfoItem label="Rating" value={String(profiel.rating)} />}
        </dl>
      </section>

      {profiel.notitie && (
        <section className="bg-surface-card rounded-2xl p-4">
          <h3 className="text-text-secondary mb-2 text-sm font-semibold">Notitie</h3>
          <p className="text-text-primary text-sm">{profiel.notitie}</p>
        </section>
      )}

      {profiel.spelerspad.length > 0 && (
        <section className="bg-surface-card rounded-2xl p-4">
          <h3 className="text-text-secondary mb-3 text-sm font-semibold">Spelerspad</h3>
          <div className="flex flex-col gap-2">
            {profiel.spelerspad.map((stap, i) => (
              <div
                key={`${stap.seizoen}-${i}`}
                className="bg-surface-elevated flex items-center gap-3 rounded-lg px-3 py-2"
              >
                <span className="text-text-muted text-xs font-medium">{stap.seizoen}</span>
                <span className="text-text-primary flex-1 text-sm">{stap.team}</span>
                {stap.kleur && <LeeftijdsgroepBadge kleur={stap.kleur} size="sm" />}
              </div>
            ))}
          </div>
        </section>
      )}

      {profiel.evaluaties.length > 0 && (
        <section className="bg-surface-card rounded-2xl p-4">
          <h3 className="text-text-secondary mb-3 text-sm font-semibold">Evaluaties</h3>
          <div className="flex flex-col gap-2">
            {profiel.evaluaties.map((ev) => (
              <div key={ev.id} className="bg-surface-elevated rounded-lg px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-text-primary text-sm font-medium">
                    {ev.type === "trainer" ? "Trainer" : ev.type} — Ronde {ev.ronde}
                  </span>
                  {ev.teamNaam && <span className="text-text-muted text-xs">{ev.teamNaam}</span>}
                </div>
                {ev.opmerking && <p className="text-text-secondary mt-1 text-xs">{ev.opmerking}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/** Rapporten tab */
export function RapportenTab({ rapporten }: { rapporten: SpelerProfielData["scoutingRapporten"] }) {
  if (rapporten.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="bg-surface-elevated mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="text-text-muted h-8 w-8"
            strokeWidth={1.5}
          >
            <path
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
              stroke="currentColor"
            />
            <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" />
          </svg>
        </div>
        <p className="text-text-muted text-sm">Nog geen scouting rapporten</p>
        <p className="text-text-muted mt-1 text-xs">
          Scout deze speler om het eerste rapport aan te maken
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {rapporten.map((rapport) => (
        <div key={rapport.id} className="bg-surface-card rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-text-primary text-sm font-medium">
              {contextLabel(rapport.context)}
            </span>
            <span className="text-text-muted text-xs">
              {new Date(rapport.datum).toLocaleDateString("nl-NL")}
            </span>
          </div>
          {rapport.overallScore && (
            <div className="mt-2 flex items-center gap-1">
              <span className="text-ow-oranje text-lg font-bold">{rapport.overallScore}</span>
              <span className="text-text-muted text-xs">/10</span>
            </div>
          )}
          {rapport.opmerking && (
            <p className="text-text-secondary mt-2 line-clamp-2 text-xs">{rapport.opmerking}</p>
          )}
        </div>
      ))}
    </div>
  );
}

/** Kaart tab — toont de interactieve SpelersKaart component */
export function KaartTab({
  kaart,
  profiel,
}: {
  kaart: SpelerProfielData["spelersKaart"];
  profiel?: SpelerProfielData;
}) {
  const [kaartApiData, setKaartApiData] = useState<{
    tier: "brons" | "zilver" | "goud";
    sterren: number;
    achterkant: AchterkantData;
  } | null>(null);

  // Ophalen van tier/sterren/achterkant via de kaarten-API
  const fetchKaartData = useCallback(async () => {
    if (!profiel?.relCode || !kaart) return;
    try {
      const res = await fetch(`/api/scouting/kaarten/${profiel.relCode}`);
      const data = await res.json();
      if (data.ok && data.data) {
        setKaartApiData({
          tier: data.data.tier,
          sterren: data.data.sterren,
          achterkant: data.data.achterkant,
        });
      }
    } catch (err) {
      logger.info("[kaart-tab] Kon kaart API data niet laden:", err);
    }
  }, [profiel?.relCode, kaart]);

  useEffect(() => {
    fetchKaartData();
  }, [fetchKaartData]);

  if (!kaart) {
    return (
      <div className="py-12 text-center">
        <div className="bg-surface-elevated mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="text-text-muted h-8 w-8"
            strokeWidth={1.5}
          >
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" />
            <path d="M3 10h18" stroke="currentColor" />
          </svg>
        </div>
        <p className="text-text-muted text-sm">Nog geen spelerskaart beschikbaar</p>
        <p className="text-text-muted mt-1 text-xs">
          Kaarten worden gegenereerd na minimaal 3 scouting rapporten
        </p>
      </div>
    );
  }

  // Fallback tier/sterren als API nog niet geladen
  const tier = kaartApiData?.tier ?? "brons";
  const sterren = kaartApiData?.sterren ?? 3;
  const achterkant = kaartApiData?.achterkant ?? {
    bio: { korfbalLeeftijd: profiel?.leeftijd },
    rapporten: [],
    trend: 0,
    radarScores: [
      kaart.schot,
      kaart.aanval,
      kaart.passing,
      kaart.verdediging,
      kaart.fysiek,
      kaart.mentaal,
    ],
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Interactieve spelerskaart */}
      <div className="flex justify-center py-4">
        <SpelersKaart
          spelerId={profiel?.relCode ?? ""}
          roepnaam={profiel?.roepnaam ?? ""}
          achternaam={profiel?.volleAchternaam ?? profiel?.achternaam ?? ""}
          leeftijd={profiel?.leeftijd ?? 10}
          team={profiel?.huidig?.team ?? undefined}
          overall={kaart.overall}
          stats={{
            schot: kaart.schot,
            aanval: kaart.aanval,
            passing: kaart.passing,
            verdediging: kaart.verdediging,
            fysiek: kaart.fysiek,
            mentaal: kaart.mentaal,
          }}
          tier={tier}
          sterren={sterren}
          fotoUrl={profiel?.fotoUrl ?? undefined}
          size="large"
          flipbaar
          achterkantData={achterkant}
        />
      </div>

      {/* Tik-hint */}
      <p className="text-text-muted text-center text-xs">
        Tik op de kaart om de achterkant te zien
      </p>

      {/* Stats detail (compact) */}
      <div className="grid grid-cols-2 gap-3">
        <StatBar label="Schot" value={kaart.schot} />
        <StatBar label="Aanval" value={kaart.aanval} />
        <StatBar label="Passing" value={kaart.passing} />
        <StatBar label="Verdediging" value={kaart.verdediging} />
        <StatBar label="Fysiek" value={kaart.fysiek} />
        <StatBar label="Mentaal" value={kaart.mentaal} />
      </div>
      <div className="bg-surface-card text-text-muted flex items-center justify-between rounded-xl px-4 py-3 text-xs">
        <span>Gebaseerd op {kaart.aantalRapporten} rapporten</span>
        <span className="capitalize">{kaart.betrouwbaarheid}</span>
      </div>
    </div>
  );
}

function StatBar({ label, value }: { label: string; value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="bg-surface-card rounded-xl p-3">
      <div className="flex items-center justify-between">
        <span className="text-text-secondary text-xs">{label}</span>
        <span className="text-text-primary text-sm font-bold">{value}</span>
      </div>
      <div className="bg-surface-elevated mt-2 h-1.5 overflow-hidden rounded-full">
        <div
          className="bg-ow-oranje h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-text-muted text-xs">{label}</dt>
      <dd className="text-text-primary mt-0.5 text-sm font-medium capitalize">{value}</dd>
    </div>
  );
}

function statusLabel(status: string): string {
  switch (status) {
    case "BESCHIKBAAR":
      return "Beschikbaar";
    case "TWIJFELT":
      return "Twijfelt";
    case "GAAT_STOPPEN":
      return "Gaat stoppen";
    case "NIEUW":
      return "Nieuw";
    default:
      return status;
  }
}

function contextLabel(context: string): string {
  switch (context) {
    case "WEDSTRIJD":
      return "Wedstrijd";
    case "TRAINING":
      return "Training";
    case "OVERIG":
      return "Overig";
    default:
      return context;
  }
}
