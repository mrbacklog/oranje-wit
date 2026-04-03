"use client";

import { useState, useCallback } from "react";
import { logger } from "@oranje-wit/types";
import type { WhatIfZone } from "../Werkgebied";
import { berekenWhatIfImpact } from "@/app/(teamindeling-studio)/ti-studio/indeling/whatif-impact-actions";
import {
  pasWhatIfToe,
  verwerpWhatIf,
} from "@/app/(teamindeling-studio)/ti-studio/indeling/whatif-resolve-actions";
import { getWhatIf } from "@/app/(teamindeling-studio)/ti-studio/indeling/whatif-actions";
import { valideerWhatIfVoorToepassen } from "@/app/(teamindeling-studio)/ti-studio/indeling/whatif-validatie-actions";
import type { TeamData } from "../types";

interface UseWhatIfProps {
  teams: TeamData[];
  onRefreshTeams: () => void;
}

export function useWhatIf({ teams, onRefreshTeams }: UseWhatIfProps) {
  const [activeWhatIfId, setActiveWhatIfId] = useState<string | null>(null);
  const [activeWhatIfVraag, setActiveWhatIfVraag] = useState<string>("");
  const [whatIfZones, setWhatIfZones] = useState<Map<string, WhatIfZone> | null>(null);
  const [whatIfHeeftHardefouten, setWhatIfHeeftHardefouten] = useState(false);
  const [whatIfBezig, setWhatIfBezig] = useState(false);
  const [whatIfPanelKey, setWhatIfPanelKey] = useState(0);

  const handleActiveerWhatIf = useCallback(
    async (whatIfId: string) => {
      setWhatIfBezig(true);
      try {
        const [whatIf, impact, validatie] = await Promise.all([
          getWhatIf(whatIfId),
          berekenWhatIfImpact(whatIfId),
          valideerWhatIfVoorToepassen(whatIfId),
        ]);

        if (!whatIf) {
          logger.warn("What-if niet gevonden:", whatIfId);
          return;
        }

        const zones = new Map<string, WhatIfZone>();
        const actieveTeamIds = new Set(
          whatIf.teams
            .map((t: { bronTeamId: string | null }) => t.bronTeamId)
            .filter(Boolean) as string[]
        );
        const impactTeamIds = new Set(
          impact.impactTeams.map((t) => t.bronTeamId).filter(Boolean) as string[]
        );

        for (const team of teams) {
          if (actieveTeamIds.has(team.id)) {
            zones.set(team.id, "actief");
          } else if (impactTeamIds.has(team.id)) {
            zones.set(team.id, "impact");
          } else {
            zones.set(team.id, "ongeraakt");
          }
        }

        setActiveWhatIfId(whatIfId);
        setActiveWhatIfVraag(whatIf.vraag);
        setWhatIfZones(zones);
        setWhatIfHeeftHardefouten(validatie.heeftHardefouten);
      } catch (error) {
        logger.warn("Fout bij activeren what-if:", error);
      } finally {
        setWhatIfBezig(false);
      }
    },
    [teams]
  );

  const handleVerlaatWhatIf = useCallback(() => {
    setActiveWhatIfId(null);
    setActiveWhatIfVraag("");
    setWhatIfZones(null);
    setWhatIfHeeftHardefouten(false);
  }, []);

  const handleToepassenWhatIf = useCallback(async () => {
    if (!activeWhatIfId) return;
    setWhatIfBezig(true);
    try {
      await pasWhatIfToe(activeWhatIfId);
      handleVerlaatWhatIf();
      setWhatIfPanelKey((k) => k + 1);
      onRefreshTeams();
    } catch (error) {
      logger.warn("Toepassen what-if mislukt:", error);
    } finally {
      setWhatIfBezig(false);
    }
  }, [activeWhatIfId, handleVerlaatWhatIf, onRefreshTeams]);

  const handleVerwerpWhatIf = useCallback(async () => {
    if (!activeWhatIfId) return;
    setWhatIfBezig(true);
    try {
      await verwerpWhatIf(activeWhatIfId);
      handleVerlaatWhatIf();
      setWhatIfPanelKey((k) => k + 1);
    } catch (error) {
      logger.warn("Verwerpen what-if mislukt:", error);
    } finally {
      setWhatIfBezig(false);
    }
  }, [activeWhatIfId, handleVerlaatWhatIf]);

  return {
    activeWhatIfId,
    activeWhatIfVraag,
    whatIfZones,
    whatIfHeeftHardefouten,
    whatIfBezig,
    whatIfPanelKey,
    isWhatIfModus: !!activeWhatIfId,
    handleActiveerWhatIf,
    handleVerlaatWhatIf,
    handleToepassenWhatIf,
    handleVerwerpWhatIf,
  };
}
