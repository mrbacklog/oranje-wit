# HANDOVER — Team-/Selectie-presentatielaag (Coverflow)

> Voor de **volgende Claude-agent** die deze repo op een ander systeem binnenhaalt en
> dit verder bouwt. Lees dit eerst, daarna de design-spec.

## Wat is dit

Antjan (PO) wil een **nieuw menu-item/pagina in `apps/ti-studio`** (v1): een **team-/
selectie-presentatielaag** waarmee de TC **snel tussen teams schakelt** (coverflow-
carrousel) en per team **alle info netjes gepresenteerd** krijgt. **Read-only.**

Het ontwerp is in een brainstorm-sessie met de visual companion volledig uitgewerkt en
**door Antjan goedgekeurd**. Er is **nog geen app-code** geschreven — alleen design + prototype.

## Status

- ✅ Design goedgekeurd (navigatie-concept, interactie, detailpaneel, maatvoering).
- ✅ Prototype-mockups gemaakt (HTML, zie hieronder).
- ⛔ Nog te doen: implementatieplan (`writing-plans`) → bouwen → reviewen → mergen.

## Lees deze twee bestanden

1. **Design-spec (de bron):**
   `docs/superpowers/specs/2026-06-04-team-presentatie-coverflow-design.md`
   — bevat doel, plaatsing, het coverflow-concept (3 leesbaar, geen overlap), filter-opties,
   detailpaneel-inhoud, data/server-action, techniek-keuze, componentstructuur, open punten.
2. **Prototype (visueel):** map `prototype/` hiernaast. Open in een browser:
   - **`coverflow-groot.html`** ← **goedgekeurde eindversie** (grote schermen, center 430px,
     3 kaarten leesbaar, geen overlap, staf + opmerkingen).
   - `coverflow-v2.html` — compactere variant (geen overlap, 3 leesbaar).
   - `detailpaneel.html` — volledige inhoud van één center-kaart (spelers/staf/opmerkingen).
   - `filmstrip-filter.html` — de filterbalk-opzet.
   - `twee-in-beeld.html` — "vrij houden" → 2 teams half/half voor vergelijken.
   - `nav-aanpak.html` — de 3 oorspronkelijke navigatie-opties (context van de keuze).

   > Let op: dit zijn fragmenten uit de visual-companion; het echte effect zit in de
   > zelfstandige `<style>`-blokken (`.ow ...`). De carrousel rendert correct; alleen de
   > buitenste pagina-chrome is ongestyled als je ze los opent. `.superpowers/` is
   > **gitignored** — daarom staan deze kopieën hier in `docs/`.

## Volgende stap (concreet)

De brainstorm-fase is **klaar**. Begin **niet** opnieuw met brainstormen. Doe:

1. Lees de design-spec + bekijk `coverflow-groot.html`.
2. Invoke **`superpowers:writing-plans`** om een implementatieplan te schrijven o.b.v. de spec.
3. Bouw onder regie van de **`ux-designer`**-agent (visuele beslissingen) met **`frontend`**
   + **`ontwikkelaar`** (zoals de OW-conventies vereisen). Toets teamregels met **`regel-checker`**.
4. Verifieer met E2E waar zinvol; respecteer read-only (geen mutaties).

## Codebase-ankers (hergebruiken, niet opnieuw uitvinden)

| Wat | Pad |
|---|---|
| Menu/Ribbon (nieuw item toevoegen) | `apps/ti-studio/src/components/werkbord/Ribbon.tsx` |
| Route-handlers/shell | `apps/ti-studio/src/components/werkbord/TiStudioPageShell.tsx` |
| Team-detailkaart (stijl/structuur) | `apps/ti-studio/src/components/werkbord/TeamKaart.tsx` (o.a. `KNKV_KLEUR`, `bouwSubtitel`, `dedupeStaf`, `StafFooterIcoon`, `TrainerIcoon`) |
| Speler-render (avatar/badges/waas) | `apps/ti-studio/src/components/werkbord/SpelerKaart.tsx` |
| Leeftijdskleur-ring | `apps/ti-studio/src/components/werkbord/leeftijds-kleuren.ts` |
| Data (teams/spelers/staf+validatie) | `apps/ti-studio/src/app/(protected)/indeling/werkindeling-actions.ts` (`getWerkindelingVoorEditor`) |
| Team-config-acties (referentie datamodel) | `apps/ti-studio/src/app/(protected)/indeling/team-config-actions.ts` |
| Nieuwe route (aan te maken) | `apps/ti-studio/src/app/(protected)/presentatie/` |

## OW-conventies (niet vergeten)

- **Taal:** Nederlands. **Toon:** informeel/direct. Geen onnodige uitleg/recaps (zie `CLAUDE.md`).
- **`logger`** uit `@oranje-wit/types`, **nooit** `console.log`.
- **`rel_code`** is de enige stabiele speler-sleutel; nooit naam-matching.
- **Korfballeeftijd** via de centrale helpers (`berekenKorfbalLeeftijd`,
  `formatKorfbalLeeftijd`, peildatum uit seizoenscontext) — nooit zelf rekenen.
- **Server actions** retourneren `ActionResult<T>`; auth via `requireTC()`. Read-only hier.
- **Dark-first tokens**, nooit hardcoded kleuren.
- **Deploy:** `patch:`/`fix:` mag direct naar main; feature via PR (zie `CLAUDE.md`).
- **Carrousel-lib:** Swiper coverflow (zacht) of Embla+tween — kies in het plan (zie spec §8).

## Open punten (beslis in het plan)
1. Route-slug `/presentatie` vs `/teams`.
2. Swiper coverflow vs Embla + scale-tween.
3. Responsive breakpoints (center 430→500px).
4. Optionele mini-strip bovenaan (niet vereist v1).
5. Speler-chip extraheren als gedeelde component vs dupliceren.

## Oorspronkelijke vraag van Antjan (samengevat)
> Een extra menu-item/pagina in /ti-studio: een team/selectie-presentatielaag. Snel tussen
> teams scrollen/kiezen en alle info over een team netjes gepresenteerd. Houd rekening met de
> huidige uitstraling van /ti-studio (v1). Effect: een **coverflow** waarbij het midden naar
> voren komt en links/rechts kleiner maar leesbaar zijn — altijd 3 teams leesbaar, geen overlap.
