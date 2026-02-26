"use client";

import { useState, useCallback, useTransition } from "react";
import type { TeamCategorie, Kleur } from "@oranje-wit/database";
import type { ScenarioData, SpelerData, TeamData, TeamSpelerData } from "./types";
import { SEIZOEN_JAAR } from "./types";
import { useValidatie } from "@/hooks/useValidatie";
import {
  addSpelerToTeam,
  removeSpelerFromTeam,
  moveSpeler,
  createTeam,
  deleteTeam,
  koppelSelectie,
  ontkoppelSelectie,
} from "@/app/scenarios/actions";
import DndProvider from "./DndContext";
import Navigator from "./Navigator";
import Werkgebied from "./Werkgebied";
import SpelersPool from "./SpelersPool";
import AdviesPanel from "./AdviesPanel";
import WhatIfDialoog from "./WhatIfDialoog";

interface ScenarioEditorProps {
  scenario: ScenarioData;
  alleSpelers: SpelerData[];
}

export default function ScenarioEditor({
  scenario,
  alleSpelers,
}: ScenarioEditorProps) {
  const laatsteVersie = scenario.versies[0];
  const versieId = laatsteVersie?.id;

  // Lokale state voor teams (optimistic updates)
  const [teams, setTeams] = useState<TeamData[]>(laatsteVersie?.teams ?? []);

  // Zichtbare teams in werkgebied
  const [zichtbaar, setZichtbaar] = useState<Set<string>>(
    () => new Set(teams.map((t) => t.id))
  );

  const [, startTransition] = useTransition();

  // Realtime validatie
  const { validatieMap, dubbeleMeldingen } = useValidatie(teams, SEIZOEN_JAAR);

  // AI advies state
  const [laatsteActie, setLaatsteActie] = useState<string | null>(null);
  const [adviesEnabled, setAdviesEnabled] = useState(false);
  const [whatIfOpen, setWhatIfOpen] = useState(false);

  // --- Navigator handlers ---
  const handleToggle = useCallback((teamId: string) => {
    setZichtbaar((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) {
        next.delete(teamId);
      } else {
        next.add(teamId);
      }
      return next;
    });
  }, []);

  const handleToggleAlles = useCallback(
    (teamIds: string[], aan: boolean) => {
      setZichtbaar((prev) => {
        const next = new Set(prev);
        for (const id of teamIds) {
          if (aan) {
            next.add(id);
          } else {
            next.delete(id);
          }
        }
        return next;
      });
    },
    []
  );

  // --- DnD handlers (optimistic) ---
  const handlePoolToTeam = useCallback(
    (spelerId: string, teamId: string) => {
      // Controleer of speler al in dit team zit
      const team = teams.find((t) => t.id === teamId);
      if (team?.spelers.some((ts) => ts.spelerId === spelerId)) return;

      const speler = alleSpelers.find((s) => s.id === spelerId);
      if (!speler) return;

      // Optimistic update
      setTeams((prev) =>
        prev.map((t) => {
          if (t.id !== teamId) return t;
          const nieuwTS: TeamSpelerData = {
            id: `temp-${Date.now()}`,
            spelerId: speler.id,
            statusOverride: null,
            notitie: null,
            speler,
          };
          return { ...t, spelers: [...t.spelers, nieuwTS] };
        })
      );

      // Track actie voor advies
      const teamNaam = team?.naam ?? "team";
      setLaatsteActie(`${speler.roepnaam} ${speler.achternaam} toegevoegd aan ${teamNaam}`);

      // Server action
      startTransition(() => {
        addSpelerToTeam(teamId, spelerId);
      });
    },
    [teams, alleSpelers]
  );

  const handleTeamToTeam = useCallback(
    (spelerId: string, vanTeamId: string, naarTeamId: string) => {
      // Controleer of speler al in doelteam zit
      const naarTeam = teams.find((t) => t.id === naarTeamId);
      if (naarTeam?.spelers.some((ts) => ts.spelerId === spelerId)) return;

      // Optimistic update
      setTeams((prev) => {
        let verplaatsteSpeler: TeamSpelerData | null = null;
        const updated = prev.map((t) => {
          if (t.id === vanTeamId) {
            const spelerData = t.spelers.find((ts) => ts.spelerId === spelerId);
            if (spelerData) verplaatsteSpeler = { ...spelerData, id: `temp-${Date.now()}` };
            return {
              ...t,
              spelers: t.spelers.filter((ts) => ts.spelerId !== spelerId),
            };
          }
          return t;
        });
        if (!verplaatsteSpeler) return updated;
        return updated.map((t) => {
          if (t.id !== naarTeamId) return t;
          return { ...t, spelers: [...t.spelers, verplaatsteSpeler!] };
        });
      });

      // Track actie voor advies
      const vanNaam = teams.find((t) => t.id === vanTeamId)?.naam ?? "team";
      const naarNaam = naarTeam?.naam ?? "team";
      const spelerData = teams.flatMap((t) => t.spelers).find((ts) => ts.spelerId === spelerId);
      const spelerNaam = spelerData ? `${spelerData.speler.roepnaam} ${spelerData.speler.achternaam}` : "speler";
      setLaatsteActie(`${spelerNaam} verplaatst van ${vanNaam} naar ${naarNaam}`);

      startTransition(() => {
        moveSpeler(spelerId, vanTeamId, naarTeamId);
      });
    },
    [teams]
  );

  const handleTeamToPool = useCallback(
    (spelerId: string, teamId: string) => {
      // Optimistic update
      setTeams((prev) =>
        prev.map((t) => {
          if (t.id !== teamId) return t;
          return {
            ...t,
            spelers: t.spelers.filter((ts) => ts.spelerId !== spelerId),
          };
        })
      );

      // Track actie voor advies
      const teamNaam = teams.find((t) => t.id === teamId)?.naam ?? "team";
      const spelerData = teams.flatMap((t) => t.spelers).find((ts) => ts.spelerId === spelerId);
      const spelerNaam = spelerData ? `${spelerData.speler.roepnaam} ${spelerData.speler.achternaam}` : "speler";
      setLaatsteActie(`${spelerNaam} verwijderd uit ${teamNaam}`);

      startTransition(() => {
        removeSpelerFromTeam(teamId, spelerId);
      });
    },
    [teams]
  );

  // --- Team CRUD ---
  const handleCreateTeam = useCallback(
    (data: { naam: string; categorie: TeamCategorie; kleur?: Kleur }) => {
      if (!versieId) return;

      // Optimistic update
      const tempId = `temp-${Date.now()}`;
      const nieuwTeam: TeamData = {
        id: tempId,
        naam: data.naam,
        categorie: data.categorie,
        kleur: data.kleur ?? null,
        niveau: null,
        volgorde: teams.length,
        selectieGroepId: null,
        spelers: [],
        staf: [],
      };
      setTeams((prev) => [...prev, nieuwTeam]);
      setZichtbaar((prev) => new Set([...prev, tempId]));

      startTransition(async () => {
        const team = await createTeam(versieId, {
          naam: data.naam,
          categorie: data.categorie,
          kleur: data.kleur ?? null,
        });
        // Vervang temp ID met echt ID
        setTeams((prev) =>
          prev.map((t) =>
            t.id === tempId
              ? { ...t, id: team.id }
              : t
          )
        );
        setZichtbaar((prev) => {
          const next = new Set(prev);
          next.delete(tempId);
          next.add(team.id);
          return next;
        });
      });
    },
    [versieId, teams.length]
  );

  const handleDeleteTeam = useCallback(
    (teamId: string) => {
      // Optimistic update
      setTeams((prev) => prev.filter((t) => t.id !== teamId));
      setZichtbaar((prev) => {
        const next = new Set(prev);
        next.delete(teamId);
        return next;
      });

      startTransition(() => {
        deleteTeam(teamId);
      });
    },
    []
  );

  // --- Selectie handlers ---
  const handleKoppelSelectie = useCallback(
    (teamIds: string[]) => {
      if (teamIds.length < 2) return;
      const [leiderId, ...restIds] = teamIds;

      // Optimistic update
      setTeams((prev) =>
        prev.map((t) =>
          restIds.includes(t.id)
            ? { ...t, selectieGroepId: leiderId }
            : t
        )
      );

      startTransition(() => {
        koppelSelectie(teamIds);
      });
    },
    []
  );

  const handleOntkoppelSelectie = useCallback(
    (groepLeiderId: string) => {
      // Optimistic update
      setTeams((prev) =>
        prev.map((t) =>
          t.selectieGroepId === groepLeiderId
            ? { ...t, selectieGroepId: null }
            : t
        )
      );

      startTransition(() => {
        ontkoppelSelectie(groepLeiderId);
      });
    },
    []
  );

  if (!laatsteVersie) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-400">
          Dit scenario heeft nog geen versie.
        </p>
      </div>
    );
  }

  return (
    <DndProvider
      spelers={alleSpelers}
      onPoolToTeam={handlePoolToTeam}
      onTeamToTeam={handleTeamToTeam}
      onTeamToPool={handleTeamToPool}
    >
      <div className="flex h-[calc(100vh-10rem)] border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
        {/* Links: Navigator */}
        <Navigator
          teams={teams}
          zichtbaar={zichtbaar}
          onToggle={handleToggle}
          onToggleAlles={handleToggleAlles}
        />

        {/* Midden: Werkgebied + AdviesPanel */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Werkgebied
            scenarioId={scenario.id}
            teams={teams}
            zichtbareTeamIds={zichtbaar}
            validatieMap={validatieMap}
            dubbeleMeldingen={dubbeleMeldingen}
            onCreateTeam={handleCreateTeam}
            onDeleteTeam={handleDeleteTeam}
            onKoppelSelectie={handleKoppelSelectie}
            onOntkoppelSelectie={handleOntkoppelSelectie}
            onWhatIfOpen={() => setWhatIfOpen(true)}
          />
          <AdviesPanel
            scenarioId={scenario.id}
            laatsteActie={laatsteActie}
            teams={teams.map((t) => ({
              naam: t.naam,
              spelers: t.spelers.map((ts) => ({
                roepnaam: ts.speler.roepnaam,
                achternaam: ts.speler.achternaam,
              })),
            }))}
            enabled={adviesEnabled}
            onToggle={() => setAdviesEnabled((prev) => !prev)}
          />
        </div>

        {/* Rechts: Spelerspool */}
        <SpelersPool
          spelers={alleSpelers}
          teams={teams}
          zichtbareTeamIds={zichtbaar}
        />
      </div>

      <WhatIfDialoog
        open={whatIfOpen}
        onClose={() => setWhatIfOpen(false)}
        teams={teams}
        alleSpelers={alleSpelers}
      />
    </DndProvider>
  );
}
