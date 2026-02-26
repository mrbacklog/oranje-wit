---
paths:
  - "data/**"
  - "**/*.json"
  - "**/*.csv"
---

# Data regels — Oranje Wit

## Privacy
- Schrijf nooit BSN, geboortedatum of adresgegevens naar logs of output
- Persoonsdata alleen opslaan in aangewezen data-mappen, nooit in code
- Bij twijfel: behandel alle ledendata als privacygevoelig
- Verrijkte snapshots bevatten **geen e-mailadressen** — alleen rel_code als identifier
- Verrijkte snapshots bevatten **alleen geboortejaar**, niet de volledige geboortedatum

## Drielagenmodel

Alle ledendata volgt het drielagenmodel:

1. **Raw** (`data/leden/snapshots/raw/`) — ongewijzigde bronbestanden, nooit bewerken na opslaan
2. **Verrijkt** (`data/leden/snapshots/YYYY-MM-DD.json`) — gecombineerd per lid, zonder privacy-gevoelige velden
3. **Aggregaties** (`data/aggregaties/`) — statistieken per geboortejaar, team, kleur

## Bestandsnaamgeving

### Ruwe bronbestanden
- Sportlink ledenexport: `data/leden/snapshots/raw/YYYY-MM-DD-sportlink-leden.csv`
- Sportlink teamexport: `data/leden/snapshots/raw/YYYY-MM-DD-sportlink-teams.csv`
- KNKV API teamdata: `data/leden/snapshots/raw/YYYY-MM-DD-knkv-teams.json`

### Verrijkte data
- Ledensnapshot: `data/leden/snapshots/YYYY-MM-DD.json`
- Snapshot diff: `data/leden/snapshots/YYYY-MM-DD-diff.json`
- Snapshot analyse: `data/leden/snapshots/YYYY-MM-DD-analyse.md`

### Aggregaties
- Per geboortejaar: `data/aggregaties/YYYY-MM-DD-per-geboortejaar.json`
- Per team: `data/aggregaties/YYYY-MM-DD-per-team.json`
- Per kleur: `data/aggregaties/YYYY-MM-DD-per-kleur.json`
- Per leeftijdsjaar: `data/aggregaties/analyse-per-leeftijd.json` — retentie, instroom, uitstroom (3-65 jaar)
- Instroom/uitstroom: `data/aggregaties/instroom-uitstroom-analyse.json` — per seizoen en per leeftijd

### Spelerspaden
- Longitudinale paden: `data/spelers/spelerspaden.json` — alle spelers over 16 seizoenen (2010-2026)

### Modellen
- Streef-ledenboog: `data/modellen/streef-ledenboog.json` — projecties huidig → 2028 → 2030

### Scripts
- Analysescripts: `scripts/` — Python scripts voor parsing, berekening en analyse

### Seizoensdata
- KNKV team-mapping: `data/seizoenen/YYYY-YYYY/teams-knkv.json` — directe KNKV API-output
- Teamregister: `data/seizoenen/YYYY-YYYY/teams.json` — centraal register met stabiele `ow_code` per team en periodegebonden J-nummers, pools, teamsterkte en gem. leeftijd
- Teamsterkte-invoer: `data/seizoenen/YYYY-YYYY/teamsterkte-<periode>.json` — simpel invoerbestand per periode
- Teamindelingen: `data/teams/history/YYYY-YYYY.json`
- Overige seizoensdata: `data/seizoenen/YYYY-YYYY/`

### ow_code (stabiele team-identiteit)
- B-categorie jeugd: kleurafkorting + volgnummer: R1, R2, O1, G1, Gr1, Bl1, etc.
- A-categorie en senioren: bestaande teamnaam: 1, MW1, U15-1, etc.
- Per seizoen opnieuw vastgesteld bij teamindeling, wijzigt niet binnen een seizoen
- J-nummers (J1, J2, ...) zijn KNKV-labels die per competitieperiode kunnen verschuiven
- Vier competitieperiodes: veld_najaar, zaal_deel1, zaal_deel2, veld_voorjaar

## Formaten
- Datums altijd als ISO 8601: YYYY-MM-DD
- Seizoenen altijd als: 2024-2025
- Categorieën altijd als: "a" of "b" (klein, KNKV-nomenclatuur)
- Geslacht altijd als: "M" of "V"
- Lidsoort altijd als: "bondslid" of "verenigingslid" (klein)
- Spelactiviteit altijd als: "korfbal", "niet-spelend", "biljart", "kangoeroe-klup", "algemeen-reserve"
- Sport-types altijd als: "veld-week" of "zaal-week" (klein, koppelteken)
- JSON-bestanden altijd pretty-printed (2 spaties inspringing)

## KNKV API
- Club ID: `NCX19J3`
- Base URL: `https://api-mijn.korfbal.nl/api/v2/`
- Pool-naam prefixen coderen de kleur (zie `docs/knkv-api.md`)
- API responses altijd opslaan als pretty-printed JSON in `raw/`
- Volledige documentatie: `docs/knkv-api.md`
