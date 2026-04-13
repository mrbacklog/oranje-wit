export const dynamic = "force-dynamic";

import { getSpelersVoorStudio } from "../actions";
import { getReserveringenVoorStudio } from "../reserveringen-actions";
import SpelersOverzichtStudioWrapper from "../_components/SpelersOverzichtStudioWrapper";

export default async function PersonenSpelersPage() {
  const [spelers, reserveringen] = await Promise.all([
    getSpelersVoorStudio(),
    getReserveringenVoorStudio(),
  ]);
  return <SpelersOverzichtStudioWrapper spelers={spelers} reserveringen={reserveringen} />;
}
