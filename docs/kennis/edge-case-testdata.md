# Edge-case test-data — Catalogus voor E2E-validatie

> **Doel:** alle scenario's en edge cases die E2E-tests (en visuele inspectie) moeten kunnen valideren in een **gegarandeerd aanwezige** testdataset zetten, zodat tests harde assertions doen i.p.v. graceful skip.
>
> **Datum:** 2026-05-18 · **Status:** levend document, gegroeid bij elke nieuwe spec-coverage

---

## Aanpak

1. **Synthetisch `rel_code`-bereik:** `9900-9999-NNNN` (12 cijfers met `9900` prefix). Buiten Sportlink-bereik, gegarandeerd geen conflict met productie-data.
2. **Idempotent seed:** alle fixtures worden door `scripts/seed-edge-cases.ts` aangemaakt of bijgewerkt — script kan elk moment opnieuw draaien zonder duplicaten.
3. **Tests gebruiken exact deze `rel_code`'s of `data-testid`'s** — geen "eerste rij in de tabel" assumpties.
4. **Niet-test data:** Sportlink-snapshot blijft de werkelijke bulk; edge-case fixtures zijn additief.
5. **Aparte test-werkindeling:** alle scenario's leven in werkindeling `wi-edge-cases-2026-2027`, niet in de productie-werkindeling.

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

## Open vragen voor Antjan vóór seed-script

1. **`rel_code` bereik:** akkoord met `9900-xxxx-xxxx`? Of liever ander prefix (bv. `9999`)?
2. **Werkindeling-naam:** `wi-edge-cases-2026-2027` of pak liever de naam over van de huidige test-werkindeling?
3. **Reset-strategie:** seed-script moet de fixtures bij elke run **upsertten** (idempotent) maar wat doen we als productie-snapshot wordt versterkt? Behouden of mee-resetten?
4. **Multi-team scenario (1.6.1):** willen we daadwerkelijk een illegale state in test-DB hebben staan, of liever simuleren we het in de test zelf (toewijzing toevoegen + cleanup)? Mijn voorkeur: in test-DB laten staan zodat validator-coverage hard is.
5. **Volgorde Fase 2/3:** seed eerst en daarna tests, of TDD-stijl (tests die op fixtures wijzen schrijven, dan seed bouwen tot ze groen worden)?

---

## Verwijzingen

- Prisma schema: `packages/database/prisma/schema.prisma`
- Kennisdoc E2E: `docs/kennis/e2e-testen-tegen-studio-test.md`
- Skill: `.claude/skills/e2e-studio-test/SKILL.md`
- Werkende referentie: `e2e/ti-studio-v2/werkbord-dragdrop.spec.ts`
- Korfballeeftijd-helpers: `packages/types/src/korfballeeftijd.ts`
