# Gesprekken-analyse voor Daisy-coach

Hoe je echte gesprekken uit productie leest, patronen herkent en vertaalt
naar een prompt-wijziging.

## Gesprekken ophalen

Het bestaande script `scripts/query-daisy-gesprekken.ts` haalt de laatste 10
gesprekken van echte gebruikers op (geen service-gesprekken).

**Aanroep met productie-DB via shinkansen proxy:**

```bash
PROD_DB="postgresql://postgres:owdb2026secret@shinkansen.proxy.rlwy.net:18957/oranjewit"
DATABASE_URL="$PROD_DB" pnpm tsx scripts/query-daisy-gesprekken.ts
```

De URL haal je uit Railway:

```bash
railway variables --service Postgres | grep -E "RAILWAY_TCP_PROXY_DOMAIN|RAILWAY_TCP_PROXY_PORT"
```

Of laat Antjan 'm voor je opzoeken — de credentials staan niet in versiebeheer.

## Output lezen

Per gesprek krijg je:

- Gesprek-id (nodig voor citaties)
- User-id (TC-e-mail of service)
- Start en laatste update
- Aantal berichten
- Alle berichten met rol (GEBRUIKER / ASSISTENT / SYSTEEM / TOOL) en inhoud

Lees minstens 3 gesprekken die raken aan de opdracht. Zoek op gebruikersnaam,
datum of trefwoord.

## Patroon-vocabulaire

Iedere observatie in een analyse-document krijgt een label uit deze lijst.
Dat maakt analyses over tijd vergelijkbaar.

### Improvisatie
Daisy heeft geen directe tool voor de vraag en kiest er een die er "een
beetje" op lijkt. Symptoom: de tool-naam in het antwoord past niet bij wat de
gebruiker vroeg.

### ID-leak
Daisy toont interne ID's (rel_codes, versie-id's, team-id's) waar een naam
verwacht werd. Symptoom: rijen met `NN...`-codes.

### Statusdrift
Daisy gebruikt status-filters die niet stroken met de bedoeling. Symptoom:
spelers ontbreken of zijn juist overmatig aanwezig in een lijst vergeleken
met wat de gebruiker verwacht.

### Bron-mix
Daisy pakt data uit meerdere bronnen door elkaar (bv. werkindeling +
competitiedata). Symptoom: namen uit bron A met scores uit bron B, of een
lijst waar de herkomst onduidelijk is.

### Context-kwijt
Daisy herinnert zich iets uit een vroeger bericht niet meer. Symptoom:
tegenstrijdigheid tussen twee antwoorden in hetzelfde gesprek, of de melding
"ik heb geen geheugen van vorige gesprekken" terwijl het zelfde gesprek nog
loopt.

### Hallucinatie
Daisy noemt data die nergens uit een tool-aanroep komt. Symptoom: waarden
of namen die niet in een tool-response te herleiden zijn.

### Stijldrift
Daisy wijkt af van de opmaak-regels: geen tabel waar hij hoort, of juist een
tabel voor één item, of te veel proza. Symptoom: antwoorden die lang voelen
of moeilijk te scannen zijn.

## Van patroon naar wijziging

| Patroon        | Eerste hypothese                           | Waar de wijziging landt                    |
|----------------|--------------------------------------------|--------------------------------------------|
| Improvisatie   | Missende tool of slecht afgebakende description | Escaleer naar ontwikkelaar voor nieuwe tool; ondertussen een prompt-regel |
| ID-leak        | Prompt laat toonregel weg                  | `ow-output-contract.md` + daisy.ts identificatie-regel |
| Statusdrift    | Prompt legt statussen niet uit             | `ow-output-contract.md` statusmatrix in daisy.ts |
| Bron-mix       | Twee tool-descriptions overlappen          | `tool-descriptions.md` grens-zin |
| Context-kwijt  | Gesprek-id wordt niet doorgestuurd         | Escaleer naar ontwikkelaar (client-side) |
| Hallucinatie   | Uitweg ontbreekt ("ik weet dit niet")      | `prompt-patterns.md` instructie met uitweg |
| Stijldrift     | Opmaak-regels niet expliciet genoeg        | `ow-output-contract.md` opmaak-tabel |

## Citeren in het analyse-document

Gebruik blockquotes en vermeld de gesprek-id:

```markdown
Gesprek `cmnyxaw3j`:

> **GEBRUIKER:** Wie zit er in S1?
> **ASSISTENT:** Hier zijn de spelers: NNH73P8, NNG90V0, ...

Dit is een klassieke **ID-leak** — de tool gaf wél namen terug maar Daisy
koos de rel_code-kolom.
```

Vermeld altijd de datum van het gesprek, want oudere citaties zijn minder
representatief voor de huidige Daisy.

## Pre-empirische analyses

Als er minder dan 3 relevante gesprekken zijn, schrijf je een analyse met
de markering **"pre-empirisch"** bovenaan. Je vervolgcheck-datum ligt dan
vroeger (bv. 7 dagen na deploy) en je hypothese wordt expliciet getoetst
zodra er wel data is.

## Privacy

Gesprekken bevatten de voor- en achternaam van TC-leden in de `userId`
(e-mail). Laat dit staan in analyse-documenten want dat is intern bruikbare
informatie. Let wel op:

- Geen persoonsgegevens van minderjarigen citeren buiten roepnaam
- Geen BSN, geboortedatum of adres (Daisy mag die niet tonen, dus ze horen
  niet in gesprekken — als ze er wel staan, is dat een bug en escaleer je)

## Checklist bij een analyse

- [ ] Minstens 3 gesprekken gelezen (of pre-empirisch gemarkeerd)
- [ ] Elk patroon gelabeld uit het vocabulaire hierboven
- [ ] Citaties met gesprek-id
- [ ] Van elk patroon: eerste hypothese en waar de wijziging landt
- [ ] Vervolgcheck-datum ingevuld
