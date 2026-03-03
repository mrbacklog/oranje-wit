import { KpiCard } from "@oranje-wit/ui";
import { InfoPageHeader } from "@/components/info/InfoPageHeader";
import { getSpelersOverzicht } from "@/lib/queries/spelers";
import { HUIDIG_SEIZOEN } from "@/lib/utils/seizoen";
import { SpelersZoeken } from "@/components/spelers/SpelersZoeken";

export default async function SpelersPage() {
  const seizoen = HUIDIG_SEIZOEN;
  const spelers = await getSpelersOverzicht(seizoen);

  const inTeam = spelers.filter((s) => s.status === "in_team");
  const reserves = spelers.filter((s) => s.status === "reserve");
  const historisch = spelers.filter((s) => s.status === "historisch");
  const mannenTeam = inTeam.filter((s) => s.geslacht === "M").length;
  const vrouwenTeam = inTeam.filter((s) => s.geslacht === "V").length;

  return (
    <>
      <InfoPageHeader title="Spelers" subtitle={`Seizoen ${seizoen}`} infoTitle="Over Spelers">
        <div className="space-y-4">
          <section>
            <h4 className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase">
              Wat zie je?
            </h4>
            <p>
              Spelers in een competitieteam, bondsleden zonder team (algemene reserves) en
              verenigingsleden (recreanten, kangoeroes). Via het filter kun je ook historische
              spelers bekijken.
            </p>
          </section>
          <section>
            <h4 className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase">
              Zoeken &amp; filteren
            </h4>
            <p>Typ een naam om direct te filteren. Gebruik de dropdowns voor geslacht en status.</p>
          </section>
          <section>
            <h4 className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase">
              Doorklikken
            </h4>
            <p>
              <strong>Klik op een speler</strong> voor het volledige profiel met seizoensoverzicht
              en teamhistorie.
            </p>
          </section>
        </div>
      </InfoPageHeader>

      {/* KPI-kaarten */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard
          label="Spelende leden"
          value={inTeam.length}
          subtitle={`♂ ${mannenTeam} / ♀ ${vrouwenTeam}`}
        />
        <KpiCard
          label="Algemeen Reserves"
          value={reserves.length}
          subtitle="Bondslid, nu geen team"
        />
        <KpiCard label="Ooit actief" value={historisch.length} subtitle="Niet meer in team" />
      </div>

      <SpelersZoeken spelers={spelers} />
    </>
  );
}
