# Google OAuth authenticatie — Ontwerp

**Datum**: 2026-02-28
**Status**: Goedgekeurd

## Context

Beide apps (Monitor en Team-Indeling) zijn momenteel onbeschermd of gebruiken een gedeeld wachtwoord. We schakelen over naar Google OAuth zodat alleen geautoriseerde TC-leden toegang hebben. Sessies moeten 30 dagen geldig blijven.

## Beslissingen

- **Provider**: Google OAuth (enige provider)
- **Toegang**: Allowlist met 3 TC-leden, alle EDITOR
- **Architectuur**: Gedeeld `packages/auth/` package
- **Rollen**: Bestaand EDITOR/REVIEWER/VIEWER systeem behouden
- **Sessie**: JWT, maxAge 30 dagen
- **Monitor**: Was openbaar, krijgt nu dezelfde auth-laag

## Geautoriseerde gebruikers

| Email | Rol |
|---|---|
| antjanlaban@gmail.com | EDITOR |
| merelvangurp@gmail.com | EDITOR |
| thomasisarin@gmail.com | EDITOR |

## Architectuur

### Nieuw package: `packages/auth/`

```
packages/auth/
├── src/
│   ├── index.ts          # NextAuth config, Google provider, exports
│   ├── allowlist.ts      # Email → rol mapping
│   └── checks.ts         # requireAuth(), requireEditor()
├── package.json          # @oranje-wit/auth
└── tsconfig.json
```

**Exports**:
- `handlers` — GET/POST voor `/api/auth/[...nextauth]`
- `auth` — Server-side sessie ophalen
- `signIn`, `signOut` — Client-side acties
- `requireAuth()`, `requireEditor()` — Server-side guards

**Allowlist**: Hardcoded email → rol mapping. Onbekende e-mails worden geweigerd in de `signIn` callback.

### Per-app integratie

Beide apps krijgen:
- `middleware.ts` — redirect naar `/login` als niet ingelogd (behalve `/login` en `/api/auth/*`)
- `app/api/auth/[...nextauth]/route.ts` — importeert handlers uit `@oranje-wit/auth`
- `app/login/page.tsx` — "Inloggen met Google" knop
- Root layout wraps met `SessionProvider`

### Team-Indeling opruiming

- Verwijder Credentials provider en `TC_WACHTWOORD`
- Vervang login-formulier door Google-knop
- Behoud `UserMenu` component
- `User`-tabel blijft bestaan (voor pins/log)

## Environment variables

| Variabele | Doel |
|---|---|
| `AUTH_GOOGLE_ID` | Google OAuth Client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth Client Secret |
| `AUTH_SECRET` | NextAuth JWT encryptie |

Nodig op: beide Railway services + lokale `.env.local` bestanden.

## Google Cloud Console setup

- Project aanmaken (of bestaand gebruiken)
- OAuth 2.0 Client ID (type: Web application)
- Authorized redirect URIs:
  - `https://monitor-production-b2b1.up.railway.app/api/auth/callback/google`
  - `https://team-indeling-production.up.railway.app/api/auth/callback/google`
  - `http://localhost:4102/api/auth/callback/google`
  - `http://localhost:4100/api/auth/callback/google`
