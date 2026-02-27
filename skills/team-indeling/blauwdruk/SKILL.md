---
name: blauwdruk
description: Blauwdruk voor een nieuw seizoen opstellen en beheren. Data-gedreven besluitvorming met categorieoverzicht, teamgrootte-targets en rijke ledendata.
user-invocable: false
allowed-tools: Read, Write, Glob
---

# Skill: Blauwdruk

## Doel
Blauwdruk voor een nieuw seizoen opstellen en beheren. De blauwdruk is het startpunt voor data-gedreven besluitvorming: de TC ziet direct hoeveel spelers beschikbaar zijn per categorie, wat de teamcapaciteit is, en kan targets instellen.

## Wanneer gebruiken
- Begin van het planningsproces (januari-maart)
- Bij het vaststellen van seizoenskaders en teamgrootte-targets
- Bij het bijwerken van spelerstatus (doorlopend)
- Bij het bekijken van categorieoverzicht en retentierisico

## Paginavolgorde (logisch voor besluitvorming)

### 1. Categorieoverzicht
Visueel overzicht per leeftijdscategorie (Blauw → Groen → Geel → Oranje → Rood + Senioren):
- Totaal spelers per kleur
- Breakdown: beschikbaar / twijfelt / stopt / nieuw (badges)
- Gender-verdeling: X♂ Y♀
- Team-capaciteit: "1-2 teams mogelijk" (berekend)
- Retentie-samenvatting onderaan

**Component**: `CategorieOverzicht.tsx`
**Data**: `getLedenStatistieken()` in `blauwdruk/actions.ts`

### 2. Teamgrootte-instellingen
Configureerbare min/ideaal/max spelers per teamtype:
- **Viertal** (Blauw + Groen): standaard 5/6/6
- **Breedte-achttal** (Geel, Oranje, Rood): standaard 9/10/11
- **A-categorie team** (U15/U17/U19): standaard 8/10/11
- **Selectie** (A-cat 2 teams samen): standaard 18/20/22
- **Senioren selectie**: standaard 20/24/26

Targets in `blauwdruk.keuzes.teamgrootte` (JSON), gebruikt door validatie-engine.

**Component**: `TeamgrootteInstellingen.tsx`
**Data**: `getTeamgrootteTargets()`, `updateTeamgrootte()`

### 3. Speerpunten
Max 3-5 concrete seizoensdoelen.

### 4. Toelichting
Vrije tekst: context, bijzonderheden, trends, aandachtspunten.

### 5. Leden (LedenDashboard)
Rijke, sorteerbare ledentabel met:
- **Samenvatting-kaarten**: totaal, beschikbaar, twijfelt, stopt, nieuw
- **Kolommen**: avatar (foto), naam, korfballeeftijd, M/V, huidig team, verwachte categorie, retentierisico (kleur-dot), seizoenen actief, status + wijzig
- **Sorteerbaar** op elke kolom
- **Filters**: zoekterm, status, kleur

**Component**: `LedenDashboard.tsx`
**Data**: `getSpelersUitgebreid()` — spelers met retentie, volgendSeizoen, seizoenenActief, instroomLeeftijd

### 6. Kaders
KNKV Competitie 2.0 regels en OW-voorkeuren per categorie. Referentie-informatie (niet bewerkbaar).

**Component**: `KadersEditor.tsx`

## Server Actions (`blauwdruk/actions.ts`)

| Functie | Beschrijving |
|---|---|
| `getBlauwdruk(seizoen)` | Upsert blauwdruk voor seizoen |
| `getSpelersUitgebreid()` | Alle spelers met retentie, volgendSeizoen, spelerspad |
| `getLedenStatistieken()` | Aggregaties per categorie/kleur, retentie-overzicht |
| `getTeamgrootteTargets(blauwdruk)` | Teamgrootte uit blauwdruk.keuzes met defaults |
| `updateTeamgrootte(id, targets)` | Update teamgrootte-targets |
| `updateSpelerStatus(id, status)` | Wijzig spelerstatus |
| `updateSpeerpunten(id, list)` | Seizoensspeerpunten opslaan |
| `updateToelichting(id, text)` | Vrije tekst opslaan |

## Korfballeeftijd
- Peildatum: 31 december van seizoensjaar (2026 voor 2026-2027)
- Precieze berekening met geboortedatum als beschikbaar, anders fallback op geboortejaar
- Kleurindicatie: leeftijd → Blauw (≤8) / Groen (≤10) / Geel (≤12) / Oranje (≤14) / Rood (≤18) / Senioren (19+)

## Spelerfoto's
- Avatar-component toont foto uit `lid_fotos` tabel via `/api/foto/[id]`
- Fallback naar initiaal-cirkel als geen foto beschikbaar

## Output
- Data-gedreven categorieoverzicht met team-capaciteit
- Configureerbare teamgrootte-targets voor validatie
- Rijke ledentabel met retentie en verwachte categorie
- Zichtbaar als startpagina van het seizoen in de app
