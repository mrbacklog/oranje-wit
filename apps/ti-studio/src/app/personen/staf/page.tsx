export const dynamic = "force-dynamic";

import { getStafVoorStudio } from "../staf-actions";
import { StafOverzicht } from "../_components/StafOverzicht";
import { DaisyWidget } from "@/components";

export default async function PersonenStafPage() {
  const stafLeden = await getStafVoorStudio();
  return (
    <>
      <StafOverzicht stafLeden={stafLeden} />
      <DaisyWidget />
    </>
  );
}
