# Onderzoek: Vreemde team-aantallen 2025-2026

## Taakstelling

Onderzoek waarom het aantal teams voor seizoen 2025-2026 vreemd is in de productie-database.

## Te uitvoeren queries

```sql
-- Q1: Teams per seizoen (trend)
SELECT seizoen, COUNT(DISTINCT team) as aantal_teams
FROM competitie_spelers
GROUP BY seizoen ORDER BY seizoen;

-- Q2: Teams in 2025-2026 (team+competitie combos)
SELECT DISTINCT team, competitie, COUNT(*) as spelers
FROM competitie_spelers
WHERE seizoen = '2025-2026'
GROUP BY team, competitie ORDER BY team, competitie;

-- Q3: Teams tabel
SELECT * FROM teams WHERE seizoen = '2025-2026' ORDER BY ow_code;

-- Q4: Team periodes
SELECT * FROM team_periodes tp 
JOIN teams t ON t.id = tp.team_id 
WHERE t.seizoen = '2025-2026'
ORDER BY t.ow_code;

-- Q5: Teams 2024-2025
SELECT DISTINCT team FROM competitie_spelers WHERE seizoen = '2024-2025' ORDER BY team;
```

## Analyse-plan

1. **Trend-analyse**: Q1 — vgl. 2025-2026 met vorige seizoenen (2024-2025, 2023-2024, etc.)
2. **Competitie-breakdown**: Q2 — hoeveel team+competitie combos vs unieke teamnamen
3. **Master data-check**: Q3 — zijn alle teams geregistreerd in de teams-tabel?
4. **Periodes-check**: Q4 — is team-periodedata compleet?
5. **Vergelijking vorig seizoen**: Q5 — wat was normaal?

## Root cause hypotheses

| Hypothese | Indicatie | Fix |
|---|---|---|
| **Dubbele teams in competitie_spelers** | Q2 unieke teams > Q3 count | Data cleanup + UNIQUE constraint |
| **Teams missen uit teams-tabel** | Q1 count > Q3 count | Master data sync |
| **Multi-competitie teams abnormaal** | Q2 combos >> normale ratio | Import fout? Data duplication? |
| **Data-corrupt in import** | Sudden spike in Q1 | Rerun import-pipeline |
| **Naming-variatie** | Zelfde team onder verschillende naam | Team-aliases controleren |

## Execution Status

⏳ Awaiting database queries via MCP tool: `ow_query`

---

## Bevindingen uit Code-analyse

### Kritieke Issue: Team-naming inconsistentie

**Gevonden in**: `scripts/check-veld-vs-zaal.cjs`

In competitie_spelers worden teams met verschillende namen geregistreerd per competitie:

- **Veld najaar**: `OW J1`, `OW J2`, etc.
- **Zaal**: `J1`, `J2`, etc.

Dit betekent dat dezelfde fysieke team onder 2+ namen voorkomt in `competitie_spelers`:
- 1 naam in veld_najaar
- Andere naam in zaal
- Mogelijk nog andere namen in veld_voorjaar

### Symptoom

Dit verklaart waarom `COUNT(DISTINCT team)` in Q1 vreemd is: dezelfde team telt meerdere keren op door naming-variatie.

Voorbeeld:
- Team Rood 1 → gemapped naar `OW J1` (veld_najaar)
- Team Rood 1 → gemapped naar `J1` (zaal)
- Dit telt als 2 "teams" in COUNT(DISTINCT team)

### Verdere debug-scripts

Ook aanwezig:
- `scripts/check-periodes.cjs` — controleert competitie-periodes per team
- `scripts/j7-check.cjs` → controleert `OW J7` vs `J7`
- `scripts/analyze-selectie-aliases.js` → analyseert selectie-team aliases

Dit wijst erop dat dit een **bekend probleem** is dat eerder is opgemerkt.

---

## Root Cause: TEAM-NAMING VARIATIE

### Problem Statement

Dezelfde team wordt onder verschillende namen in `competitie_spelers` geregistreerd afhankelijk van competitie-periode:

| Team | Veld Najaar | Zaal | Veld Voorjaar |
|------|---|---|---|
| Rood 1 | `OW J1` | `J1` | ? |
| Rood 2 | `OW J2` | `J2` | ? |
| Selectie 1/2 | `S1/S2` | `S1/S2` | ? |
| Etc. | `OW J...` | `J...` | ? |

### Impact

1. **Q1 team-count inflated**: Dezelfde 30 teams tellen als 45+ vanwege naming-variaties
2. **Q2 team+competitie combos ook inflated**: Elke naam-variant = 1 combo
3. **Q3 teams-tabel**: Bevat waarschijnlijk ~30 master teams (de ow_code canonical names)
4. **team_aliases tabel**: Bevat waarschijnlijk de mappings (zaal `J1` → veld `OW J1` → master `R1`)

### Normaal vs Abnormaal

- **Normaal**: 30 teams × 3 competities = 90 team+competitie combos (als elke team in elke periode speelt)
- **Abnormaal**: 45+ team-namen × 3 competities = 135+ combos door variant-naming

---

## Resultaten

*[Code-analysis, pending DB query verification]*

## Conclusie (Preliminary)

**Vreemde team-aantallen zijn waarschijnlijk door NAMING-INCONSISTENTIE in import:**

1. Dezelfde team → verschillende naam naargelang competitie
2. Veld: `OW JX` format
3. Zaal: `JX` format
4. Master data: `RX`/`OX`/`GX`/`Gr1`/`Bl1` (ow_code)

**FIX NODIG:**
- Normaliseer teamnamen in `competitie_spelers` bij import
- Ofwel: alle naar master ow_code (`R1`, `O2`, etc.)
- Of: alle naar canonical KNKV-naam (`OW J1`, etc.)
- Team-aliases tabel moet consistent zijn
