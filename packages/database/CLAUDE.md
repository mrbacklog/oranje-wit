# packages/database — Prisma + PostgreSQL

## Source of truth
`prisma/schema.prisma` is de enige bron voor het datamodel.
Wijzigingen in het schema altijd via migraties, nooit via push.

## Verplichte regels
- **NOOIT** `pnpm db:push` — dropt de VIEW `speler_seizoenen` (onomkeerbaar)
- Migraties: `pnpm db:migrate` (development) of `pnpm db:migrate:deploy` (productie)
- Na elke migratie: `pnpm db:ensure-views` draaien om VIEW te herstellen

## VIEW speler_seizoenen
- Staat in `prisma/views.sql` — buiten Prisma beheerd
- Bevat korfballeeftijd, categorie, team per speler per seizoen
- Mag NOOIT worden gedropt — zie `rules/database.md`

## Speler-identifier
- `rel_code` (Sportlink relatienummer) = enige stabiele identifier
- Nooit naam-matching, nooit email-matching
- `rel_code` = `Speler.id` in het schema

## Migratie workflow
```
# Development
pnpm db:migrate        # Nieuwe migratie aanmaken
pnpm db:ensure-views   # VIEW herstellen na migratie

# Productie
pnpm db:migrate:deploy # Pending migraties draaien + VIEW herstellen
```

## Scripts
Hulpscripts in `packages/database/scripts/` voor seeding en VIEW-herstel.
Detail over alle 61 modellen: zie `rules/database.md`.
