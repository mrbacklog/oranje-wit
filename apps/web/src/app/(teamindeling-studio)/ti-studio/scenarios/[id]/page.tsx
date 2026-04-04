export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

/**
 * Tijdelijke redirect: scenario-detail pagina → werkindeling editor.
 * Wordt in Task 4 vervangen door de werkindeling-editor.
 */
interface ScenarioPageProps {
  params: Promise<{ id: string }>;
}

export default async function ScenarioPage({ params: _ }: ScenarioPageProps) {
  redirect("/ti-studio/indeling");
}
