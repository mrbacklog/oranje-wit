import {
  getBlauwdruk,
  getLedenStatistieken,
  getPinsVoorBlauwdruk,
} from "@/app/(teamindeling-studio)/ti-studio/blauwdruk/actions";
import {
  getBesluiten,
  getBesluitStats,
} from "@/app/(teamindeling-studio)/ti-studio/blauwdruk/besluit-actions";
import { getGezienVoortgang } from "@/app/(teamindeling-studio)/ti-studio/blauwdruk/gezien-actions";
import BesluitenOverzicht from "@/components/teamindeling/blauwdruk/BesluitenOverzicht";
import BlauwdrukVoortgang from "@/components/teamindeling/blauwdruk/BlauwdrukVoortgang";
import CategoriePanel from "@/components/teamindeling/blauwdruk/CategoriePanel";
import { getActiefSeizoen, vorigSeizoen } from "@/lib/teamindeling/seizoen";
import { prisma } from "@/lib/teamindeling/db/prisma";
import type { CategorieKaders } from "@/app/(teamindeling-studio)/ti-studio/blauwdruk/categorie-kaders";
import KadersTeamsClient from "./_components/KadersTeamsClient";

export const dynamic = "force-dynamic";

export default async function KadersPage() {
  const seizoen = await getActiefSeizoen();
  const blauwdruk = await getBlauwdruk(seizoen);
  const vorigSzn = vorigSeizoen(seizoen);

  const [
    besluitRecords,
    besluitStats,
    gezienVoortgang,
    statistieken,
    pins,
    referentieTeams,
    evaluatieRondes,
  ] = await Promise.all([
    getBesluiten(blauwdruk.id),
    getBesluitStats(blauwdruk.id),
    getGezienVoortgang(blauwdruk.id),
    getLedenStatistieken(),
    getPinsVoorBlauwdruk(blauwdruk.id),
    prisma.referentieTeam.findMany({
      where: { seizoen: vorigSzn },
      select: {
        id: true,
        naam: true,
        seizoen: true,
        teamType: true,
        niveau: true,
        poolVeld: true,
        teamscore: true,
        spelerIds: true,
      },
      orderBy: { naam: "asc" },
    }),
    prisma.evaluatieRonde.findMany({
      where: { seizoen: vorigSzn, type: "trainer" },
      orderBy: { ronde: "asc" },
      select: { id: true, seizoen: true, ronde: true, naam: true, status: true },
    }),
  ]);

  const kaders = (blauwdruk.kaders ?? {}) as CategorieKaders;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Kaders
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Seizoensbesluiten en teamstructuur voor seizoen {seizoen}
        </p>
      </div>

      <BlauwdrukVoortgang
        besluitStats={besluitStats}
        gezienVoortgang={gezienVoortgang}
        onNavigeerNaarTab={() => {}}
      />

      <BesluitenOverzicht
        blauwdrukId={blauwdruk.id}
        initialBesluiten={besluitRecords}
        initialStats={besluitStats}
      />

      <div>
        <h3
          className="mb-3 text-sm font-semibold tracking-wider uppercase"
          style={{ color: "var(--text-tertiary)" }}
        >
          Teamstructuur
        </h3>
        <CategoriePanel statistieken={statistieken} kaders={kaders} blauwdrukId={blauwdruk.id} />
      </div>

      <KadersTeamsClient
        blauwdrukId={blauwdruk.id}
        initialPins={pins}
        referentieTeams={referentieTeams}
        seizoen={seizoen}
        evaluatieRondes={evaluatieRondes}
      />
    </div>
  );
}
