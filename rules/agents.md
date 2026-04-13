---
paths:
  - ".claude/agents/**"
  - ".claude/skills/**"
---

## Agents overzicht

| Agent | Domein | Rol |
|---|---|---|
| `product-owner` | Platform (hoofd) | Cross-app samenhang, gebruikersreizen, prioritering |
| `korfbal` | Monitor (hoofd) | Technisch expert, seizoensplanning |
| `data-analist` | Monitor (sub) | Data-pipeline, dashboards |
| `speler-scout` | Monitor (sub) | Individuele spelersanalyse |
| `team-selector` | Brug | Teamindeling (monitor → TI) |
| `team-planner` | TI (hoofd) | Workflow kaders → definitief |
| `regel-checker` | TI (sub) | KNKV + OW regelvalidatie |
| `adviseur` | TI (sub) | Spelersadvies, what-if, Oranje Draad |
| `ontwikkelaar` | TI (dev) | Next.js app bouwen en uitbreiden |
| `e2e-tester` | Test | Playwright E2E tests schrijven, draaien en repareren |
| `devops` | Infra (lead) | DevOps/DX lead, orkestreert deployment + testing + monitoring |
| `deployment` | Infra (sub) | Railway deployments, Cloudflare Worker proxy, DNS |
| `documentalist` | TI (docs) | Documentatie schrijven en onderhouden |
| `jeugdbeleid` | Jeugd | Vaardigheidsraamwerk, POP-ratio's, mentale ontwikkeling, presentaties |
| `ux-designer` | UX (lead) | Design system, prototypes, visuele consistentie, dark design |
| `frontend` | UX (sub) | React componenten, Tailwind, animaties, PWA implementatie |

## Agent Skills (documentatie — geen automatische enforcement)

De `skills:`-lijst in elke agent-file is **informatief**: het documenteert welke skills de agent typisch gebruikt. Er is geen technisch systeem dat agents buiten hun skills blokkeert — het is een conventie voor consistentie en context-controle.

| Agent | Mag gebruiken |
|---|---|
| `product-owner` | `shared/oranje-draad`, `shared/score-model`, `shared/audit` |
| `korfbal` | `monitor/*`, `shared/*` |
| `data-analist` | `monitor/database`, `monitor/lid-monitor`, `monitor/ledenverloop`, `monitor/jeugdmodel`, `monitor/teamsamenstelling`, `shared/oranje-draad`, `shared/score-model` |
| `speler-scout` | `monitor/ledenverloop`, `monitor/jeugdmodel`, `shared/oranje-draad`, `shared/score-model` |
| `team-selector` | `monitor/teamsamenstelling`, `monitor/jeugdmodel`, `shared/oranje-draad`, `shared/score-model` |
| `team-planner` | `team-indeling/*`, `shared/*` |
| `regel-checker` | `team-indeling/validatie`, `shared/oranje-draad` |
| `adviseur` | `team-indeling/advies`, `team-indeling/vergelijk`, `shared/oranje-draad`, `shared/score-model` |
| `ontwikkelaar` | `team-indeling/import`, `team-indeling/evaluatie`, `shared/deployment`, `shared/audit` |
| `devops` | `shared/deployment`, `shared/e2e-testing`, `devops/health-check`, `devops/ci-status`, `shared/audit` |
| `e2e-tester` | `shared/e2e-testing`, `shared/deployment` |
| `deployment` | `shared/deployment`, `monitor/railway` |
| `documentalist` | `team-indeling/scenario`, `team-indeling/validatie`, `shared/oranje-draad` |
| `jeugdbeleid` | `shared/oranje-draad`, `shared/score-model`, `monitor/jeugdmodel`, `monitor/teamsamenstelling` |
| `ux-designer` | `shared/oranje-draad`, `shared/score-model`, `shared/audit` |
| `frontend` | `shared/oranje-draad`, `shared/deployment`, `shared/e2e-testing`, `shared/audit` |

## Agent Hiërarchie

```
product-owner (hoofd platform)
├── spawns: korfbal, ontwikkelaar, ux-designer, data-analist, jeugdbeleid, regel-checker
│
korfbal (hoofd monitor) ← escalates-to: product-owner
├── spawns: data-analist, speler-scout, team-selector
│
team-planner (hoofd TI) ← escalates-to: korfbal
├── spawns: regel-checker, adviseur
│
ontwikkelaar (dev) ← escalates-to: korfbal
├── spawns: e2e-tester, devops
│
devops (infra lead) ← escalates-to: ontwikkelaar
├── spawns: deployment, e2e-tester
│
e2e-tester (test) ← escalates-to: ontwikkelaar
│
deployment (infra) ← escalates-to: devops
│
documentalist (docs) ← escalates-to: ontwikkelaar
├── spawns: ontwikkelaar (technische verificatie), korfbal (domeinverificatie)
│
jeugdbeleid (jeugdontwikkelingsbeleid) ← escalates-to: korfbal
├── spawns: korfbal (korfbal-technisch), speler-scout (spelersdata)
│
ux-designer (hoofd UX) ← escalates-to: ontwikkelaar
├── spawns: frontend, ontwikkelaar
│
frontend (UX implementatie) ← escalates-to: ux-designer
```

## Agent Startup

Bij het spawnen van een agent MOET eerst de `start` skill worden geladen. Dit is niet optioneel. De agent doorloopt alle 4 stappen (basiscontext, domeincontext, dynamische context, eigen agent-bestand) voordat hij aan zijn eigenlijke taak begint.

## Agent Teams

Elf voorgedefinieerde agent teams voor parallelle samenwerking. Activeer met `/team-<naam>`.

| Team | Skill | Lead | Teammates | Use case |
|---|---|---|---|---|
| **Seizoensindeling** | `/team-seizoensindeling` | team-planner | adviseur, regel-checker, data-analist | Volledig indelingstraject (kaders → definitief) |
| **Seizoensanalyse** | `/team-seizoensanalyse` | korfbal | data-analist, speler-scout, team-selector | Seizoensstart: totaalbeeld leden, retentie, prognoses |
| **Release** | `/team-release` | ontwikkelaar | e2e-tester, deployment | Feature bouwen + testen + deployen naar Railway |
| **E2E Testing** | `/team-e2e` | e2e-tester | ontwikkelaar, deployment | E2E testing, regressie, exploratory testing |
| **Documentatie** | `/team-documentatie` | documentalist | ontwikkelaar, korfbal | Documentatie schrijven en bijwerken |
| **Kwaliteit** | `/team-kwaliteit` | ontwikkelaar | e2e-tester, regel-checker, deployment | Code quality review, health check, codebase sweep |
| **DevOps** | `/team-devops` | devops | deployment, e2e-tester, ontwikkelaar | Health checks, CI monitoring, deployment, DX |
| **Jeugdontwikkeling** | `/team-jeugdontwikkeling` | jeugdbeleid | korfbal, speler-scout | Vaardigheidsraamwerk, jeugdbeleid, presentaties voor doelgroepen |
| **UX** | `/team-ux` | ux-designer | frontend, ontwikkelaar | Design system, prototypes, dark theme, PWA, cross-app navigatie |
| **Beheer** | `/team-beheer` | ontwikkelaar | regel-checker, e2e-tester, korfbal | Backend voor 9 TC-domeinen, server actions, data-modellen, handshake voor team-ux |
| **Product** | `/team-product` | product-owner | korfbal, ontwikkelaar, ux-designer | Cross-app samenhang, feature-prioritering, gebruikersreizen, data-contracten |

Team-skills staan in `.claude/skills/team-*/SKILL.md`.

## Skills overzicht

Alle skills staan in `.claude/skills/<naam>/SKILL.md` (flat structuur). Agent frontmatter gebruikt domeinprefixen (`shared/oranje-draad`) voor fencing-documentatie.

### Domein-skills (23)
advies, batch-plaats, concept, database, deployment, e2e-testing, evaluatie, exporteer, import, jeugdmodel, knkv-api, ledenverloop, lid-monitor, oranje-draad, pin, railway, scenario, scenario-analyse, score-model, start, teamsamenstelling, validatie, vergelijk

### Infra-skills (4)
audit, ci-status, health-check, deploy

### Agent Teams (11)
team-seizoensindeling, team-seizoensanalyse, team-release, team-e2e, team-documentatie, team-kwaliteit, team-devops, team-jeugdontwikkeling, team-ux, team-beheer, team-product

## Namespace-conventie
Skills staan in `.claude/skills/<naam>/SKILL.md` (flat structuur).
Agent frontmatter verwijst met domeinprefixen (`shared/oranje-draad`).
Dit is documentatie-conventie, geen directory-structuur.
