# Google OAuth Authenticatie — Implementatieplan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Google OAuth authenticatie toevoegen aan beide apps (Monitor + Team-Indeling) via een gedeeld auth-package.

**Architecture:** Nieuw `packages/auth/` workspace-package met NextAuth v5 + Google provider, allowlist-based autorisatie, en JWT-sessies van 30 dagen. Beide apps importeren dit package en krijgen middleware + login-pagina.

**Tech Stack:** NextAuth v5 (next-auth@5.0.0-beta.28), Google OAuth 2.0, pnpm workspaces

**Design doc:** `docs/plans/2026-02-28-google-auth-design.md`

---

### Task 1: packages/auth — Gedeeld auth-package aanmaken

**Files:**
- Create: `packages/auth/package.json`
- Create: `packages/auth/tsconfig.json`
- Create: `packages/auth/src/allowlist.ts`
- Create: `packages/auth/src/index.ts`
- Create: `packages/auth/src/checks.ts`

**Step 1: Package scaffolding**

`packages/auth/package.json`:
```json
{
  "name": "@oranje-wit/auth",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./checks": "./src/checks.ts",
    "./allowlist": "./src/allowlist.ts"
  },
  "dependencies": {
    "next-auth": "5.0.0-beta.28"
  },
  "peerDependencies": {
    "next": ">=16"
  }
}
```

`packages/auth/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

**Step 2: Allowlist**

`packages/auth/src/allowlist.ts`:
```ts
export type Rol = "EDITOR" | "REVIEWER" | "VIEWER";

const ALLOWED_USERS: Record<string, Rol> = {
  "antjanlaban@gmail.com": "EDITOR",
  "merelvangurp@gmail.com": "EDITOR",
  "thomasisarin@gmail.com": "EDITOR",
};

export function getAllowedRole(email: string): Rol | null {
  return ALLOWED_USERS[email.toLowerCase()] ?? null;
}
```

**Step 3: NextAuth config**

`packages/auth/src/index.ts`:
```ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { getAllowedRole } from "./allowlist";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dagen
  },
  callbacks: {
    signIn({ profile }) {
      if (!profile?.email) return false;
      return getAllowedRole(profile.email) !== null;
    },
    jwt({ token, profile }) {
      if (profile?.email) {
        token.role = getAllowedRole(profile.email);
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
```

**Step 4: Server-side guards**

`packages/auth/src/checks.ts`:
```ts
import { auth } from "./index";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Niet ingelogd");
  }
  return session;
}

export async function requireEditor() {
  const session = await auth();
  if (!session?.user || session.user.role !== "EDITOR") {
    throw new Error("Niet geautoriseerd");
  }
  return session;
}
```

**Step 5: Install dependencies**

Run: `pnpm install`

**Step 6: Commit**

```bash
git add packages/auth/
git commit -m "feat: packages/auth — gedeeld NextAuth package met Google OAuth en allowlist"
```

---

### Task 2: Team-Indeling — Overschakelen naar gedeeld auth-package

**Files:**
- Modify: `apps/team-indeling/package.json` — add `@oranje-wit/auth` dependency
- Modify: `apps/team-indeling/next.config.ts` — transpile `@oranje-wit/auth`
- Rewrite: `apps/team-indeling/src/lib/auth.ts` — re-export uit `@oranje-wit/auth`
- Rewrite: `apps/team-indeling/src/lib/auth-check.ts` — re-export uit `@oranje-wit/auth/checks`
- Rewrite: `apps/team-indeling/src/app/login/page.tsx` — Google-knop ipv formulier
- Create: `apps/team-indeling/src/middleware.ts` — route protection
- Keep: `apps/team-indeling/src/types/next-auth.d.ts` (ongewijzigd)
- Keep: `apps/team-indeling/src/components/layout/UserMenu.tsx` (ongewijzigd)
- Keep: `apps/team-indeling/src/components/providers/SessionProvider.tsx` (ongewijzigd)
- Keep: `apps/team-indeling/src/app/login/layout.tsx` (ongewijzigd)

**Step 1: Voeg dependency toe**

In `apps/team-indeling/package.json`, voeg toe aan dependencies:
```json
"@oranje-wit/auth": "workspace:*"
```

Verwijder `@auth/prisma-adapter` (wordt niet meer gebruikt).

**Step 2: Update next.config.ts**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@oranje-wit/database", "@oranje-wit/types", "@oranje-wit/auth"],
};

export default nextConfig;
```

**Step 3: Vervang auth.ts**

`apps/team-indeling/src/lib/auth.ts`:
```ts
export { handlers, signIn, signOut, auth } from "@oranje-wit/auth";
```

**Step 4: Vervang auth-check.ts**

`apps/team-indeling/src/lib/auth-check.ts`:
```ts
export { requireAuth, requireEditor } from "@oranje-wit/auth/checks";
```

**Step 5: Login-pagina met Google-knop**

`apps/team-indeling/src/app/login/page.tsx`:
```tsx
"use client";

import { signIn } from "next-auth/react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-gray-900">Team-Indeling</h1>
            <p className="text-sm text-gray-500 mt-1">c.k.v. Oranje Wit</p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md mb-4">
              {error === "AccessDenied"
                ? "Je account heeft geen toegang. Neem contact op met de TC."
                : "Er ging iets mis bij het inloggen."}
            </p>
          )}

          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Inloggen met Google
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
```

**Step 6: Middleware**

`apps/team-indeling/src/middleware.ts`:
```ts
export { auth as middleware } from "@oranje-wit/auth";

export const config = {
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)"],
};
```

**Step 7: Install en verifieer**

Run: `pnpm install`
Run: `pnpm dev:ti`
Verwacht: Login-pagina met Google-knop verschijnt. Na Google-login wordt je doorgestuurd.

**Step 8: Commit**

```bash
git add apps/team-indeling/
git commit -m "feat(team-indeling): overschakelen naar Google OAuth via @oranje-wit/auth"
```

---

### Task 3: Monitor — Auth toevoegen

**Files:**
- Modify: `apps/monitor/package.json` — add next-auth + @oranje-wit/auth
- Modify: `apps/monitor/next.config.ts` — transpile @oranje-wit/auth
- Create: `apps/monitor/src/middleware.ts`
- Create: `apps/monitor/src/app/api/auth/[...nextauth]/route.ts`
- Create: `apps/monitor/src/app/login/page.tsx`
- Create: `apps/monitor/src/app/login/layout.tsx`
- Create: `apps/monitor/src/types/next-auth.d.ts`
- Modify: `apps/monitor/src/app/layout.tsx` — wrap met SessionProvider

**Step 1: Dependencies toevoegen**

In `apps/monitor/package.json`, voeg toe aan dependencies:
```json
"next-auth": "5.0.0-beta.28",
"@oranje-wit/auth": "workspace:*"
```

**Step 2: next.config.ts updaten**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@oranje-wit/database", "@oranje-wit/ui", "@oranje-wit/auth"],
};

export default nextConfig;
```

**Step 3: NextAuth type declarations**

`apps/monitor/src/types/next-auth.d.ts`:
```ts
import "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
  }

  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
  }
}
```

**Step 4: API route**

`apps/monitor/src/app/api/auth/[...nextauth]/route.ts`:
```ts
import { handlers } from "@oranje-wit/auth";
export const { GET, POST } = handlers;
```

**Step 5: Middleware**

`apps/monitor/src/middleware.ts`:
```ts
export { auth as middleware } from "@oranje-wit/auth";

export const config = {
  matcher: ["/((?!login|api/auth|api/foto|_next/static|_next/image|favicon.ico).*)"],
};
```

NB: `api/foto` blijft uitgesloten zodat foto-routes eventueel zonder sessie werken (optioneel aanpassen).

**Step 6: Login-pagina**

`apps/monitor/src/app/login/page.tsx`:
```tsx
"use client";

import { signIn } from "next-auth/react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-gray-900">Verenigingsmonitor</h1>
            <p className="text-sm text-gray-500 mt-1">c.k.v. Oranje Wit</p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md mb-4">
              {error === "AccessDenied"
                ? "Je account heeft geen toegang. Neem contact op met de TC."
                : "Er ging iets mis bij het inloggen."}
            </p>
          )}

          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Inloggen met Google
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
```

`apps/monitor/src/app/login/layout.tsx`:
```tsx
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

**Step 7: Layout met SessionProvider**

Modify `apps/monitor/src/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Verenigingsmonitor | c.k.v. Oranje Wit",
  description: "TC-monitor voor gezonde groei",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <SessionProvider>
          <AppShell>{children}</AppShell>
        </SessionProvider>
      </body>
    </html>
  );
}
```

**Step 8: Install en verifieer**

Run: `pnpm install`
Run: `pnpm dev:monitor`
Verwacht: Redirect naar /login. Google-knop zichtbaar.

**Step 9: Commit**

```bash
git add apps/monitor/
git commit -m "feat(monitor): Google OAuth authenticatie toevoegen via @oranje-wit/auth"
```

---

### Task 4: Environment variables instellen

**Step 1: Lokale env bestanden**

Voeg toe aan `apps/team-indeling/.env.local` en `apps/monitor/.env.local`:
```
AUTH_GOOGLE_ID=<van Google Cloud Console>
AUTH_GOOGLE_SECRET=<van Google Cloud Console>
AUTH_SECRET=<genereer met: npx auth secret>
```

Verwijder `TC_WACHTWOORD` uit `apps/team-indeling/.env.local`.

**Step 2: Railway env vars**

Stel in via Railway MCP of dashboard voor beide services:
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `AUTH_SECRET`

**Step 3: Google Cloud Console**

1. Ga naar console.cloud.google.com → APIs & Services → Credentials
2. Maak OAuth 2.0 Client ID (type: Web application)
3. Authorized redirect URIs:
   - `https://monitor-production-b2b1.up.railway.app/api/auth/callback/google`
   - `https://team-indeling-production.up.railway.app/api/auth/callback/google`
   - `http://localhost:4102/api/auth/callback/google`
   - `http://localhost:4100/api/auth/callback/google`

---

### Task 5: Opruiming oude auth

**Files:**
- Verify: `apps/team-indeling/.env.local` — TC_WACHTWOORD verwijderd
- Verify: Railway env vars — TC_WACHTWOORD verwijderd

**Step 1: Verifieer dat alles werkt**

Run: `pnpm dev:ti` en `pnpm dev:monitor`
Test: Inloggen met elk van de 3 TC-accounts
Test: Inloggen met onbekend account → "geen toegang" melding
Test: Sessie blijft behouden na browser sluiten/openen

**Step 2: Final commit**

```bash
git add .
git commit -m "chore: opruiming oude credentials auth, env vars bijgewerkt"
```

---

## Verificatie (end-to-end)

1. **Lokaal**: Start beide apps, log in met Google, controleer dat je doorgestuurd wordt
2. **Ongeautoriseerd**: Log in met een niet-allowlisted account → "geen toegang" fout
3. **Sessie**: Sluit browser, open opnieuw → nog steeds ingelogd (30 dagen)
4. **Railway**: Push naar master, wacht op auto-deploy, test beide productie-URLs
5. **UserMenu**: In Team-Indeling toont de UserMenu component naam + "TC-lid" rol
