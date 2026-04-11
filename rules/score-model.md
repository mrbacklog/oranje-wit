---
paths:
  - "apps/web/src/**/*score*"
  - "apps/web/src/**/*uss*"
  - "packages/database/**/*score*"
---

# Score-Model — Geunificeerde Score Schaal (USS)

> **Versie:** 1.0
> **Datum:** 2026-03-26
> **Kalibratie:** Initieel (op basis van conceptindelingen veld voorjaar 2026)
> **Geldigheid:** Seizoen 2025-2026, herkalibreren bij nieuwe KNKV-data

> **Agents:** Gebruik `rules/score-model-compact.md` voor USS-vergelijkingen en niveaubepaling. Laad dit volledige document alleen als je scores berekent, kalibratieprotocol uitvoert of TypeScript-implementaties raadpleegt.

Dit document is de **Single Source of Truth** voor alle score-berekeningen in de apps van c.k.v. Oranje Wit. Het beschrijft hoe KNKV teamratings, scouting spelersscores en coach-evaluaties met elkaar samenhangen via de Geunificeerde Score Schaal (USS).

---

## 1. Wat is de USS?

### Functioneel

De USS is een **gemeenschappelijke taal voor sterkte**. Of je nu een team bekijkt (via KNKV-data) of een individuele speler (via scouting of coach-evaluatie) — de USS plaatst beiden op dezelfde schaal, zodat je kunt vergelijken.

| USS | Wat betekent dit? |
|-----|-------------------|
| 0-20 | Net begonnen (jongste Blauw) |
| 20-50 | Blauw/Groen niveau |
| 50-80 | Groen/Geel niveau |
| 80-110 | Geel niveau (gemiddeld tot sterk) |
| 110-130 | Oranje niveau / sterk Geel |
| 130-150 | Rood niveau / A-categorie instap |
| 150-170 | A-categorie (U17-HK, U19) |
| 170-200 | Top jeugd / senioren niveau |

Voorbeeld: een speler met USS 115 en een team met USS 115 zijn op vergelijkbaar niveau. Als die speler in een team met USS 90 speelt, is hij een van de sterksten. In een team met USS 130 zou hij onderaan zitten.

### Technisch

- **Schaal:** 0-200 (geheel getal, `Int` in Prisma)
- **Vervangt:** de oude 0-300 rating-schaal uit team-indeling
- **Berekening:** `packages/types/src/score-model.ts`
- **Drie bronnen voeden de USS:** KNKV teamrating, scouting spelersscore, coach-evaluatie

---

## 2. Leeftijdsberekening

### Exacte leeftijd (2 decimalen)

De KNKV gebruikt exacte leeftijden voor teamindelingen. Wij volgen hetzelfde systeem.

**Formule:**

```
exacte_leeftijd = (peildatum - geboortedatum_in_dagen) / 365.25
```

**TypeScript:**

```typescript
function berekenExacteLeeftijd(geboortedatum: Date, peildatum: Date): number {
  const ms = peildatum.getTime() - geboortedatum.getTime();
  const dagen = ms / (1000 * 60 * 60 * 24);
  return Math.round((dagen / 365.25) * 100) / 100; // 2 decimalen
}
```

### Voorbeeld

| Geboortedatum | Peildatum | Dagen | Exacte leeftijd |
|---------------|-----------|-------|-----------------|
| 15-03-2012 | 31-12-2026 | 5404 | **14.79** |
| 01-01-2010 | 31-12-2026 | 6209 | **16.99** |
| 02-01-2010 | 31-12-2026 | 6208 | **16.99** |
| 31-12-2008 | 31-12-2026 | 6575 | **18.00** |

### A-categorie leeftijdsgrenzen

Een speler is speelgerechtigd als de exacte leeftijd **strikt kleiner is dan** de grens op de peildatum:

| Categorie | Grens | Peildatum | Geboortejaren (seizoen 2026-2027) |
|-----------|-------|-----------|-----------------------------------|
| U15 | < 15.00 | 31-12-2026 | 2012, 2013 |
| U17 | < 17.00 | 31-12-2026 | 2010, 2011 |
| U19 | < 19.00 | 31-12-2026 | 2008, 2009 |

**Let op:** Een speler geboren op 31-12-2008 is op peildatum 31-12-2026 exact 18.00 jaar oud. Dit is < 19.00, dus WEL speelgerechtigd voor U19. Maar een speler geboren op 01-01-2008 is 18.99 en ook speelgerechtigd. Een speler geboren op 31-12-2007 is exact 19.00 en is NIET meer speelgerechtigd.

---

## 3. Basislijnfunctie: leeftijd naar verwachte USS

### Functioneel

De basislijn geeft de **verwachte USS voor een gemiddeld team of speler op een bepaalde leeftijd**. Een team dat boven de basislijn scoort is sterker dan gemiddeld voor die leeftijd; eronder is zwakker.

### Formule (logistische groeicurve)

```
S(l) = S_max / (1 + e^(-k * (l - l_0)))
```

### Parameters

| Parameter | Waarde | Betekenis |
|-----------|--------|-----------|
| `S_max` | 180 | Asymptotisch maximum (top senioren) |
| `k` | 0.35 | Steilheid van de groei |
| `l_0` | 12.5 | Inflectiepunt (leeftijd waar groei het snelst is) |

### TypeScript

```typescript
function berekenUSSBasislijn(leeftijd: number): number {
  const { sMax, k, l0 } = USS_CONFIG;
  return Math.round(sMax / (1 + Math.exp(-k * (leeftijd - l0))));
}
```

### Kalibratietabel

| Leeftijd | 5.0 | 6.0 | 7.0 | 8.0 | 9.0 | 10.0 | 11.0 | 12.0 | 13.0 | 14.0 | 15.0 | 16.0 | 17.0 | 18.0 | 20.0 |
|----------|-----|-----|-----|-----|-----|------|------|------|------|------|------|------|------|------|------|
| USS      | 12  | 17  | 23  | 31  | 41  | 53   | 67   | 82   | 98   | 113  | 127  | 139  | 149  | 157  | 168  |

### Grafische weergave

```
USS
180 ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ (plafond)
170 │                                         ·····
160 │                                    ····
150 │                               ····        ← Rood / A-cat
140 │                          ····
130 │                     ····                   ← Oranje / U15
120 │                ····
110 │           ····
100 │       ···                                  ← Geel
 90 │     ··
 80 │   ··
 70 │  ·
 60 │ ·                                          ← Groen
 50 │·
 40 │
 30 │·
 20 │                                            ← Blauw
 10 │
  0 ┼───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───→
    5   6   7   8   9  10  11  12  13  14  15  16  17  18
                        Leeftijd
```

### Validatie tegen echte OW-data (veld voorjaar 2026)

| Team | Gem. leeftijd | KNKV rating | Basislijn(leeftijd) | Verschil |
|------|---------------|-------------|---------------------|----------|
| J18 | 6.5 | 12 | 17 | -5 (net begonnen) |
| J16 | 7.2 | 45 | 28 | +17 (sterk) |
| J17 | 7.2 | 47 | 28 | +19 (sterk) |
| J15 | 7.8 | 57 | 33 | +24 (sterk) |
| J14 | 8.3 | 62 | 39 | +23 (sterk) |
| J13 | 8.4 | 79 | 40 | +39 (zeer sterk) |
| J12 | 9.3 | 81 | 51 | +30 (sterk) |
| J9 | 11.1 | 97 | 81 | +16 |
| J8 | 11.7 | 106 | 87 | +19 (sterk) |
| J7 | 11.8 | 75 | 88 | -13 (onder basislijn) |
| J6 | 12.6 | 112 | 94 | +18 (sterk) |
| J4 | 13.8 | 111 | 108 | +3 (gemiddeld) |
| J3 | 14.1 | 90 | 111 | -21 (selectie-effect*) |
| J2 | 15.4 | 120 | 131 | -11 (selectie-effect*) |
| J1 | 16.4 | 118 | 140 | -22 (selectie-effect*) |

*Selectie-effect: bij Rood gaan de sterkste spelers naar A-categorie (U15/U17/U19). De B-categorie Rood teams worden daardoor zwakker dan de basislijn voorspelt. Dit is verwacht en gewenst.

---

## 4. KNKV Teamrating naar USS

### B-categorie: directe mapping

De KNKV-teamratings zijn een **rating-systeem** (vergelijkbaar met ELO):
- Periodieke review op basis van wedstrijdresultaten + gemiddelde leeftijd
- Wordt meerdere keren per seizoen bijgewerkt (de bond gebruikt het voor poule-indelingen)
- Bereik: ~12 (jongste Blauw) tot ~165 (top senioren)

Dit past direct in de USS 0-200 schaal. Geen transformatie nodig:

```
USS_team = KNKV_rating
```

**TypeScript:**

```typescript
function knkvNaarUSS(knkvRating: number): number {
  return Math.round(knkvRating);
}
```

Als de KNKV-rating gedurende het seizoen groeit (door betere resultaten of stijgende gemiddelde leeftijd), groeit de USS automatisch mee.

### Rating-groei door het seizoen

De KNKV werkt ratings meerdere keren per seizoen bij. Typische groei voor een jeugdteam:

| Moment | KNKV rating | USS | Toelichting |
|--------|-------------|-----|-------------|
| Start seizoen (sept) | 85 | 85 | Beginwaarde op basis van vorig seizoen |
| Na veld najaar (dec) | 95 | 95 | Gestegen door goede resultaten |
| Na zaal (apr) | 105 | 105 | Verder gestegen |
| Na veld voorjaar (jun) | 120 | 120 | Eindwaarde seizoen |

Spelerscores worden herberekend na elke KNKV-update.

### A-categorie: afgeleide scores

A-categorie teams (U15, U17, U19) hebben geen KNKV B-rating. Hun USS wordt afgeleid op basis van:
1. **Leeftijdsgroep** (U15 < U17 < U19)
2. **Competitieniveau** (HK > OK > 1e > 2e)
3. **Relatieve ordening** (U15-HK net onder U17-1e)

| Combinatie | USS | Toelichting |
|------------|-----|-------------|
| U19-HK | 175 | Top jeugd, bijna senioren-niveau |
| U19-OK | 170 | Overgangsklasse |
| U17-HK | 160 | Beste 15-16 jarigen |
| U19-1 | 155 | Eerste klasse U19 |
| U17-1 | 147 | Eerste klasse U17 |
| U15-HK | 143 | Beste 13-14 jarigen (net onder U17-1e) |
| U19-2 | 142 | Tweede klasse U19 |
| U17-2 | 135 | Tweede klasse U17 |
| U15-1 | 128 | Eerste klasse U15 |

**Hiërarchie (van hoog naar laag):**

```
175  U19-HK      ████████████████████████████████████████
170  U19-OK      ██████████████████████████████████████
160  U17-HK      ████████████████████████████████████
155  U19-1       ██████████████████████████████████
147  U17-1       ████████████████████████████████
143  U15-HK      ███████████████████████████████   ← net onder U17-1e
142  U19-2       ███████████████████████████████
135  U17-2       █████████████████████████████
128  U15-1       ███████████████████████████
~125 B-Rood top  ██████████████████████████
```

**TypeScript:**

```typescript
const A_CATEGORIE_USS: Record<string, number> = {
  "U19-HK": 175, "U19-OK": 170, "U17-HK": 160,
  "U19-1": 155, "U17-1": 147, "U15-HK": 143,
  "U19-2": 142, "U17-2": 135, "U15-1": 128,
};

function aCategorieUSS(categorie: string, klasse: string): number | null {
  const key = `${categorie}-${klasse}`;
  return A_CATEGORIE_USS[key] ?? null;
}
```

---

## 5. Scouting Spelersscore naar USS

### Score-ranges per leeftijdsgroep

De scouting-app scoort spelers op 6 pijlers (SCH/AAN/PAS/VER/FYS/MEN). De overall score valt binnen een range die afhangt van de leeftijdsgroep:

| Groep | Score min | Score max | Mediaan | Leeftijd midden |
|-------|-----------|-----------|---------|-----------------|
| Paars (5 jr) | 0 | 40 | 20 | 5.5 |
| Blauw (6-7) | 0 | 40 | 20 | 6.5 |
| Groen (8-9) | 5 | 55 | 30 | 8.5 |
| Geel (10-12) | 15 | 70 | 42.5 | 11.0 |
| Oranje (13-15) | 25 | 85 | 55 | 14.0 |
| Rood (16-18) | 35 | 99 | 67 | 17.0 |

De ranges overlappen bewust: een top Groen-speler (score 55) scoort hoger dan een gemiddelde Geel-speler (score 42). Dit weerspiegelt de realiteit.

### Conversieformule

```
USS = USS_basis + ((score - mediaan) / halve_range) * bandbreedte
```

Waar:
- `USS_basis` = de USS die hoort bij de middelste leeftijd van de groep (uit de basislijn)
- `mediaan` = het midden van de score-range
- `halve_range` = (max - min) / 2
- `bandbreedte` = hoeveel USS-punten de spreiding binnen die groep bestrijkt

### Conversietabel

| Groep | USS_basis | Mediaan | Halve range | Bandbreedte | USS bij min | USS bij max |
|-------|----------|---------|-------------|-------------|-------------|-------------|
| Paars | 18 | 20 | 20 | 13 | 5 | 31 |
| Blauw | 34 | 20 | 20 | 22 | 12 | 56 |
| Groen | 70 | 30 | 25 | 20 | 50 | 90 |
| Geel | 90 | 42.5 | 27.5 | 30 | 60 | 120 |
| Oranje | 99 | 55 | 30 | 26 | 73 | 125 |
| Rood | 103 | 67 | 32 | 23 | 80 | 126 |

### Overlapping uitgelegd

De overlapping in USS weerspiegelt de overlapping in KNKV-teamratings:

```
USS  0    20    40    60    80   100   120   140   160   180
     ├─────────────────────────────────────────────────────┤
     │  Blauw ████████                                     │
     │       Groen ████████████████                        │
     │              Geel ███████████████████████            │
     │                       Oranje ██████████████████     │
     │                                Rood ██████████████  │
     │                              A-cat  ████████████████│
     ├─────────────────────────────────────────────────────┤
```

**Functioneel voorbeeld:** Een Geel-speler met score 65 (hoog in range 15-70) krijgt USS 118. Een Oranje-speler met score 30 (laag in range 25-85) krijgt USS 103. De Geel-speler is op papier sterker — en dat klopt: een toptalent in Geel kan beter zijn dan een minder sterke Oranje-speler.

### TypeScript

```typescript
const SCOUTING_USS_PARAMS: Record<string, {
  ussBasis: number; mediaan: number; halveRange: number; bandbreedte: number;
}> = {
  paars:  { ussBasis: 18,  mediaan: 20,   halveRange: 20,   bandbreedte: 13 },
  blauw:  { ussBasis: 34,  mediaan: 20,   halveRange: 20,   bandbreedte: 22 },
  groen:  { ussBasis: 70,  mediaan: 30,   halveRange: 25,   bandbreedte: 20 },
  geel:   { ussBasis: 90,  mediaan: 42.5, halveRange: 27.5, bandbreedte: 30 },
  oranje: { ussBasis: 99,  mediaan: 55,   halveRange: 30,   bandbreedte: 26 },
  rood:   { ussBasis: 103, mediaan: 67,   halveRange: 32,   bandbreedte: 23 },
};

function scoutingNaarUSS(score: number, groep: string): number {
  const p = SCOUTING_USS_PARAMS[groep];
  if (!p) return 0;
  const uss = p.ussBasis + ((score - p.mediaan) / p.halveRange) * p.bandbreedte;
  return Math.round(Math.max(0, Math.min(200, uss)));
}
```

---

## 6. Coach-evaluatie naar USS

### Functioneel

Coach-evaluaties (trainerevaluaties) zijn minder diepgaand dan scouting-rapporten, maar waardevol:
- Een trainer ziet spelers **dagelijks**, een scout slechts incidenteel
- Bij weinig scouting-data is de coach-evaluatie de **primaire bron**
- Niveau 1-5 geeft aan hoe een speler presteert **ten opzichte van het eigen team**

### Formule

```
USS_coach = USS_team + ((niveau - 3) / 2) * bandbreedte_team
```

Waar:
- `USS_team` = de USS van het team waar de speler in speelt
- `niveau` = 1-5 uit trainerevaluatie
- `bandbreedte_team` = 20 (verwachte spreiding binnen een team)

### Vertaaltabel

| Niveau | Offset | Betekenis | Voorbeeld (team USS 100) |
|--------|--------|-----------|--------------------------|
| 5 (excellent) | +20 | Ver boven teamgemiddelde | USS 120 |
| 4 (goed) | +10 | Boven teamgemiddelde | USS 110 |
| 3 (gemiddeld) | 0 | Op teamgemiddelde | USS 100 |
| 2 (zwak) | -10 | Onder teamgemiddelde | USS 90 |
| 1 (onvoldoende) | -20 | Ver onder teamgemiddelde | USS 80 |

### TypeScript

```typescript
const TEAM_BANDBREEDTE = 20;

function coachNaarUSS(ussTeam: number, niveau: number): number {
  const offset = ((niveau - 3) / 2) * TEAM_BANDBREEDTE;
  return Math.round(Math.max(0, Math.min(200, ussTeam + offset)));
}
```

---

## 7. Gecombineerde Speler-USS

### Functioneel

Een speler kan data hebben uit scouting, coach-evaluatie, of beide. De uiteindelijke USS is een **gewogen combinatie** waarbij de bron met meer data zwaarder weegt.

### Gewichtstabel

| Scouting-rapporten | w_scout | w_coach | Toelichting |
|--------------------|---------|---------|-------------|
| 0 (geen scouting) | 0.0 | 1.0 | Alleen coach beschikbaar |
| 1-2 (concept) | 0.4 | 0.6 | Scouting nog onbetrouwbaar |
| 3-4 (basis) | 0.6 | 0.4 | Scouting begint te stabiliseren |
| 5-9 (betrouwbaar) | 0.8 | 0.2 | Scouting dominant |
| 10+ (bevestigd) | 0.9 | 0.1 | Scouting vrijwel volledig |

### Formule

```
USS_speler = w_scout * USS_scouting + w_coach * USS_coach
```

Als een van beide bronnen ontbreekt, krijgt de andere bron gewicht 1.0.

### TypeScript

```typescript
const GEWICHTEN = [
  { minRapporten: 10, wScout: 0.9, wCoach: 0.1 },
  { minRapporten: 5,  wScout: 0.8, wCoach: 0.2 },
  { minRapporten: 3,  wScout: 0.6, wCoach: 0.4 },
  { minRapporten: 1,  wScout: 0.4, wCoach: 0.6 },
  { minRapporten: 0,  wScout: 0.0, wCoach: 1.0 },
];

function berekenSpelerUSS(
  ussScout: number | null,
  ussCoach: number | null,
  aantalRapporten: number,
): number | null {
  if (ussScout == null && ussCoach == null) return null;
  if (ussScout == null) return ussCoach;
  if (ussCoach == null) return ussScout;

  const g = GEWICHTEN.find((w) => aantalRapporten >= w.minRapporten)!;
  return Math.round(g.wScout * ussScout + g.wCoach * ussCoach);
}
```

---

## 8. De Brug: gemiddelde speler-USS ≈ team-USS

### Het principe

Als het model klopt, dan geldt:

```
USS_team ≈ gemiddelde(USS_speler) voor alle spelers in het team
```

Dit is de **validatie-toets** voor het hele systeem. Het gemiddelde van de individuele spelersscores in een team moet dicht bij de team-USS liggen.

### Afwijkingssignalen

| Afwijking | Mogelijke oorzaak |
|-----------|-------------------|
| gem(speler) > USS_team + 15 | Spelers zijn sterker dan resultaten tonen → coaching/samenspel probleem? |
| gem(speler) < USS_team - 15 | Team presteert boven individueel niveau → goede coaching/chemie |
| gem(speler) ≈ USS_team (±10) | Model klopt, normaal |

### Wanneer toepassen

- Na elke KNKV rating-update: herbereken USS_team, vergelijk met gem(speler)
- Na significante scouting-data toevoeging (>5 nieuwe rapporten per team)
- Bij seizoensplanning: valideer of teamindelingen consistent zijn

---

## 9. Voorbeeldberekeningen

### Voorbeeld 1 — Team J8 (Geel 8-tal, gem. leeftijd 11.7, KNKV 106)

**Functioneel:** J8 is een sterk Geel team. De KNKV geeft ze rating 106.

**Technisch:**
```
USS_team = knkvNaarUSS(106) = 106
Basislijn(11.7) = 180 / (1 + e^(-0.35 * (11.7 - 12.5))) = 87
Verschil: 106 - 87 = +19 → sterk boven verwachting voor die leeftijd
```

---

### Voorbeeld 2 — Speler in Geel, scouting 60, 3 rapporten, coach niveau 4

**Functioneel:** Een goede Geel-speler die door zowel scouts als coach positief beoordeeld is.

**Technisch:**
```
USS_scouting = scoutingNaarUSS(60, "geel")
  = 89 + ((60 - 42.5) / 27.5) * 35
  = 89 + 22.3 = 111

USS_coach = coachNaarUSS(106, 4)   // team J8 USS = 106
  = 106 + ((4 - 3) / 2) * 20
  = 106 + 10 = 116

USS_speler = berekenSpelerUSS(111, 116, 3)   // 3 rapporten → w=0.6/0.4
  = 0.6 * 111 + 0.4 * 116
  = 66.6 + 46.4 = 113
```

---

### Voorbeeld 3 — Topspeler in Rood, scouting 85, coach niveau 5, 6 rapporten

**Functioneel:** Een uitblinker in Rood B-categorie. Is deze speler klaar voor A-categorie?

**Technisch:**
```
USS_scouting = scoutingNaarUSS(85, "rood")
  = 149 + ((85 - 67) / 32) * 18
  = 149 + 10.1 = 159

USS_coach = coachNaarUSS(118, 5)   // team J1 USS = 118
  = 118 + ((5 - 3) / 2) * 20
  = 118 + 20 = 138

USS_speler = berekenSpelerUSS(159, 138, 6)   // 6 rapporten → w=0.8/0.2
  = 0.8 * 159 + 0.2 * 138
  = 127.2 + 27.6 = 155

Vergelijk: U19-1 = 155, U17-HK = 160
Conclusie: klaar voor A-categorie U19-1 of bijna U17-HK
```

---

### Voorbeeld 4 — Blauw team J18 (gem. leeftijd 6.5, KNKV 12)

**Functioneel:** Het jongste team, net begonnen met competitie.

**Technisch:**
```
USS_team = 12
Basislijn(6.5) = 17
Verschil: -5 → net onder verwachting (logisch voor nieuw team)
```

---

### Voorbeeld 5 — KNKV rating-groei J2 (Rood) door het seizoen

**Functioneel:** Hoe ontwikkelt de teamsterkte zich door het seizoen?

**Technisch:**
```
September:  KNKV = 85  → USS = 85
December:   KNKV = 95  → USS = 95   (+10)
April:      KNKV = 105 → USS = 105  (+10)
Juni:       KNKV = 120 → USS = 120  (+15)
Totale groei: +35 over het seizoen
```

Na elke KNKV-update worden spelerscores automatisch herberekend.

---

### Voorbeeld 6 — Groen-speler, scouting 48, coach niveau 4, 2 rapporten

**Functioneel:** Een sterke Groen-speler met weinig scouting-data. De coach weegt zwaarder.

**Technisch:**
```
USS_scouting = scoutingNaarUSS(48, "groen")
  = 50 + ((48 - 30) / 25) * 28
  = 50 + 20.2 = 70

USS_coach = coachNaarUSS(79, 4)   // sterk Groen team USS ~79
  = 79 + ((4 - 3) / 2) * 20
  = 79 + 10 = 89

USS_speler = berekenSpelerUSS(70, 89, 2)   // 2 rapporten → w=0.4/0.6
  = 0.4 * 70 + 0.6 * 89
  = 28 + 53.4 = 81

Vergelijk: Geel basislijn = 89
Conclusie: op weg naar Geel niveau, maar nog niet helemaal
```

---

### Voorbeeld 7 — A-categorie U17-1, alleen coach-evaluatie

**Functioneel:** Een U17 eerste klasse speler zonder scouting-data.

**Technisch:**
```
USS_coach = coachNaarUSS(147, 3)   // U17-1 USS = 147
  = 147 + 0 = 147

USS_speler = berekenSpelerUSS(null, 147, 0) = 147
```

---

### Voorbeeld 8 — Leeftijdscheck: mag deze speler naar U15?

**Functioneel:** Een speler geboren op 23-06-2012 wil naar U15. Mag dat?

**Technisch:**
```
Peildatum: 31-12-2026
Exacte leeftijd = (31-12-2026 - 23-06-2012) / 365.25
  = 5305 / 365.25 = 14.52

14.52 < 15.00 → JA, speelgerechtigd voor U15
```

---

## 10. Kalibratie Protocol

### Wanneer herkalibreren

1. **Na elke KNKV rating-update** (3x per seizoen: na veld najaar, zaal, veld voorjaar)
2. **Na import van nieuwe conceptindelingen** (KNKV-data met teamscores voor alle clubs)
3. **Aan het begin van elk seizoen** (basislijn-parameters herijken)

### Wat kalibreren

| Parameter | Hoe | Bron |
|-----------|-----|------|
| A-categorie USS | Vergelijk met B-top en onderlinge resultaten | KNKV poule-standen A-cat |
| Basislijn k, l_0, S_max | Least-squares fit op KNKV B-data | Conceptindelingen |
| Scouting bandbreedte per groep | Correlatie USS_scouting vs USS_team | Scouting + KNKV data |
| Coach bandbreedte | Correlatie USS_coach vs USS_scouting | Evaluatie + scouting data |

### Procedure

1. **Verzamel data**: KNKV-ratings per OW-team + gemiddelde leeftijd
2. **Fit basislijn**: minimaliseer `Σ(KNKV_rating - S(gem_leeftijd))²` voor alle B-teams (excl. Rood vanwege selectie-effect)
3. **Valideer A-categorie**: controleer of de hiërarchie klopt (U15-HK < U17-1e etc.)
4. **Update constanten** in `packages/types/src/score-model.ts`
5. **Herbereken alle spelerscores** via `/api/ratings/herbereken`

### Kalibratiecommando

```bash
pnpm calibrate    # scripts/js/kalibreer-score-model.js
```

---

## 11. Code-locaties

| Wat | Bestand |
|-----|---------|
| USS-functies (source of truth) | `packages/types/src/score-model.ts` |
| Scouting score-ranges | `apps/scouting/src/lib/scouting/rating.ts` |
| Team-indeling rating-berekening | `apps/team-indeling/src/lib/rating.ts` |
| EvaluatieScore type (niveau 1-5) | `packages/types/src/evaluatie.ts` |
| KNKV pool-standen import | `apps/monitor/src/lib/sync/standen-knkv.ts` |
| Prisma schema (Speler.rating) | `packages/database/prisma/schema.prisma` |
| Kalibratiescript | `scripts/js/kalibreer-score-model.js` |
