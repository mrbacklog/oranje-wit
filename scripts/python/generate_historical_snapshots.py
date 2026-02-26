"""
Genereer historische ledensnapshots uit spelerspaden.json.

Leest de volledige spelerspaden dataset (1.152 spelers, 16 seizoenen) en genereert
per seizoen een JSON-snapshot in exact hetzelfde formaat als de bestaande
Supersheet-derived snapshots in data/leden/snapshots/.

Seizoenen waarvoor al een snapshot bestaat worden overgeslagen.

Gebruik: python scripts/generate_historical_snapshots.py
"""

import json
import os
import re
from datetime import date

ROOT = r"C:\Oranje Wit"
SPELERS_PATH = os.path.join(ROOT, "data", "spelers", "spelerspaden.json")
MAPPING_PATH = os.path.join(ROOT, "data", "modellen", "categorie-mapping.json")
SNAPSHOTS_DIR = os.path.join(ROOT, "data", "leden", "snapshots")
AGGREGATIES_DIR = os.path.join(ROOT, "data", "aggregaties")

# Tussenvoegsel-woordenlijst
TUSSENVOEGSELS = {
    "van", "de", "den", "der", "het", "ten", "ter", "in", "t", "'t",
    "vd", "v/d", "op", "bij", "aan",
}


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(data, path):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  >> {path}")


def seizoen_to_snapshot_datum(seizoen):
    """2021-2022 -> 2021-06-01 (volgt bestaande conventie)."""
    jaar = int(seizoen.split("-")[0])
    return f"{jaar}-06-01"


def seizoen_to_peildatum_jaar(seizoen):
    """2021-2022 -> 2022 (31 december van het eerste jaar = peildatum leeftijd)."""
    return int(seizoen.split("-")[0])


# --- Naam-parsing ---

def parse_naam(naam_raw, roepnaam_field):
    """Parse spelerspaden naam-formaat naar (achternaam, tussenvoegsel, roepnaam).

    Formaten:
      "Naaktgeboren, D.J."         -> ("Naaktgeboren", None, roepnaam_field)
      "Wit, B. de"                 -> ("Wit", "de", roepnaam_field)
      "Groot, S. (Senna) de"       -> ("Groot", "de", "Senna" of roepnaam_field)
      "Oppe-van den Broek, Monique"-> ("Oppe-van den Broek", None, "Monique")
      "Voornaam Achternaam"        -> ("Achternaam", None, "Voornaam")
    """
    if not naam_raw:
        return ("", None, roepnaam_field or "")

    naam = naam_raw.strip()

    if "," not in naam:
        # Formaat: "Voornaam Achternaam" of "Voornaam van Achternaam"
        parts = naam.split()
        if len(parts) >= 2:
            return (parts[-1], None, parts[0])
        return (naam, None, roepnaam_field or "")

    # Comma-formaat: "Achternaam, Rest"
    ach_raw, rest = naam.split(",", 1)
    ach_raw = ach_raw.strip()
    rest = rest.strip()

    # Extraheer roepnaam uit haakjes: "(Senna)"
    roepnaam_match = re.search(r'\(([^)]+)\)', rest)
    extracted_roepnaam = roepnaam_match.group(1) if roepnaam_match else None

    # Check trailing tussenvoegsels in rest: "B. de" -> tussenvoegsel = "de"
    rest_words = rest.split()
    trailing_tv = []
    for w in reversed(rest_words):
        if w.lower().rstrip(".") in TUSSENVOEGSELS or w.lower() in TUSSENVOEGSELS:
            trailing_tv.insert(0, w)
        else:
            break

    tussenvoegsel = " ".join(trailing_tv) if trailing_tv else None

    # Gebruik roepnaam-veld als prioriteit, anders extraheer uit naam
    roepnaam = roepnaam_field or extracted_roepnaam or ""

    return (ach_raw, tussenvoegsel, roepnaam)


# --- Categorie -> Kleur mapping ---

def build_categorie_to_kleur(mapping):
    """Bouw lookup van spelerspaden-categorie naar kleur/band."""
    cat_to_band = mapping.get("categorie_naar_band", {})
    # Map van volledige categorie-naam naar band
    result = {
        "F-Pupillen": cat_to_band.get("F", {}).get("band", "Blauw"),
        "E-Pupillen": cat_to_band.get("E", {}).get("band", "Groen"),
        "D-Pupillen": cat_to_band.get("D", {}).get("band", "Geel"),
        "C-Aspiranten": cat_to_band.get("C", {}).get("band", "Oranje"),
        "B-Aspiranten": cat_to_band.get("B", {}).get("band", "Rood"),
        "A-Junioren": cat_to_band.get("A", {}).get("band", "Rood"),
        "Senioren": cat_to_band.get("S", {}).get("band", "Senioren"),
        "Kangoeroes": cat_to_band.get("K", {}).get("band", "Kangoeroe"),
        "Jeugd": None,  # Moet afgeleid worden uit team of leeftijd
    }
    return result


def determine_kleur(categorie, team, geboortejaar, peildatum_jaar, cat_kleur_map):
    """Bepaal kleur/band voor een speler."""
    # Eerst proberen via categorie-mapping
    if categorie and categorie in cat_kleur_map:
        kleur = cat_kleur_map[categorie]
        if kleur:
            return kleur

    # Fallback: afleiden uit team-code
    if team:
        t = team.upper()
        if t.startswith("F") or t.startswith("K"):
            return "Blauw"
        if t.startswith("E"):
            return "Groen"
        if t.startswith("D"):
            return "Geel"
        if t.startswith("C"):
            return "Oranje"
        if t.startswith("B"):
            return "Rood"
        if t.startswith("A"):
            return "Rood"
        if t.startswith("S") or t.startswith("MW") or t == "SENIOREN" or t.startswith("JOW"):
            return "Senioren"
        # Nieuw systeem (J-teams, U-teams)
        if t.startswith("J") or t.startswith("OW J"):
            # Afleiden uit leeftijd als geboortejaar beschikbaar
            if geboortejaar and peildatum_jaar:
                leeftijd = peildatum_jaar - geboortejaar
                if leeftijd <= 7:
                    return "Blauw"
                if leeftijd <= 9:
                    return "Groen"
                if leeftijd <= 12:
                    return "Geel"
                if leeftijd <= 15:
                    return "Oranje"
                return "Rood"
        if t.startswith("U1"):
            return "Rood"

    # Laatste fallback: leeftijd
    if geboortejaar and peildatum_jaar:
        leeftijd = peildatum_jaar - geboortejaar
        if leeftijd <= 5:
            return "Kangoeroe"
        if leeftijd <= 7:
            return "Blauw"
        if leeftijd <= 9:
            return "Groen"
        if leeftijd <= 12:
            return "Geel"
        if leeftijd <= 15:
            return "Oranje"
        if leeftijd <= 18:
            return "Rood"
        return "Senioren"

    return None


def bepaal_betrouwbaarheid(seizoen):
    """Bepaal betrouwbaarheidslabel op basis van seizoen.

    2018+: hoog (A2 formulieren + Supersheets met Sportlink Rel.nr's)
    2013-2017: matig (Opstellingen met geboortedatum, naam-matching)
    <2013: beperkt (Opstellingen zonder geboortedatum)
    """
    jaar = int(seizoen.split("-")[0])
    if jaar >= 2018:
        return "hoog"
    if jaar >= 2013:
        return "matig"
    return "beperkt"


def generate_snapshot(spelers, seizoen, cat_kleur_map):
    """Genereer een snapshot-JSON voor één seizoen."""
    snapshot_datum = seizoen_to_snapshot_datum(seizoen)
    peildatum_jaar = seizoen_to_peildatum_jaar(seizoen)

    leden = []
    stats = {"totaal": 0, "met_geboortejaar": 0, "met_geslacht": 0}

    for speler in spelers:
        if seizoen not in speler["seizoenen"]:
            continue

        sz_info = speler["seizoenen"][seizoen]
        team = sz_info.get("team")
        categorie_oud = sz_info.get("categorie")

        # Parse naam
        achternaam, tussenvoegsel, roepnaam = parse_naam(
            speler.get("naam"), speler.get("roepnaam")
        )

        # Geboortejaar
        geboortejaar = None
        if speler.get("geboortedatum"):
            try:
                geboortejaar = int(speler["geboortedatum"][:4])
            except (ValueError, TypeError):
                pass

        # Leeftijd op peildatum
        leeftijd = None
        if geboortejaar:
            leeftijd = peildatum_jaar - geboortejaar

        # Geslacht
        geslacht = speler.get("geslacht") or None

        # Kleur
        kleur = determine_kleur(categorie_oud, team, geboortejaar, peildatum_jaar, cat_kleur_map)

        # Statistieken
        stats["totaal"] += 1
        if geboortejaar:
            stats["met_geboortejaar"] += 1
        if geslacht:
            stats["met_geslacht"] += 1

        lid = {
            "rel_code": speler["speler_id"],
            "roepnaam": roepnaam or None,
            "achternaam": achternaam or None,
            "tussenvoegsel": tussenvoegsel,
            "geslacht": geslacht,
            "geboortejaar": geboortejaar,
            "lidsoort": None,
            "spelactiviteit": "korfbal",
            "lid_sinds": None,
            "status": "actief",
            "team": team,
            "teamrol": None,
            "categorie": None,  # a/b niet van toepassing op oude seizoenen
            "kleur": kleur,
            "pool_veld": None,
            "pool_zaal": None,
            "a_categorie": None,
            "a_jaars": None,
            "leeftijd_peildatum": leeftijd,
        }
        leden.append(lid)

    # Sorteer op achternaam
    leden.sort(key=lambda l: (l["achternaam"] or "", l["roepnaam"] or ""))

    betrouwbaarheid = bepaal_betrouwbaarheid(seizoen)
    pct_geboortejaar = round(100 * stats["met_geboortejaar"] / stats["totaal"], 1) if stats["totaal"] else 0
    pct_geslacht = round(100 * stats["met_geslacht"] / stats["totaal"], 1) if stats["totaal"] else 0

    snapshot = {
        "_meta": {
            "snapshot_datum": snapshot_datum,
            "seizoen": seizoen,
            "bronnen": ["data/spelers/spelerspaden.json"],
            "totaal_leden": stats["totaal"],
            "totaal_spelers": stats["totaal"],
            "bron_type": "spelerspaden",
            "betrouwbaarheid": betrouwbaarheid,
            "datakwaliteit": {
                "geboortejaar_pct": pct_geboortejaar,
                "geslacht_pct": pct_geslacht,
            },
        },
        "leden": leden,
    }
    return snapshot


def generate_aggregaties(snapshot, seizoen):
    """Genereer per-geboortejaar, per-kleur, per-team aggregaties voor een snapshot."""
    snapshot_datum = seizoen_to_snapshot_datum(seizoen)
    leden = snapshot["leden"]

    # --- Per geboortejaar ---
    gj_data = {}
    for lid in leden:
        gj = lid["geboortejaar"]
        gs = lid["geslacht"]
        if gj and gs:
            key = (gj, gs)
            if key not in gj_data:
                gj_data[key] = {"geboortejaar": gj, "geslacht": gs, "aantal": 0,
                                "a_categorie": None, "a_jaars": None,
                                "streef": None, "vulgraad": None, "signalering": None}
            gj_data[key]["aantal"] += 1

    per_geboortejaar = sorted(gj_data.values(), key=lambda x: (x["geboortejaar"], x["geslacht"]))

    # --- Per kleur ---
    kleur_data = {}
    for lid in leden:
        kleur = lid["kleur"]
        gs = lid["geslacht"]
        team = lid["team"]
        if kleur:
            if kleur not in kleur_data:
                kleur_data[kleur] = {"kleur": kleur, "categorie": None, "teams": set(),
                                     "spelers_M": 0, "spelers_V": 0, "totaal": 0,
                                     "leeftijden": []}
            kleur_data[kleur]["totaal"] += 1
            if gs == "M":
                kleur_data[kleur]["spelers_M"] += 1
            elif gs == "V":
                kleur_data[kleur]["spelers_V"] += 1
            if team:
                kleur_data[kleur]["teams"].add(team)
            if lid["leeftijd_peildatum"]:
                kleur_data[kleur]["leeftijden"].append(lid["leeftijd_peildatum"])

    per_kleur = []
    for k, v in sorted(kleur_data.items()):
        gem_leeftijd = round(sum(v["leeftijden"]) / len(v["leeftijden"]), 1) if v["leeftijden"] else None
        per_kleur.append({
            "kleur": k,
            "categorie": v["categorie"],
            "teams": len(v["teams"]),
            "spelers_M": v["spelers_M"],
            "spelers_V": v["spelers_V"],
            "totaal": v["totaal"],
            "gem_leeftijd": gem_leeftijd,
        })

    # --- Per team ---
    team_data = {}
    for lid in leden:
        team = lid["team"]
        gs = lid["geslacht"]
        if team:
            if team not in team_data:
                team_data[team] = {"team": team, "categorie": None, "kleur": lid["kleur"],
                                   "niveau": None, "spelers_M": 0, "spelers_V": 0,
                                   "totaal": 0, "leeftijden": []}
            team_data[team]["totaal"] += 1
            if gs == "M":
                team_data[team]["spelers_M"] += 1
            elif gs == "V":
                team_data[team]["spelers_V"] += 1
            if lid["leeftijd_peildatum"]:
                team_data[team]["leeftijden"].append(lid["leeftijd_peildatum"])

    per_team = []
    for t, v in sorted(team_data.items()):
        gem_leeftijd = round(sum(v["leeftijden"]) / len(v["leeftijden"]), 1) if v["leeftijden"] else None
        per_team.append({
            "team": t,
            "categorie": v["categorie"],
            "kleur": v["kleur"],
            "niveau": v["niveau"],
            "spelers_M": v["spelers_M"],
            "spelers_V": v["spelers_V"],
            "totaal": v["totaal"],
            "gem_leeftijd": gem_leeftijd,
        })

    return per_geboortejaar, per_kleur, per_team


def main():
    print("=" * 60)
    print("Historische snapshots genereren uit spelerspaden.json")
    print("=" * 60)

    # Laad data
    spelers = load_json(SPELERS_PATH)
    mapping = load_json(MAPPING_PATH)
    cat_kleur_map = build_categorie_to_kleur(mapping)

    print(f"\n  Geladen: {len(spelers)} spelers uit spelerspaden.json")

    # Bepaal alle seizoenen in de dataset
    alle_seizoenen = sorted(set(
        sz for sp in spelers for sz in sp["seizoenen"]
    ))
    print(f"  Seizoenen in dataset: {alle_seizoenen[0]} t/m {alle_seizoenen[-1]} ({len(alle_seizoenen)} seizoenen)")

    # Check welke snapshots al bestaan
    bestaande = set()
    for f in os.listdir(SNAPSHOTS_DIR):
        if f.endswith(".json") and not os.path.isdir(os.path.join(SNAPSHOTS_DIR, f)):
            bestaande.add(f)

    # Genereer per seizoen
    os.makedirs(SNAPSHOTS_DIR, exist_ok=True)
    os.makedirs(AGGREGATIES_DIR, exist_ok=True)

    gegenereerd = 0
    overgeslagen = 0

    for seizoen in alle_seizoenen:
        snapshot_datum = seizoen_to_snapshot_datum(seizoen)
        filename = f"{snapshot_datum}.json"

        if filename in bestaande:
            print(f"\n  {seizoen}: {filename} bestaat al, overgeslagen")
            overgeslagen += 1
            continue

        print(f"\n  {seizoen}: genereren...")
        snapshot = generate_snapshot(spelers, seizoen, cat_kleur_map)
        meta = snapshot["_meta"]

        # Sla snapshot op
        snapshot_path = os.path.join(SNAPSHOTS_DIR, filename)
        save_json(snapshot, snapshot_path)

        # Genereer aggregaties
        per_gj, per_kleur, per_team = generate_aggregaties(snapshot, seizoen)

        save_json(per_gj, os.path.join(AGGREGATIES_DIR, f"{snapshot_datum}-per-geboortejaar.json"))
        save_json(per_kleur, os.path.join(AGGREGATIES_DIR, f"{snapshot_datum}-per-kleur.json"))
        save_json(per_team, os.path.join(AGGREGATIES_DIR, f"{snapshot_datum}-per-team.json"))

        print(f"    {meta['totaal_spelers']} spelers | "
              f"geboortejaar {meta['datakwaliteit']['geboortejaar_pct']}% | "
              f"geslacht {meta['datakwaliteit']['geslacht_pct']}% | "
              f"betrouwbaarheid: {meta['betrouwbaarheid']}")

        gegenereerd += 1

    # Samenvatting
    print(f"\n{'=' * 60}")
    print(f"KLAAR")
    print(f"{'=' * 60}")
    print(f"  Gegenereerd: {gegenereerd} snapshots + aggregaties")
    print(f"  Overgeslagen: {overgeslagen} (bestonden al)")
    print(f"  Totaal snapshots: {gegenereerd + overgeslagen + len(bestaande)}")

    if gegenereerd > 0:
        print(f"\n  Volgende stap: draai de downstream analyses opnieuw:")
        print(f"    node scripts/bereken-verloop.js")
        print(f"    node scripts/bereken-cohorten.js")
        print(f"    python scripts/seizoensvergelijking.py")
        print(f"    node scripts/genereer-signalering.js")


if __name__ == "__main__":
    main()
