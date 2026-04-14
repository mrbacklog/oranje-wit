export const dynamic = "force-dynamic";

import { getSpelersVoorStudio } from "../actions";
import { getReserveringenVoorStudio } from "../reserveringen-actions";
import { getSpelersPaginaContext } from "../speler-edit-actions";
import SpelersOverzichtStudioWrapper from "../_components/SpelersOverzichtStudioWrapper";

export default async function PersonenSpelersPage() {
  const [spelers, reserveringen, context] = await Promise.all([
    getSpelersVoorStudio(),
    getReserveringenVoorStudio(),
    getSpelersPaginaContext(),
  ]);
  return (
    <SpelersOverzichtStudioWrapper
      spelers={spelers}
      reserveringen={reserveringen}
      context={context}
    />
  );
}
