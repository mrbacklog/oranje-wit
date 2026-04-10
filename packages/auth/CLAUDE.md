# packages/auth — NextAuth v5 + auth guards

## Stack
- NextAuth v5 met Google OAuth provider
- Geen JWT-tokens handmatig aanmaken of verifiëren

## Auth guards (`@oranje-wit/auth/checks`)
| Functie | Gebruik | Gedrag |
|---|---|---|
| `guardTC()` | API routes | Returnt `Result<User, Response>` — geen throw |
| `requireTC()` | Server actions | Throwt als gebruiker geen TC-lid is |

## Gebruik in API routes
```ts
import { guardTC } from "@oranje-wit/auth/checks";

export async function GET() {
  const guard = await guardTC();
  if (!guard.ok) return guard.error; // Response met 401/403
  // guard.data = ingelogde TC-gebruiker
}
```

## Gebruik in server actions
```ts
import { requireTC } from "@oranje-wit/auth/checks";

export async function myAction() {
  const user = await requireTC(); // throwt als niet-TC
  // ...
  return { ok: true, data: result } satisfies ActionResult<typeof result>;
}
```

## Overige exports
- `adapter.ts` — Prisma adapter voor NextAuth sessies
- `allowlist.ts` — TC-ledenlijst voor toegangsbeheer
- `smartlink-email.ts` — Smartlink/HMAC e-mail voor externe gebruikers
- `passkey.ts` — Passkey authenticatie (WebAuthn)
