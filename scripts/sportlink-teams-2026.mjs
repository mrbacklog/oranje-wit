/**
 * Onderzoekt in Sportlink:
 *  1. de statusfilters — krijgen we ook afgemelde leden mét RelationEnd (afmelddatum)?
 *  2. de teamindeling voor de veldcompetitie 2026-2027
 *
 * Gebruik: node scripts/sportlink-teams-2026.mjs
 */

import { sportlinkLogin, navajoHeaders, NAVAJO_BASE } from "./sportlink-auth.mjs";

const out = (s) => process.stdout.write(s + "\n");

const token = await sportlinkLogin();

async function apiGet(entity, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = qs ? `${NAVAJO_BASE}/${entity}?${qs}` : `${NAVAJO_BASE}/${entity}`;
  const res = await fetch(url, { headers: navajoHeaders(entity, token) });
  return res.json();
}

async function apiPost(entity, body) {
  const res = await fetch(`${NAVAJO_BASE}/${entity}`, {
    method: "POST",
    headers: navajoHeaders(entity, token),
    body: JSON.stringify(body),
  });
  return res.json();
}

// ── 1. Statusfilters ────────────────────────────────────────────────
out("### Beschikbare filteropties");
const filter = await apiGet("member/search/FilterMembersExtended");
for (const [veld, def] of Object.entries(filter)) {
  if (def && typeof def === "object" && Array.isArray(def.Options)) {
    out(`  ${veld}: ${def.Options.map((o) => o.Id ?? o.Name ?? JSON.stringify(o)).join(", ")}`);
  }
}

async function zoek(selecteerAlles) {
  const ext = await apiGet("member/search/FilterMembersExtended");
  const simple = await apiGet("member/search/FilterMembersSimple");
  for (const def of Object.values(ext)) {
    if (def && typeof def === "object" && Array.isArray(def.Options)) {
      for (const o of def.Options) {
        if (selecteerAlles) {
          o.Selected = true;
          o.IsSelected = true;
        }
      }
    }
  }
  const data = await apiPost("member/search/SearchMembers", {
    Filters: { InputExtended: ext, InputSimple: simple },
  });
  return data.Members ?? [];
}

const alles = await zoek(true);
out(`\n### SearchMembers met álle filteropties aan: ${alles.length} leden`);
const metEind = alles.filter((m) => m.RelationEnd);
out(`  met RelationEnd (afmelddatum): ${metEind.length}`);
for (const m of metEind.slice(0, 15)) {
  out(`    ${m.PublicPersonId}  ${m.FullName}  eind=${m.RelationEnd}  status=${m.MemberStatus}`);
}
const perStatus = new Map();
for (const m of alles) perStatus.set(m.MemberStatus, (perStatus.get(m.MemberStatus) ?? 0) + 1);
out(`  per MemberStatus: ${[...perStatus].map(([k, v]) => `${k}=${v}`).join("  ")}`);

const perType = new Map();
for (const m of alles) perType.set(m.TypeOfMember, (perType.get(m.TypeOfMember) ?? 0) + 1);
out(`  per TypeOfMember: ${[...perType].map(([k, v]) => `${k}=${v}`).join("  ")}`);

// ── 2. Teams ────────────────────────────────────────────────────────
out("\n### Teams in Sportlink");
for (const entity of ["team/UnionTeams", "team/ClubTeams"]) {
  const data = await apiGet(entity);
  const teams = data.Team ?? data.Teams ?? [];
  if (data.Error) {
    out(`  ${entity}: FOUT — ${data.Message}`);
    continue;
  }
  out(`  ${entity}: ${teams.length} teams`);
  if (teams[0]) out(`    velden: ${Object.keys(teams[0]).join(", ")}`);
  for (const t of teams) {
    out(
      `    ${t.TeamName ?? t.Name ?? "?"}  code=${t.TeamCode ?? "-"}  id=${t.PublicTeamId ?? "-"}  spelers=${t.PlayerCount ?? "?"}  activiteit=${t.GameActivityDescription ?? "-"}`
    );
  }
}
