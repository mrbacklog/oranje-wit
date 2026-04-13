# Auth Package — @oranje-wit/auth

NextAuth v5 + Google OAuth voor het platform.

## Auth Guards (verplicht patroon)

**API routes** — gebruik `guardTC()`:
```typescript
import { guardTC } from '@oranje-wit/auth/checks'

export async function GET(req: Request) {
  const guard = await guardTC()
  if (!guard.ok) return fail(guard.error, 401)
  // ... rest van de handler
}
```

**Server actions** — gebruik `requireTC()`:
```typescript
import { requireTC } from '@oranje-wit/auth/checks'

export async function myAction(data: FormData) {
  await requireTC() // throwt als niet-TC
  // ... rest van de action
}
```

## Rollen
- **TC-leden** (3 personen): Google OAuth → volledige toegang
- **Smartlink-gebruikers**: scoped op rol + doelgroep, 14-daagse sessie

## Clearance niveaus
| Clearance | Ziet | Wie |
|---|---|---|
| 0 | Naam + team | Scout, ouder/speler |
| 1 | + relatieve positie | Coordinator, trainer |
| 2 | + USS score + trend | TC-lid |
| 3 | + volledige kaart | TC-kern |
