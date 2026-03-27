---
name: Deploy/release shortcuts
description: /deploy en /release starten automatisch het release-team dat zelf uitzoekt wat er gedaan moet worden
type: feedback
---

Wanneer de gebruiker `/deploy` of `/release` zegt, wil hij dat het release-team (ontwikkelaar + e2e-tester + deployment) zelf aan de slag gaat. Het team moet zelf inventariseren wat er gewijzigd is, welke app(s) geraakt zijn, en wat er getest en gedeployd moet worden.

**Why:** De gebruiker wil niet steeds specificeren welke app of wat er gedaan moet worden — het team moet dat zelf kunnen zien aan git status/diff/log.

**How to apply:** `/deploy` en `/release` zijn identieke skills die het team-release activeren in auto-detect modus. Geen argumenten nodig.
