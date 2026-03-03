import { getScenario, getAlleSpelers } from "../actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { ScenarioData, SpelerData } from "@/components/scenario/types";
import MaakDefinitiefKnop from "@/components/scenario/MaakDefinitiefKnop";
import ScenarioView from "@/components/scenario/view/ScenarioView";
import ScenarioEditorFullscreen from "@/components/scenario/editor/ScenarioEditorFullscreen";

export const dynamic = "force-dynamic";

interface ScenarioEditorPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string }>;
}

export default async function ScenarioEditorPage({
  params,
  searchParams,
}: ScenarioEditorPageProps) {
  const { id } = await params;
  const { mode } = await searchParams;
  const isEditMode = mode === "edit";

  const scenario = await getScenario(id);
  if (!scenario) notFound();

  // Laad alleSpelers alleen bij edit mode (performance)
  const alleSpelers = isEditMode ? await getAlleSpelers() : [];

  // --- Fullscreen Editor ---
  if (isEditMode) {
    return (
      <ScenarioEditorFullscreen
        scenario={scenario as unknown as ScenarioData}
        alleSpelers={alleSpelers as unknown as SpelerData[]}
      />
    );
  }

  // --- View Mode ---
  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <Link
          href="/scenarios"
          className="mb-2 inline-block text-sm text-orange-600 hover:text-orange-700"
        >
          &larr; Terug naar scenario&apos;s
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{scenario.naam}</h2>
            {scenario.toelichting && (
              <p className="mt-1 text-sm text-gray-500">{scenario.toelichting}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {scenario.status !== "DEFINITIEF" && scenario.status !== "GEARCHIVEERD" && (
              <>
                <Link href={`/scenarios/${scenario.id}?mode=edit`} className="btn-primary gap-1.5">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                  Bewerken
                </Link>
                <MaakDefinitiefKnop scenarioId={scenario.id} />
              </>
            )}
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                scenario.status === "DEFINITIEF"
                  ? "bg-green-100 text-green-700"
                  : scenario.status === "GEARCHIVEERD"
                    ? "bg-gray-100 text-gray-500"
                    : "bg-orange-100 text-orange-700"
              }`}
            >
              {scenario.status === "DEFINITIEF"
                ? "Definitief"
                : scenario.status === "GEARCHIVEERD"
                  ? "Gearchiveerd"
                  : "Actief"}
            </span>
          </div>
        </div>
      </div>

      {/* Read-only scenario view */}
      <ScenarioView scenario={scenario as unknown as ScenarioData} />
    </div>
  );
}
