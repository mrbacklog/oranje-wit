# Token-optimalisatie Implementatieplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Structureel token-gebruik van Claude Sonnet reduceren zonder vibecoding-kracht te verliezen, door slimmere model routing, compactere context en lazy loading van grote bestanden.

**Architecture:** Vier onafhankelijke assen — (1) model routing van 3 agents naar Haiku, (2) score-model.md splitsen in compact + volledig, (3) CLAUDE.md comprimeren door code-voorbeelden te verwijderen, (4) `/start-lite` skill voor sub-agents + MEMORY.md consolideren.

**Tech Stack:** Markdown, YAML frontmatter, Claude Code agent configuration

**Huidige staat (na eerdere sessie):**
- `.claudeignore` is al aangemaakt ✓
- 8 agents al op `model: haiku` (communicatie, data-analist, deployment, devops, documentalist, e2e-tester, regel-checker, speler-scout) ✓
- 11 agents op `model: inherit` (= Sonnet): adviseur, frontend, jeugd-architect, korfbal, mentaal-coach, ontwikkelaar, product-owner, sportwetenschap, team-planner, team-selector, ux-designer

---

## Task 1: Model routing — 3 agents naar Haiku

**Files:**
- Modify: `.claude/agents/mentaal-coach.md`
- Modify: `.claude/agents/sportwetenschap.md`
- Modify: `.claude/agents/team-selector.md`

**Rationale:**
- `mentaal-coach`: vertaalt beleid naar coaching-tips, geen complex redeneren vereist
- `sportwetenschap`: zoekt en synthetiseert onderzoek via WebSearch, geen multi-file architectuur
- `team-selector`: past regels toe op spelerlijsten, regel-checker doet de validatie

**Agents die op Sonnet blijven:** adviseur, frontend, jeugd-architect, korfbal, ontwikkelaar, product-owner, team-planner, ux-designer

- [ ] **Stap 1: Lees huidige frontmatter van mentaal-coach**

```bash
head -10 .claude/agents/mentaal-coach.md
```

Verwacht: `model: inherit` op regel 5 of 6.

- [ ] **Stap 2: Wijzig model in mentaal-coach.md**

Vervang `model: inherit` door `model: haiku` in `.claude/agents/mentaal-coach.md`.

- [ ] **Stap 3: Wijzig model in sportwetenschap.md**

Vervang `model: inherit` door `model: haiku` in `.claude/agents/sportwetenschap.md`.

- [ ] **Stap 4: Wijzig model in team-selector.md**

Vervang `model: inherit` door `model: haiku` in `.claude/agents/team-selector.md`.

- [ ] **Stap 5: Verifieer**

```bash
grep "^model:" .claude/agents/*.md | sort
```

Verwacht: 11 regels met `model: haiku`, 8 met `model: inherit`.

- [ ] **Stap 6: Commit**

```bash
git add .claude/agents/mentaal-coach.md .claude/agents/sportwetenschap.md .claude/agents/team-selector.md
git commit -m "fix: model routing — mentaal-coach, sportwetenschap, team-selector naar haiku"
```

---

## Task 2: score-model.md splitsen

**Files:**
- Create: `rules/score-model-compact.md` (~2KB — schaal + formules, geen TypeScript/grafiek/voorbeelden)
- Modify: `rules/score-model.md` — voeg bovenaan pointer naar compact versie toe
- Modify: `.claude/skills/score-model/SKILL.md` — verwijs agents naar compact tenzij ze diep in scores duiken

**Principe:** Agents die USS-niveaus gebruiken voor vergelijking (adviseur, korfbal, team-selector) laden compact. Agents die scores daadwerkelijk *berekenen* of *kalibreren* laden volledig.

- [ ] **Stap 1: Maak rules/score-model-compact.md**

Maak een nieuw bestand `rules/score-model-compact.md` met exact deze inhoud:

```markdown
# Score-Model Compact — USS Referentie

> Versie 1.0 — Zie `rules/score-model.md` voor volledige uitleg, TypeScript, kalibratie en voorbeelden.

## USS-schaal

| USS | Niveau |
|-----|--------|
| 0–20 | Net begonnen (jongste Blauw) |
| 20–50 | Blauw/Groen niveau |
| 50–80 | Groen/Geel niveau |
| 80–110 | Geel niveau (gemiddeld tot sterk) |
| 110–130 | Oranje niveau / sterk Geel |
| 130–150 | Rood niveau / A-categorie instap |
| 150–170 | A-categorie (U17-HK, U19) |
| 170–200 | Top jeugd / senioren niveau |

Een speler met USS 115 en een team met USS 115 zijn vergelijkbaar sterk.

## Leeftijdsgrenzen (peildatum 31-12)

| Categorie | Grens | Geboortejaren 2026-2027 |
|-----------|-------|--------------------------|
| U15 | < 15.00 | 2012, 2013 |
| U17 | < 17.00 | 2010, 2011 |
| U19 | < 19.00 | 2008, 2009 |

Exacte leeftijd = (peildatum − geboortedatum in dagen) / 365.25

## Basislijn (verwachte USS per leeftijd)

| Leeftijd | 5 | 7 | 9 | 11 | 13 | 15 | 17 | 18 |
|----------|---|---|---|----|----|----|----|-----|
| USS | 12 | 23 | 41 | 67 | 98 | 127 | 149 | 157 |

Formule: `S(l) = 180 / (1 + e^(-0.35 * (l - 12.5)))`

## Bronnen → USS

| Bron | Formule |
|------|---------|
| KNKV teamrating | USS_team = KNKV_rating (direct) |
| Scouting spelersscore (0–10) | USS = basislijn(leeftijd) + (score − 5) × schaalFactor(leeftijd) |
| Coach-evaluatie (1–5 per dimensie) | Normaliseer naar 0–10, dan zelfde als scouting |

## Gecombineerde speler-USS

```
USS_speler = gewogen_gemiddelde(scouting_USS, evaluatie_USS)
```

Gewichten afhankelijk van beschikbaarheid: scouting 60% / evaluatie 40% als beide beschikbaar.

## Teamsterkte vs speler

```
USS_team ≈ gemiddelde USS van de spelers in dat team
```

Een speler is "op niveau" als zijn USS binnen ±15 van de team-USS ligt.
```

- [ ] **Stap 2: Voeg pointer toe bovenaan score-model.md**

Voeg direct na de frontmatter (na regel 7, voor `Dit document is de...`) in `rules/score-model.md` toe:

```markdown
> **Agents:** Gebruik `rules/score-model-compact.md` voor USS-vergelijkingen en niveaubepaling. Laad dit volledige document alleen als je scores berekent, kalibratieprotocol uitvoert of TypeScript-implementaties raadpleegt.

```

- [ ] **Stap 3: Verifieer compact bestand**

```bash
wc -c rules/score-model-compact.md
```

Verwacht: < 2500 bytes.

- [ ] **Stap 4: Commit**

```bash
git add rules/score-model-compact.md rules/score-model.md
git commit -m "feat: score-model-compact.md — 2KB USS referentie voor agents die niet diep in scores duiken"
```

---

## Task 3: Score-model verwijzingen updaten in agents en skills

**Files:**
- Modify: `.claude/agents/adviseur.md` — compact laden i.p.v. volledig
- Modify: `.claude/agents/korfbal.md` — compact laden
- Modify: `.claude/agents/team-planner.md` — compact laden
- Modify: `.claude/skills/score-model/SKILL.md` — instructie toevoegen welke versie te laden

**Aanpak:** In de agent-bestanden staat soms `rules/score-model.md` expliciet vermeld in hun instructies. We voegen een instructie toe om de compact versie te gebruiken tenzij expliciet scoring nodig is.

- [ ] **Stap 1: Check huidige verwijzingen in agent-bestanden**

```bash
grep -rn "score-model" .claude/agents/ .claude/skills/
```

Noteer welke bestanden `score-model.md` noemen.

- [ ] **Stap 2: Voeg laad-instructie toe in adviseur.md**

In het opstartgedeelte van `.claude/agents/adviseur.md`, voeg toe na de start-skill instructie:

```
Voor USS-vergelijkingen: lees `rules/score-model-compact.md` (niet de volledige versie).
Laad `rules/score-model.md` alleen als je daadwerkelijk scores berekent.
```

- [ ] **Stap 3: Idem voor korfbal.md en team-planner.md**

Zelfde toevoeging in `.claude/agents/korfbal.md` en `.claude/agents/team-planner.md`.

- [ ] **Stap 4: Voeg instructie toe in score-model skill**

In `.claude/skills/score-model/SKILL.md`, voeg bovenaan toe:

```markdown
> **Laden:** Gebruik `rules/score-model-compact.md` voor overzichten. Laad `rules/score-model.md` alleen voor kalibratie, TypeScript-implementaties of voorbeeldberekeningen.
```

- [ ] **Stap 5: Commit**

```bash
git add .claude/agents/adviseur.md .claude/agents/korfbal.md .claude/agents/team-planner.md .claude/skills/score-model/SKILL.md
git commit -m "fix: agents laden score-model-compact tenzij volledige scoring nodig"
```

---

## Task 4: CLAUDE.md comprimeren

**Files:**
- Modify: `CLAUDE.md` — verwijder alle code-voorbeelden (~3KB), houd patronen als 1-regel beschrijvingen

**Doel:** Van 9KB naar <5KB. Code-voorbeelden voor `logger`, `guardTC`, `requireTC`, `ok()`/`fail()`, `ActionResult` zijn redundant — ze staan in de codebase zelf. Agents die deze patronen nodig hebben lezen de bestaande code of de auth/api packages.

**Wat blijft:** Structuur, commando's, verplichte patronen (1 zin per patroon), database-regels, communicatie, Oranje Draad, TC-doelgroepen tabel, verwijzingen.

- [ ] **Stap 1: Verwijder Logger codeblok**

In `CLAUDE.md`, vervang het hele blok:

```markdown
**Logger** — gebruik altijd `logger` uit `@oranje-wit/types`, nooit `console.log`:
```ts
import { logger } from "@oranje-wit/types";
logger.info("...");   // alleen in development
logger.warn("...");   // altijd
logger.error("...");  // altijd
```
```

Door:

```markdown
**Logger** — gebruik `logger` uit `@oranje-wit/types`, nooit `console.log`. `logger.info` alleen in development, `logger.warn`/`logger.error` altijd.
```

- [ ] **Stap 2: Vervang Auth guards codeblokken**

Vervang het hele Auth guards blok (twee codeblokken met `guardTC` en `requireTC`) door:

```markdown
**Auth guards** — `guardTC()` in API routes (returnt Result, geen throw), `requireTC()` in server actions (throwt als niet-TC). Beide in `@oranje-wit/auth/checks`.
```

- [ ] **Stap 3: Vervang API routes codeblok**

Vervang het volledige API routes codeblok (met `ok()`, `fail()`, `parseBody()`, Schema, guardTC, try/catch) door:

```markdown
**API routes** — gebruik `ok()`/`fail()`/`parseBody()` uit `@/lib/api`. Altijd auth guard als eerste, dan body parsen met Zod schema, dan try/catch met `fail(error)`.
```

- [ ] **Stap 4: Vervang Server Action results codeblok**

Vervang het `ActionResult<T>` codeblok door:

```markdown
**Server Action results** — return type altijd `ActionResult<T>` uit `@oranje-wit/types`. `{ ok: true, data: T }` of `{ ok: false, error: string }`.
```

- [ ] **Stap 5: Vervang Constanten codeblok**

Vervang het constanten codeblok door:

```markdown
**Constanten** — importeer `PEILJAAR`, `HUIDIG_SEIZOEN`, `PEILDATUM` uit `@oranje-wit/types`, definieer niet lokaal.
```

- [ ] **Stap 6: Vervang Error handling codeblok**

Vervang het error handling codeblok door:

```markdown
**Error handling** — geen lege catch blocks, altijd loggen met `logger.warn("context:", error)`.
```

- [ ] **Stap 7: Verwijder Deploy codeblok**

Het blok:
```
Antjan → product-owner → /team-release patch <scope>    # kleine fix
Antjan → product-owner → /team-release release <scope>  # feature bundel
```
Kan vervangen worden door: `Antjan → product-owner → /team-release patch|release <scope>`

- [ ] **Stap 8: Verifieer grootte**

```bash
wc -c CLAUDE.md && wc -l CLAUDE.md
```

Verwacht: < 5500 bytes, < 150 regels.

- [ ] **Stap 9: Commit**

```bash
git add CLAUDE.md
git commit -m "fix: CLAUDE.md comprimeren — code-voorbeelden vervangen door 1-regel patronen (-4KB)"
```

---

## Task 5: /start-lite skill voor sub-agents

**Files:**
- Create: `.claude/skills/start-lite/SKILL.md`
- Modify: `.claude/agents/regel-checker.md` — gebruik start-lite
- Modify: `.claude/agents/deployment.md` — gebruik start-lite
- Modify: `.claude/agents/e2e-tester.md` — gebruik start-lite
- Modify: `.claude/agents/documentalist.md` — gebruik start-lite
- Modify: `.claude/agents/communicatie.md` — gebruik start-lite
- Modify: `.claude/agents/devops.md` — gebruik start-lite (lead, maar spawnt voor infra)

**Principe:** Sub-agents hebben geen seizoenscyclus, git-context of PO-afstemming nodig. Ze krijgen hun taakopdracht van de lead-agent die al die context heeft verwerkt.

- [ ] **Stap 1: Maak .claude/skills/start-lite/SKILL.md**

```markdown
---
name: start-lite
description: Lichtgewicht projectcontext voor sub-agents. Laad dit i.p.v. start als je als sub-agent werkt onder een lead-agent. Stap 1+2 only — geen git, geen seizoen, geen PO.
user-invocable: false
allowed-tools: Read
---

# Start Lite — Basiscontext voor sub-agents

Je werkt als sub-agent. De lead-agent heeft al volledige context, seizoensinformatie en git-status verwerkt. Jij hebt alleen basiscontext nodig.

## Stap 1: Basiscontext (altijd)

**Vereniging:** c.k.v. Oranje Wit — korfbalvereniging Dordrecht.
- Taal: altijd Nederlands, informeel en direct
- Naam: "c.k.v. Oranje Wit" (met punten, spatie)
- Privacy: nooit BSN, geboortedatum of adres

**Oranje Draad:** PLEZIER + ONTWIKKELING + PRESTATIE → DUURZAAMHEID

**Stack:** Next.js 16 in `apps/web/`, PostgreSQL + Prisma in `packages/database/`, `rel_code` is enige stabiele identifier voor leden.

**Patronen:**
- Logger: `logger` uit `@oranje-wit/types`, nooit `console.log`
- Auth: `guardTC()` in API routes, `requireTC()` in server actions
- API helpers: `ok()`/`fail()`/`parseBody()` uit `@/lib/api`
- Server actions: return `ActionResult<T>` uit `@oranje-wit/types`
- Nooit `db:push` — gebruik `db:migrate`

## Stap 2: Domeincontext (alleen wat je nodig hebt)

Lees **alleen** de rules die direct relevant zijn voor jouw specifieke taak:

| Domein | Relevante rules |
|--------|-----------------|
| KNKV-validatie | `rules/knkv-regels.md`, `rules/ow-voorkeuren.md` |
| Deployment | `.claude/skills/deployment/SKILL.md` |
| E2E tests | `rules/routes.md` (voor URL-structuur) |
| Documentatie | Lees het bestand dat je documenteert |
| Communicatie | `rules/oranje-draad.md` (alleen de pijlers) |

Lees **niet** automatisch: `rules/agents.md`, `rules/score-model.md`, `docs/kennis/seizoenscyclus.md`, git log/status.

## Klaar

Je hebt voldoende context. Voer de taak uit die je lead-agent je heeft gegeven.
```

- [ ] **Stap 2: Update opstartinstructie in regel-checker.md**

Vervang in `.claude/agents/regel-checker.md` de tekst `shared/start skill` door `shared/start-lite skill` in de opstartinstructie. Vervang ook de omschrijving "alle 4 stappen" door "stap 1+2 (basiscontext en domeincontext)".

- [ ] **Stap 3: Idem voor deployment.md, e2e-tester.md, documentalist.md, communicatie.md**

In elk van deze agent-bestanden: vervang `shared/start` door `shared/start-lite` in de opstartinstructie.

- [ ] **Stap 4: Check devops.md**

```bash
head -30 .claude/agents/devops.md
```

Als devops ook `shared/start` laadt en voornamelijk als sub-agent van ontwikkelaar werkt: zelfde wijziging. Als devops als lead opereert (eigen sessie), behoud `start`.

- [ ] **Stap 5: Verifieer**

```bash
grep -n "start" .claude/agents/regel-checker.md .claude/agents/deployment.md .claude/agents/e2e-tester.md
```

Verwacht: alle drie verwijzen naar `start-lite`.

- [ ] **Stap 6: Commit**

```bash
git add .claude/skills/start-lite/ .claude/agents/regel-checker.md .claude/agents/deployment.md .claude/agents/e2e-tester.md .claude/agents/documentalist.md .claude/agents/communicatie.md
git commit -m "feat: start-lite skill — sub-agents laden minimale context, geen git/seizoen/PO"
```

---

## Task 6: MEMORY.md consolideren

**Files:**
- Modify: `C:/Users/Antjan/.claude/projects/c--Users-Antjan-oranje-wit/memory/MEMORY.md`
- Delete (of archiveren): 4–5 verouderde memory files

**Doel:** Van 22 entries naar ≤ 15. De MEMORY.md index staat altijd in de system-reminder — elke entry kost context.

**Kandidaten voor verwijdering** (historisch, niet meer actionable):
- `project_setup-nieuwe-pc.md` — eenmalige setup, afgerond
- `project_sessie-28-30-maart.md` — activiteitenlog, nu git history
- `project_broken-links-consolidatie.md` — fix is doorgevoerd, regel staat in CLAUDE.md
- `project_lokale-database-setup.md` — stabiele configuratie, verandert niet

**Kandidaten voor samenvoeging:**
- `project_ti-scheiding-2026-03-28.md` + `project_ti-studio-fase2.md` → één memory over TI-scheiding en fase 2 status

- [ ] **Stap 1: Lees de 4 te verwijderen memory files**

Lees de volgende bestanden en bevestig dat de inhoud ofwel achterhaald is, ofwel al ergens anders gedocumenteerd:
- `memory/project_setup-nieuwe-pc.md`
- `memory/project_sessie-28-30-maart.md`
- `memory/project_broken-links-consolidatie.md`
- `memory/project_lokale-database-setup.md`

- [ ] **Stap 2: Verwijder de 4 bestanden**

```bash
rm "C:/Users/Antjan/.claude/projects/c--Users-Antjan-oranje-wit/memory/project_setup-nieuwe-pc.md"
rm "C:/Users/Antjan/.claude/projects/c--Users-Antjan-oranje-wit/memory/project_sessie-28-30-maart.md"
rm "C:/Users/Antjan/.claude/projects/c--Users-Antjan-oranje-wit/memory/project_broken-links-consolidatie.md"
rm "C:/Users/Antjan/.claude/projects/c--Users-Antjan-oranje-wit/memory/project_lokale-database-setup.md"
```

- [ ] **Stap 3: Lees en merge TI-scheiding memories**

Lees `memory/project_ti-scheiding-2026-03-28.md` en `memory/project_ti-studio-fase2.md`. Maak één nieuwe memory `memory/project_ti-studio-status.md` die de huidige stand combineert:
- Wat is de scheiding (teamindeling mobile dark / ti-studio desktop light)
- Wat is de fase 2 prioriteit (KNKV kaders, dark theme werkbord, Daisy AI koppelen)

- [ ] **Stap 4: Verwijder de twee losse bestanden**

```bash
rm "C:/Users/Antjan/.claude/projects/c--Users-Antjan-oranje-wit/memory/project_ti-scheiding-2026-03-28.md"
rm "C:/Users/Antjan/.claude/projects/c--Users-Antjan-oranje-wit/memory/project_ti-studio-fase2.md"
```

- [ ] **Stap 5: Update MEMORY.md index**

Verwijder de 6 verwijderde entries en voeg de nieuwe `project_ti-studio-status.md` toe. Controleer dat de index ≤ 15 entries heeft.

```bash
wc -l "C:/Users/Antjan/.claude/projects/c--Users-Antjan-oranje-wit/memory/MEMORY.md"
```

Verwacht: ≤ 20 regels (inclusief header en lege regels).

---

## Verwachte impact

| Aanpassing | Geschatte besparing |
|---|---|
| `.claudeignore` (`.next/`) | 30-40% context bij file-zoekopdrachten |
| 3 extra agents naar Haiku | ~20× kostenreductie voor die agents |
| score-model compact (23KB → 2KB) | 21KB minder × 4-6 agents per sessie |
| CLAUDE.md (-4KB) | 4KB minder bij **elke** sessie |
| start-lite (stap 3-6 weg) | ~1.5KB × elke sub-agent startup |
| MEMORY.md (-7 entries) | Compactere system-reminder elke sessie |

**Totaal verwacht:** 40-60% tokenbesparing per gemiddelde multi-agent sessie.

---

## Niet in dit plan

- `/compact` workflow-gedrag — dit is een persoonlijke gewoonte, geen configuratie
- Prompt caching — werkt automatisch, geen actie nodig
- Eén taak per bericht — gedragsadvies voor Antjan, niet configureerbaar
