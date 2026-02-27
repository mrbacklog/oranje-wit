---
name: advies
description: Intelligent advies over spelersplaatsing, what-if scenario's en Oranje Draad-toetsing. Gebruikt spelerspaden, evaluaties, retentiemodel en korfballeeftijd.
user-invocable: false
allowed-tools: Read, Write, Glob
---

# Skill: Advies

## Doel
Intelligent advies van Claude over spelersplaatsing, what-if scenario's en Oranje Draad-toetsing.

## AI-endpoints
De app heeft 3 Claude-endpoints (via `@anthropic-ai/sdk`):
- `/api/ai/voorstel` — startvoorstel genereren (VoorstelDialoog)
- `/api/ai/advies` — contextgevoelig advies bij acties (AdviesPanel)
- `/api/ai/whatif` — what-if analyse bij verplaatsingen (WhatIfDialoog)

Prompt builder: `lib/ai/prompt.ts` — bouwt context met ledendata, spelerspaden, evaluaties, blauwdruk, teamgrootte-targets.

## Adviestypen

### Startvoorstel
Input: concept (uitgangsprincipe + keuzes) + blauwdruk (kaders + pins + teamgrootte-targets)
Output: complete teamindeling voor alle categorieën met onderbouwing per speler

Claude gebruikt:
- Ledenlijst met korfballeeftijd (precieze berekening op peildatum 31-12) en geslacht
- Spelerspaden (meerdere seizoenen)
- Evaluaties (indien beschikbaar)
- Retentiemodel (risico, kans_behoud, factoren)
- Teamgrootte-targets uit blauwdruk
- Gepinde feiten

### Spelersadvies
Input: speler ID
Output: profiel met pad, evaluatie, retentierisico, teamadvies, foto

"Eva (V, 2012) — korfballeeftijd 14.23, 4e seizoen. Pad: Groen → Geel → Oranje → U15-2.
Evaluatie: techniek hoog, spelvisie gemiddeld. Retentie: 95% (laag risico).
3 jaar samen met Kim. Advies: U15-1 als kern."

### What-if analyse
Input: voorgestelde wijziging ("Verplaats Saar van U15-2 naar Oranje J3")
Output: impact op beide teams + alternatieve opties

### Oranje Draad toets
Input: scenario of team
Output: score per pijler + toelichting

### Blauwdruk-advies
Input: categorieoverzicht + ledenstatistieken uit blauwdruk
Output: aanbevolen speerpunten en aandachtspunten voor het seizoen

## Korfballeeftijd
- Precieze berekening: `korfbalLeeftijd(geboortedatum, geboortejaar)` op peildatum 31-12-2026
- Kleurindicatie: leeftijd → Blauw/Groen/Geel/Oranje/Rood/Senioren
- Advies gebruikt korfballeeftijd, niet kalenderleeftijd

## Context
- Claude geeft advies, beslist niet — TC maakt de keuzes
- Altijd onderbouwen met data
- Oranje Draad als toetsingskader bij elk advies
- Teamgrootte-targets uit blauwdruk als referentie
