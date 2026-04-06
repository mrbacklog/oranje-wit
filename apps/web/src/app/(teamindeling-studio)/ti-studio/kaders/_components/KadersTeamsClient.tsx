"use client";

import { useState, useCallback, useTransition } from "react";
import { deletePin } from "@/app/(teamindeling-studio)/ti-studio/pins/actions";
import PinsOverzicht from "@/components/teamindeling/blauwdruk/PinsOverzicht";
import UitgangspositiePanel from "@/components/teamindeling/blauwdruk/UitgangspositiePanel";
import type { PinMetNamen } from "@/app/(teamindeling-studio)/ti-studio/blauwdruk/actions";
import type {
  ReferentieTeamData,
  EvaluatieRondeData,
} from "@/components/teamindeling/blauwdruk/UitgangspositiePanel";

interface KadersTeamsClientProps {
  kadersId: string;
  initialPins: PinMetNamen[];
  referentieTeams: ReferentieTeamData[];
  seizoen: string;
  evaluatieRondes: EvaluatieRondeData[];
}

export default function KadersTeamsClient({
  kadersId: _kadersId,
  initialPins,
  referentieTeams,
  seizoen,
  evaluatieRondes,
}: KadersTeamsClientProps) {
  const [localPins, setLocalPins] = useState(initialPins);
  const [, startTransition] = useTransition();

  const handleDeletePin = useCallback((pinId: string) => {
    setLocalPins((prev) => prev.filter((p) => p.id !== pinId));
    startTransition(() => {
      deletePin(pinId);
    });
  }, []);

  return (
    <div className="space-y-8">
      {localPins.length > 0 && (
        <div>
          <h3
            className="mb-3 text-sm font-semibold tracking-wider uppercase"
            style={{ color: "var(--text-tertiary)" }}
          >
            Pins
          </h3>
          <PinsOverzicht pins={localPins} onDeletePin={handleDeletePin} />
        </div>
      )}

      <div>
        <h3
          className="mb-3 text-sm font-semibold tracking-wider uppercase"
          style={{ color: "var(--text-tertiary)" }}
        >
          Uitgangspositie
        </h3>
        <UitgangspositiePanel
          initialTeams={referentieTeams}
          seizoen={seizoen}
          evaluatieRondes={evaluatieRondes}
        />
      </div>
    </div>
  );
}
