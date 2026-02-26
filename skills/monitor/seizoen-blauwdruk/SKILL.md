---
name: seizoen-blauwdruk
description: Maakt een seizoensblauwdruk op basis van ledenaantallen, leeftijdscategorieën, KNKV-regels en de technische doelstellingen van Oranje Wit. Gebruik aan het begin van het samenstellingsproces (jan–mrt).
user-invocable: true
allowed-tools: Read, Write, Glob
argument-hint: "[seizoen, bijv. 2025-2026]"
---

# Seizoensblauwdruk

Maak de seizoensblauwdruk voor $ARGUMENTS (of het aankomende seizoen als niet opgegeven).

## Context

De blauwdruk is het startdocument van het teamindelingsproces (fase maart–april). Het geeft een realistisch beeld van hoeveel teams mogelijk zijn, welke categorieën, en waar knelpunten zitten.

## Referentie vorig seizoen (2025-2026)
- 264 spelers, 29 teams, 68 stafleden
- Senioren 1–6 + U19-1/U19-2 + U17-1/U17-2 + U15-1/U15-2
- J1 t/m J17 (breedteteams) + Kangoeroes

## Stappen

1. **Verzamel ingangsinformatie**
   - Meest recente ledensnapshot (`data/leden/snapshots/`)
   - Statische ledeninfo (`data/leden/stamgegevens.json`)
   - Vorige teamindeling (`data/teams/history/`)
   - Jeugdmodel (`model/jeugdmodel.yaml`) — talent-ratio's, retentie per leeftijdsjaar, instroomverdeling
   - **Streefmodel** (`data/modellen/streef-ledenboog.json`) — retentie-gebaseerde projecties huidig → 2028 → 2030
   - **Retentie-analyse** (`data/aggregaties/analyse-per-leeftijd.json`) — historische patronen per leeftijdsjaar
   - Technische doelstellingen (raadpleeg `/oranje-wit:oranje-draad`)

2. **Bepaal de realiteit per categorie**

   Per leeftijdscategorie berekenen:
   - Hoeveel spelers/speelsters beschikbaar (M/V apart)?
   - Geboortejaren: 1e-jaars en 2e-jaars per categorie
   - Verdeling A-categorie (wedstrijd) vs. B-categorie (breedte)
   - Hoeveel teams zijn realistisch?

   **Teamtype-eisen (uit types.csv):**

   | Type | M/V | Max leeftijd | Gem. leeftijd | Teamgrootte |
   |---|---|---|---|---|
   | Senioren A | 4M + 4V | — | — | 8 |
   | Senioren B | 2M + 2V | — | — | 8 |
   | U19/U17/U15 | 4M + 4V | 19/17/15 | — | 8 |
   | Rood | 2M + 2V | — | 15,5–18,5 | 8 |
   | Oranje | 2M + 2V | — | 12,5–15,5 | 8 |
   | Geel | 2M + 2V | — | 10,5–12,5 | 8 |
   | Groen | 2M + 2V | — | 8,5–10,5 | 4 |
   | Blauw | 1M + 1V | — | 6,5–8,5 | 4 |

3. **Stel de blauwdruk op**
   - Aantal teams per categorie (A/B, jeugd/senioren)
   - Gewenste niveau-indeling per team
   - Benodigd aantal staf (trainers/coaches/teammanagers)
   - Knelpunten en risico's

4. **Toets aan het streefmodel (signalering)**
   Per geboortejaar en per band:
   - Vergelijk werkelijke aantallen (M/V) met streef uit `data/modellen/streef-ledenboog.json`
   - Gebruik het streefseizoen dat het dichtst bij het blauwdruk-seizoen ligt (2028 of 2030)
   - Bereken vulgraad: werkelijk / streef
   - Signaleer: Rood/kritiek (< 60%), Geel/aandacht (60–80%), Groen/op_koers (> 80%)
   - Bereken gap per gender (streef M/V = 40%/60%)
   - Vergelijk verwacht aantal teams met streefmodel-teams per band
   - Gebruik retentie per leeftijdsjaar (`model/jeugdmodel.yaml`) om verwachte uitval te schatten
   - Raadpleeg `data/aggregaties/analyse-per-leeftijd.json` voor historische patronen

5. **Toets aan de Oranje Draad**
   Past de blauwdruk bij Plezier + Ontwikkeling + Prestatie? Is het duurzaam?
   - Zijn er genoeg spelers voor verantwoorde selectieteams?
   - Is er genoeg staf voor alle teams?
   - Zijn er categorieën waar de balans scheef dreigt te lopen?

6. **Sla op**
   Schrijf naar `data/seizoenen/YYYY-YYYY/blauwdruk.md`

## Output
Een geconcludeerde blauwdruk met: teamoverzicht, onderbouwing, signalering per categorie en openstaande vragen.
