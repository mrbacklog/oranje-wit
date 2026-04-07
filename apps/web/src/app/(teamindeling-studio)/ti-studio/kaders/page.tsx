import {
  getBlauwdruk,
  getLedenStatistieken,
  getPinsVoorKaders,
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
import type {
  SelectieVoorkeur,
  TeamaantallenVoorkeur,
} from "@/app/(teamindeling-studio)/ti-studio/blauwdruk/actions";

import KadersKnkvLaag from "./_components/KadersKnkvLaag";
import KadersSelectieStructuur from "./_components/KadersSelectieStructuur";
import KadersTeamsamenstelling from "./_components/KadersTeamsamenstelling";
import KadersPinsLaag from "./_components/KadersPinsLaag";
import KadersDaisyWrapper from "./_components/KadersDaisyWrapper";

export const dynamic = "force-dynamic";

export default async function KadersPage() {
  // Stap 1: haal kaders en seizoen op (werkseizoen als primaire bron)
  const kaderRecord = await prisma.kaders.findFirst({
    where: { isWerkseizoen: true },
    select: { id: true, seizoen: true, kaders: true, speerpunten: true, toelichting: true },
  });

  // Fallback naar cookie-gebaseerde lookup
  const seizoen = kaderRecord?.seizoen ?? (await getActiefSeizoen());
  const kaders = kaderRecord ?? (await getBlauwdruk(seizoen));
  const vorigSzn = vorigSeizoen(seizoen);

  // Stap 2: alle afhankelijke queries parallel
  const [
    besluitRecords,
    besluitStats,
    gezienVoortgang,
    statistieken,
    pins,
    beschikbareTeams,
    referentieTeams,
    evaluatieRondes,
  ] = await Promise.all([
    getBesluiten(kaders.id),
    getBesluitStats(kaders.id),
    getGezienVoortgang(kaders.id),
    getLedenStatistieken(),
    getPinsVoorKaders(kaders.id),
    prisma.oWTeam.findMany({
      where: { seizoen, teamType: { in: ["SELECTIE", "SENIOREN"] } },
      select: { naam: true, kleur: true },
      orderBy: { naam: "asc" },
    }),
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

  const categorieKaders = (kaders.kaders ?? {}) as CategorieKaders;
  const kadersJson = (kaders.kaders ?? {}) as Record<string, unknown>;

  // Extraheer Laag 2-data uit het kaders-JSON veld
  const initieleSelecties: SelectieVoorkeur[] = Array.isArray(kadersJson.selecties)
    ? (kadersJson.selecties as SelectieVoorkeur[])
    : [];
  const initieleAantallen: Record<string, TeamaantallenVoorkeur> =
    kadersJson.teamaantallen && typeof kadersJson.teamaantallen === "object"
      ? (kadersJson.teamaantallen as Record<string, TeamaantallenVoorkeur>)
      : {};

  return (
    <div className="space-y-6">
      {/* Page-header */}
      <div>
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Kaders
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Seizoensbesluiten en teamstructuur voor seizoen {seizoen}
        </p>
      </div>

      {/* Voortgang & besluiten (bestaande functionaliteit) */}
      <BlauwdrukVoortgang besluitStats={besluitStats} gezienVoortgang={gezienVoortgang} />

      <BesluitenOverzicht
        kadersId={kaders.id}
        initialBesluiten={besluitRecords}
        initialStats={besluitStats}
      />

      {/* Bestaande CategoriePanel */}
      <div>
        <h3
          className="mb-3 text-sm font-semibold tracking-wider uppercase"
          style={{ color: "var(--text-tertiary)" }}
        >
          Teamstructuur
        </h3>
        <CategoriePanel statistieken={statistieken} kaders={categorieKaders} kadersId={kaders.id} />
      </div>

      {/* LAAG 1 — KNKV Reglementen */}
      <KadersKnkvLaag kadersJson={kadersJson} />

      {/* LAAG 2 — OW Voorkeuren TC */}
      <section
        style={{
          background: "var(--surface-card)",
          borderRadius: 12,
          border: "1px solid var(--border-default)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 20px",
            borderBottom: "1px solid var(--border-default)",
          }}
        >
          <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 14, flex: 1 }}>
            Laag 2 — OW Voorkeuren TC
          </span>
          <span
            style={{
              background: "rgba(250,204,21,0.15)",
              color: "#fbbf24",
              border: "1px solid rgba(250,204,21,0.3)",
              borderRadius: 6,
              padding: "2px 10px",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.05em",
            }}
          >
            STABIEL
          </span>
        </div>

        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
          <KadersSelectieStructuur
            kadersId={kaders.id}
            initieleSelecties={initieleSelecties}
            beschikbareTeams={beschikbareTeams}
          />
          <KadersTeamsamenstelling kadersId={kaders.id} initieleAantallen={initieleAantallen} />
        </div>
      </section>

      {/* LAAG 3 — Pins & Reserveringen */}
      <KadersPinsLaag kadersId={kaders.id} initialPins={pins} />

      {/* Uitgangspositie (voormalige KadersTeamsClient-sectie) */}
      <div>
        <h3
          className="mb-3 text-sm font-semibold tracking-wider uppercase"
          style={{ color: "var(--text-tertiary)" }}
        >
          Uitgangspositie
        </h3>
        {/* Dynamische import zodat UitgangspositiePanel client-only blijft */}
        <KadersUitgangspositieWrapper
          referentieTeams={referentieTeams}
          seizoen={seizoen}
          evaluatieRondes={evaluatieRondes}
        />
      </div>

      {/* Daisy AI-widget */}
      <KadersDaisyWrapper />
    </div>
  );
}

// ============================================================
// Server-side wrapper voor de client UitgangspositiePanel
// Dit voorkomt een aparte _components file voor een simpele doorgave
// ============================================================

import UitgangspositiePanel from "@/components/teamindeling/blauwdruk/UitgangspositiePanel";
import type {
  ReferentieTeamData,
  EvaluatieRondeData,
} from "@/components/teamindeling/blauwdruk/UitgangspositiePanel";

function KadersUitgangspositieWrapper({
  referentieTeams,
  seizoen,
  evaluatieRondes,
}: {
  referentieTeams: ReferentieTeamData[];
  seizoen: string;
  evaluatieRondes: EvaluatieRondeData[];
}) {
  return (
    <UitgangspositiePanel
      initialTeams={referentieTeams}
      seizoen={seizoen}
      evaluatieRondes={evaluatieRondes}
    />
  );
}
