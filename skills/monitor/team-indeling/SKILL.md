---
name: team-indeling
description: Stelt de concrete pre-season teamindeling op voor het nieuwe seizoen. Combineert blauwdruk, scenario-analyse en evaluaties. Gebruik in de finale fase (mei–jun) voor de juni-presentatie.
user-invocable: true
allowed-tools: Read, Write, Glob
argument-hint: "[seizoen, bijv. 2025-2026]"
---

# Pre-season Teamindeling

Stel de concept-teamindeling op voor seizoen $ARGUMENTS.

## Teamindelingsproces (22 stappen, mrt–sept)

Het proces loopt door vaste fasen met oplopende versienummers:

| Fase | Periode | Versie | Activiteiten |
|---|---|---|---|
| Voorbereiding | mrt–apr | — | Evaluaties verzamelen, blauwdruk opstellen, KNKV competitie-info ophalen |
| Eerste concepten | apr–mei | 0.1–0.5 | TC stelt interne concepten op, iteratieve afstemming |
| Afstemming | mei | 0.9 | Concept besproken met coaches en coördinatoren |
| Communicatie | mei–jun | — | Bericht einde seizoen naar leden, pre-season teamindeling |
| Kennismaking | jun | — | Spelers trainen met hun nieuwe team |
| Definitief | jun–jul | 1.0 | Definitieve indeling na kennismakingstrainingen |
| Start | aug–sept | — | Teams beginnen met trainen en competitie |

## Stappen

1. **Laad alle invoer**
   - Blauwdruk: `data/seizoenen/YYYY-YYYY/blauwdruk.md`
   - Scenario's: `data/seizoenen/YYYY-YYYY/scenarios.md`
   - Evaluaties: `data/seizoenen/YYYY-YYYY/evaluaties-export.json` (uit Evaluatie-app)
   - Verrijkte ledensnapshot: `data/leden/snapshots/YYYY-MM-DD.json`
   - **Streefmodel**: `data/modellen/streef-ledenboog.json` (verwacht aantal teams per band)
   - KNKV teamdata: `data/seizoenen/YYYY-YYYY/teams-knkv.json` (kleur, niveau, pool)
   - Staflijst: beschikbare trainers en coaches
   - Vorige indeling: `data/teams/history/`

2. **Stel teams samen per categorie**

   Hanteer de indelingsprioriteiten per kleur/categorie:

   | Kleur/Categorie | Prioriteit 1 | Prioriteit 2 | Teamgrootte |
   |---|---|---|---|
   | Blauw (F) | Sociaal | — | 5–6 kinderen |
   | Groen (E) | Sociaal | Ontwikkeling | 5 kinderen |
   | Geel (D) | Ontwikkeling | Sociaal | 8-tal |
   | Oranje breedte (C) | Ontwikkeling | Sociaal | 8-tal |
   | U15 selectie (C1/C2) | Teamsterkte | Ontwikkeling | 5H + 5D |
   | Rood breedte (B) | Sociaal | Ontwikkeling | 8-tal |
   | U17/U19 selectie | Teamsterkte | Ontwikkeling | 5H + 5D (sel: 10H+10D) |
   | Senioren 1–4 | Teamsterkte | — | 8-tal |
   | Senioren 5+ | Sociaal | — | 5 om 5 |

   Per team:
   - Selecteer spelers op basis van bovenstaande prioriteiten
   - Controleer leeftijdsgrenzen en bandbreedte (2 jaar bij Blauw/Groen, 3 jaar bij Geel/Oranje/Rood)
   - Controleer minimum M/V per teamtype (zie `types.csv` en KNKV-regels)
   - Wijs staf toe (trainer, assistent, teammanager)

3. **Selectieteams: specifieke regels**
   - Selectieteams (C1/C2, B1/B2, A1/A2) worden als **één selectiegroep** behandeld
   - Prestatieteam: ~65% 2e-jaars, ~35% 1e-jaars (talenten)
   - Ontwikkelteam: ~35% 2e-jaars, ~65% 1e-jaars
   - A1 samenstelling door hoofdcoach in overleg met TC: 4 om 4, 4 om 5 of 5 om 4

4. **Toets elk team aan de Oranje Draad**
   - Plezier: past deze groep bij elkaar?
   - Ontwikkeling: krijgt elke speler de juiste uitdaging?
   - Prestatie: is het niveau realistisch en ambitieus genoeg?
   - Duurzaamheid: kan staf dit seizoen volhouden?

5. **Noteer afwegingen**
   Voor elke moeilijke beslissing: wat waren de alternatieven en waarom is dit de keuze?

6. **Sla op**
   Schrijf naar `data/seizoenen/YYYY-YYYY/concept-indeling.md`
   Dit document is de basis voor bestuurlijk gesprek.

## Communicatiemomenten

Na vaststelling indeling:
1. **Bericht einde seizoen** — overzicht afgelopen seizoen + aankondiging proces
2. **Pre-season teamindeling** — definitieve teamindelingen per brief/mail
3. **Kennismakingstrainingen** — fysiek kennismaken met nieuw team en staf

## Output
Concept-indeling per team + onderbouwing van keuzes + openstaande vragen voor bestuurlijk gesprek.
