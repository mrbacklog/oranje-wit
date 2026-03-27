# Jaarplanning-domein -- HANDSHAKE

> Contract tussen Jaarplanning-domein (beheer-app) en afnemende apps/domeinen.

---

## 1. Server Actions

### `/jaarplanning/kalender/actions.ts`

| Functie | Parameters | Return | Beschrijving |
|---|---|---|---|
| `getSeizoenen()` | - | `SeizoenRow[]` | Alle seizoenen met status en counts |
| `updateSeizoenStatus(seizoen, status)` | seizoen: string, status: SeizoenStatus | `ActionResult` | Wijzig seizoenstatus |
| `maakNieuwSeizoen(seizoen)` | seizoen: string (JJJJ-JJJJ) | `ActionResult<{ seizoen }>` | Nieuw seizoen aanmaken |

### `/jaarplanning/mijlpalen/actions.ts`

| Functie | Parameters | Return | Beschrijving |
|---|---|---|---|
| `getMijlpalen(seizoen?)` | seizoen?: string | `MijlpaalRow[]` | Alle mijlpalen, optioneel per seizoen |
| `getSeizoenOpties()` | - | `{ seizoen, status }[]` | Seizoenen voor selector |
| `createMijlpaal(formData)` | FormData: seizoen, label, datum, volgorde | `ActionResult<{ id }>` | Nieuwe mijlpaal |
| `toggleMijlpaalAfgerond(id)` | id: string | `ActionResult` | Toggle afgerond |
| `deleteMijlpaal(id)` | id: string | `ActionResult` | Verwijder mijlpaal |

---

## 2. Data Types

### SeizoenStatus (Prisma enum)

```
VOORBEREIDING -- Seizoen wordt gepland
ACTIEF        -- Huidig seizoen
AFGEROND      -- Seizoen bevroren (archief)
```

### Seizoen (bestaand model, uitgebreid)

Nieuw veld: `status SeizoenStatus @default(VOORBEREIDING)`

---

## 3. Validatieregels

| Regel | Beschrijving |
|---|---|
| **Seizoen formaat** | Moet JJJJ-JJJJ zijn, eindjaar = startjaar + 1 |
| **Seizoen uniek** | Geen duplicaat seizoenen |
| **Status geldig** | Moet VOORBEREIDING, ACTIEF of AFGEROND zijn |
| **Mijlpaal label** | Verplicht, max 200 karakters |
| **Mijlpaal datum** | Geldig datumformaat (JJJJ-MM-DD) |

---

## 4. Synergie

| Wie leest | Wat | Waarvoor |
|---|---|---|
| Alle domeinen | `Seizoen.status` | Bepaalt of seizoen bewerkbaar of frozen is |
| Archivering | `AFGEROND` seizoenen | Read-only weergave |
| Teams & Leden | `ACTIEF` seizoen | Actuele waarheid |
| Team-Indeling | `VOORBEREIDING` seizoen | Workspace voor komend seizoen |

---

## 5. Database-migratie

Migratie `20260327_domein_fundamenten`:
- `SeizoenStatus` enum aangemaakt
- `status` kolom toegevoegd aan `seizoenen` tabel (default: VOORBEREIDING)
