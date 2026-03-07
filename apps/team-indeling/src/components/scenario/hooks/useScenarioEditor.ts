"use client";

import { useState, useCallback, useTransition, useMemo } from "react";
import { logger } from "@oranje-wit/types";
import type { TeamCategorie, Kleur } from "@oranje-wit/database";
import type { ScenarioData, SpelerData, TeamData, SelectieGroepData } from "../types";
import { PEILJAAR } from "../types";
import { useValidatie } from "@/hooks/useValidatie";
import type { TeamUpdateData } from "../TeamEditPanel";
import { createTeam } from "@/app/scenarios/actions";
import { deleteTeam, updateTeam, updateTeamType } from "@/app/scenarios/team-actions";
import { updateTeamVolgorde } from "@/app/scenarios/team-volgorde-actions";
import { useSelectieHandlers, type VerdeelData } from "./useSelectieHandlers";

export function useScenarioEditor(scenario: ScenarioData, alleSpelers: SpelerData[]) {
  const laatsteVersie = scenario.versies[0];
  const versieId = laatsteVersie?.id;

  // Lokale state voor teams (optimistic updates)
  const [teams, setTeams] = useState<TeamData[]>(laatsteVersie?.teams ?? []);

  // Lokale state voor selectieGroepen
  const [selectieGroepen, setSelectieGroepen] = useState<SelectieGroepData[]>(
    laatsteVersie?.selectieGroepen ?? []
  );

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

  // Selectie handlers (DnD + koppel/ontkoppel)
  const selectie = useSelectieHandlers({
    teams,
    alleSpelers,
    selectieGroepen,
    verdeelData,
    setTeams,
    setSelectieGroepen,
    setVerdeelData,
    startTransition,
  });

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
        if (data.selectieGroepen) {
          setSelectieGroepen(data.selectieGroepen);
        }
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
    selectieGroepen,
    selectieGroepMap: selectie.selectieGroepMap,
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
    handlePoolToTeam: selectie.handlePoolToTeam,
    handleTeamToTeam: selectie.handleTeamToTeam,
    handleTeamToPool: selectie.handleTeamToPool,
    handleCreateTeam,
    handleDeleteTeam,
    handleKoppelSelectie: selectie.handleKoppelSelectie,
    handleOntkoppelSelectie: selectie.handleOntkoppelSelectie,
    handleVerdeelBevestig: selectie.handleVerdeelBevestig,
    handleReorderTeams,
  };
}
