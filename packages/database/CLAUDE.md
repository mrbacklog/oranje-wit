# Database Package — @oranje-wit/database

Prisma schema + client voor de PostgreSQL database op Railway.

## Source of Truth
`packages/database/prisma/schema.prisma` is de ENIGE source of truth voor het datamodel.

## Commando's
| Commando | Wanneer |
|---|---|
| `pnpm db:generate` | Na schema-wijziging — genereert Prisma client |
| `pnpm db:migrate` | Nieuwe migratie aanmaken (development) |
| `pnpm db:migrate:deploy` | Pending migraties draaien + VIEW herstellen (productie) |
| `pnpm db:migrate:status` | Migratiestatus bekijken |
| `pnpm db:ensure-views` | VIEW speler_seizoenen controleren/herstellen |

## VERBODEN
- **NOOIT `pnpm db:push`** — dropt de VIEW `speler_seizoenen` permanent
- **NOOIT `npx prisma db push`** — zelfde probleem

## VIEW speler_seizoenen
Deze VIEW aggregeert spelershistorie over alle seizoenen. Wordt hersteld door `db:migrate:deploy`. Als de VIEW mist: `pnpm db:ensure-views`.

## Identifier-regel
`rel_code` (Sportlink relatienummer) is de ENIGE stabiele identifier voor leden en spelers. Gebruik NOOIT naam-matching — namen zijn niet uniek en veranderen.

## Modellen
61 Prisma-modellen in twee groepen:
- **Monitor** (snake_case via `@@map`): Lid, Seizoen, CompetitieSpeler, LidFoto, OWTeam, OWTeamType, etc.
- **TI** (PascalCase): Speler, Team, Scenario, Versie, Kader, etc.

Details: `rules/database.md`
