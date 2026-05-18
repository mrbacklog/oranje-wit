# Edge-case test-data — Catalogus voor E2E-validatie

> **Doel:** alle scenario's en edge cases die E2E-tests (en visuele inspectie) moeten kunnen valideren in een **gegarandeerd aanwezige** testdataset zetten, zodat tests harde assertions doen i.p.v. graceful skip.
>
> **Datum:** 2026-05-18 · **Status:** levend document, gegroeid bij elke nieuwe spec-coverage

---

## Aanpak — beslist 2026-05-18

1. **Test-DB = volledig synthetische ideale state.** Geen productie-snapshot meer op `oranjewit-test`. Bij elke reset wipe + reseed naar **dezelfde** reproduceerbare state.
2. **Volledige schaal:** ~150 spelers, 25 teams, alle KNKV-categorieën 1× (Kangoeroes t/m Senioren A). Realistische omvang voor E2E zonder afhankelijkheid van Sportlink-data.
3. **Reset-cadans:** vóór **elke** E2E workflow-run (`scripts/seed-edge-cases.ts` als step). Garantie: state altijd vers, tests altijd reproduceerbaar.
4. **Seed-update flow:** developer voegt fixture toe = single PR met (a) catalogus-update + (b) seed-script-update + (c) optioneel test-update. Bij merge gaat het automatisch mee in volgende run. Zo blijft de catalogus altijd in sync met wat er werkelijk in test-DB staat.
5. **Synthetisch `rel_code`-bereik:** `9900xxxxxxxx` (12 cijfers, `9900` prefix). Geen conflict-risico, leesbaar groeperend.
6. **Werkindeling:** bestaande werkindeling op `oranjewit-test` wordt hergebruikt — naam volgt productie-conventie (`wi-2026-2027` o.i.d.), seed-script upsert.
7. **Tests doen harde assertions** op exacte `rel_code`'s en aantallen — geen `tabelRijen.first()`, geen graceful skip "geen data".

**Privacy-bonus:** synth-data heeft geen echte ledennamen → studio-test mag breder gedeeld worden (TC + agents) zonder privacy-risico.

**Trade-off:** Sportlink-sync kan niet meer tegen `oranjewit-test` getest worden — apart smoke-mechanisme nodig (later).

---

## 0. De 25 teams — volledige schaal

| # | Naam | OWTeamType | Categorie | Kleur | Type | Default omvang | Bedoeld voor scenario |
|---|---|---|---|---|---|---|---|
| 01 | Senioren 1 | SENIOREN | SENIOREN | — | ACHTTAL | 10 | Standaard vol team |
| 02 | Senioren 2 | SENIOREN | SENIOREN | — | ACHTTAL | 8 | Net-aan |
| 03 | Senioren 3 (A) | SENIOREN | A_CATEGORIE | — | ACHTTAL | 10 | Wedstrijdsport-doelgroep |
| 04 | Senioren 4 (B) | SENIOREN | B_CATEGORIE | — | ACHTTAL | 9 | Korfbalplezier-doelgroep |
| 05 | Recreanten | OVERIG | B_CATEGORIE | — | ACHTTAL | 8 | `RECREANT` status |
| 06 | Midweek 1 | OVERIG | B_CATEGORIE | — | ACHTTAL | 8 | OVERIG type |
| 07 | U19-1 | JEUGD/SELECTIE | A_CATEGORIE | — | ACHTTAL | 10 | TOP-doelgroep |
| 08 | U19-2 | JEUGD | B_CATEGORIE | — | ACHTTAL | 9 | Standaard jeugd |
| 09 | U17-1 | JEUGD/SELECTIE | A_CATEGORIE | — | ACHTTAL | 10 | TOP-doelgroep |
| 10 | U17-2 | JEUGD | B_CATEGORIE | — | ACHTTAL | 8 | Standaard jeugd |
| 11 | U15-1 | JEUGD/SELECTIE | A_CATEGORIE | — | ACHTTAL | 10 | TOP-doelgroep |
| 12 | U15-2 | JEUGD | B_CATEGORIE | — | ACHTTAL | 8 | Standaard jeugd |
| 13 | Rood-1 | JEUGD | B_CATEGORIE | ROOD | ACHTTAL | 9 | Korfbalplezier-doelgroep |
| 14 | Rood-2 | JEUGD | B_CATEGORIE | ROOD | ACHTTAL | 8 | Standaard jeugd |
| 15 | Oranje-1 | JEUGD | B_CATEGORIE | ORANJE | ACHTTAL | 9 | Ontwikkelhart-doelgroep |
| 16 | Oranje-2 | JEUGD | B_CATEGORIE | ORANJE | ACHTTAL | 9 | Standaard jeugd |
| 17 | Geel-1 | JEUGD | B_CATEGORIE | GEEL | ACHTTAL | 9 | Ontwikkelhart-doelgroep |
| 18 | Geel-2 | JEUGD | B_CATEGORIE | GEEL | ACHTTAL | 8 | Standaard jeugd |
| 19 | Groen-1 | JEUGD | B_CATEGORIE | GROEN | VIERTAL | 6 | Kweekvijver-doelgroep |
| 20 | Groen-2 | JEUGD | B_CATEGORIE | GROEN | VIERTAL | 5 | Standaard jeugd |
| 21 | Blauw-1 | JEUGD | B_CATEGORIE | BLAUW | VIERTAL | 6 | Kweekvijver-doelgroep |
| 22 | Blauw-2 | JEUGD | B_CATEGORIE | BLAUW | VIERTAL | 4 | Standaard jeugd |
| 23 | Kangoeroes | JEUGD | B_CATEGORIE | PAARS | VIERTAL | 8 | Kweekvijver-doelgroep (jongste) |
| 24 | **EDGE-LEEG** | SENIOREN | SENIOREN | — | ACHTTAL | **0** | Validatie ORANJE (sectie 1.1) |
| 25 | **EDGE-ONDER** | SENIOREN | SENIOREN | — | ACHTTAL | **6** | Validatie ROOD onder-min (sectie 1.1) |

**Synthetische team-ID's:** `team-edge-{nummer}` (bv. `team-edge-01` t/m `team-edge-25`).

**Default vulling van spelers per team:** `9900-NN-XXXX` waarbij `NN` = team-nummer, `XXXX` = volgnummer in team. Genaamd `Speler-{TeamCode}-{NN}` (bv. `Speler-S1-01`, `Speler-U17-1-05`). Standaard `SpelerStatus = BESCHIKBAAR`, gezond verdeeld M/V volgens KNKV-conventie (gemixte teams 50/50, indien viertal 2D+2H of 3D+1H).

**Totaal default omvang:** ~190 speler-slots, waarvan ~150 unieke spelers (sommige edge-case-spelers uit sectie 1.3 en 1.4 vullen reguliere teamposities). Plus 25 edge-case-spelers met expliciete fixtures.

---

## 1. Werkbord / Teamindeling

### 1.1 Team-grootte scenario's

| Scenario | Team | Spelers | Verwacht ValidatieStatus |
|---|---|---|---|
| **Leeg team** | `TEAM-EDGE-LEEG` (ACHTTAL, SENIOREN A) | 0 | `ORANJE` (geen minimum) |
| **Onder-minimum** | `TEAM-EDGE-MIN` (ACHTTAL) | 6 (3D + 3H, KNKV min 8) | `ROOD` |
| **Net-aan** | `TEAM-EDGE-NETAAN` (ACHTTAL) | 8 (4D + 4H) | `GROEN` |
| **Vol team** | `TEAM-EDGE-VOL` (ACHTTAL) | 12 (6D + 6H) | `GROEN` |
| **Over-maximum** | `TEAM-EDGE-OVER` (ACHTTAL) | 14 (7D + 7H, KNKV max 12) | `ROOD` |
| **VIERTAL leeg/vol** | `TEAM-EDGE-VTR-{LEEG,VOL}` | 0 / 6 (3D + 3H) | `ORANJE` / `GROEN` |

### 1.2 Sexe-verhouding scenario's

| Scenario | Verwachting |
|---|---|
| **All-female team** | 8 dames, 0 heren — `ROOD` (KNKV vereist gemengd) |
| **All-male team** | 8 heren, 0 dames — `ROOD` |
| **Scheve 7-1** | 7 dames, 1 heer — `ORANJE` (waarschuwing) |

### 1.3 Speler-status combinaties (alle 10 `SpelerStatus`-waarden)

Eén synthetische speler per status, naam `Edge-{STATUS}-{M|V}`, `rel_code` = `9900-1xxx-NNNN`:

| `rel_code` | Naam | `SpelerStatus` | Doelgroep |
|---|---|---|---|
| 990010000001 | Edge-Beschikbaar-V | `BESCHIKBAAR` | Senioren-team A |
| 990010000002 | Edge-Twijfelt-V | `TWIJFELT` | Senioren-team A |
| 990010000003 | Edge-Geblesseerd-V | `GEBLESSEERD` | spelerpool (nog gekoppeld aan team) |
| 990010000004 | Edge-GaatStoppen-V | `GAAT_STOPPEN` | spelerpool |
| 990010000005 | Edge-Gestopt-M | `GESTOPT` | niet zichtbaar in werkbord |
| 990010000006 | Edge-NieuwPotent-M | `NIEUW_POTENTIEEL` | spelerpool |
| 990010000007 | Edge-NieuwDef-M | `NIEUW_DEFINITIEF` | spelerpool |
| 990010000008 | Edge-AlgReserve-V | `ALGEMEEN_RESERVE` | spelerpool, niet aan team koppelbaar |
| 990010000009 | Edge-Recreant-M | `RECREANT` | recreanten-team |
| 990010000010 | Edge-NietSpelend-V | `NIET_SPELEND` | niet zichtbaar in werkbord |

### 1.4 Leeftijds-grens scenario's

Korfballeeftijd op exact de KNKV-overgangen (peildatum 1 januari, kalenderjaar-aware):

| `rel_code` | Naam | Geboortedatum | Korfballeeftijd peildatum 2026-2027 | Categorie |
|---|---|---|---|---|
| 990020000001 | Edge-GrensKangoer-V | 2020-01-01 | 6.x | Kangoeroe / Blauw-1 |
| 990020000002 | Edge-GrensBlauw-V | 2018-01-01 | 8.x | Blauw / Groen-1 |
| 990020000003 | Edge-GrensGroen-M | 2016-01-01 | 10.x | Groen / Geel-1 |
| 990020000004 | Edge-GrensGeel-M | 2014-01-01 | 12.x | Geel / Oranje-1 |
| 990020000005 | Edge-GrensOranje-V | 2012-01-01 | 14.x | Oranje / Rood-1 |
| 990020000006 | Edge-GrensRood-V | 2010-01-01 | 16.x | Rood / U17-1 |
| 990020000007 | Edge-GrensU17-M | 2008-01-01 | 18.x | U17 / U19-1 |
| 990020000008 | Edge-GrensU19-M | 2006-01-01 | 20.x | U19 / Senior-1 |

### 1.5 Data-incomplete scenario's

| `rel_code` | Naam | Ontbreekt | Verwacht gedrag |
|---|---|---|---|
| 990030000001 | Edge-GeenGB-V | `geboortedatum = null` | Spelerpool toont "—", filter "Zonder team" toont speler |
| 990030000002 | Edge-GeenGesl-? | `geslacht = null` | Team-validatie negeert sexe-balans voor deze speler |
| 990030000003 | Edge-GeenNaam-M | `roepnaam = ""` | UI valt terug op `relCode` als label |

### 1.6 Multi-team / illegaal-state

| `rel_code` | Scenario | Verwachting |
|---|---|---|
| 990040000001 | Speler in **2** teams in zelfde versie | KNKV-validator markeert beide teams `ROOD` met melding "dubbel ingedeeld" |
| 990040000002 | Speler in pool **én** team-toewijzing | Werkbord toont in team; pool filtert hem eruit |

### 1.7 What-if versie scenario's

Op werkindeling `wi-edge-cases-2026-2027`:

| Versie | Inhoud |
|---|---|
| `versie-edge-actief` | Basis-indeling, alle scenario's hierboven |
| `versie-edge-whatif-conflict` | What-if: `Edge-Beschikbaar-V` verhuisd van Senioren A → Senioren B, terwijl ze in actieve versie nog op A staat |
| `versie-edge-leeg` | What-if zonder spelers (lege canvas) |

---

## 2. Memo (later uit te werken)

> Wacht op: dedicated `memo.spec` harde assertions. Voorlopig dekt huidige test-DB de basics.

Reservering voor uitbreiding (te bevestigen vóór seed):
- Werkitem per `WerkitemStatus`-waarde (5 stuks)
- Werkitem per `WerkitemPrioriteit`-waarde (5 stuks)
- Werkitem per `WerkitemType` (7 stuks)
- Memo op team / op speler / op doelgroep / op TC-niveau
- Memo met besluit + memo zonder besluit

---

## 3. Personen (later)

> Wacht op echte coverage in `personen.spec`. Voorlopig: de spelers uit sectie 1.3 (status-fixtures) zijn voldoende voor inline-status-edit en hover-kaart-tests, zodra die niet meer skippen.

---

## 4. Kader / Doelgroepen (later)

> Wacht op `kader.spec` (bestaat nog niet als E2E-spec).

Reservering:
- Kaders met `isWerkseizoen = true` (één per seizoen) en met `isWerkseizoen = false`
- `KadersSpeler` met elke `GezienStatus`-waarde (5 stuks)
- `KadersBesluit` per `BesluitStatus` (3 stuks)

---

## 5. Sportlink-sync

> Bewust **niet** seeden — Sportlink-sync hoort tegen echte Sportlink-API getest te worden (afzonderlijke smoke-test). Edge-case fixtures hier zouden de sync-logica vervuilen.

---

## Implementatie

### Fase 1 — Catalogus (DIT document)
✅ Bron-of-truth voor wat aanwezig moet zijn.

### Fase 2 — Seed-script
`scripts/seed-edge-cases.ts` (nog te bouwen) — idempotent, draait via:
```bash
DATABASE_URL=<test-db-url> pnpm tsx scripts/seed-edge-cases.ts
```
Wat het doet:
1. Upsert `wi-edge-cases-2026-2027` werkindeling
2. Upsert `versie-edge-actief` + 2 what-if versies
3. Upsert teams 1.1–1.2 (8 teams)
4. Upsert spelers 1.3–1.5 (~25 spelers, allen in `99xxxxxxxxxx` bereik)
5. Toewijzingen team-speler volgens scenario-tabel
6. Speciaal: 1.6.1 maakt **bewust** dubbele toewijzing zodat validator-test daarop kan checken

### Fase 3 — Tests harden
- Vervang `test.skip(true, "geen data")` in `personen.spec`, `werkbord.spec`, `memo.spec` door `expect()` op de gegarandeerde fixtures
- Bv. `expect(page.locator('[data-testid="speler-card-990010000003-spelerpool"]')).toBeVisible()` voor de geblesseerde speler
- Skip-rate moet dalen naar <10%

### Fase 4 — Nightly-workflow
1 step toevoegen vóór de Playwright-run:
```yaml
- name: Seed edge-case test-data
  run: pnpm tsx scripts/seed-edge-cases.ts
  env:
    DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
```

---

## Mutatie-respons protocol

Bij elke wijziging die de test-state of testkeuze raakt, doorloop deze checklist:

### Schema-wijziging (Prisma migratie)

1. Migratie toevoegen via `pnpm db:migrate` (NOOIT `db:push`)
2. Run `pnpm tsx scripts/seed/coverage-check.ts` lokaal — als rood:
   - Voor elke ontbrekende enum-waarde: voeg een rij toe aan de juiste sectie van deze catalogus
   - Voeg fixture toe aan `scripts/seed/seed-*.ts`
3. Run `pnpm tsx scripts/seed-edge-cases.ts` lokaal tegen test-DB — bevestig geen Prisma-errors
4. Commit alles in één PR (`patch: schema X + catalog + seed`)

### Nieuwe UI met `data-testid` of `data-testid`-conventie

1. Component toevoegen met `data-testid` volgens conventie (zie skill `e2e-studio-test`)
2. Catalogus uitbreiden als er nieuwe scenario-fixture nodig is
3. Spec uitbreiden met `expect(page.locator('[data-testid="..."]')).toBeVisible()`
4. Lokaal verifieren met `--headed`

### Nieuwe server-action met mutatie

1. Action implementeren — als er een DB-write is, log `AgentMutatie` (zie `verplaats-speler.ts` als referentie)
2. Voeg nieuwe `type`-waarde toe in `AgentMutatie.type` (string-veld, geen enum)
3. Cleanup-endpoint uitbreiden in `apps/ti-studio-v2/src/app/api/agent/cleanup/route.ts` — switch over type
4. Test schrijven die de actie uitvoert en cleanup verifieert

---

## Beslissingen (2026-05-18)

| Onderwerp | Beslissing |
|---|---|
| Schaal | **Volledig** — 25 teams, ~150 spelers + 25 expliciete edge-fixtures = ~175 spelers totaal |
| Reset-cadans | **Vóór elke E2E workflow-run** (nightly + on-demand). Workflow-step `pnpm tsx scripts/seed-edge-cases.ts` voor de Playwright-step |
| `rel_code`-bereik | `9900xxxxxxxx` (12 cijfers, `9900` prefix) |
| Werkindeling | Bestaande op `oranjewit-test` hergebruiken, seed-script upsert |
| Productie-snapshot op test-DB | **Wordt vervangen** door synthetische state — geen hybride |
| Multi-team scenario (sectie 1.6) | Permanent in test-DB (synthetisch, geen privacy-issue meer) |
| Volgorde | Seed eerst (anders breken alle bestaande tests bij wipe), dan specs aanpassen om op fixtures te wijzen |
| Sportlink-sync testen | Apart: niet via `oranjewit-test`, eigen smoke-test (later in te richten) |

## Seed-update flow voor agents/devs

Nieuwe scenario toevoegen aan test-data = single-PR met drie files:

1. `docs/kennis/edge-case-testdata.md` — voeg fixture toe aan juiste sectie + tabel
2. `scripts/seed-edge-cases.ts` — voeg upsert-call toe in juiste sectie van het script
3. `e2e/ti-studio-v2/<spec>.spec.ts` — voeg test toe die de fixture verifieert (optioneel, maar aanbevolen)

Bij merge naar main → volgende E2E workflow-run wipe + reseed automatisch → nieuwe fixture is meteen aanwezig in test-DB → test draait er meteen op.

**Eis aan seed-script:** elke sectie van de catalogus moet 1-op-1 aanwezig zijn als functie in het script, in dezelfde volgorde, met dezelfde sectienaam in kommentaar. Maakt traceability triviaal.

---

## Verwijzingen

- Prisma schema: `packages/database/prisma/schema.prisma`
- Kennisdoc E2E: `docs/kennis/e2e-testen-tegen-studio-test.md`
- Skill: `.claude/skills/e2e-studio-test/SKILL.md`
- Werkende referentie: `e2e/ti-studio-v2/werkbord-dragdrop.spec.ts`
- Korfballeeftijd-helpers: `packages/types/src/korfballeeftijd.ts`
