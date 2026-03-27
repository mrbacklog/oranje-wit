# Technische Specificatie — Vaardigheidsraamwerk v3.0 + USS v2

> **Versie:** 1.0
> **Datum:** 2026-03-26
> **Status:** Concept
> **Bronnen:** `vaardigheidsraamwerk-v3.md`, `scoremodel-v2-concept.md`, `overzicht-raamwerk.md`
> **Doelgroep:** Ontwikkelaar, devops, technische review

---

## 1. Overzicht en scope

### Wat verandert

Het vaardigheidsraamwerk v3.0 introduceert de **Pijlerevolutie** (Inside Out): het aantal pijlers groeit mee met de leeftijd van de speler (5 -> 6 -> 7 -> 9). USS v2 breidt het scoremodel uit met **USS per pijler**, drie methoden (TEAM, INDIVIDUEEL, VERGELIJKING) en vijf databronnen.

### Impact op de codebase

| Component | Wat verandert |
|---|---|
| `packages/database/prisma/schema.prisma` | Nieuw: ScoutingItem, FysiekProfiel, SpelerUSS, ScoutingVergelijking. Aanpassing: SpelersKaart, Pijler, OntwikkelItem |
| `packages/types/src/score-model.ts` | Herschrijven: USS v2 functies (per pijler, 5 bronnen, recentheidscorrectie) |
| `apps/scouting/src/lib/scouting/vragen.ts` | Herschrijven: variabele pijlers per leeftijdsgroep, kern/verdieping markering |
| `apps/scouting/src/lib/scouting/rating.ts` | Herschrijven: per-pijler EWMA, variabele schalen |
| `apps/scouting/src/lib/scouting/leeftijdsgroep.ts` | Uitbreiding: LeeftijdsgroepConfig met pijlers, schaal, gewichten |
| `apps/scouting/src/app/api/` | Nieuwe endpoints: vergelijking, USS-cache, admin catalogus, fysiek profiel |
| `apps/scouting/` UI | Aanpassing: dynamische spelerskaart, vergelijkingsbalk, admin-beheer |

### Wat NIET verandert

- Bestaande modellen (Scout, ScoutingRapport, TeamScoutingSessie, ScoutingVerzoek) blijven bestaan
- Gamification (XP, badges, challenges) blijft ongewijzigd
- Authenticatie en autorisatie (NextAuth, Scout/TC rollen) ongewijzigd
- KNKV teamrating naar USS_team (ongewijzigd uit v1)

---

## 2. Datamodel (Prisma)

### 2.1 Aanpassingen aan bestaande modellen

#### Pijler — uitbreiding

De huidige `Pijler`-tabel heeft een vaste `code` set (`SCH`, `AAN`, `PAS`, `VER`, `FYS`, `MEN`). Dit wordt uitgebreid naar de v3.0 pijlerset:

```prisma
// Bestaand model — wijzigingen gemarkeerd met // NIEUW
model Pijler {
  id       String           @id @default(cuid())
  groepId  String           @map("groep_id")
  groep    Leeftijdsgroep   @relation(fields: [groepId], references: [id], onDelete: Cascade)
  code     String           // v3.0: "BAL" | "BEWEGEN" | "SPEL" | "SAMEN" | "IK" |
                            //        "AANVALLEN" | "VERDEDIGEN" | "TECHNIEK" | "TACTIEK" |
                            //        "MENTAAL" | "FYSIEK" | "SOCIAAL" | "SCOREN" | "SPELINTELLIGENTIE"
  naam     String
  icoon    String?
  volgorde Int              @default(0)
  blok     String?          // NIEUW: "korfbalacties" | "spelerskwaliteiten" | "persoonlijk" | null
  gewicht  Decimal?         @db.Decimal(4, 2)  // NIEUW: USS-gewicht (bijv. 0.18)

  items    OntwikkelItem[]

  @@unique([groepId, code])
  @@map("pijlers")
}
```

#### OntwikkelItem — uitbreiding met kern/verdieping

```prisma
model OntwikkelItem {
  id          String           @id @default(cuid())
  pijlerId    String           @map("pijler_id")
  pijler      Pijler           @relation(fields: [pijlerId], references: [id], onDelete: Cascade)
  itemCode    String           @map("item_code")
  label       String
  vraagTekst  String           @map("vraag_tekst")
  laag        String?          // DEPRECATED: vervangen door isKern
  isKern      Boolean          @default(true) @map("is_kern")       // NIEUW: kern-item voor TEAM-methode
  categorie   String?          // NIEUW: "KERN" | "ONDERSCHEIDEND" (alleen Rood)
  volgorde    Int              @default(0)
  actief      Boolean          @default(true)

  voorloperId String?          @map("voorloper_id")
  voorloper   OntwikkelItem?   @relation("ItemVoorloper", fields: [voorloperId], references: [id])
  opvolgers   OntwikkelItem[]  @relation("ItemVoorloper")

  @@unique([pijlerId, itemCode])
  @@index([pijlerId, volgorde])
  @@map("ontwikkel_items")
}
```

#### Leeftijdsgroep — uitbreiding

```prisma
model Leeftijdsgroep {
  id         String           @id @default(cuid())
  versieId   String           @map("versie_id")
  versie     RaamwerkVersie   @relation(fields: [versieId], references: [id], onDelete: Cascade)
  band       String           // "paars" | "blauw" | "groen" | "geel" | "oranje" | "rood"
  schaalType String           @map("schaal_type") // "observatie" | "ja_nogniet" | "goed_oke_nogniet" | "sterren" | "slider"
  maxScore   Int              @map("max_score")
  doelAantal Int              @default(0) @map("doel_aantal")

  // NIEUW
  schaalMin     Decimal?       @map("schaal_min") @db.Decimal(4, 2)   // 0 | 1.0
  schaalMax     Decimal?       @map("schaal_max") @db.Decimal(4, 2)   // 100 | 5.0 | 10.0
  schaalMediaan Decimal?       @map("schaal_mediaan") @db.Decimal(4, 2) // 50 | 3.0 | 5.5
  halveBereik   Decimal?       @map("halve_bereik") @db.Decimal(4, 2)  // 50 | 2.0 | 4.5
  bandbreedteCoach Int?        @map("bandbreedte_coach")  // B_coach (USS-punten)
  bandbreedteScout Int?        @map("bandbreedte_scout")  // B_scout (USS-punten)
  kernItemsTarget  Int?        @map("kern_items_target")  // 10

  pijlers    Pijler[]

  @@unique([versieId, band])
  @@map("leeftijdsgroepen")
}
```

#### SpelersKaart — herschrijving voor variabele pijlers

De huidige `SpelersKaart` heeft vaste kolommen (`schot`, `aanval`, `passing`, `verdediging`, `fysiek`, `mentaal`). Dit past niet bij variabele pijlers. We vervangen de vaste kolommen door een JSON-veld:

```prisma
model SpelersKaart {
  id              String   @id @default(cuid())
  spelerId        String
  speler          Speler   @relation(fields: [spelerId], references: [id])
  seizoen         String
  overall         Int
  pijlerScores    Json     // NIEUW: { "AANVALLEN": 78, "VERDEDIGEN": 65, ... }
  aantalRapporten Int      @default(0)
  betrouwbaarheid String   @default("concept")
  laatsteUpdate   DateTime @default(now())
  trendOverall    Int?     @default(0)
  leeftijdsgroep  String?  // NIEUW: "blauw" | "groen" | ... (snapshot)

  // DEPRECATED kolommen (behouden voor backward compatibility, niet meer geschreven)
  schot           Int?     // @deprecated — gebruik pijlerScores
  aanval          Int?     // @deprecated
  passing         Int?     // @deprecated
  verdediging     Int?     // @deprecated
  fysiek          Int?     // @deprecated
  mentaal         Int?     // @deprecated

  @@unique([spelerId, seizoen])
  @@map("spelers_kaarten")
}
```

### 2.2 Nieuwe modellen

#### FysiekProfiel

Contextdata voor fysieke rijping. Geen USS-impact. Beschikbaar vanaf Geel.

```prisma
model FysiekProfiel {
  id          String   @id @default(cuid())
  spelerId    String
  speler      Speler   @relation(fields: [spelerId], references: [id])
  seizoen     String
  scoutId     String?
  scout       Scout?   @relation(fields: [scoutId], references: [id])

  lengte      LengteRelatief?
  lichaamsbouw Lichaamsbouw?
  atletischType AtetischType?
  opmerking   String?  @db.Text

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([spelerId, seizoen])
  @@index([spelerId])
  @@map("fysiek_profielen")
}

enum LengteRelatief {
  ONDER_GEMIDDELD
  GEMIDDELD
  BOVENGEMIDDELD
  UITZONDERLIJK
}

enum Lichaamsbouw {
  LICHT
  GEMIDDELD_LB  // GEMIDDELD is al een enum-waarde elders
  STEVIG
}

enum AtetischType {
  ONDER_GEMIDDELD_AT
  GEMIDDELD_AT
  BOVENGEMIDDELD_AT
  UITZONDERLIJK_AT
}
```

#### SpelerUSS — gecachte USS-berekening

Gecachte USS-berekening per speler, per seizoen. Wordt herberekend bij nieuwe rapporten.

```prisma
model SpelerUSS {
  id             String   @id @default(cuid())
  spelerId       String
  speler         Speler   @relation(fields: [spelerId], references: [id])
  seizoen        String
  leeftijdsgroep String   @map("leeftijdsgroep") // snapshot

  // Overall USS
  ussOverall     Int?     @map("uss_overall")

  // Per-pijler USS (JSON voor variabele pijlers)
  ussPijlers     Json?    @map("uss_pijlers")  // { "AANVALLEN": 121, "VERDEDIGEN": 106, ... }

  // Bron-USS waarden
  ussCoach       Int?     @map("uss_coach")
  ussScout       Int?     @map("uss_scout")
  ussVergelijking Int?    @map("uss_vergelijking")
  ussTeam        Int?     @map("uss_team")        // anker
  ussBasislijn   Int?     @map("uss_basislijn")    // S(leeftijd)

  // Per-bron per-pijler (JSON)
  ussCoachPijlers       Json?  @map("uss_coach_pijlers")
  ussScoutPijlers       Json?  @map("uss_scout_pijlers")
  ussVergelijkingPijlers Json? @map("uss_vergelijking_pijlers")

  // Meta
  aantalCoachSessies     Int @default(0) @map("aantal_coach_sessies")
  aantalScoutSessies     Int @default(0) @map("aantal_scout_sessies")
  aantalVergelijkingen   Int @default(0) @map("aantal_vergelijkingen")
  betrouwbaarheid        String @default("concept")

  // Cross-validatie signalen
  crossValidatieSignalen Json?  @map("cross_validatie_signalen") // [{ pijler, verschil, type }]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([spelerId, seizoen])
  @@index([spelerId])
  @@index([seizoen])
  @@map("speler_uss")
}
```

#### ScoutingVergelijking + ScoutingVergelijkingPositie

Vergelijkende scouting: 2-6 spelers op een horizontale balk per pijler.

```prisma
model ScoutingVergelijking {
  id          String   @id @default(cuid())
  scoutId     String
  scout       Scout    @relation(fields: [scoutId], references: [id])
  seizoen     String
  datum       DateTime @default(now())
  context     ScoutingContext
  opmerking   String?  @db.Text

  // Scope
  teamId      Int?     @map("team_id")  // optioneel: vergelijking binnen team
  verzoekId   String?  @map("verzoek_id")

  posities    ScoutingVergelijkingPositie[]

  createdAt   DateTime @default(now())

  @@index([seizoen])
  @@index([scoutId])
  @@map("scouting_vergelijkingen")
}

model ScoutingVergelijkingPositie {
  id              String   @id @default(cuid())
  vergelijkingId  String   @map("vergelijking_id")
  vergelijking    ScoutingVergelijking @relation(fields: [vergelijkingId], references: [id], onDelete: Cascade)
  spelerId        String
  speler          Speler   @relation(fields: [spelerId], references: [id])
  pijlerCode      String   @map("pijler_code")  // "AANVALLEN", "VERDEDIGEN", etc.
  balkPositie     Decimal  @map("balk_positie") @db.Decimal(5, 2) // 0.00 - 100.00
  isAnker         Boolean  @default(false) @map("is_anker") // speler met bekende USS

  @@unique([vergelijkingId, spelerId, pijlerCode])
  @@index([vergelijkingId])
  @@index([spelerId])
  @@map("scouting_vergelijking_posities")
}
```

#### Relaties toevoegen aan bestaande modellen

```prisma
// Toevoegen aan model Speler:
  fysiekProfielen     FysiekProfiel[]
  spelerUSS           SpelerUSS[]
  vergelijkingPosities ScoutingVergelijkingPositie[]

// Toevoegen aan model Scout:
  vergelijkingen      ScoutingVergelijking[]
  fysiekProfielen     FysiekProfiel[]
```

### 2.3 Volledig ER-diagram (scouting-domein)

```
RaamwerkVersie (1 per seizoen)
  └── Leeftijdsgroep (1 per band)
       └── Pijler (variabel: 5/6/7/9 per groep)
            └── OntwikkelItem (kern + verdieping)

Scout
  ├── ScoutingRapport (individueel, per speler)
  │    └── scores: Json (itemCode → waarde)
  ├── TeamScoutingSessie (TEAM-methode)
  │    └── ScoutingRapport[] (1 per speler in team)
  ├── ScoutingVergelijking (VERGELIJKING-methode)
  │    └── ScoutingVergelijkingPositie[] (per speler × pijler)
  └── FysiekProfiel[] (contextdata)

Speler
  ├── ScoutingRapport[] (alle rapporten)
  ├── SpelersKaart (1 per seizoen, EWMA-geaggregeerd)
  ├── SpelerUSS (1 per seizoen, gecachte USS)
  ├── FysiekProfiel[] (1 per seizoen)
  └── ScoutingVergelijkingPositie[]
```

---

## 3. LeeftijdsgroepConfig (TypeScript constante)

Dit is de **hardcoded referentie** die de database-versie valideert. De database is leidend voor items; deze constante definieert de vaste structuur.

```typescript
// packages/types/src/leeftijdsgroep-config.ts

export type PijlerCode =
  | "BAL" | "BEWEGEN" | "SPEL" | "SAMEN" | "IK"           // Blauw/Groen
  | "AANVALLEN" | "VERDEDIGEN" | "TECHNIEK" | "TACTIEK"    // Geel+
  | "MENTAAL" | "FYSIEK"                                    // Geel+
  | "SOCIAAL"                                               // Oranje+
  | "SCOREN" | "SPELINTELLIGENTIE";                         // Rood

export type Blok = "korfbalacties" | "spelerskwaliteiten" | "persoonlijk";

export type SchaalTypeV3 =
  | "observatie"        // Paars: checkbox "Geobserveerd"
  | "ja_nogniet"        // Blauw: 2 niveaus
  | "goed_oke_nogniet"  // Groen: 3 niveaus
  | "sterren"           // Geel: 1-5
  | "slider";           // Oranje/Rood: 1-10

export type LeeftijdsgroepNaamV3 = "paars" | "blauw" | "groen" | "geel" | "oranje" | "rood";

export interface PijlerConfig {
  code: PijlerCode;
  naam: string;
  icoon: string;
  blok: Blok | null;       // null voor Blauw/Groen (geen blokken)
  gewicht: number;          // USS-gewicht (bijv. 0.25)
}

export interface LeeftijdsgroepConfig {
  band: LeeftijdsgroepNaamV3;
  leeftijdMin: number;
  leeftijdMax: number;
  schaalType: SchaalTypeV3;
  schaalMin: number;
  schaalMax: number;
  schaalMediaan: number;
  halveBereik: number;
  bandbreedteCoach: number;   // B_coach (USS-punten)
  bandbreedteScout: number;   // B_scout (USS-punten)
  kernItemsTarget: number;    // Target: ~10
  pijlers: PijlerConfig[];
  heeftFysiekProfiel: boolean;
  heeftSignaalvlag: boolean;  // sociale veiligheid
  signaalvlagType: "ja_nee" | "scorend" | null;
}

export const LEEFTIJDSGROEP_CONFIG: Record<LeeftijdsgroepNaamV3, LeeftijdsgroepConfig> = {
  paars: {
    band: "paars",
    leeftijdMin: 4, leeftijdMax: 5,
    schaalType: "observatie",
    schaalMin: 0, schaalMax: 1, schaalMediaan: 0.5, halveBereik: 0.5,
    bandbreedteCoach: 0, bandbreedteScout: 0,  // geen USS bij Paars
    kernItemsTarget: 3,
    pijlers: [], // Paars: geen pijlers, alleen observatienotitie
    heeftFysiekProfiel: false,
    heeftSignaalvlag: false,
    signaalvlagType: null,
  },
  blauw: {
    band: "blauw",
    leeftijdMin: 5, leeftijdMax: 7,
    schaalType: "ja_nogniet",
    schaalMin: 0, schaalMax: 100, schaalMediaan: 50, halveBereik: 50,
    bandbreedteCoach: 15, bandbreedteScout: 18,
    kernItemsTarget: 10,
    pijlers: [
      { code: "BAL",     naam: "Bal",     icoon: "🏐", blok: null, gewicht: 0.25 },
      { code: "BEWEGEN", naam: "Bewegen", icoon: "🏃", blok: null, gewicht: 0.25 },
      { code: "SPEL",    naam: "Spel",    icoon: "🎮", blok: null, gewicht: 0.25 },
      { code: "SAMEN",   naam: "Samen",   icoon: "🤝", blok: null, gewicht: 0.125 },
      { code: "IK",      naam: "Ik",      icoon: "💫", blok: null, gewicht: 0.125 },
    ],
    heeftFysiekProfiel: false,
    heeftSignaalvlag: true,
    signaalvlagType: "ja_nee",
  },
  groen: {
    band: "groen",
    leeftijdMin: 8, leeftijdMax: 9,
    schaalType: "goed_oke_nogniet",
    schaalMin: 0, schaalMax: 100, schaalMediaan: 50, halveBereik: 50,
    bandbreedteCoach: 18, bandbreedteScout: 22,
    kernItemsTarget: 10,
    pijlers: [
      { code: "BAL",     naam: "Bal",     icoon: "🏐", blok: null, gewicht: 0.25 },
      { code: "BEWEGEN", naam: "Bewegen", icoon: "🏃", blok: null, gewicht: 0.25 },
      { code: "SPEL",    naam: "Spel",    icoon: "🎮", blok: null, gewicht: 0.25 },
      { code: "SAMEN",   naam: "Samen",   icoon: "🤝", blok: null, gewicht: 0.125 },
      { code: "IK",      naam: "Ik",      icoon: "💫", blok: null, gewicht: 0.125 },
    ],
    heeftFysiekProfiel: false,
    heeftSignaalvlag: true,
    signaalvlagType: "ja_nee",
  },
  geel: {
    band: "geel",
    leeftijdMin: 10, leeftijdMax: 12,
    schaalType: "sterren",
    schaalMin: 1.0, schaalMax: 5.0, schaalMediaan: 3.0, halveBereik: 2.0,
    bandbreedteCoach: 20, bandbreedteScout: 28,
    kernItemsTarget: 10,
    pijlers: [
      { code: "AANVALLEN",  naam: "Aanvallen",  icoon: "⚡", blok: "korfbalacties",      gewicht: 0.18 },
      { code: "VERDEDIGEN", naam: "Verdedigen", icoon: "🛡️", blok: "korfbalacties",      gewicht: 0.18 },
      { code: "TECHNIEK",   naam: "Techniek",   icoon: "🎯", blok: "spelerskwaliteiten", gewicht: 0.18 },
      { code: "TACTIEK",    naam: "Tactiek",    icoon: "🧩", blok: "spelerskwaliteiten", gewicht: 0.18 },
      { code: "MENTAAL",    naam: "Mentaal",    icoon: "🧠", blok: "spelerskwaliteiten", gewicht: 0.14 },
      { code: "FYSIEK",     naam: "Fysiek",     icoon: "💪", blok: "spelerskwaliteiten", gewicht: 0.14 },
    ],
    heeftFysiekProfiel: true,
    heeftSignaalvlag: true,
    signaalvlagType: "scorend",
  },
  oranje: {
    band: "oranje",
    leeftijdMin: 13, leeftijdMax: 15,
    schaalType: "slider",
    schaalMin: 1.0, schaalMax: 10.0, schaalMediaan: 5.5, halveBereik: 4.5,
    bandbreedteCoach: 22, bandbreedteScout: 30,
    kernItemsTarget: 10,
    pijlers: [
      { code: "AANVALLEN",  naam: "Aanvallen",  icoon: "⚡", blok: "korfbalacties",      gewicht: 0.16 },
      { code: "VERDEDIGEN", naam: "Verdedigen", icoon: "🛡️", blok: "korfbalacties",      gewicht: 0.16 },
      { code: "TECHNIEK",   naam: "Techniek",   icoon: "🎯", blok: "spelerskwaliteiten", gewicht: 0.16 },
      { code: "TACTIEK",    naam: "Tactiek",    icoon: "🧩", blok: "spelerskwaliteiten", gewicht: 0.16 },
      { code: "MENTAAL",    naam: "Mentaal",    icoon: "🧠", blok: "persoonlijk",        gewicht: 0.12 },
      { code: "SOCIAAL",    naam: "Sociaal",    icoon: "👥", blok: "persoonlijk",        gewicht: 0.12 },
      { code: "FYSIEK",     naam: "Fysiek",     icoon: "💪", blok: "persoonlijk",        gewicht: 0.12 },
    ],
    heeftFysiekProfiel: true,
    heeftSignaalvlag: true,
    signaalvlagType: "scorend",
  },
  rood: {
    band: "rood",
    leeftijdMin: 16, leeftijdMax: 18,
    schaalType: "slider",
    schaalMin: 1.0, schaalMax: 10.0, schaalMediaan: 5.5, halveBereik: 4.5,
    bandbreedteCoach: 25, bandbreedteScout: 32,
    kernItemsTarget: 9,  // 9 pijlers, 1 kern-item per pijler
    pijlers: [
      { code: "AANVALLEN",        naam: "Aanvallen",        icoon: "⚡",  blok: "korfbalacties",      gewicht: 0.12 },
      { code: "VERDEDIGEN",       naam: "Verdedigen",       icoon: "🛡️",  blok: "korfbalacties",      gewicht: 0.12 },
      { code: "SCOREN",           naam: "Scoren",           icoon: "🎯",  blok: "korfbalacties",      gewicht: 0.12 },
      { code: "TECHNIEK",         naam: "Techniek",         icoon: "🔧",  blok: "spelerskwaliteiten", gewicht: 0.12 },
      { code: "TACTIEK",          naam: "Tactiek",          icoon: "🧩",  blok: "spelerskwaliteiten", gewicht: 0.10 },
      { code: "SPELINTELLIGENTIE", naam: "Spelintelligentie", icoon: "🧠", blok: "spelerskwaliteiten", gewicht: 0.10 },
      { code: "MENTAAL",          naam: "Mentaal",          icoon: "💡",  blok: "persoonlijk",        gewicht: 0.10 },
      { code: "SOCIAAL",          naam: "Sociaal",          icoon: "👥",  blok: "persoonlijk",        gewicht: 0.10 },
      { code: "FYSIEK",           naam: "Fysiek",           icoon: "💪",  blok: "persoonlijk",        gewicht: 0.12 },
    ],
    heeftFysiekProfiel: true,
    heeftSignaalvlag: true,
    signaalvlagType: "scorend",
  },
};
```

### Hulpfuncties bij de config

```typescript
/** Haal de config op voor een leeftijdsgroep */
export function getGroepConfig(band: LeeftijdsgroepNaamV3): LeeftijdsgroepConfig {
  return LEEFTIJDSGROEP_CONFIG[band];
}

/** Haal alle pijlercodes op voor een leeftijdsgroep */
export function getPijlerCodes(band: LeeftijdsgroepNaamV3): PijlerCode[] {
  return LEEFTIJDSGROEP_CONFIG[band].pijlers.map((p) => p.code);
}

/** Haal de gewichten op als Record<PijlerCode, number> */
export function getPijlerGewichten(band: LeeftijdsgroepNaamV3): Record<PijlerCode, number> {
  const config = LEEFTIJDSGROEP_CONFIG[band];
  const result: Partial<Record<PijlerCode, number>> = {};
  for (const p of config.pijlers) {
    result[p.code] = p.gewicht;
  }
  return result as Record<PijlerCode, number>;
}
```

---

## 4. USS v2 berekeningen (TypeScript functies)

Locatie: `packages/types/src/score-model-v2.ts`

### 4.1 berekenPijlerscore

Bereken de ruwe pijlerscore uit item-scores, per leeftijdsgroep-schaal.

```typescript
import type { LeeftijdsgroepNaamV3, PijlerCode } from "./leeftijdsgroep-config";
import { LEEFTIJDSGROEP_CONFIG } from "./leeftijdsgroep-config";

/**
 * Codering per schaaltype:
 * - ja_nogniet:       Ja=1, Nog niet=0 → percentage (0-100)
 * - goed_oke_nogniet: Goed=1, Oke=0.5, Nog niet=0 → percentage (0-100)
 * - sterren:          Waarde 1.0-5.0 → gemiddelde
 * - slider:           Waarde 1.0-10.0 → gemiddelde
 */
export function berekenPijlerscore(
  itemScores: number[],
  band: LeeftijdsgroepNaamV3
): number | null {
  if (itemScores.length === 0) return null;

  const config = LEEFTIJDSGROEP_CONFIG[band];
  const gemiddelde = itemScores.reduce((a, b) => a + b, 0) / itemScores.length;

  switch (config.schaalType) {
    case "ja_nogniet":
      // Ja=1, Nog niet=0 → percentage
      return Math.round(gemiddelde * 100);
    case "goed_oke_nogniet":
      // Goed=1, Oke=0.5, Nog niet=0 → percentage
      return Math.round(gemiddelde * 100);
    case "sterren":
    case "slider":
      // Gemiddelde op de originele schaal
      return Math.round(gemiddelde * 100) / 100;
    case "observatie":
      return null; // Paars: geen score
    default:
      return null;
  }
}
```

### 4.2 converteerCoachNaarUSS

Coach-evaluatie (TEAM-methode): scores relatief aan team-USS.

```typescript
/**
 * Converteer een coach pijlerscore naar USS, verankerd aan USS_team.
 *
 * Formule: USS_coach_pijler = USS_team + ((pijlerscore - mediaan) / halve_bereik) * B_coach
 *
 * @param pijlerscore  Ruwe pijlerscore (percentage of gemiddelde)
 * @param band         Leeftijdsgroep
 * @param ussTeam      USS van het team (KNKV-rating of A-categorie)
 */
export function converteerCoachNaarUSS(
  pijlerscore: number,
  band: LeeftijdsgroepNaamV3,
  ussTeam: number
): number {
  const config = LEEFTIJDSGROEP_CONFIG[band];
  const { schaalMediaan, halveBereik, bandbreedteCoach } = config;

  if (halveBereik === 0 || bandbreedteCoach === 0) return ussTeam;

  const offset = ((pijlerscore - schaalMediaan) / halveBereik) * bandbreedteCoach;
  return Math.round(Math.max(0, Math.min(200, ussTeam + offset)));
}

/**
 * Bereken USS_coach voor alle pijlers + overall.
 */
export function berekenUSSCoach(
  pijlerScores: Record<string, number>,
  band: LeeftijdsgroepNaamV3,
  ussTeam: number
): { pijlers: Record<string, number>; overall: number } {
  const config = LEEFTIJDSGROEP_CONFIG[band];
  const pijlerUSS: Record<string, number> = {};

  for (const pijler of config.pijlers) {
    const score = pijlerScores[pijler.code];
    if (score != null) {
      pijlerUSS[pijler.code] = converteerCoachNaarUSS(score, band, ussTeam);
    }
  }

  // Overall = gewogen gemiddelde
  let som = 0;
  let gewichtSom = 0;
  for (const pijler of config.pijlers) {
    if (pijlerUSS[pijler.code] != null) {
      som += pijler.gewicht * pijlerUSS[pijler.code];
      gewichtSom += pijler.gewicht;
    }
  }

  const overall = gewichtSom > 0 ? Math.round(som / gewichtSom) : ussTeam;

  return { pijlers: pijlerUSS, overall };
}
```

### 4.3 converteerScoutNaarUSS

Individuele scouting: scores verankerd aan de basislijn voor de leeftijd.

```typescript
import { berekenUSSBasislijn } from "./score-model";

/**
 * Converteer een scout pijlerscore naar USS, verankerd aan basislijn(leeftijd).
 *
 * Formule: USS_scout_pijler = USS_basislijn(leeftijd) + ((pijlerscore - mediaan) / halve_bereik) * B_scout
 */
export function converteerScoutNaarUSS(
  pijlerscore: number,
  band: LeeftijdsgroepNaamV3,
  leeftijd: number
): number {
  const config = LEEFTIJDSGROEP_CONFIG[band];
  const { schaalMediaan, halveBereik, bandbreedteScout } = config;
  const basislijn = berekenUSSBasislijn(leeftijd);

  if (halveBereik === 0 || bandbreedteScout === 0) return basislijn;

  const offset = ((pijlerscore - schaalMediaan) / halveBereik) * bandbreedteScout;
  return Math.round(Math.max(0, Math.min(200, basislijn + offset)));
}

/**
 * Bereken USS_scout voor alle pijlers + overall.
 */
export function berekenUSSScout(
  pijlerScores: Record<string, number>,
  band: LeeftijdsgroepNaamV3,
  leeftijd: number
): { pijlers: Record<string, number>; overall: number } {
  const config = LEEFTIJDSGROEP_CONFIG[band];
  const pijlerUSS: Record<string, number> = {};

  for (const pijler of config.pijlers) {
    const score = pijlerScores[pijler.code];
    if (score != null) {
      pijlerUSS[pijler.code] = converteerScoutNaarUSS(score, band, leeftijd);
    }
  }

  let som = 0;
  let gewichtSom = 0;
  for (const pijler of config.pijlers) {
    if (pijlerUSS[pijler.code] != null) {
      som += pijler.gewicht * pijlerUSS[pijler.code];
      gewichtSom += pijler.gewicht;
    }
  }

  const basislijn = berekenUSSBasislijn(leeftijd);
  const overall = gewichtSom > 0 ? Math.round(som / gewichtSom) : basislijn;

  return { pijlers: pijlerUSS, overall };
}
```

### 4.4 converteerVergelijkingNaarUSS

Vergelijkende scouting: balkposities vertalen naar USS via ankers.

```typescript
export interface VergelijkingPositie {
  spelerId: string;
  balkPositie: number;  // 0-100
  bekendeUSS?: number;  // als de speler een bekende USS heeft
}

/**
 * Converteer vergelijkingsposities naar USS per pijler.
 *
 * Strategie:
 * 1. Als >= 2 ankers: lineaire interpolatie
 * 2. Als 1 anker: extrapolatie met B_coach als spreiding
 * 3. Als 0 ankers: fallback naar team-USS offset
 */
export function converteerVergelijkingNaarUSS(
  posities: VergelijkingPositie[],
  band: LeeftijdsgroepNaamV3,
  ussTeam: number
): Record<string, number> {
  const config = LEEFTIJDSGROEP_CONFIG[band];
  const ankers = posities.filter((p) => p.bekendeUSS != null);
  const result: Record<string, number> = {};

  if (ankers.length >= 2) {
    // Lineaire interpolatie tussen twee ankers
    const a1 = ankers[0];
    const a2 = ankers[1];
    const ussPerPunt = (a2.bekendeUSS! - a1.bekendeUSS!) / (a2.balkPositie - a1.balkPositie);

    for (const pos of posities) {
      const uss = a1.bekendeUSS! + (pos.balkPositie - a1.balkPositie) * ussPerPunt;
      result[pos.spelerId] = Math.round(Math.max(0, Math.min(200, uss)));
    }
  } else if (ankers.length === 1) {
    // Eén anker + bandbreedte
    const anker = ankers[0];
    const B = config.bandbreedteCoach;
    for (const pos of posities) {
      const uss = anker.bekendeUSS! + ((pos.balkPositie - anker.balkPositie) / 50) * B;
      result[pos.spelerId] = Math.round(Math.max(0, Math.min(200, uss)));
    }
  } else {
    // Geen ankers: fallback naar team-USS
    const B = config.bandbreedteCoach;
    for (const pos of posities) {
      const uss = ussTeam + ((pos.balkPositie - 50) / 50) * B;
      result[pos.spelerId] = Math.round(Math.max(0, Math.min(200, uss)));
    }
  }

  return result;
}
```

### 4.5 combineUSS

Combineer USS uit meerdere bronnen met gewichten en recentheidscorrectie.

```typescript
/**
 * Gewichtentabel: USS v2, sectie 9.2
 */
const BRON_GEWICHTEN = [
  { minScoutSessies: 7,  wScout: 0.65, wCoach: 0.20, wVerg: 0.15 },
  { minScoutSessies: 4,  wScout: 0.55, wCoach: 0.30, wVerg: 0.15 },
  { minScoutSessies: 2,  wScout: 0.45, wCoach: 0.40, wVerg: 0.15 },
  { minScoutSessies: 1,  wScout: 0.30, wCoach: 0.55, wVerg: 0.15 },
  { minScoutSessies: 0,  wScout: 0.00, wCoach: 0.85, wVerg: 0.15 },
] as const;

/**
 * Vervalfactoren op basis van leeftijd van de score.
 */
function vervalfactor(maandenOud: number): number {
  if (maandenOud <= 3) return 1.0;
  if (maandenOud <= 6) return 0.9;
  if (maandenOud <= 12) return 0.7;
  return 0.4;
}

export interface USSBronnen {
  ussCoach: number | null;
  ussScout: number | null;
  ussVergelijking: number | null;
  aantalScoutSessies: number;
  maandenOudCoach?: number;
  maandenOudScout?: number;
  maandenOudVergelijking?: number;
}

/**
 * Combineer USS uit meerdere bronnen met gewichten en recentheidscorrectie.
 *
 * Per pijler OF overall.
 */
export function combineUSS(bronnen: USSBronnen): number | null {
  const { ussCoach, ussScout, ussVergelijking, aantalScoutSessies } = bronnen;

  // Vind de juiste gewichtentabel
  const rij = BRON_GEWICHTEN.find((r) => aantalScoutSessies >= r.minScoutSessies);
  if (!rij) return null;

  let { wScout, wCoach, wVerg } = rij;

  // Recentheidscorrectie
  const vfCoach = vervalfactor(bronnen.maandenOudCoach ?? 0);
  const vfScout = vervalfactor(bronnen.maandenOudScout ?? 0);
  const vfVerg  = vervalfactor(bronnen.maandenOudVergelijking ?? 0);

  wCoach *= vfCoach;
  wScout *= vfScout;
  wVerg  *= vfVerg;

  // Beschikbaarheidscheck: als een bron null is, herverdeel gewicht
  const beschikbaar: { w: number; uss: number }[] = [];
  if (ussCoach != null) beschikbaar.push({ w: wCoach, uss: ussCoach });
  if (ussScout != null) beschikbaar.push({ w: wScout, uss: ussScout });
  if (ussVergelijking != null) beschikbaar.push({ w: wVerg, uss: ussVergelijking });

  if (beschikbaar.length === 0) return null;

  // Hernormaliseer gewichten
  const totaalGewicht = beschikbaar.reduce((sum, b) => sum + b.w, 0);
  if (totaalGewicht === 0) return null;

  const uss = beschikbaar.reduce((sum, b) => sum + (b.w / totaalGewicht) * b.uss, 0);
  return Math.round(Math.max(0, Math.min(200, uss)));
}
```

### 4.6 berekenOverallUSS

Bereken de volledige speler-USS uit alle beschikbare data.

```typescript
/**
 * Bereken de volledige speler-USS: per pijler + overall.
 *
 * Dit is de hoofdfunctie die alle bronnen combineert.
 */
export function berekenOverallUSS(input: {
  band: LeeftijdsgroepNaamV3;
  ussTeam: number | null;
  leeftijd: number;
  coachPijlerScores: Record<string, number> | null;
  scoutPijlerScores: Record<string, number> | null;
  vergelijkingPijlerUSS: Record<string, number> | null;
  aantalScoutSessies: number;
  maandenOudCoach?: number;
  maandenOudScout?: number;
  maandenOudVergelijking?: number;
}): { ussPijlers: Record<string, number>; ussOverall: number } {
  const config = LEEFTIJDSGROEP_CONFIG[input.band];
  const effectiefUssTeam = input.ussTeam ?? berekenUSSBasislijn(input.leeftijd);

  // Stap 1: Bereken per-bron per-pijler USS
  const coachUSS = input.coachPijlerScores
    ? berekenUSSCoach(input.coachPijlerScores, input.band, effectiefUssTeam)
    : null;

  const scoutUSS = input.scoutPijlerScores
    ? berekenUSSScout(input.scoutPijlerScores, input.band, input.leeftijd)
    : null;

  // Stap 2: Combineer per pijler
  const ussPijlers: Record<string, number> = {};

  for (const pijler of config.pijlers) {
    const gecombineerd = combineUSS({
      ussCoach: coachUSS?.pijlers[pijler.code] ?? null,
      ussScout: scoutUSS?.pijlers[pijler.code] ?? null,
      ussVergelijking: input.vergelijkingPijlerUSS?.[pijler.code] ?? null,
      aantalScoutSessies: input.aantalScoutSessies,
      maandenOudCoach: input.maandenOudCoach,
      maandenOudScout: input.maandenOudScout,
      maandenOudVergelijking: input.maandenOudVergelijking,
    });

    if (gecombineerd != null) {
      ussPijlers[pijler.code] = gecombineerd;
    }
  }

  // Stap 3: Overall = gewogen gemiddelde van pijler-USS
  let som = 0;
  let gewichtSom = 0;
  for (const pijler of config.pijlers) {
    if (ussPijlers[pijler.code] != null) {
      som += pijler.gewicht * ussPijlers[pijler.code];
      gewichtSom += pijler.gewicht;
    }
  }

  const ussOverall = gewichtSom > 0
    ? Math.round(som / gewichtSom)
    : effectiefUssTeam;

  return { ussPijlers, ussOverall };
}
```

### 4.7 valideerTeamUSS

Cross-validatie: vergelijk team-USS met gemiddelde speler-USS.

```typescript
export interface TeamValidatieResultaat {
  ussTeam: number;
  gemiddeldSpelerUSS: number;
  verschil: number;
  type: "overall" | "pijler";
  pijler?: string;
  signaal: "ok" | "aandacht" | "afwijking";
  mogelijkeOorzaak?: string;
}

/**
 * Valideer team-USS tegen gemiddelde speler-USS.
 *
 * USS_team moet ongeveer gelijk zijn aan gemiddelde(USS_speler).
 * Afwijking > 15 punten: signaal.
 */
export function valideerTeamUSS(
  ussTeam: number,
  spelerUSSWaarden: number[],
  pijlerUSSWaarden?: Record<string, number[]>
): TeamValidatieResultaat[] {
  const resultaten: TeamValidatieResultaat[] = [];

  // Overall check
  if (spelerUSSWaarden.length > 0) {
    const gem = Math.round(
      spelerUSSWaarden.reduce((a, b) => a + b, 0) / spelerUSSWaarden.length
    );
    const verschil = gem - ussTeam;
    resultaten.push({
      ussTeam,
      gemiddeldSpelerUSS: gem,
      verschil,
      type: "overall",
      signaal: Math.abs(verschil) > 15 ? "afwijking" : Math.abs(verschil) > 8 ? "aandacht" : "ok",
      mogelijkeOorzaak:
        verschil > 15 ? "Spelers sterker dan resultaten — coaching-effect?" :
        verschil < -15 ? "Team presteert boven individueel niveau — chemie!" :
        undefined,
    });
  }

  // Per-pijler check
  if (pijlerUSSWaarden) {
    for (const [pijler, waarden] of Object.entries(pijlerUSSWaarden)) {
      if (waarden.length === 0) continue;
      const gem = Math.round(waarden.reduce((a, b) => a + b, 0) / waarden.length);
      const verschil = gem - ussTeam;
      resultaten.push({
        ussTeam,
        gemiddeldSpelerUSS: gem,
        verschil,
        type: "pijler",
        pijler,
        signaal: Math.abs(verschil) > 20 ? "afwijking" : Math.abs(verschil) > 10 ? "aandacht" : "ok",
      });
    }
  }

  return resultaten;
}
```

---

## 5. API-endpoints

Alle endpoints volgen het bestaande patroon uit `apps/scouting/`:
- `ok(data)` / `fail(message, status, code)` response helpers
- `parseBody(request, ZodSchema)` voor body-validatie
- `auth()` uit `@oranje-wit/auth` voor authenticatie
- `prisma` (of `db = prisma as any` voor Prisma 7 type workarounds)

### 5.1 Scouting Rapport — v2 (aanpassing bestaand)

**Path:** `POST /api/scouting/rapport`
**Wijziging:** Pijlerscores worden dynamisch berekend op basis van de leeftijdsgroep-config.

```typescript
const RapportSchemaV2 = z.object({
  spelerId: z.string().min(1),
  context: z.enum(["WEDSTRIJD", "TRAINING", "OVERIG"]),
  contextDetail: z.string().optional(),
  scores: z.record(z.string(), z.number()),   // itemCode -> waarde
  opmerking: z.string().optional(),
  verzoekId: z.string().optional(),
  relatie: z.enum(["GEEN", "OUDER", "FAMILIE", "BEKENDE", "TRAINER"]).optional(),
  nietBeoordeeld: z.boolean().optional(),
  methode: z.enum(["INDIVIDUEEL", "TEAM"]).default("INDIVIDUEEL"),  // NIEUW
});
```

**Logica-aanpassingen:**
1. Pijlerscores berekenen met `berekenPijlerscore()` per pijler uit de leeftijdsgroep-config (niet meer hardcoded 6 pijlers)
2. SpelersKaart updaten met `pijlerScores` JSON-veld in plaats van vaste kolommen
3. SpelerUSS herberekenen en cachen na elk rapport

### 5.2 Team-scouting — v2 (aanpassing bestaand)

**Path:** `POST /api/scouting/team`
**Wijziging:** Rankings worden per-pijler opgeslagen (v3.0 pijlercodes).

```typescript
const TeamRapportSchemaV2 = z.object({
  owTeamId: z.number().int().positive(),
  context: z.enum(["WEDSTRIJD", "TRAINING", "OVERIG"]),
  contextDetail: z.string().optional(),
  rapporten: z.array(z.object({
    spelerId: z.string().min(1),
    scores: z.record(z.string(), z.number()),
    opmerking: z.string().optional(),
  })).min(1),
  rankings: z.record(z.string(), z.array(z.string())).optional(), // pijlerCode -> [spelerId, ...]
});
```

### 5.3 Vergelijking (NIEUW)

**Path:** `POST /api/scouting/vergelijking`
**Methode:** POST
**Autorisatie:** Scout (TC of met verzoek)

```typescript
const VergelijkingSchema = z.object({
  context: z.enum(["WEDSTRIJD", "TRAINING", "OVERIG"]),
  teamId: z.number().optional(),
  verzoekId: z.string().optional(),
  opmerking: z.string().optional(),
  posities: z.array(z.object({
    spelerId: z.string().min(1),
    pijlerCode: z.string().min(1),    // "AANVALLEN", "VERDEDIGEN", etc.
    balkPositie: z.number().min(0).max(100),
  })).min(2),
});
```

**Response:**

```typescript
ok({
  vergelijking: {
    id: string;
    spelersUSS: Record<string, Record<string, number>>; // spelerId -> { pijler -> USS }
  },
  xpGained: number;
  totalXp: number;
  levelInfo: LevelInfo;
});
```

**Logica:**
1. Groepeer posities per pijler
2. Per pijler: zoek ankers (spelers met bestaande USS)
3. Bereken USS per speler per pijler via `converteerVergelijkingNaarUSS()`
4. Sla `ScoutingVergelijking` + `ScoutingVergelijkingPositie` records op
5. Herbereken `SpelerUSS` voor alle betrokken spelers

### 5.4 Fysiek Profiel (NIEUW)

**Path:** `POST /api/spelers/[relCode]/fysiek-profiel`
**Methode:** POST
**Autorisatie:** Scout (TC of trainer)

```typescript
const FysiekProfielSchema = z.object({
  lengte: z.enum(["ONDER_GEMIDDELD", "GEMIDDELD", "BOVENGEMIDDELD", "UITZONDERLIJK"]).optional(),
  lichaamsbouw: z.enum(["LICHT", "GEMIDDELD_LB", "STEVIG"]).optional(),
  atletischType: z.enum(["ONDER_GEMIDDELD_AT", "GEMIDDELD_AT", "BOVENGEMIDDELD_AT", "UITZONDERLIJK_AT"]).optional(),
  opmerking: z.string().optional(),
});
```

**Validatie:** Alleen beschikbaar voor spelers in leeftijdsgroep Geel+ (10+).

### 5.5 SpelerUSS ophalen (NIEUW)

**Path:** `GET /api/spelers/[relCode]/uss`
**Methode:** GET
**Autorisatie:** Ingelogd (VIEWER+)

**Response:**

```typescript
ok({
  spelerId: string;
  seizoen: string;
  leeftijdsgroep: string;
  ussOverall: number | null;
  ussPijlers: Record<string, number>;
  ussCoach: number | null;
  ussScout: number | null;
  ussVergelijking: number | null;
  ussTeam: number | null;
  ussBasislijn: number;
  betrouwbaarheid: string;
  crossValidatieSignalen: CrossValidatieSignaal[];
});
```

### 5.6 Team USS validatie (NIEUW)

**Path:** `GET /api/teams/[owTeamId]/uss-validatie`
**Methode:** GET
**Autorisatie:** TC (EDITOR)

**Response:**

```typescript
ok({
  teamId: number;
  ussTeam: number;
  validatie: TeamValidatieResultaat[];
  spelersUSS: Array<{
    spelerId: string;
    naam: string;
    ussOverall: number;
    ussPijlers: Record<string, number>;
  }>;
});
```

### 5.7 Admin: Itemcatalogus CRUD (NIEUW)

**Path:** `GET/POST /api/admin/catalogus`
**Path:** `GET/PUT/DELETE /api/admin/catalogus/[itemId]`
**Autorisatie:** TC (EDITOR) + isAdmin check

Zie sectie 7 voor details.

### 5.8 USS herberekenen (NIEUW)

**Path:** `POST /api/admin/uss/herbereken`
**Methode:** POST
**Autorisatie:** TC (EDITOR) + isAdmin

```typescript
const HerberekenSchema = z.object({
  scope: z.enum(["speler", "team", "alles"]),
  spelerId: z.string().optional(),
  teamId: z.number().optional(),
});
```

Triggert herberekening van SpelerUSS voor de opgegeven scope.

---

## 6. UI-flows (stap-voor-stap)

### 6.1 TEAM-methode

```
1. Scout opent "Team Scouten" vanuit dashboard
2. Selecteer team (OWTeam) → systeem laadt alle spelers
3. Systeem bepaalt leeftijdsgroep van het team → laadt kern-items (~10)
4. Per speler verschijnt de kernset:
   - Blauw/Groen: checkboxes (Ja / Nog niet) of (Goed / Oke / Nog niet)
   - Geel: sterrenkiezer (1-5 per item)
   - Oranje/Rood: slider (1-10 per item)
5. Swipe naar volgende speler (of grid-view: alle spelers in kolommen)
6. Optioneel: rankings per pijler (drag-and-drop volgorde)
7. Bevestigen → POST /api/scouting/team
8. Resultaat: spelerskaarten updaten, XP + badges tonen
```

**UI-component:** `<TeamScoutingForm>` met dynamische itemlijst op basis van leeftijdsgroep.

### 6.2 INDIVIDUEEL

```
1. Scout opent speler (via verzoek of vrij scouten)
2. Systeem bepaalt leeftijdsgroep → laadt ALLE items (kern + verdieping)
3. Kern-items gemarkeerd met een ster-icoon, verdieping als optioneel
4. Invullen per pijler (gegroepeerd in blokken bij Geel+):
   - Blok "Korfbalacties": AANVALLEN, VERDEDIGEN, (SCOREN bij Rood)
   - Blok "Spelerskwaliteiten": TECHNIEK, TACTIEK, (SPELINTELLIGENTIE bij Rood)
   - Blok "Persoonlijk": MENTAAL, (SOCIAAL bij Oranje+), FYSIEK
5. Optioneel: fysiek profiel invullen (alleen bij Geel+)
6. Optioneel: sociale veiligheid signaalvlag
7. Vrij tekstveld voor opmerkingen
8. Bevestigen → POST /api/scouting/rapport (methode: "INDIVIDUEEL")
9. Resultaat: spelerskaart + USS update + XP
```

### 6.3 VERGELIJKING

```
1. Scout opent "Vergelijking" (via verzoek of vrij)
2. Selecteer 2-6 spelers (uit hetzelfde team of leeftijdsgroep)
3. Per pijler verschijnt een horizontale balk (0-100)
4. Sleep spelers naar hun relatieve positie op de balk
5. Systeem toont bij spelers met bekende USS hun USS-score als ankerpunt
6. Herhaal voor elke relevante pijler
7. Optioneel: opmerking per vergelijking
8. Bevestigen → POST /api/scouting/vergelijking
9. Resultaat: USS per speler per pijler, signalering van anker-gebruik
```

**UI-component:** `<VergelijkingsBalk pijler="AANVALLEN" spelers={...} />` met drag-and-drop.

### 6.4 Spelerskaart

De spelerskaart is het centrale resultaat. Het uiterlijk verschilt per leeftijdsgroep:

```
BLAUW/GROEN — 1 blok, 5 pijlers, percentagebalk
  Component: <PijlerBalk pijlers={5} schaal="percentage" />

GEEL — 2 blokken, 6 pijlers, sterrenbalk
  Component: <PijlerBlokken blokken={2} schaal="sterren" />

ORANJE — 3 blokken, 7 pijlers, slider-balk + USS
  Component: <PijlerBlokken blokken={3} schaal="slider" toonUSS={true} />

ROOD — 3 blokken, 9 pijlers, slider-balk + USS + KERN/ONDERSCHEIDEND markering
  Component: <PijlerBlokken blokken={3} schaal="slider" toonUSS={true} toonCategorie={true} />
```

De kaart toont:
- Pijlerscores (gewogen gemiddelde van items)
- Trend (stijgend/dalend/stabiel)
- USS overall (bij Geel+)
- Betrouwbaarheid (concept/basis/betrouwbaar/bevestigd)
- Cross-validatie signalen (bij afwijking coach vs. scout)

---

## 7. Admin/Beheer itemcatalogus

### 7.1 Wat is beheerbaar (DYNAMISCH)

- Items per pijler: toevoegen, verwijderen, herformuleren
- Kern- of verdiepingsmarkering per item
- Volgorde van items binnen een pijler
- Formuleringen aanpassen (zolang het observeerbaar gedrag blijft)
- Actief/inactief markeren

### 7.2 Wat is VAST (niet wijzigbaar via admin)

- Pijlernamen en hun toewijzing per leeftijdsgroep
- Schaal per leeftijdsgroep
- USS-berekening (formules, gewichten)
- Het Inside Out principe
- Minimaal 1 kern-item per pijler

### 7.3 Validatieregels (Zod + server-side)

```typescript
const ItemCreateSchema = z.object({
  pijlerId: z.string().min(1),
  itemCode: z.string().min(3).max(50).regex(/^[a-z_]+$/,
    "Item-code moet lowercase zijn met underscores"),
  label: z.string().min(3).max(100),
  vraagTekst: z.string().min(10).max(500),
  isKern: z.boolean().default(false),
  categorie: z.enum(["KERN", "ONDERSCHEIDEND"]).optional(),
  volgorde: z.number().int().min(0).default(0),
});
```

**Server-side validaties bij wijzigen:**

```typescript
async function valideerCatalogusWijziging(versieId: string): Promise<string[]> {
  const fouten: string[] = [];

  const groepen = await prisma.leeftijdsgroep.findMany({
    where: { versieId },
    include: {
      pijlers: {
        include: {
          items: { where: { actief: true } },
        },
      },
    },
  });

  for (const groep of groepen) {
    // Regel 1: Elke pijler minimaal 1 kern-item
    for (const pijler of groep.pijlers) {
      const kernItems = pijler.items.filter((i) => i.isKern);
      if (kernItems.length === 0) {
        fouten.push(`${groep.band}/${pijler.naam}: minimaal 1 kern-item vereist`);
      }
    }

    // Regel 2: Kern-items per groep: 8-12
    const totaalKern = groep.pijlers
      .flatMap((p) => p.items)
      .filter((i) => i.isKern).length;

    if (groep.band !== "paars") {
      if (totaalKern < 8) {
        fouten.push(`${groep.band}: minimaal 8 kern-items (nu: ${totaalKern})`);
      }
      if (totaalKern > 12) {
        fouten.push(`${groep.band}: maximaal 12 kern-items (nu: ${totaalKern})`);
      }
    }

    // Regel 3: Items uniek binnen pijler
    for (const pijler of groep.pijlers) {
      const codes = pijler.items.map((i) => i.itemCode);
      const dubbel = codes.filter((c, i) => codes.indexOf(c) !== i);
      if (dubbel.length > 0) {
        fouten.push(`${groep.band}/${pijler.naam}: dubbele item-codes: ${dubbel.join(", ")}`);
      }
    }
  }

  return fouten;
}
```

### 7.4 Admin-UI flow

```
1. TC-lid met isAdmin=true opent "/admin/catalogus"
2. Overzicht: alle leeftijdsgroepen als tabs
3. Per groep: pijlers als accordions, items als lijst
4. Items tonen: label, vraagTekst, kern/verdieping badge, volgorde
5. Acties per item: bewerken, kern-markering togglen, deactiveren
6. Actie per pijler: nieuw item toevoegen
7. Validatie draait bij elke wijziging; fouten worden inline getoond
8. "Publiceren" knop: verandert status van CONCEPT → ACTIEF
   - Alleen mogelijk als validatie slaagt
   - Alleen 1 versie per seizoen mag ACTIEF zijn
```

---

## 8. Migratie van huidige app

### 8.1 Wat verandert in het datamodel

| Huidig | Nieuw | Migratiestrategie |
|---|---|---|
| `Pijler.code` vaste set (SCH, AAN, PAS, VER, FYS, MEN) | v3.0 codes (BAL, BEWEGEN, etc.) | Nieuwe pijlers toevoegen, oude behouden voor bestaande data |
| `SpelersKaart` met vaste kolommen | `SpelersKaart.pijlerScores` JSON | Kolommen behouden als deprecated, nieuwe rapporten schrijven naar JSON |
| `OntwikkelItem` zonder isKern | `OntwikkelItem.isKern` veld | Default `true` voor alle bestaande items |
| Geen FysiekProfiel | Nieuw model | Lege tabel, wordt gevuld bij gebruik |
| Geen SpelerUSS | Nieuw model | Initieel vullen via seed/batch |
| Geen ScoutingVergelijking | Nieuw model | Lege tabel |

### 8.2 Datamigratieplan

**Stap 1: Schema-migratie (Prisma)**

```bash
# 1. Voeg nieuwe velden toe (nullable, met defaults)
pnpm db:push  # of prisma migrate dev

# 2. Backfill bestaande data
npx tsx scripts/import/migratie-v3.ts
```

**Stap 2: Backfill-script** (`scripts/import/migratie-v3.ts`)

```typescript
// Pseudo-code
async function migreerNaarV3() {
  // 1. Maak een RaamwerkVersie voor het huidige seizoen
  const versie = await prisma.raamwerkVersie.create({
    data: { seizoen: HUIDIG_SEIZOEN, naam: "Vaardigheidsraamwerk v3.0", status: "CONCEPT" },
  });

  // 2. Voor elke leeftijdsgroep in LEEFTIJDSGROEP_CONFIG:
  //    - Maak Leeftijdsgroep
  //    - Maak Pijlers (nieuwe codes)
  //    - Maak OntwikkelItems uit vaardigheidsraamwerk-v3.md

  // 3. Backfill SpelersKaart.pijlerScores
  //    - Lees bestaande vaste kolommen (schot, aanval, etc.)
  //    - Map naar oude pijlercodes: SCH→schot, AAN→aanval, etc.
  //    - Schrijf als JSON naar pijlerScores

  // 4. Initieel vullen SpelerUSS
  //    - Voor elke speler met een SpelersKaart:
  //      - Bereken USS op basis van huidige overall score
  //      - Schrijf naar SpelerUSS
}
```

**Stap 3: Code-aanpassingen**

De scouting-app (`apps/scouting/`) heeft twee codepaden nodig:

1. **Lees-pad:** `SpelersKaart` lezen met backward compatibility
   - Als `pijlerScores` gevuld is: gebruik die
   - Anders: reconstrueer uit vaste kolommen

2. **Schrijf-pad:** Nieuwe rapporten schrijven altijd naar `pijlerScores` JSON

### 8.3 Pijlercode-mapping (oud naar nieuw)

| Oude code | Groep | Nieuwe code(s) |
|---|---|---|
| SCH (Schieten) | Geel+ | SCOREN (Rood) / TECHNIEK + AANVALLEN (Geel/Oranje) |
| AAN (Aanval) | Geel+ | AANVALLEN |
| PAS (Passen) | Geel+ | TECHNIEK (onderdeel) |
| VER (Verdediging) | Geel+ | VERDEDIGEN |
| FYS (Fysiek) | Geel+ | FYSIEK |
| MEN (Mentaal) | Geel+ | MENTAAL + SOCIAAL (Oranje+) |

De mapping is niet 1:1. Bij de migratie worden oude pijlerscores behouden als referentie, maar nieuwe rapporten gebruiken de v3.0 pijlers.

### 8.4 Evaluatie-app koppeling

De evaluatie-app (`apps/evaluatie/`) gebruikt een apart model (`Evaluatie` met `scores: Json`). Dit model bevat niveau (1-5), inzet (1-3) en groei (1-4). Deze data kan als USS_coach-bron dienen:

| Evaluatie-veld | USS v2 equivalent |
|---|---|
| `niveau` (1-5) | `coachNaarUSS(ussTeam, niveau)` — ongewijzigde v1 functie als fallback |
| `inzet` (1-3) | Mapbaar naar `men_inzet` kern-item |
| `groei` (1-4) | Informatief, geen USS-impact |

---

## 9. Seed-script structuur

Het seed-script vult de database met realistische testdata voor ontwikkeling en E2E-tests.

### 9.1 Scope

- ~283 actieve jeugdspelers (uit Speler-tabel, geboortejaar 2008-2021)
- ~33 jeugdteams (uit OWTeam/ReferentieTeam)
- 3-4 seizoenen historie (2023-2024, 2024-2025, 2025-2026, 2026-2027)
- 1 RaamwerkVersie (ACTIEF) met alle items uit vaardigheidsraamwerk-v3.md

### 9.2 Script-structuur

Locatie: `scripts/import/seed-scouting-v3.ts`

```typescript
// Pseudo-code structuur
async function seedScoutingV3() {
  // ── Stap 1: RaamwerkVersie ──────────────────────────────────
  const versie = await maakRaamwerkVersie("2025-2026");

  // ── Stap 2: Leeftijdsgroepen + Pijlers + Items ─────────────
  for (const [band, config] of Object.entries(LEEFTIJDSGROEP_CONFIG)) {
    const groep = await maakLeeftijdsgroep(versie.id, band, config);
    for (const pijlerConfig of config.pijlers) {
      const pijler = await maakPijler(groep.id, pijlerConfig);
      const items = haalItemsVoorPijler(band, pijlerConfig.code);
      await maakItems(pijler.id, items);
    }
  }

  // ── Stap 3: Scouts ─────────────────────────────────────────
  await maakScouts([
    { naam: "TC Scout 1", email: "tc1@ckvoranjewit.nl", rol: "TC" },
    { naam: "Scout Trainer J7", email: "trainer-j7@ckvoranjewit.nl", rol: "SCOUT" },
    // ... 5-8 scouts
  ]);

  // ── Stap 4: Scouting-rapporten genereren ───────────────────
  // Per team: 2-3 TEAM-sessies met alle spelers
  // Per team-selectiespeler: 1-2 INDIVIDUEEL rapporten
  // 3-5 VERGELIJKING sessies (grensgevallen)

  for (const team of teams) {
    const spelers = haalSpelersVanTeam(team);
    const groep = bepaalLeeftijdsgroep(spelers[0]);

    // Team-sessie
    await maakTeamSessie(team, spelers, groep);

    // Individuele rapporten voor top-spelers
    const topSpelers = spelers.slice(0, 3);
    for (const speler of topSpelers) {
      await maakIndividueelRapport(speler, groep);
    }
  }

  // ── Stap 5: SpelersKaarten berekenen ───────────────────────
  // EWMA over alle rapporten per speler

  // ── Stap 6: SpelerUSS berekenen ────────────────────────────
  // USS per speler op basis van coach + scout + vergelijking data

  // ── Stap 7: Fysiek profielen (Geel+) ──────────────────────
  // Random maar plausibele fysieke profielen voor 50% van Geel+ spelers
}
```

### 9.3 Itemdata per leeftijdsgroep

De items komen direct uit `vaardigheidsraamwerk-v3.md`, sectie 4. Het seed-script importeert:

| Groep | Items | Bron in raamwerk |
|---|---|---|
| Paars | 3 observaties | Sectie 1 (samenvatting) |
| Blauw | 10 + signaalvlag | Sectie 4.1 |
| Groen | 14 + signaalvlag | Sectie 4.2 |
| Geel | 25 | Sectie 4.3 |
| Oranje | 40 | Sectie 4.4 |
| Rood | 62 + signaalvlag | Sectie 4.5 |

### 9.4 Score-generatie

Scores worden gegenereerd met een normaalverdeling rond de mediaan, met leeftijdsgroep-afhankelijke spreiding:

```typescript
function genereerItemScore(schaalType: SchaalTypeV3): number {
  switch (schaalType) {
    case "ja_nogniet":
      return Math.random() > 0.3 ? 1 : 0;  // 70% "Ja"
    case "goed_oke_nogniet":
      const r = Math.random();
      return r > 0.5 ? 1 : r > 0.2 ? 0.5 : 0;
    case "sterren":
      return Math.round(normaalVerdeling(3.0, 1.0, 1, 5));
    case "slider":
      return Math.round(normaalVerdeling(5.5, 2.0, 1, 10));
    default:
      return 1;
  }
}
```

---

## 10. Cross-validatie implementatie

### 10.1 Automatische vergelijking bij meerdere bronnen

Na het opslaan van een rapport wordt automatisch gecheckt of er andere bronnen bestaan voor dezelfde speler en hetzelfde seizoen:

```typescript
/**
 * Voer cross-validatie uit en sla signalen op in SpelerUSS.
 *
 * Wordt aangeroepen na:
 * - POST /api/scouting/rapport
 * - POST /api/scouting/team
 * - POST /api/scouting/vergelijking
 */
async function crossValideer(spelerId: string, seizoen: string): Promise<CrossValidatieSignaal[]> {
  const signalen: CrossValidatieSignaal[] = [];

  // Haal laatst berekende USS per bron op
  const uss = await prisma.spelerUSS.findUnique({
    where: { spelerId_seizoen: { spelerId, seizoen } },
  });

  if (!uss) return signalen;

  const coachPijlers = uss.ussCoachPijlers as Record<string, number> | null;
  const scoutPijlers = uss.ussScoutPijlers as Record<string, number> | null;

  if (!coachPijlers || !scoutPijlers) return signalen;

  // Per pijler: vergelijk coach vs. scout
  for (const pijler of Object.keys(coachPijlers)) {
    const coachUSS = coachPijlers[pijler];
    const scoutUSS = scoutPijlers[pijler];

    if (coachUSS != null && scoutUSS != null) {
      const verschil = scoutUSS - coachUSS;
      if (Math.abs(verschil) > 15) {
        signalen.push({
          pijler,
          verschil,
          type: verschil > 0 ? "coach_onderschat" : "coach_overschat",
          beschrijving: verschil > 0
            ? `Coach geeft ${pijler} ${Math.abs(verschil)} USS lager dan scout`
            : `Coach geeft ${pijler} ${Math.abs(verschil)} USS hoger dan scout`,
        });
      }
    }
  }

  // Overall verschil
  if (uss.ussCoach != null && uss.ussScout != null) {
    const overallVerschil = uss.ussScout - uss.ussCoach;
    if (Math.abs(overallVerschil) > 20) {
      signalen.push({
        pijler: "OVERALL",
        verschil: overallVerschil,
        type: overallVerschil > 0 ? "coach_onderschat" : "coach_overschat",
        beschrijving: `Overall USS verschil: scout=${uss.ussScout}, coach=${uss.ussCoach}`,
      });
    }
  }

  // Sla signalen op
  if (signalen.length > 0) {
    await prisma.spelerUSS.update({
      where: { spelerId_seizoen: { spelerId, seizoen } },
      data: { crossValidatieSignalen: signalen },
    });
  }

  return signalen;
}

interface CrossValidatieSignaal {
  pijler: string;
  verschil: number;
  type: "coach_onderschat" | "coach_overschat";
  beschrijving: string;
}
```

### 10.2 Alarmsignaal sociale veiligheid

Sociale veiligheid wordt apart getoetst, los van USS:

```typescript
/**
 * Check sociale veiligheid signaalvlag of score.
 * Bij alarm: markeer in de UI, stop USS-berekening niet, maar toon waarschuwing.
 */
function checkSocialeVeiligheid(
  scores: Record<string, number>,
  band: LeeftijdsgroepNaamV3
): { alarm: boolean; beschrijving: string | null } {
  const config = LEEFTIJDSGROEP_CONFIG[band];

  if (config.signaalvlagType === "ja_nee") {
    const waarde = scores["veilig_welkom"];
    if (waarde === 0) {
      return {
        alarm: true,
        beschrijving: "Kind voelt zich niet welkom — bespreek met trainer",
      };
    }
  }

  if (config.signaalvlagType === "scorend") {
    const waarde = scores["soc_veiligheid"];
    if (waarde != null && waarde <= 3) {
      return {
        alarm: true,
        beschrijving: `Sociale veiligheid score ${waarde}/10 — bespreek met trainer`,
      };
    }
  }

  return { alarm: false, beschrijving: null };
}
```

### 10.3 UI-weergave cross-validatie

Cross-validatie signalen worden getoond op:

1. **Spelerskaart:** geel waarschuwingsicoon naast de pijler
2. **TC-dashboard:** overzichtslijst van alle signalen, gesorteerd op ernst
3. **Teamoverzicht:** kolom "Cross-validatie" met aantal signalen per speler

---

## Bijlage: Samenvatting bestanden en locaties

| Bestand | Wat | Status |
|---|---|---|
| `packages/database/prisma/schema.prisma` | Prisma schema uitbreiding | Wijzigen |
| `packages/types/src/leeftijdsgroep-config.ts` | LeeftijdsgroepConfig constante | Nieuw |
| `packages/types/src/score-model-v2.ts` | USS v2 functies | Nieuw |
| `packages/types/src/score-model.ts` | USS v1 functies | Behouden (backward compat) |
| `apps/scouting/src/lib/scouting/vragen.ts` | Pijler + vragen types | Herschrijven |
| `apps/scouting/src/lib/scouting/rating.ts` | Score-berekeningen | Herschrijven |
| `apps/scouting/src/lib/scouting/leeftijdsgroep.ts` | Leeftijdsgroep-bepaling | Uitbreiding |
| `apps/scouting/src/lib/scouting/raamwerk-db.ts` | Database-lookup raamwerk | Uitbreiding |
| `apps/scouting/src/app/api/scouting/rapport/route.ts` | Rapport endpoint | Aanpassen |
| `apps/scouting/src/app/api/scouting/team/route.ts` | Team-scouting endpoint | Aanpassen |
| `apps/scouting/src/app/api/scouting/vergelijking/route.ts` | Vergelijking endpoint | Nieuw |
| `apps/scouting/src/app/api/spelers/[relCode]/uss/route.ts` | USS ophalen | Nieuw |
| `apps/scouting/src/app/api/spelers/[relCode]/fysiek-profiel/route.ts` | Fysiek profiel | Nieuw |
| `apps/scouting/src/app/api/teams/[owTeamId]/uss-validatie/route.ts` | Team USS validatie | Nieuw |
| `apps/scouting/src/app/api/admin/catalogus/route.ts` | Catalogus CRUD | Nieuw |
| `apps/scouting/src/app/api/admin/uss/herbereken/route.ts` | USS herberekenen | Nieuw |
| `scripts/import/seed-scouting-v3.ts` | Seed-script | Nieuw |
| `scripts/import/migratie-v3.ts` | Migratiescript | Nieuw |

---

*Dit document is de technische vertaling van het Vaardigheidsraamwerk v3.0 en USS v2 Scoremodel naar een implementeerbare app-architectuur voor c.k.v. Oranje Wit.*
