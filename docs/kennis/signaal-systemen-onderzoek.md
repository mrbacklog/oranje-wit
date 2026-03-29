# Onderzoek: Signaal/actie-systemen in andere domeinen

**Datum**: 2026-03-29
**Doel**: Onderbouwing voor het signaal/actie-design van c.k.v. Oranje Wit

---

## Meest relevante systemen

### 1. EWIMS (onderwijs) — geadopteerd als basis

Early Warning Intervention and Monitoring System. Gebruikt door scholen om uitval te voorkomen.

**Waarom relevant**: directe parallellen (leerling=speler, flag=signaal, interventie=actie, leraar/counselor/directeur=trainer/coordinator/TC). Het tiered model (85% standaard, 10% aandacht, 5% intensief) matcht onze realiteit.

**Geadopteerd**: EWIMS 7-stappen cyclus, tiered model, signaal-trechter.

**Bronnen**: [AIR EWIMS Guide](https://www.air.org/sites/default/files/2024-04/23-22124-High-School-EWIMS-Guide_FINAL.pdf), [Panorama Early Warning](https://www.panoramaed.com/solutions/early-warning-system), [MTSS Tiers](https://www.panoramaed.com/blog/mtss-tiers-tier-1-2-and-3-explained)

### 2. ITIL Incident Management — triage-model

**Geadopteerd**: Impact x Urgency matrix voor prioritering, parent-child patroon voor domino-ketens, stagnatie-escalatie.

**Bronnen**: [Freshworks ITIL](https://www.freshworks.com/itil/incident-management/), [ServiceNow Parent-Child](https://www.servicenow.com/community/itsm-blog/incident-tasks-vs-parent-child-incidents-knowing-when-to-use/ba-p/3401195)

### 3. Succession Planning (HR) — doorstroom en risico

**Geadopteerd**: flight risk concept (retentie + evaluatie + leeftijd = risico-score), readiness-tracking voor doorstroom, cascade-visualisatie.

**Bronnen**: [TalentGuard](https://www.talentguard.com/platform/succession-planning), [Anaplan What-If](https://www.anaplan.com/blog/answering-what-if-questions-in-hr-and-workforce-planning/)

### 4. Kitman Labs — spelerspaden

**Inspiratie**: structured player pathway door fases, geaggregeerde status-indicatoren, multi-domein evaluatie (technisch, tactisch, fysiek, mentaal, sociaal).

**Bronnen**: [Kitman Labs Talent Development](https://www.kitmanlabs.com/platform/talent-development/), [MLS Player Pathway](https://www.mlssoccer.com/news/mls-mls-next-pro-and-mls-next-expand-collaboration-with-kitman-labs-to-unify-and-optimize-player-pathway-data)

---

## Patronen die we overnemen

| Patroon | Bron | Toepassing bij OW |
|---|---|---|
| Tiered model (85/10/5%) | EWIMS/MTSS | STABIEL / AANDACHT / KRITIEK |
| Impact x Urgency matrix | ITIL | Signaal-prioritering |
| Parent-child propagatie | ServiceNow | Domino-keten: root oplossen → children bijwerken |
| Stagnatie-detectie | CRM pipeline | 4 weken zonder actie → escaleer |
| Re-assessment | Medische triage | Periodiek herbeoordelen, status kan stijgen of dalen |
| Flight risk score | HR succession | Retentie + evaluatie + leeftijd per speler |
| Signaal-trechter | Eigen synthese | Breed → gefilterd → actief → besloten per seizoensfase |

## Patronen die we bewust niet overnemen

| Patroon | Bron | Reden |
|---|---|---|
| 5-level triage | Medische triage | Overkill, 3 niveaus volstaat |
| DAG-workflows | Airflow | TC denkt in kettingen, niet in grafen |
| Per-event beschikbaarheid | TeamSnap/Spond | Wij werken seizoensbreed, niet per wedstrijd |
| ML-voorspelling | Teamworks Intelligence | Te weinig data, te kleine populatie |
| Push-notificaties | PagerDuty | Kleine doelgroep, email + in-app volstaat |
