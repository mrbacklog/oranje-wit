/**
 * Controleert of de Sportlink-login werkt en hoeveel leden de API teruggeeft.
 * Haalt geen persoonsgegevens op het scherm — alleen aantallen.
 *
 * Gebruik: node scripts/sportlink-check.mjs
 */

import { sportlinkLogin, navajoHeaders, NAVAJO_BASE } from "./sportlink-auth.mjs";

const out = (s) => process.stdout.write(s + "\n");

const token = await sportlinkLogin();
out("Login gelukt, Navajo-token ontvangen.");

const [extRes, simpleRes] = await Promise.all([
  fetch(`${NAVAJO_BASE}/member/search/FilterMembersExtended`, {
    method: "GET",
    headers: navajoHeaders("member/search/FilterMembersExtended", token),
  }),
  fetch(`${NAVAJO_BASE}/member/search/FilterMembersSimple`, {
    method: "GET",
    headers: navajoHeaders("member/search/FilterMembersSimple", token),
  }),
]);

const inputExtended = await extRes.json();
const inputSimple = await simpleRes.json();
if (inputExtended.Error) throw new Error(`Filter-fout: ${inputExtended.Message}`);

if (inputExtended.MemberStatus?.Options) {
  for (const opt of inputExtended.MemberStatus.Options) opt.Selected = true;
}

const searchRes = await fetch(`${NAVAJO_BASE}/member/search/SearchMembers`, {
  method: "POST",
  headers: navajoHeaders("member/search/SearchMembers", token),
  body: JSON.stringify({ Filters: { InputExtended: inputExtended, InputSimple: inputSimple } }),
});

const data = await searchRes.json();
if (data.Error) throw new Error(`SearchMembers fout: ${data.Message}`);

const leden = data.Members ?? [];
out(`Leden opgehaald: ${leden.length}`);
out(`Beschikbare velden per lid: ${Object.keys(leden[0] ?? {}).length}`);
out("\nTeamvelden — hoe zijn ze gevuld?");
for (const veld of ["ClubTeams", "UnionTeams", "KernelGameActivities", "ClubGameActivities"]) {
  const gevuld = leden.filter((m) => m[veld] !== null && m[veld] !== "" && m[veld] !== undefined);
  const voorbeeld = gevuld[0]?.[veld];
  out(
    `  ${veld}: ${gevuld.length}/${leden.length} gevuld, type=${typeof voorbeeld}, voorbeeld=${JSON.stringify(voorbeeld)?.slice(0, 120)}`
  );
}
