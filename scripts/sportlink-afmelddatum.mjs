/**
 * Zoekt uit of Sportlink afgemelde leden teruggeeft met RelationEnd (afmelddatum).
 * Probeert per MemberStatus-optie apart, zodat duidelijk wordt welke status wat oplevert.
 *
 * Gebruik: node scripts/sportlink-afmelddatum.mjs
 */

import { sportlinkLogin, navajoHeaders, NAVAJO_BASE } from "./sportlink-auth.mjs";

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

async function zoekMetStatus(statusIds) {
  const ext = await get("member/search/FilterMembersExtended");
  for (const o of ext.MemberStatus?.Options ?? []) {
    const aan = statusIds.includes(o.Id);
    o.Selected = aan;
    o.IsSelected = aan;
  }
  const data = await post("member/search/SearchMembers", {
    Filters: { InputExtended: ext, InputSimple: simple },
  });
  return data.Members ?? [];
}

const ALLE = ["ACTIVE", "INACTIVE", "PROCESSING", "ELIGABLE_FOR_REMOVE", "REJECTED", "ASPIRANT"];

for (const status of [...ALLE.map((s) => [s]), ALLE]) {
  const leden = await zoekMetStatus(status);
  const metEind = leden.filter((m) => m.RelationEnd);
  out(
    `${status.join("+").padEnd(60)} ${String(leden.length).padStart(4)} leden, ${metEind.length} met RelationEnd`
  );
  for (const m of metEind.slice(0, 5)) {
    out(`     ${m.PublicPersonId}  ${m.FullName}  eind=${m.RelationEnd}`);
  }
}
