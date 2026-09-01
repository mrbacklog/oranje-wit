/**
 * Zoekt de vier "verdwenen" leden op naam terug in Sportlink.
 * Als iemand er wél in staat met een ANDERE rel_code, dan is de rel_code in de
 * database fout — geen afmelding.
 *
 * Gebruik: node scripts/check-naam-in-sportlink.mjs
 */

import { sportlinkLogin, navajoHeaders, NAVAJO_BASE } from "./sportlink-auth.mjs";

const ZOEK = [
  { relCode: "NLX00H0", termen: ["bemer", "githa"] },
  { relCode: "NMN23M1", termen: ["veenendaal", "martijn"] },
  { relCode: "NMZ29T0", termen: ["wingerden", "branley"] },
  { relCode: "NNJ36T7", termen: ["mans", "daan"] },
];

const out = (s) => process.stdout.write(s + "\n");

const token = await sportlinkLogin();

const [extRes, simpleRes] = await Promise.all([
  fetch(`${NAVAJO_BASE}/member/search/FilterMembersExtended`, {
    headers: navajoHeaders("member/search/FilterMembersExtended", token),
  }),
  fetch(`${NAVAJO_BASE}/member/search/FilterMembersSimple`, {
    headers: navajoHeaders("member/search/FilterMembersSimple", token),
  }),
]);

const inputExtended = await extRes.json();
const inputSimple = await simpleRes.json();
if (inputExtended.MemberStatus?.Options) {
  for (const opt of inputExtended.MemberStatus.Options) opt.Selected = true;
}

const searchRes = await fetch(`${NAVAJO_BASE}/member/search/SearchMembers`, {
  method: "POST",
  headers: navajoHeaders("member/search/SearchMembers", token),
  body: JSON.stringify({ Filters: { InputExtended: inputExtended, InputSimple: inputSimple } }),
});
const data = await searchRes.json();
const leden = data.Members ?? [];

for (const { relCode, termen } of ZOEK) {
  const treffers = leden.filter((m) => {
    const hooi =
      `${m.FullName ?? ""} ${m.FullNameReversed ?? ""} ${m.LastName ?? ""} ${m.NickName ?? ""}`.toLowerCase();
    return termen.some((t) => hooi.includes(t));
  });
  out(`\n### ${relCode} — zoektermen: ${termen.join(", ")}`);
  if (treffers.length === 0) {
    out("  Geen enkele naamtreffer in Sportlink → echt weg.");
    continue;
  }
  for (const t of treffers) {
    const zelfde = t.PublicPersonId === relCode;
    out(
      `  ${t.PublicPersonId}${zelfde ? " (ZELFDE rel_code)" : " (ANDERE rel_code!)"}  ${t.FullName}  status=${t.MemberStatusDescription ?? t.StatusDescription ?? "-"}  sinds=${t.MemberSince ?? "-"}`
    );
  }
}
