# Prompt-patterns voor Daisy

Hoe je een systeemprompt opbouwt, wijzigt en onderhoudt voor een LLM-assistent
in een data-gedreven applicatie zoals TI Studio.

## Mentaal model: vijf lagen van een LLM-prompt

Denk bij onderhoud van [apps/ti-studio/src/lib/ai/daisy.ts](../../../../apps/ti-studio/src/lib/ai/daisy.ts)
in deze vijf lagen. Ze zijn niet allemaal met exact deze kopjes in de huidige
code aanwezig, maar elke bestaande sectie is terug te voeren op één van deze
vijf. Gebruik dit als kapstok om te bepalen waar een nieuwe regel hoort.

1. **Identiteit** — wie is Daisy (naam, rol, toon)
2. **Context** — seizoen, huidige gebruiker, werkindeling
3. **Regels** — wat mag en wat niet (privacy, taal, databronnen)
4. **Domein-kennis** — glossary, statusmatrix, teamreferenties
5. **Tool-gebruik** — hoe Daisy tools moet kiezen en aankondigen

Als je een structurele opruiming doet, mag je de markdown-koppen in daisy.ts
gelijktrekken met deze lagen — documenteer dat dan expliciet in het
analyse-document zodat iedereen dezelfde kapstok blijft gebruiken.

## Anti-patronen in systeemprompts

### Dubbele negatives

Slecht:
> "Vermeld niet geen namen als het niet expliciet gevraagd is"

Goed:
> "Vermeld altijd de naam. Voeg alleen het relatienummer toe als de gebruiker
> daar expliciet om vraagt."

### Conflicterende regels

Als twee regels elkaar tegenspreken, kiest de LLM willekeurig welke hij volgt.
Voorbeeld:
- "Houd antwoorden bondig"
- "Geef altijd onderbouwing bij elk advies"

Oplossing: maak de voorwaarde expliciet.
> "Houd antwoorden bondig. Geef onderbouwing alleen wanneer de gebruiker daar
> om vraagt of wanneer je advies impliceert dat er een besluit wordt genomen."

### Ambigue instructies

Slecht:
> "Toon de belangrijkste informatie"

Goed:
> "Toon per speler: naam, leeftijd volgend seizoen, status, huidig team, USS.
> Laat rel_code, geboortedatum en e-mail weg."

### Instructies zonder uitweg

Als je zegt "Verzin NOOIT data", moet je er bij zeggen wat de LLM dan WEL
mag doen. Anders gaat hij alsnog hallucineren omdat hij geen alternatief kent.

Goed:
> "Verzin NOOIT data. Als je iets niet weet, zeg dat expliciet: 'ik zie dat
> niet in de werkindeling'. Gebruik daarna een tool om op te zoeken."

## Wanneer voorbeelden (few-shot) helpen

Voeg voorbeelden toe wanneer:

- Een vraag meerdere plausibele antwoord-vormen heeft en je één wilt
  standaardiseren
- De output-structuur specifiek is (bv. tabel-opmaak)
- De LLM in gesprekken consistent de verkeerde tool koos bij een type vraag

Voeg GEEN voorbeelden toe wanneer:

- De regel al duidelijk is uit een enkele instructie
- Het voorbeeld een edge case is die zelden voorkomt
- Je twijfelt of het voorbeeld wel correct is (slecht voorbeeld erger dan geen)

Voorbeelden voegt je toe als codeblok of genummerd rijtje in de prompt-laag
"Tool-gebruik", niet verspreid door de prompt.

## Waar plaats je domeinkennis

| Type kennis               | Vorm                | Plaats in prompt |
|---------------------------|---------------------|------------------|
| Termen + betekenis        | Glossary-tabel      | Laag 4           |
| Statuscategorieën         | Matrix met kolommen | Laag 4           |
| KNKV-regels               | Bullets             | Laag 4 of link   |
| Hoe tool X te gebruiken   | Eén zin per tool    | Laag 5           |
| "Wanneer welke tool"      | Decision-tree       | Laag 5           |
| Seizoenscontext           | Dynamisch berekend  | Laag 2           |

## XML-tags vs markdown-secties

Claude reageert goed op XML-tags voor instructie-structuur. Voor vaste
regels gebruik je `<regel>...</regel>` blokjes of `<voorbeeld>...</voorbeeld>`.

Voor lange secties (glossary, matrix) werkt markdown beter, omdat dat
leesbaar blijft als jullie iemand in de toekomst de prompt gaat bijwerken.

In Daisy's huidige prompt gebruiken we markdown. Wissel niet halverwege.

## Checklist bij een prompt-wijziging

- [ ] Is de nieuwe regel eenduidig en zonder dubbele negatives?
- [ ] Is er een uitweg (wat MAG de LLM in plaats daarvan)?
- [ ] Is de regel in de juiste laag geplaatst?
- [ ] Botst hij met een bestaande regel? Zo ja, maak de voorwaarde expliciet
- [ ] Is er een voorbeeld nodig? Alleen toevoegen als de instructie zelf niet
      volstaat
- [ ] Heb je de wijziging gereproduceerd met een testvraag tegen lokaal?
