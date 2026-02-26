"""
Analyse instroom en uitstroom per leeftijd bij c.k.v. Oranje Wit.

Bron: spelerspaden.json (16 seizoenen, 2010-2026 incl. COVID-seizoen 2020-2021)
Beperking: alleen spelers met geboortedatum (652 van 1246)

Output: JSON met instroom- en uitstroomverdeling per leeftijd + retentiecijfers
"""

import json
from collections import defaultdict
from datetime import datetime

DATA = r"C:\Oranje Wit\data\spelers\spelerspaden.json"
OUT = r"C:\Oranje Wit\data\aggregaties\instroom-uitstroom-analyse.json"

# Seizoenen in chronologische volgorde
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


def seizoen_startjaar(seizoen):
    return int(seizoen.split("-")[0])


def leeftijd_in_seizoen(geboortedatum, seizoen):
    """Leeftijd op 31 december van het seizoen (KNKV-peildatum)."""
    geb = datetime.strptime(geboortedatum, "%Y-%m-%d")
    peildatum_jaar = int(seizoen.split("-")[1])  # eindjaar = kalenderjaar peildatum
    return peildatum_jaar - geb.year


def main():
    with open(DATA, "r", encoding="utf-8") as f:
        spelers = json.load(f)

    print(f"Totaal spelers: {len(spelers)}")
    met_gebdat = [s for s in spelers if s["geboortedatum"]]
    print(f"Met geboortedatum: {len(met_gebdat)}")

    # --- Instroom-analyse ---
    instroom_leeftijd = defaultdict(lambda: {"M": 0, "V": 0, "totaal": 0})
    instroom_per_seizoen = defaultdict(int)

    # --- Uitstroom-analyse ---
    uitstroom_leeftijd = defaultdict(lambda: {"M": 0, "V": 0, "totaal": 0})

    # --- Retentie per leeftijd (seizoen-op-seizoen) ---
    # Tel per leeftijd: hoeveel spelers waren er, hoeveel kwamen terug volgend seizoen
    aanwezig_per_leeftijd = defaultdict(lambda: {"M": 0, "V": 0, "totaal": 0})
    terug_per_leeftijd = defaultdict(lambda: {"M": 0, "V": 0, "totaal": 0})

    # --- Verblijfsduur ---
    verblijfsduur = defaultdict(int)  # aantal seizoenen -> count

    for sp in met_gebdat:
        seizoenen_actief = sorted(sp["seizoenen"].keys())
        if not seizoenen_actief:
            continue

        geslacht = sp["geslacht"] or "?"
        geb = sp["geboortedatum"]

        # Verblijfsduur
        verblijfsduur[len(seizoenen_actief)] += 1

        # Eerste seizoen = instroom
        eerste = seizoenen_actief[0]
        leeftijd_instroom = leeftijd_in_seizoen(geb, eerste)
        if 4 <= leeftijd_instroom <= 50:
            instroom_leeftijd[leeftijd_instroom]["totaal"] += 1
            if geslacht in ("M", "V"):
                instroom_leeftijd[leeftijd_instroom][geslacht] += 1
            instroom_per_seizoen[eerste] += 1

        # Laatste seizoen = uitstroom (als niet meer actief in 2025-2026)
        laatste = seizoenen_actief[-1]
        if laatste != "2025-2026":  # niet huidig seizoen = gestopt
            leeftijd_uitstroom = leeftijd_in_seizoen(geb, laatste)
            if 4 <= leeftijd_uitstroom <= 50:
                uitstroom_leeftijd[leeftijd_uitstroom]["totaal"] += 1
                if geslacht in ("M", "V"):
                    uitstroom_leeftijd[leeftijd_uitstroom][geslacht] += 1

        # Retentie: voor elk seizoen waar de speler actief was,
        # check of ze ook in het volgende seizoen actief waren
        seizoen_set = set(seizoenen_actief)
        for i, sz in enumerate(SEIZOENEN[:-1]):
            volgend = SEIZOENEN[i + 1]
            if sz in seizoen_set:
                leeftijd = leeftijd_in_seizoen(geb, sz)
                if 4 <= leeftijd <= 25:
                    aanwezig_per_leeftijd[leeftijd]["totaal"] += 1
                    if geslacht in ("M", "V"):
                        aanwezig_per_leeftijd[leeftijd][geslacht] += 1
                    if volgend in seizoen_set:
                        terug_per_leeftijd[leeftijd]["totaal"] += 1
                        if geslacht in ("M", "V"):
                            terug_per_leeftijd[leeftijd][geslacht] += 1

    # --- Betrouwbare retentie (alleen 2021-2026 Supersheets) ---
    aanwezig_betrouwbaar = defaultdict(lambda: {"M": 0, "V": 0, "totaal": 0})
    terug_betrouwbaar = defaultdict(lambda: {"M": 0, "V": 0, "totaal": 0})

    for sp in met_gebdat:
        seizoenen_actief = set(sp["seizoenen"].keys())
        geslacht = sp["geslacht"] or "?"
        geb = sp["geboortedatum"]

        for i, sz in enumerate(BETROUWBAAR[:-1]):
            volgend = BETROUWBAAR[i + 1]
            if sz in seizoenen_actief:
                leeftijd = leeftijd_in_seizoen(geb, sz)
                if 4 <= leeftijd <= 25:
                    aanwezig_betrouwbaar[leeftijd]["totaal"] += 1
                    if geslacht in ("M", "V"):
                        aanwezig_betrouwbaar[leeftijd][geslacht] += 1
                    if volgend in seizoenen_actief:
                        terug_betrouwbaar[leeftijd]["totaal"] += 1
                        if geslacht in ("M", "V"):
                            terug_betrouwbaar[leeftijd][geslacht] += 1

    # --- Output ---
    def retentie_tabel(aanwezig, terug, label):
        print(f"\n{'='*70}")
        print(f"  {label}")
        print(f"{'='*70}")
        print(f"  {'Leeftijd':>8} | {'Aanwezig':>8} | {'Terug':>8} | {'Retentie':>8} | {'M aan':>6} {'M ret':>6} | {'V aan':>6} {'V ret':>6}")
        print(f"  {'-'*8}-+-{'-'*8}-+-{'-'*8}-+-{'-'*8}-+-{'-'*6}-{'-'*6}-+-{'-'*6}-{'-'*6}")

        tabel = []
        for leeftijd in sorted(aanwezig.keys()):
            a = aanwezig[leeftijd]
            t = terug[leeftijd]
            if a["totaal"] < 3:  # te weinig data
                continue
            ret = t["totaal"] / a["totaal"] if a["totaal"] > 0 else 0
            ret_m = t["M"] / a["M"] if a["M"] > 0 else None
            ret_v = t["V"] / a["V"] if a["V"] > 0 else None
            print(f"  {leeftijd:>8} | {a['totaal']:>8} | {t['totaal']:>8} | {ret:>7.1%} | {a['M']:>6} {(f'{ret_m:.0%}' if ret_m is not None else 'n/a'):>6} | {a['V']:>6} {(f'{ret_v:.0%}' if ret_v is not None else 'n/a'):>6}")
            tabel.append({
                "leeftijd": leeftijd,
                "aanwezig_totaal": a["totaal"],
                "terug_totaal": t["totaal"],
                "retentie_totaal": round(ret, 3),
                "aanwezig_M": a["M"],
                "terug_M": t["M"],
                "retentie_M": round(ret_m, 3) if ret_m is not None else None,
                "aanwezig_V": a["V"],
                "terug_V": t["V"],
                "retentie_V": round(ret_v, 3) if ret_v is not None else None,
            })
        return tabel

    # Print instroom
    print(f"\n{'='*70}")
    print("  INSTROOM PER LEEFTIJD (eerste seizoen bij OW)")
    print(f"{'='*70}")
    print(f"  {'Leeftijd':>8} | {'Totaal':>8} | {'M':>6} | {'V':>6}")
    print(f"  {'-'*8}-+-{'-'*8}-+-{'-'*6}-+-{'-'*6}")
    instroom_data = []
    for leeftijd in sorted(instroom_leeftijd.keys()):
        d = instroom_leeftijd[leeftijd]
        if 4 <= leeftijd <= 25 and d["totaal"] >= 2:
            print(f"  {leeftijd:>8} | {d['totaal']:>8} | {d['M']:>6} | {d['V']:>6}")
            instroom_data.append({"leeftijd": leeftijd, **d})

    # Print uitstroom
    print(f"\n{'='*70}")
    print("  UITSTROOM PER LEEFTIJD (laatste seizoen bij OW)")
    print(f"{'='*70}")
    print(f"  {'Leeftijd':>8} | {'Totaal':>8} | {'M':>6} | {'V':>6}")
    print(f"  {'-'*8}-+-{'-'*8}-+-{'-'*6}-+-{'-'*6}")
    uitstroom_data = []
    for leeftijd in sorted(uitstroom_leeftijd.keys()):
        d = uitstroom_leeftijd[leeftijd]
        if 4 <= leeftijd <= 25 and d["totaal"] >= 2:
            print(f"  {leeftijd:>8} | {d['totaal']:>8} | {d['M']:>6} | {d['V']:>6}")
            uitstroom_data.append({"leeftijd": leeftijd, **d})

    # Retentietabellen
    tabel_alle = retentie_tabel(aanwezig_per_leeftijd, terug_per_leeftijd,
                                 "RETENTIE PER LEEFTIJD — ALLE SEIZOENEN (2010-2026)")
    tabel_betrouwbaar = retentie_tabel(aanwezig_betrouwbaar, terug_betrouwbaar,
                                        "RETENTIE PER LEEFTIJD — BETROUWBAAR (2018-2026)")

    # Verblijfsduur
    print(f"\n{'='*70}")
    print("  VERBLIJFSDUUR (aantal seizoenen per speler)")
    print(f"{'='*70}")
    for n in sorted(verblijfsduur.keys()):
        print(f"  {n:>2} seizoen(en): {verblijfsduur[n]:>4} spelers")

    # Opslaan
    result = {
        "_meta": {
            "gegenereerd": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "bron": "spelerspaden.json",
            "spelers_met_geboortedatum": len(met_gebdat),
            "toelichting": "Retentie = % spelers dat volgend seizoen terugkeert. Betrouwbaar = A2 + Supersheets 2018-2026 met Sportlink ID's."
        },
        "instroom_per_leeftijd": instroom_data,
        "uitstroom_per_leeftijd": uitstroom_data,
        "retentie_alle_seizoenen": tabel_alle,
        "retentie_betrouwbaar_2018_2026": tabel_betrouwbaar,
        "verblijfsduur": [{"seizoenen": k, "spelers": v} for k, v in sorted(verblijfsduur.items())],
    }

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"\n  >> Opgeslagen: {OUT}")


if __name__ == "__main__":
    main()
