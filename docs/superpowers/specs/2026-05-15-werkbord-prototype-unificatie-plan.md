# Werkbord Prototype Unificatie Plan
**Datum**: 2026-05-15
**Status**: Analyse gereed, implementatie wacht op PO-beslissingen (zie §8)
**Bronnen**: `docs/superpowers/prototypes/team-weergave/` + `docs/superpowers/prototypes/speler-weergave/`
**Doel**: v2-implementatie (`apps/ti-studio-v2/.../indeling/`) matchen met definitieve prototypes

---

## 1. Token-verschillen

### Speler-weergave tokens (proto: `speler-weergave/tokens.css` → v2: `globals.css`)

| Token | Waarde in proto | Status in v2 |
|---|---|---|
| `--surface-page` | *(niet in proto, maar gebruikt)* | Aanwezig: `#0f1115` (licht afwijkend van proto's context) |
| `--surface-card` | *(niet in proto, maar gebruikt)* | Aanwezig: `#1a1d23` |
| `--surface-sunken` | `#090910` (proto body-bg) | Aanwezig: `#090910` |
| `--font-body` | `-apple-system, system-ui, ...` | Ontbreekt als token — v2 gebruikt `"Inter"` direct in body |
| `--font-sans` | `-apple-system, system-ui, ...` | Ontbreekt |
| `--font-mono` | `ui-monospace, "SF Mono", ...` | Ontbreekt |
| `--status-beschikbaar` | `#f5f5f7` | Ontbreekt (alleen outline aanwezig) |
| `--status-nieuw` | `#ffffff` | Ontbreekt (alleen outline aanwezig) |
| `--status-twijfelt` | `#fdba74` | Ontbreekt (alleen outline aanwezig) |
| `--status-stopt` | `#dc2626` | Ontbreekt (alleen outline aanwezig) |
| `--status-ar` | `#94a3b8` | Ontbreekt (alleen outline aanwezig) |
| `--val-ok-bg` | `rgba(16,185,129,.08)` | Ontbreekt |
| `--val-ok-border` | `rgba(16,185,129,.35)` | Ontbreekt |
| `--val-warn-bg` | `rgba(245,158,11,.08)` | Ontbreekt |
| `--val-warn-border` | `rgba(245,158,11,.40)` | Ontbreekt |
| `--val-err-bg` | `rgba(239,68,68,.08)` | Ontbreekt |
| `--val-err-border` | `rgba(239,68,68,.40)` | Ontbreekt |
| `--memo-risico` | `#a16207` | Ontbreekt |
| `--memo-opgelost` | `#44403c` | Ontbreekt |
| `--corner-compact` | `13px` | Ontbreekt — memo-corner zit niet in v2 |
| `--corner-normaal` | `18px` | Ontbreekt |
| `--corner-rijk` | `22px` | Ontbreekt |
| `--corner-hero` | `36px` | Ontbreekt |
| `--corner-hover` | `28px` | Ontbreekt |
| `--leeftijd-4` t/m `--leeftijd-19` | 19 gradient-strings | Ontbreekt volledig — v2 gebruikt vaste kleuren via JS-switch |
| `--rij-width` | `320px` | Ontbreekt |
| `--rij-height` | `52px` | Ontbreekt |
| `--rij-avatar` | `40px` | Ontbreekt |
| `--rij-leeftcol` | `40px` | Ontbreekt |
| `--rij-gap` | `10px` | Ontbreekt |
| `--rij-border-radius` | `6px` | Ontbreekt |
| `--rij-border-width` | `1.5px` | Ontbreekt |
| `--drawer-padding-x` | `10px` | Ontbreekt |
| `--drawer-scrollbar` | `7px` | Ontbreekt |
| `--drawer-width` (berekend) | `calc(...)` | V2 gebruikt inline `--drawer-width` per drawer |
| `--team-border` | `#2a2a2e` | Ontbreekt |
| `--team-text` | `#b8b8bd` | Ontbreekt |
| `--indeling-border` | `rgba(255,107,0,.4)` | Ontbreekt |
| `--indeling-bg` | `rgba(255,107,0,.12)` | Ontbreekt |
| `--indeling-text` | `#ff6b00` | Ontbreekt |
| USS-tier tokens (6×) | goud/zilver/brons/geen border+fill+text | Ontbreekt volledig |

### Team-weergave tokens (proto: `team-weergave/tokens.css` → v2: `globals.css`)

| Token | Waarde in proto | Status in v2 |
|---|---|---|
| `--team-card-viertal` | `220px` | Verschilt — v2 gebruikt `calc(var(--col-basis) + 24px)` ≈ 209px |
| `--team-card-achttal` | `380px` | Verschilt — v2: `calc(var(--col-basis) * 2 + 1px + 24px)` ≈ 395px |
| `--team-card-selectie` | `760px` | Ontbreekt — selectie-kaart niet gebouwd in v2 |
| `--selectie-accent` | `#94a3b8` | Ontbreekt als token (v2 gebruikt hardcoded `rgba(148,163,184,...)`) |
| `--selectie-border` | `rgba(148,163,184,.45)` | Ontbreekt |
| `--selectie-bg` | `rgba(148,163,184,.04)` | Ontbreekt (v2 gebruikt `rgba(148,163,184,0.04)` inline) |
| `--selectie-frame-shadow` | compound shadow | Ontbreekt |
| `--selectie-badge-bg` | `rgba(148,163,184,.12)` | Ontbreekt |
| `--selectie-badge-text` | `#cbd5e1` | Ontbreekt |
| `--staf-naam-color` | `#e2e8f0` | Ontbreekt — v2 gebruikt `var(--text-primary)` |
| `--staf-rol-text` | `rgba(255,180,100,.7)` | Aanwezig in v2 |
| Selectie-varianten (`sel-oranje`, `sel-rood`, `sel-zilver`) | 4×6 CSS variabelen | Ontbreekt volledig |

**Samenvatting**: ~45 tokens uit de prototypes ontbreken volledig in v2. De aanwezige tokens zijn grotendeeld correct maar de `--leeftijd-*` gradients en alle USS-tier tokens zijn het meest impactvol voor visuele correctheid.

---

## 2. Team-kaart

### Compact zoom-niveau

| Aspect | Prototype | v2 | Delta |
|---|---|---|---|
| Chip-breedte | `auto` (wrappend) | `width: 100%` (vult kolom) | Groot verschil — chips strekken zich uit in v2, proto toont variabele-breedte chips |
| Naam-formaat in chip | `roepnaam` + afgekorte achternaam-initiaal | Alleen `roepnaam` | Ontbreekt — spec §3.1 vereist `"Freek vd L."` |
| Geslacht-dot | 8×8 kleurblokje links in chip | Aanwezig, correct | Gelijk |
| Leeftijdbar | 5px rechts, KNKV-gradient | Aanwezig maar solid kleur (JS-switch, niet gradient) | Gradient ontbreekt |
| Memo-badge | Post-it hoek linksboven (13px) op chip | Ontbreekt volledig | Blocker |
| Stopt-styling | `line-through` + 0.7 opacity | Ontbreekt | Ontbreekt |
| AR-styling | naam in `#a8a8ad`, niet draggable | Ontbreekt | Ontbreekt |
| Status-nieuw | `rgba(255,255,255,.85)` outline | Alleen als default beschikbaar | Gedeeltelijk |

### Detail zoom-niveau (rijke rij in kaart)

| Aspect | Prototype | v2 | Delta |
|---|---|---|---|
| Avatar-foto | `.sq-av` met grayscale foto, gender-L overlay | `sq-av` class aanwezig in CSS maar DetailRij gebruikt geslachts-blokje (8px breed) in plaats van foto-avatar | Groot verschil — v2 gebruikt kleurband i.p.v. foto |
| Naam-formaat | `roepnaam + tussenvoegsel + achternaam` | Correct geïmplementeerd | Gelijk |
| Team-badges | `.tb` (huidig) + `.tb-i` (indeling) in rij-2 | Aanwezig in CSS (`.tb`, `.tb-i` classes) maar niet gevuld in DetailRij | Ontbreekt in DetailRij render |
| Leeftijdkolom decimal | `JJ` groot + `.DD` klein (2 decimalen) | JJ aanwezig, maar `.ld` toont `"jr"` i.p.v. `.DD` decimaal | Verschil |
| Memo-corner | Post-it hoek linksboven (18px) | Ontbreekt | Blocker |
| USS-hexagon | 32×28 hexagon met tier-kleur | Ontbreekt | Ontbreekt |
| Status-outline | 1.5px border op container | Aanwezig via `--status-color` | Grotendeels correct |
| Geblesseerd-badge | Rood kruis badge rechts-onder foto | Ontbreekt | Ontbreekt |
| Nieuw-lid sparkle | Oranje sparkle badge rechts-boven foto | Ontbreekt | Ontbreekt |

### Kaart-structuur generiek

| Aspect | Prototype | v2 | Delta |
|---|---|---|---|
| Validatie-hoek | Driehoek rechtsboven IN kaart + symbolen (max 2 per rij) | Driehoek aanwezig, GEEN symbolen | Symbolen ontbreken |
| Gender-tellers header | Twee `.tk-gender-count` chips met SVG icoon | V2 toont getal-only via `totaal` | Prototype toont ♀/♂ apart met counts |
| OWTeamType-categorisering | `JEUGD`/`SELECTIE`/`SENIOREN`/`OVERIG` enum → bepaalt kleurband | V2 gebruikt `categorie: "B_CATEGORIE"|"A_CATEGORIE"|"SENIOREN"` met aparte `kleur` veld | Mapping verschilt — proto's `OWTeamType` vs v2's `categorie` |
| Subtitel in header | `cat + niveau` samengesteld | V2 heeft `bouwSubtitel()` met vergelijkbare logica | Grotendeels gelijk, maar v2 heeft geen `JEUGD`/`SELECTIE` type-label |
| Selectie-kaart (gebundeld) | Aparte `.selectie-kaart` wrapper (760px) met `sel-badge` + 4 kolommen | Niet aanwezig in v2 | Volledig ontbreekt |
| Selectie-frame (niet-gebundeld) | `.selectie-frame` rond meerdere losse kaarten | Aanwezig als `.td-selectie` in TeamsDrawer maar NIET op canvas | Op canvas ontbreekt |
| Card-label onder kaart | "Petra K." label onder tile (kaart-wrap-label) | Ontbreekt | PO-beslissing vereist |
| Foto-avatars in detail-mode | Echte spelerfoto's (`<img>`) in `.tk-rijke-rij .sq-av` | Geen foto — geslachtsband gebruikt | Foto's ontbreken (zie §8) |

---

## 3. Team-drawer (linker panel — TeamsDrawer)

| Aspect | Prototype (team-drawer.html) | v2 TeamsDrawer | Delta |
|---|---|---|---|
| Breedte | 280px | 280px | Gelijk |
| Positie | Rechts in v2 (`.rechts`) | Links in proto | V2 heeft drawer rechts, dat kan PO-keuze zijn |
| Groeperings-headers | `.td-group` met kleurband-indicator (paars/blauw/etc.) per KNKV-categorie | Niet aanwezig — selectie-blokken hebben alleen naam-label | Groep-headers per categorie ontbreken |
| Statistieken per team-rij | `♀3 ♂3 USS⌀72 gem.14.2` inline naast naam | v2: alleen spelerteller en val-dot | Statistieken ontbreken |
| Selectie-header-stats | `♀9 ♂9` totalen in selectie-blok header | Ontbreekt | Ontbreekt |
| Bundel-toggle | Visueel zichtbaar in `td-selectie` | In v2 tonen selectiegroepen het label "gebundeld" als badge | Interactieve toggle ontbreekt (zie §8) |
| Footer-statistieken | `Ingedeeld X/Y · ♀Z · ♂W` uitgebreid | V2: alleen `X/Y` | ♀/♂ uitsplitsing ontbreekt |
| Active-state team-rij | Oranje background + border | Aanwezig via `.wb-team-rij.active` | Gelijk |
| `icon-btn` sluiten | Explicit sluit-button rechtsboven header | Ontbreekt in v2 | Ontbreekt |

---

## 4. Team-detail-drawer (rechter 420px zijbalk)

| Aspect | Prototype (team-detail-drawer.html) | v2 TeamDetailDrawer | Delta |
|---|---|---|---|
| Breedte | 420px | 290px | 130px te smal |
| Hero-sectie | `tdd-hero`: naam 22px, subtitle, ♀/♂ counts, val-dot, kleurband links + gradient bg | V2: platte header met naam + val-dot punt — geen gradient, geen gender-counts | Groot verschil |
| Kleurband gradient | `linear-gradient(180deg, rgba(cat-kleur,.12) → transparent)` per categorie | Ontbreekt | Ontbreekt |
| Spelerweergave in lijst | Gebruik van `.normaal-rij` (rijke-rij light) per speler | V2: simpele `div` met naam + leeftijd tekst, geen avatar, geen status-outline | Groot verschil |
| Validatie-items | `.val-item` kaartjes met ok/warn/err styling (icon + regel + omschrijving) | V2: simpele div met rode background per melding — geen ok/warn-variant | Incompleet |
| Staf-weergave | `staf-rij` (naam+rol, 40px, oranje border) | V2: naam + rol-badge, vergelijkbaar maar andere stijl | Gedeeltelijk |
| Selectie-koppeling sectie | "Selectie: U15" met bundel-toggle + ontkoppel-actie | Ontbreekt volledig | Ontbreekt |
| Actie-knoppen footer | `tdd-btn` rij: Bewerken + Verwijderen | Ontbreekt | Ontbreekt |
| Sluit-knop | `tdd-close` absoluut rechtsboven | V2: terugknop (←) in header | Andere UX — terug vs. sluiten |

---

## 5. Team-dialoog

| Aspect | Prototype (team-dialog.html) | v2 | Delta |
|---|---|---|---|
| Component bestaat | Ja — `TeamDialog`, 560×640px, 3 tabs | **Niet aanwezig in v2** | Volledig ontbreekt |
| Tabs | Overzicht / Validatie / Notities | — | — |
| Hero | Naam + subtitle + ♀/♂ stats + val-badge + categorie-kleur gradient | — | — |
| Tab Overzicht | 2-kolom grid: rijke rijen dames / heren | — | — |
| Tab Validatie | `.val-item` kaartjes gesorteerd ERR→WARN→OK | — | — |
| Tab Notities | Notitieveld (placeholder) | — | — |
| Openbare interactie | Klik op header team-kaart opent dialog | V2: klik op header opent TeamDetailDrawer | Architectuurkeuze — zie §8 |

---

## 6. Speler-weergave 6 contexten

### Context 1 — Compact chip (werkbord canvas)

| Aspect | Prototype (compact-chip.html) | v2 CompactChip (in TeamKaart) | Delta |
|---|---|---|---|
| Naam-formaat | `roepnaam + afgekorte tvs + achternaam-initiaal` | Alleen `roepnaam` | Ontbreekt |
| Nieuw-lid sparkle | Oranje SVG-sparkle na sexe-dot | Ontbreekt | Ontbreekt |
| Memo-attention icoon | 14×14 notitieblok-icoon inline | Ontbreekt | Ontbreekt |
| USS-hexagon | Niet in compact (enkel leeftijdbar) | Ontbreekt ook — correct | Gelijk |

### Context 2 — Normaal rij / Rijke rij

| Aspect | Prototype (rijke-rij.html) | v2 WbSpelerRij / DetailRij | Delta |
|---|---|---|---|
| Component | `WbSpelerRij` + css-klasse `wb-speler-rij` | Aanwezig | Structureel anders dan proto |
| Avatar | `.sq-av` foto (40×52 aaneengesloten links, status-outline als border-right) | V2 `.av` div met `overflow:hidden` — GEEN foto, gebruik van kleurband of initialen | Foto ontbreekt |
| Naam-formaat | Proto normaal-rij: `roepnaam + afgekort tvs + achternaam` | V2: `roepnaam + achternaam` (geen tussenvoegsel-afkorting) | Afkorting ontbreekt |
| Leeftijdkolom | Gradient-achtergrond uit `--leeftijd-*` tokens | Solid kleur uit JS-switch | Gradient ontbreekt |
| Team-badges | `.tb` + `.tb-i` | In `.wb-speler-rij .sub .tb` aanwezig maar één badge — geen indeling-accent | `.tb-i` ontbreekt |
| Memo-corner | Post-it hoek 18px | Ontbreekt | Ontbreekt |
| USS-hexagon | Rechts naast leeftijdkolom (32×28) | Ontbreekt | Ontbreekt |
| Breedte container | `--rij-width: 320px` | `width: 100%` in drawer | Flexibel vs. vast |

### Context 3 — Hover-kaart

| Aspect | Prototype (hover-kaart.html) | v2 HoverKaartSpeler | Delta |
|---|---|---|---|
| Component bestaat | Ja | Ja — `HoverKaartSpeler.tsx` | Aanwezig |
| Afmeting | 200×300px | 200px breed, geen vaste hoogte (overflow) | Hoogte verschilt |
| Border | 3px gradient-border via `::before` pseudo (leeftijdkleur) | Solid `2px ${accentKleur}44` | Geen gradient-border |
| Glow-pulse animatie | CSS-animation `idle-pulse` + `glow-pulse` on hover | Alleen static `box-shadow` | Animaties ontbreken |
| Noise texture | `::before` noise-overlay | Ontbreekt | Ontbreekt |
| Naam-formaat | ROEPNAAM uppercase groot / tussenvoegsel+achternaam klein | Één regel volledige naam | Hiërarchie ontbreekt |
| USS-hexagon | 54×48, overlap rechts-onder | Ontbreekt | Ontbreekt |
| Leeftijdkleur in header | `textShadow: 0 0 20px accentKleur` | Aanwezig | Gelijk |
| Foto-area | Groot vlak (grayscale met sexe-overlay) | Ontbreekt — alleen naam/stats | Foto-gebied volledig absent |
| Positionering | 400ms hover-delay (spec) | 300ms delay | Klein verschil |

### Context 4 — Speler-dialoog

| Aspect | Prototype (speler-dialog.html) | v2 SpelerDialog | Delta |
|---|---|---|---|
| Component exists | Ja | Ja — `SpelerDialog.tsx` in `/components/personen/spelers/` | Aanwezig |
| Hero-header | Groot foto + naam-hiërarchie (roepnaam GROOT, tussenvoegsel gedimpt, achternaam) | Verschilt (niet verder geïnspecteerd) | Nader te analyseren |
| USS-hexagon | Zichtbaar in hero | Onbekend in v2 | Nader te analyseren |
| Memo-corner | 36px post-it hoek | Onbekend in v2 | Nader te analyseren |
| Tabs | Team/Scores/Memo tabs in proto | Onbekend | Nader te analyseren |

*SpelerDialog.tsx is groot — apart analyse-traject aanbevolen als iteratie C.*

### Context 5 — Tabel-rij

| Aspect | Prototype (tabel-rij.html) | v2 SpelersTabelRij | Delta |
|---|---|---|---|
| Component bestaat | Ja | Ja — `SpelersTabelRij.tsx` | Aanwezig |
| `.sq-av` avatar | 40×52 foto-avatar links | V2: initialen-div (kleur `--staf-accent-dim`) | Foto ontbreekt, fallback-stijl verschilt |
| Memo-kolom | Icoon + statustekst (`● Open`, etc.) | `MemoCel.tsx` — onbekende implementatie | Vergelijking vereist |
| USS-hexagon kolom | Aanwezig | Onbekend | Nader te analyseren |
| Gezien-kolom | `GezienCel.tsx` | `GezienCel.tsx` aanwezig | Waarschijnlijk gelijk |
| Naam-formaat | Volledige naam (`rijke-rij` stijl) | Grotendeels aanwezig | Tussenvoegsel-afkorting ontbreekt |
| Status-border-left | 3px links, status-kleur | Aanwezig via `borderLeft: 3px solid var(--status-color)` | Gelijk |

### Context 6 — Spelerpool-drawer

| Aspect | Prototype (spelerpool-drawer.html) | v2 SpelersPoolDrawer | Delta |
|---|---|---|---|
| Drawer breedte | `var(--drawer-width)` berekend ~357px | 260px | Te smal (97px korter) |
| Speler-rij stijl | Rijke rij variant (normaal-rij) | `WbSpelerRij` / `wb-speler-rij` — eigen CSS-klasse, geen normaal-rij | Andere class-structuur |
| Zoekfunctie | Aanwezig | Aanwezig | Gelijk |
| Filterchips | Aanwezig | Aanwezig | Gelijk |
| Staf-sectie in drawer | Aparte `StafPoolDrawer` naast spelerpool | V2 heeft aparte `StafPoolDrawer.tsx` | Gelijk qua architectuur |
| Foto-avatars | `.sq-av` in rijke rij | Ontbreekt | Foto ontbreekt |

---

## 7. Implementatie-prioriteit

### Iteratie A — Tokens + Kaart-fundamenten (hoogste visuele impact)

1. **Leeftijdgradient-tokens** toevoegen aan `globals.css` (`--leeftijd-4` t/m `--leeftijd-19`)
2. **Validatie-tokens** toevoegen (`--val-ok-bg`, `--val-ok-border`, etc. — 6 tokens)
3. **Indeling + team-badge tokens** (`--indeling-border`, `--indeling-bg`, `--indeling-text`, `--team-border`, `--team-text`)
4. **USS-tier tokens** (24 tokens in 4 groepen)
5. **CompactChip**: naam-formaat uitbreiden (roepnaam + afgekorte tvs + initiaal); gradient leeftijdbar
6. **DetailRij**: leeftijdkolom decimaal weergeven (`.DD` i.p.v. `"jr"`); team-badges in rij-2 renderen
7. **TeamKaart header**: gender-tellers opsplitsen naar ♀/♂ counts
8. **TeamKaart validatie-hoek**: symbolen toevoegen (max 2, wit SVG)

*Tijdsinschatting: 1 dag. Blokt: geen PO-beslissingen vereist.*

### Iteratie B — Avatar-systeem + Drawers (vereist foto-strategie besluit)

1. **`sq-av` foto-avatar** uitbreiden: `<img>` met fallback initialen, gender-L overlay via `::before` conform spec. Koppeling aan `LidFoto` model (zie §8).
2. **DetailRij**: kleurband vervangen door `sq-av` foto-avatar
3. **WbSpelerRij**: klasse upgraden naar `normaal-rij` conform proto, incl. `.tb-i` indeling-badge
4. **Memo-corner**: PostItHoek primitive bouwen + integreren in CompactChip, DetailRij, WbSpelerRij
5. **TeamDetailDrawer**: breedte 290px → 420px; hero-sectie met kleurband-gradient; spelerlijst upgraden naar normaal-rij; val-item kaartjes; staf-rij; actie-knoppen footer
6. **TeamsDrawer**: groepsheaders per KNKV-categorie; statistieken per team-rij; ♀/♂ in footer
7. **SpelersPoolDrawer**: breedte 260px → ~357px (proto-breedte)
8. **Selectie-frame op canvas**: `.selectie-frame` wrapper rond losse teams in dezelfde selectiegroep

*Tijdsinschatting: 2-3 dagen. Blokt: foto-besluit (§8.1), bundel-toggle (§8.3).*

### Iteratie C — Dialogen + Hover-animaties + SpelerDialog audit

1. **TeamDialog component** bouwen (560×640px, 3 tabs: Overzicht/Validatie/Notities)
2. **HoverKaartSpeler**: gradient-border via pseudo; noise-texture; idle-pulse + glow-pulse animaties; naam-hiërarchie (ROEPNAAM groot / tvs+achternaam klein); foto-vlak
3. **USS-hexagon primitive** bouwen en integreren in DetailRij (32×28) en HoverKaartSpeler (54×48)
4. **SpelerDialog** audit en align met proto
5. **Geblesseerd-badge** + **Nieuw-lid sparkle** toevoegen op `sq-av`

*Tijdsinschatting: 2 dagen. Blokt: TeamDialog architectuurkeuze (§8.4).*

---

## 8. Open punten voor PO

### 8.1 Foto-avatars: schema bestaat, koppeling ontbreekt

**Situatie**: `LidFoto` model bestaat in Prisma (`lid_fotos` tabel, `imageWebp: Bytes`). `Speler` model heeft relatie `foto LidFoto?`. Er is echter geen `fotoUrl: string` veld — foto's worden als binaire bytes opgeslagen. De huidige v2-implementatie gebruikt overal initialen (tekst-fallback).

**Beslissing vereist**:
- Optie A: Foto's opvragen via een `/api/foto/[relCode]` route (bytes → webp response). Elke avatar doet een HTTP-request.
- Optie B: Foto's uitsluiten voor nu; initialen-fallback opwaarderen naar ontwerp uit proto (zie `sq-av` met initialen-stijl).
- Optie C: fotoUrl preloaden als data-URL in server component.

**Impact op iteratie B**: dit is de grootste blocker. Zonder beslissing kunnen `sq-av` foto-avatars niet geïmplementeerd worden.

### 8.2 Card-label onder team-kaart

Prototypes tonen een label onder elke kaart-tile (bv. "Petra K." als naam van de trainer). In v2 staat dit label nergens. **Vraag**: tonen of weglaten? Zo ja, welk veld — staf-lid naam, team-eigenaar?

### 8.3 Bundel-toggle in drawer

Proto toont de toggle actief in het selectie-blok (gebundeld/losse teams schakelbaar). V2 toont alleen een statische "gebundeld" badge. **Vraag**: bundeling wijzigen via de drawer (server action), of alleen read-only weergeven in v2?

### 8.4 Klik op team-kaart header: drawer of dialog?

Proto heeft een aparte `team-dialog.html` (560×640) als primary detail-view. V2 opent de `TeamDetailDrawer` (rechter zijbalk) bij header-klik. **Vraag**: willen we een modal-dialog implementeren (proto), of de rechter drawer upgraden naar 420px + hero (sneller te bouwen)?

Advies: drawer upgraden is minder architectuurwijziging en voldoet voor dagelijkse TC-workflows. Dialog reserveren voor fase na launch.

---

## Samenvatting blocker-afhankelijkheden

```
PO-beslissing §8.1 (foto's) ──► Iteratie B avatars
PO-beslissing §8.3 (bundel) ──► Iteratie B drawers
PO-beslissing §8.4 (dialog) ──► Iteratie C TeamDialog
Iteratie A (tokens + kaart)  ──► Iteratie B + C
```

Plan staat in `docs/superpowers/specs/2026-05-15-werkbord-prototype-unificatie-plan.md`.
