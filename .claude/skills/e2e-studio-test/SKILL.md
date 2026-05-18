---
name: e2e-studio-test
description: E2E-testen tegen studio-test.ckvoranjewit.app. Bevat verplicht test-template met beforeAll/afterAll cleanup, AgentMutatie audit-trail, skip-patterns en PDND-Playwright nuances (MCP versus GitHub Actions verschil). Gebruiken bij nieuwe ti-studio-v2 specs, drag-drop validatie, CI-setup of cleanup-endpoint debugging.
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
argument-hint: "[actie: write-spec|port-spec|debug-cleanup|pdnd-check] [beschrijving]"
---

# E2E Studio-Test — Agent Skill

Gebruik deze skill bij het schrijven van E2E-tests tegen `studio-test.ckvoranjewit.app` (ti-studio-v2 remote omgeving). Bevat verplichte cleanup-patronen, selector-conventies en PDND-Playwright workarounds.

Diepere uitleg: zie `docs/kennis/e2e-testen-tegen-studio-test.md`.

## Wanneer gebruiken

- **Nieuwe E2E spec schrijven** voor ti-studio-v2-remote project
- **Bestaande v2-spec porten** van lokaal naar studio-test auth-flow
- **Drag-drop tests debuggen** (PDND MCP vs CI headless verschil)
- **Cleanup-endpoint valideren** of AgentMutatie-logica uitbreiden
- **studio-test-auth.setup verfijnen** (Basic-Auth + agent-login)
- **Nightly CI-workflow troubleshoot** of uitbreiden

## Stap 1: Template kopiëren

Zet dit in elk nieuw bestand `e2e/ti-studio-v2/<feature>.spec.ts`:

```typescript
import { test, expect } from "./fixtures/base";

/**
 * TI Studio v2 — <feature> tests
 *
 * Draait tegen studio-test.ckvoranjewit.app (production-like data).
 * AgentMutatie cleanup: afterAll zoekt agentRunId in cookie en
 * roept POST /api/agent/cleanup aan in reverse-chronologische volgorde.
 *
 * data-testid conventies:
 *   speler-card-{rel_code}-spelerpool       — speler in pool
 *   speler-card-{rel_code}-team-{teamId}    — speler op team (CompactChip)
 *   team-kaart-{teamId}-huidig              — team drop-target wrapper
 *   drop-zone-spelerpool                    — pool drawer drop-target
 *   drop-zone-team-{teamId}                 — via data-drop-testid op kaart
 */

let capturedAgentRunId: string | null = null;

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext({
    storageState: "./e2e/.auth/studio-test.json",
  });
  const cookies = await context.cookies();
  const agentCookie = cookies.find((c) => c.name === "__ow_agent_run_id");
  capturedAgentRunId = agentCookie?.value ?? null;
  if (capturedAgentRunId) {
    console.log(`[<feature>] agentRunId voor cleanup: ${capturedAgentRunId}`);
  }
  await context.close();
});

test.afterAll(async ({ request }) => {
  if (!capturedAgentRunId) {
    console.log("[<feature>] afterAll: geen agentRunId — cleanup overgeslagen");
    return;
  }

  const baseURL = process.env.STUDIO_TEST_URL ?? "https://studio-test.ckvoranjewit.app";
  const secret = process.env.STUDIO_TEST_AGENT_SECRET ?? "";

  if (!secret) {
    console.log("[<feature>] afterAll: STUDIO_TEST_AGENT_SECRET niet gezet — cleanup overgeslagen");
    return;
  }

  try {
    const response = await request.post(`${baseURL}/api/agent/cleanup`, {
      data: { secret, agentRunId: capturedAgentRunId },
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${process.env.STUDIO_TEST_BASIC_AUTH_USER ?? ""}:${process.env.STUDIO_TEST_BASIC_AUTH_PASS ?? ""}`
        ).toString("base64")}`,
      },
    });

    if (response.ok()) {
      const body = (await response.json()) as { ok: boolean; rolledBack: number };
      console.log(`[<feature>] Cleanup: ${body.rolledBack} mutaties teruggedraaid`);
    } else {
      console.warn(`[<feature>] Cleanup mislukt: HTTP ${response.status()}`);
    }
  } catch (error) {
    console.warn("[<feature>] Cleanup fout (genegeerd):", error);
  }
});

test.describe("<feature>", () => {
  test.setTimeout(90_000);

  test("doet iets", async ({ page }) => {
    await page.goto("/indeling", { timeout: 30_000 });
    await page.waitForTimeout(1500);
    // Je test hier
  });
});
```

Vul `<feature>` in met je feature-naam (bijv. `kader-aanmaken`, `memo-save`).

## Stap 2: Selector-conventies

```typescript
// Speler in spelerspool
page.locator('[data-testid^="speler-card-"][data-testid$="-spelerpool"]')

// Speler op team
page.locator('[data-testid^="speler-card-"][data-testid*="-team-"]')

// Team-kaart als drop-target
page.locator('[data-testid^="team-kaart-"][data-testid$="-huidig"]')

// Spelerspool drawer
page.locator('data-testid=drop-zone-spelerpool')
```

rel_code extraheren (Sportlink ID):

```typescript
const testId = await element.getAttribute("data-testid");
const rel_code = testId?.split("-")[2] ?? "";
if (!rel_code) test.skip(true, "Geen rel_code gevonden");
```

## Stap 3: Skip-guards (mild)

```typescript
const spelers = await page.locator('[data-testid^="speler-card-"]').count();
if (spelers === 0) {
  test.skip(true, "Geen spelers in test-DB");
  return;
}
```

Hard expect alleen voor logic-bugs:

```typescript
const errors = await page.locator("[data-save-state=error]").count();
expect(errors).toBe(0);
```

**Regel:** meer dan 50% skip-rate? Test is waardeloos — herschrijf assertions of voeg data toe.

## Stap 4: Timing

Na drag/save altijd wachten op revalidatePath:

```typescript
await spelerElem.dragTo(doelTeam);
await page.waitForTimeout(2000);

await page.goto("/pad");
await page.waitForTimeout(1500); // hydration
```

## PDND-Playwright nuance

PDND drag-drop heeft een **omgeving-afhankelijke testbaarheid**:

| Context | `dragTo()` werkt? | Oplossing |
|---|---|---|
| Lokaal `--headed` | ✅ | Werkt direct |
| Lokaal headless | ⚠️ | Mogelijk skip, fallback op handmatige verificatie |
| Playwright MCP | ❌ | Visuele inspectie + DOM-assertions; geen drag |
| GitHub Actions Chromium | ✅ | Werkt — bewezen door werkbord-dragdrop nightly |

Schrijf drag-drop tests **zonder MCP-aannames** — laat ze gewoon draaien in CI.

## Cleanup-endpoint handmatig testen

```bash
export STUDIO_TEST_URL="https://studio-test.ckvoranjewit.app"
# Lees secrets uit gh secret list of Railway env (NOOIT in repo committen)

curl -X POST "$STUDIO_TEST_URL/api/agent/cleanup" \
  -H "Authorization: Basic $(echo -n "$STUDIO_TEST_BASIC_AUTH_USER:$STUDIO_TEST_BASIC_AUTH_PASS" | base64)" \
  -H "Content-Type: application/json" \
  -d "{\"secret\":\"$STUDIO_TEST_AGENT_SECRET\",\"agentRunId\":\"00000000-0000-0000-0000-000000000000\"}" \
  | jq .
```

Verwacht: `{"ok":true,"rolledBack":0}` (idempotent, geen mutaties voor unknown runId).

## Lokaal draaien

```bash
pnpm exec playwright test \
  --project=studio-test-auth-setup \
  --project=ti-studio-v2-remote \
  e2e/ti-studio-v2/<feature>.spec.ts \
  --headed --workers=1
```

Vereiste env vars: `STUDIO_TEST_BASIC_AUTH_USER`, `STUDIO_TEST_BASIC_AUTH_PASS`, `STUDIO_TEST_AGENT_SECRET`. Bron: GitHub secrets of `gh secret list -R mrbacklog/oranje-wit`.

## Verwijzingen

- **Kennisdoc (diepte):** `docs/kennis/e2e-testen-tegen-studio-test.md`
- **Architectuur spec:** `docs/superpowers/specs/2026-05-15-e2e-tegen-studio-test.md`
- **PDND-erratum:** `docs/superpowers/specs/2026-05-13-drag-drop-library-research.md`
- **Werkende referentie:** `e2e/ti-studio-v2/werkbord-dragdrop.spec.ts`
- **CI workflow:** `.github/workflows/e2e-studio-test.yml`
- **Edge-case catalogus:** `docs/kennis/edge-case-testdata.md`

## Bij schema- of UI-wijzigingen

Loop het mutatie-respons protocol af (zie kennisdoc sectie "Mutatie-respons protocol" in `docs/kennis/edge-case-testdata.md`). Skip dit niet — coverage-check faalt anders nightly E2E.

## STRIKT

- `logger` uit `@oranje-wit/types` (in app-code, niet in `e2e/*.setup.ts`)
- `rel_code` is enige speler-sleutel — NOOIT naam-matching
- NOOIT secrets hardcoden — env vars + GitHub secrets
- NOOIT `pnpm db:push`
- NOOIT hardcoded baseURL — gebruik `page.goto("/...")` met project-baseURL
- Taal: Nederlands in user-facing strings

## Opdracht

$ARGUMENTS

Standaardgedrag: schrijf een nieuwe spec met het template hierboven. Vul `<feature>`, voeg selectors toe, run lokaal met `--headed` om te verifiëren, push, trigger CI via `gh workflow run "E2E tegen studio-test"`.
