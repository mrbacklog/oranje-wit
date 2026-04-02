"use client";

import type { ReactNode } from "react";
import Drawer from "./Drawer";
import ValidatieRapport from "../ValidatieRapport";
import type { TeamData } from "../types";
import type { TeamValidatie } from "@/lib/teamindeling/validatie/regels";

interface EditorSidebarsProps {
  poolPinned: boolean;
  showPoolDrawer: boolean;
  showEditDrawer: boolean;
  spelersPoolContent: ReactNode;
  teamEditContent: ReactNode;
  rapportPinned: boolean;
  rapportOpen: boolean;
  teams: TeamData[];
  validatieMap: Map<string, TeamValidatie> | null;
  dubbeleMeldingen: string[];
  onClosePool: () => void;
  onTogglePoolPin: () => void;
  onCloseEditTeam: () => void;
  onCloseRapport: () => void;
  onToggleRapportPin: () => void;
}

/** Alle gepinde + niet-gepinde sidebars en drawers rondom het werkgebied. */
export default function EditorSidebars({
  poolPinned,
  showPoolDrawer,
  showEditDrawer,
  spelersPoolContent,
  teamEditContent,
  rapportPinned,
  rapportOpen,
  teams,
  validatieMap,
  dubbeleMeldingen,
  onClosePool,
  onTogglePoolPin,
  onCloseEditTeam,
  onCloseRapport,
  onToggleRapportPin,
}: EditorSidebarsProps) {
  return (
    <>
      {/* Gepinde SpelersPool sidebar */}
      {poolPinned && showPoolDrawer && (
        <Drawer
          open={true}
          onClose={onClosePool}
          side="left"
          width="w-80"
          title="Spelerspool"
          pinnable
          pinned
          onTogglePin={onTogglePoolPin}
        >
          {spelersPoolContent}
        </Drawer>
      )}

      {/* Gepinde TeamEditPanel sidebar */}
      {poolPinned && showEditDrawer && (
        <Drawer
          open={true}
          onClose={onCloseEditTeam}
          side="left"
          width="w-80"
          title="Team bewerken"
          pinnable
          pinned
          onTogglePin={onTogglePoolPin}
        >
          {teamEditContent}
        </Drawer>
      )}

      {/* Gepind ValidatieRapport sidebar */}
      {rapportPinned && rapportOpen && validatieMap && (
        <ValidatieRapport
          teams={teams}
          validatieMap={validatieMap}
          dubbeleMeldingen={dubbeleMeldingen}
          onClose={onCloseRapport}
          pinned
          onTogglePin={onToggleRapportPin}
        />
      )}

      {/* Niet-gepinde SpelersPool drawer (links, overlay) */}
      {!poolPinned && (
        <Drawer
          open={showPoolDrawer}
          onClose={onClosePool}
          side="left"
          width="w-80"
          title="Spelerspool"
          pinnable
          pinned={false}
          onTogglePin={onTogglePoolPin}
        >
          {spelersPoolContent}
        </Drawer>
      )}

      {/* Niet-gepinde TeamEditPanel drawer (links, overlay, vervangt pool) */}
      {!poolPinned && (
        <Drawer open={showEditDrawer} onClose={onCloseEditTeam} side="left" width="w-80">
          {teamEditContent}
        </Drawer>
      )}
    </>
  );
}
