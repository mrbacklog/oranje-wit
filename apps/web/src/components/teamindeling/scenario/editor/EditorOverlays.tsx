"use client";

import { logger } from "@oranje-wit/types";
import type { ScenarioData, TeamData } from "../types";
import type { TeamValidatie } from "@/lib/teamindeling/validatie/regels";
import type { useScenarioEditor } from "../hooks/useScenarioEditor";
import type { useWhatIf } from "../hooks/useWhatIf";
import type { VersieRij } from "@/components/teamindeling/werkindeling/VersiesDrawer";
import { SpelerProfielDialog, TeamoverzichtDialog, DaisyWidget } from "@/components/ti-studio";
import EditorDialogs from "./EditorDialogs";
import WhatIfSidebar from "./WhatIfSidebar";
import WhatIfStartDialoog from "./WhatIfStartDialoog";
import VersiesDrawer from "@/components/teamindeling/werkindeling/VersiesDrawer";

interface EditorOverlaysProps {
  scenario: ScenarioData;
  editor: ReturnType<typeof useScenarioEditor>;
  whatIf: ReturnType<typeof useWhatIf>;
  versieRijen: VersieRij[];
  gebruikerEmail: string;
  showRanking: boolean;
  // Overlay open/close states
  nieuwTeamOpen: boolean;
  rapportOpen: boolean;
  rapportPinned: boolean;
  werkbordOpen: boolean;
  whatIfOpen: boolean;
  whatIfDialoogOpen: boolean;
  versiesOpen: boolean;
  spelerProfielId: string | null;
  teamOverzichtTeam: TeamData | null;
  // Setters
  onCloseNieuwTeam: () => void;
  onCloseRapport: () => void;
  onToggleRapportPin: () => void;
  onCloseWerkbord: () => void;
  onCloseWhatIf: () => void;
  onOpenWhatIfNieuw: () => void;
  onOpenWhatIf: () => void;
  onCloseWhatIfDialoog: () => void;
  onCloseVersies: () => void;
  onCloseSpelerProfiel: () => void;
  onCloseTeamOverzicht: () => void;
}

export default function EditorOverlays({
  scenario,
  editor,
  whatIf,
  versieRijen,
  gebruikerEmail,
  showRanking,
  nieuwTeamOpen,
  rapportOpen,
  rapportPinned,
  werkbordOpen,
  whatIfOpen,
  whatIfDialoogOpen,
  versiesOpen,
  spelerProfielId,
  teamOverzichtTeam,
  onCloseNieuwTeam,
  onCloseRapport,
  onToggleRapportPin,
  onCloseWerkbord,
  onCloseWhatIf,
  onOpenWhatIfNieuw,
  onOpenWhatIf,
  onCloseWhatIfDialoog,
  onCloseVersies,
  onCloseSpelerProfiel,
  onCloseTeamOverzicht,
}: EditorOverlaysProps) {
  return (
    <>
      <EditorDialogs
        werkindelingId={scenario.id}
        teams={editor.teams}
        showRanking={showRanking}
        nieuwTeamOpen={nieuwTeamOpen}
        onCloseNieuwTeam={onCloseNieuwTeam}
        onCreateTeam={editor.handleCreateTeam}
        rapportPinned={rapportPinned}
        rapportOpen={rapportOpen}
        validatieMap={editor.validatieMap}
        dubbeleMeldingen={editor.dubbeleMeldingen ?? []}
        onCloseRapport={onCloseRapport}
        onToggleRapportPin={onToggleRapportPin}
        werkbordOpen={werkbordOpen}
        onCloseWerkbord={onCloseWerkbord}
        kadersId={editor.kadersId}
        verdeelData={editor.verdeelData}
        onCloseVerdeel={() => editor.setVerdeelData(null)}
        onVerdeelBevestig={editor.handleVerdeelBevestig}
        detailSpeler={editor.detailSpeler}
        detailTeamId={editor.detailTeamId}
        pinMap={editor.pinMap}
        onTogglePin={editor.handleTogglePin}
        onCloseDetail={() => {
          editor.setDetailSpeler(null);
          editor.setDetailTeamId(null);
        }}
      />

      <WhatIfSidebar
        open={whatIfOpen}
        werkindelingId={scenario.id}
        panelKey={whatIf.whatIfPanelKey}
        activeWhatIfId={whatIf.activeWhatIfId}
        onClose={onCloseWhatIf}
        onNieuw={onOpenWhatIfNieuw}
        onActiveer={whatIf.handleActiveerWhatIf}
      />

      <WhatIfStartDialoog
        open={whatIfDialoogOpen}
        werkindelingId={scenario.id}
        teams={editor.teams}
        onClose={onCloseWhatIfDialoog}
        onCreated={onOpenWhatIf}
      />

      <VersiesDrawer
        open={versiesOpen}
        versies={versieRijen}
        gebruikerEmail={gebruikerEmail}
        onClose={onCloseVersies}
      />

      <SpelerProfielDialog
        spelerId={spelerProfielId}
        open={!!spelerProfielId}
        onClose={onCloseSpelerProfiel}
      />

      <TeamoverzichtDialog
        team={teamOverzichtTeam}
        open={!!teamOverzichtTeam}
        onClose={onCloseTeamOverzicht}
        onSpelerVerwijderd={(spelerId, teamId) => {
          logger.info("Speler verwijderd uit team via overzicht:", { spelerId, teamId });
        }}
      />

      <DaisyWidget />
    </>
  );
}
