import { getScenario, getAlleSpelers, getPosities } from "../actions";
import { notFound } from "next/navigation";
import type { ScenarioData, SpelerData } from "@/components/teamindeling/scenario/types";
import type { PositionMap } from "@/components/teamindeling/scenario/hooks/useCardPositions";
import ScenarioEditorFullscreen from "@/components/teamindeling/scenario/editor/ScenarioEditorFullscreen";

export const dynamic = "force-dynamic";

interface ScenarioPageProps {
  params: Promise<{ id: string }>;
}

export default async function ScenarioPage({ params }: ScenarioPageProps) {
  const { id } = await params;
  const scenario = await getScenario(id);
  if (!scenario) notFound();

  const alleSpelers = await getAlleSpelers();

  const laatsteVersie = scenario.versies[0];
  const initialPosities = laatsteVersie ? await getPosities(laatsteVersie.id) : null;

  const initialMode =
    scenario.status === "DEFINITIEF" || scenario.status === "GEARCHIVEERD" ? "preview" : "edit";

  return (
    <ScenarioEditorFullscreen
      scenario={scenario as unknown as ScenarioData}
      alleSpelers={alleSpelers as unknown as SpelerData[]}
      initialMode={initialMode}
      initialPosities={initialPosities as PositionMap | null}
    />
  );
}
