---
name: sportlink
description: Sportlink clubweb API integratie. Keycloak PKCE auth, Navajo backend, leden ophalen en synchroniseren. Gebruik bij elke vraag over Sportlink data, ledenlijst, aanmeldingen of afmeldingen.
user-invocable: true
allowed-tools: Read, Write, Glob, Grep, Bash
argument-hint: "[optioneel: 'sync' voor directe sync, 'api' voor API-referentie]"
---

# Skill: Sportlink

## Doel
Programmatische toegang tot Sportlink ledendata via de clubweb.sportlink.com Navajo API. Gebruikt Keycloak PKCE auth met gebruikerscredentials (eenmalig per sessie).

## Architectuur

```
Gebruiker → TI Studio /sportlink pagina
  → POST /api/sportlink/sync { email, password }
  → Server: Keycloak login (fetch) → Navajo token → SearchMembers
  → Server: diff met DB (rel_code match + fuzzy naam)
  → Response: { nieuwe[], afgemeld[], fuzzyMatches[] }
  → Gebruiker selecteert → POST /api/sportlink/apply
```

## Auth Flow (pure fetch, geen Playwright)

### Stap 1: Keycloak PKCE Auth Page

```typescript
const codeVerifier = crypto.randomBytes(32).toString('base64url');
const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

const authUrl = 'https://idm.sportlink.com/realms/sportlink/protocol/openid-connect/auth?' +
  new URLSearchParams({
    client_id: 'sportlink-club-web',
    redirect_uri: 'https://clubweb.sportlink.com',
    response_type: 'code',
    scope: 'openid',
    state: crypto.randomBytes(16).toString('hex'),
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

const r = await fetch(authUrl, { redirect: 'manual' });
const html = await r.text();
const cookies = r.headers.getSetCookie() || [];
const cookieStr = cookies.map(c => c.split(';')[0]).join('; ');
const formAction = html.match(/action="([^"]+)"/)[1].replace(/&amp;/g, '&');
```

### Stap 2: POST Credentials

```typescript
const r2 = await fetch(formAction, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': cookieStr },
  body: new URLSearchParams({ username: email, password }),
  redirect: 'manual',
});
// Status 200 = OTP pagina (optioneel), of error
```

### Stap 3: Skip Optional OTP

```typescript
const html2 = await r2.text();
const otpAction = html2.match(/action="([^"]+)"/)[1].replace(/&amp;/g, '&');
const allCookies = [...cookies, ...(r2.headers.getSetCookie() || [])]
  .map(c => c.split(';')[0]).join('; ');

const r3 = await fetch(otpAction, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': allCookies },
  body: new URLSearchParams({}),
  redirect: 'manual',
});
// Status 302 → redirect met ?code=...
const redirectUrl = new URL(r3.headers.get('location'));
const authCode = redirectUrl.searchParams.get('code');
```

### Stap 4: Token Exchange

```typescript
const tokenRes = await fetch(
  'https://idm.sportlink.com/realms/sportlink/protocol/openid-connect/token',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: 'sportlink-club-web',
      code: authCode,
      redirect_uri: 'https://clubweb.sportlink.com',
      code_verifier: codeVerifier,
    }),
  }
);
const { access_token } = await tokenRes.json(); // Keycloak JWT
```

### Stap 5: LinkToPerson → Navajo Token

```typescript
const NAVAJO_BASE = 'https://clubweb.sportlink.com/navajo/entity/common/clubweb';

const linkRes = await fetch(`${NAVAJO_BASE}/user/LinkToPerson`, {
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'X-Navajo-Entity': 'user/LinkToPerson',
    'X-Navajo-Instance': 'KNKV',
    'X-Navajo-Locale': 'nl',
  },
});
const { TokenObject } = await linkRes.json();
const navajoToken = TokenObject.accessToken; // DIT is het token voor alle verdere calls
```

### Stap 6: SearchMembers

```typescript
const searchRes = await fetch(`${NAVAJO_BASE}/member/search/SearchMembers`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${navajoToken}`,
    'Content-Type': 'text/plain;charset=UTF-8',  // LET OP: niet application/json
    'X-Navajo-Entity': 'member/search/SearchMembers',
    'X-Navajo-Instance': 'KNKV',
    'X-Navajo-Locale': 'nl',
  },
  body: JSON.stringify({
    Filters: {
      InputExtended: {
        TypeOfMember: {
          Type: 'MULTISELECT',
          Options: [
            { Id: 'KERNELMEMBER', IsSelected: true },
            { Id: 'CLUBMEMBER', IsSelected: true },
            { Id: 'CLUBRELATION', IsSelected: true },
          ],
        },
        MemberStatus: {
          Type: 'MULTISELECT',
          Options: [
            { Id: 'ACTIVE', IsSelected: true },
            { Id: 'INACTIVE', IsSelected: true },
            { Id: 'ELIGABLE_FOR_REMOVE', IsSelected: true },
          ],
        },
      },
      InputSimple: {
        SearchValue: {
          Type: 'INPUT',
          Options: [{ Name: 'SEARCHVALUE', Type: 'TEXT', Value: '' }],
        },
      },
    },
  }),
});
const { Members } = await searchRes.json();
```

**Belangrijk:** Lege `Value` in SEARCHVALUE retourneert alle leden. `*` retourneert 0 resultaten.

## Member Velden

| Veld | Type | Gebruik |
|---|---|---|
| `PublicPersonId` | string | **= rel_code** — primaire match-sleutel |
| `FirstName` | string | Voornaam |
| `LastName` | string | Achternaam |
| `Infix` | string? | Tussenvoegsel |
| `DateOfBirth` | date string | Geboortedatum (YYYY-MM-DD) |
| `GenderCode` | `Male` / `Female` | Geslacht |
| `MemberStatus` | string | ACTIVE, INACTIVE, ELIGABLE_FOR_REMOVE |
| `RelationStart` | date string | Aanmelddatum |
| `RelationEnd` | date string? | Afmelddatum (null = actief) |
| `AgeClassDescription` | string | Jeugd, Senioren, etc. |
| `ClubTeams` | string? | Teamindeling in Sportlink |
| `KernelGameActivities` | string? | Veld/Zaal spelactiviteiten |
| `Email` | string? | E-mailadres |
| `Mobile` | string? | Mobiel nummer |

## Navajo API — Referentie

### Constanten

```
Base URL:     https://clubweb.sportlink.com/navajo/entity/common/clubweb
Auth URL:     https://idm.sportlink.com/realms/sportlink
Client ID:    sportlink-club-web
Club ID:      NCX19J3 (Oranje Wit)
Union ID:     KNKV
```

### Config (publiek)

`GET https://clubweb.sportlink.com/config.json` retourneert:
- `baseEntity`: `entity/common/clubweb`
- `baseUrl`: `/navajo`
- `navajoUsername`: `sportlink-clubweb-public`
- `navajoPassword`: `kBTH-X-6QukI4kIy`

### Headers voor Navajo calls

```
Authorization: Bearer {navajoToken}
X-Navajo-Entity: {entity-path}
X-Navajo-Instance: KNKV
X-Navajo-Locale: nl
Content-Type: text/plain;charset=UTF-8  (voor POST)
```

### Relevante Entities

| Entity | Method | Wat |
|---|---|---|
| `user/ClubAuthorizations` | GET | Beschikbare clubs voor deze gebruiker |
| `user/LinkToPerson` | GET | Koppel Keycloak-user aan Sportlink-persoon, retourneert Navajo token |
| `user/UserInfo` | GET | Gebruikersinfo (naam, rechten) |
| `club/Club` | GET | Clubinfo (naam, rechten, modules) |
| `member/search/FilterMembersSimple` | GET | Simpele zoekfilter-definitie |
| `member/search/FilterMembersExtended` | GET | Uitgebreide zoekfilter-definitie |
| `member/search/SearchMembers` | POST | **Zoek leden** — de hoofdcall |
| `member/MemberHeader` | GET (met ID) | Lidgegevens header |
| `team/ClubTeams` | GET | Alle teams |
| `team/teamperson/SearchClubTeamPlayers` | POST | Spelers per team zoeken |
| `competition/CurrentSeason` | GET | Huidig seizoen |

### Foutcodes

| Status | Betekenis |
|---|---|
| 200 | OK |
| 404 | Entity niet gevonden |
| 405 | Method niet ondersteund (GET vs POST) |
| 420 | Validatie-fout (bijv. ongeldige filter-data) |
| 500 | Server error |
| 602 | Missing entity ID |

## Diff Logica

```
Voor elk Sportlink-lid:
  1. Match op rel_code (PublicPersonId === Speler.relCode)
     → Gevonden + afgemeld → categorie "Afgemeld"
     → Gevonden + actief → skip (geen wijziging)
  2. Geen rel_code match → fuzzy match:
     voornaam ≈ FirstName AND achternaam ≈ LastName AND geboortedatum === DateOfBirth
     → Gevonden → categorie "Fuzzy match" (koppel rel_code)
     → Niet gevonden → categorie "Nieuw"
```

## Bestanden

| Pad | Wat |
|---|---|
| `apps/ti-studio/src/lib/sportlink/client.ts` | Auth flow + API calls |
| `apps/ti-studio/src/lib/sportlink/diff.ts` | Vergelijking Sportlink ↔ DB |
| `apps/ti-studio/src/app/api/sportlink/sync/route.ts` | POST: credentials → diff |
| `apps/ti-studio/src/app/api/sportlink/apply/route.ts` | POST: geselecteerde wijzigingen doorvoeren |
| `apps/ti-studio/src/app/(protected)/sportlink/page.tsx` | UI pagina |
| `apps/ti-studio/src/components/werkbord/Ribbon.tsx` | Ribbon item toevoegen |
