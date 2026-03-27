# Archivering-domein -- HANDSHAKE

> Contract tussen Archivering-domein (beheer-app) en afnemende apps.

---

## 1. Server Actions

### `/archief/actions.ts`

| Functie | Parameters | Return | Beschrijving |
|---|---|---|---|
| `getAfgerondeSeizoen()` | - | `ArchiefSeizoenRow[]` | Alle seizoenen (met status en counts) |
| `getTeamsVoorSeizoen(seizoen)` | seizoen: string | `ArchiefTeamRow[]` | Teams voor een seizoen |
| `getResultatenVoorSeizoen(seizoen)` | seizoen: string | `ArchiefResultaatRow[]` | Poolstanden voor een seizoen |

---

## 2. Data-bronnen

Alle data is read-only. Geen eigen modellen.

| Tabel | Gebruik |
|---|---|
| `Seizoen` (`seizoenen`) | Seizoenlijst met status |
| `OWTeam` (`teams`) | Teams per seizoen |
| `TeamPeriode` (`team_periodes`) | Pool- en sterktedata per periode |
| `PoolStand` (`pool_standen`) | Competitiestanden |
| `PoolStandRegel` (`pool_stand_regels`) | Individuele teamregels in poulestand |

---

## 3. Pagina's

| Route | Functie | Data |
|---|---|---|
| `/archief/teams` | Teamhistorie | Seizoen-selector + teams-tabel (read-only) |
| `/archief/resultaten` | Competitieresultaten | Seizoen-selector + poolstanden met regels |

---

## 4. Principes

- **Alle data is read-only** -- archief schrijft nooit
- **Seizoen-selector** -- toont alle seizoenen, met AFGEROND als voorkeur
- **OW-teams gehighlight** -- in poolstanden worden OW-teams visueel onderscheiden (isOW)
- **Periodes zichtbaar** -- per team worden alle competitieperiodes getoond

---

## 5. Synergie

| Wie leest | Wat | Waarvoor |
|---|---|---|
| Monitor | Dezelfde data | Historische dashboards |
| Jaarplanning | `Seizoen.status` | Bepaalt welke seizoenen AFGEROND zijn |

---

## 6. Toekomstige uitbreidingen

- Seizoen-selector als client component (navigeren zonder pagina-refresh)
- Evaluatieresultaten per seizoen
- Export naar CSV/PDF
