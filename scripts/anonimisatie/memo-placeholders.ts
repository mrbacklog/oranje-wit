/**
 * Placeholder-zinnen voor anonimisatie van vrije tekstvelden:
 * werkitems.beschrijving, werkitem_toelichtingen.tekst, kaders_spelers.notitie,
 * scouting_rapporten.opmerking, activiteiten.inhoud, etc.
 *
 * De zinnen behouden de TC-toonzetting (urgentie, ontwikkeling, planning)
 * zonder identificerende details.
 */

import { deterministicIndex } from "./hash";

export const MEMO_PLACEHOLDERS: ReadonlyArray<string> = [
  "Speler moet dit seizoen meer focus op aanvallen.",
  "Team-samenstelling aanpassen voor volgende periode.",
  "Coach en speler hebben overleg nodig over toekomstplanning.",
  "Voorbereiding op volgende competitieronde.",
  "Evaluatie van trainingsresultaten nodig.",
  "Selectiebeslissing in Q2 verwacht.",
  "Aandacht voor doorstroming naar volgende leeftijdsgroep.",
  "Trainer signaleert ontwikkeling op verdedigen.",
  "Speler twijfelt over volgend seizoen — gesprek inplannen.",
  "Sterk in samenwerking, tactisch nog te ontwikkelen.",
  "Punt van aandacht: trainingsopkomst structureel laag.",
  "Vraag aan TC: passende plek in selectiestructuur?",
  "Coach geeft positief signaal over inzet.",
  "Risico op uitstroom — actief contact onderhouden.",
  "Profiel past bij Wedstrijdsport-doelgroep.",
  "Overweeg gesprek met ouders over ambitie.",
  "Speler heeft baat bij extra training-uren.",
  "Combineer training met andere leeftijdsgroep voor uitdaging.",
  "Coach-feedback volgt na volgende observatie.",
  "Bespreken in eerstvolgende TC-vergadering.",
  "Plezier-component blijft hoog volgens zelfevaluatie.",
  "Profielmatch met team-niveau is goed.",
  "Aanbevolen: vervolg-evaluatie over zes weken.",
  "Geen actie nodig op dit moment — situatie stabiel.",
  "Coördinator volgt op met team-overleg.",
  "Speler past bij Korfbalplezier-profiel — geen forceren.",
  "Volgende stap: scoutingsrapport opvragen.",
  "Aanmelden voor proeftraining hogere groep.",
  "Memo aan trainer: focus op spelvorm-toepassing.",
  "Status ongewijzigd — volgende ronde herzien.",
];

export function replaceWithPlaceholder(seed: string, salt: string): string {
  const idx = deterministicIndex(seed, salt, [0, 8], MEMO_PLACEHOLDERS.length);
  return MEMO_PLACEHOLDERS[idx];
}
