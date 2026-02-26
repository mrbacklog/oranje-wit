---
name: scenario-analyse
description: Analyseert verrassingen en risico's voor de komende teamsamenstelling. Doorloopt stoppende/startende leden, staffwisselingen en individuele risico's. Gebruik na de seizoensblauwdruk (mrt–mei).
user-invocable: true
allowed-tools: Read, Write, Glob
argument-hint: "[seizoen, bijv. 2025-2026]"
---

# Scenario-analyse

Analyseer de verrassingen en risico's voor het seizoen $ARGUMENTS.

## Stappen

1. **Laad de seizoensblauwdruk**
   `data/seizoenen/YYYY-YYYY/blauwdruk.md`

2. **Inventariseer bekende veranderingen**
   - Stoppende leden (bevestigd of verwacht)
   - Nieuwe leden of terugkerende spelers
   - Staffwisselingen (trainers, coaches, scheidsrechters)
   - Ledeninfo uit `data/leden/stamgegevens.json`

3. **Identificeer risico's per team**
   Voor elk team in de blauwdruk:
   - Positieve verrassing: wie kan een niveau hoger?
   - Negatieve verrassing: wie dreigt te stoppen of niveau te zakken?
   - Staffrisico: is er voldoende begeleiding?

4. **Bouw een scenario-matrix**
   | Team | Verwacht | Positief scenario | Negatief scenario | Kans |
   |---|---|---|---|---|

5. **Toets aan de Oranje Draad**
   Welke scenario's bedreigen de balans Plezier/Ontwikkeling/Prestatie?

6. **Sla op**
   Schrijf naar `data/seizoenen/YYYY-YYYY/scenarios.md`

## Output
Scenario-matrix per team + aanbevelingen voor voorbereiding.
