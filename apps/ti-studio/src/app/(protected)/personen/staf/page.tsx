export const dynamic = "force-dynamic";

import { getAlleStafVoorBeheer, getDoelenVoorStafKoppeling } from "../staf-actions";
import { StafOverzicht } from "../_components/StafOverzicht";
import { DaisyWidget } from "@/components";

export default async function PersonenStafPage() {
  const [stafLeden, doelen] = await Promise.all([
    getAlleStafVoorBeheer(),
    getDoelenVoorStafKoppeling(),
  ]);
  return (
    <>
      <StafOverzicht stafLeden={stafLeden} alleDoelen={doelen} />
      <DaisyWidget />
    </>
  );
}
