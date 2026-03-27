# HANDSHAKE -- Jeugdontwikkeling (Sprint 1a: raamwerk v1.1 sync)

> **Domein:** Jeugdontwikkeling (`/jeugd/`)
> **Prioriteit:** #1 (andere apps lezen het raamwerk)
> **Status:** Raamwerk-editor werkend, maar seed-data wijkt af van v1.1

---

## Doel

De database-data en de beheer-UI exact in lijn brengen met het vaardigheidsraamwerk v1.1 (`docs/jeugdontwikkeling/vaardigheidsraamwerk-v1.1.md`). Zolang de data niet klopt, is alles downstream (scouting, evaluatie, spelerskaart) gebouwd op verkeerde items.

## Scope

### In scope

1. **Prisma schema uitbreiden**
   - Pijler: basispijlercodes BAL, BEWEGEN, SAMEN, IK toestaan (naast de volwassen codes)
   - OntwikkelItem: velden `gewicht` (Float, default 1.0), `classificatie` (String?, "KERN"/"ONDERSCHEIDEND"), `observatie` (String?, gedragsobservatie)
   - Leeftijdsgroep: velden `popPlezier`, `popOntwikkeling`, `popPrestatie` (Int?, POP-ratio)

2. **Seed-data herschrijven**
   - `scripts/import/seed-raamwerk.ts` herschrijven met alle 131 items uit v1.1
   - Correcte pijlercodes per band (BAL/BEWEGEN/SAMEN/IK voor Blauw)
   - Correcte item-ID's met laag-prefix (`sch_t_afstandsschot`, niet `sch_afstandsschot`)
   - Correcte schaaltypen (`duim` voor Blauw, `slider` voor Oranje/Rood)
   - Classificatie KERN/ONDERSCHEIDEND voor Rood
   - Gedragsobservaties voor MEN/SOC items

3. **actions.ts PIJLERS_PER_BAND updaten**
   - Blauw: BAL, BEWEGEN, SAMEN, IK
   - Groen: SCH, AAN, PAS, VER, FYS, IK
   - Geel: SCH, AAN, PAS, VER, FYS, MEN
   - Oranje: SCH, AAN, PAS, VER, FYS, MEN, SOC
   - Rood: SCH, AAN, PAS, VER, FYS, MEN, SOC

4. **UI uitbreiden**
   - Band-editor: toon laag-badge (T/Ta/M) per item
   - Band-editor: toon classificatie-badge (KERN/ONDERSCHEIDEND) voor Rood
   - Item-form: velden voor laag, classificatie, observatie
   - Groep-panel: toon POP-ratio

### Buiten scope

- USS-parameters (aparte sprint)
- Progressie-pagina (aparte sprint)
- Beoordeling-model (apart domein, afhankelijk van scouting/evaluatie)
- Scouting-app vragen-data sync (volgt automatisch als raamwerk klopt)

## Aannames

1. Het vaardigheidsraamwerk v1.1 is de single source of truth. Bij twijfel wint v1.1.
2. De bestaande seed is idempotent -- herschrijven en opnieuw draaien vervangt de data.
3. Pijlercodes BAL, BEWEGEN, SAMEN, IK zijn geldig naast de volwassen codes.
4. Het `laag`-veld in OntwikkelItem wordt gevuld voor Geel+ items.

## Risico's

| Risico | Mitigatie |
|---|---|
| Scouting-app leest nu hardcoded vragen-data, niet de DB | Scouting-app moet gemigreerd worden naar DB-items (aparte PR) |
| Bestaande beoordelingen gekoppeld aan oude item-ID's | Check of er al productie-beoordelingen zijn; zo ja, migratie-script |
| Migratie dropt geen data | Prisma migrate, niet db:push. Nieuwe velden zijn nullable/default. |

## Acceptatiecriteria

- [ ] Prisma schema heeft de 3 nieuwe velden op OntwikkelItem en 3 op Leeftijdsgroep
- [ ] Seed-data bevat exact 131 items (8+12+20+35+56) verdeeld over 5 banden
- [ ] Blauw heeft pijlers BAL, BEWEGEN, SAMEN, IK (niet FYS, PAS, MEN)
- [ ] Geel+ items hebben laag-prefix in item_code
- [ ] Rood items hebben classificatie KERN of ONDERSCHEIDEND
- [ ] actions.ts PIJLERS_PER_BAND matcht v1.1
- [ ] Band-editor toont lagen en classificatie
- [ ] Validatie-regels passen (geen ERROR's na seed)
- [ ] `pnpm db:generate` en `pnpm build` slagen

## Geschatte omvang

| Onderdeel | Inschatting |
|---|---|
| Schema-migratie | Klein (3 nullable velden + 3 nullable velden) |
| Seed-data herschrijven | Medium (131 items, zorgvuldig werk) |
| actions.ts update | Klein |
| UI uitbreidingen | Medium (badges, form-velden, POP-ratio) |
| **Totaal** | ~4-6 uur |
