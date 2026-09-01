/**
 * Toont lidmaatschapstype en spelactiviteiten van specifieke leden uit Sportlink.
 *
 * Gebruik: node scripts/check-spelactiviteiten.mjs <rel_code> [<rel_code> ...]
 */

import { sportlinkLogin, navajoHeaders, NAVAJO_BASE } from "./sportlink-auth.mjs";

const CODES = process.argv.slice(2);
const out = (s) => process.stdout.write(s + "\n");
const token = await sportlinkLogin();

const get = async (e) =>
  (await fetch(`${NAVAJO_BASE}/${e}`, { headers: navajoHeaders(e, token) })).json();
const post = async (e, body) =>
  (
    await fetch(`${NAVAJO_BASE}/${e}`, {
      method: "POST",
      headers: navajoHeaders(e, token),
      body: JSON.stringify(body),
    })
  ).json();

const simple = await get("member/search/FilterMembersSimple");
const ext = await get("member/search/FilterMembersExtended");
for (const o of ext.MemberStatus?.Options ?? []) {
  o.Selected = true;
  o.IsSelected = true;
}
const leden =
  (
    await post("member/search/SearchMembers", {
      Filters: { InputExtended: ext, InputSimple: simple },
    })
  ).Members ?? [];

for (const rc of CODES) {
  const m = leden.find((x) => x.PublicPersonId === rc);
  if (!m) {
    out(`${rc}: niet gevonden`);
    continue;
  }
  out(`${rc}  ${m.FullName}`);
  out(
    `   type=${m.TypeOfMemberDescription ?? m.TypeOfMember}  status=${m.MemberStatusDescription || m.MemberStatus || "-"}`
  );
  out(`   kernel: ${m.KernelGameActivities || "GEEN"}`);
  out(`   club:   ${m.ClubGameActivities || "GEEN"}`);
  out(`   eind:   ${m.RelationEnd ? new Date(m.RelationEnd).toISOString().slice(0, 10) : "-"}`);
}
