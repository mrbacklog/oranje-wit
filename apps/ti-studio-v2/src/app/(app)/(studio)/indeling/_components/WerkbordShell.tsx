"use client";

import { useCallback, useState } from "react";
import type {
  WerkindelingMeta,
  VersieMeta,
  VersieData,
  PoolSpeler,
  StafLid,
  TeamKaartData,
  TeamKaartSpeler,
  SaveState,
} from "./werkbord-types";
import { WerkbordToolbar } from "./WerkbordToolbar";
import { WerkbordCanvas } from "./WerkbordCanvas";
import { SpelersPoolDrawer } from "./SpelersPoolDrawer";
import { StafPoolDrawer } from "./StafPoolDrawer";
import { TeamsDrawer } from "./TeamsDrawer";
import { VersiesDrawer } from "./VersiesDrawer";
import { TeamDetailDrawer } from "./TeamDetailDrawer";
import { TeamDialog } from "@/components/team/contexts/TeamDialog";
import { useSpelerDialog } from "@/components/speler/contexts/SpelerDialogProvider";
import { SaveIndicator } from "./SaveIndicator";
import { verplaatsSpeler } from "@/actions/werkbord/verplaats-speler";
import { verplaatsKaart } from "@/actions/werkbord/verplaats-kaart";
import type { WerkbordDragData } from "./hooks/useWerkbordDraggable";
import { logger } from "@oranje-wit/types";

interface WerkbordShellProps {
  werkindeling: WerkindelingMeta;
  versies: VersieMeta[];
  actieveVersie: VersieData;
  actieveVersieMeta: VersieMeta;
  allSpelers: PoolSpeler[];
  allStaf: StafLid[];
  statsIngedeeld: number;
  statsTotaal: number;
}

type LinksDrawer = "pool" | "staf" | null;
type RechtsDrawer = "teams" | "versies" | null;
type ZoomMode = "compact" | "detail";

// ── Optimistic helpers ───────────────────────────────────────────────────────

function verplaatsSpelerOptimistisch(
  teams: TeamKaartData[],
  rel_code: string,
  naarTeamId: string | null
): TeamKaartData[] {
  // Zoek de speler in een van de teams of pool
  let spelerData: TeamKaartSpeler | null = null;
  const zonderSpeler = teams.map((team) => {
    const dames = team.spelersDames.filter((s) => s.spelerId !== rel_code);
    const heren = team.spelersHeren.filter((s) => s.spelerId !== rel_code);
    if (dames.length !== team.spelersDames.length || heren.length !== team.spelersHeren.length) {
      // speler was in dit team
      const gevonden =
        team.spelersDames.find((s) => s.spelerId === rel_code) ??
        team.spelersHeren.find((s) => s.spelerId === rel_code) ??
        null;
      if (gevonden) spelerData = gevonden;
    }
    return { ...team, spelersDames: dames, spelersHeren: heren };
  });

  if (!naarTeamId || !spelerData) return zonderSpeler;

  const s: TeamKaartSpeler = spelerData;
  return zonderSpeler.map((team) => {
    if (team.id !== naarTeamId) return team;
    if (s.geslacht === "V") {
      return { ...team, spelersDames: [...team.spelersDames, s] };
    }
    return { ...team, spelersHeren: [...team.spelersHeren, s] };
  });
}

function verplaatsSpelerInPool(
  spelers: PoolSpeler[],
  rel_code: string,
  naarTeamId: string | null,
  teamNaam: string | null = null
): PoolSpeler[] {
  return spelers.map((s) =>
    s.spelerId === rel_code ? { ...s, ingedeeldTeamId: naarTeamId, ingedeeldTeamNaam: teamNaam } : s
  );
}

export function WerkbordShell({
  werkindeling,
  versies,
  actieveVersie,
  actieveVersieMeta,
  allSpelers,
  allStaf,
  statsIngedeeld,
  statsTotaal,
}: WerkbordShellProps) {
  const [linksOpen, setLinksOpen] = useState<LinksDrawer>("pool");
  const [rechtsOpen, setRechtsOpen] = useState<RechtsDrawer>("teams");
  const [zoom, setZoom] = useState<ZoomMode>("compact");
  const [geselecteerdTeam, setGeselecteerdTeam] = useState<TeamKaartData | null>(null);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [foutTekst, setFoutTekst] = useState<string | null>(null);

  // Optimistische state
  const [teams, setTeams] = useState<TeamKaartData[]>(actieveVersie.teams);
  const [poolSpelers, setPoolSpelers] = useState<PoolSpeler[]>(allSpelers);
  const [posities, setPosities] = useState<Record<string, { x: number; y: number }>>(
    actieveVersie.posities
  );

  function handleTogglePool() {
    setLinksOpen((prev) => (prev === "pool" ? null : "pool"));
  }
  function handleToggleStaf() {
    setLinksOpen((prev) => (prev === "staf" ? null : "staf"));
  }
  function handleToggleTeams() {
    if (rechtsOpen === "teams") {
      setRechtsOpen(null);
    } else {
      setRechtsOpen("teams");
      setGeselecteerdTeam(null);
    }
  }
  function handleToggleVersies() {
    setRechtsOpen((prev) => (prev === "versies" ? null : "versies"));
  }

  function handleTeamClick(teamId: string) {
    const team = teams.find((t) => t.id === teamId) ?? null;
    setGeselecteerdTeam(team);
    setRechtsOpen(null);
  }

  function handleTeamDetailTerug() {
    setGeselecteerdTeam(null);
    setRechtsOpen("teams");
  }

  function handleOpenTeamDialog() {
    setTeamDialogOpen(true);
  }

  function handleCloseTeamDialog() {
    setTeamDialogOpen(false);
  }

  const { open: openSpelerDialog } = useSpelerDialog();

  function handleSpelerClick(spelerId: string) {
    openSpelerDialog(spelerId, {
      actieveVersieId: actieveVersieMeta.id,
      teams: teams.map((t) => ({ id: t.id, naam: t.alias ?? t.naam, kleur: t.kleur })),
    });
  }

  function handleVersieSelect(versieId: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("versieId", versieId);
    window.location.href = url.toString();
  }

  const statsIngedeeldLive = poolSpelers.filter((s) => s.ingedeeldTeamId !== null).length;

  const handleDropKaart = useCallback(
    async (kaartKey: string, x: number, y: number) => {
      // Optimistische update
      setPosities((prev) => ({ ...prev, [kaartKey]: { x, y } }));

      const result = await verplaatsKaart({
        versieId: actieveVersie.versieId,
        kaartKey,
        x,
        y,
      });

      if (result.ok) {
        setPosities(result.data.posities);
      } else {
        // Rollback naar server-staat
        setPosities(actieveVersie.posities);
        logger.warn("handleDropKaart mislukt:", result.error);
      }
    },
    [actieveVersie.versieId, actieveVersie.posities]
  );

  const handleDropSpelerOpTeam = useCallback(
    async (data: WerkbordDragData, naarTeamId: string) => {
      // Snapshot voor rollback
      const snapshotTeams = teams;
      const snapshotPool = poolSpelers;

      // Optimistische update
      setTeams(verplaatsSpelerOptimistisch(teams, data.rel_code, naarTeamId));
      const naarTeam = teams.find((t) => t.id === naarTeamId) ?? null;
      setPoolSpelers(
        verplaatsSpelerInPool(
          poolSpelers,
          data.rel_code,
          naarTeamId,
          naarTeam ? (naarTeam.alias ?? naarTeam.naam) : null
        )
      );
      setSaveState("saving");
      setFoutTekst(null);

      const result = await verplaatsSpeler({
        versieId: actieveVersie.versieId,
        rel_code: data.rel_code,
        naarTeamId,
      });

      if (result.ok) {
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 2000);
      } else {
        // Rollback
        setTeams(snapshotTeams);
        setPoolSpelers(snapshotPool);
        setSaveState("error");
        setFoutTekst(result.error ?? "Opslaan mislukt");
        logger.warn("handleDropSpelerOpTeam mislukt:", result.error);
        setTimeout(() => {
          setSaveState("idle");
          setFoutTekst(null);
        }, 4000);
      }
    },
    [teams, poolSpelers, actieveVersie.versieId]
  );

  const handleDropNaarPool = useCallback(
    async (data: WerkbordDragData) => {
      const snapshotTeams = teams;
      const snapshotPool = poolSpelers;

      setTeams(verplaatsSpelerOptimistisch(teams, data.rel_code, null));
      setPoolSpelers(verplaatsSpelerInPool(poolSpelers, data.rel_code, null, null));
      setSaveState("saving");
      setFoutTekst(null);

      const result = await verplaatsSpeler({
        versieId: actieveVersie.versieId,
        rel_code: data.rel_code,
        naarTeamId: null,
      });

      if (result.ok) {
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 2000);
      } else {
        setTeams(snapshotTeams);
        setPoolSpelers(snapshotPool);
        setSaveState("error");
        setFoutTekst(result.error ?? "Opslaan mislukt");
        logger.warn("handleDropNaarPool mislukt:", result.error);
        setTimeout(() => {
          setSaveState("idle");
          setFoutTekst(null);
        }, 4000);
      }
    },
    [teams, poolSpelers, actieveVersie.versieId]
  );

  const detailOpen = geselecteerdTeam !== null;

  return (
    <div className="werkbord-page">
      {/* Page-header boven toolbar */}
      <div className="wb-page-header">
        <h1 className="wb-page-title">Werkbord</h1>
        <p className="wb-page-sub">Visuele editor voor teamopstelling en spelersverdeling</p>
      </div>

      <WerkbordToolbar
        werkindelingNaam={werkindeling.naam}
        versieNummer={actieveVersieMeta.nummer}
        versieNaam={actieveVersieMeta.naam}
        statsIngedeeld={statsIngedeeldLive}
        statsTotaal={statsTotaal}
        statsTeams={teams.length}
        poolOpen={linksOpen === "pool"}
        stafOpen={linksOpen === "staf"}
        teamsOpen={rechtsOpen === "teams"}
        versiesOpen={rechtsOpen === "versies"}
        onTogglePool={handleTogglePool}
        onToggleStaf={handleToggleStaf}
        onToggleTeams={handleToggleTeams}
        onToggleVersies={handleToggleVersies}
      />

      {/* Fout-toast */}
      {foutTekst && (
        <div
          style={{
            position: "fixed",
            bottom: 60,
            right: 16,
            zIndex: 200,
            background: "rgba(239,68,68,.12)",
            border: "1px solid rgba(239,68,68,.35)",
            borderRadius: 8,
            padding: "8px 16px",
            fontSize: 12,
            color: "#ef4444",
            fontWeight: 600,
            maxWidth: 320,
            pointerEvents: "none",
          }}
        >
          ✕ {foutTekst}
        </div>
      )}

      <div className="werkbord-area">
        {/* Linker drawers */}
        <SpelersPoolDrawer
          spelers={poolSpelers}
          open={linksOpen === "pool"}
          peildatum={actieveVersie.peildatum}
          onSpelerClick={handleSpelerClick}
          onDropNaarPool={handleDropNaarPool}
        />
        <StafPoolDrawer
          staf={allStaf}
          open={linksOpen === "staf"}
          onStafClick={() => {
            /* fase 3: StafDialog */
          }}
        />

        {/* Canvas */}
        <WerkbordCanvas
          teams={teams}
          selectieGroepen={actieveVersie.selectieGroepen}
          peildatum={actieveVersie.peildatum}
          posities={posities}
          zoom={zoom}
          onZoomChange={setZoom}
          onTeamClick={handleTeamClick}
          onDropSpelerOpTeam={handleDropSpelerOpTeam}
          onKaartDrop={handleDropKaart}
        />

        {/* Rechter drawers */}
        <TeamsDrawer
          teams={teams}
          selectieGroepen={actieveVersie.selectieGroepen}
          statsIngedeeld={statsIngedeeldLive}
          statsTotaal={statsTotaal}
          open={rechtsOpen === "teams"}
          onTeamClick={handleTeamClick}
        />
        <VersiesDrawer
          versies={versies}
          actieveVersieId={actieveVersieMeta.id}
          open={rechtsOpen === "versies"}
          onVersieSelect={handleVersieSelect}
        />
        <TeamDetailDrawer
          team={geselecteerdTeam}
          open={detailOpen}
          onTerug={handleTeamDetailTerug}
          onOpenDialog={handleOpenTeamDialog}
        />
      </div>

      <SaveIndicator state={saveState} />

      {/* TeamDialog modal */}
      <TeamDialog team={geselecteerdTeam} open={teamDialogOpen} onClose={handleCloseTeamDialog} />

      {/* SpelerDialog wordt gemonteerd door SpelerDialogProvider (AppShell). */}
    </div>
  );
}
