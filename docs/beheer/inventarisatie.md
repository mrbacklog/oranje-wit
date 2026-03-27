# Beheer-app Inventarisatie

> **Datum:** 2026-03-26
> **Auteur:** ontwikkelaar-agent
> **Bron:** codebase-analyse apps/web/(beheer)/, packages/database/, docs/jeugdontwikkeling/

---

## 1. Staat per domein

### 1.1 Jaarplanning (`/jaarplanning/`)

| Aspect | Status |
|---|---|
| **Prisma-modellen** | `Mijlpaal` (bestaand in TI-domein, seizoen + label + datum + volgorde + afgerond) |
| **Pagina's** | `/jaarplanning/kalender/page.tsx` (placeholder), `/jaarplanning/mijlpalen/page.tsx` (placeholder) |
| **Werkend** | Nee, alleen placeholder-tekst |
| **Notities** | `Mijlpaal`-model bestaat al maar is gekoppeld aan `Seizoen`. Geen kalender- of competitieperiode-modellen. |

### 1.2 Roostering (`/roostering/`)

| Aspect | Status |
|---|---|
| **Prisma-modellen** | Geen |
| **Pagina's** | `/roostering/trainingen/page.tsx` (placeholder), `/roostering/wedstrijden/page.tsx` (placeholder) |
| **Werkend** | Nee |
| **Notities** | Volledig nieuw domein. Geen database-modellen, geen logica. |

### 1.3 Teams & Leden (`/teams/`)

| Aspect | Status |
|---|---|
| **Prisma-modellen** | `Lid`, `OWTeam`, `TeamPeriode`, `TeamAlias`, `Seizoen`, `CompetitieSpeler`, `Staf` (allemaal bestaand in monitor/TI) |
| **Pagina's** | `/teams/page.tsx` (placeholder), `/teams/sync/page.tsx` (placeholder) |
| **Werkend** | Nee, alleen placeholder-tekst |
| **Notities** | Alle benodigde data-modellen bestaan al. Dit domein hoeft alleen een beheer-UI te bouwen bovenop bestaande tabellen. Sportlink-sync logica zit deels in MCP-servers en import-scripts. |

### 1.4 Jeugdontwikkeling (`/jeugd/`)

| Aspect | Status |
|---|---|
| **Prisma-modellen** | `RaamwerkVersie`, `Leeftijdsgroep`, `Pijler`, `OntwikkelItem` (alle 4 bestaan en zijn gevuld) |
| **Pagina's** | `/jeugd/raamwerk/page.tsx` (WERKEND - overzicht), `/jeugd/raamwerk/[versieId]/page.tsx` (WERKEND - band editor), `/jeugd/raamwerk/[versieId]/preview/[band]/page.tsx` (WERKEND - preview), `/jeugd/progressie/page.tsx` (placeholder), `/jeugd/uss/page.tsx` (placeholder) |
| **Werkend** | Raamwerk-editor is volledig werkend (CRUD items, publiceren, archiveren, validatie). Progressie en USS zijn placeholders. |
| **Componenten** | `band-editor.tsx`, `nieuw-raamwerk-dialoog.tsx`, `band-tabs.tsx`, `item-form.tsx`, `item-row.tsx`, `pijler-section.tsx`, `validatie-panel.tsx` |
| **Server actions** | `actions.ts` (CRUD raamwerk, diepe kopie, publiceer, archiveer, valideer) + `[versieId]/actions.ts` (CRUD items, groepsinstellingen) |
| **Validatie** | `lib/raamwerk/validatie.ts` (PIJLER_MIN_1, BAND_ITEM_RANGE, PIJLER_BALANS, STATUS_LOCK) |

### 1.5 Scouting (`/scouting/`)

| Aspect | Status |
|---|---|
| **Prisma-modellen** | `Scout`, `ScoutBadge`, `ScoutChallenge`, `TeamScoutingSessie`, `ScoutingRapport`, `ScoutToewijzing`, `ScoutingVerzoek` (bestaan al voor scouting-app) |
| **Pagina's** | `/scouting/scouts/page.tsx` (placeholder) |
| **Werkend** | Nee |
| **Notities** | Alle scouting-modellen bestaan. Dit domein hoeft een beheer-UI te bouwen voor scout-accounts (CRUD, XP reset, rol toewijzen). |

### 1.6 Evaluatie (`/evaluatie/`)

| Aspect | Status |
|---|---|
| **Prisma-modellen** | `EvaluatieRonde`, `Coordinator`, `CoordinatorTeam`, `EvaluatieUitnodiging`, `EmailTemplate` (bestaan al) |
| **Pagina's** | `/evaluatie/rondes/page.tsx` (placeholder), `/evaluatie/coordinatoren/page.tsx` (placeholder), `/evaluatie/templates/page.tsx` (placeholder) |
| **Werkend** | Nee |
| **Notities** | Modellen bestaan, admin-logica zit in de evaluatie admin-pagina's. Migratie naar `/beheer/evaluatie/`. |

### 1.7 Werving (`/werving/`)

| Aspect | Status |
|---|---|
| **Prisma-modellen** | Geen |
| **Pagina's** | `/werving/aanmeldingen/page.tsx` (placeholder), `/werving/funnel/page.tsx` (placeholder) |
| **Werkend** | Nee |
| **Notities** | Volledig nieuw domein. Geen modellen, geen logica. |

### 1.8 Systeem (`/systeem/`)

| Aspect | Status |
|---|---|
| **Prisma-modellen** | `User` (TI-domein), `Gebruiker` (nieuw, `gebruikers` tabel: email, naam, rol, scoutRol, isAdmin, actief) |
| **Pagina's** | `/systeem/gebruikers/page.tsx` (WERKEND - CRUD, rol-badges, inline-edit, deactiveren), `/systeem/import/page.tsx` (WERKEND - import-historie) |
| **Werkend** | Ja (gebruikersbeheer + import-historie) |
| **Componenten** | `gebruikers-lijst.tsx` (client component: tabel, dialoog, inline-edit) |
| **Server actions** | `gebruikers/actions.ts` (getGebruikers, createGebruiker, updateGebruiker, toggleActief, deleteGebruiker), `import/actions.ts` (getImportHistorie) |
| **Validatie** | Zod schema's (email, naam, rol, scoutRol), laatste-admin bescherming |
| **Auth-integratie** | `getAllowedRole()` in `@oranje-wit/auth` checkt Gebruiker-tabel met fallback naar hardcoded allowlist. DB-lookup via `setDbLookup()` injection (Edge-safe). |
| **Notities** | Seed-script: `scripts/import/seed-gebruikers.ts` (3 TC-leden, idempotent). |

### 1.9 Archivering (`/archief/`)

| Aspect | Status |
|---|---|
| **Prisma-modellen** | Geen specifiek archief-model. Leunt op bestaande seizoensdata (Seizoen, OWTeam, CompetitieSpeler) |
| **Pagina's** | `/archief/teams/page.tsx` (placeholder), `/archief/resultaten/page.tsx` (placeholder) |
| **Werkend** | Nee |
| **Notities** | Read-only views over bestaande data. Geen nieuwe modellen nodig, alleen queries met seizoensfilter. |

---

## 2. Raamwerk v1.1 vs seed-data: discrepanties

De seed-data (`scripts/import/seed-raamwerk.ts`) wijkt op meerdere punten af van het definitieve raamwerk v1.1 (`docs/jeugdontwikkeling/vaardigheidsraamwerk-v1.1.md`).

### 2.1 Blauw (5-7 jaar) -- STRUCTUREEL ANDERS

| Aspect | Raamwerk v1.1 | Seed-data |
|---|---|---|
| **Pijlers** | BAL, BEWEGEN, SAMEN, IK (4 basispijlers) | FYS, PAS, MEN (3 volwassen pijlers) |
| **Schaaltype** | `duim` (2 niveaus) | `smiley` (3 niveaus) |
| **maxScore** | 2 | 3 |
| **Aantal items** | 8 | 6 |

Item-ID mapping:

| v1.1 | Seed | Verschil |
|---|---|---|
| `bal_gooien` | `pas_gooien_vangen` | Andere pijler (BAL vs PAS), ander ID |
| `bal_vangen` | -- | Ontbreekt in seed |
| `bew_rennen` | `fys_rennen_stoppen` | Andere pijler (BEWEGEN vs FYS), ander ID |
| `bew_richting` | -- | Ontbreekt in seed |
| `sam_samenspelen` | `men_samenspel` | Andere pijler (SAMEN vs MEN), ander ID |
| `sam_luisteren` | `men_luistert` | Andere pijler (SAMEN vs MEN), ander ID |
| `ik_durft` | `men_durft` | Andere pijler (IK vs MEN), ander ID |
| `ik_plezier` | -- | Ontbreekt in seed |
| -- | `fys_beweegt_graag` | Bestaat niet in v1.1 |

**Conclusie:** De seed-data voor Blauw gebruikt volwassen pijlercodes (FYS, PAS, MEN) terwijl v1.1 kindvriendelijke basispijlers voorschrijft (BAL, BEWEGEN, SAMEN, IK). Dit is het Inside Out meegroei-principe -- de kern van het raamwerk.

### 2.2 Groen (8-9 jaar) -- PIJLERSTRUCTUUR ANDERS

| Aspect | Raamwerk v1.1 | Seed-data |
|---|---|---|
| **Pijlers** | SCH, AAN, PAS, VER, FYS, IK (6 pijlers) | PAS, SCH, AAN, VER, FYS, MEN (6 pijlers) |
| **Aantal items** | 12 | 11 (mist 1) |

| v1.1 | Seed | Verschil |
|---|---|---|
| `sch_schotkeuze` | -- | Ontbreekt in seed |
| `fys_uithouding` | -- | Ontbreekt in seed |
| IK-pijler (`ik_samenwerken`, `ik_doorzetten`) | MEN-pijler (`men_samenwerken`, `men_doorzetten`) | v1.1 gebruikt IK, seed gebruikt MEN |

### 2.3 Geel (10-12 jaar) -- ITEMS MISSEN LAGEN

| Aspect | Raamwerk v1.1 | Seed-data |
|---|---|---|
| **Pijlers** | SCH, AAN, PAS, VER, FYS, MEN (6) | SCH, AAN, PAS, VER, FYS, MEN (6) -- OK |
| **Aantal items** | 20 | 18 (mist 2) |
| **Lagen** | Technisch + Tactisch per korfbalactie | Geen `laag` veld in seed-data |

| v1.1 | Seed |
|---|---|
| `sch_t_afstandsschot` (Technisch) | `sch_afstandsschot` (geen laag) |
| `sch_t_doorloopbal` (Technisch) | `sch_doorloopbal` (geen laag) |
| `sch_ta_schotkeuze` (Tactisch) | `sch_schotkeuze` (geen laag) |
| `men_plezier` | -- ontbreekt |
| `men_herstelt` | -- ontbreekt |

Alle item-ID's in seed missen het laag-prefix (`_t_`, `_ta_`, `_m_`) dat v1.1 voorschrijft.

### 2.4 Oranje (13-15 jaar) -- ITEMS MISSEN, GEEN SOCIAAL

| Aspect | Raamwerk v1.1 | Seed-data |
|---|---|---|
| **Pijlers** | SCH, AAN, PAS, VER, FYS, MEN, SOC (7) | SCH, AAN, PAS, VER, FYS, MEN (6) |
| **Aantal items** | 35 | 24 (11 ontbreken) |
| **Schaaltype** | `slider` (1-10) | `sterren` (1-5) |

Ontbrekend in seed:
- Hele SOC-pijler (5 items: `soc_communicatie`, `soc_samenwerking`, `soc_teamsfeer`, `soc_rolacceptatie`, `soc_conflicthantering`)
- `sch_ta_penalty` (Tactisch)
- `sch_t_techniek` (Technisch)
- `aan_ta_zonder_bal` (Tactisch)
- `aan_m_omschakeling` -- in seed als `aan_omschakeling` zonder laag
- `pas_t_aanname` (Technisch)
- `fys_actiesnelheid`
- `men_groei`

### 2.5 Rood (16-18 jaar) -- FORS TEKORT

| Aspect | Raamwerk v1.1 | Seed-data |
|---|---|---|
| **Pijlers** | SCH, AAN, PAS, VER, FYS, MEN, SOC (7) | SCH, AAN, PAS, VER, FYS, MEN (6) |
| **Aantal items** | 56 | 36 (20 ontbreken) |
| **Lagen** | Technisch + Tactisch + Mentaal met `_t_`/`_ta_`/`_m_` prefix | Geen laag-prefix in ID's |
| **K/O classificatie** | KERN / ONDERSCHEIDEND per item | Niet aanwezig in model |

Ontbrekend in seed:
- Hele SOC-pijler (7 items)
- `sch_t_techniek`, `sch_t_variatie`, `sch_ta_na_dreiging`, `sch_m_penalty`, `sch_m_scorend_vermogen` -- seed heeft `sch_penalty`, `sch_variatie`, `sch_scorend_vermogen` zonder laag
- `aan_t_1_op_1`, `aan_ta_spelcreatie`, `aan_ta_patronen` -- seed heeft `aan_1_op_1`, `aan_spelcreatie` zonder laag en mist `aan_ta_patronen`
- `pas_t_aanname`, `pas_t_eenhandig`, `pas_ta_tempo`, `pas_m_creativiteit` -- seed heeft `pas_aanname`, `pas_creativiteit` zonder laag, mist `pas_t_eenhandig` en `pas_ta_tempo`
- `ver_t_druk_zetten`, `ver_ta_helpverdediging`, `ver_ta_verdedigingsvorm`, `ver_m_communicatie`, `ver_m_blok`, `ver_m_omschakeling`, `ver_m_discipline` -- seed heeft `ver_druk_zetten`, `ver_blok` zonder laag, mist 5 items
- `fys_actiesnelheid`, `fys_herstel` -- seed heeft `fys_herstel` maar mist `fys_actiesnelheid`
- `men_wedstrijdmentaliteit`, `men_trainingsmentaliteit`, `men_drukbestendigheid`, `men_zelfkritiek` -- seed heeft `men_wedstrijdmentaliteit`, `men_spelintelligentie` maar mist 3

### 2.6 Samenvatting discrepanties

| Band | v1.1 items | Seed items | Verschil | Ernst |
|---|---|---|---|---|
| Blauw | 8 | 6 | -2, andere pijlers | KRITIEK (Inside Out gebroken) |
| Groen | 12 | 11 | -1, IK vs MEN | HOOG |
| Geel | 20 | 18 | -2, geen lagen | HOOG |
| Oranje | 35 | 24 | -11, geen SOC, verkeerde schaal | KRITIEK |
| Rood | 56 | 36 | -20, geen SOC, geen lagen, geen K/O | KRITIEK |
| **Totaal** | **131** | **95** | **-36** | |

### 2.7 Structurele hiaten in het data-model

1. **Basispijlers voor Blauw/Groen**: het model kent alleen volwassen pijlercodes (SCH, AAN, PAS, VER, FYS, MEN, SOC). Blauw-pijlers BAL, BEWEGEN, SAMEN, IK ontbreken als codes.
2. **Laag-prefix in item_code**: v1.1 gebruikt `sch_t_afstandsschot` (met laag), seed gebruikt `sch_afstandsschot` (zonder laag). Het `laag`-veld in OntwikkelItem is optioneel maar niet gevuld in de seed.
3. **KERN/ONDERSCHEIDEND classificatie**: v1.1 classificeert elk Rood-item als KERN of ONDERSCHEIDEND. Dit veld ontbreekt in het `OntwikkelItem`-model.
4. **Gedragsobservatie**: v1.1 geeft per MEN/SOC-item een gedragsobservatie-kolom. Dit veld ontbreekt in het model.
5. **POP-ratio**: v1.1 definieert per band een POP-ratio (Plezier/Ontwikkeling/Prestatie). Dit ontbreekt in `Leeftijdsgroep`.

---

## 3. Pijler-punten systeem analyse

### 3.1 Wat het model al ondersteunt

- **Score per item**: `OntwikkelItem` heeft een schaaltype via `Leeftijdsgroep.schaalType` en `maxScore`. Een beoordeling kan dus per item een score opleveren.
- **Pijler-aggregatie**: items zijn gegroepeerd onder `Pijler`. Een pijlerscore is de gemiddelde/gewogen score van de items eronder.
- **7 scores op de kaart**: de 7 volwassen pijlers (SCH, AAN, PAS, VER, FYS, MEN, SOC) mappen direct op de 7 scores uit v1.1.
- **USS-integratie**: `SpelersKaart`-model bestaat al met `overall` (USS 0-200) en `scores` (Json veld).

### 3.2 Wat ontbreekt voor meetbare pijler-punten

| Ontbrekend | Toelichting | Oplossing |
|---|---|---|
| **Gewicht per item** | Niet alle items wegen even zwaar. KERN-items moeten zwaarder wegen dan ONDERSCHEIDEND | Veld `gewicht: Float @default(1.0)` op OntwikkelItem |
| **Classificatie** | KERN/ONDERSCHEIDEND per item (alleen Rood) | Veld `classificatie: String?` op OntwikkelItem |
| **Normalisatie per leeftijdsgroep** | Blauw (max 2) en Rood (max 10) moeten vergelijkbaar zijn op USS 0-200 | USS-parameters op Leeftijdsgroep of aparte tabel |
| **Pijler-gewicht per leeftijdsgroep** | Bij Blauw weegt BAL/BEWEGEN zwaarder, bij Rood zijn alle 7 pijlers gelijkwaardig | Veld op Pijler of berekend uit Inside Out logica |
| **Beoordeling-opslag** | Er is geen tabel die individuele beoordelingsscores opslaat per speler per item | Nodig: een `Beoordeling`-model (speler + item + score + beoordelaar + datum) |
| **Ranking** | Geen ranking-model of -berekening | Af te leiden uit beoordelingen + USS-normalisatie |
| **Leeftijdscorrectie** | Biologische rijping (v1.1 benadrukt dit bij Oranje) | Optioneel correctie-veld op beoordeling of spelerskaart |

### 3.3 Minimaal benodigde modeluitbreidingen

```
OntwikkelItem {
  + gewicht        Float    @default(1.0)
  + classificatie  String?  // "KERN" | "ONDERSCHEIDEND" | null
  + observatie     String?  // Gedragsobservatie-tekst (MEN/SOC items)
}

Leeftijdsgroep {
  + popPlezier      Int?    // POP-ratio plezier %
  + popOntwikkeling Int?    // POP-ratio ontwikkeling %
  + popPrestatie    Int?    // POP-ratio prestatie %
}

Pijler {
  + basispijlerVan  String? // Voor Blauw: BAL -> "SCH,PAS", BEWEGEN -> "AAN,VER,FYS"
}
```

De `Beoordeling`-tabel is het ontbrekende hart:

```
model Beoordeling {
  id            String   @id @default(cuid())
  spelerId      String   // -> Speler.id (= rel_code)
  itemId        String   // -> OntwikkelItem.id
  score         Float    // Ruwe score (0-maxScore)
  beoordelaarId String?  // -> User.id of Scout.id
  bron          String   // "trainer" | "scout" | "zelf"
  seizoen       String
  datum         DateTime @default(now())
}
```

---

## 4. Bouwvolgorde

### Criteria

| Criterium | Gewicht | Toelichting |
|---|---|---|
| Synergie | Hoog | Andere domeinen of apps zijn afhankelijk |
| Bestaande data | Hoog | Modellen bestaan al, minder migratie-werk |
| Impact | Hoog | Direct waarde voor de TC |

### Voorgestelde volgorde

| # | Domein | Reden |
|---|---|---|
| **1** | **Jeugdontwikkeling** (verdieping) | Al werkend maar seed-data klopt niet met v1.1. Kritiek: andere apps (scouting, evaluatie, spelerskaart) lezen dit raamwerk. Zonder correcte data is alles downstream fout. |
| **2** | **Systeem** (gebruikers) | Unblocked alle andere domeinen. Zolang auth via hardcoded allowlist loopt, kan beheer niet uitgerold worden naar meer TC-leden. |
| **3** | **Teams & Leden** | Alle modellen bestaan. Sportlink-sync is de actuele waarheid waar evaluatie, scouting en team-indeling van afhangen. |
| **4** | **Evaluatie** | Modellen bestaan, admin-logica ook (in evaluatie-app). Migratie, geen nieuwbouw. |
| **5** | **Scouting** | Modellen bestaan. Beheer van scout-accounts voor de scouting-app. |
| **6** | **Jaarplanning** | `Mijlpaal`-model bestaat. Levert structuur voor alle andere domeinen. |
| **7** | **Archivering** | Read-only views, geen nieuwe modellen. Lage inspanning, nuttig voor historisch inzicht. |
| **8** | **Roostering** | Volledig nieuw domein, geen bestaande modellen. |
| **9** | **Werving** | Volledig nieuw domein, laagste prioriteit. |

### Sprint 1a: Jeugdontwikkeling reparatie

Stappen:
1. Voeg basispijlercodes toe aan Pijler: BAL, BEWEGEN, SAMEN, IK
2. Voeg velden toe aan OntwikkelItem: `gewicht`, `classificatie`, `observatie`
3. Voeg POP-ratio velden toe aan Leeftijdsgroep
4. Herschrijf seed-raamwerk.ts om v1.1 data exact te volgen
5. Draai seed opnieuw (idempotent)
6. Update beheer-UI om lagen, classificatie en observatie te tonen/bewerken

---

## 5. Referentie: actions.ts pijlers-per-band

De huidige code in de beheer raamwerk-actions definieert pijlers per band die niet overeenkomen met v1.1:

| Band | actions.ts | v1.1 |
|---|---|---|
| Blauw | SCH, AAN, PAS | BAL, BEWEGEN, SAMEN, IK |
| Groen | SCH, AAN, PAS, VER | SCH, AAN, PAS, VER, FYS, IK |
| Geel | SCH, AAN, PAS, VER, FYS | SCH, AAN, PAS, VER, FYS, MEN |
| Oranje | SCH, AAN, PAS, VER, FYS, MEN | SCH, AAN, PAS, VER, FYS, MEN, SOC |
| Rood | SCH, AAN, PAS, VER, FYS, MEN, SOC | SCH, AAN, PAS, VER, FYS, MEN, SOC (OK) |

Dit moet in sync gebracht worden met v1.1.
