# Sportlink API Onderzoek — 29 maart 2026

Grondig webonderzoek naar alle mogelijkheden om programmatisch toegang te krijgen tot Sportlink-data voor c.k.v. Oranje Wit.

---

## Samenvatting

Er zijn **drie** relevante API-lagen gevonden, plus de bestaande KNKV API:

| # | API | Type | Ledendata? | Kosten | Status |
|---|---|---|---|---|---|
| 1 | **Club.Dataservice** (`data.sportlink.com`) | Officieel, publiek + OAuth | Ja, beperkt | ~€2.70/lid/jaar | **Beschikbaar, bestellen via webshop** |
| 2 | **clubweb.sportlink.com backend** | Interne SPA-API | Ja, volledig | Geen extra | **Ongedocumenteerd, Keycloak auth** |
| 3 | **KNKV Mijn Korfbal API** (`api-mijn.korfbal.nl`) | Publiek, ongeauthenticeerd | Nee, alleen teams/wedstrijden | Gratis | **Al in gebruik** |
| 4 | **Sportlink Official Portal** | Bond-niveau API | Nee, alleen scheidsrechters | N.v.t. | Niet relevant |

**Conclusie**: Club.Dataservice is de meest realistische route voor geautomatiseerde ledendata. De `team-indeling` endpoint levert spelerslijsten per team inclusief namen, rollen en contactgegevens.

---

## 1. Club.Dataservice API (data.sportlink.com)

### Wat is het?

De officieel ondersteunde API van Sportlink voor verenigingen. Biedt **71+ endpoints** (artikelen) die JSON-data leveren over wedstrijden, teams, leden, commissies, financien en meer.

### Technische details

| Gegeven | Waarde |
|---|---|
| Base URL | `https://data.sportlink.com/` |
| Endpoint-overzicht | `https://data.sportlink.com/list` |
| Authenticatie (publiek) | Query parameter `client_id` |
| Authenticatie (prive) | OAuth implicit flow via `https://auth.sportlink.com/oauth` |
| Data-formaat | JSON |
| Rate limiting | Onbekend (data wordt 4x/dag gecached, za/zo elk uur) |

### Hoe te bestellen

1. Ga naar Sportlink Club → **Shop**
2. Bestel Club.Dataservice (onderdeel van Club.Pakket "Beter" of "Ideaal")
3. Na betaling ontvang je een **Client ID**
4. Client ID is te vinden in Sportlink Club → Vereniging → Beheer → Gebruikersbeheer → tab Clubsite

### Kosten

| Pakket | Prijs | Inclusief |
|---|---|---|
| Club.Pakket "Beter" | €2.70/lid/jaar + €375 eenmalig | Club.Dataservice + Club.Mobiel + Club.TV |
| Club.Pakket "Ideaal" | €2.80/lid/jaar + €375 eenmalig | Alles van "Beter" + complete website |
| Club.Pakket "Goed" | €1.95/lid/jaar + €375 eenmalig | Alleen media (geen Dataservice) |

Maximum facturering: 800 leden per club. Bij ~400 leden is dat **~€1.080/jaar + €375 eenmalig**.

### Relevante endpoints voor Oranje Wit

#### Publieke endpoints (alleen client_id nodig)

| Endpoint | Wat | Relevantie |
|---|---|---|
| `teams` | Alle teams met competitie, kleur, categorie | Hoog — teamoverzicht |
| `team-indeling` | **Spelerslijst per team** met naam, rol, functie, contact, foto | **Zeer hoog** — dit is de ledenlijst per team |
| `team-gegevens` | Teamdetails (competitie, kleuren, foto) | Middel |
| `programma` | Wedstrijdprogramma | Middel (hebben we al via KNKV API) |
| `uitslagen` | Wedstrijduitslagen | Middel |
| `poulestand` | Competitiestanden | Middel (hebben we al via KNKV API) |
| `verjaardagen` | Verjaardagen leden (privacy-filter) | Laag |
| `bestuur` | Voorzitter, secretaris, penningmeester | Laag |
| `commissies` / `commissie-leden` | Commissies en hun leden | Laag |
| `clubgegevens` | Clubinfo, kleuren, adres | Laag |

#### OAuth-beschermde endpoints (token via auth.sportlink.com nodig)

| Endpoint | Scope | Wat |
|---|---|---|
| `mijn-gegevens` | PERSON | Persoonlijke gegevens (naam, geboortedatum, adres, contact, bankrekening) |
| `mijn-teams` | PERSON | Teams van ingelogde gebruiker |
| `mijn-facturen` | PERSON | Facturen |
| `mijn-commissies` | PERSON | Commissies |
| `mijn-diplomas` | PERSON | Diploma's/certificaten |
| `adresboek` | PERSON | Ledenzoek op achternaam (geeft rel_code!) |
| `wijzig-mijn-gegevens` | PERSON | Gegevens wijzigen |

### Het `team-indeling` endpoint in detail

**URL**: `https://data.sportlink.com/team-indeling?client_id=<ID>&teamcode=<CODE>&lokaleteamcode=-1`

**Parameters**:
- `teamcode` (verplicht) — teamcode uit het `teams` endpoint
- `lokaleteamcode` (verplicht) — meestal `-1`
- `teampersoonrol` (optioneel) — filter op `SPELER`, `TRAINER`, etc.
- `toonlidfoto` (optioneel) — toon foto van lid

**Output-velden**:
- Teamcode, lokaleteamcode, poulecode
- Teamnaam, competitienaam, klasse, poule
- Spelsoort, competitiesoort, geslacht, teamsoort, leeftijdscategorie
- Speeldag, speeldagteam
- **Per lid**: naam, geslacht, rol, functie, contact, foto

**Dit is de meest waardevolle bron** — hiermee kun je automatisch alle teamindelingen ophalen met spelersgegevens.

### OAuth flow voor prive-endpoints

```
1. Redirect gebruiker naar:
   https://auth.sportlink.com/oauth?
     redirect_uri=<jouw_url>&
     response_type=token&
     client_id=<client_id>&
     scope=PERSON&
     state=<random>

2. Gebruiker logt in op auth.sportlink.com

3. Redirect terug met token:
   <jouw_url>#token=<bearer_token>&token_type=bearer&expires_in=<sec>&scope=PERSON&state=<random>

4. API-aanroep met token:
   curl -iG https://data.sportlink.com/mijn-gegevens \
     --header "Authorization: Bearer <token>"
```

**Let op**: Dit is een **implicit flow** (token in URL-fragment). Geen ROPC/password grant beschikbaar via deze API. De gebruiker moet zelf inloggen in de browser.

### Voorbeeld API-aanroep

```bash
# Alle teams ophalen
curl "https://data.sportlink.com/teams?client_id=<JOUW_CLIENT_ID>"

# Team-indeling van een specifiek team
curl "https://data.sportlink.com/team-indeling?client_id=<JOUW_CLIENT_ID>&teamcode=264772&lokaleteamcode=-1&teampersoonrol=SPELER"

# Wedstrijdprogramma komende 30 dagen
curl "https://data.sportlink.com/programma?client_id=<JOUW_CLIENT_ID>&aantaldagen=30"
```

---

## 2. clubweb.sportlink.com — De interne SPA-backend

### Achtergrond

In november 2025 is Sportlink Club gemigreerd van een Java WebStart-applicatie naar een moderne web-applicatie op `clubweb.sportlink.com`. Dit is een SPA (Single Page Application) die communiceert met een backend API.

### Authenticatie

De login-URL onthult het volgende:

```
https://idm.sportlink.com/realms/sportlink/protocol/openid-connect/auth
  ?client_id=sportlink-club-web
  &redirect_uri=https://clubweb.sportlink.com
  &response_type=code
  &scope=openid
```

Dit is **Keycloak OpenID Connect** met:
- Realm: `sportlink`
- Client ID: `sportlink-club-web`
- Grant type: Authorization Code flow (niet implicit)
- Scope: `openid`

### Kan je hier programmatisch mee authenticeren?

**Theoretisch ja, maar risicovol**:

1. **ROPC (Resource Owner Password Credentials)**: Keycloak ondersteunt dit (`grant_type=password`), maar:
   - De client `sportlink-club-web` is waarschijnlijk een **public client** (geen client_secret)
   - ROPC moet expliciet ingeschakeld zijn op de client in Keycloak
   - Sportlink heeft dit waarschijnlijk **niet** ingeschakeld voor deze client
   - Je zou het token endpoint moeten aanroepen op: `https://idm.sportlink.com/realms/sportlink/protocol/openid-connect/token`

2. **Selenium/Puppeteer headless login**: Technisch mogelijk, maar:
   - Kwetsbaar voor UI-wijzigingen
   - Mogelijk in strijd met gebruiksvoorwaarden
   - MFA kan in de toekomst worden toegevoegd

3. **API endpoints ontdekken**: Met browser DevTools (Network tab) kun je zien welke API-calls de SPA maakt na inloggen. Dit geeft inzicht in de interne REST API.

### Advies

De interne API van clubweb.sportlink.com is **niet bedoeld voor extern gebruik**. Het is technisch mogelijk om via browser-automatisering (Puppeteer/Playwright) in te loggen en API-calls te onderscheppen, maar dit is:
- Fragiel (kan breken bij updates)
- Mogelijk in strijd met de gebruiksvoorwaarden
- Niet nodig als Club.Dataservice voldoende data biedt

---

## 3. KNKV Mijn Korfbal API (al in gebruik)

Al gedocumenteerd in `docs/knkv-api.md`. Samenvatting:

| Gegeven | Waarde |
|---|---|
| Base URL | `https://api-mijn.korfbal.nl/api/v2/` |
| Authenticatie | Geen |
| Oranje Wit club_id | `NCX19J3` |
| Ontwikkelaar | Dotlab (Angular frontend, Docker/Kubernetes/RabbitMQ/Redis backend) |

**Biedt**: teams, poules, wedstrijden, standen, accommodaties
**Biedt NIET**: spelerslijsten, ledendata, persoonlijke gegevens

De KNKV Mijn Korfbal portal (gebouwd door Dotlab) integreert met Sportlink via een ESB-architectuur met Keycloak authenticatie, maar die integratie is server-side en niet publiek beschikbaar.

---

## 4. Community-oplossingen en third-party tools

### GitHub repositories

| Repository | Taal | Wat | Bruikbaar? |
|---|---|---|---|
| [PendoNL/php-club-dataservice](https://github.com/PendoNL/php-club-dataservice) | PHP | Wrapper rond Club.Dataservice API | Ja, als referentie |
| [RichardVanDerMeer/wordpress-sportlink.club.dataservices](https://github.com/RichardVanDerMeer/wordpress-sportlink.club.dataservices) | PHP | WordPress plugin | Ja, als referentie voor endpoints |
| [Mantix/membro-sportlink-api-shortcodes](https://github.com/Mantix/membro-sportlink-api-shortcodes) | PHP | WordPress shortcodes voor Sportlink | Ja, als referentie |
| [frmain/sportlinkclubdata](https://github.com/frmain/sportlinkclubdata) | PHP | PHP wrapper | Ja, als referentie |
| [Domitnator/KNVBDataserviceAndClubDataClient](https://github.com/Domitnator/KNVBDataserviceAndClubDataClient) | JS | KNVB + Club Data client | Ja, voor template-systeem |
| [sportlinkservices](https://github.com/sportlinkservices) | — | Officieel Sportlink GitHub | **Geen publieke repos meer** |
| [rutgerkirkels/sportlink-client](https://github.com/rutgerkirkels/sportlink-client) | PHP | Sportlink client | Minimaal (1 commit, geen docs) |
| [voostindie/sportlink-webstart-mac](https://github.com/voostindie/sportlink-webstart-mac) | — | macOS launcher (verouderd) | Nee |

**Er is geen npm/TypeScript library.** Alle bestaande wrappers zijn PHP. Een TypeScript client zou nieuw moeten worden gebouwd.

### Andere integratie-tools

| Tool | Wat |
|---|---|
| [VVData](https://vvdata.nl/) | WordPress plugin voor Sportlink integratie |
| [SportlinkWordpress.nl](https://www.sportlinkwordpress.nl/) | WordPress koppeling sinds 2016 |
| [Club-assistent](https://support.club-assistent.nl/leden-importeren-uit-sportlink) | Leden importeren vanuit Sportlink CSV |
| [Membro](https://membro.nl/uitleg/leden-importeren-uit-sportlink/) | Leden importeren vanuit Sportlink |
| [VoetbalAssist](https://www.voetbalassist.nl/sportlink-knvb-wedstrijden-sportlink-leden/) | Wedstrijden + leden koppeling |
| [KPI Solutions Power BI](https://kpisolutions.nl/powerbi-api-koppeling/sportlink/) | Power BI connector naar Sportlink (commercieel) |
| [Ittica Media](https://www.itticamedia.nl/sportlink.html) | Maatwerk beheersysteem met Sportlink integratie |

---

## 5. Sportlink architectuur en context

### Technologie-stack

| Component | Technologie |
|---|---|
| Backend framework | Navajo (eigendom Dexels) — Service Oriented Computing |
| Interne data-formaat | TML (XML-gebaseerd) |
| Database | Oracle (apart schema per club, 7.000+ databases) |
| Nieuwe web-app | Modern SPA op clubweb.sportlink.com (november 2025) |
| Identity Management | Keycloak (`idm.sportlink.com`) |
| Club.Dataservice | JSON feeds via `data.sportlink.com` |
| OAuth | `auth.sportlink.com/oauth` (voor Mijn-omgeving) |
| Ondersteunde sporten | Voetbal, Hockey, Volleybal, Zwemmen, Atletiek, Basketbal, Handbal, Honkbal/Softbal, Judo, **Korfbal**, Reddingsbrigade |
| Eigenaar | Sportlink Services B.V. (opgericht 2002, Amsterdam) |
| Oprichters | KNVB, Davinci, Dexels, E-Novation |
| Aantal bonden | 8+ |
| Aantal clubs | 7.000+ |

### Ondersteunde bonden met portals

| Bond | Portal URL |
|---|---|
| KNKV (korfbal) | `officialportal.sportlink.com/knkv` |
| KNVB (voetbal) | `officialportal.sportlink.com/knvb` |
| KNZB (zwemmen) | `officialportal.sportlink.com/knzb` |
| KNBSB (honkbal/softbal) | `officialportal.sportlink.com/knbsb` |

---

## 6. Aanbevolen aanpak voor Oranje Wit

### Stap 1: Club.Dataservice aanschaffen (korte termijn)

1. **Bestel Club.Dataservice** via de Sportlink Club webshop
2. Ontvang de **Client ID**
3. Test de API: `curl "https://data.sportlink.com/teams?client_id=<ID>"`

### Stap 2: TypeScript client bouwen

```typescript
// Concept: packages/sportlink/src/client.ts
const BASE = "https://data.sportlink.com";

export class SportlinkClient {
  constructor(private clientId: string) {}

  async teams(filters?: { leeftijdscategorie?: string }) {
    const params = new URLSearchParams({ client_id: this.clientId, ...filters });
    const res = await fetch(`${BASE}/teams?${params}`);
    return res.json();
  }

  async teamIndeling(teamcode: string, rol?: string) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      teamcode,
      lokaleteamcode: "-1",
      ...(rol && { teampersoonrol: rol }),
    });
    const res = await fetch(`${BASE}/team-indeling?${params}`);
    return res.json();
  }

  async programma(dagen = 30) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      aantaldagen: String(dagen),
    });
    const res = await fetch(`${BASE}/programma?${params}`);
    return res.json();
  }
}
```

### Stap 3: Sync-pipeline bouwen

1. Haal alle teams op via `teams` endpoint
2. Voor elk team: haal `team-indeling` op (met `teampersoonrol=SPELER`)
3. Match spelers aan bestaande `leden` tabel via naam/geboortedatum
4. Update `Speler`-records in de teamindeling-database

### Stap 4: Combineer met KNKV API

| Data | Bron |
|---|---|
| Teamlijst + poules + standen | KNKV API (gratis, al in gebruik) |
| Spelerslijst per team | Club.Dataservice `team-indeling` |
| Ledengegevens (adres, contact) | Club.Dataservice `mijn-gegevens` (OAuth) of Sportlink CSV |
| Wedstrijdprogramma | KNKV API of Club.Dataservice `programma` |

---

## 7. Beperkingen en risico's

| Risico | Toelichting |
|---|---|
| **Geen rel_code in publieke endpoints** | Het `team-indeling` endpoint geeft wel een `lidnummer` maar het is onduidelijk of dit de rel_code is. Testen na aanschaf. |
| **Privacy-filter** | Leden met privacy-niveau "Afgeschermd" verschijnen niet in publieke endpoints |
| **Geen bulk ledenexport** | Er is geen endpoint om alle leden in een keer op te halen. Alleen per team of via OAuth per persoon. |
| **Kosten** | ~€1.080/jaar + €375 eenmalig is een investering voor een amateurvereniging |
| **Geen ROPC voor OAuth** | De Mijn-omgeving gebruikt implicit flow — geen server-side token ophalen zonder browser |
| **API kan wijzigen** | Club.Dataservice is stabiel maar ongedocumenteerd in versie-beleid |

---

## 8. Alternatief: Geautomatiseerde CSV-export

Als Club.Dataservice te duur is of onvoldoende data biedt:

1. **Handmatige CSV-export** blijft een optie (huidige werkwijze)
2. **Playwright-script** dat inlogt op clubweb.sportlink.com en de CSV-export triggert:
   - Login via Keycloak (username/password)
   - Navigeer naar Personen → Zoekscherm → Exporteer
   - Download CSV
   - Importeer in database

Dit is fragiel maar gratis en geeft volledige ledendata inclusief rel_code.

---

## Bronnen

- [Sportlink Club.Dataservice product-pagina](https://www.sportlink.nl/producten/club-dataservice/)
- [Club.Dataservice API koppelen (SVM Learn)](https://sportclubvrijwilligersmanagement.nl/learn/club-dataservice-api-koppelen/)
- [Lijst met artikelen van Club.Dataservice](https://sportlinkservices.freshdesk.com/nl/support/solutions/articles/9000062942-lijst-met-artikelen-van-club-dataservice)
- [Toepassen Club.Dataservice en werken met de JavaScript library](https://sportlinkservices.freshdesk.com/nl/support/solutions/articles/9000062943-toepassen-club-dataservice-en-werken-met-de-javascript-library)
- [Club.Dataservice en de "Mijn-omgeving" (OAuth)](https://sportlinkservices.freshdesk.com/nl/support/solutions/articles/9000088961-club-dataservice-en-de-mijn-omgeving-)
- [Lijst met parameters in Club.Dataservice](https://sportlinkservices.freshdesk.com/nl/support/solutions/articles/9000211117-lijst-met-parameters-in-club-dataservice)
- [Informatie over het nieuwe Sportlink Club](https://www.sportlink.nl/informatie-over-het-nieuwe-sportlink-club/)
- [Sportlink Club.Dataservice JavaScript Library](https://sportlinkservices.github.io/navajofeeds-json-parser/)
- [PendoNL/php-club-dataservice (GitHub)](https://github.com/PendoNL/php-club-dataservice)
- [RichardVanDerMeer/wordpress-sportlink.club.dataservices (GitHub)](https://github.com/RichardVanDerMeer/wordpress-sportlink.club.dataservices)
- [Mantix/membro-sportlink-api-shortcodes (GitHub)](https://github.com/Mantix/membro-sportlink-api-shortcodes)
- [Domitnator/KNVBDataserviceAndClubDataClient (GitHub)](https://github.com/Domitnator/KNVBDataserviceAndClubDataClient)
- [Dotlab KNKV Portal (proces-automatisering)](https://dotlab.net/case/knkv-process-automation-with-portal/)
- [Dotlab KNKV Portal (GDPR-compliant)](https://dotlab.net/case/knkv-sports-association-portal/)
- [KNKV Sportlink-pagina](https://www.knkv.nl/kennisbank/sportlink/)
- [Sportlink Wikipedia](https://nl.wikipedia.org/wiki/Sportlink)
- [Sportlink geschiedenis](https://www.sportlink.nl/over-sportlink/geschiedenis/)
- [KPI Solutions Power BI Sportlink koppeling](https://kpisolutions.nl/powerbi-api-koppeling/sportlink/)
- [SQL koppeling Sportlink en Excel (forum)](https://sportlinkservices.freshdesk.com/nl/support/discussions/topics/9000016117)
