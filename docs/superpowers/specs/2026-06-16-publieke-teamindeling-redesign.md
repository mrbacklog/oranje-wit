# Publieke Teamindeling Redesign — Spec

**Datum:** 2026-06-16  
**Status:** Goedgekeurd  
**Scope:** `apps/ti-studio/src/app/teamindeling/PubliekeTeamindeling.tsx` + `publieke-presentatie.ts`

---

## Doel

Volledige visuele en functionele herontwerp van de publieke teamindeling-presentatie.  
Van: licht, geel-getint, simplistisch.  
Naar: dark, oranje+wit, modern, actief, sports-energy — geïnspireerd op ckvoranjewit.nl.

---

## Kleurenpalet

| Token | Waarde | Gebruik |
|---|---|---|
| `--oranje` | `#FF6600` | Primary accent, hero achtergrond, CTA, sectiekoppen |
| `--oranje-licht` | `#ff8833` | Progress bar gradient einde |
| `--oranje-dim` | `rgba(255,102,0,0.15)` | Subtiele achtergronden, count-badges |
| `--oranje-glow` | `rgba(255,102,0,0.3)` | Box-shadow glow op knoppen en progress bar |
| `--zwart` | `#080808` | Pagina-achtergrond |
| `--donker` | `#0f0f0f` | Team-body achtergrond |
| `--border` | `rgba(255,255,255,0.07)` | Scheidingslijnen |
| **Geen geel** | ~~`#eab308`~~ | Volledig verwijderd |

**Toelichting pagina** (gespiegeld): witte achtergrond + oranje accenten (zodat logo goed uitkomt).

---

## Pagina 1 — Toelichting

### Layout
- Witte achtergrond (`#ffffff`)
- Oranje verticale streep links (`5px`)
- OW logo-cirkel oranje met witte tekst
- Bold italic uppercase titel: **"Voorlopige teamindeling 2026–27"** met oranje jaar-span
- Subtitel: "c.k.v. Oranje Wit · Dordrecht"

### Inhoud (TC-beheerd via admin)
Drie vaste sectiekoppen + vrije tekst per sectie:
1. **Voorwoord** — `introTekst`  
2. **Totstandkoming** (of vrije kop) — `tcTekst`  
3. **Van de TC** — TC-ondertekening

### Sectiekop styling
- Oranje overline: `9px font-size, 800 weight, uppercase, 0.14em letter-spacing`  
- Vóór elk label: een `12px × 2px` oranje streepje (`::before`)  
- Titel: `22px (desktop) / 18px (mobiel)`, bold, donker

### Nieuwe sectie: Belangrijke data
Extra blok **onder de TC-tekst, vóór de CTA**.  
- Sectiekop: "Belangrijke data"  
- Weergave: lijst van datum + omschrijving  
  - Visueel: oranje bolletje links, datum bold, omschrijving regular  
  - Mobiel: stacked, Desktop: tabel-achtig raster 2-kolommen  
- Dataveld: `PubliekeToelichtingData.belangrijkeData: { datum: string; omschrijving: string }[]`

### Nieuwe sectie: Kennismakingstrainingen (in toelichting)
Extra blok **na Belangrijke data, vóór de CTA**.  
- Sectiekop: "Kennismakingstrainingen"  
- Info-banner: "Alle nieuwe leden zijn welkom bij de kennismakingstraining van hun team."  
- Weergave: lijst van team + datum/tijd + locatie  
- Dataveld: zie Kennismakingstraining-type hieronder

### CTA button
- Oranje filled, bold uppercase, `border-radius: 6px`  
- Tekst: "Bekijk de teamindeling →"

---

## Pagina 2 — Teamkaarten

### Navigatie-structuur (volledig scherm)

**Progress bar (3px, top fixed):**  
- Achtergrond: `rgba(255,255,255,0.06)`  
- Vulling: `linear-gradient(#FF6600, #ff8833)` + `box-shadow` glow  
- Animatie: `width` overgang 0.4s ease

**Sticky header (glassmorphism):**  
- `background: rgba(8,8,8,0.94)` + `backdrop-filter: blur(14px)`  
- Links: OW-logo cirkel + seizoen label "Voorlopige teamindeling 2026–2027"  
- Rechts: twee knoppen **identieke stijl**:  
  - `background: rgba(255,255,255,0.06)`, `border: 1px solid rgba(255,255,255,0.12)`, `border-radius: 6px`  
  - "🔍 Zoek naam" en "← Toelichting"

**Team hero (diagonale oranje banner):**  
- `background: #FF6600`  
- `clip-path: polygon(0 0, 100% 0, 100% 80%, 0 100%)` (mobiel) / `82%` (desktop)  
- Shimmer overlay: `linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 55%)`  
- Badge: categorie pill (bijv. "Senioren")  
- Teamnaam: `900 weight, italic, uppercase`, `30px` mobiel / `48px` desktop  
- Meta: dames/heren aantallen + trainer (klein, `rgba(255,255,255,0.65)`)

**Team body:**  
- Achtergrond: `#0f0f0f`  
- Spelerskolommen: 2-kolom grid (dames / heren)  
- Kolom-header: oranje `9px uppercase`, `border-bottom: 1px solid rgba(255,102,0,0.3)`  
- Speler-rij: `rgba(255,255,255,0.88)`, `border-bottom: 1px solid rgba(255,255,255,0.07)`  
- Staf-pills: `rgba(255,255,255,0.04)` achtergrond, dunne border, rol in oranje

**Kennismakingstraining blok (op teamkaart):**  
Nieuw blok **onder staf-pills**.  
- Oranje dunne `border-top` als scheidslijn  
- Sectielabel: `🏐 Kennismakingstraining`  
- Datum/tijd + locatie, opgemaakt als compacte rij  
- Alleen tonen als `team.kennismakingstraining != null`

**Footer nav (glassmorphism):**  
- `position: fixed bottom-0`, `background: rgba(8,8,8,0.96)` + blur  
- Links: "← Vorig team" knop (oranje als actief, dim als disabled)  
- Midden: teamnaam (italic) + dots  
- Rechts: "Volgend team →" knop  
- Dots: `5px` circles, actieve dot wordt `18px` pill met oranje glow  
- Selectie-teams: witte dots i.p.v. oranje

---

## Zoekoverlay

- Backdrop: `rgba(0,0,0,0.75)` + `blur(8px)`  
- Modal: `#1a1a1a`, `border-radius: 14px`, subtiele oranje glow shadow  
- Input: `background: rgba(255,255,255,0.05)`, `border: 2px solid #FF6600`  
- Resultaat-rij: oranje dot + naam bold + teamnaam klein grijs  
- Openen: "🔍 Zoek naam" knop + `Ctrl+K`  
- Sluiten: `Escape` + klik buiten

---

## Animaties & Motion

| Trigger | Animatie |
|---|---|
| Team wisselt | slide-left (naar volgend) / slide-right (naar vorig) — CSS transform |
| Team geladen | Spelersnamen stagger fade-in, 40ms per naam |
| Hero geladen | Subtiele shimmer over oranje vlak (1x, geen loop) |
| Progress bar | `width` overgang 0.4s ease |
| Dots | Pill ↔ circle transitie 0.25s |
| Swipe mobiel | Touch-start/end handler, min 50px delta |

---

## Data model uitbreiding

### `PubliekeToelichtingData` (uitgebreid)
```ts
type PubliekeToelichtingData = {
  titel: string;
  seizoenLabel: string;
  introTekst: string;
  tcTekst: string;
  // Nieuw:
  belangrijkeData: { datum: string; omschrijving: string }[];
  kennismakingstrainingen: KennismakingItem[];
}
```

### `KennismakingItem`
```ts
type KennismakingItem = {
  teamnaam: string;
  datum: string;       // bijv. "za 23 augustus 2026"
  tijd: string;        // bijv. "10:00–12:00"
  locatie: string;     // bijv. "Sporthal De Hollandse IJssel"
}
```

### `PubliekTeam` (uitgebreid)
```ts
type PubliekTeam = {
  // bestaande velden...
  // Nieuw:
  kennismakingstraining: KennismakingItem | null;
}
```

### DB-velden
De publicatie-tabel (`TeamindelingPublicatie`) krijgt twee nieuwe JSON-kolommen:
- `belangrijkeDatum` (JSON array)  
- `kennismakingstrainingen` (JSON array)  

Per team: `VersieTeam` krijgt optioneel `kennismakingsdatum`, `kennismakingstijd`, `kennismakingsLocatie` (of als JSON kolom).

> **Note:** Database-migratie en admin-beheer vallen buiten scope van deze implementatie. De UI laadt de velden als ze beschikbaar zijn (optioneel, met fallback op lege array).

---

## Responsive breakpoints

| Breakpoint | Gedrag |
|---|---|
| `< 640px` | Mobiel: kleinere hero, compacte padding, dots kleiner |
| `≥ 640px` | Desktop: grotere hero (48px titel), bredere padding, staf in meta-regel |

Implementatie via Tailwind classes (geen hardcoded inline styles).

---

## Bestanden

| Bestand | Aanpassing |
|---|---|
| `apps/ti-studio/src/app/teamindeling/PubliekeTeamindeling.tsx` | Volledig herschrijven — nieuwe componenten, animaties, dark stijl |
| `apps/ti-studio/src/lib/teamindeling/publieke-presentatie.ts` | Types uitbreiden + nieuwe velden ophalen |
| `apps/ti-studio/src/app/teamindeling/page.tsx` | Geen aanpassing verwacht |

---

## Niet in scope

- Admin-UI voor belangijke data / kennismakingstrainingen beheren  
- Database-migratie (loopt via andere sessie)  
- Selectie-flow (al bestaand)
