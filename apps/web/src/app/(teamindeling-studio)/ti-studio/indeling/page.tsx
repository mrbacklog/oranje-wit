export const dynamic = "force-dynamic";

import { getOfMaakWerkindelingVoorSeizoen } from "./actions";
import { getWerkindelingVoorEditor, getAlleSpelers, getPosities } from "./werkindeling-actions";
import ScenarioEditorFullscreen from "@/components/teamindeling/scenario/editor/ScenarioEditorFullscreen";

export default async function IndelingPage() {
  const werkindeling = await getOfMaakWerkindelingVoorSeizoen("systeem");

  if (!werkindeling) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Geen actief seizoen gevonden. Maak eerst een seizoen aan via Beheer.
        </p>
      </div>
    );
  }

  const volledig = await getWerkindelingVoorEditor(werkindeling.id);
  if (!volledig) return null;

  const alleSpelers = await getAlleSpelers();
  const laatsteVersie = volledig.versies[0];
  const initialPosities = laatsteVersie ? await getPosities(laatsteVersie.id) : null;

  return (
    <ScenarioEditorFullscreen
      scenario={volledig as any}
      alleSpelers={alleSpelers as any}
      initialMode="edit"
      initialPosities={initialPosities as any}
    />
  );
}
