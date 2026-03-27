"use client";

import {
  useCallback,
  useMemo,
  type Dispatch,
  type SetStateAction,
  type TransitionStartFunction,
} from "react";
import type {
  SpelerData,
  TeamData,
  TeamSpelerData,
  SelectieGroepData,
  SelectieSpelerData,
  SelectieStafData,
} from "../types";
import {
  addSpelerToTeam,
  removeSpelerFromTeam,
  moveSpeler,
} from "@/app/(teamindeling)/teamindeling/scenarios/actions";
import {
  koppelSelectie,
  ontkoppelSelectieMetVerdeling,
  updateSelectieNaam,
} from "@/app/(teamindeling)/teamindeling/scenarios/team-actions";

export interface VerdeelData {
  groepId: string;
  selectieGroep: SelectieGroepData;
  lidTeams: TeamData[];
}

interface UseSelectieHandlersParams {
  teams: TeamData[];
  alleSpelers: SpelerData[];
  selectieGroepen: SelectieGroepData[];
  verdeelData: VerdeelData | null;
  setTeams: Dispatch<SetStateAction<TeamData[]>>;
  setSelectieGroepen: Dispatch<SetStateAction<SelectieGroepData[]>>;
  setVerdeelData: Dispatch<SetStateAction<VerdeelData | null>>;
  startTransition: TransitionStartFunction;
}

export function useSelectieHandlers({
  teams,
  alleSpelers,
  selectieGroepen,
  verdeelData,
  setTeams,
  setSelectieGroepen,
  setVerdeelData,
  startTransition,
}: UseSelectieHandlersParams) {
  // --- DnD handlers (selectie-aware) ---

  const handlePoolToTeam = useCallback(
    (spelerId: string, teamId: string) => {
      const team = teams.find((t) => t.id === teamId);
      if (!team) return;
      const speler = alleSpelers.find((s) => s.id === spelerId);
      if (!speler) return;

      if (team.selectieGroepId) {
        const groepId = team.selectieGroepId;
        const groep = selectieGroepen.find((sg) => sg.id === groepId);
        if (groep?.spelers.some((ss) => ss.spelerId === spelerId)) return;

        setSelectieGroepen((prev) =>
          prev.map((sg) => {
            if (sg.id !== groepId) return sg;
            return {
              ...sg,
              spelers: [
                ...sg.spelers,
                {
                  id: `temp-${Date.now()}`,
                  spelerId: speler.id,
                  statusOverride: null,
                  notitie: null,
                  speler,
                },
              ],
            };
          })
        );
      } else {
        if (team.spelers.some((ts) => ts.spelerId === spelerId)) return;
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
      }

      startTransition(() => {
        addSpelerToTeam(teamId, spelerId);
      });
    },
    [teams, alleSpelers, selectieGroepen, setTeams, setSelectieGroepen, startTransition]
  );

  const handleTeamToTeam = useCallback(
    (spelerId: string, vanTeamId: string, naarTeamId: string) => {
      const vanTeam = teams.find((t) => t.id === vanTeamId);
      const naarTeam = teams.find((t) => t.id === naarTeamId);
      if (!vanTeam || !naarTeam) return;

      const vanSelectie = vanTeam.selectieGroepId;
      const naarSelectie = naarTeam.selectieGroepId;

      if (vanSelectie && naarSelectie && vanSelectie === naarSelectie) return;

      if (vanSelectie && !naarSelectie) {
        const groep = selectieGroepen.find((sg) => sg.id === vanSelectie);
        const ss = groep?.spelers.find((s) => s.spelerId === spelerId);
        if (!ss) return;
        if (naarTeam.spelers.some((ts) => ts.spelerId === spelerId)) return;

        setSelectieGroepen((prev) =>
          prev.map((sg) => {
            if (sg.id !== vanSelectie) return sg;
            return { ...sg, spelers: sg.spelers.filter((s) => s.spelerId !== spelerId) };
          })
        );
        setTeams((prev) =>
          prev.map((t) => {
            if (t.id !== naarTeamId) return t;
            const nieuwTS: TeamSpelerData = {
              id: `temp-${Date.now()}`,
              spelerId: ss.spelerId,
              statusOverride: ss.statusOverride,
              notitie: ss.notitie,
              speler: ss.speler,
            };
            return { ...t, spelers: [...t.spelers, nieuwTS] };
          })
        );
      } else if (!vanSelectie && naarSelectie) {
        const groep = selectieGroepen.find((sg) => sg.id === naarSelectie);
        if (groep?.spelers.some((s) => s.spelerId === spelerId)) return;
        const spelerData = vanTeam.spelers.find((ts) => ts.spelerId === spelerId);
        if (!spelerData) return;

        setTeams((prev) =>
          prev.map((t) => {
            if (t.id !== vanTeamId) return t;
            return { ...t, spelers: t.spelers.filter((ts) => ts.spelerId !== spelerId) };
          })
        );
        setSelectieGroepen((prev) =>
          prev.map((sg) => {
            if (sg.id !== naarSelectie) return sg;
            return {
              ...sg,
              spelers: [
                ...sg.spelers,
                {
                  id: `temp-${Date.now()}`,
                  spelerId: spelerData.spelerId,
                  statusOverride: spelerData.statusOverride,
                  notitie: spelerData.notitie,
                  speler: spelerData.speler,
                },
              ],
            };
          })
        );
      } else {
        if (naarTeam.spelers.some((ts) => ts.spelerId === spelerId)) return;

        setTeams((prev) => {
          let verplaatsteSpeler: TeamSpelerData | null = null;
          const updated = prev.map((t) => {
            if (t.id === vanTeamId) {
              const sd = t.spelers.find((ts) => ts.spelerId === spelerId);
              if (sd) verplaatsteSpeler = { ...sd, id: `temp-${Date.now()}` };
              return { ...t, spelers: t.spelers.filter((ts) => ts.spelerId !== spelerId) };
            }
            return t;
          });
          if (!verplaatsteSpeler) return updated;
          return updated.map((t) => {
            if (t.id !== naarTeamId) return t;
            return { ...t, spelers: [...t.spelers, verplaatsteSpeler!] };
          });
        });
      }

      startTransition(() => {
        moveSpeler(spelerId, vanTeamId, naarTeamId);
      });
    },
    [teams, selectieGroepen, setTeams, setSelectieGroepen, startTransition]
  );

  const handleTeamToPool = useCallback(
    (spelerId: string, teamId: string) => {
      const team = teams.find((t) => t.id === teamId);

      if (team?.selectieGroepId) {
        setSelectieGroepen((prev) =>
          prev.map((sg) => {
            if (sg.id !== team.selectieGroepId) return sg;
            return { ...sg, spelers: sg.spelers.filter((s) => s.spelerId !== spelerId) };
          })
        );
      } else {
        setTeams((prev) =>
          prev.map((t) => {
            if (t.id !== teamId) return t;
            return { ...t, spelers: t.spelers.filter((ts) => ts.spelerId !== spelerId) };
          })
        );
      }

      startTransition(() => {
        removeSpelerFromTeam(teamId, spelerId);
      });
    },
    [teams, setTeams, setSelectieGroepen, startTransition]
  );

  // --- Selectie koppel/ontkoppel handlers ---

  const handleKoppelSelectie = useCallback(
    (teamIds: string[]) => {
      if (teamIds.length !== 2) return;
      const tempGroepId = `temp-${Date.now()}`;

      const verzameldeSpelers: SelectieSpelerData[] = [];
      const verzameldeStaf: SelectieStafData[] = [];
      const gezienSpelers = new Set<string>();
      const gezienStaf = new Set<string>();

      for (const tid of teamIds) {
        const team = teams.find((t) => t.id === tid);
        if (!team) continue;
        for (const ts of team.spelers) {
          if (!gezienSpelers.has(ts.spelerId)) {
            gezienSpelers.add(ts.spelerId);
            verzameldeSpelers.push({
              id: `temp-ss-${ts.spelerId}`,
              spelerId: ts.spelerId,
              statusOverride: ts.statusOverride,
              notitie: ts.notitie,
              speler: ts.speler,
            });
          }
        }
        for (const ts of team.staf) {
          if (!gezienStaf.has(ts.stafId)) {
            gezienStaf.add(ts.stafId);
            verzameldeStaf.push({
              id: `temp-sf-${ts.stafId}`,
              stafId: ts.stafId,
              rol: ts.rol,
              staf: ts.staf,
            });
          }
        }
      }

      setSelectieGroepen((prev) => [
        ...prev,
        { id: tempGroepId, naam: null, spelers: verzameldeSpelers, staf: verzameldeStaf },
      ]);

      setTeams((prev) =>
        prev.map((t) => {
          if (teamIds.includes(t.id)) {
            return { ...t, selectieGroepId: tempGroepId, spelers: [], staf: [] };
          }
          return t;
        })
      );

      startTransition(() => {
        koppelSelectie(teamIds);
      });
    },
    [teams, setTeams, setSelectieGroepen, startTransition]
  );

  const handleOntkoppelSelectie = useCallback(
    (groepId: string) => {
      const selectieGroep = selectieGroepen.find((sg) => sg.id === groepId);
      const groepTeams = teams.filter((t) => t.selectieGroepId === groepId);
      if (!selectieGroep || groepTeams.length === 0) return;

      setVerdeelData({ groepId, selectieGroep, lidTeams: groepTeams });
    },
    [teams, selectieGroepen, setVerdeelData]
  );

  const handleVerdeelBevestig = useCallback(
    (spelerVerdeling: Record<string, string[]>, stafVerdeling: Record<string, string[]>) => {
      if (!verdeelData) return;
      const { groepId, selectieGroep, lidTeams } = verdeelData;
      const alleTeamIds = lidTeams.map((t) => t.id);

      const spelerMap = new Map(selectieGroep.spelers.map((ss) => [ss.spelerId, ss]));
      const stafMap = new Map(selectieGroep.staf.map((ss) => [ss.stafId, ss]));
      const alleStafIds = new Set(stafVerdeling["alle"] ?? []);

      setTeams((prev) =>
        prev.map((t) => {
          if (!alleTeamIds.includes(t.id)) return t;

          const spelerIds = spelerVerdeling[t.id] ?? [];
          const teamStafIds = stafVerdeling[t.id] ?? [];

          const teamSpelers: TeamSpelerData[] = spelerIds
            .map((id) => {
              const ss = spelerMap.get(id);
              if (!ss) return null;
              return {
                id: `temp-${Date.now()}-${id}`,
                spelerId: ss.spelerId,
                statusOverride: ss.statusOverride,
                notitie: ss.notitie,
                speler: ss.speler,
              };
            })
            .filter(Boolean) as TeamSpelerData[];

          const stafVoorTeam = [
            ...teamStafIds.map((id) => stafMap.get(id)).filter(Boolean),
            ...Array.from(alleStafIds)
              .map((id) => stafMap.get(id))
              .filter(Boolean),
          ].map((ss) => ({
            id: `temp-${Date.now()}-${ss!.stafId}`,
            stafId: ss!.stafId,
            rol: ss!.rol,
            staf: ss!.staf,
          }));

          return {
            ...t,
            selectieGroepId: null,
            spelers: teamSpelers,
            staf: stafVoorTeam,
          };
        })
      );

      setSelectieGroepen((prev) => prev.filter((sg) => sg.id !== groepId));
      setVerdeelData(null);

      startTransition(() => {
        ontkoppelSelectieMetVerdeling(groepId, spelerVerdeling, stafVerdeling, alleTeamIds);
      });
    },
    [verdeelData, setTeams, setSelectieGroepen, setVerdeelData, startTransition]
  );

  const handleUpdateSelectieNaam = useCallback(
    (groepId: string, naam: string | null) => {
      setSelectieGroepen((prev) => prev.map((sg) => (sg.id !== groepId ? sg : { ...sg, naam })));
      startTransition(() => {
        updateSelectieNaam(groepId, naam);
      });
    },
    [setSelectieGroepen, startTransition]
  );

  const selectieGroepMap = useMemo(() => {
    const m = new Map<string, SelectieGroepData>();
    for (const sg of selectieGroepen) m.set(sg.id, sg);
    return m;
  }, [selectieGroepen]);

  return {
    selectieGroepMap,
    handlePoolToTeam,
    handleTeamToTeam,
    handleTeamToPool,
    handleKoppelSelectie,
    handleOntkoppelSelectie,
    handleVerdeelBevestig,
    handleUpdateSelectieNaam,
  };
}
