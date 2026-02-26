"""
Analyse retentie, instroom, uitstroom en bestand per individueel leeftijdsjaar (3-65).
Compleet overzicht van c.k.v. Oranje Wit, jeugd en senioren.

Bron: spelerspaden.json (16 seizoenen, 2010-2026)
Output: JSON per leeftijdsjaar + console-tabel
"""

import json
from collections import defaultdict
from datetime import datetime

DATA = r"C:\Oranje Wit\data\spelers\spelerspaden.json"
OUT = r"C:\Oranje Wit\data\aggregaties\analyse-per-leeftijd.json"

SEIZOENEN = [
    "2010-2011", "2011-2012", "2012-2013", "2013-2014", "2014-2015",
    "2015-2016", "2016-2017", "2017-2018", "2018-2019", "2019-2020",
    "2020-2021", "2021-2022", "2022-2023", "2023-2024", "2024-2025", "2025-2026",
]

# Betrouwbare seizoenen (A2 formulieren + Supersheets met Sportlink ID's)
BETROUWBAAR = [
    "2018-2019", "2019-2020", "2020-2021", "2021-2022",
    "2022-2023", "2023-2024", "2024-2025", "2025-2026",
]

MIN_LEEFTIJD = 3
MAX_LEEFTIJD = 65


def leeftijd_in_seizoen(geboortedatum, seizoen):
    geb = datetime.strptime(geboortedatum, "%Y-%m-%d")
    return int(seizoen.split("-")[1]) - geb.year


def main():
    with open(DATA, "r", encoding="utf-8") as f:
        spelers = json.load(f)

    met_gebdat = [s for s in spelers if s["geboortedatum"]]
    print(f"Spelers met geboortedatum: {len(met_gebdat)}")

    # Datastructuren per leeftijd
    def nieuw_mv():
        return {"M": 0, "V": 0, "totaal": 0}

    aanwezig_alle = defaultdict(nieuw_mv)
    terug_alle = defaultdict(nieuw_mv)
    aanwezig_betr = defaultdict(nieuw_mv)
    terug_betr = defaultdict(nieuw_mv)
    instroom = defaultdict(nieuw_mv)
    uitstroom = defaultdict(nieuw_mv)
    bestand = defaultdict(nieuw_mv)

    for sp in met_gebdat:
        seizoen_set = set(sp["seizoenen"].keys())
        seizoenen_actief = sorted(sp["seizoenen"].keys())
        geslacht = sp["geslacht"] or "?"
        geb = sp["geboortedatum"]

        if not seizoenen_actief:
            continue

        # Retentie (alle seizoenen)
        for i, sz in enumerate(SEIZOENEN[:-1]):
            volgend = SEIZOENEN[i + 1]
            if sz in seizoen_set:
                leeftijd = leeftijd_in_seizoen(geb, sz)
                if not (MIN_LEEFTIJD <= leeftijd <= MAX_LEEFTIJD):
                    continue
                aanwezig_alle[leeftijd]["totaal"] += 1
                if geslacht in ("M", "V"):
                    aanwezig_alle[leeftijd][geslacht] += 1
                if volgend in seizoen_set:
                    terug_alle[leeftijd]["totaal"] += 1
                    if geslacht in ("M", "V"):
                        terug_alle[leeftijd][geslacht] += 1

        # Retentie (betrouwbaar)
        for i, sz in enumerate(BETROUWBAAR[:-1]):
            volgend = BETROUWBAAR[i + 1]
            if sz in seizoen_set:
                leeftijd = leeftijd_in_seizoen(geb, sz)
                if not (MIN_LEEFTIJD <= leeftijd <= MAX_LEEFTIJD):
                    continue
                aanwezig_betr[leeftijd]["totaal"] += 1
                if geslacht in ("M", "V"):
                    aanwezig_betr[leeftijd][geslacht] += 1
                if volgend in seizoen_set:
                    terug_betr[leeftijd]["totaal"] += 1
                    if geslacht in ("M", "V"):
                        terug_betr[leeftijd][geslacht] += 1

        # Instroom (eerste seizoen)
        eerste = seizoenen_actief[0]
        leeftijd_in = leeftijd_in_seizoen(geb, eerste)
        if MIN_LEEFTIJD <= leeftijd_in <= MAX_LEEFTIJD:
            instroom[leeftijd_in]["totaal"] += 1
            if geslacht in ("M", "V"):
                instroom[leeftijd_in][geslacht] += 1

        # Uitstroom (laatste seizoen, als niet meer actief)
        laatste = seizoenen_actief[-1]
        if laatste != "2025-2026":
            leeftijd_uit = leeftijd_in_seizoen(geb, laatste)
            if MIN_LEEFTIJD <= leeftijd_uit <= MAX_LEEFTIJD:
                uitstroom[leeftijd_uit]["totaal"] += 1
                if geslacht in ("M", "V"):
                    uitstroom[leeftijd_uit][geslacht] += 1

        # Huidig bestand
        if "2025-2026" in seizoen_set:
            leeftijd_nu = leeftijd_in_seizoen(geb, "2025-2026")
            if MIN_LEEFTIJD <= leeftijd_nu <= MAX_LEEFTIJD:
                bestand[leeftijd_nu]["totaal"] += 1
                if geslacht in ("M", "V"):
                    bestand[leeftijd_nu][geslacht] += 1

    # === CONSOLE OUTPUT ===
    def pct(a, t):
        if a >= 5:
            return f"{t/a*100:5.1f}%"
        if a >= 3:
            return f"{t/a*100:5.0f}%"
        return "     -"

    print(f"\n{'='*130}")
    print(f"  OVERZICHT PER LEEFTIJDSJAAR — c.k.v. Oranje Wit")
    print(f"{'='*130}")
    print(f"  {'Lft':>3} | {'Huidig':>6} {'M':>3} {'V':>3} | {'Ret(alle)':>9} {'n':>4} | {'Ret(betr)':>9} {'n':>4} | {'Ret M':>6} {'Ret V':>6} | {'Instr':>5} {'M':>3} {'V':>3} | {'Uitstr':>6} {'M':>3} {'V':>3}")
    print(f"  {'-'*3}-+-{'-'*6}-{'-'*3}-{'-'*3}-+-{'-'*9}-{'-'*4}-+-{'-'*9}-{'-'*4}-+-{'-'*6}-{'-'*6}-+-{'-'*5}-{'-'*3}-{'-'*3}-+-{'-'*6}-{'-'*3}-{'-'*3}")

    for leeftijd in range(MIN_LEEFTIJD, MAX_LEEFTIJD + 1):
        h = bestand[leeftijd]
        a = aanwezig_alle[leeftijd]
        t = terug_alle[leeftijd]
        ab = aanwezig_betr[leeftijd]
        tb = terug_betr[leeftijd]
        ins = instroom[leeftijd]
        uit = uitstroom[leeftijd]

        # Skip leeftijden zonder data
        if (h["totaal"] == 0 and a["totaal"] < 3 and
                ins["totaal"] == 0 and uit["totaal"] == 0):
            continue

        ret_alle = pct(a["totaal"], t["totaal"])
        ret_betr = pct(ab["totaal"], tb["totaal"])
        ret_m = pct(a["M"], t["M"])
        ret_v = pct(a["V"], t["V"])

        print(
            f"  {leeftijd:>3} | {h['totaal']:>6} {h['M']:>3} {h['V']:>3}"
            f" | {ret_alle} {a['totaal']:>4}"
            f" | {ret_betr} {ab['totaal']:>4}"
            f" | {ret_m} {ret_v}"
            f" | {ins['totaal']:>5} {ins['M']:>3} {ins['V']:>3}"
            f" | {uit['totaal']:>6} {uit['M']:>3} {uit['V']:>3}"
        )

    # === JSON OUTPUT ===
    result = {
        "_meta": {
            "gegenereerd": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "bron": "spelerspaden.json",
            "spelers_met_geboortedatum": len(met_gebdat),
            "seizoenen_alle": len(SEIZOENEN),
            "seizoenen_betrouwbaar": len(BETROUWBAAR),
            "toelichting": {
                "retentie": "% spelers dat volgend seizoen terugkeert, per leeftijd in het vertrekseizoen",
                "alle_seizoenen": "2010-2026, name-matching voor oudere seizoenen",
                "betrouwbaar": "2018-2026, Sportlink ID-matching (A2 formulieren + Supersheets)",
                "instroom": "leeftijd bij eerste seizoen bij OW (over alle 16 seizoenen)",
                "uitstroom": "leeftijd bij laatste seizoen bij OW (excl. huidig seizoen)",
                "bestand": "actieve leden seizoen 2025-2026",
            },
        },
        "per_leeftijd": [],
    }

    for leeftijd in range(MIN_LEEFTIJD, MAX_LEEFTIJD + 1):
        a = aanwezig_alle[leeftijd]
        t = terug_alle[leeftijd]
        ab = aanwezig_betr[leeftijd]
        tb = terug_betr[leeftijd]
        ins = instroom[leeftijd]
        uit = uitstroom[leeftijd]
        h = bestand[leeftijd]

        if (a["totaal"] == 0 and ab["totaal"] == 0 and
                ins["totaal"] == 0 and uit["totaal"] == 0 and h["totaal"] == 0):
            continue

        entry = {
            "leeftijd": leeftijd,
            "bestand_2025_2026": {"totaal": h["totaal"], "M": h["M"], "V": h["V"]},
            "retentie_alle_seizoenen": {
                "aanwezig": a["totaal"],
                "terug": t["totaal"],
                "retentie": round(t["totaal"] / a["totaal"], 3) if a["totaal"] >= 3 else None,
                "aanwezig_M": a["M"],
                "terug_M": t["M"],
                "retentie_M": round(t["M"] / a["M"], 3) if a["M"] >= 3 else None,
                "aanwezig_V": a["V"],
                "terug_V": t["V"],
                "retentie_V": round(t["V"] / a["V"], 3) if a["V"] >= 3 else None,
            },
            "retentie_betrouwbaar": {
                "aanwezig": ab["totaal"],
                "terug": tb["totaal"],
                "retentie": round(tb["totaal"] / ab["totaal"], 3) if ab["totaal"] >= 3 else None,
                "aanwezig_M": ab["M"],
                "terug_M": tb["M"],
                "retentie_M": round(tb["M"] / ab["M"], 3) if ab["M"] >= 3 else None,
                "aanwezig_V": ab["V"],
                "terug_V": tb["V"],
                "retentie_V": round(tb["V"] / ab["V"], 3) if ab["V"] >= 3 else None,
            },
            "instroom": {"totaal": ins["totaal"], "M": ins["M"], "V": ins["V"]},
            "uitstroom": {"totaal": uit["totaal"], "M": uit["M"], "V": uit["V"]},
        }
        result["per_leeftijd"].append(entry)

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"\n  >> Opgeslagen: {OUT}")


if __name__ == "__main__":
    main()
