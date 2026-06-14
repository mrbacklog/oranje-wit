# Publieke Teamindeling Weergave — Design Spec

**Datum:** 2026-06-14  
**Status:** Goedgekeurd prototype  
**App:** `apps/ti-studio` (nieuw publiek pad, geen auth vereist)

---

## Doel

Een publiek toegankelijke, mooie online weergave van de teamindeling zodat leden, ouders en begeleiders snel hun team kunnen vinden — als alternatief en aanvulling op de PDF.

---

## Pagina-structuur

De weergave bestaat uit **twee pagina's** die client-side wisselen (geen routing):

### 1. Toelichting (startpagina)
- Donkere hero-banner met 100-jaar logo, seizoenslabel en de titel "Teamindeling 2026–2027"
- Vrije tekst (voor- en nawoord) — zelfde tekst als in de PDF-toelichting
- Auteur-regel ("— De Technische Commissie")
- Grote primaire knop: **"Ga naar de teamindeling →"**

### 2. Teamindeling
- Sticky header met 100-jaar logo, seizoenslabel, "Toelichting"-knop (terugknop) en "Zoek naam"-knop
- Voortgangsbalk (dunne oranje balk, toont positie in de teamreeks)
- Teamkaart (zie hieronder)
- Vaste navigatie-footer (zie hieronder)

---

## Teamkaart

Eén team tegelijk, fullscreen-breedte kaart. Drie varianten:

### Normaal team
- **Header** (donker, oranje border-bottom): teamnaam groot + meta-badges (type, aantal dames/heren)
- **Body**: twee kolommen — ♀ Dames en ♂ Heren, alfabetisch op voornaam
- **Staf-sectie**: pills met rol · naam

### Selectie — gecombineerde pool (`gebundeld = true`)
- **Header** (donker, geel border-bottom + "Selectie"-label): naam + badges met uitkomst-teams (→ C1, → C2)
- **Info-banner** (geel kader): uitleg dat uit deze pool de teams worden gevormd
- **Body**: gecombineerde spelerslijst dames/heren, alfabetisch op voornaam
- **Staf-sectie** idem

### Selectie — gesplitste pool (`gebundeld = false`)
- **Header** (donker, geel border-bottom): naam + badges per sub-team (→ D1, → D2)
- **Info-banner**: uitleg dat verdeling voorlopig is
- **Per sub-team** een blok met eigen dot + naam + spelers + staf, gescheiden door een lijn

---

## Volgorde van teams

Teams worden gesorteerd op het `volgorde`-veld, exact zoals `groepeerTeams()` in `TeamDrawer.tsx` dat doet (`sort((a,b) => a.volgorde - b.volgorde)`). Selectie-groepen verschijnen op de plek van het eerste team in die groep.

**Geen categorietabs** — één doorlopende reeks.

---

## Vaste navigatie-footer

Altijd onderaan het scherm (`position: fixed; bottom: 0`):
- **← Vorig** knop links (disabled op eerste team)
- **Midden**: `x / n` teller + teamnaam + dot-navigatie (één dot per team, selectie-dots geel)
- **Volgend →** knop rechts (disabled op laatste team)
- Toetsenbord: `←` / `→` pijltjes navigeren tussen teams

---

## Zoeken op naam

- Knop "🔍 Zoek naam" in de header (of `Ctrl+K`)
- Overlay met zoekvenster
- Zoekt over alle teams, inclusief sub-teams van gesplitste selecties
- Resultaat toont naam + teamnaam; klikken springt direct naar dat team
- Selectie-resultaten hebben een geel bolletje

---

## Design

- **Stijl:** Clean Minimal — wit met oranje accenten
- **Logo:** 100-jaar logo (`https://ckvoranjewit.nl/wp-content/uploads/2025/12/OW-100-logo-lexvg.webp`)
- **Primaire kleur:** `#ff6600`
- **Selectie-accent:** `#eab308` (geel)
- **Header border-bottom:** 3px `#ff6600`
- **Mobile-first:** navigatie-footer altijd bereikbaar, spelers-grid wordt één kolom onder 560px, header vereenvoudigt op mobiel

---

## Speler-weergave

- Alleen naam (voornaam + tussenvoegsel + achternaam)
- **Geen** badges, statussen of "Nieuw"-labels
- Alfabetisch gesorteerd op voornaam

---

## Data-koppeling

De pagina leest data uit de bestaande server action `getTeamsVoorPresentatie()` en `getPublicatieInstellingen()` (zelfde als de PDF-presentatie). De toelichting-tekst (voor- en nawoord) en de publicatie-instellingen (seizoenLabel, titel) komen uit `PublicatieInstellingen` in de database.

**Publiek toegankelijk** — geen auth guard. Aparte route buiten `(protected)`.

---

## Technische aanpak

- Nieuwe route: `apps/ti-studio/src/app/teamindeling/page.tsx` (buiten `(protected)`)
- Server component haalt data op, geeft door aan client component voor navigatie/interactie
- Geen externe dependencies — native React state voor paginawissel en teamindex
- Toelichting-tekst en seizoenslabel via bestaande `PublicatieInstellingen`-model
