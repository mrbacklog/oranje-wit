export const dynamic = "force-dynamic";

import { getAlleStafVoorBeheer, getTeamsVoorStafKoppeling } from "../staf-actions";
import { StafOverzicht } from "../_components/StafOverzicht";
import { DaisyWidget } from "@/components";

export default async function PersonenStafPage() {
  const [stafLeden, teams] = await Promise.all([
    getAlleStafVoorBeheer(),
    getTeamsVoorStafKoppeling(),
  ]);
  return (
    <>
      <StafOverzicht stafLeden={stafLeden} alleTeams={teams} />
      <DaisyWidget />
    </>
  );
}
