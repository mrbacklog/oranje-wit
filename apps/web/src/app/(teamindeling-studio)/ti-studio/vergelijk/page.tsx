export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

/**
 * Tijdelijke redirect: scenario-vergelijking → werkindeling-indeling.
 * Wordt in Task 4 omgezet naar een werkindeling-vergelijker.
 */
export default async function VergelijkPage() {
  redirect("/ti-studio/indeling");
}
