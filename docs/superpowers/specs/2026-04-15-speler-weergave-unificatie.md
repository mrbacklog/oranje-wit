# Speler-weergave unificatie — Design Spec

**Datum**: 2026-04-15
**Status**: brainstorm voltooid, klaar voor implementatie-plan
**Prototypes**: [`docs/superpowers/prototypes/speler-weergave/`](../prototypes/speler-weergave/)
**Tokens**: [`tokens.css`](../prototypes/speler-weergave/tokens.css)

## 1. Principe

TI Studio heeft momenteel 7+ onafhankelijk gebouwde spelerweergaven met eigen kleurpaletten, typografie en info-keuzes. Dit ontwerp unificeert ze naar **één consistent DNA** dat in **6 contexten** schaalt, zodat een speler overal herkenbaar dezelfde visuele identiteit heeft.

De zes contexten:
1. **Compact chip** — dense chip in werkbord-dropzone bij uitgezoomd zoom-level
2. **Normaal rij** — standaard team-rij in het werkbord (meest gebruikte variant)
3. **Rijke rij** — pool-drawer + zoom-detail + drag-image ghost (alles uit SpelerKaart + SpelerRij pool verenigd)
4. **Hero header** — top-sectie van SpelerProfielDialog
5. **Hover-kaart** — zwevende FIFA-kaart bij 400ms hover op werkbord-rijen
6. **Tabel-rij** — dense data-view op /personen pagina

## 2. Bouwblokken

Alle contexten zijn opgebouwd uit dezelfde primitives:

| Bouwblok | Functie | CSS |
|---|---|---|
| **Vierkante foto-avatar** | Identiteit door ingezoomde crop van de spelersfoto | `.sq-av` |
| **Gender-L** | Sexe via een L-vormig accent in de linker-onder hoek van de avatar | `.sq-av::before` |
| **Basis outline (grijs)** | Subtiele grijze border rond de avatar, rust | `.sq-av::after` |
| **Leeftijd-kolom** | Volledige rechter-kolom in KNKV-leeftijdskleur met getal "JJ" + ".DD" 2 decimalen | `.leeft-col` (per context) |
| **Status-outline** | Border-kleur op de container voor status-signaal | 5 status-klassen |
| **Memo-corner** | Diagonale post-it hoek linksboven (ligt over de foto) | `.memo-open/.bespreking/.risico/.opgelost` |
| **Geblesseerd-badge** | Wit-transparante 30% badge rechts-onder op foto, met rood plus-kruis | `.sq-av .blessure` |
| **Nieuw-lid sparkle** | Wit-transparante 30% badge rechts-boven op foto, met oranje sparkle | `.sq-av .nieuw-sparkle` |
| **USS-hexagon** | Tier-chip hexagon met score 0-99 (goud/zilver/brons/geen) | `.uss-hex` |
| **Team-badge** | Huidig team en indeling-team, inline bewerkbaar met ▾ chevron | `.tb` / `.tb-i` / `.tb-plus` |

## 3. Visuele regels

### 3.1 Naamformat per context

| Context | Format | Voorbeeld |
|---|---|---|
| Compact chip | `roepnaam ` + afgekort tvs + achternaam-initiaal | `Freek vd L.` |
| Normaal rij | `roepnaam ` + afgekort tvs + volledige achternaam | `Freek vd Laban` |
| Rijke rij | `roepnaam ` + volledig tussenvoegsel + volledige achternaam | `Freek van der Laban` |
| Hero header | Zelfde als rijke rij, maar tussenvoegsel in gedempte kleur | `Freek` *van der* `Laban` |
| Hover-kaart | Roepnaam UPPERCASE groot, tussenvoegsel + achternaam klein eronder | `FREEK` / `van der Laban` |
| Tabel | Volledige naam zoals rijke rij | `Freek van der Laban` |

Afkort-regels tussenvoegsel: `van der` → `vd`, `van de` → `vd`, `van` → `v`, `de` → `d`, `den` → `d`, `ter` → `t`, `te` → `t`.

### 3.2 Sexe

- **Compact chip**: klein vierkant (8×8, border-radius 2px) links in de naam-inner · `#2563eb` heer / `#d946ef` dame
- **Alle andere**: L-vormig accent in de linker-onder hoek van de vierkante avatar (2-3px dikte, 38-40% lengte per been)
- **Geen "Heer"/"Dame" tekstlabel** — gender leest puur via de visuele codering

### 3.3 Leeftijd

- **Compact**: 5px verticale kleurbar rechts in de chip, geen getal
- **Alle andere**: leeftijd-kolom rechts in de container, over de volledige hoogte, met "JJ" groot en ".DD" klein (altijd 2 decimalen)
- **KNKV Competitie 2.0 categorieën** (bepaald 2026-04-15):
  - Kangoeroe: 4-5 (violet basis #581c87, grens-jaren krijgen een 30% blauw-aanloop)
  - Blauw: 6-7 (basis #1d4ed8)
  - Groen: 8-9 (basis #047857)
  - Geel: 10-11-12 (basis #facc15 · 11 = helder solid midden)
  - Oranje: 13-14-15 (basis #f97316 · 14 = helder solid midden)
  - Rood: 16-17-18 (basis #dc2626 · 17 = helder solid midden)
  - Senior: 19+ (zilvergradient `linear-gradient(135deg, #cbd5e1, #94a3b8, #64748b)`)
- **Gradient-principe**: diagonale 135° gradient van linksboven naar rechtsonder. Grens-jaren krijgen een 30% "touch" van de aangrenzende categorie. Middens (11, 14, 17) zijn (bijna) solid helder.

### 3.4 Status

**5 groepen**, alleen via border-outline (geen waas meer — achtergrond blijft transparent voor latere visuele laag):

| Status | Kleur | Tailwind | Extra |
|---|---|---|---|
| Beschikbaar | `#10b981` | emerald-500 | — |
| Nieuw (`NIEUW_POTENTIEEL` / `NIEUW_DEFINITIEF`) | `#a3e635` | lime-400 | — |
| Twijfelt / Geblesseerd | `#fb923c` | orange-400 | — |
| Gaat stoppen / Gestopt / Afgemeld | `#e11d48` | rose-600 | Naam line-through, foto 75% opacity |
| Algemeen reserve | `#84a98c` | sage | Naam `#a8a8ad`, foto 85% opacity, niet draggable |

### 3.5 Memo (werkitems)

- **Vorm**: diagonale post-it hoek linksboven, `clip-path: polygon(0 0, 100% 0, 0 100%)` diagonaal gevuld
- **Grootte per context**: compact 13px · normaal 18px · rijk 22px · hero 36px · hover 28px
- **Z-index**: 10 — ligt boven de foto zodat hij deels kan overlappen
- **Border-top-left-radius: inherit** — volgt automatisch de kaart-radius
- **4 statussen** op basis van `WerkitemStatus` (hoogste actieve status wint als meerdere):
  - `OPEN` → `#fde047` post-it geel (fris aandacht)
  - `IN_BESPREKING` → `#facc15` helder goudgeel (actief)
  - `GEACCEPTEERD_RISICO` → `#a16207` dof oker (afgerond maar risico blijft)
  - `OPGELOST` → `#44403c` stone-700 (historisch, rustig)
  - `GEARCHIVEERD` → geen corner zichtbaar
- **Klik** opent de werkitems-drawer gefilterd op deze speler
- **In tabel**: ook een dedicated memo-kolom met icoon + statustekst (`● Open`, `◐ Bespreking`, `⚠ Risico`, `✓ Opgelost`, `—` geen)

### 3.6 Geblesseerd

- Wit-transparante badge (62% wit + blur) rechts-onder op de foto
- 30% van de foto-grootte
- Rood plus-kruis icoon (70-85% van badge)
- Badge heeft 3px offset van de foto-randen (valt net binnen de outline)

### 3.7 Nieuw lid (`speler.isNieuw`)

Verschilt van de status NIEUW_POTENTIEEL/DEFINITIEF — dit is de boolean die markeert "dit is fysiek een nieuw lid van de vereniging":

- **Compact**: oranje sparkle (12×12 SVG) zonder wit vierkantje, direct na het sexe-vierkantje
- **Alle andere**: wit-transparante badge 30% rechts-boven op de foto met oranje 4-puntige sparkle
- Kleur: `#ff6b00` OW-accent oranje

### 3.8 USS Score (optioneel)

- Alleen zichtbaar als `showScores=true` in de indeling
- Hexagon clip-path met dark fill (`#0a0a0c → var(--hex-fill)`) + tier-kleur border
- Tier-bepaling: score ≥85 = goud · ≥75 = zilver · ≥65 = brons · anders "geen" (oranje-accent)
- Score is integer **0-99** (geen decimaal)
- Per context: normaal 32×28 · rijk 38×34 · hover 54×48 (rechts-onder, 50% overlap met leeftijdkolom)
- Tekst in tier-kleur, bg is donker

### 3.9 Team-badges (huidig + indeling)

- Inline bewerkbaar in hero en tabel (chevron ▾ + hover-state)
- **`.tb`** voor huidig team (grijze border, neutraal)
- **`.tb-i`** voor indeling-team (oranje OW-accent border + bg tint)
- **`.tb-plus`** voor "[+ Indeling]" button als de indeling nog leeg is (dashed oranje border)

## 4. Data-mapping (Prisma → visueel)

| Veld | Visueel element |
|---|---|
| `speler.roepnaam`, `speler.tussenvoegsel`, `speler.achternaam` | Naam (per context anders geformatteerd) |
| `speler.geslacht` | Sexe-L op avatar / kleur-vierkant in compact |
| `speler.geboortedatum` + `seizoen peildatum` | Leeftijd-kolom (via `berekenKorfbalLeeftijd`, 2 decimalen) |
| `speler.fotoUrl` | Avatar-crop (fallback: initialen) |
| `speler.status` | Status-outline kleur + special casing stopt/AR |
| `speler.isNieuw` | Nieuw-lid sparkle rechts-boven op foto |
| `speler.status === GEBLESSEERD` | Geblesseerd-kruis rechts-onder op foto |
| `speler.huidigTeam` | `.tb` team-badge |
| `speler.ingedeeldTeamNaam` | `.tb-i` team-badge (of `.tb-plus` als leeg) |
| `speler.ussScore` | USS-hexagon (alleen als `showScores=true`) |
| `werkitems[].status` hoogste | Memo-corner kleur |
| `speler.gezienStatus` | Gezien-indicator (alleen in tabel) |

## 5. Interactie

- **Klik op speler** (normaal/rijk/hover/compact) → opent SpelerProfielDialog
- **Klik op memo-corner** → opent werkitems-drawer gefilterd op speler
- **Klik op status-chip** (hero/tabel) → dropdown voor status wijzigen
- **Klik op team-badge** (hero/tabel) → dropdown/selector voor team wijzigen
- **Klik op `[+ Indeling]`** → dialog voor indeling toewijzen
- **Hover op werkbord-rij** (normaal/rijk) → 400ms delay → HoverSpelersKaart

## 6. Kleur-filosofie

### Tokens
Alle kleuren als CSS custom properties in [`tokens.css`](../prototypes/speler-weergave/tokens.css). Categorieën:
- Brand accent (`--ow-accent`)
- Neutraal (backgrounds, borders, text)
- Sexe (heer, dame)
- Status (5 groepen)
- Leeftijd (19 jaren, gradient-strings)
- Memo (4 statussen)
- USS tier (goud, zilver, brons, geen)
- Team (neutraal + indeling accent)

### Functionele scheiding
- **Brand `#ff6b00`** — exclusief voor interactief (team-indeling, buttons, Daisy) — *nooit* voor status-signalen
- **Status** — alleen border-outlines (transparent achtergrond)
- **Leeftijd** — alleen in de leeftijd-kolom als gradient
- **Memo** — alleen in de post-it hoek linksboven + tabel-kolom
- **USS** — alleen in de hexagon (enige plek waar metallic goud/zilver/brons wordt gebruikt)

### Conflicten vermeden
- Status-beschikbaar emerald `#10b981` is helderder dan KNKV-leeftijd-11 emerald `#047857` → zelfde hue, andere rol
- Status-stopt rose `#e11d48` is meer magenta dan KNKV-rood → visueel gescheiden
- Goud/zilver/brons zijn gereserveerd voor USS — nergens anders gebruikt

## 7. Te verwijderen code

Bij implementatie:
- **SpelerKaart.tsx `smal={true}`** — dead code, wordt nergens aangeroepen (bewijs: 2026-04-15 grep: 0 matches)
- **"Heer"/"Dame" tekstlabels** — gender leest via visuele codering
- **Status-waas (background-color rgba tints)** — nu alleen outlines
- **Losse theme objects (`T = { pink, blue, ... }`)** in SpelerProfielDialog — vervang door tokens.css

## 8. Open punten voor implementatie

- Tokens overzetten naar `packages/ui/src/tokens/speler-weergave.css` (of `.ts`)
- React-componenten bouwen per context, delend van `<SpelerAvatar>`, `<LeeftijdKolom>`, `<MemoCorner>`, `<UssHexagon>` primitives
- Naam-formatter functie (`formatSpelerNaam(variant)`) centraal, herbruikbaar
- Photo-loading met fallback naar initialen
- Inline edit-handlers voor status en teams aansluiten op bestaande server actions (`updateSpelerStatus`, `zetSpelerIndeling`)
- Tests: visual regression test per context (Playwright met screenshot)

## 9. Proces

| Fase | Output |
|---|---|
| **Brainstorm** (done) | v1 → v22 fundament HTMLs, beslissingen per element |
| **Structureren** (done) | tokens.css, 6 prototype-HTMLs, spec, catalogus |
| **Plan** (next) | Implementatie-plan via writing-plans skill |
| **Bouwen** | React-componenten, tokens in packages/ui |
| **Review** | Visuele regressie, code review |
| **Rollout** | Feature flag, dan default |

## 10. Referenties

- Prototypes: [`docs/superpowers/prototypes/speler-weergave/`](../prototypes/speler-weergave/)
- Bestaande code (vervangen):
  - `apps/ti-studio/src/components/werkbord/SpelerKaart.tsx`
  - `apps/ti-studio/src/components/werkbord/SpelerRij.tsx`
  - `apps/ti-studio/src/components/werkbord/HoverSpelersKaart.tsx`
  - `apps/ti-studio/src/components/SpelerProfielDialog.tsx`
  - `apps/ti-studio/src/app/(protected)/personen/_components/SpelersOverzichtStudio.tsx`
- KNKV Competitie 2.0: leeftijdscategorieën zijn intern bepaald (niet 1:1 KNKV, OW heeft eigen aanpassingen)
- Werkitem model: `packages/database/prisma/schema.prisma` — `WerkitemStatus`, `WerkitemPrioriteit`
