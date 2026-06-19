/**
 * Discovery-script: print ruwe Sportlink-veldnamen voor de eerste 5 leden.
 * Gebruik: node scripts/sportlink-discovery.mjs
 * Doel: emailveld(en) en lidmaatschapstype-veld achterhalen voor het exportscript.
 */
import { sportlinkLogin, navajoHeaders, NAVAJO_BASE } from "./sportlink-auth.mjs";

console.error("Auth bij Sportlink...");
const token = await sportlinkLogin();
console.error("Ingelogd. Leden ophalen...");

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

const members = data.Members ?? [];
console.error(`${members.length} leden opgehaald. Eerste 5 raw:`);
console.log(JSON.stringify(members.slice(0, 5), null, 2));
