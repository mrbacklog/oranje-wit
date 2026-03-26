# Database Migraties — Prisma Migrate

## Waarom migraties?

De database bevat een VIEW `speler_seizoenen` die niet in het Prisma schema staat.
`prisma db push` dropt ALLE objecten die Prisma niet kent, inclusief deze VIEW.
Dat is destructief en onherstelbaar zonder backup.

Met Prisma Migrate hebben we volledige controle over de SQL die uitgevoerd wordt.
Elke wijziging wordt als migratie-bestand opgeslagen in versiebeheer.

## Belangrijke regel

**NOOIT `pnpm db:push` gebruiken.** Het commando is geblokkeerd en geeft een foutmelding.

## Hoe het werkt

### Nieuwe migratie maken (development)

```bash
# Vanuit de root:
pnpm db:migrate

# Of vanuit packages/database:
pnpm migrate:dev
```

Dit draait `prisma migrate dev` dat:
1. Het schema vergelijkt met de database
2. Een SQL-migratie genereert
3. De migratie uitvoert op je development database
4. De Prisma client opnieuw genereert

**Controleer altijd de gegenereerde SQL** in `prisma/migrations/<timestamp>/migration.sql` voordat je commit. Prisma kan ongewenste DROP-statements genereren.

### Migratie uitvoeren op productie

```bash
# Vanuit de root:
pnpm db:migrate:deploy

# Of vanuit packages/database:
pnpm migrate:deploy
```

Dit is een wrapper die:
1. `prisma migrate deploy` draait (alle pending migraties)
2. Controleert of de VIEW `speler_seizoenen` nog bestaat
3. De VIEW herstelt als die verdwenen is

### Status controleren

```bash
# Vanuit de root:
pnpm db:migrate:status

# Of vanuit packages/database:
pnpm migrate:status
```

### VIEW handmatig controleren/herstellen

```bash
# Vanuit de root:
pnpm db:ensure-views

# Of vanuit packages/database:
pnpm ensure-views
```

## Bestanden

```
packages/database/
├── prisma/
│   ├── schema.prisma              # Prisma schema (source of truth voor tabellen)
│   ├── views.sql                  # VIEW-definities (source of truth voor views)
│   └── migrations/
│       ├── migration_lock.toml    # Provider lock (postgresql)
│       └── 0_init/
│           └── migration.sql      # Baseline: alle bestaande tabellen
├── migrations/                    # Legacy handmatige migraties (alleen referentie)
│   ├── 2026-03-03-evaluatie-modellen.sql
│   ├── 2026-03-11-rename-notitie-to-werkitem.sql
│   └── 2026-03-12-scenario-soft-delete.sql
├── scripts/
│   ├── ensure-views.ts            # VIEW controleren en herstellen
│   └── migrate-deploy.ts          # Productie-migratie wrapper
└── prisma.config.ts               # Prisma 7 configuratie
```

## De VIEW speler_seizoenen

De VIEW wordt NIET beheerd door Prisma. De definitie staat in `prisma/views.sql`:

```sql
CREATE OR REPLACE VIEW speler_seizoenen AS
SELECT DISTINCT ON (cp.rel_code, cp.seizoen)
  cp.rel_code, cp.seizoen, cp.team, cp.competitie, cp.geslacht
FROM competitie_spelers cp
ORDER BY cp.rel_code, cp.seizoen,
  CASE cp.competitie
    WHEN 'veld_najaar'  THEN 1
    WHEN 'zaal'         THEN 2
    WHEN 'veld_voorjaar' THEN 3
    ELSE 4
  END;
```

De VIEW geeft per speler per seizoen de "primaire" teamtoewijzing (veld-najaar heeft prioriteit boven zaal en veld-voorjaar).

### Bescherming

1. `db:push` is geblokkeerd
2. De ontwikkelaar-agent heeft een pre-tool hook die `db:push` blokkeert
3. `migrate-deploy.ts` controleert en herstelt de VIEW na elke migratie
4. `ensure-views.ts` kan altijd handmatig gedraaid worden als vangnet

## Baselining (eenmalig)

De database bestond al voordat Prisma Migrate was opgezet. De baseline migratie
(`0_init/migration.sql`) bevat de volledige schemageneratie maar is NIET uitgevoerd.

Om Prisma te vertellen dat de baseline al is toegepast, voer je eenmalig uit:

```bash
cd packages/database
npx prisma migrate resolve --applied 0_init
```

Dit schrijft een record naar de `_prisma_migrations` tabel in de database die zegt:
"deze migratie is al uitgevoerd, sla hem over."

**Doe dit voordat je de eerste echte migratie maakt.**

## Workflow voor schema-wijzigingen

1. Wijzig `prisma/schema.prisma`
2. Draai `pnpm db:migrate` — Prisma genereert een migratie
3. Controleer de SQL in de gegenereerde migratie
4. Test lokaal
5. Commit het migratie-bestand
6. Op productie: `pnpm db:migrate:deploy`

## Railway (productie) deployment

De Dockerfiles voor de apps moeten `prisma migrate deploy` draaien bij startup.
Het alternatief is `pnpm db:migrate:deploy` handmatig draaien na elke deploy.

Voor nu is het handmatig. Automatisering kan later worden toegevoegd in het
build-script of als pre-start hook.
