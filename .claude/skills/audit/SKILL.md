---
name: audit
description: Codebase-brede audit op architectuur, functionele duplicatie en UX-consistentie. Vindt dubbel werk, onnodige structuren en inconsistenties.
context: fork
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Edit, Write, Agent(ontwikkelaar, ux-designer, frontend, e2e-tester)
argument-hint: "[modus: alles | architectuur | functioneel | ux] [scope: alles | apps/monitor | apps/scouting | packages/ui | ...]"
---

# Audit — Codebase-brede kwaliteitsaudit

Onderzoekt de codebase op duplicatie, onnodige structuren, inconsistenties en afwijkingen van vastgestelde patronen. Rapporteert bevindingen met prioriteit en lost ze op na bevestiging.

## Wanneer gebruiken

- Na een sprint van rapid vibe coding om het totaalbeeld te herstellen
- Bij het vermoeden van dubbel werk of vergeten opruimwerk
- Periodiek (bijv. maandelijks) als hygienecheck
- Voor een nieuwe feature om te checken of bestaande bouwstenen hergebruikt kunnen worden

## Gebruik

```
/audit                          # Volledige audit (alle modi, hele codebase)
/audit architectuur             # Alleen architectuur-audit
/audit functioneel apps/scouting # Functionele audit, alleen scouting app
/audit ux                       # UX-consistentie audit
/audit alles packages/ui        # Alle modi, alleen UI package
```

## Stappen

### Stap 0: Context laden

1. Lees `CLAUDE.md` voor de huidige structuur en patronen
2. Lees `rules/design-system.md` (voor UX-modus)
3. Check `git log --oneline -20` voor recente activiteit
4. Bepaal de scope (hele codebase of specifieke map)

### Stap 1: Scan

Voer de relevante scans uit op basis van de gekozen modus. Gebruik **parallelle agents** waar mogelijk om de audit te versnellen.

---

## Modus: Architectuur

Onderzoekt structurele problemen, duplicatie en patroonafwijkingen.

### A1. Bestandsduplicatie
```bash
# Bestanden met dezelfde naam op meerdere locaties
find apps/ packages/ -name "*.ts" -o -name "*.tsx" | sed 's|.*/||' | sort | uniq -d
```
**Beoordeel**: Zijn dit bewuste lokale varianten of vergeten duplicaten?

### A2. Ongebruikte exports uit packages
```bash
# Exports uit packages/ui die nergens geimporteerd worden
grep -rh "export " packages/ui/src/ --include="*.tsx" --include="*.ts" | grep -oP 'export (?:const|function|type|interface) \K\w+' | sort > /tmp/exports.txt
# Check of elk export ergens in apps/ gebruikt wordt
```
**Beoordeel**: Exports die nergens gebruikt worden zijn kandidaten voor opruiming.

### A3. Te grote bestanden
```bash
# Bestanden boven 400 regels (max-lines ESLint regel)
find apps/ packages/ -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -rn | head -20
```
**Beoordeel**: Moeten deze opgesplitst worden?

### A4. Directe DB-queries buiten actions/API
Zoek naar `prisma.` imports buiten `actions.ts`, `route.ts` en `lib/db/` bestanden.
**Regel**: DB-toegang hoort via server actions of API routes, niet in componenten.

### A5. Inconsistente imports
Zoek naar patronen die afwijken van de standaard:
- `console.log` i.p.v. `logger` uit `@oranje-wit/types`
- Lokale constanten die in `@oranje-wit/types` horen (HUIDIG_SEIZOEN, HUIDIGE_PEILDATUM, korfballeeftijd-helpers, etc.)
- Directe Prisma-client imports i.p.v. via `@oranje-wit/database`

### A6. Ongebruikte dependencies
```bash
# Check package.json dependencies die nergens geimporteerd worden
```
Per app: vergelijk `dependencies` in `package.json` met daadwerkelijke imports.

### A7. Dode code en TODO's
```bash
# Vergeten TODO's, FIXME's, HACK's
grep -rn "TODO\|FIXME\|HACK\|XXX" apps/ packages/ --include="*.ts" --include="*.tsx"
```

---

## Modus: Functioneel

Onderzoekt overlappende functionaliteit en dubbele logica.

### F1. Dubbele API routes / server actions
Vergelijk server actions en API routes op overlappende functionaliteit:
- Dezelfde Prisma-query in meerdere actions
- API routes die hetzelfde doen als server actions
- Vergelijkbare data-fetching logica op meerdere plekken

### F2. Dubbele type-definities
```bash
# Types die in meerdere bestanden gedefinieerd worden
grep -rn "type \|interface " apps/ packages/ --include="*.ts" --include="*.tsx" | grep -oP '(?:type|interface) \K\w+' | sort | uniq -d
```
**Regel**: Gedeelde types horen in `@oranje-wit/types`.

### F3. Vergeten componenten
Zoek React-componenten die gedefinieerd maar nergens geimporteerd worden:
```bash
# Geexporteerde componenten die nergens gebruikt worden
grep -rn "export.*function\|export.*const.*=" --include="*.tsx" apps/ | grep -v "page\|layout\|loading\|error\|not-found"
```

### F4. Hardcoded constanten
Zoek naar hardcoded waarden die als constante in `@oranje-wit/types` horen:
- Seizoensstrings ("2025-2026")
- Peiljaren (2026)
- Peildatums
- Categorienamen

### F5. Copy-paste logica
Zoek naar blokken code die verdacht veel op elkaar lijken:
- Vergelijkbare validatie-functies
- Herhaalde data-transformaties
- Soortgelijke UI-patronen die een gedeeld component zouden moeten zijn

### F6. Inconsistente error handling
- Lege catch-blocks
- `console.error` i.p.v. `logger.error`
- Ontbrekende error boundaries
- API routes zonder try/catch

---

## Modus: UX

Onderzoekt design system compliance en visuele consistentie.

### U1. Hardcoded kleuren
```bash
# Kleuren buiten het design system
grep -rn "bg-white\|bg-black\|bg-gray-\|text-gray-\|border-gray-\|bg-slate-\|text-slate-" apps/ --include="*.tsx"
# Inline hex/rgb kleuren
grep -rn "#[0-9a-fA-F]\{3,6\}\|rgb(" apps/ --include="*.tsx" --include="*.css" | grep -v "tokens\|globals"
```
**Regel**: Gebruik design tokens uit `packages/ui/src/tokens/`.

### U2. Componenten buiten design system
Zoek naar lokaal gebouwde componenten die al in `packages/ui/` bestaan:
- Lokale Button, Card, Badge, Dialog, Input componenten
- Eigen modal/drawer implementaties
- Custom tooltips of dropdowns

### U3. Ontbrekende dark mode support
```bash
# Componenten met light-mode kleuren zonder dark variant
grep -rn "className=" apps/ --include="*.tsx" | grep -v "dark:" | grep -E "bg-(white|gray-[12]00)|text-(black|gray-[89]00)"
```

### U4. Inconsistente spacing en layout
- Mix van `p-4` en `p-6` op vergelijkbaar niveau
- Inconsistente `gap-` waarden in grids
- Ontbrekende responsive breakpoints

### U5. Ontbrekende loading/error states
Zoek naar pagina's zonder:
- `loading.tsx` (Suspense fallback)
- `error.tsx` (Error boundary)
- Empty states (geen data)

### U6. Toegankelijkheid
- Buttons zonder `aria-label`
- Images zonder `alt`
- Formulieren zonder labels
- Kleurcontrast issues (oranje op donker)

### U7. Design token dekking
Vergelijk welk percentage van kleurgebruik via tokens gaat vs. hardcoded.

---

## Modus: Security (onderdeel van volledige audit)

Bij een volledige audit (`/audit` zonder specifieke modus of `/audit alles`) wordt altijd een security-check uitgevoerd.

Spawn een sub-agent met de instructie om `/security daily` uit te voeren op de codebase. Verwerk de bevindingen als vierde modus in het eindrapport.

**Belangrijk:** Alleen bij `/audit` (volledig) of `/audit alles` — niet bij gerichte modi zoals `/audit architectuur` of `/audit ux`.

---

## Stap 2: Rapporteer

Presenteer bevindingen als overzichtelijke tabel, gegroepeerd per modus:

```
## Audit Rapport — [datum]
Scope: [hele codebase / specifieke map]
Modi: [architectuur / functioneel / ux / alles]

### Samenvatting
| Modus         | Hoog | Midden | Laag | Totaal |
|---------------|------|--------|------|--------|
| Architectuur  | 2    | 5      | 3    | 10     |
| Functioneel   | 1    | 3      | 4    | 8      |
| UX            | 3    | 2      | 1    | 6      |
| Security      | 0    | 1      | 0    | 1      |
| **Totaal**    | **6**| **11** | **8**| **25** |

### Bevindingen

#### HOOG — Direct actie nodig
| # | Modus | Bevinding | Locatie | Actie |
|---|-------|-----------|---------|-------|
| 1 | A1    | prisma.ts gedupliceerd in 3 apps | apps/*/lib/db/ | Centraliseer in packages/database |
| 2 | U1    | 47x hardcoded bg-white | apps/ti-studio/ | Vervang door design tokens |

#### MIDDEN — Plan actie
| # | Modus | Bevinding | Locatie | Actie |
|---|-------|-----------|---------|-------|
| 3 | F2    | SpelerType in 4 bestanden | apps/*/types/ | Verplaats naar @oranje-wit/types |

#### LAAG — Overweeg bij gelegenheid
| # | Modus | Bevinding | Locatie | Actie |
|---|-------|-----------|---------|-------|
| 4 | A7    | 12 TODO's gevonden | verspreid | Review en verwerk of verwijder |
```

### Prioriteitsbepaling

| Prioriteit | Criteria |
|---|---|
| **HOOG** | Duplicatie die actief verwarring veroorzaakt, design system violations in nieuwe code, security issues |
| **MIDDEN** | Inconsistenties die onderhoud lastiger maken, gemiste hergebruik-kansen, verouderde patronen |
| **LAAG** | Cosmetische inconsistenties, TODO's, minor optimalisaties |

## Stap 3: Oplossen (na bevestiging)

Vraag de gebruiker welke bevindingen opgepakt moeten worden. Pak ze vervolgens op in volgorde van prioriteit.

### Aanpak per type

| Type bevinding | Oplossing | Agent |
|---|---|---|
| Dubbele code/types | Centraliseer in packages/ | ontwikkelaar |
| Design system violations | Migreer naar tokens/componenten | frontend (onder regie ux-designer) |
| Ongebruikte exports | Verwijder of documenteer waarom ze bestaan | ontwikkelaar |
| Te grote bestanden | Splits op in logische eenheden | ontwikkelaar |
| Ontbrekende error/loading states | Voeg toe per app | ontwikkelaar |
| Toegankelijkheid | Fix met design system componenten | frontend |

### Regels bij oplossen

1. **Geen scope creep** — los alleen de gerapporteerde bevinding op, niet "terwijl we toch bezig zijn"
2. **Test na elke fix** — draai relevante tests (`pnpm test`, `pnpm test:e2e:design-system`)
3. **Commit per categorie** — niet alles in een mega-commit
4. **Design gate** — UX-fixes altijd via het design system, escaleer naar ux-designer bij twijfel

## Gerelateerde skills

- `/health-check` — infrastructuur-gezondheid (services, DNS, SSL)
- `/ci-status` — CI pipeline status
- `/validatie` — teamindeling-specifieke regelvalidatie
- `/e2e-testing` — E2E tests schrijven en draaien
- `/security` — OWASP Top 10 + STRIDE security audit (Next.js + Prisma + NextAuth)
