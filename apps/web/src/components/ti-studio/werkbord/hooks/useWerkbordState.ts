// apps/web/src/components/ti-studio/werkbord/hooks/useWerkbordState.ts
import { useState, useCallback, useRef, useEffect } from "react";
import { logger } from "@oranje-wit/types";
import type {
  WerkbordTeam,
  WerkbordSpeler,
  WerkbordSpelerInTeam,
  WerkbordValidatieItem,
  ValidatieUpdate,
} from "../types";
import {
  voegSelectieSpelerToe,
  verwijderSelectieSpeler,
  toggleSelectieBundeling,
} from "@/app/(teamindeling-studio)/ti-studio/indeling/werkindeling-actions";

export function useWerkbordState(
  versieId: string,
  initieleTeams: WerkbordTeam[],
  initieleSpelers: WerkbordSpeler[],
  initieleValidatie: WerkbordValidatieItem[]
) {
  const [teams, setTeams] = useState<WerkbordTeam[]>(initieleTeams);
  const [alleSpelers, setAlleSpelers] = useState<WerkbordSpeler[]>(initieleSpelers);
  const [validatie, setValidatie] = useState<WerkbordValidatieItem[]>(initieleValidatie);

  const alleSpelersRef = useRef(alleSpelers);
  useEffect(() => {
    alleSpelersRef.current = alleSpelers;
  }, [alleSpelers]);

  const sessionId = useRef<string>(crypto.randomUUID());

  // ─── Lokale mutaties ─────────────────────────────────────────

  const verplaatsSpelerLokaal = useCallback(
    (
      spelerData: WerkbordSpeler,
      vanTeamId: string | null,
      naarTeamId: string,
      naarGeslacht: "V" | "M"
    ) => {
      setTeams((prev) =>
        prev.map((team) => {
          let updated = { ...team };
          if (vanTeamId && team.id === vanTeamId) {
            updated = {
              ...updated,
              dames: updated.dames.filter((s) => s.spelerId !== spelerData.id),
              heren: updated.heren.filter((s) => s.spelerId !== spelerData.id),
            };
          }
          if (team.id === naarTeamId) {
            const spelerInTeam: WerkbordSpelerInTeam = {
              id: `sit-${spelerData.id}-${naarTeamId}-${Date.now()}`,
              spelerId: spelerData.id,
              speler: { ...spelerData, teamId: naarTeamId },
              notitie: null,
            };
            if (naarGeslacht === "V") {
              updated = {
                ...updated,
                dames: [...updated.dames.filter((s) => s.spelerId !== spelerData.id), spelerInTeam],
              };
            } else {
              updated = {
                ...updated,
                heren: [...updated.heren.filter((s) => s.spelerId !== spelerData.id), spelerInTeam],
              };
            }
          }
          return updated;
        })
      );
      setAlleSpelers((prev) =>
        prev.map((s) => (s.id === spelerData.id ? { ...s, teamId: naarTeamId } : s))
      );
    },
    []
  );

  const verwijderSpelerUitTeamLokaal = useCallback((spelerId: string, vanTeamId: string) => {
    setTeams((prev) =>
      prev.map((team) => {
        if (team.id !== vanTeamId) return team;
        return {
          ...team,
          dames: team.dames.filter((s) => s.spelerId !== spelerId),
          heren: team.heren.filter((s) => s.spelerId !== spelerId),
        };
      })
    );
    setAlleSpelers((prev) => prev.map((s) => (s.id === spelerId ? { ...s, teamId: null } : s)));
  }, []);

  const verplaatsTeamKaartLokaal = useCallback((teamId: string, x: number, y: number) => {
    setTeams((prev) =>
      prev.map((t) =>
        t.id === teamId ? { ...t, canvasX: Math.max(0, x), canvasY: Math.max(0, y) } : t
      )
    );
  }, []);

  const updateTeamLokaal = useCallback((teamId: string, update: Partial<WerkbordTeam>) => {
    setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, ...update } : t)));
  }, []);

  const verwijderTeamLokaal = useCallback((teamId: string) => {
    setTeams((prev) => prev.filter((t) => t.id !== teamId));
  }, []);

  const koppelSelectieLokaal = useCallback((teamId: string, selectieGroepId: string) => {
    setTeams((prev) =>
      prev.map((t) =>
        t.id === teamId
          ? {
              ...t,
              selectieGroepId,
              formaat: "selectie",
              selectieNaam: null,
              selectieDames: [],
              selectieHeren: [],
              gebundeld: false,
            }
          : t
      )
    );
  }, []);

  const ontkoppelSelectieLokaal = useCallback((selectieGroepId: string) => {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.selectieGroepId !== selectieGroepId) return t;
        const formaatHerstel: "viertal" | "achtal" =
          t.teamCategorie === "B_CATEGORIE" && (t.kleur === "blauw" || t.kleur === "groen")
            ? "viertal"
            : "achtal";
        return { ...t, selectieGroepId: null, selectieNaam: null, formaat: formaatHerstel };
      })
    );
  }, []);

  const updateSelectieNaamLokaal = useCallback((selectieGroepId: string, naam: string) => {
    setTeams((prev) =>
      prev.map((t) =>
        t.selectieGroepId === selectieGroepId ? { ...t, selectieNaam: naam || null } : t
      )
    );
  }, []);

  const bundelSelectieLokaal = useCallback((selectieGroepId: string) => {
    setTeams((prev) => {
      const sel = prev
        .filter((t) => t.selectieGroepId === selectieGroepId)
        .sort((a, b) => a.volgorde - b.volgorde);
      const [primary, partner] = sel;
      if (!primary || !partner) return prev;
      const selectieDames = [...primary.dames, ...partner.dames];
      const selectieHeren = [...primary.heren, ...partner.heren];
      return prev.map((t) => {
        if (t.id === primary.id)
          return { ...t, dames: [], heren: [], selectieDames, selectieHeren, gebundeld: true };
        if (t.id === partner.id) return { ...t, dames: [], heren: [], gebundeld: true };
        return t;
      });
    });
  }, []);

  const ontbundelSelectieLokaal = useCallback((selectieGroepId: string) => {
    setTeams((prev) => {
      const sel = prev
        .filter((t) => t.selectieGroepId === selectieGroepId)
        .sort((a, b) => a.volgorde - b.volgorde);
      const [primary] = sel;
      if (!primary) return prev;
      return prev.map((t) => {
        if (t.id === primary.id)
          return {
            ...t,
            dames: primary.selectieDames,
            heren: primary.selectieHeren,
            selectieDames: [],
            selectieHeren: [],
            gebundeld: false,
          };
        if (t.selectieGroepId === selectieGroepId) return { ...t, gebundeld: false };
        return t;
      });
    });
    setAlleSpelers((prev) =>
      prev.map((s) => (s.selectieGroepId === selectieGroepId ? { ...s, selectieGroepId: null } : s))
    );
  }, []);

  const voegSelectieSpelerToeLokaal = useCallback(
    (naarSelectieGroepId: string, spelerData: WerkbordSpeler, geslacht: "V" | "M") => {
      setTeams((prev) => {
        const teamsInGroep = [...prev]
          .filter((t) => t.selectieGroepId === naarSelectieGroepId)
          .sort((a, b) => a.volgorde - b.volgorde);
        if (teamsInGroep.length === 0) return prev;

        // Verdeel gelijkwaardig: kies het team met de minste spelers van dit geslacht.
        // Bij gelijke stand wint het team met de laagste volgorde (primary).
        const doelTeam = teamsInGroep.reduce((min, t) => {
          const countMin = geslacht === "V" ? min.selectieDames.length : min.selectieHeren.length;
          const countT = geslacht === "V" ? t.selectieDames.length : t.selectieHeren.length;
          return countT < countMin ? t : min;
        }, teamsInGroep[0]);

        const spelerInTeam: WerkbordSpelerInTeam = {
          id: `ssel-${spelerData.id}-${Date.now()}`,
          spelerId: spelerData.id,
          speler: { ...spelerData, teamId: null, selectieGroepId: naarSelectieGroepId },
          notitie: null,
        };
        return prev.map((t) => {
          if (t.id !== doelTeam.id) return t;
          if (geslacht === "V") {
            return {
              ...t,
              selectieDames: [
                ...t.selectieDames.filter((s) => s.spelerId !== spelerData.id),
                spelerInTeam,
              ],
            };
          }
          return {
            ...t,
            selectieHeren: [
              ...t.selectieHeren.filter((s) => s.spelerId !== spelerData.id),
              spelerInTeam,
            ],
          };
        });
      });
      setAlleSpelers((prev) =>
        prev.map((s) =>
          s.id === spelerData.id ? { ...s, teamId: null, selectieGroepId: naarSelectieGroepId } : s
        )
      );
    },
    []
  );

  const toggleBundeling = useCallback(
    async (selectieGroepId: string, gebundeld: boolean) => {
      if (gebundeld) {
        bundelSelectieLokaal(selectieGroepId);
        await toggleSelectieBundeling(selectieGroepId, true);
      } else {
        const alleCurTeams = teams.filter((t) => t.selectieGroepId === selectieGroepId);
        const primaryTeam = alleCurTeams.sort((a, b) => a.volgorde - b.volgorde)[0];
        ontbundelSelectieLokaal(selectieGroepId);
        await toggleSelectieBundeling(selectieGroepId, false, primaryTeam?.id);
      }
    },
    [bundelSelectieLokaal, ontbundelSelectieLokaal, teams]
  );

  const onDropSpelerOpSelectieFn = useCallback(
    async (
      spelerData: WerkbordSpeler,
      vanTeamId: string | null,
      vanSelectieGroepId: string | null,
      naarSelectieGroepId: string,
      geslacht: "V" | "M"
    ) => {
      if (vanTeamId) {
        verwijderSpelerUitTeamLokaal(spelerData.id, vanTeamId);
      } else if (vanSelectieGroepId) {
        setTeams((prev) =>
          prev.map((t) => {
            if (t.selectieGroepId !== vanSelectieGroepId) return t;
            return {
              ...t,
              selectieDames: t.selectieDames.filter((s) => s.spelerId !== spelerData.id),
              selectieHeren: t.selectieHeren.filter((s) => s.spelerId !== spelerData.id),
            };
          })
        );
      }
      voegSelectieSpelerToeLokaal(naarSelectieGroepId, spelerData, geslacht);
      const result = await voegSelectieSpelerToe(naarSelectieGroepId, spelerData.id);
      if (!result.ok) {
        void verwijderSelectieSpeler(naarSelectieGroepId, spelerData.id);
      }
    },
    [verwijderSpelerUitTeamLokaal, voegSelectieSpelerToeLokaal]
  );

  const updateValidatieLokaal = useCallback((updates: ValidatieUpdate[]) => {
    setValidatie((prev) => {
      let nieuw = [...prev];
      for (const update of updates) {
        nieuw = nieuw.filter((v) => v.teamId !== update.teamId);
        nieuw.push(...update.items);
      }
      return nieuw;
    });
    setTeams((prev) =>
      prev.map((t) => {
        const update = updates.find((u) => u.teamId === t.id);
        if (!update) return t;
        return { ...t, validatieStatus: update.status, validatieCount: update.count };
      })
    );
  }, []);

  // ─── API-calls ───────────────────────────────────────────────

  async function stuurMutatie(body: Record<string, unknown>) {
    try {
      const resp = await fetch(`/api/ti-studio/indeling/${versieId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, sessionId: sessionId.current }),
      });
      if (resp.ok) {
        const data = (await resp.json()) as { validatieUpdates?: ValidatieUpdate[] };
        if (data.validatieUpdates?.length) {
          updateValidatieLokaal(data.validatieUpdates);
        }
      }
    } catch (error) {
      logger.warn("stuurMutatie fout (optimistic update blijft):", error);
    }
  }

  const verplaatsSpeler = useCallback(
    (
      spelerData: WerkbordSpeler,
      vanTeamId: string | null,
      naarTeamId: string,
      naarGeslacht: "V" | "M"
    ) => {
      verplaatsSpelerLokaal(spelerData, vanTeamId, naarTeamId, naarGeslacht);
      stuurMutatie({
        type: "speler_verplaatst",
        spelerId: spelerData.id,
        vanTeamId,
        naarTeamId,
        naarGeslacht,
      });
    },
    [verplaatsSpelerLokaal]
  );

  const verwijderSpelerUitTeam = useCallback(
    (spelerId: string, vanTeamId: string) => {
      verwijderSpelerUitTeamLokaal(spelerId, vanTeamId);
      stuurMutatie({ type: "speler_naar_pool", spelerId, vanTeamId });
    },
    [verwijderSpelerUitTeamLokaal]
  );

  const verplaatsTeamKaart = useCallback(
    (teamId: string, x: number, y: number) => verplaatsTeamKaartLokaal(teamId, x, y),
    [verplaatsTeamKaartLokaal]
  );

  const slaTeamPositieOp = useCallback((teamId: string, x: number, y: number) => {
    stuurMutatie({ type: "team_positie", teamId, x: Math.round(x), y: Math.round(y) });
  }, []);

  // ─── SSE ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!versieId) return;
    const es = new EventSource(`/api/ti-studio/indeling/${versieId}/stream`);
    es.onmessage = (e) => {
      let event: Record<string, unknown>;
      try {
        event = JSON.parse(e.data as string);
      } catch {
        return;
      }
      if (event.type === "ping") return;
      if (event.sessionId === sessionId.current) return;
      if (event.type === "speler_verplaatst") {
        const sp = alleSpelersRef.current.find((s) => s.id === event.spelerId);
        if (sp)
          verplaatsSpelerLokaal(
            sp,
            event.vanTeamId as string | null,
            event.naarTeamId as string,
            event.naarGeslacht as "V" | "M"
          );
      } else if (event.type === "speler_naar_pool") {
        verwijderSpelerUitTeamLokaal(event.spelerId as string, event.vanTeamId as string);
      } else if (event.type === "team_positie") {
        verplaatsTeamKaartLokaal(event.teamId as string, event.x as number, event.y as number);
      }
    };
    return () => es.close();
  }, [versieId, verplaatsSpelerLokaal, verwijderSpelerUitTeamLokaal, verplaatsTeamKaartLokaal]);

  return {
    teams,
    alleSpelers,
    validatie,
    updateValidatieLokaal,
    verplaatsSpeler,
    verwijderSpelerUitTeam,
    verplaatsTeamKaart,
    slaTeamPositieOp,
    updateTeamLokaal,
    verwijderTeamLokaal,
    koppelSelectieLokaal,
    ontkoppelSelectieLokaal,
    updateSelectieNaamLokaal,
    toggleBundeling,
    onDropSpelerOpSelectieFn,
  };
}
