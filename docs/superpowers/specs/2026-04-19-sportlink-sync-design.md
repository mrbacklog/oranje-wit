# Sportlink Sync — Design Document

**Datum**: 19 april 2026
**Status**: Ontwerp
**Auteur**: Antjan + Claude

## Aanleiding

De huidige Sportlink-integratie is beperkt tot een handmatige sync in TI Studio die leden ophaalt via `SearchMembers` en vergelijkt met de Speler-tabel. Er is geen leden-spiegel, geen teamsamenstelling-sync, geen wijzigingshistorie, en geen gestructureerde manier om Sportlink-data te verwerken. De CSV-import (`sync-leden-csv.ts`) is verouderd en onbetrouwbaar.

Na grondig onderzoek van de Sportlink Navajo API (april 2026) zijn er significant meer mogelijkheden ontdekt dan eerder bekend. Dit document beschrijft hoe we deze mogelijkheden inzetten via een 3-lagen sync-architectuur.

## API Discovery — beschikbare endpoints

### Primaire sync-endpoints (focus)

| ID | Endpoint | Data | Aanroep |
|----|----------|------|---------|
| **A** | `member/search/SearchMembers` | Alle leden, 70+ velden per lid | POST met filters, bulk |
| **B** | `member/notifications/Notifications?DateFrom=` | Wijzigingshistorie met datums, terug tot 2015 (732 items) | GET met DateFrom param |
| **R** | `member/search/SearchTeams` | Volledige teamsamenstelling (spelers + staf + functies) | POST met filters, 1 call per spelvorm |
| **C** | `team/UnionTeams` | 59 bondsteams (Veld + Zaal) met speleraantallen | GET, bulk |

### Aanvullende endpoints (niet in scope eerste fase)

| ID | Endpoint | Data | Potentie |
|----|----------|------|----------|
| D | `team/teamperson/UnionTeamPlayers` | Spelers per team | Vervangen door R |
| E | `team/teamperson/UnionTeamNonPlayers` | Staf per team | Vervangen door R |
| F | `team/unassignedplayers/SearchUnassignedPlayers` | Spelers zonder team | Signalering |
| G | `member/activity/MemberGameActivities` | Spelactiviteiten per lid | Spelerinformatie |
| H | `member/membership/MemberUnionMemberships` | Clublidmaatschappen | Overschrijvingen |
| I | `member/registrations/PersonClubHistory` | Clubhistorie | Overschrijvingen |
| J | `member/MemberHeader` | Profiel + pasfoto-URL | Foto-sync |
| K | `member/history/MemberPlayerHistory` | Teams gespeeld (huidig seizoen) | Spelerspad |
| L | `member/history/MemberMatchHistory` | Wedstrijden met speeltijd | Statistieken |
| M | `member/history/MemberDisciplineHistory` | Tuchthistorie per seizoen (tot 2014) | Seizoensactiviteit |
| N | `team/teamplayerstatistics/TeamPlayerStatistics` | Spelerstatistieken per team | Competitie-analyse |
| O | `competition/match/MatchResults` | Wedstrijduitslagen (vorig seizoen) | Competitieresultaten |
| P | `user/dashboard/DashboardPersonChanges` | Teller wijzigingen | Quick-check trigger |
| Q | `member/function/UnionFunctionsLastUpdate` | Functionarissen | Staf/functies |
| S | `member/team/MemberTeams` | Huidige teams per lid | Teamkoppeling |

### API-beperkingen

- **Geen historische teamsamenstelling** — alleen het huidige seizoen is beschikbaar
- **Geen seizoensfilters** op team-endpoints — parameters worden genegeerd
- **Notifications** gaan terug tot 2015, maar `DateFrom=2010-01-01` geeft een server error
- **Lid-detail endpoints** (history, membership, activities) werken alleen per lid via `?PublicPersonId=`
- **Alle leden blijven in Sportlink** — oud-leden worden INACTIVE, niet verwijderd

### API-aanroep conventies

- Authenticatie: Keycloak PKCE → Navajo token via `user/LinkToPerson`
- Headers: `X-Navajo-Entity`, `X-Navajo-Instance: KNKV`, `X-Navajo-Locale: nl`
- Sommige endpoints gebruiken query params (Notifications), andere POST body met Filters-wrapper (SearchMembers, SearchTeams)

## Architectuur — 3 lagen

```
┌─────────────────────────────────────────────────────────┐
│ Sportlink Navajo API                                     │
│ SearchMembers · Notifications · SearchTeams · UnionTeams │
└──────────────┬──────────────────────────────┬────────────┘
               │                              │
    ┌──────────▼──────────┐        ┌──────────▼──────────┐
    │ Laag 1              │        │ Laag 2              │
    │ Leden-spiegel       │        │ Team-sync           │
    │                     │        │                     │
    │ SearchMembers       │        │ SearchTeams         │
    │ → Lid-tabel         │        │ → TeamRegistratie   │
    │                     │        │                     │
    │ Notifications       │        │ Veld/Zaal keuze     │
    │ → Wijzigingslog     │        │ → Snapshot historie │
    └──────────┬──────────┘        └──────────┬──────────┘
               │                              │
    ┌──────────▼──────────────────────────────▼──────────┐
    │ Laag 3                                              │
    │ Wijzigingsdetectie                                  │
    │                                                     │
    │ Vergelijkt Laag 1 + 2 met TC-werkindeling           │
    │ Signaleert: nieuwe leden, afmeldingen, teamwijz.    │
    │ TC beslist wat doorvoeren                            │
    └─────────────────────────┬───────────────────────────┘
                              │
    ┌─────────────────────────▼───────────────────────────┐
    │ TC Werkindeling (bestaand)                           │
    │ Speler-tabel, Scenario's, Werkbord                  │
    └─────────────────────────────────────────────────────┘
```

## Laag 1: Leden-spiegel

### Doel
Sportlink is de bron van waarheid voor ledendata. De Lid-tabel is een spiegel — geen interpretatie, geen filtering, pure data-sync met een `laatstGesyncOp` timestamp.

### Wat we syncen uit SearchMembers

Alleen velden relevant voor onze applicatie. Bewust NIET: adressen, telefoon, oudergegevens, identificatie, nationaliteit.

| Lid-veld | Sportlink-veld | Bestaand? |
|----------|---------------|-----------|
| `relCode` | PublicPersonId | ✅ |
| `roepnaam` | FirstName | ✅ |
| `achternaam` | LastName | ✅ |
| `tussenvoegsel` | Infix | ✅ |
| `voorletters` | Initials | ✅ |
| `geslacht` | GenderCode | ✅ |
| `geboortedatum` | DateOfBirth | ✅ |
| `geboortejaar` | (afgeleid) | ✅ |
| `email` | Email | ✅ |
| `lidSinds` | MemberSince | ✅ |
| `registratieDatum` | RelationStart | ✅ |
| `afmelddatum` | RelationEnd | ✅ |
| `lidsoort` | TypeOfMemberDescription | ✅ |
| `lidStatus` | MemberStatus | **Nieuw** |
| `spelactiviteiten` | KernelGameActivities | **Nieuw** |
| `clubTeams` | ClubTeams | **Nieuw** |
| `leeftijdscategorie` | AgeClassDescription | **Nieuw** |
| `laatstGesyncOp` | (eigen timestamp) | **Nieuw** |

### Sync-gedrag

- Haalt **alle leden** op (ACTIVE + INACTIVE + ELIGABLE_FOR_REMOVE) — bondsleden
- Upsert alles naar de Lid-tabel op basis van `relCode`
- `laatstGesyncOp` wordt bij elke upsert op NOW() gezet
- Leden die niet meer uit Sportlink komen: `laatstGesyncOp` blijft staan — dit is een signaal om te onderzoeken, niet automatisch te verwijderen

### Notifications als wijzigingslog

Bij elke sync halen we ook `Notifications?DateFrom={laatste sync datum}` op.

Per notificatie slaan we op:
- `relCode` (PublicPersonId)
- `datum` (DateOfChange)
- `actie` (TypeOfAction: insert/update/delete)
- `entiteit` (Entity: member/membership/player/clubfunction)
- `beschrijving` (Description)
- `categorie` (Category)
- `gewijzigdDoor` (ChangedBy)

Niet opslaan: `ChangeVector` (bevat gevoelige data als adressen en telefoonnummers).

Relevante notificatie-types:

| Entity | Beschrijving | Betekenis |
|--------|-------------|-----------|
| `membership` | "Lid geworden van Oranje Wit (D)" | Nieuw lid |
| `membership` | "Afgemeld bij [club]" | Overschrijving |
| `player` | "Veld Week bij Oranje Wit (D)" + Toegevoegd | Spelactiviteit erbij |
| `player` | "Zaal Week bij [club]" + Verwijderd | Spelactiviteit verloren |
| `member` | "persoonsgegevens" + Gewijzigd | Persoonsgegevens gewijzigd |

### Vervanging CSV-import

De Sportlink API sync vervangt de bestaande `scripts/import/sync-leden-csv.ts` volledig. De CSV-import wordt uitgefaseerd.

### Shared functie

De sync-logica wordt een shared functie in `packages/` (bijv. `@oranje-wit/sportlink`) zodat zowel `apps/web` als `apps/ti-studio` dezelfde sync kunnen aanroepen. De Sportlink login (Keycloak PKCE → Navajo token) wordt gedeeld.

## Laag 2: Team-sync

### Doel
De actuele teamsamenstelling uit Sportlink vastleggen en bij elke sync de vorige versie als historie bewaren. Zo bouwen we seizoen voor seizoen onze eigen historische database op — Sportlink biedt geen historische teamsamenstelling via de API.

### Primaire bron: SearchTeams

`SearchTeams` met alle 59 teams geselecteerd geeft in **één call**:
- 642 rijen (301 unieke personen)
- Spelers + coaches + medische staf + teammanagers
- Per persoon: team, rol, specifieke functie, startdatum, IsPlayer, IsOnMatchForm
- Filterbaar op Veld (326 leden, 30 teams) of Zaal (316 leden, 29 teams)

### Beschikbare rollen en functies

| Rol | Functies |
|-----|---------|
| Teamspeler | Aanvaller, Verdediger |
| Technische staf | Hoofd coach, Assistent coach |
| Medische staf | Dokter, Fysiotherapeut |
| Overige staf | Teammanager, Materiaalman, Standaard functie |

### Team-sync flow (TC-gestuurd, 4 stappen)

De TC bepaalt wanneer een teamindeling wordt vastgelegd. Dit is een bewust proces, geen automatische sync.

**Stap 1: Spelvorm kiezen**
- Veld of Zaal
- UI stelt voor op basis van seizoensperiode:
  - Aug–Okt → "Veld najaar"
  - Nov–Jan → "Zaal"
  - Feb–Mrt → "Zaal deel 2" (4-tal)
  - Apr–Jun → "Veld voorjaar"

**Stap 2: Competitie-periode kiezen**
- Veld najaar / Veld voorjaar / Zaal / Zaal deel 2
- De TC bevestigt welke indeling bijgewerkt wordt

**Stap 3: Dry run**
- Sportlink-data ophalen via SearchTeams (gefilterd op Veld of Zaal)
- Vergelijken met de laatst opgeslagen indeling voor deze periode
- Tonen: nieuwe spelers in teams, spelers uit teams, teamwissels, staf-wijzigingen
- TC kan reviewen wat er verandert

**Stap 4: Accept**
- Bij akkoord worden de wijzigingen doorgevoerd
- De nieuwe indeling wordt opgeslagen als snapshot
- Status: concept of definitief (TC kiest)

### Urgentie

Op dit moment kan het Zaal-seizoen 2025-2026 **definitief** opgeslagen worden — het seizoen is verlopen maar de data staat nog in Sportlink. Als we te lang wachten verliezen we deze informatie wanneer Sportlink het nieuwe seizoen activeert.

## Laag 3: Wijzigingsdetectie

### Doel
De wijzigingen uit Laag 1 (leden) en Laag 2 (teams) vertalen naar signalen voor de TC-werkindeling. De TC beslist wat doorvoeren — automatisch doorvoeren gebeurt nooit.

### Signalen uit Laag 1 (leden-spiegel)

| Wijziging | Signaal |
|-----------|---------|
| Nieuw lid (niet in Speler-tabel) | "Nieuw lid — toevoegen aan spelerspool?" |
| `lidStatus` ACTIVE → INACTIVE | "Lid inactief geworden" |
| `afmelddatum` null → datum | "Afmelddatum gezet" |
| `spelactiviteiten` veranderd | "Spelactiviteit gewijzigd: was X, nu Y" |
| `geboortedatum` gecorrigeerd | "Geboortedatum gewijzigd — korfballeeftijd check" |
| `geslacht` gecorrigeerd | "Geslacht gewijzigd — M/V-ratio check" |

### Signalen uit Laag 2 (team-sync)

| Wijziging | Signaal |
|-----------|---------|
| Speler in ander team dan verwacht | "Speler X staat in team Y (Sportlink) maar in team Z (werkindeling)" |
| Nieuwe staf bij team | "Nieuwe coach bij team X" |
| Staf verwijderd | "Coach niet meer bij team X" |

### Signalen uit Notifications

| Event | Signaal |
|-------|---------|
| `membership` + "Lid geworden van Oranje Wit" | "Nieuw lid aangemeld op [datum]" |
| `membership` + "Afgemeld bij [club]" | "Overschrijving: [naam] weg bij [club] op [datum]" |
| `player` + "Veld Week" + Toegevoegd | "Spelactiviteit Veld toegevoegd op [datum]" |

### Filterlogica voor "nieuw lid aanbieden aan werkindeling"

- Geldige Sportlink relCode (patroon `^[A-Z]{1,3}\w+$`)
- Lid.lidStatus = ACTIVE
- Korfballeeftijd >= 3 (kangoeroe)
- Geen ouder-lidmaatschap

### TC heeft het laatste woord

Alle signalen zijn voorstellen. De TC kan:
- Accepteren → wijziging doorvoeren in werkindeling
- Negeren → signaal afvinken zonder actie
- Overrulen → eigen status/indeling kiezen die afwijkt van Sportlink

Dit is essentieel omdat de TC meer context heeft dan de ledenadministratie.

## Privacy

### Wat we WEL opslaan
- Naam, geboortedatum, geslacht, email
- Lidmaatschapsgegevens (lidsoort, status, spelactiviteiten, teams)
- Wijzigingslog (wie, wanneer, wat veranderde — op beschrijvingsniveau)

### Wat we NIET opslaan
- Adressen (StreetName, AddressNumber, ZipCode, City)
- Telefoonnummers (Mobile, Telephone)
- Oudergegevens (NameParent1/2, TelephoneParent1/2, EmailAddressParent1/2)
- Identificatie (IdentificationNumber, BSN)
- Nationaliteit
- ChangeVector waarden (bevatten gevoelige data)
- Opmerkingen/vrije velden

## Technische architectuur

### Shared package: `@oranje-wit/sportlink`

Nieuwe package in `packages/sportlink/` met:
- **Client**: Keycloak PKCE login + Navajo API calls
- **Sync functies**: syncLeden(), syncTeams(), haalNotificatiesOp()
- **Types**: SportlinkLid, SportlinkTeam, SportlinkNotificatie

Wordt gebruikt door:
- `apps/web` — Ledenmonitor, retentie-analyse
- `apps/ti-studio` — Team-sync, werkindeling

### Database-wijzigingen

**Lid-tabel** — nieuwe velden:
- `lidStatus` (String) — MemberStatus
- `spelactiviteiten` (String?) — KernelGameActivities
- `clubTeams` (String?) — ClubTeams
- `leeftijdscategorie` (String?) — AgeClassDescription
- `laatstGesyncOp` (DateTime?) — Timestamp van laatste sync

**Nieuw model: SportlinkNotificatie**
- `id` (autoincrement)
- `relCode` (String)
- `datum` (DateTime)
- `actie` (String) — insert/update/delete
- `entiteit` (String) — member/membership/player
- `beschrijving` (String)
- `categorie` (String)
- `gewijzigdDoor` (String)
- `gesyncOp` (DateTime)

**Bestaand snapshot-systeem** — uitbreiden met Sportlink als bron:
- Bestaande snapshot-logica gebruiken voor het opslaan van teamindelingen
- Bron markeren als "sportlink" i.p.v. "csv"

## Implementatie-volgorde

### Fase 1: Shared Sportlink client
- `packages/sportlink/` aanmaken
- Keycloak PKCE login verhuizen uit `apps/ti-studio`
- SearchMembers, SearchTeams, Notifications, UnionTeams als functies

### Fase 2: Leden-spiegel (Laag 1)
- Lid-tabel uitbreiden met nieuwe velden
- Sync-functie: SearchMembers → Lid upsert
- Notifications ophalen en opslaan
- CSV-import markeren als deprecated

### Fase 3: Team-sync (Laag 2)
- SearchTeams integratie (1 call per spelvorm)
- 4-staps flow in UI (spelvorm → periode → dry run → accept)
- Snapshot opslaan bij accept
- Zaal 2025-2026 als eerste definitieve snapshot

### Fase 4: Wijzigingsdetectie (Laag 3)
- Vergelijkingslogica Lid ↔ Speler
- Vergelijkingslogica Sportlink-teams ↔ werkindeling-teams
- Signalen-UI in TI Studio
- Bestaande Sportlink sync-pagina vervangen

## Open vragen

1. Waar in de UI komt de leden-sync? Alleen TI Studio of ook apps/web?
2. Moet de sync handmatig getriggerd worden of ook op een schedule?
3. Hoe gaan we om met de Sportlink login-credentials? Per gebruiker of een service-account?
