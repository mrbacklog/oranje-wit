# Design: Staf-datamodel

**Datum**: 2026-02-27
**Status**: Goedgekeurd

## Doel

Historische stafdata opnemen in de database, vergelijkbaar met hoe competitie-spelers zijn opgebouwd. Stafleden krijgen een eigen identiteit (stafCode) met optionele koppeling naar de leden-tabel (relCode). Het bestaande Staf-model voor Team-Indeling wordt uitgebreid als identiteitslaag.

## Beslissingen

1. **Uitbreiden, niet vervangen** — Het bestaande `Staf`-model wordt de identiteitslaag voor beide domeinen (historisch + TI)
2. **Eigen staf-code** — Format `STAF-001` t/m `STAF-456`, onafhankelijk van Sportlink. `relCode` is optioneel (328 van 430 personen hebben een match)
3. **Eén tabel voor toewijzingen** — `StafToewijzing`: 1 record per staflid per team per seizoen, elk met eigen rol
4. **Duidelijk onderscheid** — `StafToewijzing` (historisch, Monitor) vs. `TeamStaf` (actief, TI)

## Datamodel

### Staf (uitgebreid, identiteitslaag)

| Veld | Type | Nieuw? | Doel |
|---|---|---|---|
| `id` | String (cuid) | bestaand | PK |
| `stafCode` | String, unique | nieuw | Eigen code `STAF-001` |
| `relCode` | String?, optional | nieuw | Koppeling naar `leden`-tabel |
| `naam` | String | bestaand | Weergavenaam |
| `geboortejaar` | Int? | bestaand | |
| `email` | String? | bestaand | |
| `rollen` | String[] | bestaand | Alle rollen ooit |
| `notitie` | String? | bestaand | Vrij tekstveld (TI) |

### StafToewijzing (nieuw)

| Veld | Type | Doel |
|---|---|---|
| `id` | Int, autoincrement | PK |
| `stafId` | String (FK → Staf) | Wie |
| `seizoen` | String | "2024-2025" |
| `team` | String | "A1", "B2", etc. |
| `rol` | String | "Trainer/Coach", "Begeleider", "Verzorger" |
| `functie` | String? | Originele functietekst uit CSV |
| `bron` | String | "staf_overzicht" |

Constraint: `@@unique([stafId, seizoen, team])`

### Relatie met bestaande modellen

```
Staf (identiteit, ~456 personen)
  ├── StafToewijzing (historisch, Monitor-domein, ~1022 records)
  │     staf + seizoen + team + rol
  │     "wie deed wat wanneer"
  │
  ├── TeamStaf (actief, TI-domein, ongewijzigd)
  │     staf + team + rol (binnen huidige blauwdruk)
  │     "wie zit nu bij welk team"
  │
  └── Pin (TI-domein, ongewijzigd)
        staf kan gepind worden op positie
```

## Voorbeeld

Lucien Louwman (STAF-001, relCode: null — externe trainer):

```
StafToewijzing: 2010-2011, S1, Trainer/Coach
StafToewijzing: 2010-2011, S2, Trainer/Coach
StafToewijzing: 2011-2012, A1, Trainer/Coach
```

## Databronnen

- **CSV**: `docs/staf/Staf overzicht.csv` — 1022 records, 456 unieke namen, 15 seizoenen
- **Matching**: `scripts/js/match-staf.js` — 328 namen gematcht met rel_code (76.3%)
- **Niet-leden**: 84 externe stafleden zonder rel_code (ouders, externe trainers)
- **Overgeslagen**: 26 niet-persoon entries (vacatures, carrousel, etc.)

## Import-pipeline

```
CSV (docs/staf/Staf overzicht.csv)
  ↓ sync-staf.js (nieuw)
  ├── Staf tabel (upsert: stafCode + naam + optioneel relCode)
  └── StafToewijzing tabel (upsert: staf + seizoen + team + rol)
```

Het bestaande `match-staf.js` levert de naam→relCode mapping voor het import-script.

## Lees/schrijf-verdeling

- **Monitor schrijft**: Staf (identiteit), StafToewijzing (historisch)
- **Monitor leest**: StafToewijzing (dashboards, trends)
- **Team-Indeling schrijft**: TeamStaf (actieve teamkoppeling)
- **Team-Indeling leest**: Staf (identiteit)
