---
paths:
  - "apps/web/src/app/(teamindeling)/**"
  - "apps/web/src/app/(teamindeling-studio)/**"
  - "apps/web/src/components/teamindeling/**"
---

# Teamindeling — Desktop/Mobile scheiding

De Team-Indeling bestaat uit twee functioneel gescheiden versies:

## Twee route groups

| | Mobile | Desktop (Studio) |
|---|---|---|
| Route group | `(teamindeling)` | `(teamindeling-studio)` |
| URL | `/teamindeling/*` | `/ti-studio/*` |
| Thema | Dark | Light (wordt dark) |
| Focus | Bekijken, reviewen, communiceren | Maken, bewerken, drag & drop |

## Regels voor agents

1. **Werk in `(teamindeling)` of `components/teamindeling/mobile/`** → mobile versie
2. **Werk in `(teamindeling-studio)` of `components/teamindeling/studio/`** → desktop versie
3. **Werk in `src/lib/teamindeling/` of `components/teamindeling/shared/`** → gedeelde laag
4. Mobile bevat **nooit** drag & drop of scenario-editing
5. Studio bevat **nooit** mobile-specifieke componenten
6. Prisma queries en server actions staan in `src/lib/teamindeling/`, nooit in pagina-bestanden
7. API routes onder `/api/teamindeling/` worden door beide versies gebruikt

## Componentlocaties

```
components/teamindeling/
├── mobile/          # Mobile-only (MobileShell, etc.)
├── studio/          # Desktop-only (toekomstig)
├── shared/          # Gedeeld
└── (overige mappen) # Legacy studio-componenten
```

## Gedeelde data-laag

```
src/lib/teamindeling/
├── db/              # Prisma client en queries
├── validatie/       # KNKV-regelvalidatie
├── seizoen.ts       # Seizoen-logica
├── auth.ts          # Auth helpers
└── ...
```

Beide versies importeren uit `src/lib/teamindeling/`. Data-logica wordt nooit in pagina-bestanden geschreven.
