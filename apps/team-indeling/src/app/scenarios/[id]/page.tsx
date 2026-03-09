import { getScenario, getAlleSpelers } from "../actions";
import { notFound } from "next/navigation";
import type { ScenarioData, SpelerData } from "@/components/scenario/types";
import ScenarioEditorFullscreen from "@/components/scenario/editor/ScenarioEditorFullscreen";

export const dynamic = "force-dynamic";

interface ScenarioPageProps {
  params: Promise<{ id: string }>;
}

export default async function ScenarioPage({ params }: ScenarioPageProps) {
  const { id } = await params;
  const scenario = await getScenario(id);
  if (!scenario) notFound();

  const alleSpelers = await getAlleSpelers();

  const initialMode =
    scenario.status === "DEFINITIEF" || scenario.status === "GEARCHIVEERD" ? "preview" : "edit";

  return (
    <ScenarioEditorFullscreen
      scenario={scenario as unknown as ScenarioData}
      alleSpelers={alleSpelers as unknown as SpelerData[]}
      initialMode={initialMode}
    />
  );
}
