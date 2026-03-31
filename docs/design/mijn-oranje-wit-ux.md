# Mijn Oranje Wit — UX Visiedocument

**Auteur:** UX-designer (lead /team-ux)
**Datum:** 2026-03-30
**Status:** Ontwerpvoorstel
**Domein:** 7e domein — "Mijn Oranje Wit" (shortName: "Mijn OW")

---

## Samenvatting

"Mijn Oranje Wit" is het persoonlijke startpunt voor alle 250 gebruikers van de app. Het is geen dashboard in de traditionele zin — het is een **cockpit** die elke gebruiker precies laat zien wat er van hem of haar verwacht wordt, wat er nieuw is, en waar alles te vinden is. Voor 240 ouders en spelers is dit de enige plek die ze ooit zien. Voor 3 TC-leden is het de springplank naar zes domein-apps. Het ontwerp moet beide groepen in dezelfde interface bedienen zonder de een te overweldigen of de ander te beperken.

De kern: **Hub toont en linkt, domein-apps opereren.** Als iets meer dan 1 klik kost, hoort het in een domein-app.

---

## 1. Navigatie-architectuur

### 1.1 Manifest-definitie

```typescript
// Toevoegen aan packages/ui/src/navigation/icons/types.ts
export type AppId = "mijn-ow" | "monitor" | "team-indeling" | "evaluatie" | "scouting" | "beheer" | "beleid";

export const APP_ACCENTS: Record<AppId, string> = {
  "mijn-ow": "#f97316",    // OW-oranje (warmer dan scouting #ff6b00)
  monitor: "#22c55e",
  // ...bestaand
};
```

```typescript
// Toevoegen aan manifest.ts
export const MIJN_OW: AppManifest = {
  id: "mijn-ow",
  name: "Mijn Oranje Wit",
  shortName: "Mijn OW",
  description: "Persoonlijke cockpit — taken, nieuws en profiel",
  baseUrl: "/",
  accent: APP_ACCENTS["mijn-ow"],   // #f97316
  sections: [
    {
      nav: { label: "Overzicht", href: "/", icon: "HomeIcon" },
    },
    {
      nav: { label: "Taken", href: "/taken", icon: "ListIcon" },
    },
    {
      nav: { label: "Nieuws", href: "/nieuws", icon: "BellIcon" },
    },
    {
      nav: { label: "Profiel", href: "/profiel", icon: "ProfileIcon" },
    },
  ],
  skipRoutes: ["/login", "/login/smartlink"],
  visibility: { public: true },
};
```

### 1.2 Route group

```
apps/web/src/app/
  (www)/                     ← route group voor Mijn OW
    layout.tsx               ← DomainShell met domain="mijn-ow"
    page.tsx                 ← Overzicht (/)
    taken/
      page.tsx               ← Taken (/taken)
    nieuws/
      page.tsx               ← Nieuws (/nieuws)
    profiel/
      page.tsx               ← Profiel (/profiel)
```

### 1.3 Bottom Nav

```
┌──────────────────────────────────────────────┐
│  Overzicht    Taken    Nieuws    Profiel  [+] │
│     ◉           ◯        ◯        ◯     Apps │
└──────────────────────────────────────────────┘
```

| Positie | Label | Icoon | Opmerking |
|---|---|---|---|
| 1 | Overzicht | `HomeIcon` | Persoonlijk dashboard |
| 2 | Taken | `ListIcon` (clipboard) | Badge met openstaand-telling |
| 3 | Nieuws | `BellIcon` (nieuw icoon) | Badge met ongelezen-telling |
| 4 | Profiel | `ProfileIcon` | Persoonlijke gegevens |
| 5 | Apps | `GridIcon` | AppSwitcher (standaard) |

### 1.4 Nieuw icoon: BellIcon

```typescript
export function BellIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" strokeWidth={active ? 2.5 : 1.5}>
      <path
        d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.73 21a2 2 0 01-3.46 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
```

### 1.5 App-icoon voor Mijn OW

Het icoon voor de AppSwitcher en het portaal is een **huis met een OW-schild** — herkenbaar als "thuis" maar met OW-identiteit. Het combineert het bestaande `HomeIcon`-silhouet met een klein schild-element in het midden.

---

## 2. Overzicht-pagina (/)

Dit is de pagina waar iedereen op landt na inloggen. Het moet in 2 seconden duidelijk zijn: wie ben ik, wat moet ik doen, wat is er nieuw.

### 2.1 Structuur (mobiel, 430px)

```
┌─────────────────────────────────────┐
│                                     │
│  TopBar: "Mijn OW"  [accent-lijn]  │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐  │
│  │  HERO GREETING                │  │
│  │                               │  │
│  │  Goedenavond, Jan             │  │  ← 28px, font-weight 700
│  │  Technische Commissie         │  │  ← 14px, text-secondary
│  │                               │  │
│  │  ╔═══════════╗ ╔═══════════╗  │  │
│  │  ║  3        ║ ║  1        ║  │  │  ← HERO TELLERS
│  │  ║  taken    ║ ║  nieuw    ║  │  │     48px cijfer, glow
│  │  ╚═══════════╝ ╚═══════════╝  │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  SEIZOENSINDICATOR            │  │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓░░░░  72%      │  │  ← progress bar in oranje
│  │  Seizoen 2025-2026            │  │
│  │  Volgende: Evaluatieronde 2   │  │  ← text-secondary
│  │  over 12 dagen                │  │
│  └───────────────────────────────┘  │
│                                     │
│  ── QUICK ACTIONS ────────────────  │  ← section header
│                                     │
│  ┌───────────────────────────────┐  │
│  │ ┌─────────┐ ┌─────────┐      │  │
│  │ │ Evaluatie│ │ Mijn    │      │  │  ← 2-3 contextafhankelijke
│  │ │ invullen │ │ team    │      │  │     knoppen per rol
│  │ │ ⚡ 2    │ │ bekijken│      │  │
│  │ └─────────┘ └─────────┘      │  │
│  └───────────────────────────────┘  │
│                                     │
│  ── SINDS JE LAATSTE BEZOEK ─────  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  ● Werkindeling gepubliceerd  │  │  ← activity feed
│  │    Team F3 — 2 dagen geleden  │  │
│  │                               │  │
│  │  ● Evaluatieronde 2 geopend   │  │
│  │    3 spelers — vandaag        │  │
│  └───────────────────────────────┘  │
│                                     │
│  ── APPS ─────────────────────────  │
│                                     │
│  ┌──────┐ ┌──────┐ ┌──────┐       │  ← compact app grid
│  │ Mon  │ │Teams │ │ Eval │       │     alleen zichtbare apps
│  └──────┘ └──────┘ └──────┘       │
│  ┌──────┐ ┌──────┐ ┌──────┐       │
│  │Scout │ │Beheer│ │Beleid│       │
│  └──────┘ └──────┘ └──────┘       │
│                                     │
│  c.k.v. Oranje Wit · 2025-2026    │
│                                     │
├─────────────────────────────────────┤
│  [Overzicht] [Taken] [Nieuws] [Me] │
└─────────────────────────────────────┘
```

### 2.2 Hero Greeting — Component spec

**Component:** `HeroGreeting`

Het welkomstblok is het eerste wat je ziet. Geen kaart — het staat direct op de page-achtergrond met subtiele diepte via een gradient overlay.

| Eigenschap | Waarde |
|---|---|
| Container | Geen border, geen card. Achtergrond: `radial-gradient(ellipse at top, rgba(249,115,22,0.08) 0%, transparent 60%)` |
| Padding | `pt-8 pb-6 px-5` |
| Groet | Tijdsgebonden: "Goedemorgen" (5-12), "Goedemiddag" (12-18), "Goedenavond" (18-5) |
| Naam | `text-[28px] font-bold tracking-tight`, `--text-primary` |
| Rol-label | `text-sm`, `--text-secondary` |
| Animatie | Naam faded in met `translateY(8px)` over 400ms, staggered 100ms na groet |

**Tijdgebonden kleurnuance:** De radial gradient verschuift subtiel:
- Ochtend: oranje (standaard)
- Middag: oranje-goud mix
- Avond: oranje met hint van donkerblauw aan de randen

### 2.3 Hero Tellers — Component spec

**Component:** `HeroTellers`

Twee (of drie) grote tellerblokken die in een horizontale rij staan direct onder de groet.

| Eigenschap | Waarde |
|---|---|
| Layout | `flex gap-3`, elk blok `flex-1` |
| Blok-achtergrond | `var(--surface-card)` met `border: 1px solid var(--border-default)` |
| Blok-radius | `16px` |
| Blok-padding | `p-4` |
| Cijfer | `text-[48px] font-bold`, `--text-primary` |
| Label | `text-xs uppercase tracking-wider`, `--text-secondary` |
| Glow (als > 0) | `box-shadow: 0 0 20px rgba(249,115,22,0.15)` op het blok |
| Glow (als = 0) | Geen glow, cijfer in `--text-tertiary` — "niks te doen" voelt rustig |
| Animatie | Cijfer telt op van 0 met spring-animatie (300ms), staggered per blok |

**Tellers per rol:**

| Rol | Teller 1 | Teller 2 | Teller 3 |
|---|---|---|---|
| TC-lid | Open taken | Signaleringen | Nieuw |
| Trainer | Evaluaties | — | Nieuw |
| Scout | Opdrachten | — | Nieuw |
| Ouder/speler | Taken | — | Nieuw |

Wanneer er slechts 1 teller + "Nieuw" is, worden het twee blokken 50/50. Bij 3 tellers: 33/33/33.

### 2.4 Seizoensindicator — Component spec

**Component:** `SeizoensBalk`

Een compacte, horizontale balk die laat zien waar we in het seizoen zitten.

| Eigenschap | Waarde |
|---|---|
| Container | `var(--surface-card)`, `border-radius: 16px`, `p-4` |
| Progress bar | Hoogte 6px, `border-radius: 3px`, achtergrond `var(--surface-sunken)` |
| Progress fill | `linear-gradient(90deg, #f97316, #fb923c)` met `box-shadow: 0 0 8px rgba(249,115,22,0.4)` |
| Percentage | `text-xs font-semibold`, rechts uitgelijnd, `--text-secondary` |
| Seizoensnaam | `text-sm font-medium`, `--text-primary` |
| Volgende mijlpaal | `text-xs`, `--text-tertiary`, met relatieve datum ("over 12 dagen") |

**Seizoensberekening:** De progress bar is gebaseerd op de kalenderperiode van het seizoen (1 september tot 30 juni). De volgende mijlpaal komt uit de jaarplanning (coordinatielaag).

### 2.5 Quick Actions — Component spec

**Component:** `QuickActions`

Contextafhankelijke actieknoppen — maximaal 3, altijd relevant voor de huidige gebruiker.

| Eigenschap | Waarde |
|---|---|
| Layout | `grid grid-cols-2 gap-3` (bij 3 items: eerste item `col-span-2`) |
| Knop-achtergrond | `var(--surface-card)` |
| Knop-border | `1px solid var(--border-default)` |
| Knop-radius | `16px` |
| Knop-padding | `p-4` |
| Icoon | 24px, in domein-accent kleur, met subtiel `background` cirkel |
| Label | `text-sm font-semibold`, `--text-primary` |
| Sublabel | `text-xs`, domein-accent kleur (bijv. "2 openstaand" in geel) |
| Hover | `scale(1.02)` + `box-shadow: 0 0 16px rgba(accent, 0.15)` |
| Tap | `scale(0.98)` over 100ms |

**Acties per rol:**

| Rol | Actie 1 | Actie 2 | Actie 3 |
|---|---|---|---|
| TC-lid | "Evaluaties beheren" → `/evaluatie/admin` | "Team-indeling" → `/ti-studio` | "Monitor" → `/monitor` |
| Trainer | "Evaluatie invullen" → `/evaluatie/invullen?token=X` | "Mijn team bekijken" → `/teamindeling/teams/[id]` | — |
| Scout | "Scouting-opdracht" → `/scouting/verzoeken` | "Speler zoeken" → `/scouting/zoek` | — |
| Ouder/speler | "Werkindeling bekijken" → `/teamindeling` | "Zelfevaluatie" → `/evaluatie/zelf?token=X` | — |

De acties worden server-side bepaald op basis van capabilities EN actuele data. Heeft een trainer geen openstaande evaluaties? Dan verschijnt die knop niet en wordt "Mijn team bekijken" de enige actie.

### 2.6 Activiteitsfeed — Component spec

**Component:** `RecenteActiviteit`

Een tijdlijn van gebeurtenissen sinds het laatste bezoek.

| Eigenschap | Waarde |
|---|---|
| Container | `var(--surface-card)`, `border-radius: 16px`, `p-4` |
| Sectie-header | "Sinds je laatste bezoek" — `text-xs uppercase tracking-wider`, `--text-tertiary` |
| Item-layout | Verticale lijst met links een tijdlijn-lijn (2px, `--border-default`) |
| Dot | 8px cirkel, gevuld met domein-accent kleur van de bron-app |
| Item-titel | `text-sm`, `--text-primary` |
| Item-detail | `text-xs`, `--text-tertiary` |
| Relatieve tijd | `text-xs`, `--text-tertiary`, rechts uitgelijnd ("2 uur geleden", "gisteren") |
| Max items | 5 (met "Bekijk alle" link naar `/taken`) |
| Lege staat | Verborgen (niet tonen als er niets is) |

**Mogelijke activiteitstypen:**

| Type | Tekst | Bron-accent |
|---|---|---|
| Werkindeling gepubliceerd | "Werkindeling gepubliceerd voor [team]" | Blauw (TI) |
| Evaluatieronde geopend | "Evaluatieronde [naam] is geopend" | Geel (Evaluatie) |
| Scouting-verzoek toegewezen | "Nieuw scouting-verzoek: [speler]" | Oranje (Scouting) |
| Signalering | "[type]: [beschrijving]" | Groen (Monitor) |
| Mededeling geplaatst | "[titel]" | Oranje (Mijn OW) |

### 2.7 App Grid (compact)

De bestaande `AppGrid` wordt hergebruikt maar compacter. Op de Overzicht-pagina tonen we een 3-koloms grid met alleen icoon + korte naam (geen beschrijving). Dit is de "ik wil ergens heen"-sectie.

| Eigenschap | Waarde |
|---|---|
| Layout | `grid grid-cols-3 gap-3` |
| Tile | `var(--surface-card)`, `border-radius: 16px`, `p-3`, `text-center` |
| Icoon | 32px, gradient achtergrond in app-accent |
| Label | `text-xs font-medium`, `--text-primary` |
| Hover | Glow in app-accent |

---

## 3. Taken-pagina (/taken)

De unified takenlijst. Alle domeinen leveren hun openstaande items af; deze pagina aggregeert ze.

### 3.1 Structuur

```
┌─────────────────────────────────────┐
│  TopBar: "Mijn OW"                 │
├─────────────────────────────────────┤
│                                     │
│  Taken (heading)              [12]  │  ← totaal-badge
│                                     │
│  ┌───────────────────────────────┐  │
│  │ [Alles] [Type ▾] [Urgent ▾]  │  │  ← filter-pills
│  └───────────────────────────────┘  │
│                                     │
│  ── VANDAAG ──────────────────────  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ ● Evaluatie invullen          │  │
│  │   Team F3 · Ronde 2           │  │
│  │   Deadline: morgen        ⚠️  │  │  ← urgentie-indicator
│  │                            →  │  │  ← chevron, linkt naar domein
│  ├───────────────────────────────┤  │
│  │ ● Scouting-verzoek bekijken   │  │
│  │   Tim de Vries · categorie B  │  │
│  │   Toegewezen: vandaag         │  │
│  │                            →  │  │
│  └───────────────────────────────┘  │
│                                     │
│  ── DEZE WEEK ────────────────────  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ ● Actiepunt: trainer feedback │  │
│  │   Jan · deadline 3 apr        │  │
│  │                            →  │  │
│  └───────────────────────────────┘  │
│                                     │
│  ── LATER ────────────────────────  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ ● Zelfevaluatie invullen      │  │
│  │   Ronde 2 · deadline 15 apr   │  │
│  │                            →  │  │
│  └───────────────────────────────┘  │
│                                     │
├─────────────────────────────────────┤
│  [Overzicht] [Taken] [Nieuws] [Me] │
└─────────────────────────────────────┘
```

### 3.2 Taak-item — Component spec

**Component:** `TaakItem`

| Eigenschap | Waarde |
|---|---|
| Container | Geen losse card per item. Items zitten in een gegroepeerde card per tijdsblok |
| Card-achtergrond | `var(--surface-card)`, `border-radius: 16px` |
| Item-padding | `px-4 py-3` |
| Divider | `1px solid var(--border-default)` tussen items |
| Type-dot | 10px cirkel, links, gevuld met domein-accent kleur |
| Titel | `text-sm font-medium`, `--text-primary` |
| Subtitel | `text-xs`, `--text-tertiary` |
| Urgentie-badge | Alleen bij deadline < 3 dagen: `text-xs font-semibold`, achtergrond `rgba(239,68,68,0.12)`, tekst `#f87171` |
| Chevron | 16px, `--text-tertiary`, rechts uitgelijnd |
| Hele item is tappable | `min-height: 56px`, navigeert naar de juiste plek in de domein-app |

### 3.3 Taak-typen en bronnen

| Taak-type | Domein | Accent | Link |
|---|---|---|---|
| Evaluatie invullen | Evaluatie | `#eab308` | `/evaluatie/invullen?token=X` |
| Zelfevaluatie invullen | Evaluatie | `#eab308` | `/evaluatie/zelf?token=X` |
| Scouting-verzoek | Scouting | `#ff6b00` | `/scouting/verzoeken/[id]` |
| Actiepunt | TI / Coordinatie | `#3b82f6` | `/ti-studio/actiepunten/[id]` |
| Werkindeling reviewen | Team-Indeling | `#3b82f6` | `/teamindeling` |
| Signalering bekijken | Monitor | `#22c55e` | `/monitor/signalering` |

### 3.4 Tijdsgroepering

| Groep | Regel |
|---|---|
| **Vandaag** | Deadline vandaag OF geen deadline maar urgent (bijv. signalering "kritiek") |
| **Deze week** | Deadline binnen 7 dagen |
| **Later** | Alles met deadline > 7 dagen of zonder deadline |

Binnen elke groep: gesorteerd op deadline (vroegst eerst), dan op type (evaluaties boven actiepunten).

### 3.5 Filters

Twee pill-filters boven de lijst:

**Type-filter:**
- Alles (standaard)
- Evaluaties
- Scouting
- Actiepunten

**Urgentie-filter:**
- Alles (standaard)
- Urgent (deadline < 3 dagen)
- Normaal

Filter-pills gebruiken het standaard Pills-component patroon: horizontaal scrollbaar, active pill in oranje.

### 3.6 Lege staat

**Component:** `TakenLeeg`

```
┌───────────────────────────────────┐
│                                   │
│         ┌────────────┐            │
│         │   ✓  ✓     │            │  ← animated checkmarks
│         │     ✓      │            │     staggered appearance
│         └────────────┘            │
│                                   │
│     Alles bijgewerkt              │  ← text-primary, 18px semibold
│                                   │
│     Geen openstaande taken.       │  ← text-tertiary, 14px
│     Geniet van je vrije tijd!     │
│                                   │
└───────────────────────────────────┘
```

De checkmarks verschijnen een voor een met een `scale(0) -> scale(1.2) -> scale(1)` bounce-animatie, staggered met 200ms vertraging. Kleur: `--ow-success` (#22c55e) met subtiele glow.

Geen confetti — dat is te speels voor een korfbalvereniging. De vinkjes-animatie is feestelijk maar waardig.

---

## 4. Nieuws-pagina (/nieuws)

Mededelingen van de TC en seizoenskalender.

### 4.1 Structuur

```
┌─────────────────────────────────────┐
│  TopBar: "Mijn OW"                 │
├─────────────────────────────────────┤
│                                     │
│  Nieuws (heading)                   │
│                                     │
│  ┌─ [Berichten] [Kalender] ────── ┐ │  ← pills
│                                     │
│  === TAB: BERICHTEN =============== │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ ┌─ NIEUW ─┐                   │  │  ← "nieuw" badge
│  │ │                             │  │
│  │  Evaluatieronde 2 geopend     │  │  ← titel, 16px semibold
│  │                               │  │
│  │  Beste trainers, de tweede    │  │  ← body, 14px, text-secondary
│  │  evaluatieronde is geopend... │  │     max 3 regels, truncated
│  │                               │  │
│  │  TC · 28 maart 2026           │  │  ← auteur + datum
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  Seizoensplanning update      │  │
│  │                               │  │
│  │  De teamindeling voor...      │  │
│  │                               │  │
│  │  TC · 20 maart 2026           │  │
│  └───────────────────────────────┘  │
│                                     │
│  === TAB: KALENDER ================ │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  APR                          │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │ 3   Training F3  18:00 │  │  │
│  │  │ 5   Wedstrijd    14:30 │  │  │
│  │  │ 10  Evaluatie deadline │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
│                                     │
│  [+] Nieuwe mededeling              │  ← FAB, alleen voor TC
│                                     │
├─────────────────────────────────────┤
│  [Overzicht] [Taken] [Nieuws] [Me] │
└─────────────────────────────────────┘
```

### 4.2 Nieuwskaart — Component spec

**Component:** `NieuwsKaart`

| Eigenschap | Waarde |
|---|---|
| Container | `var(--surface-card)`, `border-radius: 16px`, `p-5` |
| Border | `1px solid var(--border-default)` |
| "Nieuw" badge | Alleen bij ongelezen. `text-[10px] font-bold uppercase tracking-wider`, achtergrond `rgba(249,115,22,0.15)`, tekst `#f97316`, `border-radius: 6px`, `px-2 py-0.5` |
| Titel | `text-base font-semibold`, `--text-primary` |
| Body | `text-sm leading-relaxed`, `--text-secondary`, `line-clamp-3` |
| Meta | `text-xs`, `--text-tertiary` — "TC" + relatieve datum |
| Spacing | `space-y-2` intern |
| Tap | Navigeert naar detail-pagina (`/nieuws/[id]`) |
| Ongelezen-indicator | Dunne lijn links: `border-left: 3px solid #f97316` (alleen bij ongelezen) |

### 4.3 Kalender-sectie

**Component:** `SeizoenKalender`

Een compacte maandweergave met aankomende events.

| Eigenschap | Waarde |
|---|---|
| Maand-header | `text-sm font-bold uppercase tracking-wider`, `--text-primary` |
| Event-rij | `flex items-center gap-3 py-2` |
| Dag-getal | `text-lg font-bold`, `--text-primary`, `w-8 text-right` |
| Event-label | `text-sm`, `--text-secondary` |
| Event-tijd | `text-xs`, `--text-tertiary` |
| Type-indicator | Gekleurde dot (6px): training=blauw, wedstrijd=oranje, deadline=rood |
| Divider | `1px solid var(--border-default)` tussen events |

### 4.4 Nieuwe mededeling (TC)

TC-leden zien een Floating Action Button rechtsonder (boven de BottomNav):

| Eigenschap | Waarde |
|---|---|
| Positie | `fixed`, `right: 20px`, `bottom: calc(3.5rem + 20px + env(safe-area-inset-bottom))` |
| Grootte | `56px` diameter |
| Achtergrond | `linear-gradient(135deg, #f97316, #fb923c)` |
| Icoon | Plus-icoon, wit, 24px |
| Schaduw | `0 4px 16px rgba(249,115,22,0.4)` |
| Animatie | `scale(0) -> scale(1)` bij page load met spring |
| Tap | Opent een bottom sheet met titel + textarea + publiceer-knop |

---

## 5. Profiel-pagina (/profiel)

Persoonlijke informatie en instellingen.

### 5.1 Structuur

```
┌─────────────────────────────────────┐
│  TopBar: "Mijn OW"                 │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐  │
│  │       ┌──────┐               │  │
│  │       │  JD  │               │  │  ← avatar initialen, 64px
│  │       └──────┘               │  │     gradient achtergrond
│  │                               │  │
│  │    Jan de Vries               │  │  ← text-primary, 24px bold
│  │    jan@example.com            │  │  ← text-secondary, 14px
│  │                               │  │
│  │    ┌──────────────┐           │  │
│  │    │ Technische   │           │  │  ← rol-badge, oranje accent
│  │    │ Commissie    │           │  │
│  │    └──────────────┘           │  │
│  └───────────────────────────────┘  │
│                                     │
│  ── MIJN TEAM(S) ─────────────────  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  F3 — Gemengd                 │  │
│  │  Trainer: Lisa Bakker         │  │
│  │  Coordinator: Mark Jansen     │  │
│  │                            →  │  │  ← link naar team in TI
│  └───────────────────────────────┘  │
│                                     │
│  ── BEVEILIGING ──────────────────  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  Passkeys                     │  │
│  │                               │  │
│  │  ● iPhone van Jan     actief  │  │
│  │  ● MacBook Pro        actief  │  │
│  │                               │  │
│  │  [ + Nieuw apparaat ]         │  │  ← ghost button
│  └───────────────────────────────┘  │
│                                     │
│  ── APP ──────────────────────────  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  PWA Status                   │  │
│  │  ✓ Geinstalleerd             │  │  ← of: [Installeer app] knop
│  │                               │  │
│  │  Versie                       │  │
│  │  2025-2026.3                  │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  [ Uitloggen ]                │  │  ← destructive, subtle
│  └───────────────────────────────┘  │
│                                     │
├─────────────────────────────────────┤
│  [Overzicht] [Taken] [Nieuws] [Me] │
└─────────────────────────────────────┘
```

### 5.2 Avatar — Component spec

**Component:** `ProfielAvatar`

| Eigenschap | Waarde |
|---|---|
| Grootte | 64px diameter |
| Achtergrond | `linear-gradient(135deg, #f97316, #ea580c)` |
| Border | `3px solid rgba(249,115,22,0.3)` |
| Glow | `box-shadow: 0 0 24px rgba(249,115,22,0.2)` |
| Tekst | Initialen (max 2 letters), `text-2xl font-bold`, wit |
| Border-radius | `50%` |

### 5.3 Rol-badge

| Eigenschap | Waarde |
|---|---|
| TC | Achtergrond `rgba(249,115,22,0.12)`, tekst `#f97316`, "Technische Commissie" |
| Trainer | Achtergrond `rgba(234,179,8,0.12)`, tekst `#eab308`, "Trainer [team(s)]" |
| Scout | Achtergrond `rgba(255,107,0,0.12)`, tekst `#ff6b00`, "Scout" |
| Coordinator | Achtergrond `rgba(59,130,246,0.12)`, tekst `#3b82f6`, "Coordinator [doelgroep]" |
| Ouder/speler | Geen badge — alleen naam en e-mail |

### 5.4 Mijn team(s) sectie

Toont de teams waar de gebruiker bij betrokken is (als speler, ouder van speler, trainer, of coordinator).

| Eigenschap | Waarde |
|---|---|
| Card | `var(--surface-card)`, `border-radius: 16px`, `p-4` |
| Teamnaam | `text-sm font-semibold`, `--text-primary` |
| Categorie-indicator | 4px balk links in leeftijdscategorie-kleur |
| Trainer/coord | `text-xs`, `--text-tertiary` |
| Chevron | Linkt naar `/teamindeling/teams/[id]` |

### 5.5 Passkey-beheer

| Eigenschap | Waarde |
|---|---|
| Card | `var(--surface-card)`, `border-radius: 16px`, `p-4` |
| Device-rij | `flex items-center gap-3 py-2` |
| Device-icoon | 20px, `--text-secondary` (smartphone of laptop icoon) |
| Device-naam | `text-sm`, `--text-primary` |
| Status | `text-xs`, `--ow-success` ("actief") |
| "Nieuw apparaat" knop | Ghost button: `text-sm font-medium`, `--ow-accent`, geen achtergrond, `border: 1px dashed var(--border-default)` |

### 5.6 Uitloggen

| Eigenschap | Waarde |
|---|---|
| Knop | Full-width, `text-sm font-medium`, `--text-secondary` |
| Achtergrond | `var(--surface-card)` |
| Hover | Tekst wordt `--ow-danger` (#EF4444) |
| Tap-bevestiging | Geen — direct uitloggen (de actie is laagdrempelig genoeg) |

---

## 6. Micro-interacties en animaties

### 6.1 Eerste landing na inlog

De Overzicht-pagina bouwt zich stap voor stap op. Dit voelt niet als "loading" maar als "onthulling":

| Stap | Element | Animatie | Delay |
|---|---|---|---|
| 1 | Hero greeting (groet + naam) | `opacity: 0 -> 1`, `translateY: 12px -> 0` | 0ms |
| 2 | Rol-label | `opacity: 0 -> 1`, `translateY: 8px -> 0` | 100ms |
| 3 | Hero tellers | `scale: 0.9 -> 1`, `opacity: 0 -> 1` per blok | 200ms + 100ms stagger |
| 4 | Teller-cijfers | Count-up animatie van 0 | 400ms (na blok verschijnt) |
| 5 | Seizoensindicator | `opacity: 0 -> 1`, progress bar vult zich | 500ms |
| 6 | Quick actions | `opacity: 0 -> 1`, `translateY: 16px -> 0` per knop | 600ms + 80ms stagger |
| 7 | Activiteitsfeed | `opacity: 0 -> 1`, items staggered | 800ms + 60ms stagger |
| 8 | App grid | `opacity: 0 -> 1` | 1000ms |

**Totale opbouw: ~1.2 seconden.** Snel genoeg om niet irritant te zijn, langzaam genoeg om premium te voelen.

**Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` voor alle translate/opacity. `spring(0.5, 0.7, 0)` voor scale-animaties.

**Tweede bezoek in dezelfde sessie:** Geen staggered loading — alles verschijnt direct. De animatie is alleen voor de "eerste indruk" na inlog.

### 6.2 Tab-navigatie (BottomNav)

| Transitie | Animatie |
|---|---|
| Tab-wissel | Content area: `opacity: 0 -> 1` over 200ms. Geen slide — dat voelt als een carousel. |
| Actieve indicator | De oranje kleur op het actieve icoon heeft een `200ms ease` transitie |
| Badge-update | Badge-telling pulseert kort (`scale: 1 -> 1.15 -> 1`, 300ms) bij wijziging |

### 6.3 Pull-to-refresh

| Eigenschap | Waarde |
|---|---|
| Trigger | Pull-down op Overzicht-pagina (en Taken, Nieuws) |
| Indicator | Klein OW-logo (24px) dat roteert |
| Threshold | 60px pull |
| Release-animatie | Logo springt terug met `spring`, data wordt opnieuw opgehaald |
| Implementatie | Native `overscroll-behavior` met custom indicator via Framer Motion |

### 6.4 Transitie Hub naar domein-app

Wanneer een gebruiker vanuit Mijn OW naar een domein-app navigeert (bijv. via Quick Action of App Grid):

| Stap | Wat gebeurt er |
|---|---|
| 1 | Tapped element krijgt `scale(0.97)` feedback (100ms) |
| 2 | Huidige pagina faded out: `opacity: 1 -> 0`, `translateY: 0 -> -8px` (200ms) |
| 3 | Next.js navigatie start |
| 4 | Nieuwe pagina faded in: `opacity: 0 -> 1`, `translateY: 8px -> 0` (300ms) |
| 5 | BottomNav wisselt naar de navigatie van de domein-app (crossfade 200ms) |

De TopBar accent-lijn wisselt van kleur: van `#f97316` (Mijn OW oranje) naar de accent-kleur van de domein-app. Dit is een `300ms ease` kleur-transitie.

### 6.5 Badge-animaties

Badges op de BottomNav (Taken-telling, Nieuws ongelezen-telling) hebben eigen leven:

| Event | Animatie |
|---|---|
| Eerste verschijning | `scale(0) -> scale(1.2) -> scale(1)` bounce, 400ms |
| Telling verandert | Kort pulse: `scale(1) -> scale(1.15) -> scale(1)`, 200ms |
| Telling naar 0 | `scale(1) -> scale(0)`, 200ms, badge verdwijnt |

---

## 7. Rolspecifieke ervaringen

### 7.1 TC-lid (3 gebruikers, dagelijks)

De TC-ervaring is de meest informatiedichte. Het Overzicht toont:
1. Hero greeting + 3 tellers (taken, signaleringen, nieuw)
2. Seizoensindicator met volgende mijlpaal
3. Quick actions: directe links naar de 3 meest gebruikte apps
4. Activiteitsfeed: cross-domein activiteit
5. Compact app grid: alle 6 apps zichtbaar

De Taken-pagina aggregeert:
- Actiepunten uit de coordinatielaag
- Signaleringen uit Monitor
- Evaluatie-beheer taken
- Scouting-verzoeken die goedkeuring nodig hebben

### 7.2 Trainer / Coordinator (~10 gebruikers, wekelijks)

Gestroomlijnder. Het Overzicht toont:
1. Hero greeting + 2 tellers (evaluaties, nieuw)
2. Seizoensindicator
3. Quick actions: "Evaluatie invullen" (prominent, met telling), "Mijn team bekijken"
4. Activiteitsfeed: alleen relevante items (eigen team, evaluaties)
5. Compact app grid: Team-Indeling + Evaluatie (alleen zichtbare apps)

### 7.3 Scout (~5 gebruikers, periodiek)

1. Hero greeting + 2 tellers (opdrachten, nieuw)
2. Quick actions: "Scouting-opdracht bekijken", "Speler zoeken"
3. Activiteitsfeed: nieuwe verzoeken, afgeronde observaties
4. App grid: Scouting (primair)

### 7.4 Ouder / Speler (~240 gebruikers, seizoensgebonden)

De meest minimale ervaring. Deze gebruikers komen 2-3 keer per seizoen:

1. Hero greeting + 1-2 tellers (taken als er evaluaties/werkindeling openstaan)
2. Seizoensindicator (context: "je speelt in team F3")
3. Quick actions: "Werkindeling bekijken", "Zelfevaluatie invullen" (als die openstaat)
4. Nieuws: alleen de laatste mededeling inline (geen aparte feed)
5. Geen app grid — deze gebruikers hoeven niet te navigeren naar domein-apps

**Belangrijk:** Voor deze groep is het dashboard de HELE app. Ze hoeven nooit een BottomNav-tab te zien als er niks in Taken of Nieuws staat. De BottomNav is er voor als ze willen, niet als navigatie-verplichting.

---

## 8. Responsief gedrag

### 8.1 Mobile (< 768px, primair ontwerp)

Alles hierboven beschreven. Geoptimaliseerd voor 430px (iPhone 15 Pro Max). BottomNav altijd zichtbaar.

### 8.2 Tablet (768px - 1024px)

- Hero tellers worden breder (meer ademruimte)
- Quick actions grid: `grid-cols-3` (alle 3 naast elkaar)
- App grid: `grid-cols-4`
- Kaarten krijgen meer padding
- BottomNav blijft (geen sidebar)

### 8.3 Desktop (> 1024px)

- Sidebar verschijnt met: Overzicht, Taken, Nieuws, Profiel + App Switcher
- Content area: `max-width: 720px`, gecentreerd
- Hero tellers en quick actions naast elkaar in een 2-koloms layout
- Activiteitsfeed en app grid in de tweede kolom
- BottomNav verdwijnt (sidebar neemt over)

---

## 9. Migratie van huidige Hub

### 9.1 Wat wordt hergebruikt

| Huidig component | Wordt | Wijzigingen |
|---|---|---|
| `page.tsx` (Hub) | `(www)/page.tsx` (Overzicht) | DomainShell wrapper, staggered loading |
| `HubTC` | Verwerkt in Hero Tellers + Quick Actions + RecenteActiviteit | Signaleringen gaan naar Monitor-link, actiepunten naar Taken |
| `HubEvaluatie` | Verwerkt in Taken-pagina | Wordt een taak-item |
| `HubScouting` | Verwerkt in Taken-pagina | Wordt een taak-item |
| `HubZelf` | Verwerkt in Taken-pagina | Wordt een taak-item |
| `HubLeeg` | `TakenLeeg` | Vinkjes-animatie, verbeterde copy |
| `HubSkeleton` | Nieuw skeleton per sectie | Pulse-animatie op dark cards |
| `AppGrid` | `CompactAppGrid` | Kleiner, alleen icoon + naam |

### 9.2 Wat is nieuw

| Component | Locatie | Beschrijving |
|---|---|---|
| `HeroGreeting` | `packages/ui` | Tijdsgebonden groet met gradient |
| `HeroTellers` | `packages/ui` | Grote count-up tellers |
| `SeizoensBalk` | `packages/ui` | Seizoensvoortgang + volgende mijlpaal |
| `QuickActions` | `(www)/components` | Contextafhankelijke actieknoppen |
| `RecenteActiviteit` | `(www)/components` | Cross-domein activiteitsfeed |
| `TaakItem` | `(www)/components` | Unified taak-weergave |
| `NieuwsKaart` | `(www)/components` | Mededeling met ongelezen-indicator |
| `SeizoenKalender` | `(www)/components` | Compacte kalenderweergave |
| `ProfielAvatar` | `packages/ui` | Initialen-avatar met gradient |
| `BellIcon` | `packages/ui` | Nieuw navigatie-icoon |

### 9.3 Wat vervalt

| Component | Reden |
|---|---|
| `HubTC` | Opgesplitst in meerdere nieuwe componenten |
| `HubEvaluatie` | Wordt taak-item in Taken-pagina |
| `HubScouting` | Wordt taak-item in Taken-pagina |
| `HubZelf` | Wordt taak-item in Taken-pagina |
| Uitlog-knop in AppGrid | Verhuist naar Profiel-pagina |

---

## 10. Design tokens — Mijn OW specifiek

### 10.1 Nieuwe tokens

| Token | Waarde | Gebruik |
|---|---|---|
| `--mow-hero-gradient` | `radial-gradient(ellipse at top, rgba(249,115,22,0.08) 0%, transparent 60%)` | Hero greeting achtergrond |
| `--mow-teller-glow` | `0 0 20px rgba(249,115,22,0.15)` | Actieve teller glow |
| `--mow-fab-shadow` | `0 4px 16px rgba(249,115,22,0.4)` | FAB schaduw |
| `--mow-unread-accent` | `3px solid #f97316` | Ongelezen-indicator border |

### 10.2 Hergebruikte tokens

Alles uit het bestaande design system. Mijn OW introduceert geen nieuwe surface-, text-, of border-tokens. De domein-accent is `#f97316` (warmer oranje, iets anders dan scouting's `#ff6b00` om visueel onderscheid te bieden in de AppSwitcher).

---

## 11. Toegankelijkheid

| Aspect | Aanpak |
|---|---|
| Focus management | Na inlog: focus op hero greeting. Tab-volgorde: tellers -> quick actions -> feed -> app grid |
| Screen reader | Elke sectie heeft `aria-label`. Tellers lezen als "3 openstaande taken". Badges lezen als "2 ongelezen berichten" |
| Reduced motion | `@media (prefers-reduced-motion: reduce)`: alle animaties uit, instant rendering |
| Touch targets | Alle interactieve elementen >= 44px |
| Contrast | Alle tekst voldoet aan WCAG AA op donkere achtergrond (geverifieerd met bestaande tokens) |
| Kleur niet enige indicator | Urgentie heeft naast kleur ook tekst-labels ("Verlopen", "Nog 2 dagen") |

---

## 12. Datamodel-aanrakingen

Dit UX-concept vereist de volgende data-aggregaties op de server:

### 12.1 Overzicht

```typescript
interface OverzichtData {
  // Hero
  naam: string;
  rolLabel: string;

  // Tellers
  tellerTaken: number;          // aggregatie van alle taak-typen
  tellerSignaleringen?: number; // alleen TC
  tellerNieuw: number;          // ongelezen nieuws

  // Seizoen
  seizoenVoortgang: number;     // 0-100
  seizoenNaam: string;
  volgendeMijlpaal?: { naam: string; datum: Date; dagenTot: number };

  // Quick actions (server-side bepaald)
  quickActions: Array<{ label: string; sublabel?: string; href: string; accent: string; iconType: string }>;

  // Feed
  recenteActiviteit: Array<{ type: string; titel: string; detail: string; datum: Date; accent: string; href?: string }>;

  // Apps
  zichtbareApps: AppDef[];
}
```

### 12.2 Taken

```typescript
interface TakenData {
  vandaag: TaakItem[];
  dezeWeek: TaakItem[];
  later: TaakItem[];
  totaal: number;
}

interface TaakItem {
  id: string;
  type: "evaluatie" | "zelfevaluatie" | "scouting" | "actiepunt" | "werkindeling" | "signalering";
  titel: string;
  subtitel: string;
  href: string;
  accent: string;
  deadline?: Date;
  urgent: boolean;
}
```

### 12.3 Nieuws

```typescript
interface NieuwsData {
  berichten: Array<{ id: string; titel: string; body: string; auteur: string; datum: Date; gelezen: boolean }>;
  kalender: Array<{ datum: Date; label: string; type: "training" | "wedstrijd" | "deadline"; tijd?: string }>;
}
```

---

## 13. Implementatie-fasering

### Fase 1: Fundament (week 1)
- Route group `(www)` aanmaken
- `mijn-ow` toevoegen aan `AppId`, `APP_ACCENTS`, `APP_META`
- `MIJN_OW` manifest in `manifest.ts`
- DomainShell wrapper met BottomNav
- `BellIcon` toevoegen aan icon-bibliotheek
- Basis Overzicht-pagina met HeroGreeting (statisch)

### Fase 2: Overzicht compleet (week 2)
- `HeroTellers` met count-up animatie
- `SeizoensBalk` met progress bar
- `QuickActions` met rolspecifieke logica
- Migratie van bestaande Hub-queries naar nieuw format
- Staggered loading animaties

### Fase 3: Taken + Nieuws (week 3)
- `TaakItem` component
- Taken-pagina met tijdsgroepering
- Filters (pills)
- `TakenLeeg` lege staat
- `NieuwsKaart` component
- Berichten-tab
- SeizoenKalender-tab

### Fase 4: Profiel + Polish (week 4)
- Profiel-pagina met avatar, team(s), passkeys
- PWA-status detectie
- Pull-to-refresh
- Tab-transitie animaties
- Badge-animaties op BottomNav
- Responsive breakpoints (tablet, desktop)

### Fase 5: TC features (week 5)
- "Nieuwe mededeling" FAB + bottom sheet
- Activiteitsfeed met cross-domein data
- Signaleringen-integratie
- Desktop sidebar layout

---

## Bijlagen

### A. Kleurenschema visualisatie

```
ACHTERGROND
──────────────────────────────────
#0a0a0a  ████████████████  page
#141414  ████████████████  card
#1e1e1e  ████████████████  raised

ACCENT (Mijn OW)
──────────────────────────────────
#f97316  ████████████████  primair
#fb923c  ████████████████  hover/light
#ea580c  ████████████████  pressed/dark

TEKST
──────────────────────────────────
#FAFAFA  ████████████████  primary
#A3A3A3  ████████████████  secondary
#666666  ████████████████  tertiary
```

### B. Vergelijking met huidige Hub

| Aspect | Huidige Hub | Mijn Oranje Wit |
|---|---|---|
| Navigatie | Geen (scrollbare pagina) | BottomNav met 4+1 tabs |
| Structuur | Platte lijst van secties | Dedicated pagina per functie |
| Personalisatie | Naam + rol-label | Tijdsgroet + hero tellers + rolspecifieke acties |
| Taken | Inline per type | Unified, gegroepeerd op urgentie |
| Nieuws | Niet aanwezig | Dedicated tab met ongelezen-tracking |
| Profiel | Uitlog-knop onderaan AppGrid | Dedicated pagina met passkeys + teams |
| Animaties | Geen | Staggered loading, count-up, badge pulses |
| Ouder-ervaring | Zelfde als TC (maar minder zichtbaar) | Specifiek vereenvoudigd |
| Gevoel | Functioneel | Premium, Strava-achtig |
