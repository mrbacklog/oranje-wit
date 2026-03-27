# Overzicht Vaardigheidsraamwerk v3.0

> **Doel:** Architectuuroverzicht in 10 minuten. Voor detail: zie `vaardigheidsraamwerk-v3.md`.
> **Versie:** 3.0 | **Datum:** 2026-03-26

---

## 1. Het model in 1 minuut

Het vaardigheidsraamwerk beschrijft hoe c.k.v. Oranje Wit jeugdspelers beoordeelt van 4 tot 18 jaar. Het kernidee: de **Pijlerevolutie** (Inside Out). De spelerskaart groeit mee met het kind -- van 5 simpele pijlers bij de jongsten naar 9 gespecialiseerde pijlers bij de oudsten.

```
PAARS  (4-5):   — observatienotitie, geen pijlers
BLAUW  (5-7):   5  BAL . BEWEGEN . SPEL . SAMEN . IK
GROEN  (8-9):   5  BAL . BEWEGEN . SPEL . SAMEN . IK
GEEL  (10-12):  6  AANVALLEN . VERDEDIGEN . TECHNIEK . TACTIEK . MENTAAL . FYSIEK
ORANJE (13-15): 7  + SOCIAAL
ROOD  (16-18):  9  + SCOREN + SPELINTELLIGENTIE
```

Elke leeftijdsgroep heeft een **kernset** (~10 items) voor snelle beoordeling en optionele **verdiepingsitems** voor diepgaande scouting.

## 2. Architectuur: vast vs. dynamisch

### VAST (niet wijzigbaar door TC)

- Pijlernamen en hun toewijzing per leeftijdsgroep
- Schaal per leeftijdsgroep (zie tabel hieronder)
- Scoreberekening: pijlerscore = gemiddelde van ingevulde items
- USS-berekening: gewogen gemiddelde van pijlerscores, vertaald naar 0-200
- Het Inside Out principe: welke pijlers bij welke leeftijd verschijnen
- De Primaire Observatie Regel (POR): elk item hoort bij precies een pijler

### DYNAMISCH (wijzigbaar door TC via admin/beheer)

- Items per pijler: toevoegen, verwijderen, herformuleren
- Kern- of verdiepingsmarkering per item
- Volgorde van items binnen een pijler
- Formuleringen aanpassen (zolang het observeerbaar gedrag blijft)

### VALIDATIEREGELS (bewaken de samenhang)

- Elk item hoort bij precies een pijler
- Elke pijler heeft minimaal 1 kern-item
- Kern-items per leeftijdsgroep: minimaal 8, maximaal 12
- Verdiepingsitems: geen maximum
- Voorloper/opvolger: elk item bij een hogere leeftijdsgroep heeft een logische voorloper

## 3. Pijlerevolutie -- overzicht

| Groep | Leeftijd | Pijlers | Kern | Verdieping | Totaal | Schaal |
|-------|----------|---------|------|------------|--------|--------|
| Paars | 4-5 | -- | 3 observaties | -- | 3 | Geobserveerd |
| Blauw | 5-7 | BAL, BEWEGEN, SPEL, SAMEN, IK | 10 | -- | 10 | Ja / Nog niet |
| Groen | 8-9 | BAL, BEWEGEN, SPEL, SAMEN, IK | 10 | +4 | 14 | Goed / Oke / Nog niet |
| Geel | 10-12 | AANVALLEN, VERDEDIGEN, TECHNIEK, TACTIEK, MENTAAL, FYSIEK | 10 | +15 | 25 | 1-5 sterren |
| Oranje | 13-15 | + SOCIAAL | 10 | +30 | 40 | Slider 1-10 |
| Rood | 16-18 | + SCOREN, + SPELINTELLIGENTIE | 9 | +51 | 60 | Slider 1-10 |

De overgangen:
- **Blauw naar Groen:** geen pijlerwijziging, meer items, fijnere schaal
- **Groen naar Geel:** DE GROTE STAP -- 5 kindpijlers worden 6 korfbalpijlers
- **Geel naar Oranje:** SOCIAAL splitst af van MENTAAL (+1)
- **Oranje naar Rood:** SCOREN splitst af van AANVALLEN, SPELINTELLIGENTIE splitst af van TACTIEK (+2)

## 4. Kern-items per leeftijdsgroep

### Blauw (5-7) -- 10 kern-items

| Pijler | Item | Formulering |
|--------|------|-------------|
| BAL | `bal_gooien` | Kan de bal gooien naar een ander |
| BAL | `bal_vangen` | Kan de bal vangen |
| BEWEGEN | `bew_rennen` | Rent en stopt zonder te vallen |
| BEWEGEN | `bew_richting` | Kan van richting veranderen |
| BEWEGEN | `bew_energie` | Beweegt graag en veel |
| SPEL | `spel_balbezit` | Begrijpt "wij/zij hebben de bal" |
| SAMEN | `sam_samenspelen` | Speelt samen, geeft de bal af |
| SAMEN | `sam_luisteren` | Luistert naar de trainer |
| IK | `ik_durft` | Durft mee te doen |
| IK | `ik_plezier` | Heeft zichtbaar plezier |

### Groen (8-9) -- 10 kern-items, 4 verdieping

| Pijler | Item | Formulering |
|--------|------|-------------|
| BAL | `bal_schieten` | Schiet op de korf |
| BAL | `bal_gooien_vangen` | Kan goed gooien en vangen |
| BEWEGEN | `bew_vrijlopen` | Loopt vrij van de tegenstander |
| BEWEGEN | `bew_snel` | Is snel en beweeglijk |
| SPEL | `spel_schotkeuze` | Schiet als er ruimte is |
| SPEL | `spel_meelopen` | Verdedigt actief (loopt mee) |
| SAMEN | `sam_samenspelen` | Speelt samen in aanval |
| SAMEN | `sam_communicatie` | Praat met teamgenoten bij verdedigen |
| IK | `ik_doorzetten` | Probeert opnieuw na een mislukte actie |
| IK | `ik_omgaan_verliezen` | Gaat goed om met verliezen |

### Geel (10-12) -- 10 kern-items, 15 verdieping

| Pijler | Item | Formulering |
|--------|------|-------------|
| AANVALLEN | `aan_vrijlopen` | Loopt slim vrij van de tegenstander |
| AANVALLEN | `aan_balbezit` | Houdt de bal vast onder druk |
| VERDEDIGEN | `ver_dekken` | Dekt de tegenstander goed af |
| VERDEDIGEN | `ver_bal_veroveren` | Probeert de bal te veroveren |
| TECHNIEK | `tec_schieten` | Schiet goed van afstand |
| TECHNIEK | `tec_passen` | Gooit technisch goed over |
| TACTIEK | `tac_schotkeuze` | Kiest het juiste moment om te schieten |
| MENTAAL | `men_inzet` | Laat zichtbare inspanning zien |
| MENTAAL | `men_plezier` | Lacht, moedigt aan, komt graag |
| FYSIEK | `fys_snelheid` | Is snel in korte sprints |

### Oranje (13-15) -- 10 kern-items, 30 verdieping

| Pijler | Item | Formulering |
|--------|------|-------------|
| AANVALLEN | `aan_vrijlopen` | Loopt op het juiste moment vrij |
| AANVALLEN | `aan_1op1` | Wint individuele duels in aanvalsverband |
| VERDEDIGEN | `ver_dekken` | Dekt de directe tegenstander strak af |
| VERDEDIGEN | `ver_omschakeling` | Schakelt direct terug na balverlies |
| TECHNIEK | `tec_schieten` | Schiet geplaatst van afstand |
| TACTIEK | `tac_besluitvorming` | Maakt de juiste keuze: schieten, passen of vasthouden |
| MENTAAL | `men_inzet` | Geeft maximale inzet, ook bij achterstand |
| MENTAAL | `men_plezier` | Laat zien plezier te hebben, ook bij verlies |
| SOCIAAL | `soc_communicatie` | Communiceert duidelijk met medespelers |
| FYSIEK | `fys_snelheid` | Is explosief snel in sprints |

### Rood (16-18) -- 9 kern-items, 51 verdieping

| Pijler | Item | Formulering |
|--------|------|-------------|
| AANVALLEN | `aan_vrijlopen` | Creert ruimte door slim vrij te lopen |
| VERDEDIGEN | `ver_dekken` | Dekt strak en gedisciplineerd |
| SCOREN | `sco_afstandsschot` | Schiet krachtig en geplaatst van afstand |
| TECHNIEK | `tec_passen` | Geeft strakke, zuivere passes op snelheid |
| TACTIEK | `tac_besluitvorming` | Maakt onder druk de juiste keuze |
| SPELINTELLIGENTIE | `spi_spellezing` | Leest het spel en anticipeert |
| MENTAAL | `men_inzet` | Geeft maximale inzet ongeacht stand of belang |
| SOCIAAL | `soc_communicatie` | Communiceert continu en duidelijk op het veld |
| FYSIEK | `fys_snelheid` | Is explosief snel over de eerste meters |

## 5. De 3 methoden

| Methode | Wie/wat | Items | Tijd | Typische situatie |
|---------|---------|-------|------|-------------------|
| **TEAM** | Alle spelers, kernset | ~10 per speler | ~1 min/speler | Trainer-evaluatie, teamscan |
| **INDIVIDUEEL** | 1 speler, kern + verdieping | Alle items | 5-18 min | Diepgaande scouting, doorstroombeslissing |
| **VERGELIJKING** | 2-6 spelers, pijlerscores op balk | Pijlerscores | ~2 min/groep | Selectiebeslissingen, grensgevallen |

**Cross-validatie:** Als een trainer (TEAM-methode) en een scout (INDIVIDUEEL) dezelfde speler beoordelen, vergelijkt het systeem automatisch de pijlerscores. Bij meer dan 2 punten verschil signaleert het systeem dit.

## 6. Spelerskaart per leeftijd

### Blauw/Groen -- 1 blok, 5 pijlers

```
BAL         ██████████  100%
BEWEGEN     ████████░░   75%
SPEL        ██████░░░░   50%
SAMEN       ██████████  100%
IK          ██████████  100%
```

### Geel -- 2 blokken, 6 pijlers

```
━━ KORFBALACTIES ━━━━━━━━━━━━━━━━
AANVALLEN    ★★★★☆   4.0
VERDEDIGEN   ★★★½☆   3.5

━━ SPELERSKWALITEITEN ━━━━━━━━━━━
TECHNIEK     ★★★☆☆   3.0
TACTIEK      ★★★★☆   4.0
MENTAAL      ★★★★★   5.0
FYSIEK       ★★★★☆   4.0
```

### Oranje/Rood -- 3 blokken

```
━━ KORFBALACTIES ━━━━━━━━━━━━━━━━
AANVALLEN       ████████░░   7.8
VERDEDIGEN      ██████████   9.2
SCOREN          ███████░░░   7.2    ← alleen Rood

━━ SPELERSKWALITEITEN ━━━━━━━━━━━
TECHNIEK        ███████░░░   6.8
TACTIEK         ████████░░   8.1
SPELINTELLIGENTIE █████████░ 8.5   ← alleen Rood

━━ PERSOONLIJK ━━━━━━━━━━━━━━━━━━
MENTAAL         █████████░   8.8
SOCIAAL         ████████░░   7.6
FYSIEK          ████████░░   7.6
───────────────────────────────
USS OVERALL                  81
```

## 7. Groei en Inzet

| Begrip | Hoe het werkt |
|--------|---------------|
| **Niveau** | De pijlerscores zelf ZIJN het niveau. Geen apart veld. |
| **Inzet** | Kern-item bij MENTAAL (`men_inzet`), altijd ingevuld bij elke methode. |
| **Groei** | Twee mechanismes: (1) automatisch verschil tussen meetmomenten, (2) trainer-observatie als apart veld (Geen / Weinig / Normaal / Veel). |

## 8. Overgang van huidige evaluatie-app

| Huidig (evaluatie-app) | Nieuw (scoutingssysteem) |
|------------------------|-------------------------|
| Niveau 1-5 | Pijlerscores (afgeleid uit kern-items) |
| Inzet 1-3 | `men_inzet` kern-item (schaal past bij leeftijdsgroep) |
| Groei 1-4 | Automatisch (score-historie) + trainer-observatie |
| Opmerking | Vrij tekstveld (ongewijzigd) |

Het huidige simpele model (3 scores + opmerking) wordt vervangen door een rijker beeld via pijlerscores. De drempel voor trainers blijft laag: de TEAM-methode met ~10 kern-items kost ~1 minuut per speler.

## 9. Fysiek profiel (contextdata, vanaf Geel)

| Veld | Schaal |
|------|--------|
| Lengte (relatief) | Onder gemiddeld / Gemiddeld / Bovengemiddeld / Uitzonderlijk |
| Lichaamsbouw | Licht / Gemiddeld / Stevig |
| Atletisch type | Onder gemiddeld / Gemiddeld / Bovengemiddeld / Uitzonderlijk |

Geen USS-impact. Helpt de TC om late rijpers niet over het hoofd te zien. Bij Oranje (13-15) zijn de fysieke verschillen door biologische rijping enorm -- fysieke scores altijd koppelen aan het profiel.

## 10. Sociale veiligheid (signaalvlag, alle leeftijden)

| Groep | Type | Schaal |
|-------|------|--------|
| Blauw/Groen | Signaalvlag | Ja / Nee |
| Geel | Scorend item (`soc_veiligheid`) | 1-5 sterren |
| Oranje/Rood | Scorend item (`soc_veiligheid`) | Slider 1-10 |

**Alarmsignaal:** als het antwoord "Nee" is of de score 1-3, worden alle andere scores minder relevant. Prioriteit: bespreek sociale veiligheid met de trainer.

## 11. Documentenlijst

Alle onderliggende documenten staan in `docs/jeugdontwikkeling/`:

- `vaardigheidsraamwerk-v3.md` -- het volledige raamwerk (alle items, regels, bijlagen)
- `panel-pijlerevolutie.md` -- panelbesluit 5 naar 6 pijlers
- `panel-paars-en-toetsing.md` -- Paars-besluit + wetenschappelijke toetsing
- `panel-pijlerstructuur.md` / `panel-discussie-v1.2.md` -- eerdere paneldiscussies
- `items-korfbalacties.md` / `items-persoonlijk.md` -- itemuitwerkingen
- `profiel-top-talent-18.md` -- ideaalprofiel 18-jarige topspeler
- `toelichtingspaginas.md` -- in-app uitleg per leeftijdsgroep
- `research-*.md` -- wetenschappelijke onderbouwing (4 documenten)
- `vaardigheidsraamwerk-v1*.md` / `v2*.md` -- eerdere versies
