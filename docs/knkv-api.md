# KNKV Mijn Korfbal API — Referentie

Publieke, ongeauthenticeerde REST API van het KNKV.
Ontdekt: februari 2026.

## Overzicht

| Gegeven | Waarde |
|---|---|
| Base URL | `https://api-mijn.korfbal.nl/api/v2/` |
| Authenticatie | Geen (publiek toegankelijk) |
| c.k.v. Oranje Wit club_id | `NCX19J3` |
| Frontend | https://mijn.korfbal.nl |
| Ontwikkelaar | Dotlab (Angular-applicatie) |

---

## Endpoints

### GET /clubs/count

Aantal geregistreerde verenigingen.

**Response:** `447` (seizoen 2025-2026)

### GET /clubs/{club_id}

Clubinformatie.

```json
{
  "name": "Oranje Wit (D)",
  "ref_id": "NCX19J3",
  "address": {
    "name": "Sportcomplex Stadspolders",
    "type": "OUTDOOR",
    "description": "veld (buiten)",
    "streetName": "Nieuwe Noordpolderweg",
    "addressNumber": 5,
    "cipCode": "3312AD",
    "city": "DORDRECHT",
    "countryCode": "NL",
    "coordinates": {
      "latitude": "51.81044006347656",
      "longitude": "4.6917524337768555"
    }
  },
  "colors": {
    "shirt": "oranje, witte v/hals",
    "shorts": "wit",
    "stocking": "-"
  }
}
```

### GET /clubs/{club_id}/teams

Alle teams van een club, gegroepeerd per leeftijdscategorie.

```json
[
  {
    "teams": [
      { "name": "Oranje Wit (D) 1", "ref_id": "T1827784165" },
      { "name": "Oranje Wit (D) 2", "ref_id": "T708889502" }
    ],
    "age": { "name": "Senioren", "ref_id": "011" }
  },
  {
    "teams": [
      { "name": "Oranje Wit (D) J1", "ref_id": "T688407638" },
      { "name": "Oranje Wit (D) U15-1", "ref_id": "T403752499" }
    ],
    "age": { "name": "Jeugd", "ref_id": "012" }
  }
]
```

**Let op:** elk team verschijnt **twee keer** — eenmaal voor veld, eenmaal voor zaal (met een ander `ref_id`).

### GET /clubs/{club_id}/teams/{team_ref_id}

Detail van een specifiek team met poule-toewijzing.

```json
{
  "name": "Oranje Wit (D) J1",
  "ref_id": "J1",
  "pools": [
    {
      "name": "Ro-135",
      "ref_id": 97425
    }
  ],
  "club": {
    "name": "Oranje Wit (D)"
  },
  "sport": {
    "name": "Veld Week"
  }
}
```

### GET /clubs/{club_id}/program?dateFrom={datum}&dateTo={datum}

Wedstrijdprogramma van een club in een datumperiode.

### GET /matches/pools/{pool_ref_id}/program?dateFrom={datum}&dateTo={datum}

Wedstrijden in een specifieke poule.

### GET /pools/count

Aantal poules. (`1496` in seizoen 2025-2026)

### GET /facilities/count

Aantal accommodaties. (`1822` in seizoen 2025-2026)

---

## Pool-naam decodering

De `pool.name` prefix codeert de kleur, het competitieniveau en de spelvorm.

### B-categorie (breedtekorfbal)

| Prefix | Kleur | Spelvorm |
|---|---|---|
| `Bl4-` | Blauw | 4-tal |
| `Gr4-` | Groen | 4-tal |
| `Ge-` | Geel | 8-tal |
| `Or-` | Oranje | 8-tal |
| `Ro-` | Rood | 8-tal |

### A-categorie jeugd (wedstrijdkorfbal)

| Prefix | Categorie | Niveau |
|---|---|---|
| `U15-HK-` | U15 | Hoofdklasse |
| `U15-1-` | U15 | 1e klasse |
| `U15-2-` | U15 | 2e klasse |
| `U17-HK-` | U17 | Hoofdklasse |
| `U17-1-` | U17 | 1e klasse |
| `U17-2-` | U17 | 2e klasse |
| `U19-HK-` | U19 | Hoofdklasse |
| `U19-OK-` | U19 | Overgangsklasse |
| `U19-1-` | U19 | 1e klasse |
| `U19-2-` | U19 | 2e klasse |

### Senioren (wedstrijdkorfbal)

| Prefix | Niveau |
|---|---|
| `HK-` | Hoofdklasse |
| `OK-` | Overgangsklasse |
| `ROK-` | Reserve Overgangsklasse |
| `1-` | 1e klasse |
| `R1-` | Reserve 1e klasse |
| `2-` | 2e klasse |
| `S-` | S-klasse (breedte senioren) |

---

## Sport-types

Elk team heeft twee registraties in de API: veld en zaal.

| `sport.name` | Competitievorm |
|---|---|
| `"Veld Week"` | Veldcompetitie (buiten) |
| `"Zaal Week"` | Zaalcompetitie (binnen) |

De kleur is voor beide competitievormen gelijk; alleen het poule-nummer verschilt.

---

## Oranje Wit teams (seizoen 2025-2026)

Volledige mapping op basis van API-data:

| Team | Kleur/Niveau | Pool (veld) | Pool (zaal) |
|---|---|---|---|
| 1 | Hoofdklasse | HK-08 | 1H |
| 2 | Reserve Overgangsklasse | ROK-07 | ROKD |
| 3 | Reserve Overgangsklasse | ROK-06 | R1D |
| 4 | Reserve 2e klasse | R2-28 | R3W |
| 5 | S-klasse | S-096 | S-055 |
| 6 | S-klasse | S-100 | S-056 |
| MW1 | Midweek | MW-40 | — |
| J1 | Rood | Ro-135 | Ro-074 |
| J2 | Rood | Ro-134 | Ro-071 |
| J3 | Oranje | Or-111 | Or-060 |
| J4 | Rood | Ro-138 | Ro-073 |
| J5 | Oranje | Or-098 | Or-059 |
| J6 | Oranje | Or-094 | Or-056 |
| J7 | Geel | Ge-132 | Ge-075 |
| J8 | Geel | Ge-116 | Ge-069 |
| J9 | Geel | Ge-119 | Ge-070 |
| J10 | Geel | Ge-126 | Ge-067 |
| J11 | Groen | Gr4-173 | Gr4-119 |
| J12 | Groen | Gr4-176 | Gr4-115 |
| J13 | Groen | Gr4-172 | Gr4-111 |
| J14 | Groen | Gr4-174 | Gr4-117 |
| J15 | Blauw | Bl4-084 | Bl4-059 |
| J16 | Blauw | Bl4-087 | Bl4-062 |
| J17 | Blauw | Bl4-088 | Bl4-063 |
| J18 | Blauw | — | Bl4-099 |
| U15-1 | U15 Hoofdklasse | U15-HK-08 | U15-HKD |
| U17-1 | U17 Hoofdklasse | U17-HK-07 | U17-HKD |
| U17-2 | U17 1e klasse | U17-1-11 | U17-1G |
| U19-1 | U19 Overgangsklasse | U19-OK-07 | U19-OKD |
| U19-2 | U19 2e klasse | U19-2-08 | U19-2E |

*Volledige data opgehaald op 2026-02-23. "—" = team is niet ingeschreven voor deze competitievorm.*

---

## Opslag in de plugin

| Wat | Pad |
|---|---|
| Ruwe API response | `data/leden/snapshots/raw/YYYY-MM-DD-knkv-teams.json` |
| Seizoens team-mapping | `data/seizoenen/YYYY-YYYY/teams-knkv.json` |

---

## Beperkingen

- **Geen spelersdata** — de API geeft alleen teamnamen en pools, geen spelerslijsten
- **Geen authenticatie** — publiek toegankelijk, geen API-key nodig
- **Rate limiting** — onbekend, gebruik verantwoord
- **Stabiliteit** — ongedocumenteerde API, kan wijzigen. Sla ruwe responses altijd op
- **API-versie** — v2 (ontdekt februari 2026)
- **Spelersdata** komt uit Sportlink CSV-exports, niet uit deze API

## Gebruik

- Skill: `/oranje-wit:knkv-api`
- Plugin-contract: `model/plugin-interface.yaml`
- Leden-verrijking: `/oranje-wit:lid-monitor` combineert Sportlink + KNKV API data
