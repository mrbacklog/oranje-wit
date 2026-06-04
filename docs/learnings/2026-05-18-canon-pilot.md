# Learning: canon-pilot (Speler/Team/Staf-dialog + reservering)

Datum: 2026-05-18
Type: sprint
Duur: één werkdag

## Geleverd

### Dialoog-canon — vastlegging
- Dialoog-canon-rule + PreToolUse-hook tegen verdubbeling (`b838ccd6`)
- Path-scoped rule `.claude/rules/dialoog-canon.md` + CLAUDE.md verwijzing
- Spec [2026-05-18-dialoog-consolidatie-v2.md](../superpowers/specs/2026-05-18-dialoog-consolidatie-v2.md)
- Realisatieplan §3 bijgewerkt: Fase 1b parallel met dialoog-canon-spelregels

### Drie dialoog-pilots — alle naar canon-locatie
- **SpelerDialog** (`7ece7ebb` + tabs-uitbreiding via 3 agents): `components/speler/contexts/` met Provider + hook + 4 tabs (Spelerspad/Kenmerken/Evaluaties/Werkitems)
- **TeamDialog** (`76eb91e8` + 3 agents): `components/team/contexts/` met Provider + hook + 3 tabs (Overzicht/Validatie/Notities) + kleur-gradient hero
- **StafDialog** (`3ce0d1c2` + 3 agents): `components/staf/contexts/` met Provider + hook + 2 tabs (Historie/Memo's) + foto-fallback

### Reservering als TeamDialog-feature
- `maakReserveringInTeam` + `verwijderReservering` server-actions (`2f850e86`)
- TeamDialog Overzicht-tab: `+ Reservering`-knop per gender + dashed-border rijen + `×`-knop (`17e56b25`)
- E2E `test.fixme()`-placeholders met AgentMutatie-cleanup-pad (`94b9714d`)

### Pre-existing bugs opgelost onderweg
- `personen/spelers/page.tsx`: `tussenvoegsel: true` op Speler-schema → `null` mapping
- `personen/spelers/page.tsx`: `aangemaaktOp` → `createdAt` op Werkitem
- WerkbordShell: dubbele `posities`-prop door parallelle merges → één bron (lokale state)
- CI fast-gate hersteld door prettier-fix 4 v2-files

## Wat ging goed

- **Parallelle agents in worktrees** — vier agents tegelijk (A/B/C/D) op één feature werkt soepel als type-contract eerst op main staat. Drie pilots achter elkaar zonder noemenswaardig tijdverlies tussen merges.
- **Type-contract als brug** — `TeamKaartData`/`SpelerRijData`/`StafRijData` uitbreidingen vooraf gecommit, agents werkten parallel tegen één API. Geen merge-conflicten op contract zelf.
- **Memory-feedback `verifieer-voor-vertrouwen` werkt** — direct nadat agent zegt "klaar" ging ik typecheck/build draaien en vond ik twee conflicten die agents niet vermeldden (lokaal `SpelerWerkitemDetail`-type, `posities` dubbel).
- **PreToolUse hook tegen dialoog-duplicatie** is effectief vanaf moment van toevoegen — geen test, wel preventie van toekomstige incidenten.
- **Patchstijl-deploy via main** — elke commit `patch:` ging direct na merge naar productie. Studio-test had live SHA binnen ~60s na push (gemeten via `/api/health` polling).
- **Eenduidige Provider-pattern** — drie keer hetzelfde patroon `<EntiteitDialogProvider>` met `open(id, opts?)` + server-action data-loader. Refactor-templating werkt: tweede en derde Provider waren in <2 min geschreven door Agent D.

## Wat ging mis

- **Drie pre-existing schema-bugs in v2 productiecode** (`tussenvoegsel`, `aangemaaktOp`, `posities` dubbel) blokkeerden E2E-verificatie totdat ze gefixt waren. Ze zaten al in main vóór deze sessie — niemand had ze ontdekt omdat /personen/spelers waarschijnlijk niet werd getest in CI/handmatig.
- **Playwright MCP click() werkt niet op PDND-draggables**. Werkbord-pool-click + team-kaart-click in werkbord openen de dialog niet via MCP, alleen via een echte browser. Resultaat: 3 van 4 E2E-tests in elk pilot eindigen op `test.skip` of `test.fixme` voor de werkbord-route. Tests via personen-tabel werken wel.
- **Seed-data is incompleet** op studio-test: geen actieve staf voor StafDialog, geen reserveringen om te verwijderen, leeg werkbord-team voor reservering-creatie. E2E-tests konden interactie niet hard verifiëren, alleen rendering.
- **Lokale typecheck faalt soms door corrupt `.next/dev/types/`** uit vorige dev-server-run; build werkt wel. Twee keer tijd verloren met `tsc`-fouten die niet uit onze code kwamen.
- **Een agent (B van SpelerDialog) definieerde een lokaal `SpelerWerkitemDetail`-type** met striktere enum dan het centraal type → typeconflict bij merge. Komt ondanks expliciet "geen lokale type-shadowing" in agent-prompt. Hint: agents lezen prompt-regels niet altijd consistent toe.
- **Parallelle sessies pushen tijdens onze sessie** — vier maal moest ik `git pull --rebase` doen tussen merges, één keer mijn fix overschreven door rebase-skip. Coördinatie via git werkt maar vergt waakzaamheid.
- **`git push` deed niets** ("Everything up-to-date") nadat een hook of een vorige sessie de commit al had gepusht — verwarrend. Reflog redde het maar koste tijd.

## Inzichten

1. **Type-contract eerst maakt 4-way parallel mogelijk**. Zonder gedeeld interface zouden A/B/C/D conflicten geven. De ~2 minuten investering vooraf bespaart 10x tijd in merge-fase.
2. **Pre-existing schema-bugs in v2 worden alleen ontdekt bij feitelijke productie-runtime** (Prisma-validatie op queries). Build + typecheck slagen — runtime crash. Eerste keer pijnlijk, daarna sneller te diagnosticeren via `/deployment logs`.
3. **Playwright MCP voor canon-pilots is beperkt** door PDND-conflict. Echte E2E-validatie vereist Playwright in CI of een echte browser. MCP is goed voor screenshot+inspectie, niet voor drag-drop-interactie.
4. **Dialoog-canon is afgerond binnen één werkdag** door deze parallelle aanpak. Drie entiteit-dialogen + reservering-feature = ~30 commits, allemaal patch-deploy zonder PR. Dit toont dat de Fase 1b-strategie uit het realisatieplan praktijk-haalbaar is.
5. **PreToolUse-hooks zijn een effectief preventie-mechanisme** voor structurele regels (canon-locatie). Beter dan documentatie omdat agents pad-blokkering direct merken; documentatie kan worden overgeslagen.
6. **Reservering-feature hoort bij TeamDialog, niet als eigen dialog**. Korte brainstorm-vraag voorkwam onnodige canon-uitbreiding. Soms is de juiste keuze "niet bouwen".

## Actiepunten volgende sprint

1. **WAT**: Schema-validatie-job in CI die alle Prisma-queries in `apps/*/src/**` typecheckt tegen het schema (al gebeurt impliciet, maar onthul de runtime-pad — bv. via een `prisma validate` of integration-test op alle queries) — **WAAROM**: pre-existing schema-bugs zoals `tussenvoegsel` en `aangemaaktOp` ontdekken we nu pas op productie. Eerder signaleren = veel minder tijdverlies. — **WIE**: `devops`

2. **WAT**: Seed-data van studio-test aanvullen met actieve staf, complete team-rosters en realistische reserveringen — **WAAROM**: E2E-tests draaien nu skip-only op studio-test omdat data ontbreekt. Met representatieve seed-data zijn de tests echt verificerend. — **WIE**: `data-analist` of `team-devops`

3. **WAT**: Playwright-test-runner toevoegen aan CI die elke nacht draait tegen studio-test met agent-auth — **WAAROM**: PDND-flow is niet via MCP te testen; in een echte Playwright-run wél. Nu hebben we tests geschreven maar niet routineus uitgevoerd. — **WIE**: `e2e-tester` + `devops` samen
