"use client";

import { useState, useCallback, useTransition, useMemo } from "react";
import { logger } from "@oranje-wit/types";
import type { TeamCategorie, Kleur } from "@oranje-wit/database";
import type { ScenarioData, SpelerData, TeamData, TeamSpelerData } from "./types";
import { PEILJAAR } from "./types";
import { useValidatie } from "@/hooks/useValidatie";
import {
  addSpelerToTeam,
  removeSpelerFromTeam,
  moveSpeler,
  createTeam,
  deleteTeam,
  koppelSelectie,
  ontkoppelSelectieMetVerdeling,
} from "@/app/scenarios/actions";
import DndProvider from "./DndContext";
import Navigator from "./Navigator";
import Werkgebied from "./Werkgebied";
import SpelersPool from "./SpelersPool";
import SpelerDetail from "./SpelerDetail";
import ChatPanel from "./ChatPanel";
import WhatIfDialoog from "./WhatIfDialoog";
import VerdeelDialoog from "./VerdeelDialoog";

interface ScenarioEditorProps {
  scenario: ScenarioData;
  alleSpelers: SpelerData[];
}

export default function ScenarioEditor({ scenario, alleSpelers }: ScenarioEditorProps) {
  const laatsteVersie = scenario.versies[0];
  const versieId = laatsteVersie?.id;

  // Lokale state voor teams (optimistic updates)
  const [teams, setTeams] = useState<TeamData[]>(laatsteVersie?.teams ?? []);

  // Zichtbare teams in werkgebied
  const [zichtbaar, setZichtbaar] = useState<Set<string>>(() => new Set(teams.map((t) => t.id)));

  const [, startTransition] = useTransition();

  // Blauwdruk-kaders voor validatie (stabiele referentie)
  const blauwdrukKaders = useMemo(
    () =>
      scenario.concept?.blauwdruk?.kaders as Record<string, Record<string, unknown>> | undefined,
    [scenario.concept?.blauwdruk?.kaders]
  );

  // Realtime validatie met blauwdruk-kaders
  const { validatieMap, dubbeleMeldingen } = useValidatie(teams, PEILJAAR, blauwdrukKaders);

  // AI chat + what-if state
  const [whatIfOpen, setWhatIfOpen] = useState(false);

  // Verdeel-dialoog state (ontkoppelen selectie)
  const [verdeelData, setVerdeelData] = useState<{
    groepLeiderId: string;
    leiderTeam: TeamData;
    lidTeams: TeamData[];
  } | null>(null);

  // Speler detail popup (lifted state)
  const [detailSpeler, setDetailSpeler] = useState<SpelerData | null>(null);
  const [detailTeamId, setDetailTeamId] = useState<string | null>(null);

  const handleSpelerClick = useCallback((speler: SpelerData, teamId?: string) => {
    setDetailSpeler(speler);
    setDetailTeamId(teamId ?? null);
  }, []);

  // Herlaad teams na AI-mutatie
  const refreshTeams = useCallback(async () => {
    try {
      const res = await fetch(`/api/scenarios/${scenario.id}/teams`);
      if (res.ok) {
        const data = await res.json();
        setTeams(data.teams);
      }
    } catch (error) {
      logger.warn("Teams herladen mislukt:", error);
    }
  }, [scenario.id]);

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

  const handleToggleAlles = useCallback((teamIds: string[], aan: boolean) => {
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
  }, []);

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
        setTeams((prev) => prev.map((t) => (t.id === tempId ? { ...t, id: team.id } : t)));
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

  const handleDeleteTeam = useCallback((teamId: string) => {
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
  }, []);

  // --- Selectie handlers ---
  const handleKoppelSelectie = useCallback((teamIds: string[]) => {
    if (teamIds.length < 2) return;
    const [leiderId, ...restIds] = teamIds;

    // Optimistic update: koppel teams + voeg spelers/staf samen op leider
    setTeams((prev) => {
      const lidSpelers = prev.filter((t) => restIds.includes(t.id)).flatMap((t) => t.spelers);
      const lidStaf = prev.filter((t) => restIds.includes(t.id)).flatMap((t) => t.staf);

      return prev.map((t) => {
        if (t.id === leiderId) {
          const bestaandSpelerIds = new Set(t.spelers.map((ts) => ts.spelerId));
          const nieuweSpelers = lidSpelers.filter((ts) => !bestaandSpelerIds.has(ts.spelerId));
          const bestaandStafIds = new Set(t.staf.map((ts) => ts.stafId));
          const nieuweStaf = lidStaf.filter((ts) => !bestaandStafIds.has(ts.stafId));
          return {
            ...t,
            spelers: [...t.spelers, ...nieuweSpelers],
            staf: [...t.staf, ...nieuweStaf],
          };
        }
        if (restIds.includes(t.id)) {
          return { ...t, selectieGroepId: leiderId, spelers: [], staf: [] };
        }
        return t;
      });
    });

    startTransition(() => {
      koppelSelectie(teamIds);
    });
  }, []);

  const handleOntkoppelSelectie = useCallback(
    (groepLeiderId: string) => {
      const leider = teams.find((t) => t.id === groepLeiderId);
      const leden = teams.filter((t) => t.selectieGroepId === groepLeiderId);
      if (!leider) return;

      // Open de VerdeelDialoog
      setVerdeelData({
        groepLeiderId,
        leiderTeam: leider,
        lidTeams: leden,
      });
    },
    [teams]
  );

  const handleVerdeelBevestig = useCallback(
    (spelerVerdeling: Record<string, string[]>, stafVerdeling: Record<string, string[]>) => {
      if (!verdeelData) return;
      const { groepLeiderId, lidTeams } = verdeelData;
      const alleTeamIds = [groepLeiderId, ...lidTeams.map((t) => t.id)];

      // Optimistic update: verdeel spelers + staf + ontkoppel
      setTeams((prev) => {
        const leider = prev.find((t) => t.id === groepLeiderId);
        const spelerMap = new Map((leider?.spelers ?? []).map((ts) => [ts.spelerId, ts]));
        const stafMap = new Map((leider?.staf ?? []).map((ts) => [ts.stafId, ts]));
        const alleStafIds = new Set(stafVerdeling["alle"] ?? []);

        return prev.map((t) => {
          if (!alleTeamIds.includes(t.id)) return t;

          const spelerIds = spelerVerdeling[t.id] ?? [];
          const teamStafIds = stafVerdeling[t.id] ?? [];

          const stafVoorTeam = [
            ...teamStafIds.map((id) => stafMap.get(id)).filter(Boolean),
            ...Array.from(alleStafIds)
              .map((id) => stafMap.get(id))
              .filter(Boolean),
          ];

          return {
            ...t,
            selectieGroepId: null,
            spelers: spelerIds.map((id) => spelerMap.get(id)!).filter(Boolean),
            staf: stafVoorTeam as typeof t.staf,
          };
        });
      });

      setVerdeelData(null);

      startTransition(() => {
        ontkoppelSelectieMetVerdeling(groepLeiderId, spelerVerdeling, stafVerdeling, alleTeamIds);
      });
    },
    [verdeelData]
  );

  if (!laatsteVersie) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-gray-400">Dit scenario heeft nog geen versie.</p>
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
      <div className="flex h-[calc(100vh-10rem)] overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
        {/* Links: Navigator */}
        <Navigator
          teams={teams}
          zichtbaar={zichtbaar}
          onToggle={handleToggle}
          onToggleAlles={handleToggleAlles}
        />

        {/* Midden: Werkgebied + AdviesPanel */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
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
            onSpelerClick={handleSpelerClick}
          />
          <ChatPanel scenarioId={scenario.id} versieId={versieId} onMutatie={refreshTeams} />
        </div>

        {/* Rechts: Spelerspool */}
        <SpelersPool
          spelers={alleSpelers}
          teams={teams}
          zichtbareTeamIds={zichtbaar}
          onSpelerClick={(speler) => handleSpelerClick(speler)}
        />
      </div>

      <WhatIfDialoog
        open={whatIfOpen}
        onClose={() => setWhatIfOpen(false)}
        teams={teams}
        alleSpelers={alleSpelers}
      />

      {verdeelData && (
        <VerdeelDialoog
          open={true}
          onClose={() => setVerdeelData(null)}
          leiderTeam={verdeelData.leiderTeam}
          lidTeams={verdeelData.lidTeams}
          onBevestig={handleVerdeelBevestig}
        />
      )}

      {detailSpeler && (
        <SpelerDetail
          speler={detailSpeler}
          teamId={detailTeamId ?? undefined}
          onClose={() => {
            setDetailSpeler(null);
            setDetailTeamId(null);
          }}
        />
      )}
    </DndProvider>
  );
}
