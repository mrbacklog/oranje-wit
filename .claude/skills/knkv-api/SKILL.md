---
name: knkv-api
description: Haalt teamdata op van de KNKV Mijn Korfbal API en slaat het op als referentiedata. Gebruik voor het ophalen van competitie-indelingen, pool/kleur-toewijzingen en teamregistraties.
user-invocable: true
allowed-tools: Read, Write, Glob, WebFetch
argument-hint: "[optioneel: seizoen, bijv. 2025-2026]"
---

# KNKV API — Teamdata ophalen

Haal de actuele teamdata op van de KNKV Mijn Korfbal API voor c.k.v. Oranje Wit.

## Context

De KNKV Mijn Korfbal API is publiek toegankelijk (geen authenticatie nodig).
Volledige documentatie: `docs/knkv-api.md`

- Base URL: `https://api-mijn.korfbal.nl/api/v2/`
- Club ID: `NCX19J3`

## Stappen

1. **Haal teamoverzicht op**

   `GET https://api-mijn.korfbal.nl/api/v2/clubs/NCX19J3/teams`

   Dit geeft alle teams met hun `ref_id` en leeftijdscategorie (Senioren/Jeugd).
   Elk team verschijnt twee keer: eenmaal voor veld, eenmaal voor zaal.

2. **Haal per team de details op**

   Voor elk uniek team:
   `GET https://api-mijn.korfbal.nl/api/v2/clubs/NCX19J3/teams/{ref_id}`

   Dit geeft de `pool.name` en `sport.name` (Veld Week / Zaal Week).

3. **Decodeer de pool-naam**

   De pool-naam prefix bepaalt de kleur, spelvorm en het competitieniveau:

   **B-categorie kleuren:**

   | Prefix | Kleur | Spelvorm |
   |---|---|---|
   | `Bl4-` | Blauw | 4-tal |
   | `Gr4-` | Groen | 4-tal |
   | `Ge-` | Geel | 8-tal |
   | `Or-` | Oranje | 8-tal |
   | `Ro-` | Rood | 8-tal |

   **A-categorie niveaus:**

   | Prefix | Niveau |
   |---|---|
   | `HK-` / `U{xx}-HK-` | Hoofdklasse |
   | `OK-` / `U{xx}-OK-` | Overgangsklasse |
   | `ROK-` | Reserve Overgangsklasse |
   | `1-` / `U{xx}-1-` | 1e klasse |
   | `2-` / `U{xx}-2-` | 2e klasse |
   | `S-` | S-klasse |

4. **Sla de resultaten op**

   - Ruwe API response → `data/seizoenen/YYYY-YYYY/raw/YYYY-MM-DD-knkv-teams.json`
   - Seizoensoverzicht → `data/seizoenen/YYYY-YYYY/teams-knkv.json`

   Formaat seizoensoverzicht:

   ```json
   {
     "_meta": {
       "seizoen": "2025-2026",
       "club_id": "NCX19J3",
       "opgehaald": "2026-02-23"
     },
     "teams": [
       {
         "team": "J1",
         "categorie": "b",
         "kleur": "Rood",
         "pools": [
           { "sport": "veld-week", "pool": "Ro-135", "spelvorm": "8-tal" },
           { "sport": "zaal-week", "pool": "Ro-074", "spelvorm": "8-tal" }
         ]
       }
     ]
   }
   ```

5. **Rapporteer het resultaat**

   Toon een overzicht per kleur:
   - Aantal teams per kleur
   - Competitieniveau per A-categorie team
   - Eventuele afwijkingen t.o.v. vorig seizoen

## Output

Overzicht van alle teams met hun KNKV-registratie, kleur en competitieniveau.
Opgeslagen als seizoensreferentiedata in `data/seizoenen/`.

## Gebruik door andere projecten

Andere projecten (bijv. Team Samenstelling app) kunnen de opgeslagen
`teams-knkv.json` gebruiken zonder zelf de API aan te roepen. Het formaat
is gedocumenteerd in `docs/knkv-api.md` en `model/plugin-interface.yaml`.
