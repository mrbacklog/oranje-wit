export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { PageContainer, BandPill } from "@oranje-wit/ui";
import {
  getTeamsRegister,
  getSpelersVanTeam,
  getSpelersPerTeam,
} from "@/lib/monitor/queries/teams";
import { getStafPerTeam } from "@/lib/monitor/queries/staf";
import { getOWTeamsMetUitslagen } from "@/lib/monitor/queries/uitslagen";
import { syncStandenIfStale } from "@/lib/monitor/sync/standen-knkv";
import { getSeizoen } from "@/lib/monitor/utils/seizoen";
import { TeamDetailTabs } from "./team-detail-tabs";

export default async function TeamDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ seizoen?: string }>;
}) {
  const { code } = await params;
  const seizoen = getSeizoen(await searchParams);

  await syncStandenIfStale(seizoen);

  const [register, stafMap, spelersVanTeam, tellingMap, uitslagen] = await Promise.all([
    getTeamsRegister(seizoen),
    getStafPerTeam(seizoen),
    getSpelersVanTeam(seizoen),
    getSpelersPerTeam(seizoen),
    getOWTeamsMetUitslagen(seizoen),
  ]);

  const team = register.teams.find((t) => t.ow_code === code);
  if (!team) notFound();

  const jNrNaarOwCode = new Map<string, string>();
  for (const t of register.teams) {
    for (const p of Object.values(t.periodes)) {
      if (p?.j_nummer) jNrNaarOwCode.set(p.j_nummer, t.ow_code);
    }
  }

  const teamUitslagen = uitslagen.find((tu) => {
    const owCode = jNrNaarOwCode.get(tu.teamCode) ?? tu.teamCode;
    return owCode === code;
  });

  const spelers = spelersVanTeam.get(code);
  const staf = stafMap.get(code);
  const telling = tellingMap.get(code);

  const qs = seizoen ? `?seizoen=${seizoen}` : "";

  return (
    <PageContainer animated>
      <Link
        href={`/monitor/teams${qs}`}
        className="hover:text-ow-oranje text-text-muted mb-4 inline-block text-sm"
      >
        &larr; Terug naar teams
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-text-primary text-2xl font-bold">{team.naam || team.ow_code}</h1>
        {team.kleur && <BandPill band={team.kleur} />}
        <span className="text-text-muted text-sm">
          {[team.spelvorm, team.leeftijdsgroep].filter(Boolean).join(" · ")}
        </span>
      </div>

      <TeamDetailTabs
        spelers={spelers}
        telling={telling}
        staf={staf}
        uitslagen={teamUitslagen}
        qs={qs}
      />
    </PageContainer>
  );
}
