# TI Studio v2 — Realisatieplan

**Datum**: 2026-05-08, bijgewerkt 2026-05-13  
**Status**: Architectuur verfijnd — Railway test-DB voorbereiding  
**Auteur**: Product Owner  
**Gerelateerd**: `2026-05-08-ti-studio-v2-deployment-plan.md` (infra/Railway/cutover)

> **Archief-marker pin-eliminatie (2026-05-11)**: Verwijzingen naar pin-functie in dit document zijn historisch — de pin-functionaliteit is volledig uit de software verwijderd (migratie `20260415000000_drop_pin`). Zie `docs/superpowers/specs/2026-05-11-pin-cleanup-plan.md`.

> **Architectuur-verfijning (2026-05-13)**: Twee aparte Railway-services (`studio-test` en `studio-next`) in plaats van één service met DNS-swap. Test-DB opzet (`oranjewit-test`) inclusief `snapshot-prod-to-dev.ts` env-var integratie. Zie sectie 0-A hieronder.

---

## Architectuur Verfijning (2026-05-13)

Definitieve setup per fase:

| Fase | Domein | Railway-service | Database | Doel |
|---|---|---|---|---|
| **0-2: Bouw** | `studio-test.ckvoranjewit.app` | `studio-test` | PostgreSQL `oranjewit-test` (snapshot) | Veilig bouwen + testen |
| **3: Parallel-test** | `studio-next.ckvoranjewit.app` | `studio-next` | PostgreSQL `oranjewit` (productie) | TC-test naast v1 |
| **4: Cutover** | `teamindeling.ckvoranjewit.app` | `studio-next` | PostgreSQL `oranjewit` | Live |
| **1 fallback** | `teamindeling-oud.ckvoranjewit.app` | `ti-studio` (v1) | PostgreSQL `oranjewit` | Rollback |

**Kritieke besluiten:**
1. **Twee services, niet één**: `studio-test` en `studio-next` zijn afzonderlijke Railway-services. Dit vermijdt downtime bij redeploys en houdt sandbox actief ná cutover.
2. **Test-DB aparte instance**: `oranjewit-test` PostgreSQL op Railway, gevoed via `snapshot-prod-to-dev.ts` met env-var `SNAPSHOT_TARGET=railway-test`.
3. **Sportlink per fase**: Fase 0-2 UIT (test-DB), Fase 3 UIT (TC-test), Fase 4+ AAN (v2 primair).

---

## Context

v1 (`apps/ti-studio`) is functioneel en stabiel maar de codebase wijkt op meerdere plekken
af van het prototype-design dat als referentie is vastgesteld (2026-04-20). v2 is een
volledige herbouw vanuit het prototype, met behoud van alle v1 business logic en data.

**Bevroren v1 betekent**: geen feature-werk in `apps/ti-studio` tijdens de bouw van v2.
Bugfixes met `patch:` prefix mogen — maar worden direct gespiegeld naar v2 als ze
business logic raken.

---

## 1. Scope per pagina

### 1.1 Homepage (`/`)

**Uit v1 mee:**
- Volledigheidsring (ingedeeld/totaal spelers %)
- Werkbord-tile als primaire call-to-action
- Memo-badge (open / in bespreking / hoge prio teller)
- Kaders- en Personen-tiles
- Groet met voornaam + seizoen-badge

**Nieuw uit prototype:**
- Seizoen-badge met groene puls-dot (live indicator)
- Beschrijving tile "Werkbord — visuele editor voor teamopstelling" (i.p.v. route-tekst)
- Kader-tile met `seizoenskader per team beheren` subtitle
- Personen-tile met `spelers, staf en reserveringen` subtitle

**Vervalt:**
- Niets. Homepage v1 is al vrijwel identiek aan prototype. Herbouw is cosmetisch.

**Definition of done**: Zichtbare pariteit met `pages/homepage.html`. Stats laden live.

---

### 1.2 Personen (`/personen`)

**Uit v1 mee:**
- Sub-navigatie: Spelers / Staf / Reserveringen
- Spelers: tabel met zoek + filter (status, doelgroep), inline edits (status, gezien, indeling)
- Staf: tabel + NieuweStafDialog + StafProfielDialog
- Reserveringen: ReserveringenOverzicht + NieuweReserveringDialog
- SpelerProfielDialog (volledig)

**Nieuw uit prototype:**
- Grid-layout tabel: `60px 1fr 150px 90px 130px 110px 44px 60px 44px` kolommen
  (rel-code, naam, huidigTeam, leeftijd, indeling, status, memo-cel, gezien, acties)
- Leeftijdscel als gekleurd blok (leeftijdscategorie-kleur, getal + "jr")
- Memo-cel inline: badge `open / bespreking / risico / opgelost / geen`
- Filter-chips UI (doelgroep, status) — functioneel al aanwezig, visueel herbouwen
- Hover-kaart conform `components/speler/hover-kaart.html` en `components/staf/hover-card.html`
- Speler-dialog conform `components/speler/speler-dialog.html`
- Staf-dialog conform `components/staf/staf-dialog.html`
- Spelerpool-drawer conform `components/speler/spelerpool-drawer.html`
- Staf-drawer conform `components/staf/staf-drawer.html`
- Nieuwe-speler-dialog conform `components/speler/nieuwe-speler-dialog.html`
- Inline-edit conform `components/speler/inline-edits.html`

**Vervalt:**
- Aparte `SpelersOverzichtStudioWrapper` laag — logica direct in pagina-component

**Definition of done**: Alle sub-tabs werken. Inline edits persisteren. Hover-kaart toont
op naam. Dialogs openen correct.

---

### 1.3 Werkbord (`/indeling`)

**Uit v1 mee (volledig meeverhuizen):**
- TiStudioShell: twee-kolom grid (toolbar + content)
- Toolbar: versie-badge, stats (ingedeeld/totaal/AR), toggle-knoppen (Pool / Staf / Teams / Versies)
- WerkbordCanvas: drag & drop via dnd-kit, zoom (compact/normaal/detail), team-kaarten, positie-persistentie
- SpelersPoolDrawer: zoek + status-filter + leeftijdsfilter
- StafPoolDrawer: zoek + type-filter
- TeamDrawer: team-lijst + detail-view + validatie
- VersiesDrawer: versies-lijst + what-if aanmaken + what-if canvas-modus
- TeamKaart: compact / normaal / detail zoom-modes, SelectieGroep-bundeling
- SpelerKaart, SpelerRij, StafKaart, TeamKaartSpelerRij
- HoverSpelersKaart, HoverStafKaart (providers)
- PeildatumContext (korfballeeftijd in kaart)
- SpelerProfielDialog, StafProfielDialog, TeamDialog (hergebruik uit Personen)
- Alle server actions (werkindeling, versies, what-if, team-config, memo, toelichting)
- API: `/api/indeling/[versieId]`, `/api/indeling/[versieId]/stream`

**Nieuw uit prototype:**
- Werkbord-toolbar visual: versie-badge (blauw), stats-secties, toggle-knoppen conform `pages/werkbord.html`
- Canvas achtergrond: radial gradient (`rgba(255,107,0,.02)` + `rgba(59,130,246,.015)`)
- Save-indicator conform prototype (opacity 0 → 1, saving dot pulse, error state)
- Staf-rij in drawers conform `wb-staf-rij` pattern
- Team-detail-drawer conform `components/team/team-detail-drawer.html`

**Vervalt:**
- Niets. Werkbord-logica is het hart van v1 en migreert intact.

**Kritieke invariant meeverhuizen**: `SelectieGroep.gebundeld` logica —
`toggleSelectieBundeling()`, `zetSpelerIndeling()`, de "speler nooit tegelijk in
TeamSpeler én SelectieSpeler voor dezelfde versie" invariant.

**Definition of done**: Drag & drop werkt. Versies aanmaken werkt. What-if scenario
openen en toepassen werkt. Validatie-engine draait. Opslaan confirmeert in UI.

---

### 1.4 Kader (`/kader`)

**Uit v1 mee:**
- KaderView: teamtype-kaders per doelgroep, opslaan via `slaTeamtypeKadersOp`
- Memo-sectie per doelgroep (DoelgroepMemoSectie)
- TC-algemene memos
- Kader-defaults (TC_DEFAULTS, mergeMetDefaults)

**Nieuw uit prototype:**
- Kader-kaarten: accordeon-layout (ingeklapt/uitgeklapt), `kk-summary` vs `kk-body`
- Gewijzigd-indicator: oranje dot + `border-color: rgba(255,107,0,.3)` op kaart
- Doelgroep-badge per kaart (color-mixed met kaart-kleur)
- KNKV-info sectie (ingeklapt) met min/max/ideaal per positie
- Auto-save status indicator in tab-header
- Memo-rijen visueel conform `kader.html` memo-rij pattern
- Tab "Teamkaders" + "Memo's" met badge-teller

**Vervalt:**
- Huidige flat-list layout van KaderView → vervangen door accordion-kaarten

**Definition of done**: Kaders opslaan werkt. Gewijzigde waarden highlighten. Memo's
tonen per doelgroep. Tab-navigatie werkt.

---

### 1.5 Memo (`/memo`)

**Uit v1 mee:**
- KanbanBord: 4 kolommen (Open / In bespreking / Opgelost / Archief)
- Memo aanmaken (NieuweMemoDialog)
- Status verplaatsen (drag between lanes of button)
- Prioriteit: BLOCKER, HOOG, MIDDEL, LAAG, INFO
- Koppeling: team, speler, staf, doelgroep
- Toelichtingen (comments) per memo
- Activiteitenlog per memo
- MemoDrawer (detail-panel rechts)
- Filters: doelgroep, prioriteit, koppeling

**Nieuw uit prototype:**
- Kanban-header: zoekbalk (focus: breeder worden), filter-chips
- Memo-kaart conform `components/memo/memo-kaart.html`
- Memo-rij conform `components/memo/memo-rij.html`
- Memo-drawer conform `components/memo/memo-drawer.html`
- Nieuwe-memo-dialog conform `components/memo/nieuwe-memo-dialog.html`
- Lane-header met kleur-dot per status
- `▲` priority-indicator (uppercase driehoek = BLOCKER/HOOG) — al in v1 aanwezig

**Vervalt:**
- Niets. Memo-data model is stabiel.

**Definition of done**: Kanban laadt live data. Nieuwe memo aanmaken werkt. Status-
verplaatsen persisteert. Toelichtingen toevoegen werkt. Filter werkt.

---

### 1.6 Sync (`/sportlink` → hernoemen naar `/sync`)

**Uit v1 mee:**
- SportlinkTabs: Leden-sync, Team-sync, Wijzigingssignalen
- SportlinkAuth: credentials (Keycloak username/password) in sessionStorage
- SportlinkSync: diff-weergave (nieuw / afgemeld / fuzzy-match)
- LedenSync: bulk-apply (aanmaken / afmelden / koppelen via rel_code)
- TeamSync: competitie-team synchronisatie
- WijzigingsSignalen: afwijkingen signaleren
- API: `/api/sportlink/sync`, `/api/sportlink/apply`, `/api/sportlink/leden-sync`,
  `/api/sportlink/team-sync`, `/api/sportlink/wijzigingen`

**Nieuw uit prototype:**
- Pagina-naam: "KNKV Sync" (i.p.v. "Sportlink")
- Sub-titel: "Sportlink API synchronisatie — leden, teamindeling en competitie"
- Sync-kaart layout: icon + info + last-synced + sync-knop
- Voorbereiding-dialoog (prep-dialog): seizoen-keuze + type-keuze (KNKV / Sportlink)
  + informatie-blok + checkbox "update bestaande leden" + radio: volledig / alleen-nieuw
- Voortgangsbalk met stap-tekst + detail
- Resultaat-sectie: icons ok / warn / new met telwaarden
- Status-dot: `ok` (groen) vs `stale` (geel) per sync-type

**Vervalt:**
- Oude tab-navigatie binnen SportlinkTabs → wordt vervangen door drie sync-kaarten op één pagina

**Route-aanpassing**: v1 heeft `/sportlink`, prototype heeft `sync`. In v2 wordt de route
`/sync`. Ribbon-link past mee.

**Definition of done**: Sync-kaarten tonen laatste sync-tijdstip. Prep-dialog opent.
Sync start en toont voortgang. Resultaten verschijnen na afronden.

---

## 2. Navigatiestructuur v2

Ribbon-items (conform `shell.js` NAV_ITEMS):

| Volgorde | Route | Ribbon-icoon | Badge |
|---|---|---|---|
| 1 | `/` (home) | TI-logo (niet in ribbon, is homepage) | — |
| 2 | `/indeling` | werkbord (vier-vierkantjes) | — |
| 3 | `/personen` | personen (twee personen) | — |
| 4 | `/memo` | memo (document) | open-count |
| 5 | `/kader` | kader (schild + vinkje) | — |
| 6 | `/sync` | sync (cirkel-pijlen) | — |

De homepage is bereikbaar via klik op het TI-logo bovenaan de ribbon (niet als ribbon-knop).

**Verschil met v1**: `/sportlink` → `/sync`. Daisy (`/daisy` of widget) wordt niet gewijzigd.

---

## 3. Faseplanning

### Fase 0 — Fundament (dag 1-3)

**Wat:**
- `apps/ti-studio-v2/` aanmaken als nieuwe Next.js 16 app
- `package.json` met naam `@oranje-wit/ti-studio-v2`, port 3002 lokaal
- Dockerfile kopiëren van v1 (paden aanpassen naar `ti-studio-v2`)
- `pnpm-workspace.yaml` uitbreiden met de nieuwe app
- CI bijwerken: `fast-gate` + `build` + `deploy` voor v2 (zie deployment-plan sectie 5)
- Railway service `studio-test` aanmaken + `studio-test.ckvoranjewit.app`
- PostgreSQL `oranjewit-test` aanmaken en initialiseren
- Auth-guards, Prisma-client, `@oranje-wit/teamindeling-shared` importeren
- Lege shell: Ribbon + TiStudioPageShell conform prototype `shell.js`
- `globals.css` met tokens (kopieer uit v1 `tokens.css`)
- Route `/api/health` (voor versiedetectie-banner)
- Login-pagina

**Exit-criteria:**
- `pnpm --filter @oranje-wit/ti-studio-v2 build` slaagt
- CI groen
- `studio-test.ckvoranjewit.app` bereikbaar, login werkt
- Leeg werkbord (geen content) zichtbaar na login
- `oranjewit-test` DB schema deployed

---

### Fase 1 — Pagina-voor-pagina (week 1-3)

Volgorde: Homepage → Werkbord → Personen → Memo → Kader → Sync

Per pagina: bouw conform prototype, kopieer server actions/API routes uit v1,
gebruik gedeeld Prisma-schema. CI moet groen blijven na elke pagina.

**Per pagina exit-criteria:**
- Pagina laadt zonder runtime errors
- Primaire flow werkt (lezen + schrijven)
- Geen `console.log` (logger-patroon uit v1 meenemen)
- TypeScript compile errors: nul

**Tussenmijlpaal na Werkbord**: Daisy AI-plugin aansluiten (zie sectie 4).

**Volgorde-rationale:** Werkbord als tweede omdat het het meest complexe stuk is en
daarna de andere pagina's door-refereren (memo-count, kader-data, etc.).

---

### Fase 2 — Parallel-test Antjan (1-2 weken)

**Wat:**
- Antjan test `studio-test.ckvoranjewit.app` naast v1
- v2 gebruikt aparte `oranjewit-test` DB
- v1 is bevroren (geen features)
- Antjan rapporteert bugs → v2-fixes via `patch:` commits

**Exit-criteria (Antjan-go):**
- Alle 6 pagina's bereikbaar en functioneel
- Werkbord: drag & drop, versies, what-if, validatie
- Personen: spelers tabel, inline edits, dialogs
- Memo: kanban, aanmaken, status-wissel
- Kader: kaders opslaan, memo's per doelgroep
- Sync: leden-sync uitvoerbaar (prep-dialog → voortgang → resultaat)
- Daisy-widget reageert
- Data is consistent tussen studio-test en productie (snapshot geldig)

---

### Fase 3 — TC-breed (1 week)

**Wat:**
- Twee of drie andere TC-leden (max 3 personen) testen op `studio-next.ckvoranjewit.app`
- v2 (`studio-next`) gebruikt nu productie-DB `oranjewit` (NOT test-DB)
- Nieuwe service aanmaken: `studio-next` (zelfde codebase, andere Railway-service)
- v1 is nog primair productie-domein
- Feedback-ronde: max 5 werkdagen

**Exit-criteria:**
- Geen blocker-bugs gerapporteerd door TC-leden
- Performance: pagina-laadtijd < 2s (cold load)
- Sportlink-sync: uitgeschakeld op studio-next (env var `SPORTLINK_ENABLED=false`)

---

### Fase 4 — Cutover

**Wat:** Zie `2026-05-08-ti-studio-v2-deployment-plan.md` sectie 6 voor de volledige procedure.

**Samengevat:**
1. DNS: `teamindeling.ckvoranjewit.app` → studio-next service
2. v1 naar `teamindeling-oud.ckvoranjewit.app`
3. Sportlink-sync: v1 uitzetten, studio-next aanzetten
4. `studio-test` blijft als sandbox
5. 24u monitoring
6. Na 7 dagen: beslissing v1 afzetten

**Exit-criteria:**
- Health check v2: `200 OK`
- Login werkt op primair domein
- Daisy reageert op `teamindeling.ckvoranjewit.app`
- Sportlink-sync draait op studio-next

---

## 4. Impact-analyse op v1

### Bevriezingsregels

**Mag nog (met `patch:` prefix):**
- Bugfixes aan bestaande functionaliteit
- Data-correcties (scripts)
- Dependency-updates (security)
- Sportlink-sync fixes

**Mag niet meer:**
- Nieuwe UI-features
- Nieuwe Prisma-modellen of -velden (tenzij additive en direct ook naar v2)
- Nieuwe routes of navigatie-items
- Daisy-plugin uitbreidingen (alleen in v2)

### Bestaande routes en redirects bij cutover

| Huidig (v1) | v2 route | Actie |
|---|---|---|
| `/` | `/` | Geen wijziging |
| `/indeling` | `/indeling` | Geen wijziging |
| `/personen`, `/personen/spelers`, `/personen/staf` | Zelfde | Geen wijziging |
| `/kader` | `/kader` | Geen wijziging |
| `/memo` | `/memo` | Geen wijziging |
| `/sportlink` | `/sync` | v2 registreert `/sportlink` als redirect → `/sync` |
| `/login` | `/login` | Geen wijziging |

`apps/web/proxy.ts` blijft ongewijzigd — die stuurt `/ti-studio/*` en
`/teamindeling/*` naar `teamindeling.ckvoranjewit.app`, wat na cutover v2 is.

---

## 5. Cross-domain risico's

### 5.1 Daisy AI-plugin (17 tools)

**Locatie v1**: `apps/ti-studio/src/lib/ai/` (daisy.ts, plugins/ti-studio.ts, daisy-acties.ts)

**Risico**: De 17 tools refereren intern naar `prisma` en `HUIDIG_SEIZOEN` — geen
cross-app imports maar wel business logic die exact overkomt moet zijn.

**Aanpak:**
- Plugin-bestand 1:1 kopiëren naar `apps/ti-studio-v2/src/lib/ai/`
- Na copy: `daisy-coach` agent verifieert dat tool-descriptions kloppen voor v2 UI
- `DaisyActie` en `Plaatsreservering` schema-modellen zijn additive — geen migratie nodig
- `ai_gesprekken` tabel is gedeeld — Daisy-geheugen is direct beschikbaar in v2

**Tussenmijlpaal**: Daisy aansluiten direct na Werkbord (Fase 1, stap 3 van 6).

---

### 5.2 Sportlink Sync per fase

**Locatie v1**: `apps/ti-studio/src/components/sportlink/` + API routes + `@oranje-wit/sportlink` package

**Fase 0-2 (studio-test)**:
- `SPORTLINK_ENABLED=false` (test-DB, geen Sportlink-koppeling)
- Geen sync-pagina nodig in UI

**Fase 3 (studio-next)**:
- `SPORTLINK_ENABLED=false` (TC-test parallel met v1, voorkomen rate limit)
- Sync-pagina zichtbaar maar read-only

**Fase 4+ (studio-next primair)**:
- `SPORTLINK_ENABLED=true` op studio-next
- `SPORTLINK_ENABLED=false` op v1
- Stagger sync-crons: studio-next uur 01:30 UTC (v1 is 01:00 UTC)

**Open vraag voor Antjan**: Moet de route `/sportlink` → `/sync` redirect ook in v1
toegevoegd worden (voor bookmark-compatibiliteit) of pas bij cutover?

---

### 5.3 Werkbord en versies

**Risico fase 2**: studio-test en v1 draaien op aparte DBs — geen conflict.

**Risico fase 3**: studio-next en v1 draaien parallel op dezelfde productie-DB.

**Aanpak (Fase 3 parallel-test):**
- TC-leden testen met één sessie tegelijk (niet beide apps gelijktijdig editen)
- Geen optimistic locking nodig voor de test-fase (3 TC-leden, geen echte multi-user)
- Bij cutover is v1 legacy-only → geen simultane writes meer

---

### 5.4 Memo-systeem

**Schema**: `Werkitem` (type=MEMO) + `WerkitemToelichting` + `WerkitemActiviteit`

**Fase 2**: studio-test en v1 op aparte DBs — memos zijn apart per database.

**Fase 3**: studio-next en v1 op dezelfde productie-DB. Memos aangemaakt in studio-next zijn direct zichtbaar in v1.
Dit is gewenst — beide apps tonen dezelfde memo-werkelijkheid.

**Aanpak**: Geen extra actie nodig.

---

### 5.5 Korfballeeftijd-centralisatie

**Module**: `@oranje-wit/types/korfballeeftijd` (`korfbalPeildatum`, `berekenKorfbalLeeftijd`, etc.)

**Risico**: v2 bouwt nieuwe leeftijdsweergave (gekleurd blok in personen-tabel).
Moet de centrale module gebruiken, nooit eigen berekening.

**Aanpak**: `berekenKorfbalLeeftijdExact` voor de kleur-mapping.
`PeildatumProvider` in WerkbordCanvas meeverhuizen.
Leeftijdscel in personen-tabel: `grofKorfbalLeeftijd` voor de categorie-kleur.

---

### 5.6 Teams-anomalie (open schemamigraties)

**Status**: `OWTeamType`, `TeamAlias`, `owTeamId` schema KLAAR.
Migratiescripts `migrate-teams-2025-2026.ts` en `migrate-teams-historisch.ts` NOG OPEN.

**Risico**: Als de migratiescripts tijdens de v2-bouwfase worden gedraaid, raakt
v2 ook de DB. Dit is gewenst (additive-only schema-regel).

**Aanpak**: Migratiescripts uitvoeren vóór Fase 2 (parallel-test), zodat v2 meteen
de juiste alias-mapping heeft. Coördineer via `team-planner` agent.

---

## 6. Open vragen voor Antjan

1. **Architectuur bevestigen**: `studio-test` (fase 0-2) + `studio-next` (fase 3+) als
   aparte services, met `oranjewit-test` DB voor fase 0-2 — akkoord?

2. **Route `/sportlink` → `/sync`**: Redirect in v1 toevoegen zodat bestaande
   bookmarks blijven werken, of pas bij cutover?

3. **Prioriteit Daisy in v2**: Moet Daisy al functioneel zijn in Fase 2 (parallel-test),
   of is het acceptabel dat de widget aanwezig maar beperkt is?

4. **Teams-anomalie timing**: Migratiescripts draaien vóór Fase 2 of kan dat later?
   (raakt werkbord-weergave van teamkleuren en alias-namen)

5. **Sportlink-sync per fase**: Via env var `SPORTLINK_ENABLED` per fase — akkoord?
   Fase 0-2: FALSE, Fase 3: FALSE, Fase 4+: TRUE?

6. **v1 bevriezingsdatum**: Wanneer geldt de bevriezing? Direct bij start Fase 0,
   of bij start bouw Fase 1 (werkbord)? Dit bepaalt of er lopende feature-branches
   nog mogen landen in v1.

7. **Test-scenario's Fase 2 en 3**: Wil je een gestructureerde testscript (scenario 1: login,
   scenario 2: werkbord indeling, etc.) of ad-hoc testen?

---

## 7. Volgende-stap-voorstel na akkoord

**Direct na go:**

| Stap | Agent | Taak |
|---|---|---|
| 1 | `team-devops` | Railway services `studio-test` en `studio-next` aanmaken, PostgreSQL `oranjewit-test` opzetten, env vars |
| 2 | `team-devops` | Cloudflare DNS records: `studio-test.ckvoranjewit.app`, `studio-next.ckvoranjewit.app` |
| 3 | `operator` | `snapshot-prod-to-dev.ts` aanpassen met `SNAPSHOT_TARGET` env-var (zie `2026-05-13-railway-test-db-setup.md`) |
| 4 | `ontwikkelaar` | CI bijwerken met studio-test deploy-triggers |
| 5 | `antjan` | Fase 0-2 testen op `studio-test.ckvoranjewit.app` |

**Parallelle taken:**
- team-devops regelt Railway + DNS (stap 1-2) terwijl operator snapshot-script aanpast (stap 3)

---

## Bijlage: Wat v2 NIET is

- Geen nieuwe features bovenop prototype-pariteit (die komen na cutover)
- Geen schema-breaking changes
- Geen nieuwe Daisy-tools (bestaande 17 meenemen, uitbreidingen na cutover)
- Geen mobile variant (desktop-only, net als v1)
- Geen nieuwe TC-doelgroepen of KNKV-regelwijzigingen
