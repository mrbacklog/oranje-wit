# Evaluatie-domein -- HANDSHAKE

> Contract tussen Evaluatie-domein (beheer-app) en de evaluatie-app.

---

## 1. Server Actions

### `/evaluatie/rondes/actions.ts`

| Functie | Parameters | Return | Beschrijving |
|---|---|---|---|
| `getRondes()` | - | `RondeRow[]` | Alle rondes met uitnodiging/evaluatie-counts |
| `createRonde(formData)` | FormData: seizoen, ronde, naam, type, deadline | `ActionResult<{ id }>` | Nieuwe ronde |
| `updateRondeStatus(id, status)` | id: string, status: string | `ActionResult` | Status wijzigen |

### `/evaluatie/coordinatoren/actions.ts`

| Functie | Parameters | Return | Beschrijving |
|---|---|---|---|
| `getCoordinatoren()` | - | `CoordinatorRow[]` | Coordinatoren met teamkoppelingen |
| `createCoordinator(formData)` | FormData: naam, email | `ActionResult<{ id }>` | Nieuwe coordinator |
| `deleteCoordinator(id)` | id: string | `ActionResult` | Verwijder coordinator |

### `/evaluatie/templates/actions.ts`

| Functie | Parameters | Return | Beschrijving |
|---|---|---|---|
| `getTemplates()` | - | `TemplateRow[]` | Alle e-mail templates |
| `updateTemplate(id, formData)` | id: string, FormData: onderwerp, inhoudHtml | `ActionResult` | Template bijwerken |

---

## 2. Data-bronnen

| Tabel | Gebruik |
|---|---|
| `EvaluatieRonde` (`evaluatie_rondes`) | Rondes met status, deadline, counts |
| `Coordinator` (`coordinatoren`) | Coordinatoren met naam, email |
| `CoordinatorTeam` (`coordinator_teams`) | Team-koppelingen per coordinator |
| `EvaluatieUitnodiging` (`evaluatie_uitnodigingen`) | Count per ronde |
| `Evaluatie` | Count ingediende evaluaties per ronde |
| `EmailTemplate` (`email_templates`) | Template-inhoud met variabelen |

---

## 3. Validatieregels

| Regel | Beschrijving |
|---|---|
| **Ronde uniek** | Geen duplicaat (seizoen + ronde + type) |
| **Ronde status** | concept, actief of gesloten |
| **Coordinator email uniek** | Geen twee coordinatoren met zelfde email |
| **Template onderwerp verplicht** | Min 1 karakter |
| **Template HTML verplicht** | Min 1 karakter |

---

## 4. Migratie vanuit evaluatie-app

Dit domein vervangt `apps/evaluatie/src/app/admin/`. De evaluatie-app's admin-pagina's gebruiken
client-side fetch naar API routes. De beheer-app gebruikt server actions direct.

| Evaluatie-app | Beheer-app |
|---|---|
| `GET /api/rondes` | `getRondes()` server action |
| `POST /api/rondes` | `createRonde()` server action |
| `GET /api/coordinatoren` | `getCoordinatoren()` server action |
| `POST /api/coordinatoren` | `createCoordinator()` server action |
| `GET /api/templates` | `getTemplates()` server action |
| `PATCH /api/templates/:id` | `updateTemplate()` server action |

---

## 5. Template variabelen

| Sleutel | Variabelen |
|---|---|
| `trainer_uitnodiging` | trainer_naam, team_naam, deadline, ronde_naam, link |
| `trainer_herinnering` | trainer_naam, team_naam, deadline, link |
| `trainer_bevestiging` | trainer_naam, team_naam |
| `coordinator_notificatie` | coordinator_naam, trainer_naam, team_naam, link |
| `coordinator_uitnodiging` | coordinator_naam, ronde_naam, team_namen, link |
| `speler_uitnodiging` | speler_naam, deadline, ronde_naam, link |
| `speler_herinnering` | speler_naam, deadline, link |
