"use client";

import { useState, useCallback, useEffect } from "react";
import type { TeamCategorie, Kleur, SpelerStatus } from "@oranje-wit/database";
import type { TeamData, SpelerData } from "./types";
import type { TeamValidatie, MeldingErnst } from "@/lib/validatie/regels";
import {
  KLEUR_DOT,
  KLEUR_LABELS,
  CATEGORIE_LABELS,
  STATUS_KLEUREN,
  korfbalLeeftijd,
  kleurIndicatie,
} from "./types";
import SpelerAvatar from "@/components/ui/SpelerAvatar";
import SelectieKoppelaar from "./SelectieKoppelaar";

export interface TeamUpdateData {
  alias?: string | null;
  categorie?: TeamCategorie;
  kleur?: Kleur | null;
  naam?: string;
}

interface TeamEditPanelProps {
  team: TeamData;
  alleTeams: TeamData[];
  validatie?: TeamValidatie;
  onClose: () => void;
  onSpelerClick?: (speler: SpelerData) => void;
  onUpdateTeam: (teamId: string, data: TeamUpdateData) => void;
  onKoppelSelectie: (teamIds: string[]) => void;
  onOntkoppelSelectie: (leiderId: string) => void;
}

const ERNST_CONFIG: Record<MeldingErnst, { icon: string; kleur: string }> = {
  kritiek: { icon: "\u2715", kleur: "text-red-600 bg-red-50" },
  aandacht: { icon: "\u26A0", kleur: "text-orange-600 bg-orange-50" },
  info: { icon: "\u2139", kleur: "text-blue-600 bg-blue-50" },
};

const ERNST_VOLGORDE: MeldingErnst[] = ["kritiek", "aandacht", "info"];

const STATUS_LABELS: Record<string, string> = {
  BESCHIKBAAR: "Beschikbaar",
  TWIJFELT: "Twijfelt",
  GAAT_STOPPEN: "Stopt",
  NIEUW_POTENTIEEL: "Nieuw",
  NIEUW_DEFINITIEF: "Nieuw",
};

export default function TeamEditPanel({
  team,
  alleTeams,
  validatie,
  onClose,
  onSpelerClick,
  onUpdateTeam,
  onKoppelSelectie,
  onOntkoppelSelectie,
}: TeamEditPanelProps) {
  const [alias, setAlias] = useState(team.alias ?? "");
  const [categorie, setCategorie] = useState(team.categorie);
  const [kleur, setKleur] = useState<Kleur | null>(team.kleur);
  const [niveau, setNiveau] = useState(team.niveau ?? "");

  // Reset bij ander team — correcte sync van formulier-state bij prop-wijziging
  useEffect(() => {
    setAlias(team.alias ?? "");
    setCategorie(team.categorie);
    setKleur(team.kleur);
    setNiveau(team.niveau ?? "");
  }, [team.id, team.alias, team.categorie, team.kleur, team.niveau]);

  // Escape sluiten
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSaveAlias = useCallback(() => {
    const nieuwAlias = alias.trim() || null;
    if (nieuwAlias !== (team.alias ?? null)) {
      onUpdateTeam(team.id, { alias: nieuwAlias });
    }
  }, [alias, team.id, team.alias, onUpdateTeam]);

  const handleCategorieWijzig = useCallback(
    (nieuwCat: TeamCategorie) => {
      setCategorie(nieuwCat);
      const update: TeamUpdateData = { categorie: nieuwCat };
      if (nieuwCat !== "B_CATEGORIE") {
        update.kleur = null;
        setKleur(null);
      }
      onUpdateTeam(team.id, update);
    },
    [team.id, onUpdateTeam]
  );

  const handleKleurWijzig = useCallback(
    (nieuweKleur: Kleur) => {
      setKleur(nieuweKleur);
      onUpdateTeam(team.id, { kleur: nieuweKleur });
    },
    [team.id, onUpdateTeam]
  );

  const handleNiveauWijzig = useCallback(
    (nieuwNiveau: string) => {
      setNiveau(nieuwNiveau);
      onUpdateTeam(team.id, { naam: `${nieuwNiveau}-${team.naam.split("-")[1] ?? "1"}` });
    },
    [team.id, team.naam, onUpdateTeam]
  );

  // Spelers
  const heren = team.spelers
    .filter((ts) => ts.speler.geslacht === "M")
    .sort((a, b) => a.speler.achternaam.localeCompare(b.speler.achternaam));
  const dames = team.spelers
    .filter((ts) => ts.speler.geslacht === "V")
    .sort((a, b) => a.speler.achternaam.localeCompare(b.speler.achternaam));
  const gemLeeftijd =
    team.spelers.length > 0
      ? (
          team.spelers.reduce(
            (sum, ts) => sum + korfbalLeeftijd(ts.speler.geboortedatum, ts.speler.geboortejaar),
            0
          ) / team.spelers.length
        ).toFixed(2)
      : "-";

  // Selectie-logica
  const isSelectieLeider = alleTeams.some((t) => t.selectieGroepId === team.id);
  const isSelectieLid = team.selectieGroepId !== null;

  // Validatie
  const meldingen = validatie
    ? [...validatie.meldingen].sort(
        (a, b) => ERNST_VOLGORDE.indexOf(a.ernst) - ERNST_VOLGORDE.indexOf(b.ernst)
      )
    : [];

  function SpelerRij({
    speler,
    statusOverride,
  }: {
    speler: SpelerData;
    statusOverride: SpelerStatus | null;
  }) {
    const leeftijd = korfbalLeeftijd(speler.geboortedatum, speler.geboortejaar);
    const kleurInd = kleurIndicatie(leeftijd);
    const status = statusOverride ?? speler.status;

    return (
      <div
        className={`flex items-center gap-2 rounded px-2 py-1 ${
          onSpelerClick ? "cursor-pointer hover:bg-gray-50" : ""
        }`}
        onClick={onSpelerClick ? () => onSpelerClick(speler) : undefined}
      >
        <SpelerAvatar spelerId={speler.id} naam={speler.roepnaam} size="xs" />
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_KLEUREN[status]}`} />
        <span
          className={`flex-1 text-sm text-gray-800 ${onSpelerClick ? "hover:text-orange-600" : ""}`}
        >
          {speler.roepnaam} {speler.achternaam}
        </span>
        <span className="inline-flex shrink-0 items-center gap-0.5">
          {kleurInd && <span className={`h-1.5 w-1.5 rounded-full ${KLEUR_DOT[kleurInd]}`} />}
          <span className="text-xs text-gray-400 tabular-nums">{leeftijd.toFixed(2)}</span>
        </span>
        <span className="shrink-0 text-xs">{speler.geslacht === "M" ? "\u2642" : "\u2640"}</span>
        {status !== "BESCHIKBAAR" && (
          <span className="text-[10px] text-gray-400">{STATUS_LABELS[status] ?? status}</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full w-80 flex-col border-l border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h3 className="text-sm font-bold text-gray-900">Team bewerken</h3>
        <button
          onClick={onClose}
          className="p-1 text-lg leading-none text-gray-400 hover:text-gray-600"
        >
          &times;
        </button>
      </div>

      {/* Scrollbaar content */}
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-3">
        {/* Alias */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Werknaam (alias)</label>
          <input
            type="text"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            onBlur={handleSaveAlias}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveAlias();
            }}
            className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-orange-400 focus:ring-1 focus:ring-orange-200 focus:outline-none"
            placeholder={team.naam}
          />
          <p className="mt-0.5 text-[10px] text-gray-400">Officieel: {team.naam}</p>
        </div>

        {/* Categorie */}
        <div>
          <label className="mb-2 block text-xs font-medium text-gray-600">Categorie</label>
          <div className="flex gap-1.5">
            {(["B_CATEGORIE", "A_CATEGORIE", "SENIOREN"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategorieWijzig(cat)}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  categorie === cat
                    ? "bg-orange-100 text-orange-700 ring-1 ring-orange-300"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {CATEGORIE_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Sub-opties per categorie */}
        {categorie === "B_CATEGORIE" && (
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-600">Kleur</label>
            <div className="flex gap-1.5">
              {(["BLAUW", "GROEN", "GEEL", "ORANJE", "ROOD"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => handleKleurWijzig(k)}
                  className={`h-7 w-7 rounded-full border-2 transition-all ${KLEUR_DOT[k]} ${
                    kleur === k
                      ? "scale-110 border-gray-800 ring-2 ring-gray-300"
                      : "border-transparent hover:scale-105"
                  }`}
                  title={KLEUR_LABELS[k]}
                />
              ))}
            </div>
          </div>
        )}

        {categorie === "A_CATEGORIE" && (
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-600">Niveau</label>
            <div className="flex gap-1.5">
              {["U15", "U17", "U19"].map((n) => (
                <button
                  key={n}
                  onClick={() => handleNiveauWijzig(n)}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    niveau === n || team.naam.startsWith(n)
                      ? "bg-orange-100 text-orange-700 ring-1 ring-orange-300"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selectie koppeling */}
        <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
          <p className="mb-1 text-xs font-medium text-gray-700">Selectie</p>
          {isSelectieLeider ? (
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-gray-500">Dit team is leider van een selectie</p>
              <button
                onClick={() => onOntkoppelSelectie(team.id)}
                className="rounded px-2 py-1 text-[10px] font-medium text-red-600 hover:bg-red-50"
              >
                Ontkoppel
              </button>
            </div>
          ) : isSelectieLid ? (
            <p className="text-[10px] text-gray-500">
              Gekoppeld aan selectie. Bewerk de leider om te ontkoppelen.
            </p>
          ) : (
            <SelectieKoppelaar teamId={team.id} alleTeams={alleTeams} onKoppel={onKoppelSelectie} />
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>{team.spelers.length} spelers</span>
          <span>
            {heren.length}&#9794; {dames.length}&#9792;
          </span>
          <span>gem. {gemLeeftijd} jr</span>
        </div>

        {/* Heren */}
        {heren.length > 0 && (
          <div>
            <div className="mb-1 border-b border-gray-100 pb-1">
              <span className="text-xs font-medium text-gray-500">Heren ({heren.length})</span>
            </div>
            <div className="space-y-0.5">
              {heren.map((ts) => (
                <SpelerRij key={ts.id} speler={ts.speler} statusOverride={ts.statusOverride} />
              ))}
            </div>
          </div>
        )}

        {/* Dames */}
        {dames.length > 0 && (
          <div>
            <div className="mb-1 border-b border-gray-100 pb-1">
              <span className="text-xs font-medium text-gray-500">Dames ({dames.length})</span>
            </div>
            <div className="space-y-0.5">
              {dames.map((ts) => (
                <SpelerRij key={ts.id} speler={ts.speler} statusOverride={ts.statusOverride} />
              ))}
            </div>
          </div>
        )}

        {/* Staf */}
        {team.staf.length > 0 && (
          <div>
            <div className="mb-1 border-b border-gray-100 pb-1">
              <span className="text-xs font-medium text-gray-500">Staf</span>
            </div>
            <div className="space-y-1">
              {team.staf.map((ts) => (
                <div key={ts.id} className="flex items-center gap-2 px-2 text-sm text-gray-700">
                  <span>{ts.staf.naam}</span>
                  <span className="text-xs text-gray-400">({ts.rol})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Constateringen */}
        {meldingen.length > 0 && (
          <div>
            <div className="mb-1 border-b border-gray-100 pb-1">
              <span className="text-xs font-medium text-gray-500">
                Constateringen ({meldingen.length})
              </span>
            </div>
            <div className="space-y-1">
              {meldingen.map((m, i) => {
                const config = ERNST_CONFIG[m.ernst];
                return (
                  <div key={`${m.regel}-${i}`} className="flex items-start gap-2 px-2 py-0.5">
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] ${config.kleur}`}
                    >
                      {config.icon}
                    </span>
                    <span className="text-xs leading-snug text-gray-700">{m.bericht}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
