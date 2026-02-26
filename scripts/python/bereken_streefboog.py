"""
Bereken streef-ledenboog c.k.v. Oranje Wit.

Gebruikt:
- Huidige ledenaantallen per geboortejaar (2025-2026)
- Retentie per leeftijdsjaar uit jeugdmodel v2.0
- Instroomverdeling per leeftijd uit jeugdmodel v2.0

Berekent projecties voor 2027-2028 en 2029-2030.
"""

import json
import math
from copy import deepcopy

# --- Huidige leden per geboortejaar (seizoen 2025-2026) ---
HUIDIG = {
    2007: {"M": 9, "V": 3},
    2008: {"M": 5, "V": 6},
    2009: {"M": 7, "V": 5},
    2010: {"M": 6, "V": 18},
    2011: {"M": 9, "V": 6},
    2012: {"M": 4, "V": 14},
    2013: {"M": 6, "V": 11},
    2014: {"M": 14, "V": 8},
    2015: {"M": 7, "V": 8},
    2016: {"M": 2, "V": 7},
    2017: {"M": 8, "V": 7},
    2018: {"M": 6, "V": 6},
    2019: {"M": 4, "V": 6},
    2020: {"M": 1, "V": 4},
}

# --- Retentie per leeftijd (jeugdmodel v2.0) ---
RETENTIE = {
    5: 0.85, 6: 0.82, 7: 0.84, 8: 0.95, 9: 0.93,
    10: 0.93, 11: 0.92, 12: 0.90, 13: 0.94, 14: 0.95,
    15: 0.92, 16: 0.87, 17: 0.82, 18: 0.84,
}

RETENTIE_M = {
    5: 0.85, 6: 0.75, 7: 0.78, 8: 0.95, 9: 0.93,
    10: 0.97, 11: 0.92, 12: 0.92, 13: 0.94, 14: 0.97,
    15: 0.90, 16: 0.89, 17: 0.79, 18: 0.90,
}

RETENTIE_V = {
    5: 0.85, 6: 0.87, 7: 0.88, 8: 0.96, 9: 0.94,
    10: 0.91, 11: 0.92, 12: 0.90, 13: 0.94, 14: 0.93,
    15: 0.93, 16: 0.85, 17: 0.85, 18: 0.80,
}

# --- Instroom-verdeling (% per leeftijd, jeugdmodel v2.0) ---
INSTROOM_VERDELING = {
    5: 0.017, 6: 0.065, 7: 0.110, 8: 0.167, 9: 0.169,
    10: 0.127, 11: 0.084, 12: 0.076, 13: 0.046, 14: 0.034,
    15: 0.055, 16: 0.019, 17: 0.019, 18: 0.013,
}

# M/V verdeling bij instroom (~40/60)
INSTROOM_M_AANDEEL = 0.40

# --- Band-mapping ---
def band_voor_leeftijd(leeftijd):
    if leeftijd <= 7:
        return "Blauw"
    elif leeftijd <= 9:
        return "Groen"
    elif leeftijd <= 12:
        return "Geel"
    elif leeftijd <= 15:
        return "Oranje"
    elif leeftijd <= 18:
        return "Rood"
    return "Senioren"


def projecteer_seizoen(huidige_leden, instroom_totaal, seizoen_eindjaar):
    """Projecteer 1 seizoen vooruit.

    Args:
        huidige_leden: dict {geboortejaar: {"M": n, "V": n}}
        instroom_totaal: verwacht totaal nieuwe jeugdleden dit seizoen
        seizoen_eindjaar: eindjaar van het doelseizoen

    Returns:
        nieuwe dict {geboortejaar: {"M": n, "V": n}}
    """
    nieuw = {}

    for gbjaar, aantallen in huidige_leden.items():
        leeftijd = seizoen_eindjaar - gbjaar
        if leeftijd < 5 or leeftijd > 19:
            continue  # buiten jeugdrange

        if leeftijd <= 18:
            ret_m = RETENTIE_M.get(leeftijd, 0.85)
            ret_v = RETENTIE_V.get(leeftijd, 0.85)
        else:
            # 19 = naar senioren, nemen we niet mee
            continue

        m_terug = aantallen["M"] * ret_m
        v_terug = aantallen["V"] * ret_v

        if gbjaar not in nieuw:
            nieuw[gbjaar] = {"M": 0.0, "V": 0.0}
        nieuw[gbjaar]["M"] += m_terug
        nieuw[gbjaar]["V"] += v_terug

    # Instroom toevoegen
    for leeftijd, fractie in INSTROOM_VERDELING.items():
        gbjaar = seizoen_eindjaar - leeftijd
        instroom_deze_leeftijd = instroom_totaal * fractie
        m_nieuw = instroom_deze_leeftijd * INSTROOM_M_AANDEEL
        v_nieuw = instroom_deze_leeftijd * (1 - INSTROOM_M_AANDEEL)

        if gbjaar not in nieuw:
            nieuw[gbjaar] = {"M": 0.0, "V": 0.0}
        nieuw[gbjaar]["M"] += m_nieuw
        nieuw[gbjaar]["V"] += v_nieuw

    return nieuw


def maak_boog(leden, seizoen_eindjaar):
    """Maak een boog-array van de leden per leeftijd."""
    boog = []
    for leeftijd in range(5, 19):
        gbjaar = seizoen_eindjaar - leeftijd
        if gbjaar in leden:
            m = round(leden[gbjaar]["M"])
            v = round(leden[gbjaar]["V"])
        else:
            m, v = 0, 0
        totaal = m + v
        band = band_voor_leeftijd(leeftijd)
        entry = {
            "leeftijd": leeftijd,
            "band": band,
            "totaal": totaal,
            "m": m,
            "v": v,
        }
        if band == "Oranje" and leeftijd == 13:
            entry["transitie_b_naar_a"] = True
        boog.append(entry)
    return boog


def samenvatting_per_band(boog):
    """Tel totalen per kleurband."""
    banden = {}
    for entry in boog:
        band = entry["band"]
        if band not in banden:
            banden[band] = {"totaal": 0, "m": 0, "v": 0}
        banden[band]["totaal"] += entry["totaal"]
        banden[band]["m"] += entry["m"]
        banden[band]["v"] += entry["v"]

    # Teams berekenen
    for band, data in banden.items():
        if band in ("Blauw", "Groen"):
            data["teams"] = max(1, math.ceil(data["totaal"] / 7))
        else:
            data["teams"] = max(1, math.ceil(data["totaal"] / 10))

    return banden


def main():
    # --- Scenario's ---
    scenarios = {
        "realistisch": {
            "beschrijving": "Huidige instroom + nieuwe retentie-parameters",
            "instroom_per_seizoen": 24,
        },
        "groei": {
            "beschrijving": "Matige groei in instroom (+25%)",
            "instroom_per_seizoen": 30,
        },
    }

    for naam, scenario in scenarios.items():
        instroom = scenario["instroom_per_seizoen"]
        print(f"\n{'='*80}")
        print(f"  SCENARIO: {naam.upper()} — {scenario['beschrijving']}")
        print(f"  Instroom: {instroom} jeugdleden/seizoen")
        print(f"{'='*80}")

        # Stap 1: huidig seizoen (2025-2026)
        leden = deepcopy(HUIDIG)

        # Stap 2: projecteer 2 seizoenen vooruit (-> 2027-2028)
        for jaar in range(2027, 2029):
            leden = projecteer_seizoen(leden, instroom, jaar)

        boog_2028 = maak_boog(leden, 2028)
        banden_2028 = samenvatting_per_band(boog_2028)

        print(f"\n  BOOG 2027-2028:")
        print(f"  {'Leeftijd':>8} | {'Band':<8} | {'Totaal':>6} | {'M':>4} | {'V':>4}")
        print(f"  {'-'*8}-+-{'-'*8}-+-{'-'*6}-+-{'-'*4}-+-{'-'*4}")
        totaal_2028 = 0
        for entry in boog_2028:
            print(f"  {entry['leeftijd']:>8} | {entry['band']:<8} | {entry['totaal']:>6} | {entry['m']:>4} | {entry['v']:>4}")
            totaal_2028 += entry["totaal"]
        print(f"  {'':>8}   {'TOTAAL':<8} | {totaal_2028:>6}")

        # Stap 3: projecteer nog 2 seizoenen (-> 2029-2030)
        for jaar in range(2029, 2031):
            leden = projecteer_seizoen(leden, instroom, jaar)

        boog_2030 = maak_boog(leden, 2030)
        banden_2030 = samenvatting_per_band(boog_2030)

        print(f"\n  BOOG 2029-2030:")
        print(f"  {'Leeftijd':>8} | {'Band':<8} | {'Totaal':>6} | {'M':>4} | {'V':>4}")
        print(f"  {'-'*8}-+-{'-'*8}-+-{'-'*6}-+-{'-'*4}-+-{'-'*4}")
        totaal_2030 = 0
        for entry in boog_2030:
            print(f"  {entry['leeftijd']:>8} | {entry['band']:<8} | {entry['totaal']:>6} | {entry['m']:>4} | {entry['v']:>4}")
            totaal_2030 += entry["totaal"]
        print(f"  {'':>8}   {'TOTAAL':<8} | {totaal_2030:>6}")

        print(f"\n  Per band 2027-2028:")
        for band, data in banden_2028.items():
            print(f"    {band:<8}: {data['totaal']:>3} leden ({data['m']}M + {data['v']}V) -> {data['teams']} teams")

        print(f"\n  Per band 2029-2030:")
        for band, data in banden_2030.items():
            print(f"    {band:<8}: {data['totaal']:>3} leden ({data['m']}M + {data['v']}V) -> {data['teams']} teams")

    # --- Opslaan: realistisch scenario ---
    instroom = scenarios["realistisch"]["instroom_per_seizoen"]
    leden = deepcopy(HUIDIG)
    for jaar in range(2027, 2029):
        leden = projecteer_seizoen(leden, instroom, jaar)
    boog_2028 = maak_boog(leden, 2028)
    banden_2028 = samenvatting_per_band(boog_2028)

    for jaar in range(2029, 2031):
        leden = projecteer_seizoen(leden, instroom, jaar)
    boog_2030 = maak_boog(leden, 2030)
    banden_2030 = samenvatting_per_band(boog_2030)

    # Huidig seizoen boog
    boog_huidig = maak_boog({k: {"M": float(v["M"]), "V": float(v["V"])} for k, v in HUIDIG.items()}, 2026)
    banden_huidig = samenvatting_per_band(boog_huidig)

    # Groeipad per geboortejaar
    groeipad = []
    for gbjaar in range(2023, 2006, -1):
        entry = {"geboortejaar": gbjaar, "seizoenen": {}}

        # 2025-2026
        leeftijd_2026 = 2026 - gbjaar
        if gbjaar in HUIDIG and 5 <= leeftijd_2026 <= 18:
            entry["seizoenen"]["2025-2026"] = {
                "leeftijd": leeftijd_2026,
                "band": band_voor_leeftijd(leeftijd_2026),
                "huidig_totaal": HUIDIG[gbjaar]["M"] + HUIDIG[gbjaar]["V"],
                "huidig_m": HUIDIG[gbjaar]["M"],
                "huidig_v": HUIDIG[gbjaar]["V"],
            }
        else:
            entry["seizoenen"]["2025-2026"] = None

        # 2027-2028
        leeftijd_2028 = 2028 - gbjaar
        if 5 <= leeftijd_2028 <= 18:
            match = next((e for e in boog_2028 if e["leeftijd"] == leeftijd_2028), None)
            if match:
                entry["seizoenen"]["2027-2028"] = {
                    "leeftijd": leeftijd_2028,
                    "band": match["band"],
                    "streef_totaal": match["totaal"],
                    "streef_m": match["m"],
                    "streef_v": match["v"],
                }
            else:
                entry["seizoenen"]["2027-2028"] = None
        elif leeftijd_2028 > 18:
            entry["seizoenen"]["2027-2028"] = "senioren"
        else:
            entry["seizoenen"]["2027-2028"] = None

        # 2029-2030
        leeftijd_2030 = 2030 - gbjaar
        if 5 <= leeftijd_2030 <= 18:
            match = next((e for e in boog_2030 if e["leeftijd"] == leeftijd_2030), None)
            if match:
                entry["seizoenen"]["2029-2030"] = {
                    "leeftijd": leeftijd_2030,
                    "band": match["band"],
                    "streef_totaal": match["totaal"],
                    "streef_m": match["m"],
                    "streef_v": match["v"],
                }
            else:
                entry["seizoenen"]["2029-2030"] = None
        elif leeftijd_2030 > 18:
            entry["seizoenen"]["2029-2030"] = "senioren"
        else:
            entry["seizoenen"]["2029-2030"] = None

        groeipad.append(entry)

    result = {
        "_meta": {
            "beschrijving": "Streefmodel jeugd c.k.v. Oranje Wit v2.0 - groeipad 2026 -> 2028 -> 2030",
            "aangemaakt": "2026-02-24",
            "versie": "2.0",
            "methode": "Projectie op basis van OW-eigen retentie per leeftijdsjaar en instroomverdeling",
            "parameters": {
                "retentie": "per leeftijdsjaar, gender-specifiek (jeugdmodel v2.0)",
                "instroom_per_seizoen": 24,
                "mv_ratio_instroom": "40/60",
                "bron_retentie": "spelerspaden.json 2010-2026 (1246 spelers, 629 met geboortedatum)",
                "bron_instroom": "spelerspaden.json 16 seizoenen (piek bij 8-9 jaar)",
            },
            "banden": {
                "Blauw": {"leeftijd": [5, 6, 7], "spelvorm": "4-tallen"},
                "Groen": {"leeftijd": [8, 9], "spelvorm": "4-tallen"},
                "Geel": {"leeftijd": [10, 11, 12], "spelvorm": "8-tallen"},
                "Oranje": {"leeftijd": [13, 14, 15], "spelvorm": "8-tallen"},
                "Rood": {"leeftijd": [16, 17, 18], "spelvorm": "8-tallen"},
            },
        },
        "boog_huidig": {
            "beschrijving": "Huidig seizoen 2025-2026",
            "per_leeftijd": boog_huidig,
            "totaal": sum(e["totaal"] for e in boog_huidig),
        },
        "boog_2028": {
            "beschrijving": "Projectie seizoen 2027-2028 (realistisch scenario, 24 nieuwe leden/jaar)",
            "per_leeftijd": boog_2028,
            "totaal": sum(e["totaal"] for e in boog_2028),
        },
        "boog_2030": {
            "beschrijving": "Projectie seizoen 2029-2030 (realistisch scenario, 24 nieuwe leden/jaar)",
            "per_leeftijd": boog_2030,
            "totaal": sum(e["totaal"] for e in boog_2030),
        },
        "groeipad": groeipad,
        "samenvatting": {
            "2025-2026": {
                "type": "huidig",
                "totaal": sum(e["totaal"] for e in boog_huidig),
                "per_band": banden_huidig,
                "teams_totaal": sum(b["teams"] for b in banden_huidig.values()),
            },
            "2027-2028": {
                "type": "projectie",
                "totaal": sum(e["totaal"] for e in boog_2028),
                "per_band": banden_2028,
                "teams_totaal": sum(b["teams"] for b in banden_2028.values()),
            },
            "2029-2030": {
                "type": "projectie",
                "totaal": sum(e["totaal"] for e in boog_2030),
                "per_band": banden_2030,
                "teams_totaal": sum(b["teams"] for b in banden_2030.values()),
            },
        },
    }

    outpath = r"C:\Oranje Wit\data\modellen\streef-ledenboog.json"
    with open(outpath, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"\n\n  >> Opgeslagen: {outpath}")


if __name__ == "__main__":
    main()
