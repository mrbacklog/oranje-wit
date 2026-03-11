# Team-Indeling — API Routes

Referentie voor alle API endpoints in `apps/team-indeling/src/app/api/`.

---

## Patroon

Alle API routes volgen hetzelfde patroon:

- **Responses** via `ok(data)` en `fail(message, status, code)` uit `src/lib/api/response.ts`
- **Validatie** via `parseBody(request, zodSchema)` uit `src/lib/api/validate.ts` (Zod)
- **Auth** via `requireEditor()` of `requireAuth()` uit `src/lib/auth-check.ts`
- **Foutafhandeling** met try/catch, fouten gelogd via `logger.error()`

### Response formaat

Succesvol:
```json
{ "ok": true, "data": { ... } }
```

Fout:
```json
{ "ok": false, "error": { "code": "VALIDATION_ERROR", "message": "..." } }
```

---

## Routes

### Auth

| Method | Pad | Doel | Auth |
|---|---|---|---|
| GET/POST | `/api/auth/[...nextauth]` | NextAuth v5 handlers (login, callback, signout) | Geen |

### Seizoen

| Method | Pad | Doel | Auth |
|---|---|---|---|
| POST | `/api/seizoen` | Actief seizoen instellen (cookie) | Geen |

### Import & Leden-sync

| Method | Pad | Doel | Auth |
|---|---|---|---|
| POST | `/api/import` | Data-import vanuit Sportlink export-JSON (spelers, staf, teams) | Geen |
| POST | `/api/leden-sync/preview` | CSV uploaden en diff berekenen (nieuwe/vertrokken leden) | EDITOR |
| POST | `/api/leden-sync/verwerk` | Diff doorvoeren: spelers aanmaken/archiveren, werkitems aanmaken | EDITOR |

### Foto

| Method | Pad | Doel | Auth |
|---|---|---|---|
| GET | `/api/foto/[id]` | Spelerfoto serveren als webp (1 uur cache) | Geen |

### Spelers

| Method | Pad | Doel | Auth |
|---|---|---|---|
| GET | `/api/spelers/[id]/evaluaties` | Evaluatiescores ophalen (trainer-type), optioneel teamgemiddelde | Geen |
| PATCH | `/api/spelers/[id]/rating` | Handmatige rating instellen (0-300) | Geen |

### Ratings

| Method | Pad | Doel | Auth |
|---|---|---|---|
| POST | `/api/ratings/batch` | Meerdere spelerratings in batch instellen | Geen |
| POST | `/api/ratings/herbereken` | Alle ratings herberekenen op basis van evaluaties + teamscore | Geen |
| POST | `/api/ratings/preview` | Preview rating-berekening voor een specifiek team + teamscore | Geen |

### Referentie-teams

| Method | Pad | Doel | Auth |
|---|---|---|---|
| GET | `/api/referentie-teams` | Alle referentie-teams ophalen (huidig seizoen) | Geen |
| PATCH | `/api/referentie-teams/[id]/teamscore` | Teamscore bijwerken voor een referentie-team | Geen |
| GET | `/api/referentie-teams/[id]/spelers` | Spelers van een referentie-team ophalen met evaluatie + rating | Geen |
| POST | `/api/referentie-teams/ververs` | Referentie-teams opnieuw genereren, met keuze behoud/reset teamscores | Geen |

### Scenarios

| Method | Pad | Doel | Auth |
|---|---|---|---|
| GET | `/api/scenarios/[id]/teams` | Alle teams + selectiegroepen + spelers + staf van een scenario ophalen | Geen |
| POST | `/api/scenarios/[id]/batch-plaats` | Meerdere spelers in batch in een team plaatsen (met filters) | Geen |
| POST | `/api/scenarios/[id]/teamscore-sync` | Teamscores synchroniseren op basis van spelerratings | Geen |

---

## Opmerkingen

- De meeste routes hebben momenteel geen expliciete auth-check. Alleen `leden-sync` routes gebruiken `requireEditor()`. De app is wel beschermd door NextAuth middleware op routing-niveau.
- De `ok()`/`fail()` helpers zetten `Cache-Control: no-store` om caching te voorkomen.
- Zod schemas zijn inline gedefinieerd per route-bestand.
- Foto-endpoint retourneert direct een `NextResponse` met binary webp data (geen JSON wrapper).
