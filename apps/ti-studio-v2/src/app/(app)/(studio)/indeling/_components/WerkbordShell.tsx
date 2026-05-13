"use client";

import { useState } from "react";
import type {
  WerkindelingMeta,
  VersieMeta,
  VersieData,
  PoolSpeler,
  StafLid,
} from "./werkbord-types";
import { WerkbordToolbar } from "./WerkbordToolbar";
import { WerkbordCanvas } from "./WerkbordCanvas";
import { SpelersPoolDrawer } from "./SpelersPoolDrawer";
import { StafPoolDrawer } from "./StafPoolDrawer";
import { TeamsDrawer } from "./TeamsDrawer";
import { VersiesDrawer } from "./VersiesDrawer";
import { TeamDetailDrawer } from "./TeamDetailDrawer";
import { SaveIndicator } from "./SaveIndicator";
import type { TeamKaartData } from "./werkbord-types";

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
    const team = actieveVersie.teams.find((t) => t.id === teamId) ?? null;
    setGeselecteerdTeam(team);
    setRechtsOpen(null);
  }

  function handleTeamDetailTerug() {
    setGeselecteerdTeam(null);
    setRechtsOpen("teams");
  }

  function handleVersieSelect(versieId: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("versieId", versieId);
    window.location.href = url.toString();
  }

  const detailOpen = geselecteerdTeam !== null;

  return (
    <div className="werkbord-page">
      <WerkbordToolbar
        werkindelingNaam={werkindeling.naam}
        versieNummer={actieveVersieMeta.nummer}
        versieNaam={actieveVersieMeta.naam}
        statsIngedeeld={statsIngedeeld}
        statsTotaal={statsTotaal}
        statsTeams={actieveVersie.teams.length}
        poolOpen={linksOpen === "pool"}
        stafOpen={linksOpen === "staf"}
        teamsOpen={rechtsOpen === "teams"}
        versiesOpen={rechtsOpen === "versies"}
        onTogglePool={handleTogglePool}
        onToggleStaf={handleToggleStaf}
        onToggleTeams={handleToggleTeams}
        onToggleVersies={handleToggleVersies}
      />

      <div className="werkbord-area">
        {/* Linker drawers */}
        <SpelersPoolDrawer
          spelers={allSpelers}
          open={linksOpen === "pool"}
          peildatum={actieveVersie.peildatum}
          onSpelerClick={() => {
            /* fase 2 */
          }}
        />
        <StafPoolDrawer
          staf={allStaf}
          open={linksOpen === "staf"}
          onStafClick={() => {
            /* fase 2 */
          }}
        />

        {/* Canvas */}
        <WerkbordCanvas
          teams={actieveVersie.teams}
          peildatum={actieveVersie.peildatum}
          zoom={zoom}
          onZoomChange={setZoom}
          onTeamClick={handleTeamClick}
        />

        {/* Rechter drawers */}
        <TeamsDrawer
          teams={actieveVersie.teams}
          selectieGroepen={actieveVersie.selectieGroepen}
          statsIngedeeld={statsIngedeeld}
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
        />
      </div>

      <SaveIndicator state="idle" />
    </div>
  );
}
