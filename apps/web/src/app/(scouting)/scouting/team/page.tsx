import { prisma } from "@/lib/scouting/db/prisma";
import { HUIDIG_SEIZOEN } from "@oranje-wit/types";
import { TeamGrid } from "./team-grid";

/**
 * Team kiezen pagina — /team
 *
 * Toont alle jeugdteams gegroepeerd per leeftijdsgroep.
 * Klik op een team navigeert naar de team-scouting wizard.
 */
export default async function TeamKiezenPage() {
  const teams = await (prisma.oWTeam as any).findMany({
    where: {
      seizoen: HUIDIG_SEIZOEN,
      NOT: { leeftijdsgroep: null },
    },
    orderBy: [{ sortOrder: "asc" }, { naam: "asc" }],
    select: {
      id: true,
      owCode: true,
      naam: true,
      categorie: true,
      kleur: true,
      leeftijdsgroep: true,
      spelvorm: true,
      isSelectie: true,
    },
  });

  // Groepeer per leeftijdsgroep
  const groepen: Record<string, typeof teams> = {};
  for (const team of teams) {
    const groep = team.leeftijdsgroep ?? "overig";
    if (!groepen[groep]) groepen[groep] = [];
    groepen[groep].push(team);
  }

  return (
    <div className="px-4 pt-6 pb-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Scout een team</h1>
        <p className="text-text-secondary mt-1 text-sm">
          Kies een team om alle spelers tegelijk te beoordelen
        </p>
      </header>

      <TeamGrid groepen={groepen} />
    </div>
  );
}
