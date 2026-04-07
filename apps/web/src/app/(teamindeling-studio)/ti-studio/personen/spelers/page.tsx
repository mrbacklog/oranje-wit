export const dynamic = "force-dynamic";

import { getSpelersVoorStudio } from "../actions";
import SpelersOverzichtStudioWrapper from "../_components/SpelersOverzichtStudioWrapper";

export default async function PersonenSpelersPage() {
  const spelers = await getSpelersVoorStudio();
  return <SpelersOverzichtStudioWrapper spelers={spelers} />;
}
