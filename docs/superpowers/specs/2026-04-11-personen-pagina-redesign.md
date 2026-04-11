# Spec: Personen-pagina redesign — TI Studio

**Datum:** 2026-04-11  
**Status:** Goedgekeurd  
**Scope:** `ti-studio/personen/` (spelers + staf tabs)

---

## Aanleiding

De personen-pagina (`/ti-studio/personen/`) is verouderd geraakt. Het werkbord heeft inmiddels
een volwaardige `SpelersPoolDrawer` (met AR-sectie, filters, drag) en een `StafPoolDrawer`
(met `StafKaart`). De personen-pagina was een los overzicht zonder actieve rol in het
indelingsproces. De staf-tab was nog leeg (EmptyState).

**Nieuw doel:** De personen-pagina wordt het beheer-verlengstuk van de drawers. Dezelfde
databron, maar met meer ruimte: alle data per persoon in één rij, zoeken, filteren, sorteren,
pinnen en aanmaken.

---

## Wat er niet verandert

- Route-structuur: `/ti-studio/personen/spelers` en `/ti-studio/personen/staf`
- Sub-nav met twee tabs (Spelers | Staf)
- Dark-mode CSS variabelen
- `gepind`-veld op speler: personen-pagina toont en togglet hetzelfde veld als de drawer

---

## Spelers-tab

### Filterbar

```
🔍 Zoek   [Status ▾]   [Huidig team ▾]   [Indeling ▾]   [▲ Memo]   [📌 Gepind]   [+ Nieuwe speler]
```

| Filter | Type | Werking |
|---|---|---|
| Zoek | Tekstveld | Filtert op roepnaam + achternaam |
| Status | Pills | BESCHIKBAAR / TWIJFELT / GAAT_STOPPEN / NIEUW / RESERVE / Allen |
| Huidig team | Dropdown | Filtert op team vorig seizoen |
| Indeling | Dropdown | Filtert op team in actieve versie |
| ▲ Memo | Toggle | Toont alleen spelers met actief memo (▲-indicator) |
| 📌 Gepind | Toggle | Toont alleen gepinde spelers |

### Tabel

| Kolom | Inhoud | Sorteerbaar | Filterbaar |
|---|---|---|---|
| **Naam** | Avatar (initialen + geslachtkleur) + roepnaam + achternaam | ✓ | Zoekbalk |
| **Jaar** | Geboortejaar + korfballeeftijd (bijv. `2009 · 16.2`) | ✓ | — |
| **Status** | Kleurstip + label | ✓ | Status-pills |
| **Gezien** | Kleurstip GROEN/GEEL/ORANJE/ROOD/ONGEZIEN | ✓ | — |
| **Huidig team** | Badge met teamkleur (vorig seizoen) | ✓ | Dropdown |
| **Indeling** | Badge met teamkleur (actieve versie) | ✓ | Dropdown |
| **📌** | Pin-toggle naast indeling-badge | ✓ | Toggle |
| **▲** | Gevuld driehoekje bij actief memo | ✓ | Toggle |

Sorteren op Huidig team / Indeling: alfabetisch op teamnaam, spelers zonder team onderaan.  
Sorteren op ▲ / 📌: actief bovenaan.

De **📌 pin-toggle** zit inline in de tabel naast de indeling-badge — één klik, geen dialoog.
Togglet hetzelfde `gepind`-veld als het 📌-icoon in de `SpelersPoolDrawer`.

### Aanmaken nieuwe speler

Knop **"+ Nieuwe speler"** rechtsboven de tabel opent een compact dialoog.

**Verplichte velden:**
- Roepnaam + Achternaam
- Geslacht (M / V toggle)
- Geboortedatum

**Optionele velden (ook later aanpasbaar):**
- Status (default: `NIEUW_POTENTIEEL`)
- Notitie / memo

**Na aanmaken:**
- Speler verschijnt direct in de tabel (revalidate)
- Speler verschijnt direct in de `SpelersPoolDrawer` (zelfde databron)
- `rel_code` = `null` (geen Sportlink-lidnummer)

**Lidnummer koppelen:** buiten scope. TC kan later via Beheer handmatig `rel_code` invullen
zodra de speler een Sportlink-lidnummer krijgt. Geen automatische flow.

### Reserveringsspelers (aparte sectie binnen spelers-tab)

Reserveringsspelers zijn naamloze placeholders die een teamspot opvullen. Ze verschijnen
als eigen sectie in de personen-pagina én als eigen sectie in de `SpelersPoolDrawer`
(vergelijkbaar met de AR-sectie, maar wél draggable naar teams).

**Datavelden:**
- Titel (verplicht) — vrij tekst, bijv. "Meisje reserve" of "Jongen Geel-1"
- Geslacht (verplicht) — M / V toggle
- Geen achternaam, geboortedatum, rel_code of status

**Sectie in personen-pagina (onder de hoofdtabel):**

```
┌─ Reserveringsspelers ─────────────────────── [+ Nieuwe reservering] ─┐
│  Titel ↕              Geslacht   Indeling          📌                 │
│  ────────────────────────────────────────────────────────────────────│
│  Meisje reserve       ♀          [Geel-2]          📌                │
│  Jongen placeholder   ♂          —                                   │
└────────────────────────────────────────────────────────────────────┘
```

Kolommen: **Titel** (sorteerbaar), **Geslacht**, **Indeling** (sorteer/filterbaar), **📌** (toggle).
Geen Status, Gezien, Huidig team of Memo — dat zijn velden die niet van toepassing zijn.

**"+ Nieuwe reservering"** opent een minimaal dialoog: Titel + Geslacht. Dat is alles.

**In de `SpelersPoolDrawer`:**
- Eigen sectie onderaan (na AR-sectie), label "Reservering"
- Zelfde `SpelerKaart`-vormgeving maar met Titel als naam
- Wél draggable naar teams (anders dan AR)

---

## Staf-tab

Identieke opbouw als spelers-tab, kolommen aangepast:

### Filterbar

```
🔍 Zoek   [Rol ▾]   [Team ▾]   [▲ Memo]   [📌 Gepind]   [+ Nieuwe staf]
```

### Tabel

| Kolom | Inhoud | Sorteerbaar | Filterbaar |
|---|---|---|---|
| **Naam** | Avatar + naam | ✓ | Zoekbalk |
| **Globale rollen** | Kommalijst (bijv. "Trainer, Coordinator") | — | Rol-dropdown |
| **Teams + rol** | Per koppeling: teamkleur-dot + teamnaam + rol-badge + 📌 pin | ✓ | Team-dropdown |
| **▲** | Memo-indicator | ✓ | Toggle |

Eén staflid kan meerdere team-koppelingen hebben. Die staan als compacte regels
gestapeld in de "Teams + rol"-cel. De 📌 pin zit per koppeling — zodat je bijv.
de hoofdtrainer-koppeling kunt pinnen maar een tijdelijke hulpcoach niet.

### Aanmaken nieuwe staf

**Verplichte velden:**
- Naam

**Optionele velden:**
- Globale rollen (multi-select of vrij tekst)
- Geboortedatum

---

## Technische opmerkingen

- De spelers-tabel hergebruikt de bestaande `getSpelersVoorStudio()` action en het
  `StudioSpeler`-type — uitbreiden met `heeftActiefMemo: boolean` als dat er nog niet in zit.
- De staf-tabel gebruikt de bestaande staf-databron (zelfde als `StafPoolDrawer`).
- Pin-toggle: server action die `gepind` veld flipt, `revalidatePath` op zowel personen-pagina
  als indeling-pagina zodat beide views synchroon blijven.
- Nieuwe speler aanmaken: server action die een speler aanmaakt met `rel_code = null`,
  status `NIEUW_POTENTIEEL`, en de opgegeven velden.
- Nieuwe reserveringsspeler aanmaken: server action met alleen Titel + Geslacht,
  apart model of een dedicated status (`RESERVERING`) op het bestaande speler-model —
  keuze te maken bij implementatie op basis van Prisma schema.
- Reserveringsspelers zijn draggable (anders dan AR): drag-lock in `SpelerKaart` wordt
  uitgebreid van `isAR` naar `isAR || isReservering` is dus NIET van toepassing.
- Nieuwe staf aanmaken: server action die een staflid aanmaakt.

---

## Buiten scope

- Automatische koppeling `rel_code` bij lidnummer-toewijzing
- Bulk-acties op meerdere spelers tegelijk
- Drag-and-drop vanuit de personen-pagina naar teams (dat blijft het werkbord)
- Staf koppelen aan teams (komt later — structuur staat er al voor via "Teams + rol"-kolom)
