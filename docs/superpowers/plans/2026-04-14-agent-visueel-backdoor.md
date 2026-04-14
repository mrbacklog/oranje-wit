# Agent Visueel Backdoor — Implementatieplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agents kunnen zelfstandig authenticeren op localhost én productie, visueel navigeren via Playwright MCP, en agent-versies opruimen via een cleanup endpoint.

**Architecture:** Een nieuwe `agent-login` NextAuth Credentials provider valideert `AGENT_SECRET` uit de env vars en geeft een TC-sessie terug met `isAgent: true` + een uniek `agentRunId`. Een cleanup endpoint verwijdert werkindeling-versies die door agents zijn aangemaakt. Een nieuwe `visueel` skill geeft agents een verplicht stappenplan.

**Tech Stack:** NextAuth v5 Credentials, Prisma (`werkindeling` model), Next.js App Router API routes, Vitest, `.claude/skills/`

---

## Bestandsoverzicht

| Actie | Bestand | Verantwoordelijkheid |
|---|---|---|
| Wijzig | `packages/auth/src/checks.ts` | `isAgent` en `agentRunId` toevoegen aan `AuthSession` |
| Wijzig | `packages/auth/src/index.ts` | `agent-login` provider + jwt/session callbacks uitbreiden |
| Nieuw | `apps/web/src/app/api/agent/cleanup/route.ts` | Cleanup endpoint voor agent-versies |
| Nieuw | `apps/web/src/app/api/agent/cleanup/route.test.ts` | Tests voor cleanup endpoint |
| Nieuw | `.claude/skills/visueel/SKILL.md` | Agent-skill voor visuele inspectie |
| Wijzig | `.claude/agents/e2e-tester.md` | Visueel skill toevoegen |
| Wijzig | `.claude/agents/frontend.md` | Visueel skill toevoegen |
| Wijzig | `.claude/agents/ux-designer.md` | Visueel skill toevoegen |
| Wijzig | `.claude/agents/ontwikkelaar.md` | Visueel skill toevoegen |

---

## Task 1: AuthSession type uitbreiden

**Files:**
- Modify: `packages/auth/src/checks.ts`

- [ ] **Stap 1: Voeg `isAgent` en `agentRunId` toe aan het `AuthSession` type**

In `packages/auth/src/checks.ts`, pas de `AuthSession` interface aan:

```typescript
export interface AuthSession {
  user: {
    email: string;
    name?: string | null;
    isTC: boolean;
    isScout: boolean;
    clearance: Clearance;
    doelgroepen: string[];
    role?: string;
    provider?: string;
    authMethode?: string;
    isAgent?: boolean;      // nieuw — true als sessie van agent-login provider
    agentRunId?: string;    // nieuw — unieke run-id voor cleanup
  };
}
```

- [ ] **Stap 2: Commit**

```bash
git add packages/auth/src/checks.ts
git commit -m "feat(auth): voeg isAgent en agentRunId toe aan AuthSession type"
```

---

## Task 2: Agent-login provider toevoegen

**Files:**
- Modify: `packages/auth/src/index.ts`

- [ ] **Stap 1: Schrijf de failing test voor de agent-authorize logica**

Er is geen apart testbestand voor `index.ts` — de authorize logica is embedded. Maak een test die het gedrag van de provider beschrijft:

Maak `packages/auth/src/agent-provider.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock getCapabilities zodat we de DB niet nodig hebben
vi.mock("./allowlist", () => ({
  getCapabilities: vi.fn().mockResolvedValue({
    isTC: true,
    isScout: false,
    clearance: 3,
    doelgroepen: ["ALLE"],
    actief: true,
  }),
  ADMIN_EMAIL: "antjanlaban@gmail.com",
}));

// Importeer de te testen functie (wordt aangemaakt in stap 3)
import { authorizeAgent } from "./agent-provider";

describe("authorizeAgent", () => {
  beforeEach(() => {
    process.env.AGENT_SECRET = "dit-is-een-test-secret-van-32-tekens-lang!!";
  });

  it("geeft null terug bij ontbrekend secret", async () => {
    const result = await authorizeAgent({ secret: "" });
    expect(result).toBeNull();
  });

  it("geeft null terug bij verkeerd secret", async () => {
    const result = await authorizeAgent({ secret: "fout-secret" });
    expect(result).toBeNull();
  });

  it("geeft null terug als AGENT_SECRET niet geconfigureerd is", async () => {
    delete process.env.AGENT_SECRET;
    const result = await authorizeAgent({ secret: "whatever" });
    expect(result).toBeNull();
  });

  it("geeft null terug als secret korter is dan 32 tekens", async () => {
    process.env.AGENT_SECRET = "te-kort";
    const result = await authorizeAgent({ secret: "te-kort" });
    expect(result).toBeNull();
  });

  it("retourneert TC-gebruiker met agentRunId bij geldig secret", async () => {
    const result = await authorizeAgent({
      secret: "dit-is-een-test-secret-van-32-tekens-lang!!",
    });
    expect(result).not.toBeNull();
    expect(result?.agentRunId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    expect(result?.isTC).toBe(true);
  });
});
```

- [ ] **Stap 2: Draai test en verifieer dat hij faalt**

```bash
pnpm test packages/auth/src/agent-provider.test.ts
```

Verwacht: FAIL — `Cannot find module './agent-provider'`

- [ ] **Stap 3: Maak `packages/auth/src/agent-provider.ts` aan**

```typescript
import { getCapabilities, ADMIN_EMAIL } from "./allowlist";

interface AgentCredentials {
  secret?: string;
}

interface AgentUser {
  id: string;
  email: string;
  name: string;
  isTC: boolean;
  agentRunId: string;
}

/**
 * Valideer agent-credentials en retourneer een TC-gebruiker.
 * Geëxporteerd als losse functie zodat hij testbaar is.
 */
export async function authorizeAgent(
  credentials: AgentCredentials
): Promise<AgentUser | null> {
  const secret = credentials?.secret;
  const agentSecret = process.env.AGENT_SECRET;

  // Secret moet aanwezig, correct en minimaal 32 tekens zijn
  if (!secret || !agentSecret || agentSecret.length < 32) return null;
  if (secret !== agentSecret) return null;

  // Gebruik TC-admin als agent-identiteit voor capabilities lookup
  const cap = await getCapabilities(ADMIN_EMAIL);
  if (!cap?.isTC) return null;

  const agentRunId = crypto.randomUUID();

  return {
    id: `agent-${agentRunId}`,
    email: `agent+${agentRunId.slice(0, 8)}@ckvoranjewit.app`,
    name: "Agent",
    isTC: true,
    agentRunId,
  };
}
```

- [ ] **Stap 4: Draai test en verifieer dat hij slaagt**

```bash
pnpm test packages/auth/src/agent-provider.test.ts
```

Verwacht: 5 tests PASS

- [ ] **Stap 5: Voeg de `agent-login` provider toe aan `packages/auth/src/index.ts`**

Voeg toe **na** de `smartlink` provider (rond regel 103, vóór de `email-link` provider):

```typescript
import { authorizeAgent } from "./agent-provider";
```

Voeg toe vlak vóór de `email-link` provider:

```typescript
// Agent login: autonoom authenticeren via AGENT_SECRET env var.
// Werkt in alle omgevingen (dev én prod) — anders dan dev-login.
// Geeft een TC-sessie met isAgent: true + uniek agentRunId.
providers.push(
  Credentials({
    id: "agent-login",
    name: "Agent Login",
    credentials: {
      secret: { type: "text" },
    },
    async authorize(credentials) {
      return authorizeAgent({ secret: credentials?.secret as string });
    },
  })
);
```

Pas de `signIn` callback aan — voeg `"agent-login"` toe aan de allowlist:

```typescript
async signIn({ user, profile, account }) {
  if (
    account?.provider === "e2e-test" ||
    account?.provider === "dev-login" ||
    account?.provider === "agent-login" ||   // nieuw
    account?.provider === "smartlink" ||
    account?.provider === "email-link" ||
    account?.provider === "passkey"
  )
    return true;
  // ...rest ongewijzigd
```

Pas de `jwt` callback aan — voeg agent-velden toe **vóór** de bestaande `email` check:

```typescript
async jwt({ token, user, profile, account }) {
  // Agent-sessie: sla isAgent en agentRunId op in JWT
  if (account?.provider === "agent-login") {
    const agentUser = user as { isTC?: boolean; agentRunId?: string };
    token.isAgent = true;
    token.agentRunId = agentUser.agentRunId;
    token.isTC = true;
    token.isScout = false;
    token.clearance = 3;
    token.doelgroepen = ["ALLE"];
    token.authMethode = "agent";
    token.provider = "agent-login";
    return token;
  }

  // Bij eerste login: capabilities opslaan in JWT
  const email = profile?.email ?? user?.email;
  // ...rest ongewijzigd
```

Pas de `session` callback aan — voeg agent-velden toe:

```typescript
session({ session, token }) {
  if (session.user) {
    const user = session.user as unknown as Record<string, unknown>;
    // Capabilities
    user.isTC = token.isTC ?? false;
    user.isScout = token.isScout ?? false;
    user.clearance = token.clearance ?? 0;
    user.doelgroepen = token.doelgroepen ?? [];
    user.authMethode = token.authMethode ?? "google";
    if (token.provider) {
      user.provider = token.provider as string;
    }
    // Agent-specifieke velden
    user.isAgent = token.isAgent ?? false;        // nieuw
    if (token.agentRunId) {
      user.agentRunId = token.agentRunId as string;  // nieuw
    }
  }
  return session;
},
```

- [ ] **Stap 6: Typecheck**

```bash
pnpm --filter @oranje-wit/auth typecheck 2>/dev/null || pnpm tsc --noEmit -p packages/auth/tsconfig.json
```

Verwacht: geen typefouten

- [ ] **Stap 7: Commit**

```bash
git add packages/auth/src/agent-provider.ts packages/auth/src/agent-provider.test.ts packages/auth/src/index.ts
git commit -m "feat(auth): voeg agent-login provider toe met AGENT_SECRET validatie"
```

---

## Task 3: Cleanup endpoint

**Files:**
- Create: `apps/web/src/app/api/agent/cleanup/route.ts`
- Create: `apps/web/src/app/api/agent/cleanup/route.test.ts`

- [ ] **Stap 1: Schrijf de failing tests**

Maak `apps/web/src/app/api/agent/cleanup/route.test.ts`:

```typescript
import { vi, describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "@/test/mock-prisma";
import { callRoute } from "@oranje-wit/test-utils";

vi.mock("@/lib/teamindeling/db/prisma", () => ({
  prisma: mockPrisma,
}));

// Importeer de handler (wordt aangemaakt in stap 3)
import { POST } from "./route";

describe("POST /api/agent/cleanup", () => {
  beforeEach(() => {
    process.env.AGENT_SECRET = "dit-is-een-test-secret-van-32-tekens-lang!!";
    mockPrisma.werkindeling.findMany.mockReset();
    mockPrisma.werkindeling.delete.mockReset();
  });

  it("wijst verzoek af bij ontbrekend secret", async () => {
    const result = await callRoute(POST, {
      method: "POST",
      body: { agentRunId: "abc-123" },
    });
    expect(result.status).toBe(403);
  });

  it("wijst verzoek af bij verkeerd secret", async () => {
    const result = await callRoute(POST, {
      method: "POST",
      body: { secret: "fout-secret", agentRunId: "abc-123" },
    });
    expect(result.status).toBe(403);
  });

  it("wijst verzoek af bij ontbrekend agentRunId", async () => {
    const result = await callRoute(POST, {
      method: "POST",
      body: { secret: "dit-is-een-test-secret-van-32-tekens-lang!!" },
    });
    expect(result.status).toBe(400);
  });

  it("ruimt agent-werkindelingen op en geeft aantal terug", async () => {
    mockPrisma.werkindeling.findMany.mockResolvedValueOnce([
      { id: "w1", naam: "agent-abc-123" },
      { id: "w2", naam: "agent-abc-123-v2" },
    ]);
    mockPrisma.werkindeling.delete.mockResolvedValue({});

    const result = await callRoute(POST, {
      method: "POST",
      body: {
        secret: "dit-is-een-test-secret-van-32-tekens-lang!!",
        agentRunId: "abc-123",
      },
    });

    expect(result.status).toBe(200);
    const data = result.data as { ok: boolean; data: { werkindelingenVerwijderd: number } };
    expect(data.ok).toBe(true);
    expect(data.data.werkindelingenVerwijderd).toBe(2);
    expect(mockPrisma.werkindeling.delete).toHaveBeenCalledTimes(2);
  });

  it("retourneert 0 als er niets op te ruimen is", async () => {
    mockPrisma.werkindeling.findMany.mockResolvedValueOnce([]);

    const result = await callRoute(POST, {
      method: "POST",
      body: {
        secret: "dit-is-een-test-secret-van-32-tekens-lang!!",
        agentRunId: "abc-123",
      },
    });

    expect(result.status).toBe(200);
    const data = result.data as { ok: boolean; data: { werkindelingenVerwijderd: number } };
    expect(data.data.werkindelingenVerwijderd).toBe(0);
  });
});
```

- [ ] **Stap 2: Draai tests en verifieer dat ze falen**

```bash
pnpm test apps/web/src/app/api/agent/cleanup/route.test.ts
```

Verwacht: FAIL — `Cannot find module './route'`

- [ ] **Stap 3: Maak het cleanup endpoint aan**

Maak `apps/web/src/app/api/agent/cleanup/route.ts`:

```typescript
import { z } from "zod";
import { prisma } from "@/lib/teamindeling/db/prisma";
import { ok, fail, parseBody } from "@/lib/api/response";
import { logger } from "@oranje-wit/types";

const CleanupSchema = z.object({
  secret: z.string().min(1),
  agentRunId: z.string().min(1),
});

/**
 * POST /api/agent/cleanup
 *
 * Ruimt agent-werkindeling-versies op die zijn aangemaakt tijdens een agent-sessie.
 * Verificatie via AGENT_SECRET — geen NextAuth sessie nodig (agents zijn mogelijk
 * al uitgelogd als ze cleanup aanroepen).
 */
export async function POST(request: Request) {
  const body = await parseBody(CleanupSchema, request);
  if (!body.ok) return fail(body.error, 400);

  const { secret, agentRunId } = body.data;
  const agentSecret = process.env.AGENT_SECRET;

  if (!agentSecret || secret !== agentSecret) {
    return fail("Ongeldige agent secret", 403, "FORBIDDEN");
  }

  try {
    // Vind alle werkindeling-versies aangemaakt door deze agent-run
    // Naamconventie: "agent-[agentRunId]" of "agent-[agentRunId]-*"
    const agentWerkindelingen = await prisma.werkindeling.findMany({
      where: { naam: { startsWith: `agent-${agentRunId}` } },
      select: { id: true, naam: true },
    });

    for (const w of agentWerkindelingen) {
      await prisma.werkindeling.delete({ where: { id: w.id } });
      logger.warn(`[agent-cleanup] Werkindeling verwijderd: "${w.naam}" (${w.id})`);
    }

    const resultaat = {
      werkindelingenVerwijderd: agentWerkindelingen.length,
      agentRunId,
    };

    logger.warn(`[agent-cleanup] Cleanup klaar voor run ${agentRunId}: ${agentWerkindelingen.length} versies verwijderd`);
    return ok(resultaat);
  } catch (error) {
    logger.warn("[agent/cleanup] Fout tijdens cleanup:", error);
    return fail(error instanceof Error ? error.message : String(error));
  }
}
```

- [ ] **Stap 4: Draai tests en verifieer dat ze slagen**

```bash
pnpm test apps/web/src/app/api/agent/cleanup/route.test.ts
```

Verwacht: 5 tests PASS

- [ ] **Stap 5: Typecheck**

```bash
pnpm --filter web typecheck 2>/dev/null || pnpm tsc --noEmit -p apps/web/tsconfig.json
```

Verwacht: geen nieuwe typefouten

- [ ] **Stap 6: Commit**

```bash
git add apps/web/src/app/api/agent/cleanup/
git commit -m "feat(api): voeg agent cleanup endpoint toe voor werkindeling-versies"
```

---

## Task 4: Visueel skill aanmaken

**Files:**
- Create: `.claude/skills/visueel/SKILL.md`

- [ ] **Stap 1: Maak de directory aan**

```bash
mkdir -p .claude/skills/visueel
```

- [ ] **Stap 2: Schrijf de skill**

Maak `.claude/skills/visueel/SKILL.md`:

```markdown
# Visueel — Agent Visuele Inspectie

Gebruik deze skill wanneer je frontend-werk visueel wilt beoordelen via Playwright MCP.
Verplicht stappenplan — sla geen stap over.

## Vereisten

- Playwright MCP is beschikbaar (`mcp__plugin_playwright_playwright`)
- `AGENT_SECRET` is geconfigureerd in de omgeving

---

## Stap 1 — Authenticate

Lees het AGENT_SECRET via Bash:

```bash
# Lokaal (dev)
AGENT_SECRET=$(grep '^AGENT_SECRET=' .env.local 2>/dev/null | cut -d= -f2-)
# Of via shell omgeving
echo $AGENT_SECRET
```

Sla ook een agentRunId op:

```bash
AGENT_RUN_ID=$(uuidgen 2>/dev/null || python3 -c "import uuid; print(uuid.uuid4())")
echo "AgentRunId: $AGENT_RUN_ID"
```

Gebruik Playwright MCP om in te loggen:

1. Navigeer naar `/api/auth/csrf`
2. Lees de `csrfToken` uit de JSON response
3. POST naar `/api/auth/callback/agent-login` met body:
   ```
   csrfToken=<waarde>&secret=<AGENT_SECRET>
   ```
   Als `Content-Type: application/x-www-form-urlencoded`
4. Verifieer dat de browser NIET redirect naar `/login`

Bij fout: controleer of `AGENT_SECRET` correct is ingesteld.

---

## Stap 2 — Inspect

Navigeer naar de pagina's die je wilt beoordelen.

**Screenshots standaard:**
- Desktop: viewport 1440×900
- Mobile: viewport 390×844

Sla op als `e2e/screenshots/agent-<timestamp>-<paginanaam>.png`

**Let op bij elke pagina:**
- Console errors (toon ze expliciet in je rapport)
- Layout breaks of overflow
- Lege states die gevuld zouden moeten zijn
- Loading spinners die blijven draaien
- Ontbrekende afbeeldingen of iconen

---

## Stap 3 — Interact (optioneel)

Als je TI Studio werkbord of indeling wilt testen:

1. Maak een nieuwe werkindeling aan met naam `agent-<AGENT_RUN_ID>`
2. Werk uitsluitend in deze versie
3. Raak de gepubliceerde of actieve versie **nooit** aan

Andere mutaties buiten TI Studio worden gelogd maar niet automatisch opgeruimd.
Beperk mutaties buiten TI Studio tot het minimum.

---

## Stap 4 — Cleanup (VERPLICHT)

Roep altijd de cleanup aan, ook als je geen TI Studio versies hebt aangemaakt:

```bash
curl -s -X POST <BASE_URL>/api/agent/cleanup \
  -H "Content-Type: application/json" \
  -d "{\"secret\": \"$AGENT_SECRET\", \"agentRunId\": \"$AGENT_RUN_ID\"}"
```

Verifieer dat de response `"ok": true` bevat.

Base URL lokaal: `http://localhost:3000`
Base URL productie: `https://www.ckvoranjewit.app`

---

## Stap 5 — Rapporteer

Geef je bevindingen terug aan de aanroepende agent of gebruiker:

- Lijst van bezochte pagina's
- Screenshot-paden (relatief vanuit repo root)
- Eventuele console errors per pagina
- Visuele afwijkingen of problemen
- Of cleanup succesvol was
```

- [ ] **Stap 3: Commit**

```bash
git add .claude/skills/visueel/SKILL.md
git commit -m "feat(skills): voeg visueel skill toe voor agent browser inspectie"
```

---

## Task 5: Agent-definities bijwerken

**Files:**
- Modify: `.claude/agents/e2e-tester.md`
- Modify: `.claude/agents/frontend.md`
- Modify: `.claude/agents/ux-designer.md`
- Modify: `.claude/agents/ontwikkelaar.md`

- [ ] **Stap 1: Voeg visueel skill toe aan `e2e-tester.md`**

In `.claude/agents/e2e-tester.md`, zoek het `skills:` blok in de frontmatter:

```yaml
skills:
  - shared/e2e-testing
  - shared/deployment
```

Vervang door:

```yaml
skills:
  - shared/e2e-testing
  - shared/deployment
  - shared/visueel
```

- [ ] **Stap 2: Voeg visueel skill toe aan `frontend.md`**

In `.claude/agents/frontend.md`, zoek het `skills:` blok in de frontmatter en voeg `- shared/visueel` toe aan het einde van de lijst.

Als er geen `skills:` blok is, voeg toe aan de frontmatter (vóór de sluitende `---`):

```yaml
skills:
  - shared/visueel
```

- [ ] **Stap 3: Voeg visueel skill toe aan `ux-designer.md`**

Zelfde patroon als stap 2 — voeg `- shared/visueel` toe aan `skills:` in de frontmatter van `.claude/agents/ux-designer.md`.

- [ ] **Stap 4: Voeg visueel skill toe aan `ontwikkelaar.md`**

Zelfde patroon als stap 2 — voeg `- shared/visueel` toe aan `skills:` in de frontmatter van `.claude/agents/ontwikkelaar.md`.

- [ ] **Stap 5: Commit**

```bash
git add .claude/agents/e2e-tester.md .claude/agents/frontend.md .claude/agents/ux-designer.md .claude/agents/ontwikkelaar.md
git commit -m "feat(agents): voeg visueel skill toe aan e2e-tester, frontend, ux-designer, ontwikkelaar"
```

---

## Task 6: Handmatige setup (door Antjan)

Deze stappen zijn buiten scope voor de implementerende agent — Antjan voert ze zelf uit.

- [ ] **Stap 1: Genereer een sterk AGENT_SECRET**

```bash
openssl rand -base64 32
```

- [ ] **Stap 2: Voeg toe aan `.env.local`**

```
AGENT_SECRET=<gegenereerde waarde>
```

- [ ] **Stap 3: Voeg toe aan Railway env vars**

Ga naar Railway dashboard → oranje-wit service → Variables → voeg `AGENT_SECRET` toe met dezelfde waarde.

- [ ] **Stap 4: Verifieer lokaal**

Start de dev server en test de agent-login flow:

```bash
pnpm dev
```

Voer dan uit:

```bash
# CSRF token ophalen
CSRF=$(curl -s http://localhost:3000/api/auth/csrf | jq -r '.csrfToken')

# Inloggen als agent
curl -s -X POST http://localhost:3000/api/auth/callback/agent-login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "csrfToken=$CSRF&secret=$AGENT_SECRET"
```

Verwacht: geen redirect naar `/login`, sessie-cookie aanwezig.

---

## Volledige test suite

Na alle taken — draai de volledige test suite om te verifiëren dat niets is gebroken:

```bash
pnpm test
```

Verwacht: alle tests slagen, geen nieuwe failures.

---

## Spec

Design spec: `docs/superpowers/specs/2026-04-14-agent-visueel-backdoor-design.md`
