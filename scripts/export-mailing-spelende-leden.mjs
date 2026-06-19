/**
 * Exporteert emailadressen van alle spelende leden uit Sportlink.
 * Gebruik: node scripts/export-mailing-spelende-leden.mjs > mailinglijst.txt
 * Voortgang verschijnt op stderr zodat de output-file schoon blijft.
 */
import { sportlinkLogin, navajoHeaders, NAVAJO_BASE } from "./sportlink-auth.mjs";

// Veldnamen uit discovery (Task 2):
const EMAIL_PRIMAIR_VELD = "Email";
const EMAIL_SECUNDAIR_VELD = "EmailAlternative";
const LIDMAATSCHAPSTYPE_VELD = "TypeOfMember";
const SPELENDE_TYPES = ["KERNELMEMBER"];

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

// Selecteer alle statussen
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

const alleleden = data.Members ?? [];
console.error(`${alleleden.length} actieve leden opgehaald. Filteren op spelende types...`);

const spelenden = alleleden.filter((m) => {
  const type = m[LIDMAATSCHAPSTYPE_VELD] ?? "";
  return SPELENDE_TYPES.some((t) => type.toUpperCase() === t.toUpperCase());
});

console.error(`${spelenden.length} spelende leden gevonden. Emailadressen verzamelen...`);

const emailSet = new Set();
for (const m of spelenden) {
  const primair = m[EMAIL_PRIMAIR_VELD];
  const secundair = EMAIL_SECUNDAIR_VELD ? m[EMAIL_SECUNDAIR_VELD] : null;
  if (primair && primair.includes("@")) emailSet.add(primair.trim().toLowerCase());
  if (secundair && secundair.includes("@")) emailSet.add(secundair.trim().toLowerCase());
}

console.error(`${emailSet.size} unieke emailadressen na deduplicatie.`);

for (const email of [...emailSet].sort()) {
  process.stdout.write(email + "\n");
}
