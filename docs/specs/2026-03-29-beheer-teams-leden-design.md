# Design: Beheer/Teams & Leden — CSV Sync

**Datum**: 2026-03-29
**Status**: Goedgekeurd
**Scope**: Twee CSV-importfuncties in Beheer + signalering

---

## 1. Probleem

De TC moet regelmatig ledendata en teamindelingen synchroniseren vanuit Sportlink. Dit gebeurt nu via CLI-scripts met een vaste kolomvolgorde. Er is geen UI in Beheer, en kolomvolgorde in Sportlink-exports kan variëren.

## 2. Oplossing

Eén pagina in Beheer (`/beheer/teams`) met twee importfuncties. Beide werken hetzelfde patroon: CSV uploaden → kolommen herkennen op naam → diff tonen → verwerken → signaleren.

---

## 3. Import 1: Leden synchroniseren

**Input**: Sportlink "alle leden" CSV (semicolon-delimited)
**Doel**: `leden` tabel bijwerken

### Verplichte kolommen (op naam, niet positie)

| Kolom in CSV | Veld in database | Reden |
|-------------|-----------------|-------|
| `Rel. code` | `relCode` (PK) | Enige sleutel |
| `Roepnaam` | `roepnaam` | Weergave |
| `Achternaam` | `achternaam` | Weergave |
| `Tussenvoegsel(s)` | `tussenvoegsel` | Volledige naam |
| `Geslacht` | `geslacht` | Teamindeling, KNKV-regels |
| `Geb.dat.` | `geboortedatum` + `geboortejaar` | Leeftijd, categorie, bandbreedte |
| `Lid sinds` | `lidSinds` | Retentieanalyse |
| `Afmelddatum` | `afmelddatum` | Detectie wie stopt |
| `E-mailadres` | `email` | Evaluatie-uitnodigingen |
| `Lidsoort` | `lidsoort` | Bondslid vs niet-spelend |

Kolommen die niet nodig zijn (genegeerd bij import): `Naam`, `Voorletter(s)`, `Leeftijdscategorie`, `Lokale teams`, `Spelactiviteiten (vereniging)`, `Spelactiviteiten (bond)`, `Registratie in Sportlink`.

### Flow

1. Upload CSV (drag & drop of klik)
2. Systeem zoekt kolommen op naam in de header-rij
3. Bij ontbrekende verplichte kolom → foutmelding met welke kolom mist
4. Preview: "412 leden gevonden in CSV"
5. Diff met database:
   - **Nieuw** (groen): leden met rel_code die niet in DB staan
   - **Gewijzigd** (oranje): leden met gewijzigde velden (toont welke velden)
   - **Afgemeld** (rood): leden in DB met lege afmelddatum, maar in CSV met afmelddatum gevuld
   - **Verdwenen** (grijs): leden in DB die niet in CSV staan (informatief, niet automatisch verwijderen)
6. Eén klik: "Verwerken" → upsert in database
7. Signalering genereren (zie sectie 5)

---

## 4. Import 2: Teams snapshot

**Input**: Sportlink "Teams" CSV (semicolon-delimited)
**Doel**: `competitie_spelers` tabel bijwerken, staf registreren

### Verplichte kolommen (op naam, niet positie)

| Kolom in CSV | Gebruik | Reden |
|-------------|---------|-------|
| `Rel. code` | Koppeling naar `leden` | Enige sleutel |
| `Team` | Teamnaam (J5, J12, Sen 1) | Team-toewijzing |
| `Teamrol` | "Teamspeler" of "Technische staf" | Onderscheid speler vs staf |
| `Functie` | "Hoofd coach", "Assistent", etc. | Stafrol vastleggen |
| `Teamsoort` | "Bond" of "Lokaal" | Filter |
| `Geslacht` | M/V | Validatie teamsamenstelling |
| `Geb.dat.` | Geboortedatum | Leeftijdscheck |

Kolommen die niet nodig zijn (stamgegevens staan al in `leden`): `Naam`, `Roepnaam`, `Tussenvoegsel(s)`, `Achternaam`, `Lidsoort`, `E-mailadres`, `Lid sinds`.

### Flow

1. Upload CSV
2. Systeem herkent kolommen op naam
3. Gebruiker kiest:
   - **Seizoen** (bijv. 2025-2026)
   - **Competitieperiode** (veld_najaar / zaal / veld_voorjaar)
4. Preview: "223 personen in 18 teams (195 spelers, 28 staf)"
5. Validatie:
   - Rel_codes die niet in `leden` staan → waarschuwing ("3 onbekende rel_codes — eerst leden synchroniseren?")
   - Niet-blokkerende waarschuwing, import kan doorgaan
6. Diff met vorige snapshot van deze competitieperiode (als die bestaat):
   - Teamwisselingen: "Lisa Exalto: J5 → J3"
   - Nieuwe spelers in teams
   - Spelers die niet meer in een team zitten
7. Eén klik: "Snapshot opslaan"
8. Resultaat: onwijzigbaar historisch record in `competitie_spelers`

---

## 5. Signalering bij wijzigingen

Bij elke import worden wijzigingen gedetecteerd die effect hebben op de teamindeling:

| Wijziging | Signaal | Effect op Speler-status (TI) |
|-----------|---------|------------------------------|
| Lid heeft afmelddatum gekregen | "Speler X staat als afgemeld in Sportlink" | Status → `GAAT_STOPPEN` |
| Nieuw lid in leden tabel | "Nieuw lid Y (geboortejaar Z, geslacht)" | Status → `NIEUW_POTENTIEEL` |
| Lid verdwenen uit CSV | "Speler X niet meer in Sportlink export" | Informatief (niet automatisch wijzigen) |
| Teamwissel in snapshot | "Speler X van team A naar team B" | Informatief |
| Onbekende rel_code in teams CSV | "Rel. code ABC niet gevonden in leden" | Waarschuwing |

Signaleringen worden:
- Direct getoond na de import (in de resultaat-pagina)
- Opgeslagen zodat ze in het Beheer-dashboard zichtbaar blijven
- Doorvertaald naar Speler-status als dat van toepassing is

---

## 6. Kolomherkenning

### Algoritme

1. Lees eerste regel van CSV als header
2. Split op `;` (semicolon-delimited, Sportlink standaard)
3. Strip quotes en whitespace van kolomnamen
4. Match kolomnamen case-insensitive tegen verwachte namen
5. Als alle verplichte kolommen gevonden → doorgaan
6. Als kolommen missen → toon foutmelding: "Ontbrekende kolommen: X, Y. Zorg dat deze kolommen in je Sportlink export staan."

### Robuustheid

- Kolomvolgorde maakt niet uit
- Extra kolommen worden genegeerd
- Geslacht: accepteer "Male"/"Female" (Teams CSV) en "Man"/"Vrouw" (Leden CSV) → normaliseer naar "M"/"V"
- Datums: accepteer ISO (2012-09-26) en NL (26-09-2012)

---

## 7. Technische structuur

### Gedeelde CSV-parser

Eén parser die op kolomnaam werkt, gebruikt door beide imports:

```
apps/web/src/lib/beheer/csv-parser.ts
  - parseCsvByColumnName(content, requiredColumns) → rows[]
  - detectCsvType(headers) → "leden" | "teams" | "onbekend"
```

### Server actions

```
apps/web/src/app/(beheer)/beheer/teams/actions.ts
  - previewLedenSync(csvContent) → { nieuw, gewijzigd, afgemeld, verdwenen }
  - verwerkLedenSync(csvContent) → { verwerkt, signaleringen }
  - previewTeamsSnapshot(csvContent, seizoen, competitie) → { teams, spelers, staf, diff }
  - verwerkTeamsSnapshot(csvContent, seizoen, competitie) → { opgeslagen, signaleringen }
```

### Pagina-structuur

```
/beheer/teams/                → Overzicht (bestaande pagina, uitbreiden)
/beheer/teams/sync/           → Import-pagina (twee tabs: Leden / Teams)
```

---

## 8. Signalering bij verouderde sync

Als de laatste leden-sync meer dan 4 weken geleden is → toon waarschuwing op het Beheer-dashboard: "Ledendata is X weken oud — synchroniseer met Sportlink."

---

## 9. Buiten scope

- Sportlink API integratie (te duur, geen volledige oplossing)
- Team CRUD (handmatig teams aanmaken/verwijderen — niet nodig, komt uit Sportlink)
- Team-historie browsen (nice-to-have, geen werkfunctie)
- Automatische CSV-download uit Sportlink (geen API beschikbaar)
