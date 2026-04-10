# Design Spec: Kader-validatie systeem

**Datum:** 2026-04-10  
**Status:** Goedgekeurd

## Probleemstelling

De validatie-infrastructuur bestaat al (stip op TeamKaart, ValidatieLijst in TeamDrawer, `WerkbordValidatieItem` type) maar is volledig leeg: `validatieStatus: "ok"` en `validatieCount: 0` zijn hardcoded. De kaders (vastgelegd in `/kader`) worden nergens gebruikt voor validatie. Doel is één systeem waarbij kaders de regels bepalen en het werkbord live weergeeft of teams aan die regels voldoen.

## Scope

- Kader-pagina (`/kader`) als enige bron van waarheid voor alle validatieregels
- Validatie-engine als pure functie (server-side)
- Initiële berekening bij page load, herberekening na elke mutatie
- TeamKaart-stip en TeamDrawer-lijst worden gevuld vanuit echte data

Buiten scope: persisteren van validatiestatus in de DB, UI-aanpassingen aan TeamKaart/TeamDrawer (die werken al correct).

---

## 1. TcKader uitbreiden

`TcKader` in `apps/web/src/app/(teamindeling-studio)/ti-studio/kader/actions.ts` wordt de **single source of truth** voor het type. `KaderView.tsx` importeert het van daar in plaats van het opnieuw te definiëren.

```ts
export type TcKader = {
  // Teamgrootte
  teamMin: number;
  teamIdeaal: number;
  teamMax: number;
  // Dames
  damesMin: number;
  damesIdeaal: number;
  damesMax: number;
  // Heren
  herenMin: number;
  herenIdeaal: number;
  herenMax: number;
  // Gemiddelde leeftijd (B-categorieën)
  gemLeeftijdMin?: number;
  gemLeeftijdMax?: number;
  // NIEUW: Leeftijdsbandbreedte (B-categorieën)
  bandbreedteMax?: number;
  // NIEUW: Max korfballeeftijd per speler (U-teams)
  maxLeeftijdPerSpeler?: number;
};
```

### TC_DEFAULTS met nieuwe velden

```ts
const TC_DEFAULTS: Record<string, TcKader> = {
  SEN_A:  { ..., bandbreedteMax: undefined, maxLeeftijdPerSpeler: undefined },
  SEN_B:  { ..., bandbreedteMax: undefined, maxLeeftijdPerSpeler: undefined },
  U19:    { ..., bandbreedteMax: undefined, maxLeeftijdPerSpeler: 19.00 },
  U17:    { ..., bandbreedteMax: undefined, maxLeeftijdPerSpeler: 17.00 },
  U15:    { ..., bandbreedteMax: undefined, maxLeeftijdPerSpeler: 15.00 },
  ROOD:   { ..., bandbreedteMax: 3, maxLeeftijdPerSpeler: undefined },
  ORANJE: { ..., bandbreedteMax: 3, maxLeeftijdPerSpeler: undefined },
  GEEL8:  { ..., bandbreedteMax: 3, maxLeeftijdPerSpeler: undefined },
  GEEL4:  { ..., bandbreedteMax: 3, maxLeeftijdPerSpeler: undefined },
  GROEN:  { ..., bandbreedteMax: 2, maxLeeftijdPerSpeler: undefined },
  BLAUW:  { ..., bandbreedteMax: 2, maxLeeftijdPerSpeler: undefined },
};
```

---

## 2. KaderView uitbreiden

In de TC-kolom van `KaderView.tsx` komen twee nieuwe bewerkbare rijen, per teamtype zichtbaar op basis van relevantie:

- **Bandbreedte (max)** — tonen voor B-categorieën (ROOD, ORANJE, GEEL8, GEEL4, GROEN, BLAUW). Eén NumInput (geen min/ideaal/max, alleen één waarde).
- **Max leeftijd per speler** — tonen voor U-teams (U19, U17, U15). Eén NumInput.

`KaderView` importeert `TcKader` uit `actions.ts` (verwijder lokale type-definitie).

---

## 3. Korfballeeftijd berekening

```ts
// peildatum = 31 december van het tweede seizoensjaar
// seizoen = "2025-2026" → peiljaar = 2026
function korfbalLeeftijd(geboortedatum: string | null, geboortejaar: number, peiljaar: number): number {
  if (geboortedatum) {
    const peil = new Date(peiljaar, 11, 31); // 31 dec
    const gebDatum = new Date(geboortedatum);
    return (peil.getTime() - gebDatum.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  }
  // Fallback: alleen jaar
  return peiljaar - geboortejaar;
}
```

---

## 4. Team → kader-ID mapping

```ts
function bepaalKaderSleutel(team: WerkbordTeam): string | null {
  const { teamCategorie, niveau, kleur, formaat } = team;
  if (teamCategorie === "SENIOREN") {
    if (niveau === "A") return "SEN_A";
    if (niveau === "B") return "SEN_B";
    return null; // niet geconfigureerd
  }
  if (teamCategorie === "A_CATEGORIE") {
    if (niveau === "U19") return "U19";
    if (niveau === "U17") return "U17";
    if (niveau === "U15") return "U15";
    return null;
  }
  if (teamCategorie === "B_CATEGORIE") {
    if (kleur === "rood") return "ROOD";
    if (kleur === "oranje") return "ORANJE";
    if (kleur === "geel") return formaat === "viertal" ? "GEEL4" : "GEEL8";
    if (kleur === "groen") return "GROEN";
    if (kleur === "blauw") return "BLAUW";
    return null;
  }
  return null;
}
```

---

## 5. Validatie-engine

Nieuw bestand: `apps/web/src/lib/teamindeling/validatie-engine.ts`

Pure functie, geen DB-afhankelijkheid.

```ts
export function berekenTeamValidatie(
  team: WerkbordTeam,
  kaders: Record<string, TcKader>,
  peiljaar: number
): WerkbordValidatieItem[]
```

### Checks in volgorde

**0. Teamtype niet ingesteld**
- Geen geldige kadersleutel → `warn` "Teamtype niet ingesteld — stel categorie en niveau/kleur in"
- Stop verdere checks

**1. Teamgrootte** (totaal spelers)
- `< teamMin` → `err` "Te weinig spelers (x / min y)"
- `< teamIdeaal` (en ≥ min) → `warn` "Onder ideaalgrootte (x / ideaal y)"
- `> teamMax` → `warn` "Te veel spelers (x / max y)"

**2. Dames**
- `< damesMin` → `err` "Te weinig dames (x / min y)"
- `> damesMax` → `warn` "Te veel dames (x / max y)"

**3. Heren**
- `< herenMin` → `err` "Te weinig heren (x / min y)"
- `> herenMax` → `warn` "Te veel heren (x / max y)"

**4. Gemiddelde leeftijd** (alleen als `gemLeeftijdMin`/`gemLeeftijdMax` ingesteld en team heeft spelers met geboortedatum)
- `< gemLeeftijdMin` → `warn` "Gem. leeftijd te laag (x.xx / min y.yy)"
- `> gemLeeftijdMax` → `warn` "Gem. leeftijd te hoog (x.xx / max y.yy)"

**5. Leeftijdsbandbreedte** (alleen als `bandbreedteMax` ingesteld)
- Bereken korfballeeftijd per speler
- `max - min > bandbreedteMax` → `err` "Leeftijdsbandbreedte overschreden (x.xx jaar / max y jaar)"

**6. Max leeftijd per speler** (alleen als `maxLeeftijdPerSpeler` ingesteld)
- Per speler: korfballeeftijd > `maxLeeftijdPerSpeler` → `err` "Speler [naam] te oud (x.xx / max y.yy)"

### validatieStatus en validatieCount

```ts
export function berekenValidatieStatus(items: WerkbordValidatieItem[]): "ok" | "warn" | "err" {
  if (items.some((i) => i.type === "err")) return "err";
  if (items.some((i) => i.type === "warn")) return "warn";
  return "ok";
}
```

`validatieCount` = aantal items met type `err` of `warn`.

Alle items krijgen `laag: "KNKV"` voor checks 5 en 6 (bandbreedte, max leeftijd per speler), `laag: "TC"` voor de rest.

---

## 6. page.tsx — initiële validatie

```ts
// Na laden van teams en spelers:
const seizoen = volledig.kaders.seizoen; // "2025-2026"
const peiljaar = parseInt(seizoen.split("-")[1]);
const tcKaders = await getTeamtypeKaders(seizoen) ?? {};
const kaders = mergeMetDefaults(tcKaders); // bestaande helper uit KaderView

const validatie: WerkbordValidatieItem[] = [];
for (const team of teams) {
  const items = berekenTeamValidatie(team, kaders, peiljaar);
  validatie.push(...items);
  team.validatieStatus = berekenValidatieStatus(items);
  team.validatieCount = items.filter(i => i.type !== "ok").length;
}
```

`WerkbordState.validatie` wordt gevuld met alle items (gefilterd per team in TeamDrawer via `v.teamId === team.id`).

---

## 7. Server actions — herberekening na mutaties

Na elke mutatie die de teamsamenstelling of teamconfig wijzigt:

```ts
// Aan het einde van de action, na de DB-mutatie:
const versTeam = await laadTeamVoorValidatie(teamId);
const items = berekenTeamValidatie(versTeam, kaders, peiljaar);
return {
  ok: true,
  data: {
    // ... bestaande data ...
    validatieUpdate: {
      teamId,
      items,
      status: berekenValidatieStatus(items),
      count: items.filter(i => i.type !== "ok").length,
    }
  }
};
```

**Actions die herberekening triggeren:**
- `voegSpelerToeAanTeam` / `verwijderSpelerUitTeam` — betrokken team
- `verplaatsSpeler` (drag) — beide teams (van + naar)
- `updateTeamConfig` — betrokken team (kadersleutel kan veranderd zijn)

---

## 8. Client-side state update

`useWerkbordState` (of `TiStudioShell`) patcht na ontvangst van `validatieUpdate`:

```ts
// Update teams array:
setTeams(prev => prev.map(t =>
  t.id === validatieUpdate.teamId
    ? { ...t, validatieStatus: validatieUpdate.status, validatieCount: validatieUpdate.count }
    : t
));
// Update validatie array:
setValidatie(prev => [
  ...prev.filter(v => v.teamId !== validatieUpdate.teamId),
  ...validatieUpdate.items,
]);
```

---

## Betrokken bestanden

| Bestand | Wijziging |
|---|---|
| `kader/actions.ts` | `TcKader` type uitbreiden + exporteren |
| `components/ti-studio/kader/KaderView.tsx` | Import `TcKader` uit actions, 2 nieuwe velden, `mergeMetDefaults` exporteren |
| `lib/teamindeling/validatie-engine.ts` | **Nieuw** — pure engine |
| `indeling/page.tsx` | Kaders laden + initiële validatie berekenen |
| `indeling/werkindeling-actions.ts` | `validatieUpdate` toevoegen aan mutatieresultaten |
| `werkbord/hooks/useWerkbordState.ts` | Verwerken van `validatieUpdate` |
