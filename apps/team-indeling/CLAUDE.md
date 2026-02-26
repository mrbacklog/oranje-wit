# Team-Indeling Tool — c.k.v. Oranje Wit

Intelligente tool voor het samenstellen van teamindelingen per seizoen.

## Stack
- **Framework**: Next.js 16 (TypeScript)
- **Styling**: Tailwind CSS 4
- **Database**: @oranje-wit/database (Prisma, gedeeld package)
- **AI**: Claude API (Anthropic SDK)
- **Drag-and-drop**: @dnd-kit
- **Auth**: NextAuth.js (nog niet actief)

## Procesmodel

```
① BLAUWDRUK — regels, kaders, speerpunten, gepinde feiten
      ↓
② CONCEPTEN — uitgangsprincipes, keuzes, niet-gepinde aannames
      ↓
③ SCENARIO'S — concrete teamindelingen, drag-drop, validatie
      ↓
④ DEFINITIEF — gekozen scenario, besluitenlog, communicatie
```

## Pin-systeem
- **Gepind** = bevestigd feit → geldt voor ALLE concepten en scenario's
- **Niet-gepind** = aanname → kan per concept/scenario verschillen
- Types: SPELER_STATUS, SPELER_POSITIE, STAF_POSITIE

## Spelerstatus
- ✓ Beschikbaar (groen) — standaard
- ? Twijfelt (oranje) — onzeker
- ✕ Gaat stoppen (rood) — verwachte uitstroom
- + Nieuw (blauw) — nieuwe aanmelding

## Import

Data komt uit de Verenigingsmonitor via export-JSON:
- Bron: `data/export/export-YYYY-YYYY.json`
- Script: `scripts/import/import-data.ts`
- Logica: `src/lib/import.ts`
- Commando: `pnpm import`

Evaluaties komen uit de Lovable evaluatie-app:
- Bron: `data/evaluaties/*.json`
- Script: `scripts/import/import-evaluaties.ts`
- Commando: `pnpm import:evaluaties`

## Business Logic

| Bestand | Doel |
|---|---|
| `src/lib/import.ts` | Import: upsert spelers/staf, referentieteams, blauwdruk |
| `src/lib/validatie/regels.ts` | Validatie-engine: KNKV hard rules, OW soft rules |
| `src/lib/validatie/impact.ts` | Impact-analyse: best/expected/worst case |
| `src/lib/db/prisma.ts` | Re-export van @oranje-wit/database |
