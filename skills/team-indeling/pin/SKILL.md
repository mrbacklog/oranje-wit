---
name: pin
description: Feiten pinnen of ont-pinnen in de blauwdruk. Gepinde feiten gelden voor alle concepten en scenario's.
user-invocable: false
allowed-tools: Read, Write, Glob
---

# Skill: Pin

## Doel
Feiten pinnen of ont-pinnen in de blauwdruk. Gepinde feiten gelden voor alle concepten en scenario's.

## Pin-types

### SPELER_STATUS
Een speler heeft een bevestigde status:
- `gaat_stoppen` — bevestigd dat speler stopt na dit seizoen
- `beschikbaar` — bevestigd beschikbaar (bijv. na twijfelperiode)
- `nieuw` — bevestigd nieuw lid (ingeschreven)

**Doorwerking**: bij `gaat_stoppen` wordt de speler automatisch uit alle scenario-teams verwijderd.

### SPELER_POSITIE
Een speler staat vast in een specifiek team:
- `{ teamNaam: "Senioren 1" }` — speler speelt gegarandeerd in dit team
- Geldt in alle scenario's

### STAF_POSITIE
Een stafpersoon staat vast bij een team:
- `{ teamNaam: "U15-1", rol: "trainer" }` — trainer vastgelegd
- Geldt in alle scenario's

## Operaties
- **Pinnen**: promoveer een aanname tot feit
- **Ont-pinnen**: demoveer een feit terug naar aanname (als situatie verandert)
- **Notitie**: elke pin kan een toelichting hebben

## UI
- 📌 icoon bij gepinde items
- [📌] knop bij niet-gepinde items om te pinnen
- Pin-dialoog: kies type + waarde + notitie
- Ont-pin via context-menu of detail-view
