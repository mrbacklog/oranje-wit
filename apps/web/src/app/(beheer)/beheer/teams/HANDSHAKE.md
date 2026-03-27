# Teams & Leden-domein -- HANDSHAKE

> Contract tussen Teams & Leden-domein (beheer-app) en afnemende apps.

---

## 1. Server Actions

### `/teams/actions.ts`

| Functie | Parameters | Return | Beschrijving |
|---|---|---|---|
| `getTeams(seizoen?)` | seizoen?: string | `TeamRow[]` | Teams met leden-count |
| `getTeamDetail(teamId)` | teamId: number | `TeamDetailRow \| null` | Team met alle spelers |
| `getTeamSeizoenOpties()` | - | `string[]` | Beschikbare seizoenen |

---

## 2. Data-bronnen

Dit domein leest bestaande tabellen, geen eigen modellen:

| Tabel | Gebruik |
|---|---|
| `OWTeam` (`teams`) | Teamgegevens per seizoen |
| `CompetitieSpeler` (`competitie_spelers`) | Spelers per team via `rel_code` |
| `Lid` (`leden`) | Stamgegevens (naam, geboortejaar, geslacht) |
| `Import` | Laatste sync-datum en import-statistieken |

---

## 3. Pagina's

| Route | Functie | Data |
|---|---|---|
| `/teams` | Teamoverzicht | Tabel: code, naam, categorie, kleur, spelers, selectie |
| `/teams/sync` | Sportlink sync | Stats: spelers, teams, laatste import, sync-placeholder |

---

## 4. Synergie

| Wie leest | Wat | Waarvoor |
|---|---|---|
| Monitor | `OWTeam`, `CompetitieSpeler` | Dashboards, teamsamenstelling |
| Team-Indeling | `OWTeam`, `Lid` | Blauwdruk en scenario's |
| Evaluatie | `OWTeam` | Coordinatoren koppelen aan teams |
| Scouting | `OWTeam` | Team-scouting sessies |

---

## 5. Sportlink Sync

Automatische sync is een toekomstige feature. Momenteel:
- Data-import via `pnpm import` (script)
- Import-historie zichtbaar op `/teams/sync`
- Sync-knop is een disabled placeholder
