# Team-weergave · Design prototypes

Unificatie van alle teamweergaven in TI Studio naar één consistent visueel systeem.

## Spec

Nog te schrijven — `docs/superpowers/specs/YYYY-MM-DD-team-weergave-unificatie.md`

## Vier contexten

| Bestand | Beschrijving |
|---|---|
| [`tokens.css`](./tokens.css) | Alle design-tokens voor team-weergave (importeert ook speler-weergave tokens) |
| [`team-kaart.html`](./team-kaart.html) | **Context 1** · Team-tegel in het werkbord-canvas · drop-zone voor spelers |
| [`team-drawer.html`](./team-drawer.html) | **Context 2** · Zijpaneel voor teammanagement (lijst van teams + validatie) |
| [`team-dialog.html`](./team-dialog.html) | **Context 3** · Team-detail-modal met tabs (overzicht / validatie / werkitems) |
| [`team-detail-drawer.html`](./team-detail-drawer.html) | **Context 4** · Compactere drawer met spelerslijst per team |
| [`index.html`](./index.html) | Catalogus met links naar alle prototypes |

## Domein-model

### Selectie (SelectieGroep.gebundeld)

- **`gebundeld = false`** — losse selectie-teams. Spelers staan per team in `TeamSpeler`. Visueel: twee of meer team-kolommen naast elkaar met eigen tellers.
- **`gebundeld = true`** — gedeelde pool over meerdere teams. Spelers staan in `SelectieSpeler`. Visueel: één gedeelde drop-zone met één teller.

Teams binnen een selectie worden visueel gekoppeld via een **selectie-frame** (blauw accent) en een `SEL`-badge.

### OWTeamType

Vier hoofdtypes uit `OWTeamType` enum:
- **JEUGD** — B-categorie jeugd met KNKV-leeftijdkleur (blauw / groen / geel / oranje / rood)
- **SELECTIE** — A-selectie jeugd (U15 / U17 / U19)
- **SENIOREN** — senior teams (A = topspel, B = recreant)
- **OVERIG** — niet-gevalideerd

### Validatie-niveaus

Drie statussen per regel: **OK** (groen), **WARN** (geel), **ERR** (rood).
Gesorteerd van ERR → WARN → OK in alle team-views.

## Consistentie met speler-weergave

Prototypes gebruiken dezelfde tokens en primitives als `../speler-weergave/tokens.css`:
- Rijke rij / normaal rij voor spelerweergave binnen teams
- `.ow-scroll` utility voor scroll-gebieden
- Status-kleuren, leeftijdkleuren, memo-indicator, USS-hexagon
- Dezelfde kleur-, sizing- en typografie-tokens
