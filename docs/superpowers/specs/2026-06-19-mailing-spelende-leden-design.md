# Design: Mailinglijst spelende leden via Sportlink API

**Datum:** 2026-06-19  
**Doel:** Exporteer alle emailadressen van spelende leden uit Sportlink en stuur hen een begeleidende mail over de voorlopige teamindeling 2026-2027.

---

## Scope

- Een discovery-script om Sportlink veldnamen te achterhalen
- Een exportscript dat een platte lijst van emailadressen uitspuugt (stdout)
- Een email-tekst (2-3 alinea's) als begeleidend schrijven

Versturing verloopt handmatig via het eigen mailprogramma van de gebruiker (BCC).

---

## Gedeelde auth

`scripts/sportlink-auth.mjs` — exporteert `sportlinkLogin()` en `navajoHeaders()`.  
Beide scripts importeren dit bestand. De bestaande login-logica in `check-mirthe.mjs` is het referentie-implementatie.

---

## Stap 1 — Discovery: `scripts/sportlink-discovery.mjs`

- Logt in bij Sportlink (Keycloak PKCE)
- Haalt de eerste 5 leden op via `SearchMembers`
- Print het volledige ruwe JSON-object per lid naar stdout
- Doel: veldnamen voor email (primair/secundair) en lidmaatschapstype vaststellen
- Wordt weggegooid na gebruik, of bewaard als dev-tool

Gebruik: `node scripts/sportlink-discovery.mjs`

---

## Stap 2 — Export: `scripts/export-mailing-spelende-leden.mjs`

- Logt in bij Sportlink
- Haalt alle leden op via `SearchMembers`
- Filtert op spelende lidmaatschapstypes (lijst bepaald na discovery)
- Extraheert primair + secundair emailadres per lid
- Dedupliceert de volledige lijst
- Schrijft één emailadres per regel naar stdout

Gebruik: `node scripts/export-mailing-spelende-leden.mjs > mailinglijst.txt`

Exacte veldnamen (voor email en lidmaatschapstype) worden ingevuld na de discovery-run.

---

## Email-tekst (begeleidend schrijven)

2-3 alinea's. Bevat:
- Korte aankondiging: de voorlopige teamindeling 2026-2027 staat online
- Wat leden op de pagina kunnen vinden (toelichting, teams, kennismaking, kalender, TC-oproep)
- Duidelijke link: https://teamindeling.ckvoranjewit.app/teamindeling

Tekst wordt opgesteld na de discovery-run zodat we de actuele inhoud van de toelichtingspagina kunnen gebruiken.

---

## Volgorde

1. Schrijf `sportlink-auth.mjs`
2. Schrijf + draai `sportlink-discovery.mjs` → bekijk veldnamen
3. Schrijf `export-mailing-spelende-leden.mjs` op basis van gevonden veldnamen
4. Draai exportscript → `mailinglijst.txt`
5. Stel email-tekst op
