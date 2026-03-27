# Systeem-domein — HANDSHAKE

> Contract tussen Systeem-domein (beheer-app) en afnemende packages/apps.

---

## 1. Server Actions

### `/systeem/gebruikers/actions.ts`

| Functie | Parameters | Return | Beschrijving |
|---|---|---|---|
| `getGebruikers()` | - | `GebruikerRow[]` | Alle gebruikers, gesorteerd actief → naam |
| `createGebruiker(formData)` | FormData: email, naam, rol, scoutRol?, isAdmin? | `ActionResult<{ id }>` | Maak nieuwe gebruiker |
| `updateGebruiker(id, formData)` | id: string, FormData: naam?, rol?, scoutRol?, isAdmin?, actief? | `ActionResult` | Wijzig bestaande gebruiker |
| `toggleActief(id)` | id: string | `ActionResult` | Toggle actief/inactief |
| `deleteGebruiker(id)` | id: string | `ActionResult` | Verwijder gebruiker (niet voor admins) |

### `/systeem/import/actions.ts`

| Functie | Parameters | Return | Beschrijving |
|---|---|---|---|
| `getImportHistorie()` | - | `ImportRow[]` | Laatste 50 imports, meest recent eerst |

---

## 2. Data Types

### Gebruiker (Prisma model → `gebruikers` tabel)

```ts
interface Gebruiker {
  id: string;         // cuid
  email: string;      // uniek, lowercase
  naam: string;
  rol: Rol;           // EDITOR | REVIEWER | VIEWER
  scoutRol: ScoutRol | null;  // SCOUT | TC | null
  isAdmin: boolean;
  actief: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### ActionResult

```ts
type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };
```

---

## 3. Validatieregels

| Regel | Beschrijving |
|---|---|
| **Email uniek** | Geen twee gebruikers met hetzelfde e-mailadres |
| **Email lowercase** | Wordt altijd genormaliseerd naar lowercase |
| **Naam verplicht** | Minimaal 1 karakter, maximaal 100 |
| **Rol geldig** | Moet EDITOR, REVIEWER of VIEWER zijn |
| **ScoutRol optioneel** | SCOUT, TC of null |
| **Laatste admin** | De laatste actieve admin kan niet gedeactiveerd worden |
| **Admin niet verwijderbaar** | Admin-gebruikers kunnen niet verwijderd worden |

---

## 4. Autorisatie

- De gehele beheer-app is alleen toegankelijk voor EDITOR-rol (via middleware)
- Binnen het Systeem-domein is er **geen extra isAdmin check** op de pagina — alle EDITORs (TC-leden) mogen gebruikers beheren
- In de toekomst kan isAdmin gebruikt worden voor destructieve acties (verwijderen, admin toekennen)

---

## 5. Synergie

### Wie leest de Gebruiker-tabel?

| Package/App | Hoe | Waarvoor |
|---|---|---|
| `@oranje-wit/auth` | `getAllowedRole(email)` | Login-autorisatie: bepaal rol bij inloggen |
| Alle apps (via auth) | Via JWT token.role | Sessie bevat rol uit Gebruiker-tabel |
| Scouting-app | Via scoutRol | Bepaal clearance-niveau voor spelersdata |
| Portaal | Via rol + actief | Welke app-tegels zichtbaar zijn |

### Architectuur: DB-lookup injection

Het auth package (`@oranje-wit/auth`) heeft GEEN directe dependency op `@oranje-wit/database` om Edge Runtime bundeling te voorkomen. In plaats daarvan wordt de database-lookup geïnjecteerd via `setDbLookup()`.

**Per-app setup** (in `instrumentation.ts`):
```ts
import { setDbLookup } from "@oranje-wit/auth/allowlist";
import { prisma } from "@oranje-wit/database";

setDbLookup(async (email) => {
  const g = await prisma.gebruiker.findUnique({ where: { email } });
  return g ? { rol: g.rol, actief: g.actief } : null;
});
```

### Fallback-mechanisme

`getAllowedRole()` in `packages/auth/src/allowlist.ts`:
1. Als `setDbLookup()` is aangeroepen: check Gebruiker-tabel in database
2. Als gebruiker.actief === false → return null (geblokkeerd)
3. Als DB niet bereikbaar, tabel niet bestaat, of geen lookup geregistreerd → fallback naar hardcoded ALLOWED_USERS
4. Hardcoded lijst heeft 3 TC-leden als vangnet

**Belangrijk**: apps die GEEN `setDbLookup()` aanroepen, vallen automatisch terug op de hardcoded allowlist. Dit is backward compatible.

### Import-model

Het `Import` model (al bestaand) wordt gelezen door de import-pagina. Schrijven gebeurt door `scripts/import/import-data.ts`.
