# KNKV Kwartaalcijfers — JSON-schema

Verwacht bestandsformaat voor handmatig ingevoerde KNKV-ledencijfers per kwartaal.

## Bestandsnaam

`YYYY-QN.json` — bijvoorbeeld `2025-Q3.json` voor het derde kwartaal van 2025.

## JSON-structuur

```json
{
  "_meta": {
    "bron": "KNKV Kennisbank Ledencijfers",
    "url": "https://www.knkv.nl/kennisbank/ledencijfers/",
    "peildatum": "2025-10-01",
    "kwartaal": "2025-Q3",
    "ingevoerd_op": "2026-02-24",
    "opmerking": "Handmatig overgenomen uit KNKV PDF"
  },
  "landelijk": {
    "totaal_leden": 58000,
    "jeugd": 32000,
    "senioren": 26000,
    "groei_tov_vorig_kwartaal": -1.2,
    "groei_tov_vorig_jaar": -2.5
  },
  "verenigingen": [
    {
      "naam": "Oranje Wit",
      "regio": "Zuid-Holland",
      "totaal_leden": 264,
      "jeugd": 180,
      "senioren": 84,
      "groei_tov_vorig_kwartaal": 2.3,
      "groei_tov_vorig_jaar": 5.1
    },
    {
      "naam": "DeetosSnel",
      "regio": "Zuid-Holland",
      "totaal_leden": null,
      "jeugd": null,
      "senioren": null,
      "groei_tov_vorig_kwartaal": null,
      "groei_tov_vorig_jaar": null
    }
  ]
}
```

## Veldverklaring

| Veld | Type | Verplicht | Toelichting |
|---|---|---|---|
| `_meta.peildatum` | string (YYYY-MM-DD) | Ja | Datum waarop de cijfers betrekking hebben |
| `_meta.kwartaal` | string (YYYY-QN) | Ja | Kwartaal-aanduiding |
| `_meta.ingevoerd_op` | string (YYYY-MM-DD) | Ja | Datum van handmatige invoer |
| `landelijk.totaal_leden` | integer | Ja | Totaal aantal KNKV-leden landelijk |
| `landelijk.jeugd` | integer | Nee | Jeugdleden landelijk |
| `landelijk.senioren` | integer | Nee | Seniorenleden landelijk |
| `landelijk.groei_tov_vorig_kwartaal` | float (%) | Nee | Groeipercentage t.o.v. vorig kwartaal |
| `landelijk.groei_tov_vorig_jaar` | float (%) | Nee | Groeipercentage t.o.v. zelfde kwartaal vorig jaar |
| `verenigingen[].naam` | string | Ja | Verenigingsnaam zoals in KNKV-data |
| `verenigingen[].regio` | string | Nee | KNKV-regio |
| `verenigingen[].totaal_leden` | integer/null | Ja | Totaal leden, `null` als onbekend |
| `verenigingen[].jeugd` | integer/null | Nee | Jeugdleden |
| `verenigingen[].senioren` | integer/null | Nee | Seniorenleden |
| `verenigingen[].groei_tov_vorig_kwartaal` | float/null | Nee | Groei % t.o.v. vorig kwartaal |
| `verenigingen[].groei_tov_vorig_jaar` | float/null | Nee | Groei % t.o.v. vorig jaar |

## Gebruik

- Voeg minimaal de eigen vereniging en de concurrenten uit `config.json` toe
- Gebruik `null` voor onbekende waarden — nooit schatten
- Ruwe PDF-bronbestanden opslaan in `raw/` met naam `YYYY-QN-knkv-ledencijfers.pdf`
- De ledenverloop-skill parsed deze bestanden automatisch bij benchmarkanalyse
