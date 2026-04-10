# apps/web/src/app/api — API routes

## Verplichte volgorde in elke route handler
1. `guardTC()` als eerste check — returnt `Result<User, Response>`, geen throw
2. Body parsen via `parseBody(schema, request)` uit `@/lib/api` met Zod schema
3. Domeinlogica in try/catch
4. Responses via `ok(data)` of `fail(error, status?)` uit `@/lib/api`

## Regels
- Geen throws in route handlers — vang alles op met `fail(error)`
- Altijd JSON responses, nooit plain text
- Geen lege catch blocks — altijd loggen met `logger.warn("context:", error)`
- `rel_code` is enige stabiele speler-identifier, nooit naam-matching

## Structuur (globale map)
```
api/
  teamindeling/   # TI-versies, scenario's, plaatsingen
  monitor/        # Ledendata, dashboards
  evaluatie/      # Evaluatie imports en queries
  ti-studio/      # TI Studio streaming endpoints
  health/         # Health checks
```

## Voorbeeld patroon
```ts
export async function POST(req: Request) {
  const guard = await guardTC();
  if (!guard.ok) return guard.error;
  const body = await parseBody(MySchema, req);
  if (!body.ok) return fail(body.error, 400);
  try {
    const result = await doDomainLogic(body.data);
    return ok(result);
  } catch (error) {
    logger.warn("api/mijn-route:", error);
    return fail(error);
  }
}
```
