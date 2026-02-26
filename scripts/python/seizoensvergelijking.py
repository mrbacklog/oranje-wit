"""
Genereer cross-seizoen vergelijkingsaggregatie uit alle beschikbare snapshots.

Leest alle snapshots uit data/leden/snapshots/ en genereert:
- data/aggregaties/seizoensvergelijking.json

Gebruik:
  python scripts/seizoensvergelijking.py
"""

import json
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parent.parent
SNAPSHOTS_DIR = ROOT / "data" / "leden" / "snapshots"
OUTPUT_FILE = ROOT / "data" / "aggregaties" / "seizoensvergelijking.json"
MAPPING_FILE = ROOT / "data" / "modellen" / "categorie-mapping.json"

# Band-leeftijden voor kleur-toewijzing op basis van leeftijd
BAND_RANGES = {
    "Kangoeroe": (4, 5),
    "Blauw": (6, 7),
    "Groen": (8, 9),
    "Geel": (10, 12),
    "Oranje": (13, 15),
    "Rood": (16, 18),
    "Senioren": (19, 99),
}


def leeftijd_naar_band(leeftijd):
    """Bepaal band op basis van leeftijd."""
    if leeftijd is None:
        return None
    for band, (lo, hi) in BAND_RANGES.items():
        if lo <= leeftijd <= hi:
            return band
    return None


def load_snapshots():
    """Laad alle snapshot-bestanden, 1 per seizoen.

    Bij meerdere snapshots voor hetzelfde seizoen:
    supersheet-bron heeft voorkeur (vergelijkbaar over seizoenen).
    """
    all_snapshots = []
    for path in sorted(SNAPSHOTS_DIR.glob("*.json")):
        if path.name.startswith("."):
            continue
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        all_snapshots.append(data)

    # Dedupliceer per seizoen: voorkeur voor supersheet
    per_seizoen = {}
    for snap in all_snapshots:
        seizoen = snap["_meta"]["seizoen"]
        bron_type = snap["_meta"].get("bron_type", "sportlink")
        if seizoen not in per_seizoen:
            per_seizoen[seizoen] = snap
        elif bron_type == "supersheet":
            per_seizoen[seizoen] = snap

    return [per_seizoen[s] for s in sorted(per_seizoen.keys())]


def build_vergelijking(snapshots):
    """Bouw de seizoensvergelijking."""
    seizoenen = [s["_meta"]["seizoen"] for s in snapshots]

    # --- Per cohort (geboortejaar x geslacht) ---
    cohort_data = defaultdict(lambda: {})
    for snap in snapshots:
        seizoen = snap["_meta"]["seizoen"]
        peildatum_year = int(snap["_meta"]["snapshot_datum"].split("-")[0])
        counts = defaultdict(int)
        for lid in snap["leden"]:
            if lid["team"] and lid["geboortejaar"]:
                key = (lid["geboortejaar"], lid["geslacht"])
                counts[key] += 1
        for (gj, geslacht), aantal in counts.items():
            leeftijd = peildatum_year - gj
            band = leeftijd_naar_band(leeftijd)
            cohort_data[(gj, geslacht)][seizoen] = {
                "aantal": aantal,
                "leeftijd": leeftijd,
                "band": band,
            }

    # Bepaal huidige band (laatste seizoen)
    laatste_seizoen = seizoenen[-1]
    per_cohort = []
    for (gj, geslacht) in sorted(cohort_data.keys()):
        entry = cohort_data[(gj, geslacht)]
        band_huidig = None
        if laatste_seizoen in entry:
            band_huidig = entry[laatste_seizoen].get("band")

        # Trend berekenen
        aantallenlijst = [
            entry[s]["aantal"] for s in seizoenen if s in entry
        ]
        groei_totaal = aantallenlijst[-1] - aantallenlijst[0] if len(aantallenlijst) >= 2 else 0

        # Retentie laatste seizoen
        retentie = None
        for i in range(len(seizoenen) - 1, 0, -1):
            if seizoenen[i] in entry and seizoenen[i - 1] in entry:
                vorig = entry[seizoenen[i - 1]]["aantal"]
                huidig = entry[seizoenen[i]]["aantal"]
                if vorig > 0:
                    retentie = round(huidig / vorig, 2)
                break

        per_cohort.append({
            "geboortejaar": gj,
            "geslacht": geslacht,
            "band_huidig": band_huidig,
            "seizoenen": entry,
            "trend": {
                "groei_totaal": groei_totaal,
                "retentie_laatste": retentie,
            },
        })

    # --- Per band ---
    band_data = defaultdict(lambda: {})
    for snap in snapshots:
        seizoen = snap["_meta"]["seizoen"]
        peildatum_year = int(snap["_meta"]["snapshot_datum"].split("-")[0])
        band_counts = defaultdict(lambda: {"M": 0, "V": 0})
        for lid in snap["leden"]:
            if lid["team"] and lid["geboortejaar"]:
                leeftijd = peildatum_year - lid["geboortejaar"]
                band = leeftijd_naar_band(leeftijd)
                if band:
                    band_counts[band][lid["geslacht"]] += 1
        for band, counts in band_counts.items():
            totaal = counts["M"] + counts["V"]
            band_data[band][seizoen] = {
                "totaal": totaal,
                "m": counts["M"],
                "v": counts["V"],
            }

    per_band = []
    for band in ["Kangoeroe", "Blauw", "Groen", "Geel", "Oranje", "Rood", "Senioren"]:
        if band in band_data:
            per_band.append({
                "band": band,
                "seizoenen": band_data[band],
            })

    # --- Totalen ---
    totalen = {}
    for snap in snapshots:
        seizoen = snap["_meta"]["seizoen"]
        m = sum(1 for l in snap["leden"] if l["team"] and l["geslacht"] == "M")
        v = sum(1 for l in snap["leden"] if l["team"] and l["geslacht"] == "V")
        totalen[seizoen] = {"spelers": m + v, "m": m, "v": v}

    # --- Stromen (instroom/uitstroom per seizoensovergang) ---
    stromen = []
    for i in range(1, len(snapshots)):
        vorig = snapshots[i - 1]
        huidig = snapshots[i]
        vorig_relcodes = {
            l["rel_code"] for l in vorig["leden"] if l["team"]
        }
        huidig_relcodes = {
            l["rel_code"] for l in huidig["leden"] if l["team"]
        }
        behouden = vorig_relcodes & huidig_relcodes
        uitstroom = vorig_relcodes - huidig_relcodes
        instroom = huidig_relcodes - vorig_relcodes

        stromen.append({
            "van": vorig["_meta"]["seizoen"],
            "naar": huidig["_meta"]["seizoen"],
            "instroom": len(instroom),
            "uitstroom": len(uitstroom),
            "behouden": len(behouden),
            "netto": len(instroom) - len(uitstroom),
        })

    return {
        "_meta": {
            "beschrijving": "Ledenaantallen per geboortejaar x geslacht over seizoenen",
            "seizoenen": seizoenen,
            "gegenereerd": str(__import__("datetime").date.today()),
        },
        "per_cohort": per_cohort,
        "per_band": per_band,
        "totalen": totalen,
        "stromen": stromen,
    }


def main():
    print("Laden snapshots...")
    snapshots = load_snapshots()
    print(f"  {len(snapshots)} snapshots gevonden:")
    for s in snapshots:
        print(f"    {s['_meta']['seizoen']} ({s['_meta']['snapshot_datum']}): {s['_meta']['totaal_leden']} leden")
    print()

    print("Genereren seizoensvergelijking...")
    vergelijking = build_vergelijking(snapshots)

    print(f"  {len(vergelijking['per_cohort'])} cohorten (geboortejaar x geslacht)")
    print(f"  {len(vergelijking['per_band'])} banden")
    print(f"  {len(vergelijking['stromen'])} seizoensovergangen")
    print()

    # Toon stromen
    print("Stromen:")
    for s in vergelijking["stromen"]:
        print(f"  {s['van']} -> {s['naar']}: +{s['instroom']} instroom, -{s['uitstroom']} uitstroom, netto {s['netto']:+d}")
    print()

    # Toon totalen
    print("Totalen:")
    for seizoen, t in vergelijking["totalen"].items():
        print(f"  {seizoen}: {t['spelers']} spelers ({t['m']}M / {t['v']}V)")
    print()

    # Schrijf output
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(vergelijking, f, ensure_ascii=False, indent=2)
    print(f"Geschreven: {OUTPUT_FILE.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
