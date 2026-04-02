# Daisy TI-plugin — Design spec
**Datum:** 2026-04-02
**Status:** Goedgekeurd voor implementatie

---

## Doel

Daisy uitbreiden met een volledig uitvoeringsgerichte plugin voor de TI-studio. Ze kan meedenken, uitzoeken én daadwerkelijk acties uitvoeren in scenario's en de werkindeling. De toolkit bepaalt de grenzen; het gesprek is vrij.

---

## Kernprincipes

1. **Toolkit = speelruimte** — Daisy kan alleen wat in haar 16 tools zit. Alles daarbuiten: "Dit kan ik niet uitvoeren." + optioneel waar de gebruiker het zelf kan doen.
2. **Altijd aankondigen** — elke schrijf-actie wordt eerst beschreven, dan pas uitgevoerd na bevestiging.
3. **Altijd terug te draaien** — elke schrijf-actie logt een `DaisyActie` met undo-payload.
4. **Besluiten zijn menselijk** — Daisy legt vast, maar besluit nooit zelf. Attribuering (`namens`) is verplicht.
5. **Batch-planning** — bij meerdere stappen toont Daisy een genummerd plan, de TC bevestigt in één keer of stuurt bij.

---

## Architectuur

```
TC-lid typt vrije opdracht in Daisy-chat
        ↓
Daisy (LLM) interpreteert → bouwt uitvoerplan
  → leest context via lees-tools (spelersZoeken, teamSamenstelling, etc.)
  → formuleert aankondiging: "Ik ga het volgende doen: [stap 1, stap 2, ...]"
        ↓
TC-lid bevestigt (of stuurt bij)
        ↓
Daisy voert uit via schrijf-tools (server actions in TI-database)
  → elke schrijf-actie logt DaisyActie { id, sessieId, tool, doPayload, undoPayload, tijdstip, namens }
        ↓
Daisy meldt: "Gedaan. [samenvatting]. Je kunt dit terugdraaien met 'maak ongedaan'."
```

**Nieuwe database-tabel: `DaisyActie`** (in TI-database, naast Scenario/Blauwdruk)
```
id           String   @id @default(cuid())
sessieId     String                          // = gesprekId uit de Daisy-chat (één sessie per gesprek)
tool         String                          // naam van de uitgevoerde tool
doPayload    Json                            // wat er gedaan is (voor audit)
undoPayload  Json                            // minimale instructie om terug te draaien
tijdstip     DateTime @default(now())
namens       String?                         // voor besluitVastleggen verplicht
uitgevoerdIn String                          // "werkindeling" | "scenario:<id>"
```

---

## Toolkit: 17 tools

### Lezen (4)

| Tool | Parameters | Wat |
|---|---|---|
| `spelersZoeken` | geslacht?, geboortejaar?, ussMin?, ussMax?, retentierisico?, team?, status? | Spelers filteren op één of meer kenmerken |
| `teamSamenstelling` | teamNaam | Volledige bezetting: spelers, USS-scores, geslachtsverhouding, staf |
| `scenarioVergelijken` | scenarioIdA, scenarioIdB | Diff: wie is verschoven, wat is score-impact |
| `blauwdrukToetsen` | — | Werkindeling toetsen aan blauwdruk-kaders (teamgrootte, categorie, niveau) |

### Schrijven — Spelers (6)

| Tool | Parameters | Wat |
|---|---|---|
| `spelerVerplaatsen` | spelerId, naarTeam, inContext ("werkindeling" \| scenarioId) | Speler verplaatsen, logt DaisyActie met undo (terugplaatsen) |
| `spelerStatusZetten` | spelerId, status | Status bijwerken (beschikbaar/onzeker/gestopt/etc.), logt vorige status als undo |
| `spelerNotitieZetten` | spelerId, notitie | Notitie schrijven, logt vorige notitie als undo |
| `nieuwLidInBlauwdruk` | naam, geslacht, geboortejaar | Verwacht nieuw lid aanmaken, undo = verwijderen |
| `plaatsreserveringZetten` | team, naam, geslacht? | Placeholder in team, undo = verwijderen |
| `besluitVastleggen` | besluit, namens | Besluit loggen namens TC-lid; `namens` verplicht; undo = besluit verwijderen |

### Schrijven — Teams & Staf (3)

| Tool | Parameters | Wat |
|---|---|---|
| `teamAanmaken` | naam, categorie, inContext | Nieuw team aanmaken in scenario, undo = verwijderen (alleen als leeg) |
| `selectieAanmaken` | naam, spelerIds[], inContext | Selectiegroep aanmaken en spelers toewijzen |
| `stafPlaatsen` | stafNaam, rol, team, inContext | Staf opzoeken op naam, rol toewijzen aan team, undo = toewijzing verwijderen |

### Schrijven — Werkbord & Scenario (2)

| Tool | Parameters | Wat |
|---|---|---|
| `whatIfScenarioAanmaken` | naam | Kopie van werkindeling als nieuw scenario, klaar als speelruimte |
| `actiePlaatsen` | titel, beschrijving?, toegewezenAan? | Werkitem aanmaken op het werkbord |

### Undo (2)

| Tool | Parameters | Wat |
|---|---|---|
| `actieOngedaanMaken` | actieId? | Laatste DaisyActie (of specifieke) terugdraaien |
| `sessieTerugdraaien` | — | Alle DaisyActies van huidige sessie in omgekeerde volgorde terugdraaien |

---

## Aankondigingsformat

**Enkelvoudige actie:**
> "Ik ga **Emma de Vries** verplaatsen van **Sen 3** naar **Sen 2**. Doorgaan?"

**Batch-opdracht:**
> "Ik ga het volgende uitvoeren:
> 1. Robin Jansen → U15-1
> 2. Lars Bakker → U15-2
> 3. Notitie op Lars: 'schakelkandidaat'
>
> Doorgaan met alle 3, of wil je iets aanpassen?"

**Buiten toolkit:**
> "Dit kan ik niet uitvoeren." + optioneel: "Je kunt dit zelf doen via [locatie in de UI]."

---

## Undo-mechanisme

Sessieterugdraaien voert undo-acties in **omgekeerde volgorde** uit:

| Actie | Undo |
|---|---|
| `spelerVerplaatsen` (A→B) | `spelerVerplaatsen` (B→A) |
| `teamAanmaken` | team verwijderen als leeg; als niet leeg: foutmelding + handmatige actie vereist |
| `spelerStatusZetten` | vorige status herstellen |
| `spelerNotitieZetten` | vorige notitie herstellen (of leegmaken) |
| `nieuwLidInBlauwdruk` | lid verwijderen uit blauwdruk |
| `besluitVastleggen` | besluit verwijderen |
| `plaatsreserveringZetten` | placeholder verwijderen |
| `stafPlaatsen` | toewijzing verwijderen |
| `selectieAanmaken` | selectiegroep verwijderen |
| `actiePlaatsen` | werkitem verwijderen |
| `whatIfScenarioAanmaken` | scenario verwijderen (alleen als ongewijzigd t.o.v. werkindeling) |

---

## Bestandsstructuur

```
apps/web/src/lib/ai/plugins/
├── registry.ts          # uitbreiden: ti-studio tools toevoegen
├── ti-studio.ts         # NIEUW: alle 16 tools
├── teamindeling.ts      # bestaand: spelersInTeam + werkindelingStatus (blijft)
├── monitor.ts           # bestaand: ongewijzigd
└── planning.ts          # bestaand: ongewijzigd

apps/web/src/lib/ai/
└── daisy-acties.ts      # NIEUW: DaisyActie CRUD (opslaan, ophalen, undo uitvoeren)

packages/database/prisma/schema.prisma
└── model DaisyActie     # NIEUW: zie schema hierboven
```

---

## Toegang

- Vereist clearance ≥ 1 (TC-leden en coördinatoren) — bestaande check, geen wijziging
- Schrijf-tools werken op zowel scenario's als werkindeling afhankelijk van `inContext`-parameter
- `besluitVastleggen` vereist expliciet `namens`-veld; Daisy vraagt dit na als het ontbreekt

---

## Buiten scope (fase 1)

- Oranje Draad-check (te interpretatief)
- Automatisch spelers suggereren zonder expliciete opdracht
- E-mail/notificaties versturen
- Lezen van evaluatieformulieren (aparte evaluatie-plugin, later)
