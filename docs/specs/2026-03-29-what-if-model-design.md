# Design: What-if model voor Team-Indeling

**Datum**: 2026-03-29
**Status**: Goedgekeurd design, klaar voor implementatieplan
**Auteur**: Product-team (brainstorm sessie)

---

## Samenvatting

Het huidige scenario-model (complete kopieën van de hele indeling) wordt vervangen door een what-if model dat aansluit bij hoe de TC daadwerkelijk werkt: één werkindeling die geleidelijk groeit, met lichtgewicht what-ifs om deelvragen te verkennen.

### Kernprincipes

- **Eén werkindeling** is altijd de waarheid. Hier werkt de TC aan.
- **What-ifs** zijn vragen aan de indeling: "Wat als we...?" Ze kopiëren alleen de teams die veranderen.
- **Groeiende scope**: als je een speler pakt uit een team buiten de what-if, wordt dat team automatisch meegenomen. Het domino-effect is altijd zichtbaar.
- **Besluitvorming**: what-ifs kunnen acties/vragen bevatten die eerst beantwoord moeten worden. Pas als alles helder is, kan de TC toepassen of verwerpen.
- **Validatie**: elke what-if wordt real-time gevalideerd tegen KNKV-regels, blauwdruk-kaders en pins.

---

## 1. Het mentale model

De gebruiker denkt niet in "branches" of "delta's". De gebruiker denkt:

> "Dit is onze indeling. Ik heb een vraag: wat als...?"

### Taalgebruik in de UI

| Technisch | In de UI |
|---|---|
| Branch | What-if |
| Trunk/main | Werkindeling |
| Merge | Toepassen |
| Discard | Verwerpen |
| Save | Bewaren |
| Delta | Verschil / impact |

### Geen scenario-lijst meer

Er is geen lijst van complete scenario's waar je doorheen scrollt. In plaats daarvan:

- De **werkindeling** is altijd het startscherm
- In de zijbalk staat een lijstje **open what-ifs**
- Klik op een what-if → opent die in een overlay op de werkindeling
- Alleen één what-if tegelijk actief

---

## 2. What-if workflow

### 2.1 Starten

De TC werkt aan de werkindeling. Ze selecteren één of meer teams en klikken "What-if". Er verschijnt een dialoog:

- **Vraag** (verplicht): wat wil je onderzoeken? Dit wordt de titel.
- **Teams**: de geselecteerde teams zijn aangevinkt. Je kunt meer teams toevoegen of een nieuw team aanmaken.

Na "Start what-if":
- De geselecteerde teams worden gekopieerd (huidige staat)
- De what-if opent in een overlay op de werkindeling

### 2.2 Bewerken

De what-if editor toont drie visuele zones:

| Zone | Wat | Interactie |
|---|---|---|
| **Actieve teams** | Teams die onderdeel zijn van de what-if | Volledig bewerkbaar (drag & drop, spelers toevoegen/verwijderen) |
| **Impact-teams** | Teams buiten de what-if die geraakt worden door wijzigingen | Read-only, met delta's zichtbaar (bijv. "-1 speler") |
| **Ongeraakt** | Alle andere teams | Gedempt, openklapbaar voor context |

**Automatisch meenemen**: zodra je een speler pakt uit een impact-team, wordt dat team automatisch een actief team in de what-if. Het impact-panel meldt: "Team X nu ook onderdeel van deze what-if."

Dit maakt het domino-effect zichtbaar:
1. Start met Senioren 1 en 2
2. Maak Senioren 3, trek spelers uit Senioren 2 → impact zichtbaar
3. Pak een U17-speler → U17 wordt automatisch meegenomen
4. U17 heeft te weinig, pak een U15'er → U15 wordt meegenomen
5. Het impact-panel toont de complete keten

### 2.3 Impact-panel

Real-time overzicht van alle gevolgen:

```
What-if: "Extra 3e senioren"

Gewijzigde teams (4):
  Senioren 1    12 → 10  ⚠️
  Senioren 2    12 → 9   🔴 onder minimum
  Senioren 3    nieuw, 8 spelers
  U17           10 → 9   ✅

Ongewijzigde teams met effect (1):
  U15-1         8 → 7    ⚠️ krap

Totaal spelers verplaatst: 7
```

### 2.4 Afsluiten

Drie opties, altijd zichtbaar:

- **Toepassen** → merge wijzigingen naar werkindeling (zie sectie 6)
- **Bewaren** → sluit what-if, ga terug naar werkindeling, what-if blijft in zijbalk
- **Verwerpen** → what-if wordt verwijderd, werkindeling ongewijzigd

### 2.5 Meerdere what-ifs

In de zijbalk van de werkindeling:

```
Werkindeling
├── ✅ What-if: "4-korfbal bij geel" (beslisbaar)
├── ⏳ What-if: "Extra 3e senioren" (2 open vragen)
├── 🔴 What-if: "Talent doorschuiven" (geblokkeerd door "Extra 3e")
└── [+ Nieuwe what-if]
```

Alleen één what-if tegelijk actief om verwarring te voorkomen.

---

## 3. Acties en vragen

### 3.1 Gekoppeld aan what-ifs

Een what-if is niet altijd direct beslisbaar. Er kunnen open vragen aan hangen die eerst beantwoord moeten worden.

Vanuit een what-if kun je direct een actie/vraag aanmaken:
- **Beschrijving**: wat moet er uitgezocht worden
- **Toegewezen aan**: wie gaat dit doen
- **Deadline**: wanneer moet het antwoord er zijn

### 3.2 What-if status

De status van een what-if hangt af van zijn acties:

| Status | Betekenis | Icoon |
|---|---|---|
| **Beslisbaar** | Geen open acties, TC kan toepassen of verwerpen | ✅ |
| **Wacht op antwoorden** | Er staan nog acties open | ⏳ |
| **Geblokkeerd** | Hangt af van een andere what-if die nog niet besloten is | 🔴 |
| **Toegepast** | Wijzigingen zijn overgenomen in de werkindeling | ✓ (historie) |
| **Verworpen** | What-if is verworpen | ✗ (historie) |

### 3.3 Afhankelijkheden

What-ifs kunnen van elkaar afhangen. Voorbeeld: "Talent doorschuiven" heeft pas zin als je weet of die "extra 3e senioren" er komt.

- Bij aanmaken: optioneel "hangt af van: [andere what-if]"
- Afhankelijke what-if krijgt status "geblokkeerd" zolang parent niet besloten is
- Bij toepassen/verwerpen van parent: afhankelijke what-if wordt bijgewerkt of ongeldig verklaard

### 3.4 Relatie tot bestaand model

De bestaande Werkitem/Actiepunt modellen in Prisma hebben al: status, deadline, toewijzing, koppeling aan scenario's. Deze worden hergebruikt voor what-if acties.

---

## 4. Validatie

### 4.1 Drie validatielagen

Elke what-if (en de werkindeling zelf) wordt real-time gevalideerd:

| Laag | Bron | Voorbeeld |
|---|---|---|
| **KNKV-regels** | `rules/knkv-regels.md`, `lib/teamindeling/validatie/` | Max/min teamgrootte, leeftijdsgrenzen, geslachtsregels |
| **Blauwdruk-kaders** | `Blauwdruk.kaders` (JSON) | Aantal teams per categorie, teamgrootte-targets |
| **Pins** | Pin-tabel | "Speler X moet in U15-1", "Coach Y bij Senioren" |

### 4.2 Drie niveaus

| Niveau | Betekenis | Gedrag |
|---|---|---|
| 🔴 **Harde fout** | KNKV-regel of pin geschonden | Kan niet worden toegepast zonder oplossing |
| 🟡 **Afwijking** | Blauwdruk-kader wordt overschreden | Kan worden toegepast, vereist bewuste keuze + toelichting |
| ✅ **OK** | Alles binnen de lijnen | Geen actie nodig |

### 4.3 In het impact-panel

```
Validatie:
  🔴 Senioren 2: 9 spelers, minimum is 10 (KNKV)
  🟡 Blauwdruk zegt 2 seniorenteams, what-if maakt er 3
  🔴 Pin geschonden: "Klaas blijft in Senioren 2" — Klaas is verplaatst
  ✅ Geslachtsregels OK
  ✅ Leeftijdsgrenzen OK
```

### 4.4 Bij toepassen

Als er afwijkingen (🟡) zijn, moet de TC een toelichting geven. Dit wordt vastgelegd in het besluitenlog:

```
⚠️ Afwijking van blauwdruk:
  Blauwdruk: 2 seniorenteams → What-if: 3 seniorenteams
  Toelichting: [verplicht invulveld]
```

Bij harde fouten (🔴) kan er niet toegepast worden tot de fout is opgelost.

### 4.5 Bestaand validatie-systeem

Het huidige validatiesysteem (`lib/teamindeling/validatie/`) doet al KNKV-checks en zachte regels. Dit wordt uitgebreid met:
- Pin-validatie (controle of gepinde spelers/staf op hun plek staan)
- Blauwdruk-kader-validatie (aantal teams, teamgrootte-targets)
- Delta-validatie (vergelijk what-if met werkindeling)

---

## 5. Datamodel

### 5.1 Verhouding tot huidig model

| Huidig | Nieuw | Rol |
|---|---|---|
| Scenario (volledige indeling) | **Werkindeling** | Eén per seizoen, de waarheid |
| Scenario-kopie | **What-if** | Lichtgewicht, alleen gewijzigde teams |
| Concept | Vervalt als zichtbaar UI-concept | Was al bijna altijd "Standaard" |
| Versie | Blijft | Snapshots van de werkindeling |
| Team, TeamSpeler, SelectieGroep | Blijft | Ongewijzigd |
| Werkitem, Actiepunt | Hergebruikt | What-if acties/vragen |

### 5.2 Nieuw: WhatIf model

```prisma
model WhatIf {
  id                    String        @id @default(cuid())
  werkindelingId        String
  werkindeling          Scenario      @relation(fields: [werkindelingId], references: [id])

  vraag                 String        // "Wat als we een 3e senioren team maken?"
  toelichting           String?       // Eventuele context

  status                WhatIfStatus  // OPEN | WACHT_OP_ANTWOORDEN | BESLISBAAR | TOEGEPAST | VERWORPEN

  // Snapshot van werkindeling op moment van aanmaken
  basisVersieId         String
  basisVersie           Versie        @relation(fields: [basisVersieId], references: [id])

  // Afhankelijkheid
  afhankelijkVanId      String?
  afhankelijkVan        WhatIf?       @relation("WhatIfAfhankelijkheid", fields: [afhankelijkVanId], references: [id])
  afhankelijken         WhatIf[]      @relation("WhatIfAfhankelijkheid")

  // Bij toepassen
  toelichtingAfwijking  String?       // Waarom afgeweken van blauwdruk
  toegepastOp           DateTime?
  verworpenOp           DateTime?

  createdAt             DateTime      @default(now())
  updatedAt             DateTime      @updatedAt

  // Relations
  teams                 WhatIfTeam[]  // Gekopieerde/nieuwe teams
  acties                Werkitem[]    // Hergebruik bestaand model

  @@map("what_ifs")
}

enum WhatIfStatus {
  OPEN
  WACHT_OP_ANTWOORDEN
  BESLISBAAR
  TOEGEPAST
  VERWORPEN
}
```

### 5.3 Nieuw: WhatIfTeam model

```prisma
model WhatIfTeam {
  id            String    @id @default(cuid())
  whatIfId       String
  whatIf         WhatIf    @relation(fields: [whatIfId], references: [id], onDelete: Cascade)

  // Referentie naar origineel team (null als nieuw team)
  bronTeamId    String?
  bronTeam      Team?     @relation(fields: [bronTeamId], references: [id])

  // Team-data (kopie, bewerkbaar)
  naam          String
  categorie     TeamCategorie
  kleur         Kleur?
  teamType      TeamType?
  niveau        String?
  volgorde      Int

  // Relations
  spelers       WhatIfTeamSpeler[]
  staf          WhatIfTeamStaf[]

  @@map("what_if_teams")
}
```

### 5.4 Nieuw: WhatIfTeamSpeler en WhatIfTeamStaf

```prisma
model WhatIfTeamSpeler {
  id              String          @id @default(cuid())
  whatIfTeamId    String
  whatIfTeam      WhatIfTeam      @relation(fields: [whatIfTeamId], references: [id], onDelete: Cascade)
  spelerId        String
  speler          Speler          @relation(fields: [spelerId], references: [id])

  statusOverride  SpelerStatus?
  notitie         String?

  @@unique([whatIfTeamId, spelerId])
  @@map("what_if_team_spelers")
}

model WhatIfTeamStaf {
  id              String      @id @default(cuid())
  whatIfTeamId    String
  whatIfTeam      WhatIfTeam  @relation(fields: [whatIfTeamId], references: [id], onDelete: Cascade)
  stafId          String
  staf            Staf        @relation(fields: [stafId], references: [id])

  rol             String?

  @@unique([whatIfTeamId, stafId])
  @@map("what_if_team_staf")
}
```

### 5.5 Wijziging aan Scenario model

```prisma
model Scenario {
  // ... bestaande velden ...

  isWerkindeling  Boolean   @default(false)  // NIEUW: markeert de werkindeling

  // ... bestaande relaties ...
  whatIfs          WhatIf[]                   // NIEUW: what-ifs bij deze werkindeling
}
```

Constraint: per Blauwdruk mag er maximaal één Scenario met `isWerkindeling: true` zijn.

### 5.6 Wat er bij toepassen gebeurt

1. De gewijzigde WhatIfTeams **overschrijven** de corresponderende Teams in de werkindeling (op basis van `bronTeamId`)
2. Nieuwe WhatIfTeams (zonder `bronTeamId`) worden als nieuwe Teams **toegevoegd** aan de werkindeling
3. Er wordt een nieuwe Versie aangemaakt op de werkindeling (snapshot, undo-punt)
4. Afwijkingen worden vastgelegd als BlauwdrukBesluit
5. De WhatIf krijgt status TOEGEPAST met timestamp
6. De WhatIf-data blijft bewaard als historie (niet verwijderd)

### 5.7 Wat er bij verwerpen gebeurt

1. De WhatIf krijgt status VERWORPEN met timestamp
2. De WhatIf-data (teams, spelers) blijft bewaard voor historie — na 30 dagen automatisch opgeruimd
3. De werkindeling is ongewijzigd

---

## 6. Migratie van huidig model

### 6.1 Scenario's → Werkindeling

- Het scenario met status DEFINITIEF of het meest recente ACTIEF scenario wordt de werkindeling (`isWerkindeling: true`)
- Overige scenario's worden gearchiveerd
- De Concept-laag blijft in het datamodel bestaan maar wordt niet meer als zichtbaar concept in de UI getoond

### 6.2 Bestaande features

- **Wizard "nieuw scenario"** → wordt "start werkindeling vanuit blauwdruk" (zelfde logica, andere naam)
- **Scenario vergelijken** → vervangen door what-if vergelijking (what-if vs werkindeling)
- **Scenario kopiëren** → vervalt (what-ifs zijn de nieuwe manier)
- **Markeer definitief** → blijft, maar op de werkindeling (bevriest de indeling)
- **Snapshot-mechanisme** → hergebruikt voor undo bij toepassen

### 6.3 Backward compatibility

- Bestaande Scenario/Versie/Team data blijft intact
- De migratie is additief (nieuwe modellen + vlag op Scenario)
- Oude scenario's zijn nog raadpleegbaar via het archief

---

## 7. UX-vereisten

### 7.1 Desktop (TI Studio)

De what-if workflow leeft primair in de TI Studio (`/ti-studio/*`):
- Werkindeling als startscherm met drag & drop editor
- What-if starten vanuit teamselectie
- What-if editor als overlay met drie zones (actief/impact/ongeraakt)
- Impact-panel met real-time ketenoverzicht
- Zijbalk met open what-ifs en statussen

### 7.2 Mobile (Team-Indeling)

De mobile versie (`/teamindeling/*`) toont:
- Werkindeling read-only (carousel van teams)
- What-ifs bekijken (vraag, status, impact-samenvatting)
- Acties bij what-ifs inzien en beantwoorden
- Geen bewerking van what-ifs op mobile

### 7.3 Handshake met UX-team

Voordat implementatie begint:
1. UX-designer ontwerpt de what-if start-dialoog
2. UX-designer ontwerpt de drie-zone editor overlay
3. UX-designer ontwerpt het impact-panel
4. UX-designer ontwerpt de merge/toepassen flow met validatie
5. UX-designer ontwerpt de zijbalk met what-if lijst

---

## 8. Relatie tot signaal/actie-systeem

Het what-if model en het signaal/actie-systeem (spec `2026-03-28-teamindeling-scheiding-design.md`, sectie 8) vullen elkaar aan:

- **Signalen** ("speler X stopt") kunnen aanleiding zijn om een what-if te starten
- **Acties bij what-ifs** zijn een subset van het grotere actie-systeem
- Het Werkitem/Actiepunt model dient als basis voor beide

De exacte integratie (hoe een signaal automatisch een what-if-suggestie triggert) wordt in een latere fase uitgewerkt.

---

## 9. Implementatiefasen

### Fase 1: Werkindeling

- `isWerkindeling` vlag op Scenario
- Migratie bestaande scenario's
- UI: werkindeling als startscherm (vervangt scenario-lijst)
- Wizard aanpassen: "start werkindeling"

### Fase 2: What-if basis

- WhatIf, WhatIfTeam, WhatIfTeamSpeler, WhatIfTeamStaf modellen
- What-if aanmaken (teams selecteren, vraag formuleren)
- What-if bewerken (drag & drop in gekopieerde teams)
- Toepassen en verwerpen

### Fase 3: Impact en automatisch meenemen

- Impact-panel (real-time delta's)
- Automatisch meenemen van teams bij speler-verplaatsing
- Ketenoverzicht (domino-effect visualisatie)

### Fase 4: Validatie

- Pin-validatie in what-ifs
- Blauwdruk-kader-validatie
- Afwijking-toelichting bij toepassen
- Harde fouten blokkeren toepassen

### Fase 5: Acties en afhankelijkheden

- Acties/vragen koppelen aan what-ifs
- What-if status automatisch op basis van open acties
- Afhankelijkheden tussen what-ifs
- Blokkering-logica

---

## 10. Handshake-review gaps (op te lossen voor fase 2)

Drie gaps geïdentificeerd bij kruiscontrole van UX-spec, technisch ontwerp en domeinreview:

### Gap 1: Staf-impact in impact-panel
**Signaal**: korfbal-expert — stafbezetting is net zo vaak het breekpunt als spelerstekort.
**Huidige staat**: UX impact-panel toont alleen speler-delta's. Technisch ontwerp heeft `stafIn`/`stafUit` in `TeamDelta`.
**Oplossing**: UX impact-panel uitbreiden met staf-regel per team: "Senioren 3: 8 spelers, 0 trainers".

### Gap 2: Selectie-paren in start-dialoog
**Signaal**: korfbal-expert — U15-1/U15-2 zijn altijd een paar, what-if op één moet het andere automatisch meenemen.
**Huidige staat**: UX start-dialoog toont teams als individuele checkboxes.
**Oplossing**: Team-checkboxlijst groepeert selectieparen. Aanvinken van één vinkt automatisch het paar aan.

### Gap 3: Lege werkindeling toestand
**Signaal**: korfbal-expert — in maart/april is de werkindeling nog grotendeels leeg.
**Huidige staat**: UX onboarding-scherm is goed, maar editor met 0-5 teams niet beschreven.
**Oplossing**: UX-spec beschrijft hoe editor eruitziet met weinig teams (geen "alles is af" gevoel).

Geen van deze gaps blokkeert fase 1 (werkindeling). Ze worden opgelost voor fase 2 (what-if basis).

---

## Besluitenlog

| Besluit | Reden |
|---|---|
| Eén werkindeling i.p.v. meerdere scenario's | Past bij hoe TC werkt: één groeiende indeling, niet "scenario A vs B" |
| What-ifs als lichtgewicht branches | What-ifs zijn deelvragen, geen complete kopieën |
| Automatisch meenemen van teams | Domino-effect is net zo belangrijk als de directe wijziging |
| Acties/vragen bij what-ifs | Besluitvorming hangt af van antwoorden die eerst verzameld moeten worden |
| Validatie tegen blauwdruk en pins | TC moet weten of een what-if binnen de afgesproken kaders past |
| Toelichting verplicht bij afwijkingen | Afwijken van blauwdruk mag, maar moet bewust en vastgelegd |
| What-if afhankelijkheden | Sommige what-ifs hebben pas zin na besluit over een andere what-if |
| UI-taal: what-if, werkindeling, toepassen | Geen technisch jargon, aansluitend bij denkwijze van de TC |
