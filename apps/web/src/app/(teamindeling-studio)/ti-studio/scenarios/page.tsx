export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

/**
 * Tijdelijke redirect: scenarios-overzicht → werkindeling-indeling.
 * Wordt in Task 4 vervangen door het werkindeling-overzicht.
 */
export default async function ScenariosPage() {
  redirect("/ti-studio/indeling");
}
