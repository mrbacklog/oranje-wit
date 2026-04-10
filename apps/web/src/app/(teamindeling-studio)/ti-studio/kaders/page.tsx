import { getPinsVoorKaders } from "@/app/(teamindeling-studio)/ti-studio/blauwdruk/actions";
import { getActiefSeizoen } from "@/lib/teamindeling/seizoen";
import { prisma } from "@/lib/teamindeling/db/prisma";
import type {
  SelectieVoorkeur,
  TeamaantallenVoorkeur,
} from "@/app/(teamindeling-studio)/ti-studio/blauwdruk/actions";

import KadersKnkvLaag from "./_components/KadersKnkvLaag";
import KadersSelectieStructuur from "./_components/KadersSelectieStructuur";
import KadersTeamsamenstelling from "./_components/KadersTeamsamenstelling";
import KadersPinsLaag from "./_components/KadersPinsLaag";
import KadersDaisyWrapper from "./_components/KadersDaisyWrapper";
import KadersMemosClient, { type KadersMemosData } from "./_components/KadersMemosClient";

export const dynamic = "force-dynamic";

export default async function KadersPage() {
  const kaderRecord = await prisma.kaders.findFirst({
    where: { isWerkseizoen: true },
    select: { id: true, seizoen: true, kaders: true },
  });

  const seizoen = kaderRecord?.seizoen ?? (await getActiefSeizoen());
  const kaders = kaderRecord ?? { id: "", seizoen, kaders: null };

  const [pins, beschikbareTeams, spelersHuidig] = await Promise.all([
    getPinsVoorKaders(kaders.id),
    prisma.oWTeam.findMany({
      where: { seizoen },
      select: { naam: true, kleur: true, teamType: true },
      orderBy: { naam: "asc" },
    }),
    prisma.speler.findMany({
      select: { geslacht: true, huidig: true },
    }),
  ]);

  // Speler-aantallen per team
  const teamTotalen: Record<string, { v: number; m: number; totaal: number }> = {};
  for (const sp of spelersHuidig) {
    const huidig = sp.huidig as { team?: string } | null;
    if (!huidig?.team) continue;
    if (!teamTotalen[huidig.team]) teamTotalen[huidig.team] = { v: 0, m: 0, totaal: 0 };
    if (sp.geslacht === "V") teamTotalen[huidig.team].v++;
    else if (sp.geslacht === "M") teamTotalen[huidig.team].m++;
    teamTotalen[huidig.team].totaal++;
  }

  const kadersJson = (kaders.kaders ?? {}) as Record<string, unknown>;
  const initialeMemos: KadersMemosData = (kadersJson.memos ?? {}) as KadersMemosData;
  const initieleSelecties: SelectieVoorkeur[] = Array.isArray(kadersJson.selecties)
    ? (kadersJson.selecties as SelectieVoorkeur[])
    : [];
  const initieleAantallen: Record<string, TeamaantallenVoorkeur> =
    kadersJson.teamaantallen && typeof kadersJson.teamaantallen === "object"
      ? (kadersJson.teamaantallen as Record<string, TeamaantallenVoorkeur>)
      : {};

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Kaders
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Seizoensbesluiten en teamstructuur voor seizoen {seizoen}
        </p>
      </div>

      {/* LAAG 1 — KNKV Reglementen */}
      <KadersKnkvLaag />

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
            teamTotalen={teamTotalen}
          />
          <KadersTeamsamenstelling kadersId={kaders.id} initieleAantallen={initieleAantallen} />
        </div>
      </section>

      {/* LAAG 3 — Pins & Reserveringen */}
      <KadersPinsLaag kadersId={kaders.id} initialPins={pins} />

      <KadersDaisyWrapper />

      {/* Memo's — doelgroepen + TC */}
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
            Memo's — doelgroepen &amp; TC
          </span>
        </div>
        <div style={{ padding: "16px 20px" }}>
          <KadersMemosClient kadersId={kaders.id} initialeMemos={initialeMemos} />
        </div>
      </section>
    </div>
  );
}
