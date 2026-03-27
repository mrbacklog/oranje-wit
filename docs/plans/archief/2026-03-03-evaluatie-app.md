# Evaluatie-app — Overnemen in de monorepo

**Datum**: 2026-03-03
**Status**: Beslissingen genomen — klaar voor bouw
**Bron**: Lovable app `antjanlaban/oranje-wit-evaluate` (Supabase)

---

## Doel

De evaluatie-functionaliteit uit de Lovable/Supabase app overnemen als `apps/evaluatie/` in de monorepo. Geen 1:1 migratie maar cherry-picken wat werkt, verbeteren waar nodig, en skippen wat overbodig is.

### Kernverbeteringen t.o.v. Lovable

1. **rel_code als sleutel** — spelers direct koppelen via `rel_code`, geen naam-matching meer
2. **Bestaande data benutten** — teams, spelers, staf komen uit de database (geen CSV-import nodig!)
3. **Coördinatoren als nieuwe laag** — N:N koppeling aan seizoensteams
4. **E-mail via Google Workspace** — `noreply@ckvoranjewit.app` i.p.v. Resend
5. **Eén auth-systeem** — NextAuth v5 + magic links voor trainers

---

## Wat we overnemen, verbeteren en skippen

### Overnemen (de logica werkt)
- Evaluatieronde-concept: aanmaken, deadline, status-tracking
- Trainer-evaluatieformulier: Oranje Draad scores + individuele spelerbeoordeling
- Spelerszelfevaluatie: apart formulier met andere vragen
- Token-gebaseerde toegang voor trainers, coördinatoren en spelers
- E-mail templates (uitnodiging, herinnering, bevestiging) — beheerbaar in database door admin
- Coördinator-memo per evaluatie

### Verbeteren
- **Speler-identificatie**: rel_code i.p.v. naam → geen matching-fouten meer
- **Team-samenstelling**: uit `competitie_spelers` + `leden` (actueel seizoen) i.p.v. CSV-upload
- **Staf-koppeling**: uit bestaande `Staf` tabel i.p.v. handmatig invoeren
- **Scoreschalen**: correct per criterium (niveau 1-5, inzet 1-3, groei 1-4)
- **Coördinatoren**: structureel als personen gekoppeld aan seizoensteams (N:N)

### Skippen
- Supabase Auth → vervangen door NextAuth v5 (TC) + token-links (trainers/coördinatoren/spelers)
- OTP-verificatie → niet nodig, token-link is voldoende
- Supabase RLS → vervangen door API-route middleware
- Resend → vervangen door Nodemailer + Google Workspace SMTP
- CSV-import in de evaluatie-app → data komt uit bestaande database
- `manual_players` (handmatig toegevoegde spelers) → alle spelers zitten al in `leden`
- `login_link_requests` rate limiting → standaard rate limiting op API routes
- Lovable-specifieke demo-modus
- Snapshot-tabellen → teamsamenstelling verandert niet midden in een ronde
- Spelerszelfevaluatie via e-mail voor jeugdleden → jeugd doet geen zelfevaluatie via mail

---

## Database-ontwerp

### Nieuwe modellen

```prisma
// ============================================================
// EVALUATIE-RONDE
// ============================================================
model EvaluatieRonde {
  id        String   @id @default(cuid())
  seizoen   String                          // "2025-2026"
  ronde     Int                             // 1, 2, ...
  naam      String                          // "Evaluatieronde 1"
  type      String   @default("trainer")    // "trainer" | "speler"
  deadline  DateTime @db.Timestamptz(6)
  status    String   @default("concept")    // concept → actief → gesloten

  createdAt DateTime @default(now())
  updatedAt DateTime @default(now()) @updatedAt

  uitnodigingen EvaluatieUitnodiging[]
  evaluaties    Evaluatie[]

  @@unique([seizoen, ronde, type])
  @@map("evaluatie_rondes")
}

// ============================================================
// COORDINATOR — persoon (naam + email) gekoppeld aan seizoensteams
// ============================================================
model Coordinator {
  id    String @id @default(cuid())
  naam  String
  email String @unique

  teams CoordinatorTeam[]

  createdAt DateTime @default(now())

  @@map("coordinatoren")
}

model CoordinatorTeam {
  id            String      @id @default(cuid())
  coordinatorId String
  coordinator   Coordinator @relation(fields: [coordinatorId], references: [id])
  teamId        String
  team          OWTeam      @relation(fields: [teamId], references: [id])
  seizoen       String                      // seizoen waarin deze koppeling geldt

  @@unique([coordinatorId, teamId, seizoen])
  @@map("coordinator_teams")
}

// ============================================================
// UITNODIGING — token-gebaseerde toegang voor trainers/spelers
// ============================================================
model EvaluatieUitnodiging {
  id       String @id @default(cuid())
  rondeId  String
  ronde    EvaluatieRonde @relation(fields: [rondeId], references: [id])

  // Wie wordt uitgenodigd
  type     String                           // "trainer" | "speler"
  email    String
  naam     String

  // Voor trainers: welk team
  teamId   String?
  team     OWTeam? @relation(fields: [teamId], references: [id])

  // Voor spelers: welke speler
  spelerId String?

  // Token & verificatie
  token            String   @unique @default(cuid())
  verificatieCode  String?
  verificatieGeldigTot DateTime? @db.Timestamptz(6)
  laatstGeverifieerd    DateTime? @db.Timestamptz(6)

  // Status
  emailVerstuurd   DateTime? @db.Timestamptz(6)
  reminderVerstuurd DateTime? @db.Timestamptz(6)
  reminderAantal   Int      @default(0)

  createdAt DateTime @default(now())

  @@unique([rondeId, email, teamId])
  @@map("evaluatie_uitnodigingen")
}
```

### Bestaand model uitbreiden: `Evaluatie`

```prisma
model Evaluatie {
  id       String @id @default(cuid())
  speler   Speler @relation(fields: [spelerId], references: [id])
  spelerId String
  seizoen  String
  ronde    Int    @default(1)
  type     String @default("trainer")       // "trainer" | "speler"

  // Bestaand
  scores    Json                             // EvaluatieScore (individueel + Oranje Draad)
  opmerking String? @db.Text
  coach     String?
  teamNaam  String? @map("team_naam")

  // Nieuw
  rondeId          String?                   // optionele FK naar EvaluatieRonde
  evaluatieRonde   EvaluatieRonde? @relation(fields: [rondeId], references: [id])
  coordinatorMemo  String? @map("coordinator_memo") @db.Text
  ingediendOp      DateTime? @db.Timestamptz(6)
  status           String   @default("concept") // concept | ingediend

  createdAt DateTime @default(now())
  updatedAt DateTime @default(now()) @updatedAt

  @@unique([spelerId, seizoen, ronde, type])
  @@index([seizoen])
  @@index([seizoen, ronde])
  @@index([type])
  @@index([rondeId])
}
```

### Nieuw model: `SpelerZelfEvaluatie`

De spelerszelfevaluatie heeft een **compleet andere structuur** dan de trainersevaluatie — apart model is logischer dan alles in één `scores` JSON te proppen.

```prisma
model SpelerZelfEvaluatie {
  id       String @id @default(cuid())
  spelerId String
  speler   Speler @relation(fields: [spelerId], references: [id])
  seizoen  String
  ronde    Int    @default(1)
  rondeId  String?

  // Plezier & Sfeer (elk 1-5)
  plezierKorfbal    Int?                    // "Ik heb plezier in het korfballen"
  plezierTeam       Int?                    // "Ik voel me thuis in mijn team"
  plezierUitdaging  Int?                    // "Ik word voldoende uitgedaagd"
  plezierToelichting String? @db.Text

  // Trainingen & Wedstrijden (elk 1-5)
  trainingZin       Int?                    // "Ik heb zin in trainen"
  trainingKwaliteit Int?                    // "De trainingen zijn goed"
  wedstrijdBeleving Int?                    // "Ik geniet van wedstrijden"
  trainingVerbetering Int?                  // "Ik merk dat ik beter word"
  trainingToelichting String? @db.Text

  // Toekomst
  toekomstIntentie  String?                 // "stop" | "unsure" | "continue"
  toekomstAmbitie   String?                 // "higher" | "same" | "lower"
  toekomstToelichting String? @db.Text

  // Algemeen
  algemeenOpmerking String? @db.Text

  // Meta
  coordinatorMemo   String? @db.Text
  status            String  @default("concept") // concept | ingediend
  ingediendOp       DateTime? @db.Timestamptz(6)

  createdAt DateTime @default(now())
  updatedAt DateTime @default(now()) @updatedAt

  @@unique([spelerId, seizoen, ronde])
  @@map("speler_zelf_evaluaties")
}
```

### Relatie toevoegen aan `OWTeam`

```prisma
model OWTeam {
  // ... bestaande velden ...
  coordinatoren  CoordinatorTeam[]
  uitnodigingen  EvaluatieUitnodiging[]
}
```

---

## Scoreschalen (correct uit Lovable broncode)

| Criterium | Schaal | Labels |
|---|---|---|
| Niveau | 1–5 sterren | (geen labels, puur numeriek) |
| Inzet | 1–3 sterren | Minder / Normaal / Meer |
| Groei | 1–4 | Geen / Weinig / Normaal / Veel |
| Oranje Draad (plezier/ontwikkeling/prestatie) | 1–5 sterren + vrije tekst | Per team |
| Zelfevaluatie vragen | 1–5 | Per vraag |

**Fix nodig**: `EvaluatieScores.tsx` gebruikt `MAX_SCORE = 4` voor alles. Dit moet per criterium:
- Niveau: max 5
- Inzet: max 3
- Groei: max 4
- Oranje Draad: max 5

---

## Auth-strategie

### TC-leden (admin)
Ongewijzigd: Google OAuth via NextAuth v5, allowlist in `packages/auth/`.

### Coördinatoren
Token-link per e-mail (geen account nodig):
1. Admin koppelt coördinator aan teams → systeem stuurt e-mail met link
2. Link: `/evaluatie/coordinator?token=<token>`
3. Coördinator klikt link → direct toegang tot eigen teams

### Trainers
Token-gebaseerde toegang (geen account nodig, geen OTP):
1. Admin start ronde → systeem stuurt uitnodiging per e-mail
2. E-mail bevat link: `/evaluatie/invullen?token=<token>`
3. Trainer klikt link → direct toegang tot evaluatieformulier voor eigen team

### Spelers (zelfevaluatie)
Token-gebaseerde toegang:
1. Admin start spelersronde → systeem stuurt uitnodiging
2. Link: `/evaluatie/zelf?token=<token>`
3. Speler klikt link → direct toegang (formulier is anoniem voor trainers)

**Let op**: Zelfevaluatie via e-mail geldt alleen voor senioren/oudere jeugd. Jeugdleden doen geen zelfevaluatie via de mail.

---

## E-mail via Google Workspace

```
Provider:     Google Workspace SMTP (smtp.gmail.com:587)
Afzender:     noreply@ckvoranjewit.app
Library:      Nodemailer (of React Email + Nodemailer)
Templates:    In database (beheerbaar door admin) of als React componenten
```

### E-mails die verstuurd worden

| Type | Wanneer | Ontvanger |
|---|---|---|
| Trainer uitnodiging | Admin activeert ronde | Trainers per team |
| Trainer herinnering | Admin of automatisch bij naderende deadline | Trainers die nog niet hebben ingeleverd |
| Trainer bevestiging | Na indienen evaluatie | De trainer zelf |
| Verificatiecode | Bij eerste bezoek of na 72u | Trainer |
| Coördinator notificatie | Na indienen evaluatie door trainer | Coördinator van dat team |
| Speler uitnodiging | Admin activeert spelersronde | Spelers (e-mail uit `leden`) |
| Speler herinnering | Automatisch bij naderende deadline | Spelers die nog niet hebben ingevuld |

---

## Slim gebruik van bestaande data

### Ronde samenstellen (de sleutel)

Een evaluatieronde wordt gestart **binnen het huidige seizoen**. Bij het aanmaken:

1. **Seizoen** → `HUIDIG_SEIZOEN` uit `@oranje-wit/types`
2. **Teams** → `OWTeam` records voor dat seizoen (al in de database)
3. **Spelers per team** → `competitie_spelers` WHERE seizoen = huidig EN team = X
   - Direct met `rel_code` gekoppeld aan `leden` (naam, e-mail, geslacht)
   - Geen CSV-import nodig!
4. **Staf per team** → `Staf` tabel (trainers met e-mailadres)
5. **Coördinatoren** → `Coordinator` + `CoordinatorTeam` (N:N met seizoensteams)

### Wat de Lovable-app via CSV-import deed, halen wij uit de database

| Lovable (CSV upload) | Monorepo (database query) |
|---|---|
| Teams uit Sportlink export | `OWTeam` WHERE seizoen = huidig |
| Spelers per team | `competitie_spelers` JOIN `leden` |
| Staf per team | `Staf` WHERE team in geselecteerde teams |
| Geslacht | `leden.geslacht` of `competitie_spelers.geslacht` |
| rel_code | Direct beschikbaar — IS de primaire sleutel |

### Snapshot-concept: niet overnemen

De Lovable-app maakt onveranderlijke snapshots van teamsamenstelling. Dit is niet nodig in de monorepo — de teamsamenstelling in `competitie_spelers` verandert niet midden in een evaluatieronde. De evaluatie verwijst direct naar de actuele data.

---

## App-structuur

```
apps/evaluatie/                     # Nieuwe Next.js app
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Basis layout
│   │   ├── page.tsx                # Landing/login
│   │   ├── login/                  # NextAuth login (TC-leden + coordinatoren)
│   │   │
│   │   ├── admin/                  # TC-leden (EDITOR rol)
│   │   │   ├── rondes/             # Overzicht rondes
│   │   │   ├── rondes/nieuw/       # Nieuwe ronde aanmaken
│   │   │   ├── rondes/[id]/        # Ronde beheren (uitnodigen, status, resultaten)
│   │   │   └── coordinatoren/      # Coördinatoren beheren
│   │   │
│   │   ├── coordinator/            # Coördinator-portaal
│   │   │   ├── page.tsx            # Dashboard: mijn teams + rondes
│   │   │   └── [rondeId]/[teamId]/ # Evaluaties bekijken + memo toevoegen
│   │   │
│   │   ├── invullen/               # Trainer-evaluatieformulier (token-based)
│   │   │   └── page.tsx            # ?token=... → verificatie → formulier
│   │   │
│   │   ├── zelf/                   # Spelerszelfevaluatie (token-based)
│   │   │   └── page.tsx            # ?token=... → formulier (geen verificatie)
│   │   │
│   │   └── api/
│   │       ├── rondes/             # CRUD evaluatierondes
│   │       ├── uitnodigingen/      # Uitnodigingen versturen
│   │       ├── evaluaties/         # Evaluaties opslaan/ophalen
│   │       ├── verificatie/        # OTP genereren/valideren
│   │       └── email/              # E-mail verzenden
│   │
│   ├── components/
│   │   ├── TrainerEvaluatieForm.tsx
│   │   ├── SpelerZelfEvaluatieForm.tsx
│   │   ├── RondeOverzicht.tsx
│   │   ├── TeamEvaluatieStatus.tsx
│   │   └── VerificatieGate.tsx
│   │
│   └── lib/
│       ├── mail.ts                 # Nodemailer + Google Workspace SMTP
│       └── tokens.ts               # Token generatie + OTP logica
│
├── Dockerfile
└── package.json
```

---

## Deployment

- **Railway**: nieuwe service `evaluatie` in project `oranje-wit-db`
- **Custom domein**: `evaluatie.ckvoranjewit.app` (via Cloudflare Worker proxy)
- **Database**: zelfde Railway PostgreSQL (intern netwerk)
- **Auth**: zelfde `AUTH_SECRET` + `AUTH_GOOGLE_*` env vars
- **SMTP**: `SMTP_USER=noreply@ckvoranjewit.app`, `SMTP_PASS=<app-wachtwoord>`

---

## Bouwvolgorde

### Fase 1: Database & basis (fundament)
1. Prisma schema uitbreiden (EvaluatieRonde, Coordinator, CoordinatorTeam, EvaluatieUitnodiging, SpelerZelfEvaluatie)
2. Bestaand `Evaluatie` model uitbreiden (rondeId, coordinatorMemo, status, ingediendOp)
3. Fix `EvaluatieScores.tsx` MAX_SCORE per criterium
4. Next.js app scaffolden (`apps/evaluatie/`)

### Fase 2: Admin-portaal (TC-leden)
5. Admin: rondes aanmaken (seizoen + type + deadline)
6. Admin: teams selecteren → spelers en staf automatisch uit database laden
7. Admin: coördinatoren beheren en koppelen aan teams
8. Admin: uitnodigingen versturen (e-mail)
9. Admin: ronde-status dashboard (wie heeft ingeleverd?)

### Fase 3: Trainer-evaluatie
10. E-mail systeem: Nodemailer + Google Workspace SMTP
11. Token + OTP verificatie
12. Evaluatieformulier: Oranje Draad scores + individuele spelerbeoordelingen
13. Bevestigingsmail na indienen
14. Coördinator-notificatie na indienen

### Fase 4: Coördinator-portaal
15. Coördinator login (Google OAuth of magic link)
16. Dashboard: overzicht rondes + teams
17. Evaluaties inzien + coördinator-memo toevoegen

### Fase 5: Spelerszelfevaluatie
18. Uitnodigingen versturen naar spelers (e-mail uit `leden`)
19. Zelfevaluatieformulier (11 vragen + toekomst)
20. Resultaten zichtbaar voor coördinator (anoniem voor trainers)

### Fase 6: Integratie
21. Evaluatieresultaten tonen in Team-Indeling app (al deels werkend via SpelerDetail)
22. Oude import-script (`pnpm import:evaluaties`) uitfaseren
23. Railway deployment + Cloudflare proxy
24. Lovable-app archiveren

---

## Beslissingen (2026-03-03)

| Vraag | Beslissing |
|---|---|
| Coördinator-auth | Token-link per e-mail (geen Google OAuth) |
| OTP-verificatie | Niet nodig — token-link is voldoende |
| E-mail templates | In database, bewerkbaar door admin via UI |
| Snapshot teamsamenstelling | Niet nodig — data verandert niet midden in een ronde |
| Speler e-mail (jeugd) | Jeugdleden doen geen zelfevaluatie via mail |
| Automatische reminders | Nee — handmatige actie door admin |
| Bestaande evaluaties | Blijven staan met `ronde = 1`, `rondeId = null` |
