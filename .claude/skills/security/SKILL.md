---
name: security
description: Security audit op OWASP Top 10 + STRIDE threat modeling voor Next.js 16 + Prisma + NextAuth v5 + Railway. Daily mode (snel, confidence gate 8/10) of Comprehensive mode (maandelijks, trend tracking).
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Write
argument-hint: "[modus: daily | comprehensive] [scope: alles | auth | prisma | env | deps]"
---

# Security — OWASP Top 10 + STRIDE Audit

## Wanneer gebruiken

- `daily` (of geen argument): snel scannen tijdens ontwikkeling, stop bij confidence < 8/10, geen opslag
- `comprehensive`: maandelijkse diepgaande audit, volledige OWASP + STRIDE, opslaan als trend in `docs/security/`

## Modus-detectie

Argument `comprehensive` = comprehensive modus. Alles anders (incl. geen argument) = daily modus.

## Stap 0: Context laden

1. Lees `CLAUDE.md` voor de huidige stack en patronen
2. Lees `packages/auth/` voor guardTC/requireTC implementatie (grep naar deze functies)
3. Check git log: `git log --oneline -5` voor recente wijzigingen als scope-hint

## Stap 1: OWASP Top 10 Checks (Next.js 16 specifiek)

Voer elke check uit met de concrete grep-commando's. Na elke check: geef een **confidence score (1-10)**. Bij daily modus en confidence < 8: stop en rapporteer onmiddellijk als ROOD.

### A01 — Broken Access Control

```bash
# API routes zonder guardTC() als eerste aanroep
grep -rn "export.*GET\|export.*POST\|export.*PUT\|export.*DELETE\|export.*PATCH" apps/web/src/app --include="route.ts" -l
```
Voor elk gevonden route.ts-bestand: check of `guardTC()` de eerste aanroep is. Routes die prisma aanroepen zonder guardTC = ROOD.

Check ook: directe Prisma-imports in page-componenten (mag niet):
```bash
grep -rn "from '@oranje-wit/database'" apps/web/src/app --include="*.tsx" | grep -v "actions\|route"
```

### A02 — Cryptographic Failures

```bash
# Hardcoded secrets buiten .env
grep -rn "secret\|password\|api_key\|apikey\|token" apps/ packages/ --include="*.ts" --include="*.tsx" | grep -v "process\.env\|\.env\|test\|spec\|\.test\.\|NEXTAUTH_SECRET\|//\|logger"
```
Elke hardcoded string die een secret lijkt = ORANJE/ROOD afhankelijk van gevoeligheid.

### A03 — Injection

```bash
# Prisma raw queries (potentieel gevaarlijk als ongesanitized input gebruikt wordt)
grep -rn "prisma\.\$queryRaw\|prisma\.\$executeRaw\|prisma\.\$queryRawUnsafe" apps/ packages/ --include="*.ts"
```
Beoordeel per gevonden locatie: wordt input gevalideerd via Zod vóór gebruik?

```bash
# Template literals in queries
grep -rn "\`SELECT\|\`INSERT\|\`UPDATE\|\`DELETE" apps/ packages/ --include="*.ts"
```

### A04 — Insecure Design

Daily modus: markeer als "→ zie STRIDE (comprehensive)".
Comprehensive modus: zie Stap 2.

### A05 — Security Misconfiguration

```bash
# NODE_ENV checks in productie-paden
grep -rn "NODE_ENV.*development\|isDev\|isProduction" apps/ packages/ --include="*.ts" --include="*.tsx" | grep -v "test\|spec"
```

```bash
# Debug-logging in productie-paden
grep -rn "logger\.info" apps/ packages/ --include="*.ts" | head -20
```
`logger.info` mag alleen in development (`if (process.env.NODE_ENV === 'development')`).

Check ook: `.env.example` bestaat en bevat alle benodigde variabelen:
```bash
ls .env.example 2>/dev/null && cat .env.example | head -20
```

### A06 — Vulnerable Components

```bash
pnpm audit --audit-level=high 2>&1 | head -50
```
Elke HIGH of CRITICAL vulnerability = ROOD. Moderate = ORANJE.

### A07 — Authentication Failures

```bash
# Server actions zonder requireTC()
grep -rn "export.*async function\|'use server'" apps/web/src/app --include="*.ts" --include="*.tsx" -l | head -20
```
Voor elk bestand: check of `requireTC()` aanwezig is als er TC-gerelateerde data wordt gelezen/geschreven.

```bash
# API routes op beschermde paden zonder auth check
find apps/web/src/app -name "route.ts" | xargs grep -L "guardTC\|requireTC\|getServerSession" 2>/dev/null
```

### A08 — Software and Data Integrity

```bash
# db:push gebruik check (mag nooit)
grep -rn "db:push" package.json apps/ packages/ --include="*.json" --include="*.ts"
```

```bash
# package-lock integriteit (als pnpm-lock.yaml recent handmatig aangepast)
git log --oneline -5 -- pnpm-lock.yaml
```

### A09 — Security Logging Failures

```bash
# console.log/console.error in productie-code (verboden — moet logger zijn)
grep -rn "console\.log\|console\.error\|console\.warn" apps/ packages/ --include="*.ts" --include="*.tsx" | grep -v "test\|spec\|\.test\.\|//\|eslint-disable"
```
Elke `console.*` in productie-code = ORANJE (regel is: gebruik `logger` uit `@oranje-wit/types`).

```bash
# Lege catch-blocks (verboden — moet logger.warn zijn)
grep -rn "catch.*{" apps/ packages/ --include="*.ts" --include="*.tsx" -A 1 | grep -B 1 "^--$\|^[[:space:]]*}$" | head -20
```

### A10 — Server-Side Request Forgery (SSRF)

```bash
# Externe HTTP-calls vanuit server-side code
grep -rn "fetch(\|axios\.\|https\.\|http\." apps/ packages/ --include="*.ts" | grep -v "test\|spec\|//\|localhost\|127\.0\.0\.1" | head -20
```
Beoordeel: zijn externe calls naar vertrouwde domeinen? Wordt user-input gebruikt in de URL? = ROOD.

## Stap 2: STRIDE Threat Modeling (alleen comprehensive modus)

Analyseer het `guardTC()`/`requireTC()` auth-systeem specifiek:

Lees eerst `packages/auth/` voor de implementatie-details.

### Spoofing
Kan een niet-TC Google account de allowlist omzeilen?
- Check: hoe wordt de allowlist gevalideerd in NextAuth v5?
- Check: is de allowlist server-side of client-side?
- Check: kan een JWT van een andere provider worden hergebruikt?

### Tampering
Kan sessie-data gemanipuleerd worden?
- Check: NextAuth v5 session signing (NEXTAUTH_SECRET aanwezig en sterk?)
- Check: worden sessie-claims gebruikt voor autorisatie zonder server-side verificatie?

### Repudiation
Zijn TC-acties herleidbaar?
- Check: worden schrijfoperaties gelogd met user-context?
- Check: is er een audit trail voor kritieke acties (teamindeling, evaluaties)?

### Information Disclosure
Lekken error-messages interne structuur?
- Check: API routes die volledige stack traces retourneren bij errors
- Check: Prisma-errors die database-structuur onthullen

### Denial of Service
Rate limiting op auth endpoints?
- Check: is er rate limiting op `/api/auth/*` endpoints?
- Check: kunnen unauthenticated requests de database belasten?

### Elevation of Privilege
Kan een smartlink-gebruiker TC-rechten krijgen?
- Check: clearance-level verificatie — is dit server-side enforced?
- Check: kunnen clearance-checks worden omzeild via URL-manipulatie?

## Stap 3: Output

Presenteer altijd in dit formaat:

```
## Security Audit — [datum] — [daily|comprehensive]

### Confidence Score: X/10

### OWASP Top 10 Samenvatting
| Check | Status | Bevinding |
|-------|--------|-----------|
| A01 Broken Access Control | GROEN/ORANJE/ROOD | [detail of "Geen bevindingen"] |
| A02 Cryptographic Failures | ... | ... |
| A03 Injection | ... | ... |
| A04 Insecure Design | STRIDE (comprehensive) | — |
| A05 Security Misconfiguration | ... | ... |
| A06 Vulnerable Components | ... | ... |
| A07 Authentication Failures | ... | ... |
| A08 Data Integrity | ... | ... |
| A09 Logging Failures | ... | ... |
| A10 SSRF | ... | ... |

### Bevindingen

#### ROOD — Directe actie vereist
| Bevinding | Locatie | Risico | Aanbeveling |
|-----------|---------|--------|-------------|
| ... | ... | ... | ... |

#### ORANJE — Plan actie
...

#### GROEN — Geen bevindingen
...

### STRIDE Analyse (comprehensive only)
| Threat | Status | Bevinding |
|--------|--------|-----------|
| Spoofing | ... | ... |
...
```

## Stap 4: Opslaan (alleen comprehensive modus)

1. Maak `docs/security/` aan als het niet bestaat
2. Sla op als `docs/security/YYYY-MM-DD-comprehensive.md`
3. Update/maak `docs/security/README.md` (trendtabel):

```markdown
# Security Audit Trend

| Datum | Modus | Overall | ROOD | ORANJE | Notities |
|-------|-------|---------|------|--------|----------|
| [datum] | comprehensive | GROEN/ORANJE/ROOD | 0 | 2 | [korte noot] |
```

## Gerelateerde skills

- `/audit` — codebase-brede kwaliteitsaudit (roept `/security daily` aan bij volledige modus)
- `/health-check` — infrastructuur-gezondheid (services, DNS, SSL)
- `/team-kwaliteit` — code review inclusief security check
