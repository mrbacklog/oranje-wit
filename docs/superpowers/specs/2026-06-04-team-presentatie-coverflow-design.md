# Team-/Selectie-presentatielaag — Coverflow — Design

**Datum:** 2026-06-04
**App:** `apps/ti-studio` (v1, Next.js 16, dark-first)
**Status:** Design goedgekeurd door Antjan (PO). Klaar voor implementatieplan (`writing-plans`) door volgende agent.
**Prototype:** `docs/superpowers/specs/2026-06-04-team-presentatie-coverflow/prototype/` — open `coverflow-groot.html` in een browser (goedgekeurde eindversie).

---

## 1. Doel & scope

Een nieuw menu-item/pagina in `apps/ti-studio` waarmee de TC **snel tussen teams kan
schakelen** en per team **alle informatie netjes gepresenteerd** krijgt.

- **Primair publiek:** TC, intern overzicht (tijdens/na het indelen). Niet primair een
  naar-buiten-communicatiemiddel, maar wél verzorgd genoeg om te tonen.
- **Interactie:** **puur read-only.** Geen drag-drop, geen mutaties. Wijzigen blijft op
  het Werkbord (`/indeling`).
- **Scherm:** draait doorgaans op **redelijk grote schermen** → ruime maatvoering.

### Out of scope (YAGNI)
- Bewerken/drag-drop vanuit deze laag.
- Export/print/deel-links (kan later).
- Mobiele-specifieke layout (later; v1 mikt op desktop/groot scherm).
- Doorklik-navigatie naar speler-/teamdetail (kan later als kleine uitbreiding).

---

## 2. Plaatsing in de app

- **Nieuw menu-item** in de Ribbon: `apps/ti-studio/src/components/werkbord/Ribbon.tsx`
  (voeg een `RibbonBtn` toe, naast Werkbord/Kader/Personen/Memo's/Sportlink).
- **Nieuwe route:** `apps/ti-studio/src/app/(protected)/presentatie/page.tsx`
  (werknaam `/presentatie`; definitieve slug bij implementatie bevestigen — alternatief
  `/teams`). Navigatie-handler in `TiStudioPageShell.tsx` zoals de bestaande routes.
- Auth: zelfde `(protected)` guard als de rest van ti-studio.

---

## 3. Navigatie-concept — Coverflow (center-mode)

Het kern-idee: een **coverflow / center-mode carrousel**. Het gefocuste team staat
**centraal op volle grootte**; links en rechts staan de buurteams **kleiner maar volledig
leesbaar**, met **ruimte ertussen (géén overlap)**. Daarbuiten "piepen" vervaagde
rand-kaartjes als hint dat er meer teams zijn.

**Harde eis (goedgekeurd):**
- Altijd **3 teams leesbaar** wanneer er 1 gecentreerd is (links-klein · center-groot · rechts-klein).
- **Geen overlap** tussen de kaarten — ruimte ertussen.
- Center, linker- én rechterkaart alle drie **leesbaar** (naam, kleur, ♀/♂, kernspelers, staf).

**Maatvoering (grote schermen):**
- Center-kaart **±430px** breed (volledige presentatie), kan op bredere schermen
  doorgroeien tot ~500px.
- Zijkaarten **±300px** op ~95% schaal.
- Responsive: schaal mee met viewport-breedte.

### Interactie
- **Muiswiel / scroll op de carrousel** = horizontaal sliden naar het volgende/vorige team.
- **Swipe / drag** = idem (touch + muis).
- **Klik op een zijkaart** = die naar het midden brengen.
- **Vrij houdbaar:** de band hoeft niet hard op één positie te snappen — je kunt bewust
  **tussen twee teams blijven hangen** (twee teams half/half in beeld) om te vergelijken.
  Loslaten bij een team brengt dat team netjes centraal. (Zie `twee-in-beeld.html`.)
- **Positie-indicator:** puntjes onderaan (actief = oranje streepje).

### Filmstrip-relatie
Het oorspronkelijke "filmstrip"-idee is **opgegaan in de coverflow zelf** — de carrousel
ís de filmstrip (de passerende kaarten zijn de strip-thumbnails én het detail tegelijk).
Een aparte mini-strip bovenaan is **optioneel** en niet vereist voor v1.

---

## 4. Filter (sticky bovenaan)

Eén sticky filterbalk boven de carrousel, **radio-stijl (één filter actief tegelijk)**,
gegroepeerd in drie blokjes met dunne scheidingslijntjes:

| Groep | Opties |
|---|---|
| **Categorie** | Alle teams · Senioren · Jeugd |
| **Selecties** | Selecties · Senioren selecties · Jeugd selecties |
| **Kleur (KNKV)** | Rood · Oranje · Geel · Groen · Blauw (elk met gekleurd bolletje) |

- Het actieve filter **narrowt de set teams** in de carrousel.
- Kleur-bolletjes gebruiken de bestaande `KNKV_KLEUR`-mapping (zie `TeamKaart.tsx`).
- "Selecties"-filters tonen `SelectieGroep`-items (zie §6).

---

## 5. Detailpaneel-inhoud (de center-kaart)

V1-kaartstijl hergebruiken — het lijkt op de bestaande **team/selectie-detailkaart** (de
detail-zoom op het Werkbord), aangevuld met staf-overzicht en opmerkingen.

**Header:**
- Gekleurde linker-strip (4–6px) + categorie-driehoek rechtsboven, kleur uit `team.kleur`.
- Teamnaam (groot, 700–800 weight) + ▲-indicator bij open memo's.
- Subtitel (uppercase, letterspaced): `formaat · kleur · niveau/poule` via `bouwSubtitel(team)`.
- Meta-pills: `♀ n` (pink), `♂ n` (blue), `Gem. X,Xj`, `⚠ n` aandachtspunten.

**Spelers (twee kolommen: Dames | Heren):**
- Per speler: avatar (foto via `speler.fotoUrl`, anders initialen), **leeftijdskleur-ring**
  (`leeftijdsKleur(leeftijd)`), geslachtskleur (pink/blue), naam, korfballeeftijd.
- Status-badges: `N` (nieuw), `?` (twijfelt), `AR` (algemeen reserve), geblesseerd-kruisje,
  `⚠` (gestopt), doorhaling bij "gaat stoppen" — hergebruik de logica/stijl uit
  `SpelerKaart.tsx`.
- **Korfballeeftijd** via de centrale helpers (`berekenKorfbalLeeftijd`,
  `formatKorfbalLeeftijd`) + peildatum uit de seizoenscontext. Nooit zelf rekenen.

**Staf-overzicht (onder de spelers — nieuw t.o.v. de werkbordkaart):**
- Duidelijke kaartjes (niet alleen het footer-icoon): avatar/initialen, naam, **rol**.
- Groen accent (zoals de bestaande `StafFooterIcoon`).
- Dedupe bij selecties (gedeelde staf één keer) — zie `dedupeStaf()` in `TeamKaart.tsx`.

**Opmerkingen (teamniveau — nieuw):**
- Notitie-blokjes met oranje linker-accent: besluiten + open werkitems uit het
  **memo-systeem** (`/memo`). Toon meta (bron · type · datum) + tekst. Read-only.

**Zijkaarten (kleiner, ±300px):** zelfde structuur maar compacter — naam, subtitel,
meta-pills, een handvol kernspelers (1 kolom), beknopt staf-overzicht. Géén opmerkingen-blok.

---

## 6. Selectie vs team

- **Team** = losse eenheid (viertal/achttal). **Selectie** (`SelectieGroep`) = bundel van
  teams die spelers/staf kunnen delen (`gebundeld`-flag).
- In de carrousel is een **gebundelde selectie één kaart** die de gedeelde pool toont
  (dames/heren over de selectie), met de selectie-staf.
- Een **ongebundelde** selectie toont de teams afzonderlijk (elk een eigen kaart), maar de
  filters "Selecties / Sen. selecties / Jeugd selecties" groeperen ze.
- Datamodel: `SelectieGroep.gebundeld` → spelers via `SelectieSpeler/SelectieStaf` (gebundeld)
  of `TeamSpeler/TeamStaf` (los). Zie `apps/ti-studio/CLAUDE.md` (business rule 2026-04-14).

---

## 7. Data

Eén nieuwe server-action, bv. `getTeamsVoorPresentatie()` in
`apps/ti-studio/src/app/(protected)/presentatie/actions.ts`, die per team/selectie levert:
- teamnaam, kleur, categorie, teamType (viertal/achttal), niveau/poule, volgorde;
- spelers (dames/heren) met `rel_code`, roepnaam/achternaam, geslacht, geboortedatum/-jaar,
  `fotoUrl`, status, `isNieuw`, huidigTeam;
- staf met naam + rol (gededupeerd voor selecties);
- afgeleiden: ♀/♂-aantallen, gemiddelde korfballeeftijd, validatie-/aandachtspunt-telling,
  open-memo-telling;
- opmerkingen/werkitems op teamniveau.

Hergebruik bestaande bronnen: `getWerkindelingVoorEditor()` (teams/spelers/staf + validatie)
en de memo-queries. **`rel_code`** is de enige speler-sleutel. Read-only — geen mutatie-acties.

---

## 8. Techniek — carrousel-bibliotheek

Het coverflow-effect heet **Coverflow** (center slide groot+vooraan, buren kleiner/weggedraaid).

- **Aanbeveling: Swiper.js** met `effect: "coverflow"`, `centeredSlides: true`,
  `slidesPerView: 3` (of `"auto"`). Voor "3 leesbaar, geen overlap" → **zacht instellen**:
  lage `rotate` (0–15°), vooral `scale` + lichte `depth`, voldoende `stretch`/spacing zodat
  kaarten elkaar niet overlappen. (`slideShadows` optioneel.)
- **Alternatief: Embla Carousel** (~7KB, engine onder shadcn/ui) — géén native coverflow,
  maar via de scroll-progress API een scale/opacity-tween op de buren. Lichter/dependency-arm,
  maar meer maatwerk voor het effect.
- **Keuze bij implementatie bevestigen.** Default = Swiper coverflow (zacht), tenzij
  bundle-grootte zwaar weegt → dan Embla + tween.
- **Drag-drop conflict:** N.v.t. — deze laag is read-only. (apps/ti-studio v1 gebruikt elders
  HTML5 native drag-drop; niet relevant hier.)

---

## 9. Design-systeem / hergebruik

- Dark-first tokens uit `packages/ui/src/tokens/` + `apps/ti-studio/.../werkbord/tokens.css`.
  **Nooit hardcoded kleuren** — `var(--ow-*)` / bestaande CSS-vars.
- Hergebruik bestaande visuele bouwstenen i.p.v. nieuw uitvinden:
  - `KNKV_KLEUR`-mapping + `bouwSubtitel(team)` (uit `TeamKaart.tsx`).
  - `leeftijdsKleur()` (uit `leeftijds-kleuren.ts`) voor de avatar-ring.
  - Speler-render-logica/stijl uit `SpelerKaart.tsx` (avatar, badges, statuswaas).
  - Staf-stijl + `dedupeStaf()` + `TrainerIcoon` uit `TeamKaart.tsx`.
- Overweeg de speler-render te extraheren naar een herbruikbare presentatie-component zodat
  werkbord én presentatielaag dezelfde chip delen (DRY — maar alleen als het netjes kan; geen
  geforceerde refactor).

---

## 10. Componentstructuur (voorstel)

```
apps/ti-studio/src/app/(protected)/presentatie/
├── page.tsx                      # server component: haalt data, rendert client-carrousel
├── actions.ts                    # getTeamsVoorPresentatie()
└── _components/
    ├── PresentatieCarousel.tsx   # client: coverflow (Swiper/Embla) + filter-state + sync
    ├── PresentatieFilterBar.tsx  # sticky radio-filter (categorie/selecties/kleur)
    ├── TeamPresentatieKaart.tsx  # center/side variant (fidelity-prop)
    ├── SpelerPresentatieRij.tsx  # speler-chip (evt. gedeeld met werkbord)
    └── StafPresentatieLijst.tsx  # staf-kaartjes met rol
```

Ribbon + shell: `Ribbon.tsx` (menu-item) en `TiStudioPageShell.tsx` (route-handler).

---

## 11. Open punten voor de implementatie-agent
1. Definitieve route-slug: `/presentatie` of `/teams`.
2. Swiper coverflow (zacht) **of** Embla + tween — kies en motiveer bij het plan.
3. Exacte breakpoints voor de responsive maatvoering (center 430→500px).
4. Wel/niet een optionele mini-strip bovenaan (niet vereist voor v1).
5. Speler-chip extraheren als gedeelde component, of bewust dupliceren.
