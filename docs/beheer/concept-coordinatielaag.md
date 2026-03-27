# Coördinatielaag — Ontwerp

App-generieke infrastructuur voor besluiten, actiepunten, mijlpalen en notificaties. Leeft als gedeelde module in de mono-app, zichtbaar vanuit elk domein.

## Visie

De coördinatielaag is het **bindweefsel** tussen alle domeinen. Het is geen aparte app maar een gedeelde laag die overal doorheen loopt — zoals een Slack-kanaal dat dwars door alle afdelingen snijdt.

In de mono-app structuur:

```
src/
├── lib/
│   └── coordinatie/           ← de coördinatielaag
│       ├── actions.ts         ← server actions (CRUD)
│       ├── types.ts           ← gedeelde types
│       └── routing.ts         ← zichtbaarheidslogica
├── components/
│   └── coordinatie/           ← gedeelde UI-componenten
│       ├── ActieLijst.tsx
│       ├── BesluitKaart.tsx
│       ├── MijlpalenTimeline.tsx
│       └── NotificatieBel.tsx
└── app/
    ├── page.tsx               ← PORTAAL: toont persoonlijke acties + voortgang
    ├── (teamindeling)/        ← consumeert coördinatielaag
    ├── (evaluatie)/           ← consumeert coördinatielaag
    └── (beheer)/              ← beheert coördinatielaag
```

---

## Vier entiteiten

### 1. Besluit

Een besluit is een **gestructureerde vraag met een antwoord** dat de vereniging bindt.

```
Besluit
  vraag: Text                    — de vraag
  antwoord: Text?                — vrije toelichting
  antwoordWaarde: Json?          — gestructureerd (getal, boolean, keuze)
  antwoordType: AntwoordType     — TEKST | GETAL | JA_NEE | KEUZE | GETAL_RANGE
  opties: String[]               — voor KEUZE: voorgedefinieerde opties
  status: BesluitStatus          — ONDUIDELIJK | VOORLOPIG | DEFINITIEF
  niveau: BesluitNiveau          — BESTUURLIJK | TECHNISCH
  context: String                — "teamindeling", "evaluatie", "staf", "jaarplanning"
  doelgroep: Doelgroep?          — routing naar relevante mensen
  seizoen: String                — "2026-2027"

  → actiepunten[]               — voortvloeiende acties
  → verwijzingen[]              — polymorphe links
```

**Verschil met huidig `BlauwdrukBesluit`**: niet meer gekoppeld aan Blauwdruk maar aan Seizoen. Context-veld vervangt de harde FK. De blauwdruk-standaardvragen worden besluiten met `context: "teamindeling"`.

### 2. Actiepunt

Een actiepunt is een **toewijsbare taak** met eigenaar en deadline.

```
Actiepunt
  beschrijving: Text
  status: ActiepuntStatus        — OPEN | BEZIG | AFGEROND
  deadline: Date?
  prioriteit: Prioriteit?        — HOOG | MIDDEL | LAAG
  context: String                — "teamindeling", "staf", "evaluatie", etc.
  seizoen: String

  toegewezenAan → Gebruiker      — wie moet dit doen
  auteur → Gebruiker              — wie maakte het aan

  → besluit?                     — optioneel: voortvloeiend uit besluit
  → verwijzingen[]              — polymorphe links
```

**Verschil met huidig `Actiepunt`**: niet meer gekoppeld aan Blauwdruk maar aan Seizoen + context. Toegewezen aan Gebruiker (niet User).

### 3. Mijlpaal

Een mijlpaal is een **processtap** in de seizoensplanning.

```
Mijlpaal
  label: String                  — "1e evaluatie", "Blauwdruk formuleren"
  datum: Date                    — target-datum
  volgorde: Int
  status: MijlpaalStatus        — TODO | ACTIEF | AFGEROND
  context: String?               — null = jaarplanning-breed, "teamindeling" = specifiek
  seizoen: String

  afgerondOp: DateTime?
  eigenaar → Gebruiker?          — wie is verantwoordelijk

  → actiepunten[]               — gekoppelde acties
```

**Verschil met huidig `Mijlpaal`**: status-enum (was: boolean afgerond), eigenaar, context-veld, koppeling aan actiepunten.

### 4. Notificatie

Een notificatie is een **signaal** naar een persoon dat actie vereist is.

```
Notificatie
  type: NotificatieType          — ACTIE_TOEGEWEZEN | DEADLINE_NADERT |
                                   STATUS_GEWIJZIGD | SIGNALERING | HERINNERING
  titel: String
  bericht: Text?
  gelezen: Boolean               — default false
  link: String?                  — deep-link naar relevant scherm

  ontvanger → Gebruiker
  seizoen: String

  → verwijzing?                  — wat triggerde deze notificatie
```

---

## Polymorphe verwijzingen

Elke entiteit kan verwijzen naar **alles** in het systeem. Eén verwijzingstabel:

```
Verwijzing
  bronType: String               — "besluit" | "actiepunt" | "mijlpaal" | "notificatie"
  bronId: String                 — ID van de bron-entiteit

  doelType: String               — "speler" | "staf" | "team" | "blauwdruk" |
                                   "scenario" | "evaluatieronde" | "gebruiker"
  doelId: String                 — ID van het doel

  label: String?                 — optionele beschrijving van de relatie
```

Voorbeelden:
- Besluit "4 seniorenteams" → verwijst naar: Blauwdruk (seizoen), Team Sen1/2/3/4
- Actiepunt "Bel trainer X" → verwijst naar: Staf (persoon), Team (Sen 4)
- Mijlpaal "Speler-inventarisatie" → verwijst naar: Blauwdruk
- Notificatie "Deadline nadert" → verwijst naar: Actiepunt, Mijlpaal

---

## Portaalfunctie

Het portaal (`ckvoranjewit.app/`) is het **startpunt** voor elke gebruiker. De coördinatielaag voedt het portaal:

```
PORTAAL (na inloggen)
│
├── MIJN ACTIES (persoonlijk)
│   "3 openstaande actiepunten"
│   - Bel trainer Sen 4 (deadline: 15 mei)
│   - Check status Lisa Bakker (gezien: GEEL)
│   - Evaluatie-formulier invullen U15
│
├── VOORTGANG (seizoen)
│   "Blauwdruk: 62% gereed"
│   [Kaders 8/15] [Spelers 142/180] [Staf 18/22]
│   Volgende mijlpaal: "TC-doelgroepoverleg" (22 april)
│
├── BESLUITEN (recent)
│   "2 nieuwe besluiten deze week"
│   - [DEFINITIEF] 4 seniorenteams
│   - [VOORLOPIG] U15 selectie: 2 teams
│
└── NOTIFICATIES
    "1 ongelezen"
    - Je bent toegewezen aan "Trainer Sen 4 benaderen"
```

De inhoud wordt gefilterd op basis van de rol en doelgroepen van de ingelogde gebruiker (bestaande `magBesluitZien()` en `magActiepuntZien()` logica).

---

## Relatie met bestaande modellen

### Migratiestrategie

De huidige `BlauwdrukBesluit` en `Actiepunt` modellen zijn al gebouwd en werken. Bij de mono-app consolidatie:

1. **BlauwdrukBesluit → Besluit**: voeg `context`, `seizoen`, `antwoordWaarde`, `antwoordType`, `opties` toe. Verwijder `blauwdrukId` FK (vervang door `seizoen` + `context: "teamindeling"`). De standaardvragen-seed vult `context: "teamindeling"`.

2. **Actiepunt**: voeg `context`, `seizoen`, `prioriteit` toe. Verwijder `blauwdrukId` FK. Behoud `werkitemId`, `besluitId`.

3. **Mijlpaal**: voeg `status` enum, `eigenaar`, `context` toe. Verwijder `afgerond` boolean (vervang door status). Behoud koppeling aan Seizoen.

4. **Notificatie + Verwijzing**: volledig nieuw.

### Werkitem → afschaffen?

Het huidige `Werkitem`-model overlapt sterk met `Besluit` + `Actiepunt`:
- Werkitem met type BESLUIT → wordt een Besluit
- Werkitem met type SPELER/TRAINER/STRATEGISCH → wordt een Actiepunt met context
- Werkitem-status (OPEN→OPGELOST) → Actiepunt-status of Besluit-status

**Voorstel**: Werkitem wordt op termijn uitgefaseerd. De coördinatielaag vervangt het. Maar dit is niet urgent — het kan naast elkaar bestaan tijdens de transitie.

---

## Zichtbaarheid per domein

Elk domein in de mono-app ziet een **gefilterde view** van de coördinatielaag:

| Route | Ziet besluiten met context | Ziet acties met context |
|---|---|---|
| `/` (portaal) | Alle (gefilterd op rol) | Eigen toegewezen |
| `/teamindeling/blauwdruk` | `teamindeling` | `teamindeling` + eigen |
| `/evaluatie/` | `evaluatie` | `evaluatie` + eigen |
| `/beheer/jaarplanning` | Alle | Alle |
| `/beheer/staf` | `staf` | `staf` + eigen |

De server actions accepteren een `context`-filter:
```typescript
getBesluiten({ seizoen: "2026-2027", context: "teamindeling" })
getActiepunten({ seizoen: "2026-2027", toegewezenAanId: userId })
getMijlpalen({ seizoen: "2026-2027" }) // altijd alles (jaarplanning-breed)
getNotificaties({ ontvangerId: userId, gelezen: false })
```

---

## Implementatievolgorde

| Stap | Wat | Wanneer |
|---|---|---|
| 1 | Ontwerp vastleggen (dit document) | Nu |
| 2 | Mono-app consolidatie (apart plan) | Eerst |
| 3 | Besluit-model verbreden (context, antwoordType) | Na consolidatie |
| 4 | Actiepunt-model verbreden (context, seizoen) | Na consolidatie |
| 5 | Mijlpaal-model uitbreiden (status, eigenaar) | Na consolidatie |
| 6 | Notificatie + Verwijzing modellen | Na stap 3-5 |
| 7 | Portaal-pagina met persoonlijke view | Na stap 6 |
| 8 | Werkitem uitfaseren | Op termijn |

**Kritisch pad**: de mono-app consolidatie moet eerst. De coördinatielaag is pas zinvol als alles in één app zit — anders heb je weer cross-app communicatie nodig.
