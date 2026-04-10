# Design: Versies & What-If Drawer — TI Studio

**Datum:** 2026-04-10
**Status:** Goedgekeurd

---

## Samenvatting

De TI Studio krijgt een rechter sidedrawer voor het beheren van versies en what-ifs.
Het mentale model: **what-ifs zijn versies, en altijd precies 1 versie is de werkversie (⭐ de baas)**.

---

## Mentaal model

```
Werkindeling
  ├── ⭐ Werkversie (v3) — actief, de baas
  ├── What-If: "Sen 1 verjongen" (open)
  ├── What-If: "Rood-A wisselen" (open, verouderd)
  ├── What-If: "Extra heer Sen 2" (→ v3, toegepast)
  ├── v2 (archief)
  └── v1 (archief)
```

Promoveren van een what-if of archiefversie = die versie wordt de nieuwe ⭐ werkversie,
de huidige werkversie schuift naar het archief.

---

## Trigger

De drawer opent/sluit via de **Versies-knop** (gitbranch-icoon) in de linker Ribbon.
Dit is de bestaande "versies"-knop die nu nog een lege `onClick={() => {}}` heeft.

De bestaande `whatIfActief` boolean-toggle in `TiStudioShell` vervalt. De what-if modus
wordt in een latere fase uitgebreid zodat je daadwerkelijk in een what-if werkt
(via een aparte canvas-context). Deze spec dekt de **drawer + CRUD**; de canvas-context
is fase 2.

---

## Drawer: layout

- Positie: rechts naast de canvas, zelfde grid-slot als `ValidatieDrawer`
- Breedte: 264px
- Opent/sluit via dezelfde `togglePanel` mechaniek als pool en validatie
- Panel-naam: `"versies"` (nieuw naast `"pool" | "validatie" | "werkbord"`)

### Header

```
Versies & What-Ifs                         [✕]
```

### Werkversie-blok (bovenaan, altijd zichtbaar)

Oranje bordered blok met subtiele glow. Bevat:
- `⭐ WERKVERSIE` label + `v{n} — actief` badge
- Naam van de versie
- Metadata: datum · auteur · aantal ingedeelde spelers

### Sectie: What-Ifs

Label "What-Ifs" + count "2 open".

Per what-if een kaartje met:
- Icoon (blauw ⚡ voor open, grijs archief-icoon voor gearchiveerd/toegepast)
- Vraag/naam van de what-if
- Metadata: status badge · datum · aantal teams
- "Verouderd" badge als `basisVersieNummer < huidigeVersieNummer`
- **Acties (alleen voor open what-ifs):**
  - `↑ Maak werkversie` — primaire actie, oranje
  - `Archiveer` — secundaire actie, grijs

Toegepaste/gearchiveerde what-ifs tonen alleen metadata (gedimmed, geen acties).

### Sectie: Versie-archief

Label "Versie-archief" + count.

Per archiefversie:
- Versienummer (`v2`, `v1`)
- Naam + datum + auteur
- `⭐ Zet actief` knop
- `🗑` verwijder/archiveer knop

### Footer

```
[ ⚡ Nieuwe What-If aanmaken ]
```

Blauwe dashed knop, volle breedte. Opent een modal/inline-form.

---

## Interacties

### Nieuwe What-If aanmaken

1. Klik "Nieuwe What-If aanmaken"
2. Inline form in de drawer verschijnt:
   - Tekstveld: "Wat wil je uitproberen?" (de `vraag`)
   - Optioneel: toelichting
3. Submit → `createWhatIfVanHuidigeVersie(werkindelingId, { vraag, toelichting })`
   - Nieuwe server action die alle teams van de huidige versie automatisch kopieert
   - (De bestaande `createWhatIf` vereist expliciete `teamIds` — niet geschikt voor "volledige kopie")
4. Drawer toont de nieuwe what-if bovenaan de lijst

### Promoveren (what-if → werkversie)

1. Klik "↑ Maak werkversie" op een open what-if
2. Bevestigingsdialog:
   ```
   What-If promoveren?

   "Sen 1 verjongen — Rik erin" wordt de nieuwe werkversie.
   De huidige werkversie (v3) gaat naar het archief.

   [Annuleer]  [Ja, maak werkversie]
   ```
3. Bij bevestiging: `pasWhatIfToe(whatIfId)`
4. Drawer herlaadt: nieuwe werkversie bovenaan met ⭐, what-if verschijnt als "→ v4"

### Archiefversie activeren (rollback)

1. Klik "⭐ Zet actief" op een archiefversie
2. Bevestigingsdialog:
   ```
   Versie v2 activeren?

   "Na eerste bespreking" wordt de nieuwe werkversie.
   De huidige werkversie (v3) gaat naar het archief.

   [Annuleer]  [Ja, activeer]
   ```
3. Bij bevestiging: `herstelVersie(versieId, auteur)`
4. Drawer herlaadt

### Archiveren / verwijderen

- What-if archiveren: `verwerpWhatIf(whatIfId)` → status VERWORPEN, what-if wordt gedimmed
- Versie verwijderen: `verwijderVersie(versieId)` (geblokkeerd als het de laatste versie is)
- Beide met een inline bevestiging (geen modal, maar een "Weet je het zeker? [Ja] [Nee]" inline)

---

## Toolbar-context

Toolbar toont altijd de actieve context:

| Context | Toolbar-meta |
|---|---|
| Normale werkversie | `⭐ v3 — werkversie` |
| (Fase 2) Werkend in what-if | `⚡ What-If: "Sen 1 verjongen"` (blauw) |

In fase 1 (deze spec): alleen de werkversie-context. De what-if canvas-context is fase 2.

---

## Data & acties

Alle benodigde server actions bestaan al:

| Actie | Server action |
|---|---|
| What-ifs ophalen | `getWhatIfs(werkindelingId)` |
| Nieuwe what-if | `createWhatIf(werkindelingId, data)` |
| Promoveren | `pasWhatIfToe(whatIfId)` |
| Archiveren (what-if) | `verwerpWhatIf(whatIfId)` |
| Versie activeren | `herstelVersie(versieId, auteur)` |
| Versie verwijderen | `verwijderVersie(versieId)` |

Nieuwe server actions nodig:
- `getVersiesVoorDrawer(werkindelingId)` — geeft versies + what-ifs gecombineerd terug voor de drawer
- `createWhatIfVanHuidigeVersie(werkindelingId, { vraag, toelichting? })` — kopieert alle teams van de huidige versie naar een nieuwe what-if

---

## Componenten

```
components/ti-studio/werkbord/
  VersiesDrawer.tsx          ← nieuw (naast SpelersPoolDrawer, ValidatieDrawer)
  VersiesDrawer.types.ts     ← of toevoegen aan types.ts
```

`TiStudioShell.tsx` wijzigingen:
- `ActivePanel` type uitbreiden met `"versies"`
- `whatIfActief` state vervalt
- Ribbon: versies-knop krijgt `onClick={() => togglePanel("versies")}`
- `VersiesDrawer` toegevoegd aan de render naast `ValidatieDrawer`
- Drawer krijgt `werkindelingId` en `versieId` als props

---

## Out of scope (fase 2)

- Canvas-context switching: daadwerkelijk *in* een what-if werken (aparte drag-drop state)
- SSE updates voor versie-wijzigingen (andere gebruiker promoveet)
- What-if vergelijking (side-by-side diff)
