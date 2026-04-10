# Team-drawer Design Spec

**Datum:** 2026-04-10  
**Status:** Goedgekeurd

---

## Doel

De bestaande `ValidatieDrawer` wordt omgebouwd tot een volwaardige **TeamDrawer**: een lijst van alle teams met inrichtingsmogelijkheden, live kadervalidatie en selectie-koppeling. De drawer vervangt de huidige validatie-UI en wordt de centrale plek voor teamconfiguratie in de TI Studio.

---

## Architectuur & component-structuur

```
TiStudioShell
  ├── Ribbon / Toolbar
  │     ├── Team-icoon  →  opent/sluit TeamDrawer
  │     └── Kader-icoon →  opent kader-pagina (KNKV + TC kader)
  ├── WerkbordCanvas
  │     └── TeamKaart  →  validatieknop → openTeamDrawer(teamId)
  └── TeamDrawer (rechts, 280px)
        ├── Header (label "Teams" + "＋ Nieuw"-knop)
        ├── TeamLijst  →  platte kaarten, scrollbaar, klikbaar
        └── TeamDetailPanel (schuift rechts aan, +280px, eigen scrollbar)
              ├── ConfiguratieForm  (beslisboom, directe opslag)
              └── ValidatieLijst   (live, reageert op config + spelers)
```

**State:** Lokaal in `TiStudioShell`:
- `teamDrawerOpen: boolean`
- `geselecteerdTeamId: string | null`

**Openen via validatieknop:** `openTeamDrawer(teamId)` zet beide tegelijk — drawer open + team geselecteerd. Geen aparte interactie nodig.

**Config-opslag:** Server action `updateTeamConfig`, gevolgd door optimistische update van `WerkbordState`. Validatie herberekend client-side na elke wijziging.

---

## Platte teamkaart (in de lijst)

Elke rij is een compacte kaart van 2 regels:

```
┌─ [oranje balk 3px] ──────────────────────────────────┐
│  Senioren 1  [⬡ selectie-badge]         ● (groen)    │
│  ♀4  ♂4  │  USS 7.82  Gem. 22.4j                    │
└──────────────────────────────────────────────────────┘
```

- **Rij 1:** teamnaam (bold) + optioneel selectie-badge + validatiestip (dot, rechts)
- **Rij 2:** Venus-icoon + dames-teller, Mars-icoon + heren-teller, scheidingsstreep, USS-score (mits score-toggle aan), gem. leeftijd
- **Geselecteerd:** oranje linkerbalk (3px) + lichte oranje achtergrond
- **Volgorde:** op basis van `volgorde`-veld (zelfde sortering als werkbord)
- **Validatiestip:** `groen` (ok) / `oranje` (warn, TC-kader) / `rood` (err, KNKV-kader)

---

## Configuratieboom (detailpaneel)

Een gestapeld formulier dat stap voor stap ontsluit op basis van de vorige keuze. Elke wijziging triggert directe opslag + herberekening validatie.

```
Hoofdcategorie:  [Senioren]  [Jeugd]

── als Senioren ──────────────────────────
  Categorie:     [A]  [B]
  Formaat:       8-tal  (vast, niet aanpasbaar)

── als Jeugd A ───────────────────────────
  Leeftijdscategorie:  [U15]  [U17]  [U19]
  Formaat:             8-tal  (vast)

── als Jeugd B ───────────────────────────
  Kleur:    [Geel]  [Oranje]  [Rood]  [Blauw]  [Groen]
  Formaat:  Geel        → [8-tal] [4-tal]  (keuze)
            Blauw/Groen → 4-tal  (vast)
            Oranje/Rood → 8-tal  (vast)

── altijd ────────────────────────────────
  Notitie:  [vrij tekstveld, optioneel]
```

**Buiten scope van de configuratieboom** (behoren tot kader-pagina):
- Min/max spelers
- Verplichte geslachtsverhouding

---

## Live validatie per team

De validatielijst toont het *resultaat* van kaderregels toegepast op dit team. De regels zelf worden beheerd in de kader-pagina (KNKV-kader en TC-kader).

**Twee lagen:**

| Laag | Bron | Kleur | Betekenis |
|---|---|---|---|
| KNKV-kader | Competitie 2.0 regels | Rood (err) | Harde overtreding, speelgerechtigd risico |
| TC-kader | OW-voorkeuren, indelingsfilosofie | Oranje (warn) | Afwijking van OW-beleid |

**Voorbeeld:**
```
✓  Genderbalans klopt          4 dames + 4 heren            [KNKV]
⚠  Wisseldiepte laag           8 spelers — TC-min: 10       [TC]
✗  Speler buiten leeftijdsband  Van Dam (2007) — U17: 2008+  [KNKV]
```

**Reactief:**
- Wijzigt de teamconfiguratie → validatie herberekend
- Wijzigt de spelerssamenstelling → validatie herberekend
- Geen kaderregels geconfigureerd voor dit teamtype → lege lijst met melding

**Validatiestip** op de platte kaart én op de werkbord-teamkaart toont de zwaarste status (rood > oranje > groen). Één berekening, twee weergaven.

---

## Selectie-koppeling

Twee teams kunnen worden gekoppeld tot een selectie. Dit is een expliciete TC-keuze.

**Koppelen:**
- Onderaan het detailpaneel: "Koppel aan selectie" sectie
- Dropdown: kies een tweede team (alleen zelfde type, bijv. Sen 1 ↔ Sen 2)
- Na koppeling: beide teams krijgen een selectie-badge in de lijst

**Na koppeling — toewijzingskeuze:**
- Spelers/staf toewijzen aan **het team** of aan **de selectie**

**Selectie-validatie** verschijnt als extra blok:
```
Selectie: Sen 1 ↔ Sen 2
⚠  Totale wisseldiepte selectie laag   14 spelers — aanbevolen: 18+
```

**Canvas-effect:**
- Selectie-koppeling activeert `formaat: "selectie"` (560px) op de werkbord-teamkaart
- De twee losse kaarten worden vervangen door één gecombineerde selectiekaart
- Dit formaat en de bijbehorende kaart zijn al gebouwd in de bestaande codebase

---

## Ribbon-aanpassingen

| Element | Icoon | Actie |
|---|---|---|
| Team-icoon (nieuw) | Team/groep icoon | Opent/sluit TeamDrawer |
| Kader-icoon (terug) | Kader/regelboek icoon | Opent kader-pagina: KNKV-kader + TC-kader |

Het kader-icoon was verwijderd in de blauwdruk-fase; het keert terug met directe link naar de kader-pagina als aparte view, los van de team-drawer.

---

## Integratie met bestaande codebase

| Bestaand | Wijziging |
|---|---|
| `ValidatieDrawer.tsx` | Omgebouwd naar `TeamDrawer.tsx` |
| `TiStudioShell` state | `teamDrawerOpen` + `geselecteerdTeamId` toegevoegd |
| `TeamKaart` validatieknop | Roept `openTeamDrawer(teamId)` aan |
| `WerkbordTeam.validatieStatus` | Gevoed door client-side kadervalidatie |
| `formaat: "selectie"` | Geactiveerd via selectie-koppeling in TeamDrawer |
| Ribbon `Toolbar.tsx` | Team-icoon + Kader-icoon toegevoegd/hersteld |

---

## Buiten scope (aparte feature)

- Kader-pagina inhoud (KNKV-regels configureren, TC-kaders instellen) — volgt als apart traject
- Historische validatie-logging
- Notificaties bij kaderwijziging voor al bestaande teams

---

## Vervolgtraject

Na afronding van de TeamDrawer implementatie is de **Kader-pagina** het volgende prioritaire traject. Deze pagina bevat:
- KNKV-kader: harde competitieregels per teamtype (leeftijdsbandbreedte, geslachtsverhouding, min/max spelers)
- TC-kader: OW-voorkeuren en indelingsfilosofie als zachte regels

De TeamDrawer validatie is hiervan afhankelijk — zonder kaderregels toont de validatielijst een lege toestand.
