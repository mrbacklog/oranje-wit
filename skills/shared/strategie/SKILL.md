---
name: strategie
description: Toont de roadmap voor het korfbal-technisch beleid project en het professionaliseringspad van de oranje-wit plugin.
user-invocable: true
---

# Plugin Strategie — c.k.v. Oranje Wit

## Focus

Korfbal-technisch (jeugd)beleid, jaarlijkse teamindeling en data-gedreven Verenigingsmonitor.

---

## Huidige fase: Model 2 — Lokale plugin

**Status:** Actief
**Installatie:** `claude plugin install "C:\Oranje Wit" --scope user`
**Updates:** Bestanden aanpassen in `C:\Oranje Wit\` → direct actief
**Geschikt voor:** 1 gebruiker, snelle iteratie, maximale eenvoud

---

## Volgende fase: Model 1 — GitHub-repo

**Wanneer:** Zodra meerdere mensen (TC-leden, trainers) de plugin gebruiken
**Stappen:**
1. GitHub-repository aanmaken: `github:antjanlaban/oranje-wit-plugin`
2. Plugin opnieuw installeren: `claude plugin install github:antjanlaban/oranje-wit-plugin --scope user`
3. Updates uitrollen per gebruiker: `claude plugin update oranje-wit`
4. Semantic versioning toevoegen aan `plugin.json`
5. Onboarding-handleiding voor TC-leden schrijven

**Voordelen:** Versiebeheer, rollback, teamdeling

---

## Toekomstige fase: Model 3 — GitHub Actions auto-sync

**Wanneer:** Meer gebruikers, handmatige updates worden onpraktisch

**Aanvullende stappen:**
- Auto-changelog uit commit-berichten
- Webhook-endpoint voor update-notificaties
- Optioneel: publicatie voor andere korfbalverenigingen

---

## Streefmodel jeugd

**Bestand:** `data/modellen/streef-ledenboog.json`

Retentie-gebaseerde projecties (v2.0) met drie horizonnen:
- **Huidig** (2025-2026): 185 jeugdleden, 22 teams
- **2028** (seizoen 2027-2028): 179 jeugdleden, 21 teams (realistisch, 24 nieuwe leden/jaar)
- **2030** (seizoen 2029-2030): 168 jeugdleden, 20 teams (realistisch)

Parameters: retentie per leeftijdsjaar (jeugdmodel v2.0), instroomverdeling (piek 8-9 jr), M/V 40%/60%, leeftijdsbanden Blauw 5-7 / Groen 8-9 / Geel 10-12 / Oranje 13-15 / Rood 16-18.

---

## Status per component

| Component | Agent | Skills | Data |
|---|---|---|---|
| Technisch beleid | `korfbal` | oranje-draad, jeugdmodel, teamsamenstelling | — |
| Seizoensplanning | `korfbal` | lid-monitor, ledenverloop, knkv-api, seizoen-blauwdruk, scenario-analyse | streef-ledenboog.json |
| Teamindeling | `team-selector` | team-indeling, teamsamenstelling | streef-ledenboog.json |
| Spelersanalyse | `speler-scout` | oranje-draad, jeugdmodel, ledenverloop | spelerspaden.json |
| Data-analyse & pipeline | `data-analist` | lid-monitor, ledenverloop, jeugdmodel, teamsamenstelling | alle aggregaties, spelerspaden, benchmark |
| Verenigingsmonitor | `data-analist` | lid-monitor, ledenverloop | dashboards (HTML), monitor-config.json |
