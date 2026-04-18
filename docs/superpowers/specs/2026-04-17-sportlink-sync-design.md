# Sportlink Sync — Design Spec

**Datum:** 2026-04-17
**Status:** Goedgekeurd

## Doel

TC-leden kunnen vanuit TI Studio recente Sportlink-ledendata ophalen, vergelijken met de eigen database, en wijzigingen selectief doorvoeren. Geen CSV-exports meer nodig.

## Flow

```
Gebruiker → TI Studio /sportlink pagina
  → Vult Sportlink email + wachtwoord in
  → Klikt "Ophalen"
  → Server: Keycloak PKCE login → OTP skip → LinkToPerson → SearchMembers
  → Server: vergelijkt met DB (rel_code match + fuzzy naam-match)
  → Retourneert diff
  → Toont: Nieuwe leden | Afmeldingen | Fuzzy matches
  → Checkboxes per speler, gegroepeerd per categorie
  → Klikt "Doorvoeren"
  → Server: maakt/muteert Speler-records
```

## Onderdelen

| Wat | Pad |
|---|---|
| Ribbon item | `apps/ti-studio/src/components/werkbord/Ribbon.tsx` |
| Pagina | `apps/ti-studio/src/app/(protected)/sportlink/page.tsx` |
| API: sync | `apps/ti-studio/src/app/api/sportlink/sync/route.ts` |
| API: apply | `apps/ti-studio/src/app/api/sportlink/apply/route.ts` |
| Sportlink client | `apps/ti-studio/src/lib/sportlink/client.ts` |
| Diff engine | `apps/ti-studio/src/lib/sportlink/diff.ts` |
| Skill | `.claude/skills/sportlink/SKILL.md` |

## Sportlink Client — Auth Flow (pure fetch)

### 1. Keycloak PKCE Login

```
GET https://idm.sportlink.com/realms/sportlink/protocol/openid-connect/auth
  ?client_id=sportlink-club-web
  &redirect_uri=https://clubweb.sportlink.com
  &response_type=code
  &scope=openid
  &state={random}
  &code_challenge={SHA256(code_verifier)}
  &code_challenge_method=S256

→ Retourneert login-pagina HTML met form action URL + AUTH_SESSION_ID cookie
```

### 2. POST Credentials

```
POST {form_action_url}
  Cookie: AUTH_SESSION_ID=...
  Content-Type: application/x-www-form-urlencoded
  Body: username={email}&password={password}

→ 200 met OTP-pagina (optioneel)
```

### 3. Skip Optional OTP

```
POST {otp_form_action_url}
  Cookie: AUTH_SESSION_ID=...
  Content-Type: application/x-www-form-urlencoded
  Body: (leeg)

→ 302 redirect naar https://clubweb.sportlink.com?code={auth_code}&state={state}
```

### 4. Token Exchange

```
POST https://idm.sportlink.com/realms/sportlink/protocol/openid-connect/token
  Content-Type: application/x-www-form-urlencoded
  Body: grant_type=authorization_code
        &client_id=sportlink-club-web
        &code={auth_code}
        &redirect_uri=https://clubweb.sportlink.com
        &code_verifier={code_verifier}

→ { access_token, token_type: "Bearer", expires_in: 3600 }
```

### 5. LinkToPerson (Navajo token)

```
GET https://clubweb.sportlink.com/navajo/entity/common/clubweb/user/LinkToPerson
  Authorization: Bearer {keycloak_access_token}
  X-Navajo-Entity: user/LinkToPerson
  X-Navajo-Instance: KNKV
  X-Navajo-Locale: nl

→ {
    UnionId: "KNKV",
    ClubId: "NCX19J3",
    TokenObject: {
      accessToken: "tSgiHZHX...",     ← DIT is het Navajo token
      refreshToken: "cxVHiav...",
      expirationTimestamp: "..."
    }
  }
```

### 6. SearchMembers

```
POST https://clubweb.sportlink.com/navajo/entity/common/clubweb/member/search/SearchMembers
  Authorization: Bearer {navajo_access_token}
  Content-Type: text/plain;charset=UTF-8
  X-Navajo-Entity: member/search/SearchMembers
  X-Navajo-Instance: KNKV
  X-Navajo-Locale: nl

Body: {
  "Filters": {
    "InputExtended": {
      "TypeOfMember": {
        "Type": "MULTISELECT",
        "Options": [
          { "Id": "KERNELMEMBER", "IsSelected": true },
          { "Id": "CLUBMEMBER", "IsSelected": true },
          { "Id": "CLUBRELATION", "IsSelected": true }
        ]
      },
      "MemberStatus": {
        "Type": "MULTISELECT",
        "Options": [
          { "Id": "ACTIVE", "IsSelected": true },
          { "Id": "INACTIVE", "IsSelected": true },
          { "Id": "ELIGABLE_FOR_REMOVE", "IsSelected": true }
        ]
      }
    },
    "InputSimple": {
      "SearchValue": {
        "Type": "INPUT",
        "Options": [
          { "Name": "SEARCHVALUE", "Type": "TEXT", "Value": "" }
        ]
      }
    }
  }
}

→ { Members: [...] }
```

**Let op:** Lege `Value` in SEARCHVALUE retourneert alle leden. `*` retourneert 0 resultaten.

## Member velden (relevant)

| Veld | Gebruik |
|---|---|
| `PublicPersonId` | = `rel_code` — primaire match-sleutel |
| `FirstName`, `LastName`, `Infix` | Fuzzy match voor spelers zonder rel_code |
| `DateOfBirth` | Fuzzy match + korfballeeftijd |
| `GenderCode` | Male/Female |
| `MemberStatus` | ACTIVE, INACTIVE, ELIGABLE_FOR_REMOVE |
| `RelationStart` | Aanmelddatum |
| `RelationEnd` | Afmelddatum (null = actief) |
| `AgeClassDescription` | Jeugd, Senioren, etc. |
| `ClubTeams` | Huidige teamindeling in Sportlink |
| `KernelGameActivities` | Veld/Zaal spelactiviteiten |

## Diff Engine

### Categorieën

1. **Nieuw** — `PublicPersonId` niet in DB → kan worden aangemaakt als Speler
2. **Afgemeld** — `RelationEnd` gevuld of `MemberStatus` niet ACTIVE, maar bij ons nog actief → signalering
3. **Fuzzy match** — Speler in DB zonder `rel_code`, maar `voornaam + achternaam + geboortedatum` matcht → koppel rel_code

### Match-logica

```
Voor elk Sportlink-lid:
  1. Zoek Speler met rel_code === PublicPersonId
     → Gevonden: check of afgemeld (RelationEnd / MemberStatus)
     → Niet gevonden: stap 2
  2. Fuzzy match: zoek Speler zonder rel_code waar
     voornaam ≈ FirstName AND achternaam ≈ LastName AND geboortedatum === DateOfBirth
     → Gevonden: voorstel om rel_code te koppelen
     → Niet gevonden: markeer als "Nieuw"
```

## UI

### Pagina `/sportlink`

- **Stap 1:** Formulier met email + wachtwoord velden + "Ophalen" knop
- **Stap 2:** Diff-weergave in 3 secties (Nieuw / Afgemeld / Fuzzy matches)
  - Per sectie: lijst met checkboxes per speler
  - Speler-info: naam, geboortedatum, korfballeeftijd, geslacht
  - Bij fuzzy match: toon ook de bestaande Speler waarmee gematcht wordt
- **Stap 3:** "Doorvoeren" knop → verwerkt geselecteerde wijzigingen

### Ribbon

Nieuw icoon in de Ribbon met navigatie naar `/sportlink`.

## Niet in scope

- Credentials opslaan (eenmalig per sessie)
- Teamindeling-sync (fase 2)
- Veld-sync (naam, email, etc.)
- Automatische scheduled sync
