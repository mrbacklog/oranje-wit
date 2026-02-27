---
name: scenario
description: Scenario uitwerken binnen een concept. Drag & drop teamindeling met foto's, korfballeeftijd, validatie en AI-advies.
user-invocable: false
allowed-tools: Read, Write, Glob
---

# Skill: Scenario

## Doel
Een scenario uitwerken binnen een concept: concrete teamindeling met spelers via drag & drop, realtime validatie en AI-ondersteuning.

## Wanneer gebruiken
- Na het formuleren van een concept
- Bij het uitwerken van alternatieve indelingen
- Bij het forken van een bestaand scenario

## Scenario-editor (drieluik)

### Navigator (links)
- Teamoverzicht per categorie (B-cat, A-cat, Senioren)
- Toggle zichtbaarheid per team
- Validatie-stoplicht per team

### Werkgebied (midden)
- Drag & drop teams met `@dnd-kit`
- **TeamKaart**: toont spelers met avatar (foto), korfballeeftijd (2 decimalen), kleurindicatie-dot, geslacht, validatie-badge
- **TeamSpelerRij**: draggable spelerrij met avatar (xs), naam, leeftijd, status-dot
- **SelectieBlok**: gekoppelde selectie-teams (2 teams als één blok)
- Nieuw team aanmaken via `NieuwTeamDialoog`

### SpelersPool (rechts)
- Alle beschikbare spelers met avatar (foto), korfballeeftijd, kleurindicatie
- Filters: zonder team, passend, ingedeeld, alle
- Zoeken op naam
- Klik voor speler detail modal (grote foto, spelerspad, retentie)

## Korfballeeftijd
- **Peildatum**: 31 december 2026 (constant `PEILDATUM`)
- **Berekening**: `korfbalLeeftijd(geboortedatum, geboortejaar)` — precieze leeftijd met 2 decimalen
- **Kleurindicatie**: `kleurIndicatie(leeftijd)` → dot in teamkleur (Blauw/Groen/Geel/Oranje/Rood)
- **Helpers**: `KLEUR_DOT` (tailwind kleuren), `PEILJAAR` (2026)

## Spelerfoto's
- `SpelerAvatar` component: toont webp foto uit `/api/foto/[id]`
- Fallback: gekleurde cirkel met initiaal
- Maten: xs (in teamrij), sm (in pool), md (in detail modal)

## Inhoud van een scenario

### Teams
Concrete teamindeling:
- Per team: naam, categorie, kleur, niveau, volgorde
- Per speler: plaatsing + optionele status-override + notitie
- Per staf: trainer/assistent/manager toewijzing
- Selectie-koppeling via `selectieGroepId` self-relation

### Versies
Elk scenario heeft versies (snapshots):
- Versie 1: eerste uitwerking (automatisch bij aanmaken)
- Versie N: na aanpassingen

## Operaties
- **Nieuw scenario**: start met lege teams of Claude-startvoorstel
- **Archiveer**: scenario niet meer actueel
- **Definitief**: markeer als gekozen indeling (via `MaakDefinitiefKnop`)

## AI-ondersteuning
- **Startvoorstel** (`VoorstelDialoog`): Claude genereert complete teamindeling
- **Advies** (`AdviesPanel`): contextgevoelig advies bij acties
- **What-if** (`WhatIfDialoog`): impact doorrekenen bij verplaatsingen

## Validatie (realtime)
- `useValidatie` hook berekent stoplicht per team
- `ValidatieBadge`: groen/oranje/rood dot per team
- `ValidatieMeldingen`: popover met details
- `ValidatieRapport`: volledig overzicht in slide-over
- `ImpactOverzicht`: best/verwacht/worst case analyse

## Server Actions (`scenarios/actions.ts`)

| Functie | Beschrijving |
|---|---|
| `createScenario(...)` | Nieuw scenario met teams uit teamstructuur-berekening |
| `getScenario(id)` | Scenario met versies, teams, spelers, staf |
| `addSpelerToTeam(teamId, spelerId)` | Speler aan team toevoegen |
| `removeSpelerFromTeam(teamId, spelerId)` | Speler uit team verwijderen |
| `moveSpeler(spelerId, van, naar)` | Speler verplaatsen (transactie) |
| `createTeam(versieId, data)` | Nieuw team aanmaken |
| `deleteTeam(teamId)` | Team verwijderen (ontkoppelt selectie eerst) |
| `koppelSelectie(teamIds)` | Teams als selectie koppelen |
| `ontkoppelSelectie(groepId)` | Selectie ontkoppelen |
| `markeerDefinitief(scenarioId)` | Definitief markeren, rest archiveren |

## Design-systeem
Alle dialogen gebruiken design-systeem classes:
- `dialog-overlay`, `dialog-panel`, `dialog-header`, `dialog-body`, `dialog-footer`
- Buttons: `btn-primary`, `btn-secondary`, `btn-danger`, `btn-ghost`
- Inputs: `input`
- Spinner component voor loading states
