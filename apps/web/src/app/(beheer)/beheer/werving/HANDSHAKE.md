# Werving-domein -- HANDSHAKE

> Contract tussen Werving-domein (beheer-app) en toekomstige afnemers.

---

## 1. Server Actions

### `/werving/aanmeldingen/actions.ts`

| Functie | Parameters | Return | Beschrijving |
|---|---|---|---|
| `getAanmeldingen()` | - | `AanmeldingRow[]` | Alle aanmeldingen, nieuwste eerst |
| `getFunnelStats()` | - | `Record<string, number>` | Aantal per funnel-status |
| `createAanmelding(formData)` | FormData: naam, email?, telefoon?, geboortejaar?, bron?, opmerking? | `ActionResult<{ id }>` | Nieuwe aanmelding |
| `updateAanmeldingStatus(id, status)` | id: string, status: AanmeldingStatus | `ActionResult` | Funnel-stap wijzigen |
| `updateAanmelding(id, formData)` | id: string, FormData: div. velden | `ActionResult` | Gegevens bijwerken |

---

## 2. Data Types

### AanmeldingStatus (Prisma enum)

```
AANMELDING -- Eerste contact
PROEFLES   -- Proefles ingepland
INTAKE     -- Intake gesprek
LID        -- Volwaardig lid geworden
AFGEHAAKT  -- Niet doorgegaan
```

### Aanmelding (nieuw model)

```ts
interface Aanmelding {
  id: string;
  naam: string;
  email: string | null;
  telefoon: string | null;
  geboortejaar: number | null;
  opmerking: string | null;
  status: AanmeldingStatus;
  bron: string | null;         // "website" | "bekende" | "open dag" | etc.
  ledenadmin: string | null;   // Verantwoordelijke ledenadmin
  trainer: string | null;      // Verantwoordelijke trainer
  tcLid: string | null;        // Verantwoordelijk TC-lid
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 3. Pagina's

| Route | Functie | Data |
|---|---|---|
| `/werving/aanmeldingen` | Aanmeldingenlijst | Tabel met status-badges, naam, geboortejaar, bron |
| `/werving/funnel` | Visueel funnel-overzicht | Samenvattingskaarten per status |

---

## 4. Validatieregels

| Regel | Beschrijving |
|---|---|
| **Naam verplicht** | Min 1 karakter, max 200 |
| **Email optioneel** | Geldig e-mailadres als ingevuld |
| **Telefoon optioneel** | Max 20 karakters |
| **Geboortejaar optioneel** | Integer tussen 1950 en 2030 |
| **Status geldig** | Een van de 5 AanmeldingStatus waarden |

---

## 5. Funnel-flow

```
AANMELDING -> PROEFLES -> INTAKE -> LID
     |           |          |
     +---------->+--------->+-----> AFGEHAAKT
```

Elke stap heeft verantwoordelijken (ledenadmin, trainer, TC-lid) die per aanmelding kunnen worden ingevuld.

---

## 6. Database-migratie

Migratie `20260327_domein_fundamenten`:
- `AanmeldingStatus` enum aangemaakt
- `aanmeldingen` tabel aangemaakt met alle kolommen
