---
name: lid-monitor
description: Verwerkt nieuwe Sportlink CSV-data en updatet de leden-tabel in PostgreSQL. Signaleert trends in ledenaantallen per categorie. Gebruik doorlopend door het seizoen om vinger aan de pols te houden.
user-invocable: true
allowed-tools: Read, Write, Glob, WebFetch
argument-hint: "[optioneel: pad naar nieuwe Sportlink CSV's]"
---

# Leden Monitor

Verwerk nieuwe Sportlink CSV-data en update de leden-tabel direct in PostgreSQL.

## Context

Oranje Wit had in seizoen 2025-2026: 264 spelers, 29 teams. De Kweekvijver-filosofie is "Massa is Kassa" — lid worden én lid blijven.

## Databronnen

### Invoer (twee Sportlink CSV's + KNKV API)

- Sportlink ledenexport CSV
- Sportlink teamexport CSV
- KNKV teamdata: ophalen via `/oranje-wit:knkv-api` of uit `data/seizoenen/YYYY-YYYY/teams-knkv.json`

### Database (PostgreSQL)

- `leden` — permanente ledenrecords (1 per lid)
- `speler_seizoenen` — speler per seizoen met primair team
- `competitie_spelers` — speler per competitieperiode

## Stappen

1. **Ontvang Sportlink CSV's**
   Als $ARGUMENTS paden bevat, lees de CSV-bestanden in.

2. **Combineer Sportlink leden + teams**
   - Match leden aan teams via `Rel. code` (join-sleutel)
   - Filter op actieve korfballers (Spelactiviteiten bevat "Korfbal")
   - Strip privacy-gevoelige velden (e-mailadres, volledige geboortedatum)
   - Normaliseer: geslacht → "M"/"V", lidsoort → "bondslid"/"verenigingslid"

3. **Verrijk met KNKV API data en teamregister**
   - Laad `data/seizoenen/YYYY-YYYY/teams-knkv.json` (of haal op via API)
   - Match Sportlink teamnamen (J1, U15-1, etc.) aan KNKV teams
   - Voeg toe: kleur, pool (veld + zaal), categorie (a/b), competitieniveau
   - Laad `data/seizoenen/YYYY-YYYY/teams.json` (teamregister met stabiele ow_codes)
   - Bepaal actieve competitieperiode uit snapshot-datum (sep-nov → veld_najaar, dec-jan → zaal_deel1, feb-mrt → zaal_deel2, apr-jun → veld_voorjaar)
   - Match speler's J-nummer aan de ow_code via de actieve periode in teams.json
   - Voeg `ow_code` toe aan elk spelersrecord (stabiele team-identiteit die niet meebeweegt met KNKV J-nummerhernummering)

4. **Bereken afgeleide velden**
   - `geboortejaar` uit `Geb.dat.`
   - `leeftijd_peildatum` = peildatumjaar − geboortejaar
   - `a_categorie` en `a_jaars` uit geboortejaar + seizoen (formules uit `model/jeugdmodel.yaml`)
   - `status`: "actief" / "niet-spelend" / "afgemeld"

5. **Update leden-tabel in PostgreSQL**
   Upsert ledenrecords in de `leden` tabel op basis van `rel_code`. Update bestaande records, maak nieuwe aan voor nieuwe leden.

6. **Genereer aggregaties**
   Query de database voor aggregaties per geboortejaar, team en kleur.

7. **Toets aan streefmodel (`data/modellen/streef-ledenboog.json`)**
   Per geboortejaar (M/V apart):
   - Vergelijk huidig aantal met streef voor het relevante seizoen (2028 of 2030)
   - Bereken vulgraad: huidig / streef
   - Bepaal signaalkleur:
     - **Rood/kritiek** (< 60%): Actief werven, gerichte actie nodig
     - **Geel/aandacht** (60–80%): Monitoring verhogen, gericht werven
     - **Groen/op_koers** (> 80%): Op koers
   - Signaleer M/V-onevenwicht per geboortejaar (streef is 40%M / 60%V)

   Per band (Blauw t/m Rood):
   - Vergelijk band-totaal met streefmodel
   - Signaleer of het aantal teams op koers ligt

8. **Vergelijk met vorig seizoen (diff)**
   - Wie is erbij gekomen? (nieuw lid)
   - Wie is vertrokken? (afgemeld)
   - Wie is van team gewisseld?
   - Vergelijk via speler_seizoenen-records van huidig en vorig seizoen

9. **Signaleer trends**
   - Groei of krimp per categorie
   - Opvallende verschuivingen (instroom, uitstroom, overstap wedstrijd ↔ breedte)
   - Mogelijke impact op teamsamenstelling komend seizoen
   - Aandacht voor gender-balans (streef 40%M / 60%V per geboortejaar)
   - Positie t.o.v. groeipad: huidig → streef 2028 → streef 2030
   - Geboortejaren met grootste gap t.o.v. streefmodel uitlichten
   - Vergelijk seizoensretentie met verwachte retentie per leeftijdsjaar uit `model/jeugdmodel.yaml`
   - Raadpleeg `data/aggregaties/analyse-per-leeftijd.json` voor historische referentie per leeftijd

10. **Sla analyse op**
    Schrijf rapport naar `data/leden/YYYY-MM-DD-analyse.md`

## Output
Bondige samenvatting van trends met signalering per categorie en aanbevelingen voor opvolging.
