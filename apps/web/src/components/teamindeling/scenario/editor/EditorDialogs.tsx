"use client";

import type { TeamCategorie, Kleur } from "@oranje-wit/database";
import type { TeamData, SpelerData, PinData, SelectieGroepData } from "../types";
import type { TeamValidatie, ValidatieMelding } from "@/lib/teamindeling/validatie/regels";

import SpelerDetail from "../SpelerDetail";
import VerdeelDialoog from "../VerdeelDialoog";
import NieuwTeamDialoog from "../NieuwTeamDialoog";
import ValidatieRapport from "../ValidatieRapport";
import ScenarioWerkbordPanel from "../ScenarioWerkbordPanel";
import Drawer from "./Drawer";

interface VerdeelState {
  selectieGroep: SelectieGroepData;
  lidTeams: TeamData[];
}

interface EditorDialogsProps {
  werkindelingId: string;
  teams: TeamData[];
  showRanking: boolean;

  // NieuwTeam
  nieuwTeamOpen: boolean;
  onCloseNieuwTeam: () => void;
  onCreateTeam: (data: { naam: string; categorie: TeamCategorie; kleur?: Kleur }) => void;

  // ValidatieRapport (overlay, niet-gepind)
  rapportPinned: boolean;
  rapportOpen: boolean;
  validatieMap: Map<string, TeamValidatie> | undefined;
  dubbeleMeldingen: ValidatieMelding[];
  onCloseRapport: () => void;
  onToggleRapportPin: () => void;

  // Werkbord
  werkbordOpen: boolean;
  onCloseWerkbord: () => void;
  blauwdrukId: string | null;

  // Verdeel
  verdeelData: VerdeelState | null;
  onCloseVerdeel: () => void;
  onVerdeelBevestig: (
    spelerVerdeling: Record<string, string[]>,
    stafVerdeling: Record<string, string[]>
  ) => void;

  // SpelerDetail
  detailSpeler: SpelerData | null;
  detailTeamId: string | null;
  pinMap: Map<string, PinData>;
  onTogglePin: (spelerId: string, teamNaam: string, teamId: string) => void;
  onCloseDetail: () => void;
}

/** Alle dialogen en overlays die buiten de DndProvider-context staan. */
export default function EditorDialogs({
  werkindelingId,
  teams,
  showRanking,
  nieuwTeamOpen,
  onCloseNieuwTeam,
  onCreateTeam,
  rapportPinned,
  rapportOpen,
  validatieMap,
  dubbeleMeldingen,
  onCloseRapport,
  onToggleRapportPin,
  werkbordOpen,
  onCloseWerkbord,
  blauwdrukId,
  verdeelData,
  onCloseVerdeel,
  onVerdeelBevestig,
  detailSpeler,
  detailTeamId,
  pinMap,
  onTogglePin,
  onCloseDetail,
}: EditorDialogsProps) {
  return (
    <>
      <NieuwTeamDialoog open={nieuwTeamOpen} onClose={onCloseNieuwTeam} onSubmit={onCreateTeam} />

      {/* Niet-gepind ValidatieRapport (overlay) */}
      {!rapportPinned && rapportOpen && validatieMap && (
        <ValidatieRapport
          teams={teams}
          validatieMap={validatieMap}
          dubbeleMeldingen={dubbeleMeldingen}
          onClose={onCloseRapport}
          pinned={false}
          onTogglePin={onToggleRapportPin}
        />
      )}

      {/* Werkbord drawer (rechts, overlay) */}
      <Drawer
        open={werkbordOpen}
        onClose={onCloseWerkbord}
        side="right"
        width="w-96"
        title="Werkbord"
      >
        {blauwdrukId && (
          <ScenarioWerkbordPanel blauwdrukId={blauwdrukId} werkindelingId={werkindelingId} />
        )}
      </Drawer>

      {verdeelData && (
        <VerdeelDialoog
          open={true}
          onClose={onCloseVerdeel}
          selectieGroep={verdeelData.selectieGroep}
          teams={verdeelData.lidTeams}
          onBevestig={onVerdeelBevestig}
        />
      )}

      {detailSpeler && (
        <SpelerDetail
          speler={detailSpeler}
          teamId={detailTeamId ?? undefined}
          teamNaam={detailTeamId ? teams.find((t) => t.id === detailTeamId)?.naam : undefined}
          pin={pinMap.get(detailSpeler.id) ?? null}
          showRanking={showRanking}
          blauwdrukId={blauwdrukId ?? undefined}
          onTogglePin={onTogglePin}
          onClose={onCloseDetail}
        />
      )}
    </>
  );
}
