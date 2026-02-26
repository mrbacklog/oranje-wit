"""
Analyse instroom, uitstroom en retentie per seizoen bij c.k.v. Oranje Wit.
Doel: identificeer afwijkende jaren (COVID, groeispurts, dips).
"""

import json
from collections import defaultdict
from datetime import datetime

DATA = r"C:\Oranje Wit\data\spelers\spelerspaden.json"

SEIZOENEN = [
    "2010-2011", "2011-2012", "2012-2013", "2013-2014", "2014-2015",
    "2015-2016", "2016-2017", "2017-2018", "2018-2019", "2019-2020",
    "2020-2021", "2021-2022", "2022-2023", "2023-2024", "2024-2025", "2025-2026",
]


def leeftijd_in_seizoen(geboortedatum, seizoen):
    geb = datetime.strptime(geboortedatum, "%Y-%m-%d")
    peildatum_jaar = int(seizoen.split("-")[1])
    return peildatum_jaar - geb.year


def main():
    with open(DATA, "r", encoding="utf-8") as f:
        spelers = json.load(f)

    met_gebdat = [s for s in spelers if s["geboortedatum"]]

    # --- Per seizoen: wie was er, wie nieuw, wie vertrokken ---
    print(f"{'='*90}")
    print(f"  LEDENBESTAND PER SEIZOEN")
    print(f"{'='*90}")
    print(f"  {'Seizoen':<12} | {'Totaal':>6} | {'Jeugd':>6} | {'Senior':>6} | {'Nieuw':>5} | {'Weg':>5} | {'Retentie':>8} | {'Netto':>6}")
    print(f"  {'-'*12}-+-{'-'*6}-+-{'-'*6}-+-{'-'*6}-+-{'-'*5}-+-{'-'*5}-+-{'-'*8}-+-{'-'*6}")

    vorig_seizoen_ids = set()
    for sz in SEIZOENEN:
        actief_ids = set()
        jeugd = 0
        senior = 0
        for sp in met_gebdat:
            if sz in sp["seizoenen"]:
                actief_ids.add(sp["speler_id"])
                leeftijd = leeftijd_in_seizoen(sp["geboortedatum"], sz)
                if leeftijd <= 18:
                    jeugd += 1
                else:
                    senior += 1

        nieuw = len(actief_ids - vorig_seizoen_ids) if vorig_seizoen_ids else 0
        weg = len(vorig_seizoen_ids - actief_ids) if vorig_seizoen_ids else 0
        retentie = (len(actief_ids & vorig_seizoen_ids) / len(vorig_seizoen_ids) * 100) if vorig_seizoen_ids else 0
        netto = nieuw - weg

        print(f"  {sz:<12} | {len(actief_ids):>6} | {jeugd:>6} | {senior:>6} | {nieuw:>+5} | {weg:>-5} | {retentie:>7.1f}% | {netto:>+6}")
        vorig_seizoen_ids = actief_ids

    # --- Instroom per seizoen, uitgesplitst naar leeftijdsgroep ---
    print(f"\n{'='*90}")
    print(f"  INSTROOM PER SEIZOEN — PER LEEFTIJDSBAND")
    print(f"{'='*90}")
    print(f"  {'Seizoen':<12} | {'6-7':>5} | {'8-9':>5} | {'10-11':>5} | {'12-13':>5} | {'14-15':>5} | {'16-18':>5} | {'19+':>5} | {'Totaal':>6}")
    print(f"  {'-'*12}-+-{'-'*5}-+-{'-'*5}-+-{'-'*5}-+-{'-'*5}-+-{'-'*5}-+-{'-'*5}-+-{'-'*5}-+-{'-'*6}")

    for sp in met_gebdat:
        sp["_eerste"] = min(sp["seizoenen"].keys())

    for sz in SEIZOENEN:
        banden = {"6-7": 0, "8-9": 0, "10-11": 0, "12-13": 0, "14-15": 0, "16-18": 0, "19+": 0}
        totaal = 0
        for sp in met_gebdat:
            if sp["_eerste"] == sz:
                leeftijd = leeftijd_in_seizoen(sp["geboortedatum"], sz)
                if leeftijd <= 7:
                    banden["6-7"] += 1
                elif leeftijd <= 9:
                    banden["8-9"] += 1
                elif leeftijd <= 11:
                    banden["10-11"] += 1
                elif leeftijd <= 13:
                    banden["12-13"] += 1
                elif leeftijd <= 15:
                    banden["14-15"] += 1
                elif leeftijd <= 18:
                    banden["16-18"] += 1
                elif leeftijd <= 50:
                    banden["19+"] += 1
                totaal += 1

        print(f"  {sz:<12} | {banden['6-7']:>5} | {banden['8-9']:>5} | {banden['10-11']:>5} | {banden['12-13']:>5} | {banden['14-15']:>5} | {banden['16-18']:>5} | {banden['19+']:>5} | {totaal:>6}")

    # --- Retentie per seizoen, uitgesplitst naar leeftijdsgroep ---
    print(f"\n{'='*90}")
    print(f"  RETENTIE PER SEIZOENSOVERGANG — PER LEEFTIJDSBAND (jeugd)")
    print(f"{'='*90}")
    print(f"  {'Overgang':<16} | {'6-9':>10} | {'10-12':>10} | {'13-15':>10} | {'16-18':>10} | {'Totaal':>10}")
    print(f"  {'-'*16}-+-{'-'*10}-+-{'-'*10}-+-{'-'*10}-+-{'-'*10}-+-{'-'*10}")

    for i in range(len(SEIZOENEN) - 1):
        sz = SEIZOENEN[i]
        volgend = SEIZOENEN[i + 1]

        banden = {
            "6-9": {"aanwezig": 0, "terug": 0},
            "10-12": {"aanwezig": 0, "terug": 0},
            "13-15": {"aanwezig": 0, "terug": 0},
            "16-18": {"aanwezig": 0, "terug": 0},
        }
        totaal_a = 0
        totaal_t = 0

        for sp in met_gebdat:
            if sz in sp["seizoenen"]:
                leeftijd = leeftijd_in_seizoen(sp["geboortedatum"], sz)
                if leeftijd < 6 or leeftijd > 18:
                    continue
                if leeftijd <= 9:
                    band = "6-9"
                elif leeftijd <= 12:
                    band = "10-12"
                elif leeftijd <= 15:
                    band = "13-15"
                else:
                    band = "16-18"

                banden[band]["aanwezig"] += 1
                totaal_a += 1
                if volgend in sp["seizoenen"]:
                    banden[band]["terug"] += 1
                    totaal_t += 1

        def fmt(b):
            a, t = b["aanwezig"], b["terug"]
            if a == 0:
                return "     n/a  "
            return f"{t:>3}/{a:<3} {t/a*100:>4.0f}%"

        label = f"{sz[:4]}->{volgend[:4]}"
        totaal_pct = f"{totaal_t/totaal_a*100:.0f}%" if totaal_a > 0 else "n/a"
        print(f"  {label:<16} | {fmt(banden['6-9'])} | {fmt(banden['10-12'])} | {fmt(banden['13-15'])} | {fmt(banden['16-18'])} | {totaal_t:>3}/{totaal_a:<3} {totaal_pct:>4}")

    # --- Uitstroom per seizoen: wie is gestopt ---
    print(f"\n{'='*90}")
    print(f"  UITSTROOM PER SEIZOEN — LAATSTE SEIZOEN VAN SPELERS")
    print(f"{'='*90}")
    print(f"  {'Seizoen':<12} | {'Gestopt':>7} | {'Leeftijd 6-9':>12} | {'10-12':>5} | {'13-15':>5} | {'16-18':>5} | {'19+':>5}")
    print(f"  {'-'*12}-+-{'-'*7}-+-{'-'*12}-+-{'-'*5}-+-{'-'*5}-+-{'-'*5}-+-{'-'*5}")

    for sz in SEIZOENEN:
        if sz == "2025-2026":
            continue  # huidig seizoen, we weten nog niet wie stopt
        gestopt_banden = {"6-9": 0, "10-12": 0, "13-15": 0, "16-18": 0, "19+": 0}
        gestopt_totaal = 0
        for sp in met_gebdat:
            laatste = max(sp["seizoenen"].keys())
            if laatste == sz and sz != "2025-2026":
                leeftijd = leeftijd_in_seizoen(sp["geboortedatum"], sz)
                gestopt_totaal += 1
                if leeftijd <= 9:
                    gestopt_banden["6-9"] += 1
                elif leeftijd <= 12:
                    gestopt_banden["10-12"] += 1
                elif leeftijd <= 15:
                    gestopt_banden["13-15"] += 1
                elif leeftijd <= 18:
                    gestopt_banden["16-18"] += 1
                else:
                    gestopt_banden["19+"] += 1

        print(f"  {sz:<12} | {gestopt_totaal:>7} | {gestopt_banden['6-9']:>12} | {gestopt_banden['10-12']:>5} | {gestopt_banden['13-15']:>5} | {gestopt_banden['16-18']:>5} | {gestopt_banden['19+']:>5}")


if __name__ == "__main__":
    main()
