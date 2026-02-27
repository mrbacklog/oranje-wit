---
name: validatie
description: Teamindelingen valideren op KNKV-regels, OW-voorkeuren en Oranje Draad. Stoplicht per team, configureerbare teamgrootte-targets.
user-invocable: false
allowed-tools: Read, Write, Glob
---

# Skill: Validatie

## Doel
Teamindelingen valideren op KNKV-regels, OW-voorkeuren en Oranje Draad.

## Validatieniveaus

### Harde regels (KNKV) → rood bij overtreding
→ zie `rules/knkv-regels.md` voor alle regels (bandbreedte, teamgrootte, gemiddelde leeftijd, vastspelen)

### Zachte regels (OW) → oranje bij afwijking
→ zie `rules/ow-voorkeuren.md` voor alle voorkeuren (gender, teamgrootte, selectiebalans)

### Oranje Draad → informatief
→ zie `rules/oranje-draad.md` voor POP-ratio's en toetsingsvragen

## Teamgrootte-targets
Validatie gebruikt configureerbare targets uit de blauwdruk (`blauwdruk.keuzes.teamgrootte`):

| Type | Min | Ideaal | Max | Toepassing |
|---|---|---|---|---|
| Viertal | 5 | 6 | 6 | Blauw + Groen (4-tallen) |
| Breedte-achttal | 9 | 10 | 11 | Geel, Oranje, Rood |
| A-cat team | 8 | 10 | 11 | U15/U17/U19 per team |
| Selectie | 18 | 20 | 22 | A-cat selectie (2 teams) |
| Senioren selectie | 20 | 24 | 26 | Senioren A selectie |

De TC kan deze targets aanpassen in de blauwdruk pagina via `TeamgrootteInstellingen`. Bij geen custom targets worden de defaults uit `DEFAULT_TEAMGROOTTE` gebruikt.

## Stoplicht
- **Groen**: alle regels OK, geen aandachtspunten
- **Oranje**: zachte regels overschreden of aandachtspunt
- **Rood**: harde KNKV-regel overtreden of kritiek probleem

## Implementatie

### Code
- **Engine**: `lib/validatie/regels.ts` — pure functies, framework-onafhankelijk
- **Hook**: `hooks/useValidatie.ts` — maps UI types naar engine types
- **Impact**: `lib/validatie/impact.ts` — best/verwacht/worst case berekening

### UI-componenten
- `ValidatieBadge` — kleur-dot per team (klikbaar)
- `ValidatieMeldingen` — popover met meldingen per team
- `ValidatieRapport` — volledig rapport in slide-over panel
- `ImpactOverzicht` — drie-koloms impact analyse

### Korfballeeftijd
Validatie gebruikt `korfbalLeeftijd()` voor precieze leeftijdsberekening:
- Peildatum: 31 december van seizoensjaar
- Met geboortedatum: precieze leeftijd (2 decimalen)
- Zonder: fallback op geboortejaar

## Output per team
```
Team: U15-1
Status: groen
Spelers: 5M + 5V = 10
Meldingen: geen

Team: Geel J8
Status: oranje
Spelers: 3M + 4V = 7
Meldingen:
  - Teamgrootte 7: onder ideaal (9-11), maar boven minimum (8)
  - Gender: 3M + 4V (ongelijk, maar min 2 M/V OK)
```

## Totaaloverzicht
```
Scenario A.2 validatie:
Groen: 14 teams OK
Oranje: 3 teams aandacht
Rood: 1 team kritiek
```
