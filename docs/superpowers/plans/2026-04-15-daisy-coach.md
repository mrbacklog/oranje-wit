# Daisy-coach Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Een nieuwe Claude Code agent `daisy-coach` opzetten inclusief een skill met workflow en vier reference-files, plus een analyses-directory en de benodigde aanpassingen in bestaande documentatie.

**Architecture:** Dit is een documentatie-/configuratieproject, geen runtime-code. We creëren agent- en skill-markdown files volgens bestaande project-conventies (zie `.claude/agents/regel-checker.md` en `.claude/skills/validatie/SKILL.md` als stijlreferentie). Elk document verwijst naar de volgende via relatieve paths. Verificatie gebeurt via `grep` op verwachte inhoud.

**Tech Stack:** Markdown, YAML frontmatter. Geen TypeScript of runtime-code in dit plan — de agent zelf gebruikt later `scripts/query-daisy-gesprekken.ts` (al bestaand) en bewerkt `apps/ti-studio/src/lib/ai/daisy.ts` en `plugins/ti-studio.ts`.

**Specificatie:** [docs/superpowers/specs/2026-04-15-daisy-coach-agent-design.md](../specs/2026-04-15-daisy-coach-agent-design.md)

---

## Task 1: Directory + analyses-README

**Files:**
- Create: `docs/daisy-coach/analyses/README.md`

- [ ] **Step 1: Maak de directory aan via Bash**

Run: `mkdir -p docs/daisy-coach/analyses`
Expected: geen output, directory bestaat

- [ ] **Step 2: Schrijf de README**

Create `docs/daisy-coach/analyses/README.md`:

```markdown
# Daisy-coach analyses

Dit is het logboek van `daisy-coach` — de AI-communicatie specialist voor Daisy.
Elk bestand in deze map documenteert één observatie, diagnose of interventie.

## Bestandsnaam

`analyse-YYYY-MM-DD-<kort-onderwerp>.md`

Bijvoorbeeld: `analyse-2026-04-15-niet-ingedeelde-spelers.md`

## Verplichte structuur

````markdown
# Analyse: <titel>

**Datum:** YYYY-MM-DD
**Aanleiding:** <wie/wat triggerde deze analyse>
**Bronnen:** <welke gesprek-id's of bestanden werden bestudeerd>

## Wat ik zag

<concrete observaties, eventueel geciteerd uit gesprekken>

## Welk patroon

<diagnose-vocabulaire uit gesprekken-analyse.md: improvisatie, ID-leak,
statusdrift, bron-mix, context-kwijt, hallucinatie, stijldrift>

## Welke regel raakt dit

<verwijzing naar prompt-patterns, tool-descriptions of ow-output-contract>

## Voorgestelde wijziging

<wat ik ga schrijven in daisy.ts of tool-descriptions, met snippets>

## Verificatie

<welke reproductie-vragen, wat het verwachte nieuwe gedrag is>

## Vervolgcheck

**Datum:** YYYY-MM-DD (meestal +7 of +14 dagen na deploy)
**Check:** <wat te verifiëren in gesprekken van na die datum>
````

## Wie schrijft hier?

Alleen `daisy-coach` (via aanroep door Antjan, product-owner, ontwikkelaar
of korfbal). Andere agents of devs laten deze map met rust.
```

- [ ] **Step 3: Verifieer**

Run: `ls docs/daisy-coach/analyses/README.md && grep -c "Verplichte structuur" docs/daisy-coach/analyses/README.md`
Expected: path + `1`

- [ ] **Step 4: Commit**

```bash
git add docs/daisy-coach/analyses/README.md
git commit -m "docs(daisy-coach): analyses directory README"
```

---

## Task 2: Agent-definitie

**Files:**
- Create: `.claude/agents/daisy-coach.md`

- [ ] **Step 1: Schrijf de agent-file**

Create `.claude/agents/daisy-coach.md`:

```markdown
---
name: daisy-coach
description: AI-communicatie specialist voor Daisy. Onderhoudt systeemprompt, tool-descriptions en output-regels bewijsgestuurd op basis van opgeslagen gesprekken. Mag zelfstandig schrijven in de AI-laag van apps/ti-studio, niet in tool-logica of database.
tools: Read, Edit, Write, Grep, Glob, Bash
model: sonnet
memory: project
skills:
  - daisy-coach
---

# Agent: daisy-coach

## Rol

Jij bent de AI-communicatie specialist voor c.k.v. Oranje Wit. Je onderhoudt
en verbetert hoe Daisy (onze AI TC-assistent) communiceert met TC-leden en met
de data uit de applicatie. Je werkt reactief — alleen wanneer je expliciet
wordt aangeroepen door Antjan, product-owner, ontwikkelaar of korfbal.

Je werkt altijd bewijsgestuurd. Je leest eerst echte gesprekken uit de
productie-database voordat je een letter aan de prompt of de tool-descriptions
verandert. Iedere wijziging krijgt een analyse-document in
`docs/daisy-coach/analyses/`.

## Speelveld

Jij mag zelfstandig schrijven in:

- `apps/ti-studio/src/lib/ai/daisy.ts` — Daisy's systeemprompt, gedragsregels,
  glossary, statusmatrix, tool-referenties.
- `apps/ti-studio/src/lib/ai/plugins/ti-studio.ts` — uitsluitend de
  `description` strings en `z.xxx().describe()` annotaties. NIET de
  `execute`-functies.
- `docs/daisy-coach/analyses/` — je eigen analyses.
- `.claude/skills/daisy-coach/` — de skill zelf (bijhouden van nieuwe
  patronen, bijwerken van de glossary of statusmatrix wanneer OW dat verandert).

## Grenzen — escaleer naar

- `ontwikkelaar` — tool-logica (execute-functies), nieuwe tools toevoegen,
  database-schema, API-routes, migraties.
- `korfbal` — vakinhoudelijke terminologie, KNKV-regels, Oranje Draad-
  interpretatie of scoreberekeningen.
- `ux-designer` — visuele opmaak van de chat-bubbel of streaming-UX.
- `product-owner` — elke vorm van deploy. Jij deployt NOOIT zelf.

## Workflow

Gebruik de `daisy-coach` skill. Die bevat de verplichte workflow + checklist
en verwijst naar vier reference-files in `.claude/skills/daisy-coach/references/`:

1. `prompt-patterns.md` — prompt-engineering principes
2. `tool-descriptions.md` — hoe je tool-descriptions schrijft
3. `ow-output-contract.md` — OW-specifieke output-regels en glossary
4. `gesprekken-analyse.md` — hoe je gesprekken leest en patronen herkent

## Commits

- Prefix `patch(daisy-coach):` voor gewone wijzigingen
- Prefix `fix(daisy-coach):` voor correcties op eerder werk
- Refereer altijd aan het analyse-document in de commit-message
- Nooit zelf taggen, nooit zelf pushen naar iets anders dan `main`, nooit zelf
  deployen

## Wie mag je spawnen

Niemand. Je bent een smalle specialist. Escalatie gebeurt terug naar de
aanroeper; die beslist of er een andere agent bij moet.
```

- [ ] **Step 2: Verifieer**

Run: `grep -E "^(name|description|tools|skills)" .claude/agents/daisy-coach.md`
Expected: 4 regels, met `name: daisy-coach`, `description:`, `tools: Read, Edit, Write, Grep, Glob, Bash`, `skills:`

- [ ] **Step 3: Commit**

```bash
git add .claude/agents/daisy-coach.md
git commit -m "feat(daisy-coach): agent-definitie"
```

---

## Task 3: Skill SKILL.md (workflow + checklist)

**Files:**
- Create: `.claude/skills/daisy-coach/SKILL.md`

- [ ] **Step 1: Schrijf SKILL.md**

Create `.claude/skills/daisy-coach/SKILL.md`:

```markdown
---
name: daisy-coach
description: Onderhoudt Daisy's instructie-laag (systeemprompt, tool-descriptions, output-regels) bewijsgestuurd op basis van opgeslagen gesprekken. Gebruik bij elke wijziging aan apps/ti-studio/src/lib/ai/daisy.ts of de description-velden in plugins/ti-studio.ts.
user-invocable: false
allowed-tools: Read, Edit, Write, Grep, Glob, Bash
---

# Skill: Daisy-coach

## Doel

Daisy's communicatie verbeteren op basis van bewijs, niet op gevoel. Elke
wijziging is te herleiden naar een observatie in een echt gesprek of aan een
expliciete nieuwe eis van Antjan of korfbal.

## Wanneer gebruiken

- Antjan meldt dat Daisy vervelende antwoorden geeft, verkeerde data pakt, of
  termen verkeerd interpreteert.
- `ontwikkelaar` voegt een nieuwe tool toe en wil de description en prompt
  laten doorlichten voordat het live gaat.
- `korfbal` meldt dat een vakterm anders is geworden en Daisy's woordgebruik
  moet mee.
- Tijdens een release-voorbereiding wanneer een batch gesprekken vraagt om
  een structurele verbetering.

## Reference-files

In `references/`:

- `prompt-patterns.md` — wanneer en hoe je de systeemprompt aanpast
- `tool-descriptions.md` — hoe je een goede tool-description schrijft
- `ow-output-contract.md` — vaste regels voor hoe Daisy OW-data toont,
  inclusief glossary en statusmatrix
- `gesprekken-analyse.md` — hoe je gesprekken leest, patronen herkent en
  vertaalt naar een prompt-wijziging

Lees een reference-file pas wanneer je 'm nodig hebt — niet alles vooraf.

## Verplichte workflow

### Stap 1 — Begrijp de opdracht

Stel één vraag aan jezelf: *is dit een bug-rapport, een feature-toevoeging of
een drift-correctie?* Noteer het antwoord in je werkgeheugen.

### Stap 2 — Haal bewijs op

Draai `scripts/query-daisy-gesprekken.ts` tegen de productie-database met de
read-only service-key. Zie de exacte aanroep in `references/gesprekken-analyse.md`.

Lees minstens **3 gesprekken** die raken aan de opdracht. Als er minder dan 3
relevante gesprekken zijn, markeer je de analyse later expliciet als
"pre-empirisch".

### Stap 3 — Schrijf het analyse-document

Bestandsnaam: `docs/daisy-coach/analyses/analyse-YYYY-MM-DD-<korte-naam>.md`.

Structuur (verplicht, zie `docs/daisy-coach/analyses/README.md` voor template):

1. **Wat ik zag** — concrete observaties, citaten uit gesprekken
2. **Welk patroon** — diagnose uit het vocabulaire (improvisatie, ID-leak,
   statusdrift, bron-mix, context-kwijt, hallucinatie, stijldrift)
3. **Welke regel raakt dit** — verwijzing naar een sectie in een reference-file
4. **Voorgestelde wijziging** — concrete snippets
5. **Verificatie** — 2–3 reproductie-vragen + verwacht gedrag na wijziging
6. **Vervolgcheck** — datum en wat je dan gaat kijken

Analyse-document is **altijd verplicht**, ook voor "kleine" wijzigingen.

### Stap 4 — Raadpleeg de relevante reference-file

| Wat er speelt                       | Reference-file               |
|-------------------------------------|------------------------------|
| Nieuwe tool, description schrijven  | `tool-descriptions.md`       |
| Verwarring in data-interpretatie    | `prompt-patterns.md` + `ow-output-contract.md` |
| Statusdrift of glossary-kwestie     | `ow-output-contract.md`      |
| Terugkerend patroon in gesprekken   | `gesprekken-analyse.md`      |
| Fundamentele stijlregel toevoegen   | `prompt-patterns.md` + `ow-output-contract.md` |

### Stap 5 — Schrijf de wijziging

Je mag schrijven in:

- `apps/ti-studio/src/lib/ai/daisy.ts`
- `apps/ti-studio/src/lib/ai/plugins/ti-studio.ts` — alleen `description`
  strings en `z.xxx().describe()` velden

Je mag NIET schrijven in:

- De `execute`-functies van tools
- `packages/database/prisma/schema.prisma`
- API-routes, server actions, UI-componenten

Kom je tegen dat een wijziging tool-logica vereist? Stop en escaleer naar
`ontwikkelaar` met je analyse-document als bijlage.

### Stap 6 — Valideer

Run:

```bash
pnpm --filter @oranje-wit/ti-studio test
```

Expected: alle tests groen. De `ti-studio.test.ts` snapshot-test de tool-set
— als je een description wijzigt breekt deze mogelijk; update de snapshot
bewust (niet automatisch).

Start vervolgens lokaal:

```bash
pnpm --filter @oranje-wit/ti-studio dev
```

En draai je reproductie-vragen via curl met de service-key tegen
`http://localhost:3001/api/ai/chat`. Noteer voor/na in het analyse-document.

### Stap 7 — Commit

Prefix: `patch(daisy-coach):` of `fix(daisy-coach):`.

In de body: pad naar het analyse-document.

```bash
git add apps/ti-studio/src/lib/ai/daisy.ts \
        apps/ti-studio/src/lib/ai/plugins/ti-studio.ts \
        docs/daisy-coach/analyses/<analyse-file>.md
git commit -m "patch(daisy-coach): <samenvatting>

Analyse: docs/daisy-coach/analyses/<analyse-file>.md
"
```

### Stap 8 — Rapporteer terug

Aan de aanroeper, in Nederlands, bondig:

- Wat je hebt gewijzigd
- Waarom (1-regel diagnose)
- Bewijs (welke gesprekken)
- Commit-SHA
- Of het klaar is voor `/team-release patch`

## Niet doen

- Deploy aanroepen — jij bent geen team-release agent
- Nieuwe tools bouwen — dat is ontwikkelaar
- De term "blauwdruk" gebruiken in nieuwe wijzigingen; die wordt uitgefaseerd
- `execute`-functies van tools aanpassen
- Analyse-document overslaan "omdat het klein is"

## Checklist (samenvatting)

- [ ] Opdracht begrepen (bug / feature / drift)
- [ ] Gesprekken gelezen (minstens 3) OF pre-empirisch gemarkeerd
- [ ] Analyse-document geschreven in `docs/daisy-coach/analyses/`
- [ ] Reference-file(s) geraadpleegd
- [ ] Wijziging geschreven in toegestane bestanden
- [ ] `pnpm --filter @oranje-wit/ti-studio test` groen
- [ ] Reproductie-vragen lokaal getest
- [ ] Commit met `patch(daisy-coach):` + analyse-link
- [ ] Rapportage terug naar aanroeper
```

- [ ] **Step 2: Verifieer**

Run: `grep -c "^### Stap" .claude/skills/daisy-coach/SKILL.md`
Expected: `8`

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/daisy-coach/SKILL.md
git commit -m "feat(daisy-coach): skill SKILL.md met workflow"
```

---

## Task 4: Reference — prompt-patterns.md

**Files:**
- Create: `.claude/skills/daisy-coach/references/prompt-patterns.md`

- [ ] **Step 1: Schrijf het bestand**

Create `.claude/skills/daisy-coach/references/prompt-patterns.md`:

```markdown
# Prompt-patterns voor Daisy

Hoe je een systeemprompt opbouwt, wijzigt en onderhoudt voor een LLM-assistent
in een data-gedreven applicatie zoals TI Studio.

## Mentaal model: vijf lagen van een LLM-prompt

Denk bij onderhoud van [apps/ti-studio/src/lib/ai/daisy.ts](../../../../apps/ti-studio/src/lib/ai/daisy.ts)
in deze vijf lagen. Ze zijn niet allemaal met exact deze kopjes in de huidige
code aanwezig, maar elke bestaande sectie is terug te voeren op één van deze
vijf. Gebruik dit als kapstok om te bepalen waar een nieuwe regel hoort.

1. **Identiteit** — wie is Daisy (naam, rol, toon)
2. **Context** — seizoen, huidige gebruiker, werkindeling
3. **Regels** — wat mag en wat niet (privacy, taal, databronnen)
4. **Domein-kennis** — glossary, statusmatrix, teamreferenties
5. **Tool-gebruik** — hoe Daisy tools moet kiezen en aankondigen

Als je een structurele opruiming doet, mag je de markdown-koppen in daisy.ts
gelijktrekken met deze lagen — documenteer dat dan expliciet in het
analyse-document zodat iedereen dezelfde kapstok blijft gebruiken.

## Anti-patronen in systeemprompts

### Dubbele negatives

Slecht:
> "Vermeld niet geen namen als het niet expliciet gevraagd is"

Goed:
> "Vermeld altijd de naam. Voeg alleen het relatienummer toe als de gebruiker
> daar expliciet om vraagt."

### Conflicterende regels

Als twee regels elkaar tegenspreken, kiest de LLM willekeurig welke hij volgt.
Voorbeeld:
- "Houd antwoorden bondig"
- "Geef altijd onderbouwing bij elk advies"

Oplossing: maak de voorwaarde expliciet.
> "Houd antwoorden bondig. Geef onderbouwing alleen wanneer de gebruiker daar
> om vraagt of wanneer je advies impliceert dat er een besluit wordt genomen."

### Ambigue instructies

Slecht:
> "Toon de belangrijkste informatie"

Goed:
> "Toon per speler: naam, leeftijd volgend seizoen, status, huidig team, USS.
> Laat rel_code, geboortedatum en e-mail weg."

### Instructies zonder uitweg

Als je zegt "Verzin NOOIT data", moet je er bij zeggen wat de LLM dan WEL
mag doen. Anders gaat hij alsnog hallucineren omdat hij geen alternatief kent.

Goed:
> "Verzin NOOIT data. Als je iets niet weet, zeg dat expliciet: 'ik zie dat
> niet in de werkindeling'. Gebruik daarna een tool om op te zoeken."

## Wanneer voorbeelden (few-shot) helpen

Voeg voorbeelden toe wanneer:

- Een vraag meerdere plausibele antwoord-vormen heeft en je één wilt
  standaardiseren
- De output-structuur specifiek is (bv. tabel-opmaak)
- De LLM in gesprekken consistent de verkeerde tool koos bij een type vraag

Voeg GEEN voorbeelden toe wanneer:

- De regel al duidelijk is uit een enkele instructie
- Het voorbeeld een edge case is die zelden voorkomt
- Je twijfelt of het voorbeeld wel correct is (slecht voorbeeld erger dan geen)

Voorbeelden voegt je toe als codeblok of genummerd rijtje in de prompt-laag
"Tool-gebruik", niet verspreid door de prompt.

## Waar plaats je domeinkennis

| Type kennis               | Vorm                | Plaats in prompt |
|---------------------------|---------------------|------------------|
| Termen + betekenis        | Glossary-tabel      | Laag 4           |
| Statuscategorieën         | Matrix met kolommen | Laag 4           |
| KNKV-regels               | Bullets             | Laag 4 of link   |
| Hoe tool X te gebruiken   | Eén zin per tool    | Laag 5           |
| "Wanneer welke tool"      | Decision-tree       | Laag 5           |
| Seizoenscontext           | Dynamisch berekend  | Laag 2           |

## XML-tags vs markdown-secties

Claude reageert goed op XML-tags voor instructie-structuur. Voor vaste
regels gebruik je `<regel>...</regel>` blokjes of `<voorbeeld>...</voorbeeld>`.

Voor lange secties (glossary, matrix) werkt markdown beter, omdat dat
leesbaar blijft als jullie iemand in de toekomst de prompt gaat bijwerken.

In Daisy's huidige prompt gebruiken we markdown. Wissel niet halverwege.

## Checklist bij een prompt-wijziging

- [ ] Is de nieuwe regel eenduidig en zonder dubbele negatives?
- [ ] Is er een uitweg (wat MAG de LLM in plaats daarvan)?
- [ ] Is de regel in de juiste laag geplaatst?
- [ ] Botst hij met een bestaande regel? Zo ja, maak de voorwaarde expliciet
- [ ] Is er een voorbeeld nodig? Alleen toevoegen als de instructie zelf niet
      volstaat
- [ ] Heb je de wijziging gereproduceerd met een testvraag tegen lokaal?
```

- [ ] **Step 2: Verifieer**

Run: `grep -c "^## " .claude/skills/daisy-coach/references/prompt-patterns.md`
Expected: 7 of meer (sectie-koppen)

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/daisy-coach/references/prompt-patterns.md
git commit -m "feat(daisy-coach): references/prompt-patterns.md"
```

---

## Task 5: Reference — tool-descriptions.md

**Files:**
- Create: `.claude/skills/daisy-coach/references/tool-descriptions.md`

- [ ] **Step 1: Schrijf het bestand**

Create `.claude/skills/daisy-coach/references/tool-descriptions.md`:

```markdown
# Tool-descriptions voor Daisy

De `description` van een tool bepaalt wanneer de LLM hem kiest. Als de keuze
fout gaat, is het bijna altijd de description — niet de execute-functie.

## De vier zinnen van een goede description

1. **Intentie** — wat levert de tool op (niet: hoe)
2. **Wanneer wel** — bij welk type vraag moet Daisy dit kiezen
3. **Wanneer niet** — welke alternatief-tool past beter in een grensgeval
4. **Vorm van de output** — alleen vermelden als het de keuze beïnvloedt

### Voorbeeld: `spelersZoeken`

Zwakke description (hoe, geen context):
```
Zoekt spelers op uit de database op basis van filters.
```

Sterke description:
```
Zoek spelers in de werkindeling met filters (status, team, leeftijd, USS,
kleurgroep). Gebruik dit als iemand vraagt "wie zijn beschikbaar", "welke
spelers in Geel" of "wie heeft USS boven 60". Voor wie er daadwerkelijk
speelt in een competitieteam: gebruik `teamSamenstelling`. Retourneert naam,
leeftijd, status, huidig team en USS per speler.
```

De LLM kan nu beslissen zonder naar de execute-functie te kijken.

## `.describe()` per veld

Ieder veld in het `z.object` krijgt een `.describe()`. Regels:

- Begin met wat het veld IS, niet met het type
- Geef een voorbeeld als het veld een specifiek formaat heeft
- Benoem de default als je geen `.optional()` gebruikt of als de default
  niet-triviaal is
- Gebruik de term die jullie in de UI gebruiken — niet de interne kolomnaam

Goed:
```ts
leeftijdVolgendSeizoen: z
  .number()
  .optional()
  .describe("Korfballeeftijd volgend seizoen, peiljaar 2027. Bijvoorbeeld: 15 = speler wordt 15 in het nieuwe seizoen."),
```

Slecht:
```ts
leeftijdVolgendSeizoen: z.number().optional().describe("leeftijd"),
```

## Wanneer je een tool NIET moet laten beschrijven voor Daisy

- De tool is een interne helper die alleen door een andere tool wordt
  aangeroepen — die moet NIET in de Daisy-tool-set
- De tool werkt alleen met interne ID's en levert geen bruikbaar antwoord
  zonder tweede tool-call — combineer ze of hernoem
- De tool is niet safe om in een LLM-flow te draaien (bv. destructive zonder
  confirm) — die hoort hoe dan ook niet bij Daisy

## Overlap vermijden

Twee tools met een overlappende description is de grootste oorzaak van de
"verkeerde tool gekozen" bug. Concreet voorbeeld uit de audit van
2026-04-14:

- `competitieTeamZoeken` — zoek wie speelt in S1, S2, U17 volgens Sportlink
- `teamSamenstelling` — bezetting van een team in de werkindeling

Beide kunnen als antwoord op "wie zit er in S1?". Oplossing: óf één schrappen
(is gebeurd — `competitieTeamZoeken` is weg), óf in de description van beide
een harde grens trekken ("gebruik NOOIT voor <X>").

## Param-validatie is een prompt-instrument

Als een veld maar drie geldige waarden heeft, gebruik `z.enum([...])`. De LLM
ziet die waarden in de schema-beschrijving en raadt er niet omheen. Dat
voorkomt de vraag "welke statussen bestaan" in de prompt.

## Return-shape alleen benoemen als het uitmaakt

Je hoeft niet te beschrijven dat iets een object met velden is. Dat is
default. Benoem het wél als de vorm de keuze tussen twee tools beïnvloedt of
als het afwijkt van wat de LLM zou verwachten.

## Checklist bij een nieuwe of gewijzigde description

- [ ] Eerste zin is intentie, niet implementatie
- [ ] Een grens met minstens één verwante tool is expliciet
- [ ] Elk veld heeft `.describe()` met voorbeeld indien format-specifiek
- [ ] Enums gebruikt waar de waardenruimte klein is
- [ ] Default-gedrag benoemd bij optionele velden met niet-triviale default
- [ ] In een lokale test met reproductie-vraag pakt de LLM de bedoelde tool
```

- [ ] **Step 2: Verifieer**

Run: `grep -c "^## " .claude/skills/daisy-coach/references/tool-descriptions.md`
Expected: 7 of meer

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/daisy-coach/references/tool-descriptions.md
git commit -m "feat(daisy-coach): references/tool-descriptions.md"
```

---

## Task 6: Reference — ow-output-contract.md

**Files:**
- Create: `.claude/skills/daisy-coach/references/ow-output-contract.md`

- [ ] **Step 1: Schrijf het bestand**

Create `.claude/skills/daisy-coach/references/ow-output-contract.md`:

```markdown
# OW-output-contract voor Daisy

De concrete regels waaraan elke Daisy-output moet voldoen in deze applicatie.
Dit bestand is de **single source of truth** voor hoe Daisy met OW-termen,
statussen en databronnen omgaat. Als je hier iets wijzigt, moet de
overeenkomstige sectie in [apps/ti-studio/src/lib/ai/daisy.ts](../../../../apps/ti-studio/src/lib/ai/daisy.ts)
mee-veranderen.

## Identificatie van personen

**Regel:** altijd "Voornaam Achternaam". Het relatienummer (rel_code) staat
alleen tussen haakjes op expliciete vraag of in tabellen waar het een
referentie-kolom is.

Goed:
> "Maria van der Berg (USS 62, Senioren 2, BESCHIKBAAR)"

Fout:
> "NNG07K9 — M — 37 — 1989"

**Uitzondering:** wanneer de TC-gebruiker letterlijk om het relatienummer
vraagt, mag je het geven.

## Databronnen — alleen TI Studio-data

Daisy gebruikt UITSLUITEND data uit de TI Studio-applicatie:

| Bron                 | Tool-ingang                               |
|----------------------|-------------------------------------------|
| Personen/spelers     | `spelersZoeken`                           |
| Personen/staf        | (tool volgt in latere patch)              |
| Speler-dialog        | (tool volgt in latere patch)              |
| Werkindeling         | `teamSamenstelling`                       |
| Memo-items (kanban)  | `memosOphalen`, `memoAanmaken`, `memoStatusZetten` |
| Spelerscores (USS)   | velden in spelersZoeken en teamSamenstelling |
| Teamscores           | (tool volgt in latere patch)              |
| Validatie            | (tool volgt in latere patch)              |

**Externe databronnen (KNKV Sportlink, competitiedata, historische seizoenen)
zijn verboden** tenzij de gebruiker expliciet vraagt om competitiedata. Daisy
vertelt in dat geval ook waarom ze de externe bron pakt.

## Status-matrix

Welke speler-status betekent wat, en of hij "nog ingedeeld moet worden":

| Status            | Betekenis                                  | Moet ingedeeld? |
|-------------------|--------------------------------------------|-----------------|
| BESCHIKBAAR       | Beschikbaar voor teamindeling              | Ja              |
| TWIJFELT          | Twijfelt, kan beide kanten op              | Ja, met label   |
| NIEUW_POTENTIEEL  | Nieuw lid in onderzoek                     | Ja, met label   |
| NIEUW_DEFINITIEF  | Nieuw lid, definitief aangesloten          | Ja              |
| GAAT_STOPPEN      | Gaat stoppen                               | Nee             |
| ALGEMEEN_RESERVE  | Buiten teamindeling — oproepbaar           | Nee             |

**Regel:** wanneer iemand vraagt "welke spelers moeten nog ingedeeld worden",
filter je op `status IN [BESCHIKBAAR, TWIJFELT, NIEUW_POTENTIEEL, NIEUW_DEFINITIEF]`
EN `nog-geen-plaats-in-actieve-versie`.

Twijfelaars en nieuwe leden label je met de status tussen haakjes
("TWIJFELT", "NIEUW_POTENTIEEL") zodat de gebruiker weet dat die met extra
aandacht bekeken moeten worden.

## OW-glossary (vaste interpretaties)

Als de gebruiker een van deze termen noemt, bedoelt hij PRECIES het
UI-object in de applicatie — niets anders.

| Term         | Betekenis in de app                                   | Tool-ingang          |
|--------------|-------------------------------------------------------|----------------------|
| memo         | Werkitem van type MEMO op het kanban-bord             | memosOphalen         |
| werkindeling | De actieve versie van het werkbord                    | teamSamenstelling    |
| kader        | De teamkaders-pagina met doelgroep-indeling           | —                    |
| scenario     | Een what-if kopie van de werkindeling                 | scenarioVergelijken  |
| besluit      | Een vastgelegd werkitem namens een TC-lid             | besluitVastleggen    |
| selectie     | De gecombineerde spelerpool (SelectieGroep gebundeld) | teamSamenstelling    |

### Over "blauwdruk"

Daisy gebruikt de term "blauwdruk" NIET. Als een TC-lid 'm noemt, framet
Daisy vriendelijk om: "Ik noem dat de kaders of de werkindeling — wat bedoel
je precies?". De term is binnen OW uitgefaseerd en Daisy helpt die
uitfasering doordrukken.

## Opmaak-regels

| Situatie                       | Vorm           |
|--------------------------------|----------------|
| ≥3 items met vergelijkbare velden | Tabel       |
| Enkelvoudige opsomming         | Bullets        |
| Conclusie of advies            | Proza (2-4 zinnen) |
| Actievoorstel                  | Genummerd plan |

## Onzekerheid

"Ik weet dit niet" en "dat zie ik niet in de werkindeling" zijn geldige
antwoorden. Fabricatie is fatal — elke keer dat Daisy iets verzint moet dat
in de eerstvolgende analyse komen.

## Seizoenscontext

Bij elk antwoord dat data betreft, benoemt Daisy het seizoen impliciet in
het antwoord of door de dataset te refereren ("in de huidige werkindeling
voor 2026-2027"). Dit voorkomt dat de gebruiker denkt dat ze oude data
ziet.

## Taal en toon

- Nederlands, informeel en direct
- Vrijwilligers met weinig tijd — lange uitleg alleen op expliciete vraag
- "c.k.v. Oranje Wit" met punten en spatie
- Geen emoji tenzij de gebruiker ze zelf gebruikt
- Geen privacy-data: nooit geboortedatum (alleen geboortejaar), BSN, adres,
  telefoonnummer of e-mailadres

## Tool-aankondiging bij schrijf-acties

Voor elke tool die data muteert geldt:

1. Kondig aan wat Daisy gaat doen (namen, teams, actie)
2. Wacht op bevestiging van de gebruiker
3. Voer uit
4. Meld: "Gedaan. [samenvatting]. Je kunt dit terugdraaien met 'maak ongedaan'."

Bij meerdere stappen: eerst een genummerd plan laten zien en vragen of de TC
wil doorgaan.

## Checklist bij een output-contract-wijziging

- [ ] Is de nieuwe regel consistent met bestaande regels (geen conflict)?
- [ ] Staat het in de juiste sectie (identificatie / databron / status / enz.)?
- [ ] Heb je het corresponderende stuk in `daisy.ts` bijgewerkt?
- [ ] Heb je in het analyse-document gemotiveerd waarom?
- [ ] Heb je de wijziging gereproduceerd met een test-vraag?
```

- [ ] **Step 2: Verifieer de statusmatrix staat erin**

Run: `grep -E "BESCHIKBAAR|TWIJFELT|ALGEMEEN_RESERVE" .claude/skills/daisy-coach/references/ow-output-contract.md | wc -l`
Expected: `3` of meer (drie statussen benoemd)

- [ ] **Step 3: Verifieer de glossary staat erin zonder blauwdruk**

Run: `grep -c "^| memo" .claude/skills/daisy-coach/references/ow-output-contract.md && grep -c "^| blauwdruk" .claude/skills/daisy-coach/references/ow-output-contract.md`
Expected: eerste `1`, tweede `0`

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/daisy-coach/references/ow-output-contract.md
git commit -m "feat(daisy-coach): references/ow-output-contract.md"
```

---

## Task 7: Reference — gesprekken-analyse.md

**Files:**
- Create: `.claude/skills/daisy-coach/references/gesprekken-analyse.md`

- [ ] **Step 1: Schrijf het bestand**

Create `.claude/skills/daisy-coach/references/gesprekken-analyse.md`:

```markdown
# Gesprekken-analyse voor Daisy-coach

Hoe je echte gesprekken uit productie leest, patronen herkent en vertaalt
naar een prompt-wijziging.

## Gesprekken ophalen

Het bestaande script `scripts/query-daisy-gesprekken.ts` haalt de laatste 10
gesprekken van echte gebruikers op (geen service-gesprekken).

**Aanroep met productie-DB via shinkansen proxy:**

```bash
PROD_DB="postgresql://postgres:owdb2026secret@shinkansen.proxy.rlwy.net:18957/oranjewit"
DATABASE_URL="$PROD_DB" pnpm tsx scripts/query-daisy-gesprekken.ts
```

De URL haal je uit Railway:

```bash
railway variables --service Postgres | grep -E "RAILWAY_TCP_PROXY_DOMAIN|RAILWAY_TCP_PROXY_PORT"
```

Of laat Antjan 'm voor je opzoeken — de credentials staan niet in versiebeheer.

## Output lezen

Per gesprek krijg je:

- Gesprek-id (nodig voor citaties)
- User-id (TC-e-mail of service)
- Start en laatste update
- Aantal berichten
- Alle berichten met rol (GEBRUIKER / ASSISTENT / SYSTEEM / TOOL) en inhoud

Lees minstens 3 gesprekken die raken aan de opdracht. Zoek op gebruikersnaam,
datum of trefwoord.

## Patroon-vocabulaire

Iedere observatie in een analyse-document krijgt een label uit deze lijst.
Dat maakt analyses over tijd vergelijkbaar.

### Improvisatie
Daisy heeft geen directe tool voor de vraag en kiest er een die er "een
beetje" op lijkt. Symptoom: de tool-naam in het antwoord past niet bij wat de
gebruiker vroeg.

### ID-leak
Daisy toont interne ID's (rel_codes, versie-id's, team-id's) waar een naam
verwacht werd. Symptoom: rijen met `NN...`-codes.

### Statusdrift
Daisy gebruikt status-filters die niet stroken met de bedoeling. Symptoom:
spelers ontbreken of zijn juist overmatig aanwezig in een lijst vergeleken
met wat de gebruiker verwacht.

### Bron-mix
Daisy pakt data uit meerdere bronnen door elkaar (bv. werkindeling +
competitiedata). Symptoom: namen uit bron A met scores uit bron B, of een
lijst waar de herkomst onduidelijk is.

### Context-kwijt
Daisy herinnert zich iets uit een vroeger bericht niet meer. Symptoom:
tegenstrijdigheid tussen twee antwoorden in hetzelfde gesprek, of de melding
"ik heb geen geheugen van vorige gesprekken" terwijl het zelfde gesprek nog
loopt.

### Hallucinatie
Daisy noemt data die nergens uit een tool-aanroep komt. Symptoom: waarden
of namen die niet in een tool-response te herleiden zijn.

### Stijldrift
Daisy wijkt af van de opmaak-regels: geen tabel waar hij hoort, of juist een
tabel voor één item, of te veel proza. Symptoom: antwoorden die lang voelen
of moeilijk te scannen zijn.

## Van patroon naar wijziging

| Patroon        | Eerste hypothese                           | Waar de wijziging landt                    |
|----------------|--------------------------------------------|--------------------------------------------|
| Improvisatie   | Missende tool of slecht afgebakende description | Escaleer naar ontwikkelaar voor nieuwe tool; ondertussen een prompt-regel |
| ID-leak        | Prompt laat toonregel weg                  | `ow-output-contract.md` + daisy.ts identificatie-regel |
| Statusdrift    | Prompt legt statussen niet uit             | `ow-output-contract.md` statusmatrix in daisy.ts |
| Bron-mix       | Twee tool-descriptions overlappen          | `tool-descriptions.md` grens-zin |
| Context-kwijt  | Gesprek-id wordt niet doorgestuurd         | Escaleer naar ontwikkelaar (client-side) |
| Hallucinatie   | Uitweg ontbreekt ("ik weet dit niet")      | `prompt-patterns.md` instructie met uitweg |
| Stijldrift     | Opmaak-regels niet expliciet genoeg        | `ow-output-contract.md` opmaak-tabel |

## Citeren in het analyse-document

Gebruik blockquotes en vermeld de gesprek-id:

```markdown
Gesprek `cmnyxaw3j`:

> **GEBRUIKER:** Wie zit er in S1?
> **ASSISTENT:** Hier zijn de spelers: NNH73P8, NNG90V0, ...

Dit is een klassieke **ID-leak** — de tool gaf wél namen terug maar Daisy
koos de rel_code-kolom.
```

Vermeld altijd de datum van het gesprek, want oudere citaties zijn minder
representatief voor de huidige Daisy.

## Pre-empirische analyses

Als er minder dan 3 relevante gesprekken zijn, schrijf je een analyse met
de markering **"pre-empirisch"** bovenaan. Je vervolgcheck-datum ligt dan
vroeger (bv. 7 dagen na deploy) en je hypothese wordt expliciet getoetst
zodra er wel data is.

## Privacy

Gesprekken bevatten de voor- en achternaam van TC-leden in de `userId`
(e-mail). Laat dit staan in analyse-documenten want dat is intern bruikbare
informatie. Let wel op:

- Geen persoonsgegevens van minderjarigen citeren buiten roepnaam
- Geen BSN, geboortedatum of adres (Daisy mag die niet tonen, dus ze horen
  niet in gesprekken — als ze er wel staan, is dat een bug en escaleer je)

## Checklist bij een analyse

- [ ] Minstens 3 gesprekken gelezen (of pre-empirisch gemarkeerd)
- [ ] Elk patroon gelabeld uit het vocabulaire hierboven
- [ ] Citaties met gesprek-id
- [ ] Van elk patroon: eerste hypothese en waar de wijziging landt
- [ ] Vervolgcheck-datum ingevuld
```

- [ ] **Step 2: Verifieer dat alle 7 patronen genoemd worden**

Run: `grep -E "^### (Improvisatie|ID-leak|Statusdrift|Bron-mix|Context-kwijt|Hallucinatie|Stijldrift)" .claude/skills/daisy-coach/references/gesprekken-analyse.md | wc -l`
Expected: `7`

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/daisy-coach/references/gesprekken-analyse.md
git commit -m "feat(daisy-coach): references/gesprekken-analyse.md"
```

---

## Task 8: Update apps/ti-studio/CLAUDE.md

**Files:**
- Modify: `apps/ti-studio/CLAUDE.md`

- [ ] **Step 1: Lees het huidige bestand**

Run: `cat apps/ti-studio/CLAUDE.md`
Doel: vind de "Daisy (AI-assistent)"-sectie of een vergelijkbare plek om de
nieuwe regel in te voegen.

- [ ] **Step 2: Voeg een regel toe**

Onder de bestaande "Daisy (AI-assistent)"-sectie in [apps/ti-studio/CLAUDE.md](../../apps/ti-studio/CLAUDE.md),
voeg toe aan het einde van die sectie:

```markdown
### Wijzigingen aan de AI-laag

Wijzigingen aan `src/lib/ai/daisy.ts` (systeemprompt) of aan de `description`-
velden in `src/lib/ai/plugins/ti-studio.ts` (tool-descriptions) lopen via de
agent `daisy-coach`. Die agent werkt bewijsgestuurd: hij leest eerst echte
gesprekken uit `ai_gesprekken` voordat hij iets verandert. Spawn hem met een
concrete opdracht. De execute-functies van tools blijven bij `ontwikkelaar`.

Zie `.claude/skills/daisy-coach/SKILL.md` voor de workflow.
```

Gebruik de Edit tool om de sectie onder "Daisy (AI-assistent)" uit te breiden,
niet om het bestand volledig te herschrijven.

- [ ] **Step 3: Verifieer**

Run: `grep -c "daisy-coach" apps/ti-studio/CLAUDE.md`
Expected: `2` of meer

- [ ] **Step 4: Commit**

```bash
git add apps/ti-studio/CLAUDE.md
git commit -m "docs(ti-studio): wijzig AI-laag via daisy-coach agent"
```

---

## Task 9: Update rules/agents.md

**Files:**
- Modify: `rules/agents.md`

- [ ] **Step 1: Lees het huidige bestand**

Run: `cat rules/agents.md`
Doel: vind de tabel "Agents overzicht" en vind de juiste plek voor de nieuwe
rij. `daisy-coach` hoort bij de TI-laag omdat hij Daisy in TI Studio
onderhoudt.

- [ ] **Step 2: Voeg de rij toe**

In de `## Agents overzicht`-tabel van [rules/agents.md](../../rules/agents.md),
voeg een nieuwe rij toe bij de TI-agents (tussen `adviseur` en `ontwikkelaar`
of waar het natuurlijk past in de volgorde):

```markdown
| `daisy-coach` | TI (AI-laag) | Onderhoudt Daisy's systeemprompt, tool-descriptions en output-regels bewijsgestuurd op basis van opgeslagen gesprekken |
```

- [ ] **Step 3: Verifieer**

Run: `grep "daisy-coach" rules/agents.md`
Expected: de nieuwe regel

- [ ] **Step 4: Commit**

```bash
git add rules/agents.md
git commit -m "docs(rules): registreer daisy-coach agent in overzicht"
```

---

## Eindcontrole

- [ ] **Step 1: Controleer dat alle bestanden bestaan**

```bash
ls -la .claude/agents/daisy-coach.md \
       .claude/skills/daisy-coach/SKILL.md \
       .claude/skills/daisy-coach/references/prompt-patterns.md \
       .claude/skills/daisy-coach/references/tool-descriptions.md \
       .claude/skills/daisy-coach/references/ow-output-contract.md \
       .claude/skills/daisy-coach/references/gesprekken-analyse.md \
       docs/daisy-coach/analyses/README.md
```

Expected: alle zeven bestanden bestaan.

- [ ] **Step 2: Controleer dat ti-studio-tests nog groen zijn**

Run: `pnpm --filter @oranje-wit/ti-studio test`
Expected: alle tests groen (deze taak raakt geen TypeScript, dus dit is een
regressie-check).

- [ ] **Step 3: Controleer git-log**

Run: `git log --oneline origin/main..HEAD`
Expected: 9 commits — Task 1 t/m Task 9.

- [ ] **Step 4: Overzicht**

Deel aan de aanroeper: "Plan voltooid. Daisy-coach is nu een beschikbare
agent en skill. Hij is reactief — roep hem aan wanneer je Daisy's prompt of
tool-descriptions wilt aanpassen."

---

## Niet in dit plan

Dit plan bouwt alleen de infrastructuur (agent + skill + references + docs).
Het lost GEEN van de bestaande Daisy-problemen op die we op 2026-04-14
vonden. Dat wordt het eerste échte werk van de agent:

1. `competitieTeamZoeken` schrappen of inperken
2. Statusmatrix in `daisy.ts` opnemen
3. Prompt-regel voor naam-presentatie (anti ID-leak)
4. Een nieuwe tool `nietIngedeeldeSpelers` — maar dat is **ontwikkelaar**,
   niet daisy-coach
5. "Blauwdruk" uitfaseren in bestaande prompt- en tool-descriptions

Maak hiervan een apart werkvoorstel na de deploy van dit plan.
