# Daisy-coach analyses

Dit is het logboek van `daisy-coach` — de AI-communicatie specialist voor Daisy.
Elk bestand in deze map documenteert één observatie, diagnose of interventie.

## Bestandsnaam

`analyse-YYYY-MM-DD-<kort-onderwerp>.md`

Bijvoorbeeld: `analyse-2026-04-15-niet-ingedeelde-spelers.md`

## Verplichte structuur

```markdown
# Analyse: <titel>

**Datum:** YYYY-MM-DD
**Aanleiding:** <wie/wat triggerde deze analyse>
**Bronnen:** <welke gesprek-id's of bestanden werden bestudeerd>

## Wat ik zag

<concrete observaties, eventueel geciteerd uit gesprekken>

## Welk patroon

<diagnose-vocabulaire uit gesprekken-analyse.md: improvisatie, ID-leak,
statusdrift, bron-mix, context-kwijt, hallucinatie, stijldrift>

## Welke regel raakt dit

<verwijzing naar prompt-patterns, tool-descriptions of ow-output-contract>

## Voorgestelde wijziging

<wat ik ga schrijven in daisy.ts of tool-descriptions, met snippets>

## Verificatie

<welke reproductie-vragen, wat het verwachte nieuwe gedrag is>

## Vervolgcheck

**Datum:** YYYY-MM-DD (meestal +7 of +14 dagen na deploy)
**Check:** <wat te verifiëren in gesprekken van na die datum>
```

## Wie schrijft hier?

Alleen `daisy-coach` (via aanroep door Antjan, product-owner, ontwikkelaar
of korfbal). Andere agents of devs laten deze map met rust.
