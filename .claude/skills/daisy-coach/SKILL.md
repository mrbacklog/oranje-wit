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
