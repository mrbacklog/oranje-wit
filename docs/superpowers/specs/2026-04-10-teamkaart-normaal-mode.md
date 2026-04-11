# Teamkaart Normaal Mode — Design Spec

**Datum:** 2026-04-10
**Status:** Goedgekeurd

---

## Doel

De normaal-mode teamkaart op het TI Studio werkbord herontwerpen voor gebruik bij 80–120% zoom. Elke spelersrij wordt één regel hoog met subtiele sekse-stip, naam en korfballeeftijd (2 decimalen). Stafregels verschijnen boven de footer. De kolomstructuur blijft identiek aan compact/detail zodat er geen layout-verspringen is bij zoomen.

---

## Architectuur

```
TeamKaart (normaal mode)
  ├── Header (34px)          naam · ♀-teller · ♂-teller · validatiestip
  ├── Body
  │   ├── Achtal             twee kolommen naast elkaar (dames | heren)
  │   │   ├── Kolomlabel     "Dames" / "Heren" (8px uppercase, kleurgecodeerd)
  │   │   └── SpelerRij ×N   stip · naam · leeftijd (21px per rij)
  │   └── Viertal            één kolom
  │       ├── Sectielabel    "Dames" (gradient scheidingslijn)
  │       ├── SpelerRij ×4
  │       ├── Sectielabel    "Heren"
  │       └── SpelerRij ×4
  ├── StafSectie (20px/rij)  vierkantje · naam — rol (per stafid)
  └── Footer (26px)          USS links · gem. leeftijd rechts
```

**Betrokken bestanden:**
- `apps/web/src/components/ti-studio/werkbord/TeamKaart.tsx` — normaal-mode render
- `apps/web/src/components/ti-studio/werkbord/TeamKaartSpelerRij.tsx` — `NormaalSpelerRij` component
- `apps/web/src/components/ti-studio/werkbord/hooks/useZoom.ts` — zoom-drempel aanpassen

---

## Zoom-drempel

| Level | Huidig | Nieuw |
|---|---|---|
| compact | < 80% | < 80% (ongewijzigd) |
| normaal | 80–99% | **80–119%** |
| detail | ≥ 100% | **≥ 120%** |

Wijziging in `useZoom.ts`:
```ts
// Voor
if (zoom < 0.8) return "compact";
if (zoom < 1.0) return "normaal";
return "detail";

// Na
if (zoom < 0.8) return "compact";
if (zoom < 1.2) return "normaal";
return "detail";
```

---

## Spelersrij normaal mode (`NormaalSpelerRij`)

Één regel hoog (21px), draggable (zelfde drag-image ghost als compact).

**Layout (links → rechts):**

```
[●] Naam Achternaam          22.40
```

| Element | Beschrijving |
|---|---|
| Sekse-stip | 5×5px cirkel, roze (dames) of blauw (heren), opacity 70% |
| Naam | `roepnaam achternaam.charAt(0).` — flex:1, ellipsis bij overflow, 10.5px |
| Korfballeeftijd | 2 decimalen (`22.40`), 9px, `var(--text-3)`, min-width 28px, rechts uitgelijnd |

**Korfballeeftijd berekening** — zelfde functie als `SpelerKaart`:
```ts
berekenKorfbalLeeftijd(geboortedatum, geboortejaar, HUIDIG_SEIZOEN_EINDJAAR)
// → afgerond op 2 decimalen: Math.floor(...* 100) / 100
```

**Drag-gedrag:** identiek aan bestaande `CompactSpelerRij` — `dataTransfer.setData("speler", ...)` met verborgen `SpelerKaart` als ghost.

---

## Kolomstructuur per formaat

### Achtal (breedte 280px)

Twee gelijke kolommen (140px elk), gescheiden door `1px solid var(--border-0)`.

```
┌── Dames ─────────────┬── Heren ─────────────┐
│ ● S. de Vries  22.40 │ ● T. van Dam   23.71 │
│ ● M. Jansen   19.84 │ ● R. Smit      20.22 │
│ ● L. Bakker   25.13 │ ● J. de Boer   22.91 │
│ ● A. Peters   21.32 │ ● K. Visser    24.54 │
└──────────────────────┴──────────────────────┘
```

Totale hoogte: header(34) + label(14) + 4×rij(84) + staf(20) + footer(26) = **~178px**

### Viertal (breedte 140px)

Één kolom, dames- en herensecties gescheiden door een subtiele gradient-lijn.

```
┌─ OW Geel B1 ─────────┐
│ Dames                 │
│ ● S. de Vries  14.20 │
│ ● M. Jansen   13.84 │
│ ● L. Bakker   15.13 │
│ ● A. Peters   14.32 │
│ Heren                 │
│ ● T. van Dam  13.71 │
│ ● R. Smit     14.22 │
│ ● J. de Boer  14.91 │
│ ● K. Visser   15.54 │
└──────────────────────┘
```

Totale hoogte: header(34) + 2×label(28) + 8×rij(168) + staf(20) + footer(24) = **~274px**

De kaarthoogte (`KAART_HOOGTE`) wordt **variabel** — niet meer vaste 210px.

---

## Stafsectie

Boven de footer, gescheiden door `1px solid var(--border-0)`, lichte achtergrond `rgba(255,255,255,.015)`.

Elke staf-rij 20px hoog:
```
[■] P. Trainer — Hoofdtrainer
```

| Element | Beschrijving |
|---|---|
| Vierkantje | 5×5px, `border-radius: 2px`, paars `rgba(168,85,247,.7)` |
| Naam — Rol | `{naam} — {rol}`, 9.5px, paars `rgba(168,85,247,.85)`, ellipsis |

Paars (`#a855f7` / Tailwind `purple-500`) als vaste kleur voor staf — onderscheidt trainers van spelers (roze/blauw) zonder te domineren. Toe te voegen als `--purple` token in `tokens.css`.

Aantal rijen: alle staf van het team, geen maximum. Bij teams zonder staf: sectie weggelaten.

**Data:** `WerkbordTeam.staf` — type `WerkbordStafInTeam[]`. Dit veld bestaat nog **niet** in `WerkbordTeam`. De implementatie voegt het toe aan het type én aan de server-side query die de werkbordstate opbouwt.

---

## Footer

Ongewijzigd t.o.v. huidige implementatie. Hoogte 26px (achtal) / 24px (viertal).

```
USS 3.05                    Gem. 22.51j
```

- USS links (alleen bij `showScores === true` én `team.ussScore !== null`)
- Gem. leeftijd rechts (`team.gemiddeldeLeeftijd?.toFixed(1) + 'j'`)

---

## Kaartbreedte en hoogte

| Formaat | Breedte | Hoogte |
|---|---|---|
| viertal | 140px | dynamisch (~274px) |
| achtal | 280px | dynamisch (~178px + staf) |
| selectie | 560px | dynamisch |

`KAART_HOOGTE` constante wordt verwijderd uit `WerkbordCanvas` en `TeamKaart`. De minimap-berekening gebruikt een schatting of leest de werkelijke hoogte.

---

## Consistentie compact/normaal/detail

De kolomstructuur (achtal = 2 kolommen, viertal = 1 kolom) is identiek in alle zoom-levels. Alleen de informatie-dichtheid per rij verschilt:

| Level | Rij-inhoud |
|---|---|
| compact | Venus/Mars tellers (geen spelersrijen) |
| normaal | stip · naam · leeftijd |
| detail | `SpelerKaart` (avatar · naam · chips · leeftijd) |

---

## Buiten scope

- Extra spelersindicatoren (later traject)
- Drag-and-drop wijzigingen
- Selectie-formaat kaart (560px)
- Staf bewerken vanuit de kaart
