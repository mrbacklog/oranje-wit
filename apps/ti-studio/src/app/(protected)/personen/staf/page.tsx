export const dynamic = "force-dynamic";

import { getAlleStafVoorBeheer } from "../staf-actions";
import { StafOverzicht } from "../_components/StafOverzicht";
import { DaisyWidget } from "@/components";

export default async function PersonenStafPage() {
  const stafLeden = await getAlleStafVoorBeheer();
  return (
    <>
      <StafOverzicht stafLeden={stafLeden} />
      <DaisyWidget />
    </>
  );
}
