# Design: Projectfundament — Documentatie, Kennis & Agent-infrastructuur

**Datum**: 2026-03-29
**Status**: Goedgekeurd
**Aanvrager**: Antjan Laban (PO)
**Scope**: Documentatie, kennislaag, CLAUDE.md herstructurering, agent-fundament

---

## 1. Probleem

Het project is organisch gegroeid tot 764+ bestanden, 75 pagina's, 19 agents en 40 skills. De sturingslaag (CLAUDE.md, documentatie, agent-configuratie) is niet meegegroeid:

- **CLAUDE.md is 400+ regels** — 2x boven aanbevolen max, waardoor agents instructies missen
- **Geen duidelijke roadmap** — "wat bouwen we en in welke volgorde?" ontbreekt
- **Agents missen samenhang** — ze weten niet in welke seizoensfase de TC zit
- **Documentatie was ruis** — 155+ bestanden, veel verouderd, research en archief vermengd met actieve docs
- **Wisselende kwaliteit** — agents produceren inconsistent werk door gebrek aan context
- **Veel herhaling nodig** — elke sessie opnieuw context geven

## 2. Uitgangspunten

### Gebruikersprofiel
De opdrachtgever is een senior PO met bestuurservaring. Hij bepaalt visie en strategie, delegeert uitvoering aan digitale product teams (agents), en laat zich adviseren door specialisten op technisch vlak. Hij wil controle houden en kunnen bijsturen, maar niet elke technische beslissing zelf nemen.

### Horizon
Eén seizoen vooruit (2026-2027). Niet verder plannen omdat AI-technologie razendsnel verandert. Maximaal wendbaar blijven. De jaarkalender en terugkerende TC-acties staan vast; de rest is flexibel.

### Google Workspace
Google Workspace (Gmail, Calendar) wordt een kanaal, geen apart domein. Het platform stuurt, Google voert uit (e-mails versturen, agenda-items aanmaken). Microsoft Graph API (Outlook) staat op de roadmap als kennisbron (MCP server met OAuth).

---

## 3. Seizoenscyclus als ruggengraat

### 3.1 Seizoensritme

Een korfbalseizoen kent drie periodes. Twee seizoenen overlappen altijd.

| Periode | Maanden | Kenmerk |
|---------|---------|---------|
| **Start** | aug - sep | "Vierkante wielen" — alles nieuw, teams laten draaien |
| **Draaiend** | okt - feb | Op stoom — competitie, opleidingen, tussentijdse bijsturing |
| **Oogsten & Zaaien** | mrt - jun | Op rolletjes — evaluaties, teamindeling volgend seizoen |

### 3.2 Activiteitenstromen

Geen lagen of fasen — alles loopt continu met wisselende intensiteit:

| Stroom | Start | Draaiend | Oogsten & Zaaien |
|--------|-------|----------|-------------------|
| Competitie & wedstrijden | Hoog | Zeer hoog | Hoog |
| Roostering & logistiek | Zeer hoog | Gemiddeld | Laag |
| Opleidingen & clinics | Laag | Hoog | Laag |
| Evaluaties & gesprekken | Laag | Laag | Zeer hoog |
| Teamindeling volgend seizoen | — | Laag | Zeer hoog |
| Trainersbegeleiding | Hoog | Hoog | Gemiddeld |
| Werving & retentie | Hoog | Laag | Hoog |

### 3.3 Mijlpalen

Mijlpalen zijn vaste ankerpunten die elk seizoen terugkomen. De volgorde is altijd hetzelfde, de exacte data verschuiven. Veel data worden bepaald door het KNKV.

Volledige maandkalender met alle TC-acties en KNKV-deadlines: zie `docs/kennis/seizoenscyclus.md`.

### 3.4 KNKV als externe driver

Het KNKV bepaalt veel deadlines, soms met extreem korte reactietijden (2-4 dagen). Het platform moet hier proactief op signaleren. Alle KNKV-competitieregels: zie `docs/kennis/knkv-competitie.md`.

### 3.5 Wat dit oplost

| Probleem | Hoe de seizoenscyclus het oplost |
|----------|----------------------------------|
| "Wat bouwen we?" | Wat het platform nodig heeft per fase/mijlpaal/actie |
| "Agents missen samenhang" | Agents weten in welke periode het seizoen zit |
| "Wisselende kwaliteit" | Elke taak heeft seizoenscontext |
| "Google Workspace" | Gmail/Calendar worden kanalen per actie |

---

## 4. Kennislaag — drie niveaus

### 4.1 Architectuur

```
docs/kennis/          ← Domeinkennis (seizoenscyclus, KNKV, TC-organisatie)
    │                    Publiek: agents, TC-leden, onboarding
    │
rules/                ← Technische constraints en beleidsregels
    │                    Path-scoped: laden op aanvraag per domein
    │
CLAUDE.md (compact)   ← Project-essentials (~150 regels)
                         Altijd geladen: elke sessie
```

### 4.2 docs/kennis/ (nieuw, 4 bestanden)

| Bestand | Inhoud |
|---------|--------|
| `seizoenscyclus.md` | Jaarkalender, maandoverzicht TC-acties, KNKV-deadlines, activiteitenstromen |
| `knkv-competitie.md` | Competitiestructuur, A/B-categorie regels, speelgerechtigdheid, kleurcodes, boetes |
| `tc-organisatie.md` | TC-rolverdeling, coördinatoren, communicatieketen, vergaderstructuur |
| `referenties-jeugdontwikkeling.md` | Alle bronverwijzingen uit research en paneldiscussies |

**Bron**: gedestilleerd uit 43.000 regels WhatsApp-chats (3 groepen, 2017-2026), 72 TC-e-mails (2017-2026), en de KNKV-website.

### 4.3 rules/ (bestaand + uitgebreid)

Bestaande rules blijven ongewijzigd. Drie nieuwe rules met path-scoping:

| Nieuw bestand | Bevat | Path-scope |
|---------------|-------|------------|
| `rules/database.md` | 61-modellen tabel, rel_code regels, VIEW-waarschuwing, data flow | `packages/database/**`, `**/*.prisma` |
| `rules/agents.md` | Agent-hiërarchie, fencing-tabel, spawn-rechten, team-skills | `.claude/agents/**`, `.claude/skills/**` |
| `rules/routes.md` | Route-tabel, route groups, navigatie-manifest referentie | `apps/web/src/app/**` |

Bestaande rules krijgen `paths:` frontmatter:

| Bestand | Path-scope |
|---------|------------|
| `rules/knkv-regels.md` | `apps/web/src/app/(teamindeling)/**`, `apps/web/src/app/(teamindeling-studio)/**` |
| `rules/ow-voorkeuren.md` | idem |
| `rules/design-system.md` | `packages/ui/**`, `apps/web/src/components/**` |
| `rules/beheer.md` | `apps/web/src/app/(beheer)/**` |
| `rules/teamindeling-scheiding.md` | `apps/web/src/app/(teamindeling)/**`, `apps/web/src/app/(teamindeling-studio)/**` |

### 4.4 CLAUDE.md herstructurering

Van 400+ naar ~150 regels. Wat blijft:

- Monorepo-structuur (kort)
- Commando's (pnpm dev, build, test, etc.)
- Verplichte patronen (logger, auth guards, API routes — kritiek, voorkomt fouten)
- Database kern (PostgreSQL, Prisma, NOOIT db:push, rel_code)
- Privacy en communicatieregels
- Verwijzingen naar rules/ en docs/kennis/

Wat verhuist:
- 61-modellen tabel → `rules/database.md`
- Agent-hiërarchie en fencing → `rules/agents.md`
- Volledige route-tabel → `rules/routes.md`
- Design system details → `rules/design-system.md` (bestaat al)
- Data flow diagram → `rules/data.md` (bestaat al)
- Competitie-datamodel details → `rules/database.md`

---

## 5. Agent-fundament

### 5.1 Skills opschonen

| Actie | Wat |
|-------|-----|
| Verwijder `deploy` skill | Duplicaat van `deployment` |
| Consolideer `import` | Eén skill in `shared/` namespace; verwijder duplicaat |
| Consolideer `evaluatie` | Eén skill in `shared/` namespace; verwijder duplicaat |
| **Nieuwe skill: `seizoenscyclus`** | Geeft seizoenscontext aan elke agent |

### 5.2 Seizoenscyclus-skill

De belangrijkste toevoeging. Levert aan elke agent:

- Welk seizoen is actief?
- Welke periode (start / draaiend / oogsten & zaaien)?
- Welke mijlpalen staan open?
- Wat is de eerstvolgende KNKV-deadline?
- Welke activiteitenstromen zijn nu het meest intensief?

### 5.3 Start-skill uitbreiden

De `start` skill laadt naast basiscontext ook:
- Relevante kennisdocumenten (op basis van agent-domein)
- Seizoenscontext (via seizoenscyclus-skill)

### 5.4 Namespace-consistentie

Skills staan in `.claude/skills/<naam>/SKILL.md` (flat structuur). Agent frontmatter verwijst met domeinprefixen (`shared/oranje-draad`). Dit is documentatie-conventie, geen directory-structuur. Verduidelijken in `rules/agents.md`.

---

## 6. Documentatie na opschoning

### 6.1 Uitgevoerde opschoning (2026-03-29)

Verwijderd (kennis gebundeld in docs/kennis/):
- `docs/mails/` — 72 e-mails → gedestilleerd in seizoenscyclus + knkv-competitie
- `docs/chats/` — 3 WhatsApp-exports (43K regels) → gedestilleerd in seizoenscyclus + tc-organisatie
- `docs/*.csv` — 2 ledenexports (data zit in database)
- `docs/design/prototypes/` — 3 HTML-prototypes (vervangen door Next.js)
- `docs/plans/archief/` — uitgevoerde/afgeblazen plannen
- `docs/jeugdontwikkeling/archief/` — v1-v2.1 raamwerken (v3 is definitief)
- `docs/jeugdontwikkeling/panel-*.md` — 4 afgeronde paneldiscussies
- `docs/jeugdontwikkeling/research-*.md` — 4 research-documenten (verwerkt in v3)
- `docs/monitor-v1.md` — verouderde architectuur
- `docs/beheer/inventarisatie.md` — verouderde snapshot
- `docs/technisch-beleid-jeugdmodel.md` — kern staat in rules/

Resultaat: van 155+ naar 34 bestanden.

### 6.2 Structuur na opschoning

```
docs/
├── kennis/                              ← NIEUW: domeinkennis
│   ├── seizoenscyclus.md
│   ├── knkv-competitie.md
│   ├── tc-organisatie.md
│   └── referenties-jeugdontwikkeling.md
├── beheer/                              ← 5 bestanden (actueel)
├── design/                              ← UX-specs + icons
├── jeugdontwikkeling/                   ← 7 bestanden (v3 kern)
├── plans/                               ← Actieve plannen
├── specs/                               ← Design specs
├── staf/                                ← Stafdata CSV
├── functioneel.md
├── technisch.md
├── knkv-api.md
└── validatie-mission-scouting.md
```

---

## 7. Claude Code best practices 2026 (toegepast)

Op basis van onderzoek naar Claude Code updates jan-mrt 2026:

| Best practice | Toepassing in dit project |
|---------------|---------------------------|
| CLAUDE.md < 200 regels | Trimmen naar ~150 regels |
| Path-scoped rules | Nieuwe `paths:` frontmatter in rules/ |
| Subagent persistent memory | `memory: project` voor domein-agents |
| Plugins overwegen | 37 skills + 19 agents als plugin bundelen (toekomst) |
| 1M context GA | Opus 4.6 standaard, geen extra kosten |
| Agent teams | Experimenteel, 11 team-skills al aanwezig |
| Hooks uitbreiden | Huidige hooks (prettier, file-protection) uitbreiden met kwaliteitsgates |

---

## 8. Toekomstige werkpakketten (buiten scope deze spec)

Deze spec legt het fundament. Hierop bouwen de volgende werkpakketten:

| Werkpakket | Beschrijving | Afhankelijkheid |
|------------|--------------|-----------------|
| Google Workspace integratie | Gmail API + Calendar API als communicatiekanaal | OAuth setup, MCP server |
| Microsoft Graph MCP server | Outlook-mailbox als kennisbron | Azure AD app-registratie, OAuth |
| Roostering-AI | AI-ondersteunde roostering op basis van uitgangsprincipes | Seizoenscyclus + KNKV-regels |
| Seizoenscyclus in de app | Jaarkalender als stuurwiel in Beheer/Jaarplanning | Kennislaag + database-model |
| Signaal/actie-systeem | Proactieve signalering van KNKV-deadlines en retentierisico's | Seizoenscyclus + Monitor |

---

## 9. Samenvatting

Dit design legt het fundament voor alle toekomstige ontwikkeling door:

1. **Seizoenscyclus als ruggengraat** — alle TC-activiteiten volgen hetzelfde jaarritme
2. **Kennislaag** — drie niveaus (kennis → rules → CLAUDE.md) met duidelijke scheiding
3. **Agent-fundament** — compacte instructies, path-scoped rules, seizoenscontext
4. **Schone documentatie** — van 155+ naar 34 bestanden, geen ruis
5. **Toekomstbestendig** — Claude Code 2026 best practices toegepast

Het platform ondersteunt de TC bij alles wat ze doen: van het verwerken van opzeggingen tot het reageren op KNKV-conceptindelingen binnen 2 dagen, van evaluatierondes tot de definitieve teamindeling. De seizoenscyclus zorgt ervoor dat iedereen — mens en AI — weet wat er wanneer moet gebeuren.
