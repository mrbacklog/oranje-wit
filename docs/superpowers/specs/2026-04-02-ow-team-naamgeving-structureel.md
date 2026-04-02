# Spec: OWTeam naamgeving & structurele koppeling aan competitieteams

**Datum:** 2026-04-02  
**Status:** Goedgekeurd  
**Domein:** Monitor / Team-Indeling / Database

---

## Probleemstelling

Seizoen 2025-2026 brak met het oude OW-naamgevingssysteem (A1, B2, C3 etc. op basis van KNKV-pools). De bond gebruikt nu J-nummers per team per competitiefase, en die kunnen tijdens het seizoen veranderen. De `teams`-tabel bevat nog verkeerde namen (B2, B3, C2 bestaan niet meer), er zijn geen jeugdteams aangemaakt voor 2025-2026, en de `team_aliases` tabel is leeg. Hierdoor toont `/monitor/teams` slechts 9 teams en zijn spelers niet correct gekoppeld aan OW-interne teams.

---

## Ontwerp

### Naamgevingssysteem

Elk OW-seizoensteam krijgt:
- **Primaire naam** (`naam`): altijd `Kleur-Nummer` — bv. `Rood-1`, `Geel-3`, `Blauw-2`. Verplicht, gegenereerd bij aanmaken.
- **Alias** (`alias`): optioneel extra naam die de TC zelf invult — bv. "De Tijgers". Wordt naast de primaire naam getoond.

**Vaste namen** (niet kleur+nummer):
- U-teams: `U15-1`, `U17-1`, `U17-2`, `U19-1`, `U19-2`
- Senioren: `Senioren 1` t/m `Senioren 6`
- Overig: `MW1`, `Kangoeroes`

### OWTeam indeling 2025-2026

Afgeleid uit de KNKV pool_stand_regels (niveau per pool):

| Naam | J-nummer | Kleur | Type |
|---|---|---|---|
| Rood-1 | J1 | ROOD | JEUGD |
| Rood-2 | J2 | ROOD | JEUGD |
| Oranje-1 | J4 | ORANJE | JEUGD |
| Oranje-2 | J3 | ORANJE | JEUGD |
| Oranje-3 | J5 | ORANJE | JEUGD |
| Oranje-4 | J6 | ORANJE | JEUGD |
| Geel-1 | J7 | GEEL | JEUGD |
| Geel-2 | J8 | GEEL | JEUGD |
| Geel-3 | J9 | GEEL | JEUGD |
| Geel-4 | J10 | GEEL | JEUGD |
| Groen-1 | J11 | GROEN | JEUGD |
| Groen-2 | J12 | GROEN | JEUGD |
| Groen-3 | J13 | GROEN | JEUGD |
| Groen-4 | J14 | GROEN | JEUGD |
| Blauw-1 | J15 | BLAUW | JEUGD |
| Blauw-2 | J17 | BLAUW | JEUGD |
| Blauw-3 | J16 | BLAUW | JEUGD |
| Blauw-4 | J18 | BLAUW | JEUGD |
| U15-1 | — | — | U_TEAM |
| U17-1 | — | — | U_TEAM |
| U17-2 | — | — | U_TEAM |
| U19-1 | — | — | U_TEAM |
| U19-2 | — | — | U_TEAM |
| Senioren 1 | — | — | SENIOREN |
| Senioren 2 | — | — | SENIOREN |
| Senioren 3 | — | — | SENIOREN |
| Senioren 4 | — | — | SENIOREN |
| Senioren 5 | — | — | SENIOREN |
| Senioren 6 | — | — | SENIOREN |
| MW1 | — | — | OVERIG |
| Kangoeroes | — | — | OVERIG |

---

## Schemawijzigingen

### 1. `OWTeamType` enum (nieuw)

```prisma
enum OWTeamType {
  JEUGD      // vrije kleur+nummer naam, koppeling via J-nummer per fase
  U_TEAM     // vaste naam (U15-1, U17-1 etc.)
  SENIOREN   // vaste naam (Senioren 1-6)
  OVERIG     // MW1, Kangoeroes, recreanten
}
```

### 2. `OWTeam` — wijzigingen

```prisma
model OWTeam {
  // bestaande velden...
  naam     String        // was nullable → verplicht
  alias    String?       // nieuw: optionele extra naam door TC
  kleur    String?       // bestaand: ROOD | ORANJE | GEEL | GROEN | BLAUW
  teamType OWTeamType    @map("team_type")  // nieuw
}
```

### 3. `CompetitieSpeler` — `owTeamId` FK (nieuw, nullable)

```prisma
model CompetitieSpeler {
  // bestaande velden blijven intact...
  owTeamId  Int?    @map("ow_team_id")
  owTeam    OWTeam? @relation(fields: [owTeamId], references: [id])
}
```

Het `team` veld (KNKV-naam string) blijft de bronregistratie — nooit verwijderen.

---

## Data-migratie

### Stap 1: OW-teams 2025-2026 opschonen

- Verwijder: OW-A1 t/m OW-A3, OW-B1 t/m OW-B3, OW-C1 t/m OW-C3 voor seizoen 2025-2026
- Verwijder bijbehorende `team_periodes` en `team_aliases`
- Maak 31 nieuwe OWTeam-records aan conform de tabel hierboven
- Vul `TeamPeriode` per jeugdteam: `jNummer` per fase (veld_najaar / zaal / veld_voorjaar)

### Stap 2: `TeamAlias` tabel vullen (2025-2026)

Voor elk jeugdteam: alle bekende KNKV-varianten als alias:

| OWTeam | Aliases |
|---|---|
| Rood-1 | `OW J1`, `J1` |
| Rood-2 | `OW J2`, `J2` |
| Oranje-1 | `OW J4`, `J4` |
| Oranje-2 | `OW J3`, `J3` |
| Oranje-3 | `OW J5`, `J5` |
| Oranje-4 | `OW J6`, `J6` |
| Geel-1 | `OW J7`, `J7` |
| Geel-2 | `OW J8`, `J8` |
| Geel-3 | `OW J9`, `J9` |
| Geel-4 | `OW J10`, `J10` |
| Groen-1 | `OW J11`, `J11` |
| Groen-2 | `OW J12`, `J12` |
| Groen-3 | `OW J13`, `J13` |
| Groen-4 | `OW J14`, `J14` |
| Blauw-1 | `OW J15`, `J15` |
| Blauw-2 | `OW J17`, `J17` |
| Blauw-3 | `OW J16`, `J16` |
| Blauw-4 | `OW J18`, `J18` |
| Senioren 1 | `S1`, `1` |
| Senioren 2 | `S2`, `2` |
| Senioren 3 | `S3`, `3` |
| Senioren 4 | `S4`, `4` |
| Senioren 5 | `S5`, `5` |
| Senioren 6 | `S6`, `6` |
| U15-1 | `U15-1` |
| U17-1 | `U17-1` |
| U17-2 | `U17-2`, `U17` |
| U19-1 | `U19-1` |
| U19-2 | `U19-2`, `U19` |
| MW1 | `MW1` |
| Kangoeroes | `Kangoeroes` |

### Stap 3: `owTeamId` backfill via alias

```sql
UPDATE competitie_spelers cs
SET ow_team_id = a.ow_team_id
FROM team_aliases a
WHERE a.seizoen = cs.seizoen
  AND a.alias = cs.team
  AND cs.ow_team_id IS NULL;
```

Voor seizoenen vóór 2025-2026: eerst alias-tabel vullen met historische namen (A1→OW-A1 etc.) per seizoen, dan dezelfde UPDATE draaien.

### Stap 4: Historische aliases (2024-2025 en eerder)

Historisch gebruikte OW-teams dezelfde namen als de KNKV (A1, B2 etc.). Alias-tabel wordt gevuld per seizoen zodat backfill ook historische rijen dekt.

---

## Import-logica (structureel nieuw)

Na het importeren van Sportlink CSV per fase:

1. **Alias-lookup**: zoek elke KNKV-teamnaam op in `team_aliases` voor dat seizoen
2. **Match gevonden**: vul `owTeamId` direct in
3. **Geen match**: `owTeamId` blijft `null`, TC-melding in app om handmatig te koppelen
4. **Nieuwe alias**: als TC koppelt in app → alias opslaan + alle bestaande rijen voor die fase updaten
5. **`TeamPeriode.jNummer`** updaten bij nieuwe koppeling

---

## VIEW `speler_seizoenen` — uitbreiding

```sql
SELECT DISTINCT ON (cs.rel_code, cs.seizoen)
  ...,
  cs.ow_team_id,
  t.naam  AS ow_team_naam,
  t.alias AS ow_team_alias,
  t.kleur AS ow_team_kleur
FROM competitie_spelers cs
LEFT JOIN teams t ON t.id = cs.ow_team_id
ORDER BY cs.rel_code, cs.seizoen, [bestaande prioriteit]
```

Fallback: als `ow_team_id IS NULL`, toon de `team` string uit `competitie_spelers`.

---

## App-impact

| Onderdeel | Wijziging |
|---|---|
| `/monitor/teams` | Toont `naam` (+ `alias` indien gevuld) i.p.v. KNKV-string |
| Spelersprofiel teamhistorie | Toont OW-naam waar `ow_team_id` gevuld is |
| TI-Studio / Scenario | Gebruikt al `OWTeam` — geen breaking change |
| Import-script | Nieuw: alias-stap na import, `owTeamId` oplossen |
| Beheer teams-pagina | TC kan `alias` instellen per team |

---

## Wat niet wijzigt

- `competitie_spelers.team` (KNKV-bronstring) — blijft altijd staan
- Alle bestaande queries op `team` string — blijven werken
- `TeamAlias` is aanvullend, vervangt niets

---

## Openstaande punten

- Historische alias-tabel (pre-2025-2026) moet handmatig of via script gevuld worden — omvang: ~16 seizoenen × ~30 teams
- `S1/S2` in veld_najaar 2025-2026 is een gecombineerde KNKV-registratie — aparte alias per team of één gecombineerde OWTeam? → nader te bepalen bij implementatie
