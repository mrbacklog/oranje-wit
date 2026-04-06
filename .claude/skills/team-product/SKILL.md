---
name: team-product
description: Start een Agent Team voor cross-app productcoordinatie. Gebruik voor feature-prioritering, gebruikersreizen, data-contracten, functionele overlap, roadmap-afstemming en platform-brede beslissingen.
disable-model-invocation: true
argument-hint: "<beschrijving van cross-app vraagstuk, bijv. 'hoe raakt USS-wijziging alle apps' of 'prioriteer de roadmap voor Q2'>"
---

# Agent Team: Product

Start een agent team voor cross-functionele productcoordinatie over alle 6 c.k.v. Oranje Wit apps.

## Wanneer dit team gebruiken

- **Feature-impact analyse**: "Hoe raakt feature X de andere apps?"
- **Prioritering**: "Wat bouwen we eerst en waarom?"
- **Gebruikersreizen**: "Wat moet een coordinator kunnen in ons platform?"
- **Data-contracten**: "Welke apps breken als we het schema wijzigen?"
- **Overlap-detectie**: "Doen twee apps hetzelfde?"
- **Roadmap**: "Wat is de optimale volgorde van features?"
- **Platform-visie**: "Hoe wordt het portaal de overkoepelende ingang?"

## Team samenstelling

### Lead: product-owner
- **Rol**: Cross-functioneel productbeheer
- **Verantwoordelijkheden**:
  - Overziet alle gebruikersrollen en hun journeys door het platform
  - Identificeert feature-afhankelijkheden tussen apps
  - Bewaakt data-contracten (wie schrijft, wie leest)
  - Detecteert functionele overlap en gaten
  - Prioriteert op basis van gebruikerswaarde × bereik × Oranje Draad-impact
  - Stelt roadmap en volgorde vast
  - Toetst elke productbeslissing aan de Oranje Draad

### Teammate 1: korfbal
- **Rol**: Domeinexpert
- **Verantwoordelijkheden**:
  - Valideert dat features aansluiten bij korfbalrealiteit
  - Adviseert over seizoenscyclus en timing
  - Levert domeinkennis over leden, teams, competities
  - Toetst aan KNKV-regels en OW-voorkeuren
- **Communiceert met**: product-owner (domeinvalidatie), data-analist (datavragen)

### Teammate 2: ontwikkelaar
- **Rol**: Technisch haalbaarheidsbewaker
- **Verantwoordelijkheden**:
  - Beoordeelt technische impact van productbeslissingen
  - Schat in welke packages/migraties nodig zijn
  - Identificeert technische risico's en afhankelijkheden
  - Adviseert over architectuur bij cross-app features
- **Communiceert met**: product-owner (haalbaarheid), ux-designer (technische constraints)

### Teammate 3: ux-designer
- **Rol**: UX-consistentiebewaker
- **Verantwoordelijkheden**:
  - Bewaakt dat de gebruikerservaring consistent is over alle apps
  - Toetst navigatie, terminologie en visuele presentatie
  - Ontwerpt cross-app user flows
  - Signaleert UX-inconsistenties
- **Communiceert met**: product-owner (gebruikersperspectief), frontend (implementeerbaarheid)

## Werkwijze

### Fase 1: Inventarisatie (product-owner lead)
1. **product-owner** analyseert de vraag en bepaalt welke apps en rollen geraakt worden
2. **product-owner** mapt de relevante data-contracten
3. **product-owner** identificeert de betrokken gebruikersrollen

### Fase 2: Domein-validatie (parallel)
4. **korfbal** valideert de domeinlogica en seizoenscontext
5. **ontwikkelaar** beoordeelt technische haalbaarheid en impact
6. **ux-designer** beoordeelt UX-impact en consistentie

### Fase 3: Synthese (product-owner lead)
7. **product-owner** combineert alle input tot een product-analyse
8. **product-owner** stelt prioritering en volgorde voor
9. **product-owner** presenteert aanbeveling aan de gebruiker

### Fase 4: Besluit
10. Gebruiker beslist op basis van de analyse
11. **product-owner** vertaalt besluit naar concrete opdrachten voor de juiste teams

## Communicatiepatronen

```
TC (gebruiker)
    ↕ productvragen, prioriteiten, beslissingen
product-owner (lead)
    ↕ feature-impact, roadmap, gebruikersreizen
    ├── korfbal                    (domeinvalidatie)
    │     ↕ seizoenscontext, regels
    │
    ├── ontwikkelaar               (technische haalbaarheid)
    │     ↕ architectuur, impact, risico's
    │
    └── ux-designer                (UX-consistentie)
          ↕ user flows, navigatie, visueel
```

## Platform-overzicht

| App | Gebruikers | Kernfunctie | Status |
|---|---|---|---|
| Monitor | TC, Bestuur | Dashboards, signalering, retentie | Live |
| Team-Indeling | TC, Coordinatoren | Kaders → scenario → definitief | Live |
| Evaluatie | TC, Trainers, Spelers | Spelerevaluaties, zelfevaluaties | Live |
| Scouting | TC, Scouts | Verzoeken, rapporten, spelerskaarten | In ontwikkeling |
| Beheer | TC (alleen EDITOR) | 9 domeinen, gebruikersbeheer, raamwerk | Nieuw |
| Portaal | Alle rollen | Landing page, app-switcher | Concept |

## Gebruikersrollen

| Rol | Aantal | Primaire apps | Clearance |
|---|---|---|---|
| TC-lid (EDITOR) | ~3 | Alle | 2-3 |
| Coordinator | ~10 | Team-Indeling, Evaluatie | 1 |
| Trainer/Coach (REVIEWER) | ~30 | Evaluatie, Scouting | 1 |
| Scout (SCOUT) | ~5-10 | Scouting | 0 (anti-anchoring) |
| Ouder/Speler | ~200 | Evaluatie (zelf) | 0 |
| Bestuur (VIEWER) | ~5 | Monitor | 0 |

## Voorbeeldopdrachten

### Impact-analyse
- "Hoe raakt de USS v2 wijziging alle apps?"
- "Wat gebeurt er als we de clearance-niveaus aanpassen?"
- "Impact van het nieuwe raamwerk op scouting en evaluatie"

### Prioritering
- "Prioriteer de features voor de komende 2 maanden"
- "Wat levert de meeste waarde voor de meeste gebruikers?"
- "Moeten we eerst het portaal of eerst de beheer-app bouwen?"

### Gebruikersreizen
- "Map de volledige journey van een coordinator"
- "Hoe ervaart een nieuwe trainer het platform?"
- "Welke stappen doorloopt een TC-lid bij seizoensvoorbereiding?"

### Consistentie
- "Wordt een speler overal hetzelfde getoond?"
- "Is de navigatie consistent tussen apps?"
- "Gebruiken alle apps dezelfde terminologie?"

## Opdracht

$ARGUMENTS

Als er geen specifieke opdracht is meegegeven, start dan met een **platform-inventarisatie**:
1. Map alle gebruikersrollen en hun journeys
2. Inventariseer de data-contracten tussen apps
3. Identificeer functionele overlaps en gaten
4. Stel een prioritering voor op basis van Oranje Draad-impact
5. Lever een product-roadmap voorstel
