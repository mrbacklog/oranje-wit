import { getScenario, getAlleSpelers } from "../actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import ScenarioEditor from "@/components/scenario/ScenarioEditor";
import MaakDefinitiefKnop from "@/components/scenario/MaakDefinitiefKnop";
import type { ScenarioData, SpelerData } from "@/components/scenario/types";

export const dynamic = "force-dynamic";

interface ScenarioEditorPageProps {
  params: Promise<{ id: string }>;
}

export default async function ScenarioEditorPage({
  params,
}: ScenarioEditorPageProps) {
  const { id } = await params;
  const [scenario, alleSpelers] = await Promise.all([
    getScenario(id),
    getAlleSpelers(),
  ]);

  if (!scenario) {
    notFound();
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <Link
          href="/scenarios"
          className="text-sm text-orange-600 hover:text-orange-700 mb-2 inline-block"
        >
          &larr; Terug naar scenario&apos;s
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {scenario.naam}
            </h2>
            {scenario.toelichting && (
              <p className="mt-1 text-sm text-gray-500">
                {scenario.toelichting}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {scenario.status !== "DEFINITIEF" &&
              scenario.status !== "GEARCHIVEERD" && (
                <MaakDefinitiefKnop scenarioId={scenario.id} />
              )}
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
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

      {/* Drieluik */}
      <ScenarioEditor
        scenario={scenario as unknown as ScenarioData}
        alleSpelers={alleSpelers as unknown as SpelerData[]}
      />
    </div>
  );
}
