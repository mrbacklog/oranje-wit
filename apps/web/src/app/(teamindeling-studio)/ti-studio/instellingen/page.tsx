import { isAdmin, getMijlpalen, getImportHistorie, getAlleSeizoenen } from "./actions";
import { SeizoenBeheer } from "@/components/teamindeling/instellingen/SeizoenBeheer";
import { MijlpaalBeheer } from "@/components/teamindeling/instellingen/MijlpaalBeheer";
import { ImportBeheer } from "@/components/teamindeling/instellingen/ImportBeheer";

export const dynamic = "force-dynamic";

export default async function InstellingenPage() {
  const [admin, mijlpalen, imports, seizoenen] = await Promise.all([
    isAdmin(),
    getMijlpalen(),
    getImportHistorie(),
    getAlleSeizoenen(),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-900">Instellingen</h1>
      <div className="space-y-8">
        {admin && <SeizoenBeheer seizoenen={seizoenen} />}
        <MijlpaalBeheer mijlpalen={mijlpalen} />
        <ImportBeheer imports={imports} />
      </div>
    </div>
  );
}
