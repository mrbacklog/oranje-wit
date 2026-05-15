import { requireTC } from "@oranje-wit/auth/checks";
import {
  haalActieveWerkindeling,
  haalVersieData,
  haalPoolSpelers,
  haalAlleStaf,
} from "./_data/queries";
import { WerkbordShell } from "./_components/WerkbordShell";

interface IndelingPageProps {
  searchParams: Promise<{ versieId?: string }>;
}

export default async function IndelingPage({ searchParams }: IndelingPageProps) {
  await requireTC();

  const params = await searchParams;

  const wiData = await haalActieveWerkindeling();
  if (!wiData) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-3)",
          fontSize: 14,
        }}
      >
        Geen actieve werkindeling gevonden. Maak een Kaders-record aan als werkseizoen.
      </div>
    );
  }

  const { werkindeling, versies, kadersId, seizoen, aanbevolenVersieId } = wiData;

  // Bepaal actieve versie: via query-param of versie met meeste teams
  const actieveVersieId = params.versieId ?? aanbevolenVersieId ?? versies[0]?.id;
  if (!actieveVersieId) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-3)",
          fontSize: 14,
        }}
      >
        Geen versies gevonden voor deze werkindeling.
      </div>
    );
  }

  const versieData = await haalVersieData(actieveVersieId, seizoen);
  if (!versieData) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-3)",
          fontSize: 14,
        }}
      >
        Versie niet gevonden.
      </div>
    );
  }

  const [allSpelers, allStaf] = await Promise.all([
    haalPoolSpelers(kadersId, versieData),
    haalAlleStaf(versieData),
  ]);

  // Stats
  const ingedeeldCount = allSpelers.filter((s) => s.ingedeeldTeamId !== null).length;
  const totaalCount = allSpelers.length;

  const actieveVersieMeta = versies.find((v) => v.id === actieveVersieId) ?? versies[0];

  return (
    <WerkbordShell
      werkindeling={werkindeling}
      versies={versies}
      actieveVersie={versieData}
      actieveVersieMeta={actieveVersieMeta}
      allSpelers={allSpelers}
      allStaf={allStaf}
      statsIngedeeld={ingedeeldCount}
      statsTotaal={totaalCount}
    />
  );
}
