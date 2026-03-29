# Design: Daisy — AI-commissielid van c.k.v. Oranje Wit

**Datum**: 2026-03-29
**Status**: Ontwerp, ter review
**Auteur**: Product-team (brainstorm sessie Antjan + Claude)
**Scope**: AI-architectuur, chat-interface, plugin-systeem, geheugen, token-beheer, multi-user

---

## Samenvatting

### Maak kennis met Daisy

**Daisy** — *Doet Alle Irritante Shit, Yo!* — is het 4e lid van de kern-TC van c.k.v. Oranje Wit.

| Lid | Rol |
|---|---|
| **Antjan Laban** | Voorzitter, seizoensplanning, teamindeling, technologie |
| **Merel van Gurp** | Communicatie, evenementen, KT-cursussen |
| **Thomas Isarin** | Operationeel, trainingsschema |
| **Daisy** | Procescoördinatie, data-analyse, geheugen, regelwerk |

Daisy is een AI-commissielid dat via chat samenwerkt met de TC en op termijn alle gebruikers van het platform. Ze faciliteert, coördineert, stuurt, prioriteert, alarmeert en begeleidt — het mensenwerk (gevoel, observaties, besluitvorming) blijft bij de mensen.

Ze is er altijd, klaagt nooit, vergeet niets, en vindt administratie oprecht leuk.

### Kernprincipes

- **Chat als interface** — gebruikers praten met Daisy in natuurlijke taal
- **Plugins als capabilities** — elke actie is een geregistreerde plugin met tools, permissies en context
- **Clearance-overerving** — Daisy kan nooit meer dan de ingelogde gebruiker zelf
- **Drie actieniveaus** — autonoom, bevestiging, of advies per tool
- **Drielaags geheugen** — sessie, seizoen, vereniging (elk seizoen slimmer)
- **Model-agnostisch** — via Vercel AI SDK, start met Gemini, wissel als nodig
- **Gratis tier** — token-optimalisatie zodat de free tier van Gemini volstaat

### Wat Daisy NIET is

- Geen vervanging van de bestaande domein-apps (Monitor, Team-Indeling, Evaluatie, etc.)
- Geen autonome beslisser — de TC beslist altijd over teamindeling, evaluatie, beleid
- Geen chatbot voor externe gebruikers (ouders, leden) — alleen voor interne rollen

---

## 1. Positie in het platform

Daisy is geen losstaande feature maar het **zenuwstelsel** van het platform. Elke domein-app blijft bestaan als gestructureerde UI. Daisy is de laag die ze verbindt, aanstuurt en begeleidt.

### Architectuuroverzicht

```
┌──────────────────────────────────────────────────────────┐
│                  c.k.v. Oranje Wit Platform               │
│                                                           │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Monitor  │ │Team-Indel.│ │Evaluatie │ │ Scouting │   │
│  │dashboard │ │werkindel. │ │rondes    │ │rapporten │   │
│  │signalen  │ │what-ifs   │ │formulier │ │challenges│   │
│  └────┬─────┘ └─────┬─────┘ └────┬─────┘ └────┬─────┘   │
│       │             │            │             │          │
│  ═════╪═════════════╪════════════╪═════════════╪════════  │
│       │      Daisy (AI-laag)      │          │
│       │                                        │          │
│       │  Chat ◄──► Orchestrator ◄──► Plugins   │          │
│       │                │                       │          │
│       │           ┌────┴────┐                  │          │
│       │           │ Geheugen │                  │          │
│       │           └─────────┘                  │          │
│  ═════╪════════════════════════════════════════╪════════  │
│       │         Database (PostgreSQL)          │          │
│       │         61+ modellen, alle data        │          │
└───────┴────────────────────────────────────────┴──────────┘
```

### Waar leeft de chat?

| Locatie | Gedrag | Gebruiker |
|---|---|---|
| **Beheer** (`/beheer/`) | Vast zijpaneel, altijd bereikbaar. Het "kantoor" van Daisy. | TC-kern |
| **Domein-apps** | Contextgevoelige minivariant. In TI: "Wat is het risico als ik Lisa verplaats?" In Evaluatie: "Hoeveel formulieren zijn binnen?" | TC, Co |
| **Portaal** (`/`) | Begroeting met agenda: wat staat er vandaag/deze week op de planning. | Alle rollen |

### Relatie tot bestaande specs

| Spec | Relatie |
|---|---|
| **What-if model** (`2026-03-29-what-if-model-design.md`) | Daisy kan what-ifs voorstellen, voorbereiden en impact berekenen. De TC beslist via de what-if UI. |
| **Fundament-design** (`2026-03-29-fundament-design.md`) | De seizoenscyclus is de ruggengraat van Daisy. Dezelfde kennislaag (`docs/kennis/`). |
| **TI-scheiding** (`2026-03-28-teamindeling-scheiding-design.md`) | Desktop = bewerken met AI-assistentie. Mobile = inzien met AI-samenvatting. |

---

## 2. Technische architectuur

### Stack

| Component | Technologie | Waarom |
|---|---|---|
| **Client** | Vercel AI SDK `useChat()` + React 19 | Model-agnostisch, streaming out-of-the-box, React hooks |
| **API** | Next.js 16 route handler (`/api/ai/chat`) | SSE streaming, server-side auth, past in bestaand patroon |
| **LLM** | Gemini 2.0 Flash (via `@ai-sdk/google`) | Snel, goedkoop, lang contextvenster, gratis tier |
| **Orchestratie** | Vercel AI SDK `streamText()` + function calling | Tools als functies, streaming, geen extra framework nodig |
| **Auth** | Bestaand clearance-systeem (`guardAuth()`) | Hergebruik, geen nieuwe auth-laag |
| **Opslag** | PostgreSQL (bestaande Railway DB) | Gesprekken, geheugen, plugin-registry |

### Verzoek-flow

```
1. Client: POST /api/ai/chat
   { message, context: { route, selectie, seizoen } }

2. Server: guardAuth() → sessie + clearance + doelgroepen

3. Orchestrator bouwt context:
   a. Systeem-prompt (rol, seizoensperiode, regels)
   b. Geheugen (relevante items uit AiGeheugen)
   c. Beschikbare tools (gefilterd op clearance + rol)
   d. Gesprekshistorie (sliding window)
   e. Route-context (waar zit de gebruiker in de app)

4. streamText({ model: google("gemini-2.0-flash"), ... })
   → Gemini kiest tool of antwoordt direct
   → Bij tool: check actieNiveau
     - autonoom → voer uit, meld resultaat
     - bevestiging → toon actie-kaart, wacht op akkoord
     - advies → presenteer analyse, mens beslist

5. Stream response naar client (SSE)
   → Woord-voor-woord rendering in ChatPanel
```

### Eén endpoint, alle interactie

Alle AI-interactie loopt via `/api/ai/chat`. De orchestrator routeert intern naar de juiste plugin op basis van intent. Dit houdt de client simpel en de server krachtig.

```typescript
// apps/web/src/app/api/ai/chat/route.ts (vereenvoudigd)
import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { guardAuth } from "@oranje-wit/auth/checks";
import { buildSystemPrompt } from "@/lib/ai/prompt";
import { getTools } from "@/lib/ai/plugins";
import { getMemory } from "@/lib/ai/memory";

export async function POST(request: Request) {
  const auth = await guardAuth();
  if (!auth.ok) return auth.response;

  const { messages, context } = await request.json();
  const { session } = auth;

  const systemPrompt = await buildSystemPrompt(session, context);
  const tools = await getTools(session.user.clearance, session.user.doelgroepen);
  const memory = await getMemory(context.seizoen, tools);

  const result = streamText({
    model: google("gemini-2.0-flash"),
    system: [systemPrompt, memory].join("\n\n"),
    messages,
    tools,
    maxSteps: 5, // max tool-calls per beurt
  });

  return result.toDataStreamResponse();
}
```

---

## 3. Plugin-systeem

### Wat is een plugin?

Een plugin is een bundel van **tools + kennis + permissies**. Het is de eenheid waarmee Daisy groeit.

### Plugin-definitie

```typescript
interface AiPlugin {
  id: string;                     // "evaluatie"
  naam: string;                   // "Evaluatie"
  beschrijving: string;           // Wanneer deze plugin inzetten (voor de orchestrator)
  versie: string;                 // "1.0.0"
  actief: boolean;                // Kan uitgeschakeld worden

  // Autorisatie
  beschikbaarVoor: Rol[];         // ["tc-kern", "coordinator"]
  minClearance: Clearance;        // 1

  // Context die de plugin meekrijgt aan de LLM
  contextBronnen: string[];       // ["rules/beheer.md#evaluatie", "seizoenscyclus"]

  // Tools
  tools: AiTool[];
}

interface AiTool {
  id: string;                     // "evaluatie.maakRonde"
  naam: string;                   // "Evaluatieronde aanmaken"
  beschrijving: string;           // Wat doet het (Gemini leest dit)

  // Permissies
  actieNiveau: ActieNiveau;       // "autonoom" | "bevestiging" | "advies"
  minClearance: Clearance;        // 2
  vereistRol?: Rol;               // optioneel: alleen voor specifieke rol

  // Technisch
  handler: string;                // "lib/ai/tools/evaluatie/maak-ronde"
  parameters: ZodSchema;          // Zod schema voor input-validatie

  // Veiligheid
  schrijft: boolean;              // true = muteert data
  omkeerbaar: boolean;            // false = kan niet ongedaan worden
}

type ActieNiveau = "autonoom" | "bevestiging" | "advies";
type Rol = "tc-kern" | "coordinator" | "trainer" | "scout";
```

### Actieniveaus

| Niveau | Gedrag | Wanneer |
|---|---|---|
| **Autonoom** | Agent voert uit en meldt resultaat | Read-only acties, berekeningen, opzoeken |
| **Bevestiging** | Agent bereidt voor, toont actie-kaart, wacht op akkoord | Schrijf-acties die omkeerbaar zijn |
| **Advies** | Agent analyseert en presenteert opties, mens beslist | Beslissingen met impact (teamindeling, beleid) |

De regel: **hoe groter de impact, hoe meer menselijke betrokkenheid**.

### Core plugins

#### Fase 1: Informatie (read-only)

| Plugin | Tools | Min. clearance | Voorbeeld |
|---|---|---|---|
| **planning** | `checkDeadlines`, `volgendeStappen`, `weekOverzicht`, `mijlpalenStatus` | 0 | "Wat staat er deze week aan?" |
| **monitor-lezen** | `ledenOverzicht`, `retentieRisico`, `categorieStatus`, `teamBezetting` | 1 | "Hoeveel leden bij Geel?" |
| **teamindeling-lezen** | `teamOverzicht`, `spelerInfo`, `validatieStatus`, `werkindelingStatus` | 1 | "Wie zit er in U15-1?" |

#### Fase 2: Actie (read-write)

| Plugin | Tools | Actieniveau | Voorbeeld |
|---|---|---|---|
| **evaluatie** | `maakRonde` (bevestiging), `verstuurUitnodiging` (bevestiging), `bekijkResultaten` (autonoom), `analyseVoortgang` (autonoom) | Mix | "Zet de evaluatie op voor U15" |
| **teamindeling-schrijven** | `verplaatsSpeler` (bevestiging), `maakWhatIf` (bevestiging), `pasTeamAan` (bevestiging) | Bevestiging | "Verplaats Lisa naar U17-1" |
| **communicatie** | `schrijfBericht` (bevestiging), `notificeerGroep` (bevestiging), `planHerinnering` (autonoom) | Mix | "Herinner coördinatoren aan inventarisatie" |

#### Fase 3: Proactief

| Plugin | Tools | Trigger | Voorbeeld |
|---|---|---|---|
| **seizoensbewaking** | `checkKNKVDeadlines`, `signaleerMijlpaal`, `suggereerActie` | Cron (dagelijks) | "Over 3 dagen: KNKV-deadline zaalindeling" |
| **signalering** | `retentieAlert`, `bezettingsAlert`, `stafAlert` | Data-driven | "3 opzeggers bij U13, wil je een what-if?" |

#### Fase 4: Multi-user

| Plugin | Voor wie | Voorbeeld |
|---|---|---|
| **inventarisatie** | Coördinator | "Vul de inventarisatie in voor D1 en D2" |
| **taken** | Alle rollen | "Wat staat er nog open voor mij?" |
| **berichten** | Alle rollen | "Stuur bericht naar coördinator Geel" |
| **scouting** | Scout | "Vergelijk deze twee spelers op USS" |
| **roostering** | TC | "Maak trainingsschema voor zaal" |

### Plugin-registratie

Plugins worden geregistreerd in code (`lib/ai/plugins/`), niet in de database. Dit houdt deployment simpel en tools testbaar. De plugin-definitie (metadata, permissies) staat in een registry-bestand; de tool-handlers zijn TypeScript functies.

```
lib/ai/
├── prompt.ts              # Systeem-prompt builder
├── memory.ts              # Geheugen-selectie
├── plugins/
│   ├── registry.ts        # Plugin-registry: welke plugins, welke tools
│   ├── planning/
│   │   ├── index.ts       # Plugin-definitie
│   │   ├── check-deadlines.ts
│   │   └── week-overzicht.ts
│   ├── evaluatie/
│   │   ├── index.ts
│   │   ├── maak-ronde.ts
│   │   └── verstuur-uitnodiging.ts
│   ├── teamindeling-lezen/
│   │   └── ...
│   └── ...
└── components/
    └── ... (zie sectie 7)
```

---

## 4. Geheugenmodel

### Drie lagen

| Laag | Scope | Levensduur | Voorbeeld |
|---|---|---|---|
| **Gespreksgeheugen** | Eén chat-sessie | Sessie (+ optioneel bewaard) | "Je vroeg net over U15-1" |
| **Seizoensgeheugen** | Eén seizoen | Actief seizoen, daarna archief | "TC besloot 3 seniorenteams (14 mrt)" |
| **Verenigingsgeheugen** | Alle seizoenen | Permanent (gevalideerd door TC) | "Evaluatie-respons U15 is altijd laag" |

### Datamodel

```prisma
model AiGesprek {
  id          String        @id @default(cuid())
  userId      String
  user        Gebruiker     @relation(fields: [userId], references: [id])
  seizoen     String        // "2025-2026"
  titel       String?       // Auto-gegenereerd of door gebruiker
  context     Json?         // { route, selectie, plugin }
  status      GesprekStatus @default(ACTIEF)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  berichten   AiBericht[]

  @@map("ai_gesprekken")
}

model AiBericht {
  id          String      @id @default(cuid())
  gesprekId   String
  gesprek     AiGesprek   @relation(fields: [gesprekId], references: [id], onDelete: Cascade)
  rol         BerichtRol  // GEBRUIKER | ASSISTENT | SYSTEEM | TOOL
  inhoud      String
  toolCalls   Json?       // Welke tools zijn aangeroepen + resultaten
  metadata    Json?       // { tokens, model, duurMs }
  createdAt   DateTime    @default(now())

  @@map("ai_berichten")
}

model AiGeheugen {
  id            String       @id @default(cuid())
  seizoen       String?      // null = verenigingsbreed (permanent)
  categorie     GeheugenType // BESLUIT | OBSERVATIE | VOORKEUR | SIGNAAL | LES
  inhoud        String
  bron          String       // "chat:antjan:2026-03-15" of "evaluatie:U15"
  relevantVoor  String[]     // ["teamindeling", "staf", "evaluatie"]
  verloopt      DateTime?    // null = geen vervaldatum
  bevestigd     Boolean      @default(false) // TC heeft gevalideerd
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  @@map("ai_geheugen")
}

enum GesprekStatus {
  ACTIEF
  GEARCHIVEERD
}

enum BerichtRol {
  GEBRUIKER
  ASSISTENT
  SYSTEEM
  TOOL
}

enum GeheugenType {
  BESLUIT      // "TC besloot 3 seniorenteams"
  OBSERVATIE   // "Respons evaluatie U15 was 60%"
  VOORKEUR     // "Coach Y heeft voorkeur voor groep Z"
  SIGNAAL      // "Ouders speler X ontevreden over plaatsing"
  LES          // "Seizoenssamenvatting: evaluatie eerder starten"
}
```

### Geheugen-levenscyclus

```
Tijdens seizoen:
  Chat → Agent herkent besluiten, observaties, voorkeuren
       → Slaat op in AiGeheugen met seizoen + categorie
       → Leest relevante geheugens bij elke nieuwe vraag
       → Agent: "Ik onthoud dat coach Jansen stopt na dit seizoen."

Einde seizoen:
  Agent genereert seizoenssamenvatting
       → Lijst van lessen, patronen, aanbevelingen
       → TC valideert: "Klopt dit? Missen we iets?"
       → Bevestigde lessen → categorie LES, seizoen null (permanent)
       → Seizoensgeheugens → gearchiveerd (leesbaar, niet actief)

Nieuw seizoen:
  Agent start met:
       → Verenigingsgeheugen (alle bevestigde LES-items)
       → Seizoenscyclus (wat staat er aan te komen)
       → Leeg seizoensgeheugen (groeit weer mee)
```

### Hoe geheugen de agent elk seizoen slimmer maakt

| Seizoen | Gedrag |
|---|---|
| **1 (nu)** | "Zet de evaluatie op voor U15." → Agent doet het. Leert: respons was 60%, 3 herinneringen nodig. |
| **2** | "Zet de evaluatie op voor U15." → Agent: "Vorig jaar had U15 60% respons. Zal ik de deadline 5 dagen eerder zetten en meteen een herinnering inplannen?" |
| **3** | Agent proactief in maart: "Het is tijd voor de U15-evaluatie. Op basis van 2 seizoenen stel ik voor: deadline 10 april, automatische herinnering op dag 5 en 8." |

---

## 5. Autorisatie

### Twee assen

| As | Vraag | Mechanisme |
|---|---|---|
| **Capability** | Wat *kan* de agent? | Plugin-registry: alleen geregistreerde tools bestaan |
| **Authorization** | Wat *mag* de agent voor *deze* gebruiker? | Clearance-overerving + rol-filter + doelgroepen-scope |

### De agent erft de rechten van de ingelogde gebruiker

Daisy kan **nooit meer** dan wat de gebruiker zelf zou kunnen in de app. Dit is geen extra autorisatie-laag — het is dezelfde laag die de rest van het platform al gebruikt.

| Gebruiker | Clearance | Rol | Wat de agent mag |
|---|---|---|---|
| **Antjan** | 3 | TC-kern | Alle plugins, alle tools, alle data |
| **Merel** | 3 | TC-kern | Alle plugins, alle tools, alle data |
| **Barbara** | 1 | Coördinator D/E/F | Lees-plugins, inventarisatie, alleen D/E/F teams |
| **Coach Jansen** | 0 | Trainer | Taken, eigen team bekijken, evaluatie invullen |
| **Scout** | 1 | Scout | Scouting-plugin, spelers opzoeken |

### Tool-filtering

Bij elk verzoek filtert de orchestrator de beschikbare tools:

```typescript
function getTools(clearance: Clearance, doelgroepen: string[]): Tool[] {
  return pluginRegistry
    .filter(plugin => plugin.actief)
    .filter(plugin => clearance >= plugin.minClearance)
    .flatMap(plugin => plugin.tools)
    .filter(tool => clearance >= tool.minClearance)
    .map(tool => ({
      ...tool,
      // Scope data-toegang op doelgroepen
      scopeFilter: doelgroepen.length > 0 ? doelgroepen : undefined,
    }));
}
```

### Drie actieniveaus

Niet alles wat de agent *mag*, moet hij automatisch doen:

| Niveau | Gedrag | Voorbeeld |
|---|---|---|
| **Autonoom** | Voert uit, meldt resultaat | "Er zijn 42 leden bij Geel." |
| **Bevestiging** | Bereidt voor, toont actie-kaart, wacht op akkoord | "Ik heb de evaluatieronde klaargezet. [Klaarzetten] [Aanpassen]" |
| **Advies** | Analyseert, presenteert opties, mens beslist | "Op basis van retentiecijfers adviseer ik om met U15 te beginnen." |

De regel: **hoe groter de impact, hoe meer menselijke betrokkenheid.**

---

## 6. Multi-user architectuur

### Persoonlijke Daisy per gebruiker

Elke gebruiker heeft een eigen chat-instantie. De agent weet wie je bent en past zijn gedrag aan:

```
┌─ Antjan (TC-kern, clearance 3) ──────────────────────────┐
│  Alle plugins. Proactieve seizoensbriefing. What-if       │
│  suggesties. Volledige data-toegang.                      │
└───────────────────────────────────────────────────────────┘

┌─ Barbara (Coördinator D/E/F, clearance 1) ───────────────┐
│  Monitor-lezen (alleen D/E/F), inventarisatie, taken.     │
│  "Hoe staat het met mijn teams?"                          │
└───────────────────────────────────────────────────────────┘

┌─ Coach Jansen (Trainer, clearance 0) ────────────────────┐
│  Taken, eigen team. Evaluatie invullen.                   │
│  "Wie mist er morgen bij de training?"                    │
└───────────────────────────────────────────────────────────┘
```

### Inter-user communicatie (toekomst, fase 4)

Daisy wordt een communicatiekanaal:

```
TC (via agent): "Herinner alle coördinatoren aan de inventarisatie"
       │
       ▼
Agent creëert taken per coördinator
       │
       ▼
Coördinator opent app → "Je hebt een verzoek van de TC:
  inventarisatie invullen voor D1 en D2. Deadline: 20 april.
  Wil je beginnen?"
       │
       ▼
Coördinator: "Ja" → agent begeleidt het invullen
       │
       ▼
Agent meldt aan TC: "3 van 8 inventarisaties binnen.
  Barbara (D/E/F) en Marco (A) zijn klaar."
```

### Taken-systeem

De agent beheert taken, de mens voert uit:

```
AiTaak (ai_taken)
├── id
├── aanmakerUserId      // Wie heeft het geïnitieerd (of "systeem")
├── uitvoerderUserId    // Wie moet het doen
├── plugin              // Welke plugin heeft dit aangemaakt
├── beschrijving        // "Inventarisatie invullen voor D1"
├── status              // OPEN | BEZIG | AFGEROND | VERLOPEN
├── deadline            // 2026-04-20
├── resultaat           // JSON met uitkomst
└── herinneringen       // [{datum, verstuurd}]
```

Dit model maakt de communicatieketen (TC → Co → Trainer → Team) digitaal en betrouwbaar — precies het kwetsbare punt dat in `tc-organisatie.md` wordt gesignaleerd.

---

## 7. Chat UI

### Design-principes

- **Dark-first** — consistent met ons design system
- **Streaming** — woord-voor-woord rendering, voelt levend
- **Actie-kaarten** — tool-resultaten en bevestigingsverzoeken als embedded cards
- **Contextgevoelig** — suggesties passen bij waar je bent in de app
- **Niet-opdringerig** — paneel is inklapbaar, nooit in de weg

### Wireframe

```
┌─ ChatPanel (zijpaneel, 380px) ────────────────────────────┐
│ ┌─ Header ──────────────────────────────────────────────┐ │
│ │  🟠 Daisy          Oogsten & Zaaien  [×] │ │
│ └───────────────────────────────────────────────────────┘ │
│                                                            │
│ ┌─ Berichten (scrollable) ─────────────────────────────┐  │
│ │                                                       │  │
│ │  🤖 Goedemiddag Antjan. Er staan 3 dingen op de      │  │
│ │     agenda deze week:                                 │  │
│ │     • KNKV-deadline zaalindeling (woensdag)           │  │
│ │     • Evaluatie U15 — 2 van 4 formulieren binnen      │  │
│ │     • TC-vergadering dinsdag 20:00                    │  │
│ │                                                       │  │
│ │  👤 Zet de evaluatie klaar voor Geel                  │  │
│ │                                                       │  │
│ │  🤖 Ik zet een evaluatieronde op voor Geel            │  │
│ │     (3 teams, 6 trainers, 42 spelers).                │  │
│ │                                                       │  │
│ │     ┌─ Actie ─────────────────────────────────┐      │  │
│ │     │  📋 Evaluatieronde Geel Q3              │      │  │
│ │     │  Teams: Geel-1, Geel-2, Geel-3          │      │  │
│ │     │  Trainers: 6 uitnodigingen               │      │  │
│ ���     │  Deadline: 15 april                      │      │  │
│ │     │                                          │      │  │
│ │     │  [✓ Klaarzetten]  [✎ Aanpassen]         │      │  │
│ │     └──────────────────────────────────────────┘      │  │
│ │                                                       │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                            │
│ ┌─ Suggesties ─────────────────────────────────────────┐  │
│ │  [Wat staat er deze week?]  [KNKV-deadlines]         │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                            │
│ ┌─ Input ──────────────────────────────────────────────┐  │
│ │  💬 Vraag Daisy...            [Send] │  │
│ └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### UI-componenten

Alle componenten komen in `packages/ui/src/chat/`:

| Component | Functie |
|---|---|
| `ChatPanel` | Het paneel zelf, met header, berichten, input |
| `ChatBericht` | Enkel bericht (gebruiker/assistent/systeem/tool) |
| `ActieKaart` | Bevestigingskaart voor tool-acties met knoppen |
| `SuggestieChips` | Horizontaal scrollbare contextgevoelige suggesties |
| `ChatInput` | Inputveld met send-knop, auto-resize |
| `StreamingTekst` | Woord-voor-woord rendering met cursor |
| `GesprekSwitcher` | Eerdere gesprekken terugvinden |
| `ChatTrigger` | FAB of knop om het paneel te openen |

### Visuele elementen

| Element | Implementatie |
|---|---|
| **Streaming tekst** | Framer Motion fade-in per woord, cursor-animatie |
| **Actie-kaarten** | Dark card styling (`surface-2`), primaire/secundaire knoppen |
| **Suggestie-chips** | Pill-styling, horizontaal scrollbaar, `surface-1` achtergrond |
| **Status-indicator** | Pulserende dot in header (groen = klaar, oranje = bezig) |
| **Markdown** | Bestaande prose-styling (lijsten, tabellen, bold, code) |
| **Typografie** | `text-sm` voor berichten, `text-xs` voor metadata |

### Responsive gedrag

| Viewport | Gedrag |
|---|---|
| **Desktop** (>1024px) | Zijpaneel rechts, 380px, naast de content |
| **Tablet** (768-1024px) | Overlay panel, slide-in vanuit rechts |
| **Mobile** (<768px) | Volledig scherm, bottom-sheet stijl met pull-down |

---

## 8. Token-beheer en kosten

### Gemini 2.0 Flash — Free Tier

| Limiet | Waarde | Betekenis voor ons |
|---|---|---|
| Requests per minuut | 15 RPM | Max 15 berichten/min (ruim voor TC van 8) |
| Tokens per minuut | 1M TPM | ~250 pagina's context per minuut |
| Requests per dag | 1.500 RPD | ~187 berichten per TC-lid per dag |
| Prijs | **Gratis** | Binnen free tier geen kosten |

Dit is ruim voldoende voor fase 1-3. Bij fase 4 (alle rollen) evalueren we of betaald nodig is.

### Token-budget per verzoek

| Component | Tokens | Strategie |
|---|---|---|
| Systeem-prompt | ~2.000 | Vast, compact, geoptimaliseerd |
| Geheugen-context | ~1.000 | Max 10 relevante items |
| Gesprekscontext | ~2.000 | Sliding window (10 berichten) |
| Route-context | ~500 | Alleen als relevant |
| **Input totaal** | **~5.500** | Ruim binnen limiet |
| **Output** | ~1.000 | Bondige antwoorden |
| **Totaal per verzoek** | **~6.500** | ~150 verzoeken per 1M tokens |

### Zeven besparingstechnieken

| # | Techniek | Besparing | Hoe |
|---|---|---|---|
| 1 | **Compacte systeem-prompt** | -60% | Regels inline samenvatten, geen volledige docs meesturen |
| 2 | **Sliding window** | -70% | Oude berichten samenvatten na 10 berichten |
| 3 | **Geheugen-selectie** | -80% | Alleen relevante geheugens op basis van intent + plugin |
| 4 | **Tool-resultaat trimmen** | -50% | Database-resultaten comprimeren tot wat de agent nodig heeft |
| 5 | **Gesprek-samenvatting** | -40% | Na 10 berichten: samenvat eerste 8 in 2 zinnen, cached |
| 6 | **Response-cache** | -90% | Veelgevraagde antwoorden cachen (5 min TTL) |
| 7 | **Flash default** | -75% kosten | Gemini Flash voor alles; Pro alleen bij complexe analyse |

### Rate limiting

```typescript
const RATE_LIMITS: Record<Rol, { perUur: number; perDag: number }> = {
  "tc-kern":      { perUur: 60,  perDag: 500 },
  "coordinator":  { perUur: 30,  perDag: 200 },
  "trainer":      { perUur: 15,  perDag: 100 },
  "scout":        { perUur: 15,  perDag: 100 },
};
```

### Monitoring (Beheer → Systeem)

- Tokens per dag/week/maand (grafiek)
- Verzoeken per gebruiker
- Gemiddelde tokens per verzoek
- Alert bij 80% van free tier limiet
- Automatische throttle bij 90%

### Kostenstrategie per fase

| Fase | Gebruikers | Geschatte verzoeken/dag | Tier |
|---|---|---|---|
| 1 | 3 (TC-kern) | ~50 | Free |
| 2 | 3 (TC-kern) | ~100 | Free |
| 3 | 3 + systeem (cron) | ~150 | Free |
| 4 | ~20 (alle rollen) | ~400 | Free of Tier 1 ($0,01/1K tokens) |

---

## 9. Groeimodel

### Fasering

```
        ┌──────────────────────────┐
        │  FASE 4: Platform-breed   │
        │  Alle rollen, berichten,  │
        │  taken, communicatie       │
    ┌───┴────────────���─────────┐   │
    │  FASE 3: Proactief        │   │
    │  Cron, seizoensbewaking,  │   │
    │  signalen → suggesties     │   │
┌───┴──────────────────────┐   │   │
│  FASE 2: Actie + Geheugen │   │   │
│  Schrijf-plugins, memory, │   │   │
│  bevestigingsflow          │   │   │
┌──────────────────────────┐   │   │   │
│  FASE 1: Fundament        │   │   │   │
│  Chat, 3 lees-plugins,    │   │   │   │
│  streaming, auth           │   │   │   │
└──────────────────────────┘   │   │   │
```

### Fase 1: Fundament

**Doel:** TC-kern kan chatten met Daisy en informatie opvragen.

**Wat:**
- Vercel AI SDK + `@ai-sdk/google` (Gemini 2.0 Flash)
- `/api/ai/chat` streaming endpoint met `guardAuth()`
- ChatPanel component in `packages/ui/src/chat/`
- Plugin-registry met 3 read-only plugins (planning, monitor-lezen, teamindeling-lezen)
- Gesprekgeschiedenis (AiGesprek + AiBericht in database)
- Clearance-filter op tools
- ChatPanel in Beheer-app als zijpaneel

**Resultaat:** "Hoeveel leden heeft Geel?", "Wat staat er deze week op de planning?", "Wie zit er in U15-1?"

### Fase 2: Actie + Geheugen

**Doel:** Daisy kan taken uitvoeren en onthoudt context.

**Wat:**
- Schrijf-plugins: evaluatie, teamindeling-schrijven, communicatie
- Actieniveau-systeem met ActieKaart component (bevestigingsflow)
- AiGeheugen model (seizoens- + verenigingsgeheugen)
- What-if integratie (agent kan what-ifs voorbereiden)
- Contextuele chat per domein-app (mini-variant)
- Suggestie-chips op basis van route + seizoensperiode

**Resultaat:** "Zet de evaluatieronde op voor U15", "Verplaats Lisa naar U17-1", "Onthoud: coach Jansen stopt na dit seizoen"

### Fase 3: Proactief

**Doel:** Daisy neemt initiatief op basis van de seizoenscyclus.

**Wat:**
- Cron-job die dagelijks de seizoensbewaking-plugin triggert
- KNKV-deadline signalering (push naar portaal en/of chat)
- Signaal → suggestie pipeline ("3 opzeggers bij U13, wil je een what-if?")
- Automatische herinneringen en follow-ups
- Seizoenssamenvatting aan einde seizoen (TC valideert → verenigingsgeheugen)
- Portaal-begroeting met persoonlijke agenda

**Resultaat:** De agent meldt proactief: "Over 3 dagen is de KNKV-deadline. Wil je dat ik het B2-formulier voorbereidt?"

### Fase 4: Platform-breed

**Doel:** Elke gebruiker heeft een persoonlijke Daisy.

**Wat:**
- Multi-user chat (per gebruiker, gefilterd op rol + clearance + doelgroepen)
- Coördinator-plugins (inventarisatie, teamstatus)
- Trainer-plugins (wie mist er, evaluatie invullen)
- Inter-user communicatie via de agent (TC → Co → Trainer)
- Taken-systeem (agent beheert, mens voert uit)
- Notificaties (in-app, optioneel push)

**Resultaat:** Barbara (coördinator D/E/F) opent de app en Daisy zegt: "Er staat een inventarisatie-verzoek open voor D1 en D2. Wil je beginnen?"

---

## 10. Relatie tot bestaande agent-infrastructuur

### Development-agents vs. Runtime-agents

| Aspect | Development (nu) | Runtime (nieuw) |
|---|---|---|
| **Waar** | Claude Code CLI | In de web-app |
| **Wie** | Antjan (ontwikkelaar) | TC-leden, coördinatoren, trainers |
| **Model** | Claude (Anthropic) | Gemini (Google) |
| **Doel** | Code schrijven, analyseren, deployen | Seizoen begeleiden, taken uitvoeren |
| **Skills** | `.claude/skills/` (37 skills) | `lib/ai/plugins/` (groeiend) |
| **Kennis** | `rules/`, `docs/kennis/` | Dezelfde bronnen, compact samengevat |

De kennis is gedeeld. De `rules/`-bestanden en `docs/kennis/`-bestanden zijn de **Single Source of Truth** voor zowel development-agents als de runtime Daisy. De runtime-plugins vatten deze samen tot compacte systeem-prompts.

### Waarom twee systemen?

- **Development-agents** hebben volledige codebase-toegang nodig (bestanden lezen/schrijven, git, terminal). Dit past niet in een web-app.
- **Runtime-agents** werken met gestructureerde data (database, API's). Ze hoeven geen code te schrijven.
- De **kennis** is hetzelfde; de **tools** zijn fundamenteel anders.

---

## 11. Technische randvoorwaarden

### Nieuwe dependencies

```json
{
  "ai": "^4.0.0",                    // Vercel AI SDK core
  "@ai-sdk/google": "^1.0.0",        // Gemini provider
  "react-markdown": "^9.0.0",        // Markdown rendering in chat
  "remark-gfm": "^4.0.0"             // GitHub Flavored Markdown
}
```

### Environment variables

```bash
# Google AI (Gemini)
GOOGLE_GENERATIVE_AI_API_KEY=...     # Van ai.google.dev

# AI configuratie
AI_MODEL=gemini-2.0-flash            # Default model
AI_MAX_TOKENS=2048                    # Max output tokens
AI_RATE_LIMIT_ENABLED=true            # Rate limiting aan/uit
```

### Database migraties

Fase 1: `AiGesprek`, `AiBericht` tabellen + enums
Fase 2: `AiGeheugen` tabel + `GeheugenType` enum
Fase 4: `AiTaak` tabel (inter-user taken)

### Bestaande code die hergebruikt wordt

| Component | Hergebruik |
|---|---|
| `guardAuth()` / `guardTC()` | Autorisatie op `/api/ai/chat` |
| Clearance-systeem | Tool-filtering per gebruiker |
| `ok()` / `fail()` helpers | Error handling in tool-handlers |
| Prisma client | Database-queries in tool-handlers |
| Design tokens | Chat UI styling |
| Framer Motion | Streaming animaties |

---

## Besluitenlog

| Besluit | Reden |
|---|---|
| Chat als primaire interface | Gebruikers prefereren conversatie boven formulieren. Bewezen patroon (Copilot, Slack AI). |
| Vercel AI SDK (model-agnostisch) | Investeren in onze tools, niet in een specifiek model. Gemini nu, wissel als nodig. |
| Gemini 2.0 Flash als default | Snel, gratis tier is ruim voldoende, lang contextvenster. |
| Plugin-architectuur | Groeipad: nieuwe capability = nieuwe plugin. Onafhankelijk ontwikkelbaar en testbaar. |
| Drie actieniveaus | Mensenwerk blijft bij mensen. Impact bepaalt autonomie. |
| Clearance-overerving | Geen nieuwe autorisatie-laag. Agent erft rechten van gebruiker. |
| Drielaags geheugen | Elk seizoen slimmer. TC valideert langetermijngeheugen. |
| Groeimodel (4 fasen) | Snel waarde leveren, architectuur groeit mee. Vertrouwen opbouwen. |
| Eén API endpoint | Simpel voor de client, krachtig op de server. Orchestrator routeert intern. |
| Plugins in code, niet in DB | Deployment simpel, tools testbaar, geen runtime-configuratie nodig. |
| Free tier als startpunt | Bewijs de waarde voordat je investeert. TC van 8 past ruim binnen de limieten. |
