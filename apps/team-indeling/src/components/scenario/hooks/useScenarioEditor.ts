"use client";

import { useState, useCallback, useTransition, useMemo } from "react";
import { logger } from "@oranje-wit/types";
import type { TeamCategorie, Kleur } from "@oranje-wit/database";
import type { ScenarioData, SpelerData, TeamData, TeamSpelerData } from "../types";
import { PEILJAAR } from "../types";
import { useValidatie } from "@/hooks/useValidatie";
import type { TeamUpdateData } from "../TeamEditPanel";
import {
  addSpelerToTeam,
  removeSpelerFromTeam,
  moveSpeler,
  createTeam,
} from "@/app/scenarios/actions";
import {
  deleteTeam,
  updateTeam,
  updateTeamType,
  koppelSelectie,
  ontkoppelSelectieMetVerdeling,
} from "@/app/scenarios/team-actions";
import { updateTeamVolgorde } from "@/app/scenarios/team-volgorde-actions";

interface VerdeelData {
  groepLeiderId: string;
  leiderTeam: TeamData;
  lidTeams: TeamData[];
}

export function useScenarioEditor(scenario: ScenarioData, alleSpelers: SpelerData[]) {
  const laatsteVersie = scenario.versies[0];
  const versieId = laatsteVersie?.id;

  // Lokale state voor teams (optimistic updates)
  const [teams, setTeams] = useState<TeamData[]>(laatsteVersie?.teams ?? []);

  // Zichtbare teams in werkgebied
  const [zichtbaar, setZichtbaar] = useState<Set<string>>(() => new Set(teams.map((t) => t.id)));

  const [, startTransition] = useTransition();

  // Blauwdruk-kaders voor validatie
  const blauwdrukKaders = useMemo(
    () =>
      scenario.concept?.blauwdruk?.kaders as Record<string, Record<string, unknown>> | undefined,
    [scenario.concept?.blauwdruk?.kaders]
  );

  // Realtime validatie
  const { validatieMap, dubbeleMeldingen } = useValidatie(teams, PEILJAAR, blauwdrukKaders);

  // What-if state
  const [whatIfOpen, setWhatIfOpen] = useState(false);

  // Verdeel-dialoog state
  const [verdeelData, setVerdeelData] = useState<VerdeelData | null>(null);

  // Speler detail popup
  const [detailSpeler, setDetailSpeler] = useState<SpelerData | null>(null);
  const [detailTeamId, setDetailTeamId] = useState<string | null>(null);

  // Team edit panel
  const [editTeamId, setEditTeamId] = useState<string | null>(null);
  const editTeam = useMemo(
    () => teams.find((t) => t.id === editTeamId) ?? null,
    [teams, editTeamId]
  );

  // --- Handlers ---

  const handleSpelerClick = useCallback((speler: SpelerData, teamId?: string) => {
    setDetailSpeler(speler);
    setDetailTeamId(teamId ?? null);
  }, []);

  const handleEditTeam = useCallback((teamId: string) => {
    setEditTeamId(teamId);
  }, []);

  const handleUpdateTeam = useCallback((teamId: string, data: TeamUpdateData) => {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id !== teamId) return t;
        return {
          ...t,
          ...(data.alias !== undefined && { alias: data.alias }),
          ...(data.categorie !== undefined && { categorie: data.categorie }),
          ...(data.kleur !== undefined && { kleur: data.kleur }),
          ...(data.naam !== undefined && { naam: data.naam }),
        };
      })
    );
    startTransition(() => {
      updateTeam(teamId, data);
    });
  }, []);

  const handleUpdateTeamType = useCallback((teamId: string, teamType: "VIERTAL" | null) => {
    setTeams((prev) => prev.map((t) => (t.id !== teamId ? t : { ...t, teamType })));
    startTransition(() => {
      updateTeamType(teamId, teamType);
    });
  }, []);

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
      if (next.has(teamId)) next.delete(teamId);
      else next.add(teamId);
      return next;
    });
  }, []);

  const handleToggleAlles = useCallback((teamIds: string[], aan: boolean) => {
    setZichtbaar((prev) => {
      const next = new Set(prev);
      for (const id of teamIds) {
        if (aan) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }, []);

  // --- DnD handlers ---

  const handlePoolToTeam = useCallback(
    (spelerId: string, teamId: string) => {
      const team = teams.find((t) => t.id === teamId);
      if (team?.spelers.some((ts) => ts.spelerId === spelerId)) return;

      const speler = alleSpelers.find((s) => s.id === spelerId);
      if (!speler) return;

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

      startTransition(() => {
        addSpelerToTeam(teamId, spelerId);
      });
    },
    [teams, alleSpelers]
  );

  const handleTeamToTeam = useCallback(
    (spelerId: string, vanTeamId: string, naarTeamId: string) => {
      const naarTeam = teams.find((t) => t.id === naarTeamId);
      if (naarTeam?.spelers.some((ts) => ts.spelerId === spelerId)) return;

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

  const handleTeamToPool = useCallback((spelerId: string, teamId: string) => {
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
  }, []);

  // --- Team CRUD ---

  const handleCreateTeam = useCallback(
    (data: { naam: string; categorie: TeamCategorie; kleur?: Kleur }) => {
      if (!versieId) return;

      const tempId = `temp-${Date.now()}`;
      const nieuwTeam: TeamData = {
        id: tempId,
        naam: data.naam,
        alias: null,
        categorie: data.categorie,
        kleur: data.kleur ?? null,
        teamType: null,
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

      setVerdeelData({ groepLeiderId, leiderTeam: leider, lidTeams: leden });
    },
    [teams]
  );

  const handleVerdeelBevestig = useCallback(
    (spelerVerdeling: Record<string, string[]>, stafVerdeling: Record<string, string[]>) => {
      if (!verdeelData) return;
      const { groepLeiderId, lidTeams } = verdeelData;
      const alleTeamIds = [groepLeiderId, ...lidTeams.map((t) => t.id)];

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

  const handleReorderTeams = useCallback(
    (vanIndex: number, naarIndex: number) => {
      if (vanIndex === naarIndex) return;
      const prev = [...teams];
      const reordered = [...teams];
      const [moved] = reordered.splice(vanIndex, 1);
      reordered.splice(naarIndex, 0, moved);
      const updated = reordered.map((t, i) => ({ ...t, volgorde: i }));
      setTeams(updated);

      startTransition(async () => {
        try {
          await updateTeamVolgorde(
            versieId!,
            updated.map((t, i) => ({ teamId: t.id, volgorde: i }))
          );
        } catch {
          logger.warn("Volgorde opslaan mislukt, rollback");
          setTeams(prev);
        }
      });
    },
    [teams, versieId]
  );

  return {
    // Data
    teams,
    zichtbaar,
    versieId,
    laatsteVersie,
    validatieMap,
    dubbeleMeldingen,
    editTeamId,
    editTeam,
    detailSpeler,
    detailTeamId,
    whatIfOpen,
    verdeelData,

    // Setters (voor directe UI-besturing)
    setEditTeamId,
    setDetailSpeler,
    setDetailTeamId,
    setWhatIfOpen,
    setVerdeelData,

    // Handlers
    handleSpelerClick,
    handleEditTeam,
    handleUpdateTeam,
    handleUpdateTeamType,
    refreshTeams,
    handleToggle,
    handleToggleAlles,
    handlePoolToTeam,
    handleTeamToTeam,
    handleTeamToPool,
    handleCreateTeam,
    handleDeleteTeam,
    handleKoppelSelectie,
    handleOntkoppelSelectie,
    handleVerdeelBevestig,
    handleReorderTeams,
  };
}
