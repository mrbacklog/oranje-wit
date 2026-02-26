"use client";

import { SEIZOEN_JAAR } from "@/components/scenario/types";

interface SpelerInfo {
  id: string;
  spelerId: string;
  speler: {
    id: string;
    roepnaam: string;
    achternaam: string;
    geboortejaar: number;
    geslacht: string;
  };
}

interface TeamInfo {
  id: string;
  naam: string;
  categorie: string;
  kleur: string | null;
  spelers: SpelerInfo[];
}

interface TeamDiffProps {
  teamA: TeamInfo | null;
  teamB: TeamInfo | null;
  teamNaam: string;
}

function berekenLeeftijd(geboortejaar: number): number {
  return SEIZOEN_JAAR - geboortejaar;
}

function berekenStats(spelers: SpelerInfo[]) {
  if (spelers.length === 0)
    return { aantal: 0, gemLeeftijd: 0, mannen: 0, vrouwen: 0 };
  const leeftijden = spelers.map((s) => berekenLeeftijd(s.speler.geboortejaar));
  const gemLeeftijd =
    leeftijden.reduce((a, b) => a + b, 0) / leeftijden.length;
  const mannen = spelers.filter((s) => s.speler.geslacht === "M").length;
  const vrouwen = spelers.filter((s) => s.speler.geslacht === "V").length;
  return { aantal: spelers.length, gemLeeftijd, mannen, vrouwen };
}

function SpelerRij({
  speler,
  highlight,
}: {
  speler: SpelerInfo;
  highlight: boolean;
}) {
  const leeftijd = berekenLeeftijd(speler.speler.geboortejaar);
  return (
    <div
      className={`flex items-center justify-between px-2 py-1 text-sm rounded ${
        highlight ? "bg-green-50 text-green-800 font-medium" : "text-gray-700"
      }`}
    >
      <span>
        {speler.speler.roepnaam} {speler.speler.achternaam}
      </span>
      <span className="text-xs text-gray-400 ml-2">
        {leeftijd}j &middot; {speler.speler.geslacht}
      </span>
    </div>
  );
}

function StatsRij({ label, waarde }: { label: string; waarde: string }) {
  return (
    <div className="flex justify-between text-xs text-gray-500">
      <span>{label}</span>
      <span className="font-medium">{waarde}</span>
    </div>
  );
}

export default function TeamDiff({ teamA, teamB, teamNaam }: TeamDiffProps) {
  const spelersA = teamA?.spelers ?? [];
  const spelersB = teamB?.spelers ?? [];

  const spelerIdsA = new Set(spelersA.map((s) => s.spelerId));
  const spelerIdsB = new Set(spelersB.map((s) => s.spelerId));

  const statsA = berekenStats(spelersA);
  const statsB = berekenStats(spelersB);

  const renderKolom = (
    spelers: SpelerInfo[],
    andereIds: Set<string>,
    team: TeamInfo | null
  ) => {
    if (!team) {
      return (
        <div className="flex-1 bg-gray-50 rounded-lg p-3 border border-dashed border-gray-300">
          <p className="text-xs text-gray-400 italic text-center">
            Team niet aanwezig
          </p>
        </div>
      );
    }

    const stats = berekenStats(spelers);
    const gesorteerd = [...spelers].sort((a, b) =>
      a.speler.achternaam.localeCompare(b.speler.achternaam)
    );

    return (
      <div className="flex-1 bg-white rounded-lg p-3 border border-gray-200">
        <div className="space-y-0.5 mb-3">
          {gesorteerd.length === 0 ? (
            <p className="text-xs text-gray-400 italic">Geen spelers</p>
          ) : (
            gesorteerd.map((s) => (
              <SpelerRij
                key={s.id}
                speler={s}
                highlight={!andereIds.has(s.spelerId)}
              />
            ))
          )}
        </div>
        <div className="border-t border-gray-100 pt-2 space-y-1">
          <StatsRij label="Aantal" waarde={`${stats.aantal}`} />
          <StatsRij
            label="Gem. leeftijd"
            waarde={`${stats.gemLeeftijd.toFixed(1)}`}
          />
          <StatsRij
            label="M / V"
            waarde={`${stats.mannen} / ${stats.vrouwen}`}
          />
        </div>
      </div>
    );
  };

  const verschil = Math.abs(statsA.aantal - statsB.aantal);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-800">{teamNaam}</h4>
        {verschil > 0 && (
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
            verschil: {verschil} speler{verschil !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      <div className="flex gap-3">
        {renderKolom(spelersA, spelerIdsB, teamA)}
        {renderKolom(spelersB, spelerIdsA, teamB)}
      </div>
    </div>
  );
}
