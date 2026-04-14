# Daisy-coach — AI-communicatie specialist

**Datum:** 2026-04-15
**Status:** Design goedgekeurd, wacht op implementatieplan
**Eigenaar:** Antjan (product-owner)

## Aanleiding

Op 2026-04-14 analyseerden we vijf echte gesprekken van TC-leden met Daisy in
TI Studio. De observaties:

- Daisy heeft geen directe tool voor "nog niet ingedeelde spelers" en
  improviseert met `blauwdrukToetsen` — een tool die daar niet voor bedoeld is.
- Daisy toont soms alleen interne ID's (rel_codes), soms namen, zonder regel.
- Daisy filtert op één status tegelijk (`BESCHIKBAAR`) terwijl meerdere
  statussen "moet ingedeeld worden" betekenen. De prompt legt niet uit welke
  statussen wat betekenen.
- Daisy haalt nog externe Sportlink-data op via `competitieTeamZoeken` terwijl
  Antjan expliciet alleen met data uit de TI Studio-applicatie wil werken.
- Er is geen structurele rol die deze drift corrigeert en bewijsgestuurd
  ingrijpt — elke dev raakt de prompt ad hoc aan.

Conclusie: Daisy's instructie-laag (systeemprompt, tool-descriptions,
output-regels) verdient een eigenaar met eigen speelveld.

## Doel

Een Claude Code agent `daisy-coach` die:

1. Bewijsgestuurd (via opgeslagen gesprekken) Daisy's communicatie verbetert.
2. Zelfstandig mag schrijven in de AI-laag (`daisy.ts` + tool-descriptions in
   `ti-studio.ts`), maar NIET in de tool-logica of database.
3. Een herbruikbare skill gebruikt die best practices, OW-specifieke output-
   contract en gesprekken-analyse vastlegt.
4. Reactief werkt — alleen aan zet als hij expliciet wordt aangeroepen.

## Scope

### In scope

- Nieuwe agent-definitie `.claude/agents/daisy-coach.md`
- Nieuwe skill `.claude/skills/daisy-coach/SKILL.md` + 4 reference-files
- Directory `docs/daisy-coach/analyses/` voor bewijsgestuurde analyses
- Korte verwijzing in `apps/ti-studio/CLAUDE.md` naar wanneer je deze agent
  moet spawnen
- Een glossary-sectie in de skill (en bij toepassing in `daisy.ts`) die vaste
  betekenissen voor OW-termen vastlegt (memo, werkindeling, kader, scenario,
  besluit, selectie). **Blauwdruk hoort hier NIET in** — Antjan vermijdt die
  term en de agent helpt hem uitfaseren.

### Out of scope (voor deze spec)

- De eigenlijke opruim-patches van Daisy (nieuwe tools, schrapping van
  `competitieTeamZoeken`, `nietIngedeeldeSpelers`-tool, statusmatrix). Die
  worden de eerste échte opdrachten AAN de nieuwe agent, niet onderdeel van
  het bouwen van de agent.
- Automatische gesprekken-review op een schedule (komt later).
- Uitbreiding van de skill naar andere AI-features buiten Daisy.

## Architectuur

### Agent-definitie

**Bestand:** `.claude/agents/daisy-coach.md`

**Rol:** AI-communicatie specialist voor Daisy. Onderhoudt en verbetert de
instructie-laag van Daisy bewijsgestuurd.

**Mag zelf:**
- `apps/ti-studio/src/lib/ai/daisy.ts` — systeemprompt, gedragsregels,
  glossary, statusmatrix, tool-referenties
- `apps/ti-studio/src/lib/ai/plugins/ti-studio.ts` — alleen `description`
  strings en `z.xxx().describe()` annotaties, NIET de `execute`-functies
- Lezen van `ai_gesprekken` / `ai_berichten` via
  `scripts/query-daisy-gesprekken.ts`
- Schrijven in `docs/daisy-coach/analyses/`
- Git-commit met prefix `patch(daisy-coach):` of `fix(daisy-coach):`

**Escaleert naar:**
- `ontwikkelaar` — tool-logica, nieuwe tools, database, API-routes
- `korfbal` — vakinhoudelijke terminologie of conflict met KNKV/Oranje Draad
- `ux-designer` — visuele aspecten van de chat-output in de UI
- `product-owner` — deploy (agent deployt NOOIT zelf)

**Tools:** `Read`, `Edit`, `Write`, `Grep`, `Glob`, `Bash`. Geen `Agent` —
daisy-coach spawnt zelf niemand anders.

**Wie mag daisy-coach spawnen:** Antjan, `product-owner`, `ontwikkelaar`,
`korfbal`.

### Skill-structuur

```
.claude/skills/daisy-coach/
├── SKILL.md                    # Workflow + checklist (~150 regels)
└── references/
    ├── prompt-patterns.md      # Prompt-engineering principes (~400 regels)
    ├── tool-descriptions.md    # Tool-description playbook (~300 regels)
    ├── ow-output-contract.md   # OW-specifieke output-regels (~250 regels)
    └── gesprekken-analyse.md   # Gesprekken lezen + patronen (~300 regels)
```

**SKILL.md** bevat alleen de workflow + checklist, niet de theorie. De
reference-files worden op aanroep geraadpleegd.

**Workflow in SKILL.md:**

1. **Begrijp de opdracht** — bug-rapport, feature, of drift-correctie?
2. **Haal bewijs op** — draai `scripts/query-daisy-gesprekken.ts` tegen
   productie-DB (read-only service-key). Minstens 3 gesprekken lezen die
   raken aan de opdracht.
3. **Schrijf analyse** — in
   `docs/daisy-coach/analyses/analyse-YYYY-MM-DD-<onderwerp>.md`. Structuur:
   Wat ik zag / Welk patroon / Welke regel raakt / Voorgestelde wijziging /
   Vervolgcheck-datum.
4. **Raadpleeg reference-file** — afhankelijk van de interventie.
5. **Schrijf de wijziging** — in `daisy.ts` en/of tool-descriptions.
6. **Valideer** — draai `pnpm --filter @oranje-wit/ti-studio test`, lokaal
   dev-server en test 2–3 reproductie-vragen via curl met service-key.
7. **Commit** — prefix `patch(daisy-coach):`, in de commit message een
   link naar het analyse-document.
8. **Rapporteer terug** — korte samenvatting naar aanroeper: wat, waarom,
   bewijs, commit-SHA, klaar voor `/team-release patch`.

**Altijd analyse-document verplicht.** Geen ontsnapping voor "triviale"
fixes — kleine prompt-wijzigingen kunnen Daisy's gedrag op onverwachte
plekken beïnvloeden. Een analyse van 5 regels is voldoende.

### Reference-files (samenvatting per file)

#### `references/prompt-patterns.md`

Prompt-engineering principes gebaseerd op Anthropic's guidance voor Claude en
vergelijkbare literatuur.

- Rol-definitie, context-setting, gedragsregels, output-structuur
- Anti-patronen: ambigue instructies, dubbele negatives, conflicterende regels
- Few-shot voorbeelden vs pure instructies
- Waar plaats je domeinkennis: tabellen, decision-trees, gevolgde regels
- Wanneer XML-tags, wanneer markdown-secties

#### `references/tool-descriptions.md`

Playbook voor het schrijven van `description` strings van tools zodat het LLM
consistent de juiste kiest.

- Eerste zin = intentie, niet implementatie
- Wanneer gebruiken vs alternatief (expliciet maken wanneer NIET te kiezen)
- `.describe()` voor elk veld: type, voorbeelden, default
- Return-shape benoemen als het invloed heeft op de keuze
- Voorbeeld-paren: zwakke vs sterke description

#### `references/ow-output-contract.md`

Concrete regels voor Daisy in deze app — dit is het document dat zich het
meest ontwikkelt over tijd.

**Identificatie:** altijd "Voornaam Achternaam". rel_code alleen tussen
haakjes op expliciete vraag.

**Status-matrix** — welke statussen betekenen wat:

| Status            | Betekenis                                  | Moet ingedeeld? |
|-------------------|--------------------------------------------|-----------------|
| BESCHIKBAAR       | Beschikbaar voor teamindeling              | Ja              |
| TWIJFELT          | Twijfelt, kan beide kanten op              | Ja, met label   |
| NIEUW_POTENTIEEL  | Nieuw lid in onderzoek                     | Ja, met label   |
| NIEUW_DEFINITIEF  | Nieuw lid, definitief aangesloten          | Ja              |
| GAAT_STOPPEN      | Gaat stoppen                               | Nee             |
| ALGEMEEN_RESERVE  | Buiten teamindeling — oproepbaar           | Nee             |

**Databronnen:** alleen werkindeling + personen + memo's + scores in TI
Studio. GEEN externe (Sportlink) data tenzij expliciet gevraagd.

**Opmaak:**
- Tabellen bij ≥3 items met vergelijkbare velden
- Bullets bij enkelvoudige lijsten
- Proza bij conclusies of advies

**Onzekerheid:** "ik weet dit niet" is een geldig antwoord. Fabricatie is
fatal.

**Seizoenscontext:** altijd benoemen welk seizoen de data betreft.

**Daisy-glossary (vaste interpretaties):**

| Term         | Betekenis in de app                                   | Tool-ingang          |
|--------------|-------------------------------------------------------|----------------------|
| memo         | Werkitem van type MEMO op het kanban-bord             | memosOphalen         |
| werkindeling | De actieve versie van het werkbord                    | teamSamenstelling    |
| kader        | De teamkaders-pagina met doelgroep-indeling           | —                    |
| scenario     | Een what-if kopie van de werkindeling                 | scenarioVergelijken  |
| besluit      | Een vastgelegd werkitem namens een TC-lid             | besluitVastleggen    |
| selectie     | De gecombineerde spelerpool (SelectieGroep gebundeld) | teamSamenstelling    |

**Blauwdruk** staat bewust NIET in de glossary. Daisy gebruikt de term niet.
Als een TC-lid 'm noemt, framet Daisy vriendelijk om naar "kaders" of
"werkindeling".

#### `references/gesprekken-analyse.md`

Protocol voor het lezen van opgeslagen gesprekken en het herkennen van
patronen.

- Het SQL/script voor ophalen met filters op datum, gebruiker en onderwerp
- Patroon-herkenning: improvisatie, ID-leak, statusdrift, bron-mix,
  context-kwijt, hallucinatie, stijldrift
- Diagnose-vocabulaire: consistente benaming voor patronen, zodat analyses
  vergelijkbaar zijn over tijd
- Hoe je van patroon naar prompt-wijziging komt — voorbeeld-mappings

### Integratie in de bestaande hiërarchie

```
Antjan / product-owner
        │
        ├── daisy-coach  (NIEUW)
        │      │ leest ai_gesprekken
        │      │ schrijft in daisy.ts + tool descriptions
        │      │ commit zelf (patch-scope), nooit deploy
        │      └── escaleert naar ontwikkelaar / korfbal
        │
        ├── ontwikkelaar (mag daisy-coach spawnen voor nieuwe tool)
        ├── korfbal (mag daisy-coach spawnen bij terminologie)
        └── product-owner (deploy via team-release)
```

**Regel in `apps/ti-studio/CLAUDE.md`:** korte sectie toevoegen die stelt
dat elke wijziging aan `daisy.ts` of aan `description`-velden in
`plugins/ti-studio.ts` via daisy-coach moet lopen.

## Validatie & edge cases

**Regressie-check:** `pnpm --filter @oranje-wit/ti-studio test` moet groen
blijven, inclusief `ti-studio.test.ts` die de tool-set snapshot-test.

**Reproductie-vragen:** de agent verzint 2–3 vragen die het oorspronkelijke
probleem triggeren, draait ze lokaal via curl met service-key, en noteert
voor/na in het analyse-document.

**Vervolg-monitoring na deploy:** geen eigen automatisering. Analyse-document
bevat een *vervolgcheck-datum*; bij een volgende sessie kijkt daisy-coach of
de gesprekken na die datum het patroon inderdaad niet meer laten zien.

**Conflict met vakinhoud:** bij twijfel over KNKV-regels, Oranje Draad of
teamindelingsbeleid → escaleer naar `korfbal` en wacht met committen.

**Dev die zelf prompt wijzigt:** mitigatie via regel in
`apps/ti-studio/CLAUDE.md`. Geen technische rem.

**Lege gesprekken-tabel:** agent werkt dan zonder bewijs en markeert de
analyse expliciet als "pre-empirisch — verifiëren zodra er gesprekken zijn".

**Security:** read-only DB-access via bestaande service-key. Geen nieuwe
permissies. Daisy mag geen BSN/geboortedatum/adres tonen, dus gesprekken
bevatten geen gevoelige persoonsgegevens.

## Implementatiebegroting

Het bouwen van daisy-coach zelf splitst in vijf stukken werk:

1. **Agent-file** — `.claude/agents/daisy-coach.md` schrijven met
   rol/verantwoordelijkheden/grenzen/tools/delegatie-regels. Kort (~80 regels
   naar schatting).
2. **SKILL.md** — workflow en checklist, ~150 regels.
3. **Reference-files** — 4 markdown-bestanden met samen ~1250 regels.
   Grootste deel van het werk.
4. **Directory + placeholder** — `docs/daisy-coach/analyses/` met een
   `README.md` die de conventie uitlegt.
5. **CLAUDE.md aanpassing** — korte sectie in `apps/ti-studio/CLAUDE.md`.

**Bestaand artefact dat hergebruikt wordt:**
`scripts/query-daisy-gesprekken.ts` bestaat al (aangemaakt op 2026-04-14 bij
de eerste handmatige analyse). De agent hoeft dit script niet te bouwen;
hij voert het uit met `DATABASE_URL` gericht op productie.

Geen code in `apps/ti-studio/` zelf nodig voor het bouwen van de agent —
alleen later wanneer de agent daadwerkelijk wordt ingezet voor de eerste
opruim-patches.

## Bekende risico's

**De skill wordt te lang / te abstract.** Mitigatie: scheiding tussen SKILL.md
(workflow) en references (theorie + tabellen). De agent hoeft niet álles
tegelijk te lezen — alleen wat relevant is voor de opdracht.

**De agent-set wordt onoverzichtelijk.** Er zijn al ~16 agents. Mitigatie:
`daisy-coach` is smal en heeft duidelijke grenzen; hij overlapt niet met
bestaande agents. In de agent-lijst (rules/agents.md) moet hij onderscheiden
worden van `ontwikkelaar` door "AI-laag uitsluitend" te benoemen.

**Dubbel werk met ontwikkelaar.** Risico dat dev óf agent allebei aan de
prompt rommelen. Mitigatie: CLAUDE.md-regel + de verplichting van het
analyse-document (dev die snel iets aanpast weet niet hoe je dat schrijft,
dus kiest eieren voor zijn geld en spawnt daisy-coach).

## Success-criteria

De agent is succesvol als:

1. Elke toekomstige wijziging aan `daisy.ts` of tool-descriptions kan worden
   teruggevoerd naar een analyse-document in
   `docs/daisy-coach/analyses/`.
2. De glossary en statusmatrix in `references/ow-output-contract.md` blijven
   single source of truth voor hoe Daisy met OW-termen omgaat.
3. Wanneer Antjan of een andere spawner de agent aanroept met een concrete
   miscommunicatie, komt er binnen één sessie een correctie met bewijs.
4. Het aantal "improvisatie"-patronen in opgeslagen gesprekken daalt over
   tijd (meetbaar via handmatige review van een sample).

## Volgende stap

Schrijf het implementatieplan via de `superpowers:writing-plans` skill.
