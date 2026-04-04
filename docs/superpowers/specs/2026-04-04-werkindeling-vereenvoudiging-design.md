# Werkindeling Vereenvoudiging — Design Spec

**Datum:** 4 april 2026
**Status:** Goedgekeurd door gebruiker, klaar voor implementatie

---

## Probleemstelling

De huidige datastructuur heeft drie lagen tussen een seizoen en een teamindeling:

```
Blauwdruk → Concept → Scenario (isWerkindeling=true) → Versie → Team
```

In de praktijk wordt er per seizoen altijd maar **één werkindeling** gemaakt. De Concept- en Scenario-lagen voegen geen waarde toe voor de TC en creëren verwarrende terminologie in de codebase en UI.

Bovendien vereist de huidige Indeling-pagina een meersstaps-wizard om een werkindeling aan te maken — onnodig voor iets dat gewoon altijd beschikbaar moet zijn.

---

## Doelmodel (na deze wijziging)

```
Blauwdruk (intern — TC ziet "Kaders")
  └── Werkindeling  (1 per blauwdruk)
       ├── Versie[]          ← wijzigingshistorie, hard-deletable
       │    └── Team[] → TeamSpeler[]
       └── WhatIf[]          ← "stel dat"-branches
            └── WhatIfTeam[] → WhatIfTeamSpeler[]
```

**Toekomstige stap C (buiten scope van dit plan):**
`Blauwdruk` → `Seizoen` hernoemen door de hele codebase zodra B stabiel is.

---

## Wat verandert

### Schema

| Model | Actie |
|---|---|
| `Concept` | Verwijderd |
| `Scenario` | Hernoemd naar `Werkindeling` (tabel: `werkindelingen`) |
| `ConceptStatus` | Verwijderd |
| `ScenarioStatus` | Hernoemd naar `WerkindelingStatus` |
| `ScenarioSnapshot` | Hernoemd naar `WerkindelingSnapshot` |
| `Versie` | `scenarioId` kolom hernoemd naar `werkindelingId` |
| `WhatIf` | `werkindelingId` was al correct — ongewijzigd |
| `Blauwdruk` | Krijgt directe `werkindeling` relatie (i.p.v. via Concept) |

**Velden die wegvallen op Werkindeling (was Scenario):**
- `conceptId` → vervangen door `blauwdrukId` (directe FK)
- `isWerkindeling` → niet meer nodig (er is er altijd maar één)
- `parentId` / `children` (fork-relatie) → vervallen (WhatIf dekt dit)
- `keuzeWaardes` / `aannames` → vervallen (waren Concept-gerelateerd)

---

## UI-wijzigingen

### Indeling-pagina (`/ti-studio/indeling`)

**Huidig:** wizard als er geen werkindeling is, anders redirect naar `/ti-studio/scenarios/[id]`

**Nieuw:** altijd direct de werkindeling-editor tonen. Als er geen werkindeling bestaat, maakt het systeem er automatisch één aan (lege eerste versie, geen gebruikersinteractie nodig).

### Versies-panel

Zichtbaar als uitklapbaar zijpaneel of section in de editor.

```
Versies
─────────────────────────────────────────
  v4  Huidig                        [herstel]
  v3  3 apr 14:22 — Antjan          [herstel] [🗑]
  v2  2 apr 09:15 — Antjan          [herstel] [🗑]
  v1  1 apr — initieel              [🗑]
─────────────────────────────────────────
  [+ Versie opslaan]
```

- **Herstel** — laadt geselecteerde versie als nieuwe versie bovenaan (v4 → v5). Origineel blijft.
- **🗑 Hard delete** — bevestigingsdialog, dan permanent verwijderd. Laatste versie is niet verwijderbaar.
- **Versie opslaan** — maakt handmatige snapshot van huidige staat.
- Auto-snapshot blijft bestaan bij elke drag-and-drop wijziging (bestaand gedrag).

### Verwijderde routes

| Route | Actie |
|---|---|
| `/ti-studio/scenarios` | Verwijderd (scenario-lijst, overbodig) |
| `/ti-studio/scenarios/[id]` | Verwijderd — werkindeling leeft op `/ti-studio/indeling` |

### Aangepaste routes

| Route | Wijziging |
|---|---|
| `/ti-studio/indeling` | Toont direct de werkindeling-editor (geen redirect meer) |
| `/ti-studio/vergelijk` | Vergelijkt WhatIf-branches (was: scenario-vergelijking) |

---

## Migratiestrategie

Drie stappen in volgorde, elk eigen commit:

### Stap 1 — Schema-migratie
Prisma-migratie:
- Maak tabel `werkindelingen` aan met kolommen van `scenarios` + directe `blauwdrukId` FK
- Verwijder `concepts` tabel
- Hernoem `scenario_snapshots` → `werkindeling_snapshots`

### Stap 2 — Data-migratiescript
Script in `scripts/migrate/`:
- Per blauwdruk: zoek `scenario` met `isWerkindeling = true`, kopieer naar `werkindelingen`
- Overige scenario's: archiveer als `WerkindelingSnapshot` met reden `GEMIGREERD`
- `WhatIf.werkindelingId` updaten naar nieuwe IDs
- `Versie.scenarioId` updaten naar `werkindelingId`

### Stap 3 — Codebase-sweep
- Hernoem alle `scenario` / `concept` referenties in `apps/web/src/`
- Verwijder wizard-componenten: `NieuwScenarioWizard`, `StapMethode`, `wizard-stappen`
- Update routes: verwijder `scenarios/` directory, update `indeling/` page
- Update Daisy TI-plugin tools die scenario refereren
- Hernoem `ScenarioVergelijk` → `WhatIfVergelijk` component en update de vergelijk-pagina
- Update E2E tests

---

## Buiten scope (stap C, apart plan)

- `Blauwdruk` hernoemen naar `Seizoen` in schema en codebase
- Dit volgt zodra stap B stabiel is in productie

---

## Risico's

| Risico | Mitigatie |
|---|---|
| Data-verlies niet-werkindeling scenario's | Archiveren als snapshot vóór verwijdering |
| WhatIf FK's breken na migratie | Data-script update `werkindelingId` atomair in transactie |
| E2E tests refereren aan scenario-routes | Update als onderdeel van stap 3 |
| Daisy TI-plugin gebruikt `scenarioId` | Update in stap 3, plugin werkt dan met `werkindelingId` |
