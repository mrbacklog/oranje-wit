---
name: Agents moeten altijd memory gebruiken
description: Alle agents moeten bij elke sessie memory raadplegen en relevante bevindingen opslaan
type: feedback
---

Agents moeten ALTIJD memory raadplegen bij het starten en relevante bevindingen opslaan na afloop.

**Why:** De gebruiker wil dat kennis uit eerdere gesprekken (TC-besluiten, spelersafspraken, deploy-issues, trends) behouden blijft en gebruikt wordt. Zonder memory beginnen agents elke keer blanco.

**How to apply:** Dit is geïmplementeerd in de `shared/start` skill (Stap 5). Elke agent die de start skill laadt, krijgt de instructie om memory te lezen en bij te werken. Team-skills (seizoensindeling, seizoensanalyse, release) hebben ook een specifieke Memory-sectie.
