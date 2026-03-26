---
name: deploy
description: Start het release-team om uncommitted/unpushed wijzigingen te reviewen, testen en deployen. Detecteert zelf welke app(s) geraakt zijn.
user-invocable: true
disable-model-invocation: true
argument-hint: "[optioneel: specifieke instructie]"
---

# Deploy — Automatische release workflow

Start het release-team (`/team-release`) met automatische detectie van wat er gedaan moet worden.

## Wat het team doet

1. **Inventariseer** — `git status`, `git diff`, `git log origin/main..HEAD` om te bepalen:
   - Welke app(s) geraakt zijn (team-indeling, monitor, evaluatie)
   - Wat er gewijzigd is (nieuwe feature, bugfix, refactor)
   - Of er uncommitted changes zijn die eerst gecommit moeten worden
2. **Test** — Unit tests en E2E tests draaien voor de geraakte app(s)
3. **Deploy** — Na goedkeuring pushen naar main, CI+Railway monitoren, verificatie

## Team samenstelling

Gebruik exact het team uit `/team-release`:
- **Lead**: ontwikkelaar — analyseert wijzigingen, draait tests, maakt commit
- **Teammate 1**: e2e-tester — E2E verificatie, go/no-go
- **Teammate 2**: deployment — Railway build monitoren, live-check

## Memory

Raadpleeg memories over eerdere deploy-issues en workarounds voordat je begint.

## Opdracht

Inventariseer de huidige staat van de repo en bepaal wat er gedeployd moet worden.

$ARGUMENTS

Als er geen specifieke instructie is meegegeven:
1. Bekijk `git status` en `git diff` — wat is er gewijzigd?
2. Bekijk `git log origin/main..HEAD` — zijn er unpushed commits?
3. Bepaal welke app(s) geraakt zijn
4. Geef een samenvatting en vraag bevestiging voordat je test en deployt
