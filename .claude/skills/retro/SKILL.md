---
name: retro
description: Gestructureerde retrospectief na een sprint of release. Wat geleverd, wat goed/mis ging, wat geleerd. Learnings opslaan in docs/learnings/ voor gebruik door /start.
user-invocable: true
allowed-tools: Read, Write, Bash, Glob
argument-hint: "[naam, bijv. 'sprint-14' of 'release-v2026-04-13']"
---

# Retro — Sprint/Release Retrospectief

## Wanneer gebruiken

- Na elke release (`/team-release` afgerond) — trigger via `product-owner`
- Na een significant incident of probleem
- Optioneel: na een intensieve werkweek om inzichten vast te leggen

**Trigger:** `product-owner` roept `/retro <naam>` aan nadat `team-release` klaar is. De `documentalist` agent voert de retro uit.

## Gebruik

```
/retro release-v2026-04-13      # Retro voor specifieke release
/retro sprint-14                # Retro voor sprint
/retro incident-auth-bypass     # Retro voor incident
```

Als geen naam opgegeven: gebruik de datum als naam (`retro-YYYY-MM-DD`).

## Stap 1: Context laden

```bash
# Wat is er de afgelopen 2 weken gedaan?
git log --oneline --since="2 weeks ago"

# Hoeveel deploys zijn succesvol geweest?
gh run list --limit 20 --json conclusion,headBranch,displayTitle 2>/dev/null | python3 -c "import sys,json; runs=json.load(sys.stdin); [print(r.get('conclusion','?'), r.get('displayTitle','?')[:60]) for r in runs]" 2>/dev/null || echo "gh niet beschikbaar"

# Welke bestanden zijn het meest gewijzigd?
git diff --stat HEAD~10..HEAD 2>/dev/null | tail -20
```

Lees ook de 3 meest recente learnings voor context:
```bash
ls -t docs/learnings/*.md 2>/dev/null | head -3
```

## Stap 2: Vijf retro-vragen

Beantwoord de volgende vragen systematisch op basis van de git-log, deploy-geschiedenis en eventuele bekende issues:

### 1. Wat is er geleverd?
Maak een lijst van features/fixes die live zijn gegaan. Gebruik de git-log als basis. Vermeld per item: omschrijving + commit-SHA.

### 2. Wat ging goed?
Patronen die werkten. Denk aan:
- Snelle deploys zonder problemen
- Effectieve agent-samenwerking
- Vermeden valkuilen (dankzij bestaande checks of learnings)
- Goede test-dekking die bugs vroeg ving

### 3. Wat ging mis?
Eerlijk en concreet. Denk aan:
- Falende tests die deploy blokkeerden
- Onverwachte regressies
- Miscommunicatie of onduidelijke scope
- Technische schuld die is opgebouwd
- Tijdverlies door herhaling van bekende problemen

### 4. Wat is geleerd?
De concrete inzichten. Elk lering moet actieerbaar zijn:
- Niet: "We moeten beter testen"
- Wel: "API routes zonder auth-check detecteren we nu via `/security daily` — dit heeft bug X voorkomen"

### 5. Actiepunten volgende sprint (max 3)
Elk actiepunt heeft drie onderdelen:
- **WAT**: concrete actie
- **WAAROM**: reden/motivatie
- **WIE**: agent of team die het oppakt

Voorbeeld:
```
1. WAT: /security comprehensive maandelijks inplannen als cron-trigger
   WAAROM: We ontdekten A07 (auth failures) laat — eerder signaleren
   WIE: devops

2. WAT: db_latency_ms toevoegen aan /api/health endpoint
   WAAROM: /canary kan nu de DB-latency niet monitoren
   WIE: ontwikkelaar (team-release)
```

## Stap 3: Learning opslaan

Sla op als `docs/learnings/YYYY-MM-DD-<naam>.md`:

```markdown
# Learning: [naam]
Datum: YYYY-MM-DD
Type: sprint | release | incident

## Geleverd
- [item 1] ([SHA])
- [item 2] ([SHA])

## Wat ging goed
- [punt 1]
- [punt 2]

## Wat ging mis
- [punt 1]
- [punt 2]

## Inzichten
- [inzicht 1]
- [inzicht 2]

## Actiepunten volgende sprint
1. **WAT**: [actie] — **WAAROM**: [reden] — **WIE**: [agent/team]
2. **WAT**: [actie] — **WAAROM**: [reden] — **WIE**: [agent/team]
3. **WAT**: [actie] — **WAAROM**: [reden] — **WIE**: [agent/team]
```

Maak `docs/learnings/` aan als het niet bestaat.

Update (of maak) `docs/learnings/README.md`:

```markdown
# Learnings Index

| Datum | Naam | Type | #Actiepunten |
|-------|------|------|--------------|
| YYYY-MM-DD | [naam] | sprint/release/incident | 3 |
```

## Stap 4: Rapporteer aan PO

Presenteer de retro-samenvatting in de sessie. Vraag bevestiging van de actiepunten:

> "Retro opgeslagen in `docs/learnings/[filename]`. De drie actiepunten zijn:
> 1. [...]
> 2. [...]
> 3. [...]
> Akkoord, of wil je iets aanpassen?"

## Gerelateerde skills

- `/start` — laadt recente learnings als context bij opstarten
- `/release` — trigger voor retro na release
- `/team-release` — team dat de release uitvoert
