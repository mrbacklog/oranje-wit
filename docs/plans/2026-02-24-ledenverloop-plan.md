# Ledenverloop Skill — Implementatieplan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Nieuwe skill `/oranje-wit:ledenverloop` die retentie, instroom, uitstroom en KNKV-benchmarking analyseert, met JSON-output en standalone HTML dashboard.

**Architecture:** Plugin-skill (SKILL.md) die door de `data-analist` agent wordt uitgevoerd. De agent leest bestaande snapshots, doet de analyse, schrijft JSON-resultaten en genereert een standalone HTML dashboard met Chart.js. KNKV kwartaalcijfers worden uit PDF geparsed met handmatige JSON als fallback.

**Tech Stack:** Claude Code plugin (SKILL.md), JSON databestanden, standalone HTML + CSS + Chart.js v4

**Design doc:** `docs/plans/2026-02-24-ledenverloop-design.md`

---

## Task 1: Skill-bestand aanmaken

**Files:**
- Create: `skills/korfbal/ledenverloop/SKILL.md`

**Step 1: Maak skill directory**

```bash
mkdir -p "skills/korfbal/ledenverloop"
```

**Step 2: Schrijf SKILL.md**

Gebruik het bestaande SKILL.md formaat (zie `skills/korfbal/lid-monitor/SKILL.md` als referentie). Frontmatter:

```yaml
---
name: ledenverloop
description: Analyseer retentie, instroom, uitstroom en KNKV-benchmark over alle seizoenen
user-invocable: true
allowed-tools: Read, Write, Glob, Grep, WebFetch
argument-hint: "[optioneel: seizoen zoals 2025-2026, of 'benchmark' voor alleen KNKV-vergelijking]"
---
```

Body secties:

- `# Ledenverloop — Retentie, Instroom & Uitstroom`
- `## Context` — uitleg doel en relatie tot lid-monitor/jeugdmodel
- `## Kernbegrippen` — classificatietabel (behouden/nieuw/herinschrijver/uitgestroomd/niet-spelend) + instroomfasen + overgangsmomenten
- `## KPI's` — formuletabel
- `## Databronnen` — paden naar snapshots, streefmodel, benchmark-data
- `## Stappen` — 9 genummerde stappen (uit design doc sectie "Skill-workflow")
- `## Signalering` — drempelwaarden-tabel + signaaltypen
- `## Benchmark` — concurrenten-lijst, KNKV-bron, parse-aanpak
- `## Output` — bestands- en mappenstructuur

Kopieer de inhoud letterlijk uit het design doc. Gebruik dezelfde stijl als lid-monitor: genummerde stappen met bold sub-labels, bullet sub-lists, bestandspaden in backticks.

**Step 3: Commit**

```bash
git add skills/korfbal/ledenverloop/SKILL.md
git commit -m "feat: voeg ledenverloop skill toe (retentie, instroom, uitstroom, benchmark)"
```

---

## Task 2: Data-directories en JSON-schema's aanmaken

**Files:**
- Create: `data/ledenverloop/individueel/.gitkeep`
- Create: `data/ledenverloop/cohorten/.gitkeep`
- Create: `data/ledenverloop/signalering/.gitkeep`
- Create: `data/ledenverloop/benchmark/knkv-kwartaal/raw/.gitkeep`
- Create: `data/ledenverloop/benchmark/config.json`

**Step 1: Maak directories**

```bash
mkdir -p data/ledenverloop/individueel
mkdir -p data/ledenverloop/cohorten
mkdir -p data/ledenverloop/signalering
mkdir -p data/ledenverloop/benchmark/knkv-kwartaal/raw
```

**Step 2: Schrijf benchmark config**

`data/ledenverloop/benchmark/config.json`:

```json
{
  "_meta": {
    "beschrijving": "Configuratie voor KNKV-benchmarking",
    "bron": "https://www.knkv.nl/kennisbank/ledencijfers/"
  },
  "eigen_vereniging": "Oranje Wit",
  "concurrenten": {
    "lokaal": ["DeetosSnel", "Sporting Delta", "Movado"],
    "regionaal": ["PKC", "Albatros", "Merwede", "Kinderdijk"]
  },
  "knkv_bron_url": "https://www.knkv.nl/kennisbank/ledencijfers/"
}
```

**Step 3: Schrijf voorbeeld KNKV-kwartaal JSON schema**

`data/ledenverloop/benchmark/knkv-kwartaal/SCHEMA.md` — documenteert het verwachte JSON-formaat zodat handmatige invoer mogelijk is:

```markdown
# KNKV Kwartaalcijfers — JSON Schema

Bestandsnaam: `YYYY-QN.json` (bijv. `2025-Q3.json`)

## Structuur

{
  "_meta": {
    "kwartaal": "2025-Q3",
    "seizoen": "2025-2026",
    "bron": "KNKV ledencijfers PDF",
    "datum_verwerkt": "2026-02-24"
  },
  "landelijk": {
    "totaal": 90000,
    "jeugd": 42000,
    "senioren": 48000
  },
  "verenigingen": [
    {
      "naam": "Oranje Wit",
      "totaal": 253,
      "jeugd": 192,
      "senioren": 61
    }
  ]
}

Velden `jeugd` en `senioren` zijn optioneel — als de PDF alleen totalen geeft.
```

**Step 4: Voeg .gitkeep bestanden toe**

Maak lege `.gitkeep` bestanden in elke directory zodat de mappenstructuur in git bewaard blijft.

**Step 5: Commit**

```bash
git add data/ledenverloop/
git commit -m "feat: voeg ledenverloop data-directories en benchmark-config toe"
```

---

## Task 3: Agent en CLAUDE.md bijwerken

**Files:**
- Modify: `agents/data-analist.md` (frontmatter skills-lijst)
- Modify: `CLAUDE.md` (skills-tabel)

**Step 1: Voeg skill toe aan data-analist agent**

In `agents/data-analist.md`, voeg `oranje-wit:ledenverloop` toe aan de `skills:` lijst in de frontmatter. Plaats het na `oranje-wit:lid-monitor`.

**Step 2: Voeg skill toe aan CLAUDE.md skills-tabel**

In `CLAUDE.md`, voeg een rij toe aan de skills-tabel:

```markdown
| `/oranje-wit:ledenverloop` | Retentie, instroom, uitstroom analyseren en KNKV-benchmark |
```

Plaats het tussen `lid-monitor` en `knkv-api`.

**Step 3: Commit**

```bash
git add agents/data-analist.md CLAUDE.md
git commit -m "feat: registreer ledenverloop skill bij data-analist agent en CLAUDE.md"
```

---

## Task 4: Eerste analyse draaien — individueel verloop berekenen

**Files:**
- Create: `data/ledenverloop/individueel/2021-2022-verloop.json`
- Create: `data/ledenverloop/individueel/2022-2023-verloop.json`
- Create: `data/ledenverloop/individueel/2023-2024-verloop.json`
- Create: `data/ledenverloop/individueel/2024-2025-verloop.json`
- Create: `data/ledenverloop/individueel/2025-2026-verloop.json`

**Step 1: Lees alle snapshots**

Lees de volgende bestanden:
- `data/leden/snapshots/2021-06-01.json`
- `data/leden/snapshots/2022-06-01.json`
- `data/leden/snapshots/2023-06-01.json`
- `data/leden/snapshots/2024-06-01.json`
- `data/leden/snapshots/2025-06-01.json`
- `data/leden/snapshots/2026-02-23.json`

**Step 2: Vergelijk elk opeenvolgend snapshot-paar op `rel_code`**

Voor elk paar (bijv. 2021→2022, seizoen "2021-2022"):
1. Maak een set van `rel_code` waarden met `spelactiviteit: "korfbal"` in snapshot A (vorig)
2. Maak een set van `rel_code` waarden met `spelactiviteit: "korfbal"` in snapshot B (nieuw)
3. Maak een set van alle `rel_code` waarden in alle eerdere snapshots (voor herinschrijver-detectie)

Classificeer elk lid:
- `behouden`: in A én B (beide korfbal)
- `nieuw`: in B maar niet in A, en niet in enig eerder snapshot
- `herinschrijver`: in B maar niet in A, wél in een eerder snapshot
- `uitgestroomd`: in A maar niet in B
- `niet_spelend_geworden`: in A (korfbal) en in B (niet-korfbal, maar nog steeds lid)

**Step 3: Schrijf verloop-JSON per seizoenspaar**

Formaat `data/ledenverloop/individueel/YYYY-YYYY-verloop.json`:

```json
{
  "_meta": {
    "seizoen": "2022-2023",
    "snapshot_vorig": "2022-06-01",
    "snapshot_nieuw": "2023-06-01",
    "gegenereerd": "2026-02-24",
    "totaal_vorig": 180,
    "totaal_nieuw": 195,
    "samenvatting": {
      "behouden": 160,
      "nieuw": 30,
      "herinschrijver": 5,
      "uitgestroomd": 20,
      "niet_spelend_geworden": 3
    }
  },
  "verloop": [
    {
      "rel_code": "NMC41D1",
      "status": "behouden",
      "geboortejaar": 2009,
      "geslacht": "M",
      "leeftijd_vorig": 12,
      "leeftijd_nieuw": 13,
      "team_vorig": "F3",
      "team_nieuw": "J2"
    }
  ]
}
```

Privacy: alleen `rel_code`, `geboortejaar`, `geslacht`, `leeftijd`, `team`, `status`. Geen namen.

**Step 4: Commit**

```bash
git add data/ledenverloop/individueel/
git commit -m "feat: genereer individueel ledenverloop voor alle seizoensparen"
```

---

## Task 5: Cohort-aggregatie berekenen

**Files:**
- Create: `data/ledenverloop/cohorten/totaal-cohorten.json`

**Step 1: Lees alle individueel-verloop bestanden**

Lees de 5 verloop-JSON bestanden uit Task 4.

**Step 2: Aggregeer per geboortejaar-cohort + geslacht**

Per cohort (bijv. geboortejaar 2012, geslacht M), bereken over alle seizoenen:

```json
{
  "geboortejaar": 2012,
  "geslacht": "M",
  "seizoenen": {
    "2021-2022": {
      "leeftijd": 9,
      "band": "Groen",
      "actief": 8,
      "behouden": null,
      "nieuw": null,
      "herinschrijver": null,
      "uitgestroomd": null,
      "retentie_pct": null
    },
    "2022-2023": {
      "leeftijd": 10,
      "band": "Geel",
      "actief": 9,
      "behouden": 7,
      "nieuw": 2,
      "herinschrijver": 0,
      "uitgestroomd": 1,
      "retentie_pct": 87.5
    }
  }
}
```

Eerste seizoen heeft `null` voor verloop-KPI's (geen vorig seizoen om mee te vergelijken).

**Step 3: Bereken totaal-KPI's**

Voeg een `_totalen` sectie toe met:
- Totaal retentie per seizoen (alle leeftijden)
- Retentie per leeftijdsgroep (6-12, 13-14, 15-16, 17-18, 19-23, 24+)
- Instroomleeftijd: gemiddelde en mediaan leeftijd van nieuwe leden per seizoen
- Netto groei per seizoen

**Step 4: Schrijf cohorten-JSON**

```json
{
  "_meta": {
    "beschrijving": "Ledenverloop per geboortejaar-cohort over alle seizoenen",
    "seizoenen": ["2021-2022", "2022-2023", "2023-2024", "2024-2025", "2025-2026"],
    "gegenereerd": "2026-02-24"
  },
  "per_cohort": [ ... ],
  "_totalen": {
    "per_seizoen": [ ... ],
    "per_leeftijdsgroep": [ ... ],
    "instroom_leeftijd": [ ... ]
  }
}
```

**Step 5: Commit**

```bash
git add data/ledenverloop/cohorten/
git commit -m "feat: genereer cohort-aggregatie ledenverloop met KPI's"
```

---

## Task 6: Signalering genereren

**Files:**
- Create: `data/ledenverloop/signalering/2025-2026-alerts.json`

**Step 1: Lees cohorten-data en streefmodel**

Lees `data/ledenverloop/cohorten/totaal-cohorten.json` en `data/modellen/streef-ledenboog.json` (voor retentie-parameters).

**Step 2: Toets aan drempelwaarden**

Per leeftijdsgroep, vergelijk de werkelijke retentie met de drempelwaarden uit het design:

| Leeftijdsgroep | Streef | Aandacht (<) | Kritiek (<) |
|---|---|---|---|
| 6-12 | 95% | 85% | 70% |
| 13-14 | 90% | 80% | 65% |
| 15-16 | 88% | 78% | 63% |
| 17-18 | 90% | 80% | 65% |
| 19-23 | 75% | 65% | 50% |
| 24+ | 80% | 70% | 55% |

**Step 3: Genereer alerts**

```json
{
  "_meta": {
    "seizoen": "2025-2026",
    "gegenereerd": "2026-02-24",
    "totaal_alerts": 5
  },
  "alerts": [
    {
      "type": "retentie",
      "ernst": "kritiek",
      "leeftijdsgroep": "19-23",
      "geslacht": "M",
      "waarde": 48,
      "drempel": 50,
      "streef": 75,
      "beschrijving": "Retentie mannen 19-23 jaar (48%) is kritiek laag (streef: 75%)"
    },
    {
      "type": "instroom",
      "ernst": "aandacht",
      "leeftijdsgroep": "6-9",
      "beschrijving": "Kerninstroom 6-9 jaar daalt voor 2e seizoen op rij"
    },
    {
      "type": "genderdisbalans",
      "ernst": "aandacht",
      "geboortejaar": 2011,
      "mv_ratio": "30/70",
      "beschrijving": "Cohort 2011: slechts 30% jongens (drempel: 40%)"
    }
  ]
}
```

Signaaltypen: `retentie`, `instroom`, `genderdisbalans`, `benchmark`, `trendbreuk`.

**Step 4: Commit**

```bash
git add data/ledenverloop/signalering/
git commit -m "feat: genereer signalering/alerts voor ledenverloop"
```

---

## Task 7: HTML Dashboard bouwen — structuur en navigatie

**Files:**
- Create: `app/ledenverloop.html`

**Step 1: Maak HTML-skelet**

Volg exact het patroon van `app/teamsamenstelling.html`:
- Standalone HTML, geen server nodig
- Chart.js v4 via CDN: `https://cdn.jsdelivr.net/npm/chart.js@4`
- Alle data inline als JS constanten
- CSS custom properties voor kleuren

Structuur:

```html
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ledenverloop — c.k.v. Oranje Wit</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
  <style>/* CSS hier */</style>
</head>
<body>
  <header>
    <div class="header-top">
      <h1>Ledenverloop</h1>
      <span class="badge">c.k.v. Oranje Wit</span>
    </div>
    <nav id="tabs">
      <button class="tab active" data-tab="overzicht">Overzicht</button>
      <button class="tab" data-tab="cohorten">Cohort-analyse</button>
      <button class="tab" data-tab="instroom">Instroomvenster</button>
      <button class="tab" data-tab="dropout">Drop-out</button>
      <button class="tab" data-tab="benchmark">Benchmark</button>
      <button class="tab" data-tab="signalering">Signalering</button>
    </nav>
  </header>
  <main>
    <section id="tab-overzicht" class="tab-content active">...</section>
    <section id="tab-cohorten" class="tab-content">...</section>
    <section id="tab-instroom" class="tab-content">...</section>
    <section id="tab-dropout" class="tab-content">...</section>
    <section id="tab-benchmark" class="tab-content">...</section>
    <section id="tab-signalering" class="tab-content">...</section>
  </main>
  <script>/* JS hier */</script>
</body>
</html>
```

**Step 2: Schrijf CSS**

Hergebruik het kleurenschema van teamsamenstelling.html:
- `--ow-oranje: #FF6B00` (Oranje Wit huiskleur)
- Band-kleuren: `--blauw`, `--groen`, `--geel`, `--oranje`, `--rood`
- Signaal-kleuren: `--signal-groen`, `--signal-geel`, `--signal-rood`
- Grid utilities: `.grid-2`, `.grid-3`, `.grid-4`
- KPI cards, alert cards, tab navigatie
- Responsive breakpoints: 768px, 480px
- Print stylesheet

**Step 3: Schrijf tab-navigatie JS**

```javascript
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});
```

**Step 4: Commit**

```bash
git add app/ledenverloop.html
git commit -m "feat: voeg ledenverloop HTML dashboard toe (structuur en navigatie)"
```

---

## Task 8: Dashboard — Overzicht tab

**Files:**
- Modify: `app/ledenverloop.html`

**Step 1: Embed inline data**

Voeg de berekende data uit Tasks 4-6 toe als JS constanten bovenaan het `<script>` blok. Gebruik gecondenseerde property-namen (zoals teamsamenstelling.html doet):

```javascript
// Seizoensoverzicht
const SEIZOENEN = ["2021-2022","2022-2023","2023-2024","2024-2025","2025-2026"];

// Totalen per seizoen
const TOTALEN = [
  {sz:"2021-2022", actief:180, behouden:null, nieuw:null, uit:null, retentie:null, groei:null},
  {sz:"2022-2023", actief:195, behouden:160, nieuw:30, uit:20, retentie:88.9, groei:15},
  // ... etc (werkelijke cijfers uit de berekende data)
];

// Cohort data (gecondenseerd)
const COHORTEN = [
  {gj:2020, g:"M", sz:{"2025-2026":{a:3,b:null,n:3,h:0,u:0,r:null}}},
  // ... etc
];

// Alerts
const ALERTS = [ ... ];
```

**Step 2: Bouw Overzicht tab**

Inhoud:
- **3-4 KPI cards** bovenaan: Totaal actieve spelers, Netto groei (vs vorig seizoen), Overall retentie %, Instroomcijfer
- **Lijngrafiek**: totaal actieve leden per seizoen (5 datapunten)
- **Staafgrafiek**: instroom vs uitstroom per seizoen (gestapeld)
- **Compact seizoens-tabel**: seizoen | actief | instroom | uitstroom | retentie% | groei

Gebruik Chart.js `type: 'line'` en `type: 'bar'` met `responsive: true`.

**Step 3: Render functie**

```javascript
function renderOverzicht() {
  // KPI cards
  const laatste = TOTALEN[TOTALEN.length - 1];
  const vorige = TOTALEN[TOTALEN.length - 2];
  // ... bereken KPI's en vul DOM

  // Charts
  new Chart(document.getElementById('chart-leden-trend'), { ... });
  new Chart(document.getElementById('chart-instroom-uitstroom'), { ... });
}
```

**Step 4: Commit**

```bash
git add app/ledenverloop.html
git commit -m "feat: voeg overzicht tab toe aan ledenverloop dashboard"
```

---

## Task 9: Dashboard — Cohort-analyse tab

**Files:**
- Modify: `app/ledenverloop.html`

**Step 1: Bouw cohort-tabel**

Tabel met per geboortejaar-cohort (rijen) × seizoenen (kolommen):
- Celwaarde: aantal actieve leden
- Kleurcodering: groen (groei), rood (krimp), grijs (stabiel)
- Rijen gegroepeerd per leeftijdsband (Blauw, Groen, Geel, Oranje, Rood, Senioren)
- Filter-knoppen: M/V/Alles

**Step 2: Cohort-retentie grafiek**

Chart.js `type: 'bar'` met retentiepercentage per leeftijdsgroep, met streef-lijn als horizontale annotatie.

**Step 3: Gender-filter**

```javascript
let genderFilter = 'alles'; // 'M', 'V', 'alles'
function renderCohorten() {
  const filtered = genderFilter === 'alles'
    ? COHORTEN
    : COHORTEN.filter(c => c.g === genderFilter);
  // ... render tabel en grafiek
}
```

**Step 4: Commit**

```bash
git add app/ledenverloop.html
git commit -m "feat: voeg cohort-analyse tab toe met genderfilter"
```

---

## Task 10: Dashboard — Instroomvenster tab

**Files:**
- Modify: `app/ledenverloop.html`

**Step 1: Instroomleeftijd-verdeling**

Chart.js `type: 'bar'`: X-as = leeftijd bij instroom (5-25+), Y-as = aantal nieuwe leden. Eén bar per seizoen (grouped bar chart) of gestapeld.

**Step 2: Instroomleeftijd-trend**

Chart.js `type: 'line'`: gemiddelde instroomleeftijd per seizoen. Toont of de instroom verschuift naar oudere/jongere leeftijden.

**Step 3: Instroomfase-tabel**

Compacte tabel: fase (kerninstroom 6-9, naloop 10-12, overstappers 13-18) × seizoen, met absolute aantallen en percentage van totale instroom.

**Step 4: Commit**

```bash
git add app/ledenverloop.html
git commit -m "feat: voeg instroomvenster tab toe"
```

---

## Task 11: Dashboard — Drop-out tab

**Files:**
- Modify: `app/ledenverloop.html`

**Step 1: Drop-out heatmap**

HTML tabel als heatmap: rijen = leeftijd (5-30), kolommen = seizoen. Celwaarde = uitstroompercentage of absoluut aantal. Achtergrondkleur schaal van wit (0%) naar donkerrood (hoge uitval).

```javascript
function heatColor(pct) {
  if (pct === 0) return '#f0f0f0';
  const intensity = Math.min(pct / 50, 1); // 50% = maximaal rood
  return `rgba(220, 38, 38, ${intensity})`;
}
```

**Step 2: Overgangsmomenten-analyse**

Tabel met de 5 kritische overgangsmomenten:
- 5→6 jaar, 12→13 jaar, 14→15 jaar, 18→19 jaar, 21→23 jaar
- Per moment: hoeveel leden in, hoeveel uit, retentie%

**Step 3: Commit**

```bash
git add app/ledenverloop.html
git commit -m "feat: voeg drop-out heatmap tab toe"
```

---

## Task 12: Dashboard — Benchmark tab

**Files:**
- Modify: `app/ledenverloop.html`

**Step 1: Benchmark data inline**

Als er nog geen KNKV-data is geparsed, gebruik placeholder-structuur:

```javascript
const BENCHMARK = {
  beschikbaar: false, // true zodra KNKV-data is geladen
  landelijk: null,
  concurrenten: [],
  eigen: { naam: "Oranje Wit", totaal: 253, jeugd: 192 }
};
```

**Step 2: Benchmark UI**

Als `BENCHMARK.beschikbaar === true`:
- Staafgrafiek: ledenaantallen OW vs concurrenten vs landelijk gemiddelde
- Tabel: groei% vergelijking per vereniging
- Jeugdaandeel-vergelijking

Als `BENCHMARK.beschikbaar === false`:
- Melding: "KNKV kwartaalcijfers nog niet geladen. Draai `/oranje-wit:ledenverloop benchmark` om data te verwerken."

**Step 3: Commit**

```bash
git add app/ledenverloop.html
git commit -m "feat: voeg benchmark tab toe (met placeholder voor KNKV-data)"
```

---

## Task 13: Dashboard — Signalering tab

**Files:**
- Modify: `app/ledenverloop.html`

**Step 1: Alert cards**

Render elke alert als een card met stoplicht-kleur:
- `kritiek` → rood border + icoon
- `aandacht` → geel/oranje border + icoon
- `op_koers` → groen (als er alerts op koers zijn)

```javascript
function renderSignalering() {
  const container = document.getElementById('alerts-container');
  ALERTS.forEach(alert => {
    const card = document.createElement('div');
    card.className = `alert-card alert-${alert.ernst}`;
    card.innerHTML = `
      <span class="alert-type">${alert.type}</span>
      <p>${alert.beschrijving}</p>
      <span class="alert-waarde">${alert.waarde ? alert.waarde + '%' : ''}</span>
    `;
    container.appendChild(card);
  });
}
```

**Step 2: Signalering-samenvatting**

Bovenaan: KPI cards met totaal kritiek / aandacht / op koers.

**Step 3: Commit**

```bash
git add app/ledenverloop.html
git commit -m "feat: voeg signalering tab toe aan ledenverloop dashboard"
```

---

## Task 14: Data embedden en dashboard vullen

**Step 1: Draai de ledenverloop analyse**

Gebruik de SKILL.md als leidraad: lees alle snapshots, bereken verloop, cohorten, signalering.

**Step 2: Converteer JSON naar inline JS**

Neem de berekende JSON-data uit `data/ledenverloop/` en converteer naar gecondenseerde inline JS constanten in `app/ledenverloop.html`. Condenseer property-namen (bijv. `geboortejaar` → `gj`, `geslacht` → `g`, `actief` → `a`).

**Step 3: Verifieer visueel**

Open `app/ledenverloop.html` in een browser. Controleer:
- [ ] Alle 6 tabs laden correct
- [ ] KPI cards tonen werkelijke cijfers
- [ ] Grafieken renderen met Chart.js
- [ ] Heatmap kleurt correct
- [ ] Filters (gender) werken
- [ ] Responsive op smaller scherm (768px, 480px)
- [ ] Print stylesheet toont alle tabs

**Step 4: Commit**

```bash
git add app/ledenverloop.html data/ledenverloop/
git commit -m "feat: vul ledenverloop dashboard met werkelijke analysedata"
```

---

## Task 15: KNKV PDF parsing eerste poging

**Step 1: Download KNKV ledencijfers PDF**

Ga naar `https://www.knkv.nl/kennisbank/ledencijfers/` en download de meest recente kwartaalcijfers-PDF. Sla op als `data/ledenverloop/benchmark/knkv-kwartaal/raw/2025-Q3.pdf` (of het actuele kwartaal).

**Step 2: Probeer PDF te parsen**

Lees de PDF en extraheer tabeldata. Zoek naar:
- Rij "Oranje Wit" (of varianten: "CKV Oranje Wit", "c.k.v. Oranje Wit")
- Rijen voor de 7 concurrenten
- Landelijk totaal

**Step 3: Schrijf geparsede JSON**

Als parsing lukt, schrijf naar `data/ledenverloop/benchmark/knkv-kwartaal/YYYY-QN.json` in het schema uit Task 2.

Als parsing niet lukt, documenteer wat er misgaat en maak een handmatig invulbaar JSON-bestand aan.

**Step 4: Update benchmark-data in HTML**

Zet `BENCHMARK.beschikbaar = true` en vul de data in `app/ledenverloop.html`.

**Step 5: Commit**

```bash
git add data/ledenverloop/benchmark/ app/ledenverloop.html
git commit -m "feat: verwerk KNKV kwartaalcijfers en update benchmark"
```

---

## Task 16: Eindcontrole en oplevering

**Step 1: Controleer alle bestanden**

Verifieer dat alle bestanden bestaan en correct zijn:
- `skills/korfbal/ledenverloop/SKILL.md` — complete skill-definitie
- `data/ledenverloop/individueel/*.json` — 5 verloop-bestanden
- `data/ledenverloop/cohorten/totaal-cohorten.json` — cohort-aggregatie
- `data/ledenverloop/signalering/2025-2026-alerts.json` — huidige alerts
- `data/ledenverloop/benchmark/config.json` — concurrenten-config
- `app/ledenverloop.html` — werkend dashboard met 6 tabs
- `agents/data-analist.md` — skill geregistreerd
- `CLAUDE.md` — skill vermeld

**Step 2: Verifieer skill laadt correct**

Test: roep `/oranje-wit:ledenverloop` aan en controleer dat de skill wordt gevonden en de stappen helder zijn.

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: ledenverloop skill compleet — retentie, instroom, uitstroom, benchmark dashboard"
```
