#!/usr/bin/env python3
"""
check_spelerspaden.py — Detecteert opvallende teamvolgordes in spelerspaden.

Patronen:
  1. Categorie-sprongen (ouder/kind fouten)
  2. Leeftijd vs categorie mismatch
  3. Geslacht vs team mismatch
  4. Yo-yo patronen
  5. Regressie voorbij normaal

Gebruik: python scripts/check_spelerspaden.py
"""

import json
import os
import sys
from datetime import datetime
from collections import defaultdict

# Windows console: forceer UTF-8 output
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

# ---------------------------------------------------------------------------
# Configuratie
# ---------------------------------------------------------------------------

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "spelers", "spelerspaden.json")

# Categorieën van hoog naar laag (index = rang, hoger = lager team)
CATEGORIE_RANG = {
    "S": 0,   # Senioren
    "MW": 1,  # Walking korfbal (senioren-niveau)
    "A": 2,   # A-junioren
    "B": 3,   # B-junioren
    "C": 4,   # C-junioren
    "D": 5,   # D-junioren
    "E": 6,   # E-junioren
    "F": 7,   # F-junioren
    "K": 8,   # Kleuters
}

# Teams die we negeren in de analyse
SKIP_TEAMS = {"AR", "NSL", "Senioren"}

# ---------------------------------------------------------------------------
# Hulpfuncties
# ---------------------------------------------------------------------------

def parse_team(team_str):
    """Parse teamnaam naar (categorie_code, nummer).
    Retourneert None voor teams die we overslaan.
    """
    if team_str in SKIP_TEAMS:
        return None

    # K (kleuters) — geen nummer
    if team_str == "K":
        return ("K", 0)

    # MW1, MW2, MW3
    if team_str.startswith("MW"):
        try:
            num = int(team_str[2:])
        except ValueError:
            num = 0
        return ("MW", num)

    # S1..S7, A1..A4, B1..B4, C1..C4, D1..D4, E1..E6, F1..F4
    if len(team_str) >= 2 and team_str[0] in "SABCDEF" and team_str[1:].isdigit():
        return (team_str[0], int(team_str[1:]))

    # Onbekend team — overslaan
    return None


def categorie_rang(cat_code):
    """Geeft de rang van een categorie (0=hoogst/senioren, 8=laagst/kleuters)."""
    return CATEGORIE_RANG.get(cat_code, -1)


def seizoen_startjaar(seizoen_str):
    """'2020-2021' → 2020"""
    return int(seizoen_str.split("-")[0])


def leeftijd_in_seizoen(geboortedatum_str, seizoen_str):
    """Bereken leeftijd op 1 januari van het seizoens-startjaar.
    Retourneert None als geboortedatum onbekend is.
    """
    if not geboortedatum_str or geboortedatum_str == "?":
        return None
    try:
        geb = datetime.strptime(geboortedatum_str, "%Y-%m-%d")
    except ValueError:
        return None
    startjaar = seizoen_startjaar(seizoen_str)
    # Leeftijd op 1 januari van het startjaar van het seizoen
    ref = datetime(startjaar, 1, 1)
    return ref.year - geb.year - ((ref.month, ref.day) < (geb.month, geb.day))


def format_pad(teams_chronologisch):
    """Format [(seizoen, team), ...] als compact pad-string."""
    parts = []
    for seizoen, team in teams_chronologisch:
        jaar = seizoen_str_kort(seizoen)
        parts.append(f"{team}({jaar})")
    return " → ".join(parts)


def seizoen_str_kort(seizoen):
    """'2020-2021' → '20-21'"""
    parts = seizoen.split("-")
    return f"{parts[0][2:]}-{parts[1][2:]}"


def speler_header(speler):
    """Formatteert speler-header voor output."""
    naam = speler["naam"]
    geslacht = speler.get("geslacht", "?")
    geb = speler.get("geboortedatum", "?")
    sid = speler["speler_id"]
    return f"{naam} ({geslacht}, geb. {geb}) - {sid}"


def categorie_afstand(cat1, cat2):
    """Berekent het absolute verschil in categorierang."""
    r1 = categorie_rang(cat1)
    r2 = categorie_rang(cat2)
    if r1 < 0 or r2 < 0:
        return 0
    return abs(r1 - r2)


def categorie_naam(code):
    """Geeft leesbare naam voor categorie-code."""
    namen = {
        "S": "Senioren", "MW": "Walking Korfbal", "A": "A-junioren",
        "B": "B-junioren", "C": "C-junioren", "D": "D-junioren",
        "E": "E-junioren", "F": "F-junioren", "K": "Kleuters"
    }
    return namen.get(code, code)


# ---------------------------------------------------------------------------
# Bouw chronologisch pad per speler
# ---------------------------------------------------------------------------

def bouw_pad(speler):
    """Bouwt een chronologisch gesorteerde lijst van (seizoen, team, parsed_team)
    voor een speler. Slaat AR, NSL, 'Senioren' over.
    """
    pad = []
    seizoenen = speler.get("seizoenen", {})
    for seizoen in sorted(seizoenen.keys()):
        team_str = seizoenen[seizoen].get("team", "")
        parsed = parse_team(team_str)
        if parsed is None:
            continue
        pad.append((seizoen, team_str, parsed))
    return pad


# ---------------------------------------------------------------------------
# Detectie-functies
# ---------------------------------------------------------------------------

def check_categorie_sprongen(speler, pad):
    """Detecteert onlogische categoriesprongen tussen opeenvolgende seizoenen.

    Verdacht:
    - S/MW ↔ E/F/K (afstand >= 6)
    - A ↔ E/F/K (afstand >= 4)
    - B ↔ F/K (afstand >= 4)
    - Elke sprong van >= 3 categorieën in 1 seizoen is verdacht
    """
    anomalieen = []
    for i in range(1, len(pad)):
        seizoen_prev, team_prev, (cat_prev, _) = pad[i - 1]
        seizoen_curr, team_curr, (cat_curr, _) = pad[i]

        # Alleen opeenvolgende seizoenen checken (max 1 jaar verschil)
        # maar we checken ook bij gaps — dat maakt sprongen juist verdachter
        afstand = categorie_afstand(cat_prev, cat_curr)

        if afstand >= 3:
            # Bepaal richting
            rang_prev = categorie_rang(cat_prev)
            rang_curr = categorie_rang(cat_curr)
            if rang_prev < rang_curr:
                richting = f"van {categorie_naam(cat_prev)} naar {categorie_naam(cat_curr)} (terugval)"
            else:
                richting = f"van {categorie_naam(cat_prev)} naar {categorie_naam(cat_curr)} (sprong omhoog)"

            anomalieen.append({
                "type": "CATEGORIE-SPRONG",
                "speler": speler,
                "pad": pad,
                "detail": f"{team_prev}({seizoen_str_kort(seizoen_prev)}) → {team_curr}({seizoen_str_kort(seizoen_curr)}): {richting} (afstand {afstand})",
                "ernst": afstand,  # hoe groter de afstand, hoe verdachter
                "seizoen_van": seizoen_prev,
                "seizoen_naar": seizoen_curr,
            })

    return anomalieen


def check_leeftijd_mismatch(speler, pad):
    """Detecteert leeftijd vs categorie mismatches."""
    anomalieen = []
    geb = speler.get("geboortedatum", "?")
    if not geb or geb == "?":
        return anomalieen

    for seizoen, team_str, (cat_code, _) in pad:
        leeftijd = leeftijd_in_seizoen(geb, seizoen)
        if leeftijd is None:
            continue

        probleem = None

        # Speler ouder dan 23 in jeugdcategorie E/F/D/C/B
        if cat_code in ("E", "F", "D", "C", "B", "K") and leeftijd > 23:
            probleem = f"Leeftijd {leeftijd} in {categorie_naam(cat_code)} ({team_str})"

        # Speler jonger dan 10 in senioren
        elif cat_code in ("S", "MW") and leeftijd < 10:
            probleem = f"Leeftijd {leeftijd} in {categorie_naam(cat_code)} ({team_str})"

        # Speler jonger dan 8 in A/B-junioren
        elif cat_code in ("A", "B") and leeftijd < 8:
            probleem = f"Leeftijd {leeftijd} in {categorie_naam(cat_code)} ({team_str})"

        if probleem:
            anomalieen.append({
                "type": "LEEFTIJD-MISMATCH",
                "speler": speler,
                "pad": pad,
                "detail": f"Seizoen {seizoen}: {probleem}",
                "ernst": abs(leeftijd - 18),  # hoe verder van normaal, hoe ernstiger
                "seizoen": seizoen,
            })

    return anomalieen


def check_geslacht_mismatch(speler, pad):
    """Detecteert mannelijke spelers in MW teams (walking korfbal vrouwen).
    Rapporteert eenmaal per speler met alle MW-seizoenen samengevat.
    """
    anomalieen = []
    geslacht = speler.get("geslacht", "?")
    if geslacht != "M":
        return anomalieen

    mw_seizoenen = []
    for seizoen, team_str, (cat_code, _) in pad:
        if cat_code == "MW":
            mw_seizoenen.append((seizoen, team_str))

    if mw_seizoenen:
        teams_uniek = sorted(set(t for _, t in mw_seizoenen))
        seizoenen_str = ", ".join(seizoen_str_kort(s) for s, _ in mw_seizoenen)
        anomalieen.append({
            "type": "GESLACHT-MISMATCH",
            "speler": speler,
            "pad": pad,
            "detail": f"Man in {'/'.join(teams_uniek)} ({len(mw_seizoenen)} seizoenen: {seizoenen_str})",
            "ernst": len(mw_seizoenen),
            "seizoen": mw_seizoenen[0][0],
        })

    return anomalieen


def check_yoyo_patronen(speler, pad):
    """Detecteert yo-yo patronen: speler springt heen en weer tussen ver
    uit elkaar liggende categorieën.

    Voorbeeld: S3 → E2 → S3 (ouder+kind wisselen op zelfde spelerspas)
    We zoeken A→B→A patronen waar afstand(A,B) >= 3.
    """
    anomalieen = []
    for i in range(2, len(pad)):
        seizoen_a, team_a, (cat_a, _) = pad[i - 2]
        seizoen_b, team_b, (cat_b, _) = pad[i - 1]
        seizoen_c, team_c, (cat_c, _) = pad[i]

        # Check of de speler "terug" gaat: A → B → C waar A≈C en B ver weg
        afstand_ab = categorie_afstand(cat_a, cat_b)
        afstand_bc = categorie_afstand(cat_b, cat_c)
        afstand_ac = categorie_afstand(cat_a, cat_c)

        # Yo-yo: grote sprong heen en (deels) terug
        if afstand_ab >= 3 and afstand_bc >= 3 and afstand_ac <= 1:
            anomalieen.append({
                "type": "YO-YO PATROON",
                "speler": speler,
                "pad": pad,
                "detail": (
                    f"{team_a}({seizoen_str_kort(seizoen_a)}) → "
                    f"{team_b}({seizoen_str_kort(seizoen_b)}) → "
                    f"{team_c}({seizoen_str_kort(seizoen_c)}): "
                    f"sprong {categorie_naam(cat_a)}→{categorie_naam(cat_b)}→{categorie_naam(cat_c)}"
                ),
                "ernst": afstand_ab + afstand_bc,
                "seizoen_van": seizoen_a,
            })

    return anomalieen


def check_regressie_voorbij_normaal(speler, pad):
    """Detecteert spelers die meerdere categorieën terugvallen.

    Normaal: max 1 categorie terug (A→B, S→A).
    Verdacht: A→E, S→D, B→F, etc.

    We kijken naar het hoogst bereikte niveau en checken of er later
    een terugval van >= 3 categorieën is.
    """
    anomalieen = []

    # Track het hoogste niveau dat de speler ooit bereikt heeft
    hoogste_rang = 99  # laagst (rang 0 = hoogst)
    hoogste_cat = None
    hoogste_seizoen = None
    hoogste_team = None

    for seizoen, team_str, (cat_code, _) in pad:
        rang = categorie_rang(cat_code)
        if rang < 0:
            continue

        if rang < hoogste_rang:
            hoogste_rang = rang
            hoogste_cat = cat_code
            hoogste_seizoen = seizoen
            hoogste_team = team_str

        # Check of huidige positie een grote terugval is t.o.v. het hoogste
        terugval = rang - hoogste_rang
        if terugval >= 3:
            anomalieen.append({
                "type": "GROTE REGRESSIE",
                "speler": speler,
                "pad": pad,
                "detail": (
                    f"Hoogste: {hoogste_team}({seizoen_str_kort(hoogste_seizoen)}) "
                    f"[{categorie_naam(hoogste_cat)}] → "
                    f"{team_str}({seizoen_str_kort(seizoen)}) "
                    f"[{categorie_naam(cat_code)}] (terugval {terugval} categorieën)"
                ),
                "ernst": terugval,
                "seizoen": seizoen,
            })

    # Dedup: alleen de ergste regressie per speler rapporteren
    if anomalieen:
        # Neem de grootste terugval
        anomalieen.sort(key=lambda a: a["ernst"], reverse=True)
        return [anomalieen[0]]

    return anomalieen


# ---------------------------------------------------------------------------
# Hoofdprogramma
# ---------------------------------------------------------------------------

def main():
    # Laad data
    data_path = os.path.normpath(DATA_PATH)
    print(f"Laden: {data_path}")
    with open(data_path, "r", encoding="utf-8") as f:
        spelers = json.load(f)
    print(f"Geladen: {len(spelers)} spelers\n")

    # Verzamel alle anomalieen
    alle_anomalieen = defaultdict(list)
    gezien_per_type = defaultdict(set)  # om duplicaten te voorkomen

    for speler in spelers:
        pad = bouw_pad(speler)
        if len(pad) < 2:
            continue  # Niets te checken met < 2 seizoenen

        sid = speler["speler_id"]

        # 1. Categorie-sprongen
        for a in check_categorie_sprongen(speler, pad):
            key = (sid, a["detail"])
            if key not in gezien_per_type["CATEGORIE-SPRONG"]:
                gezien_per_type["CATEGORIE-SPRONG"].add(key)
                alle_anomalieen["CATEGORIE-SPRONG"].append(a)

        # 2. Leeftijd mismatch
        for a in check_leeftijd_mismatch(speler, pad):
            key = (sid, a["detail"])
            if key not in gezien_per_type["LEEFTIJD-MISMATCH"]:
                gezien_per_type["LEEFTIJD-MISMATCH"].add(key)
                alle_anomalieen["LEEFTIJD-MISMATCH"].append(a)

        # 3. Geslacht mismatch
        for a in check_geslacht_mismatch(speler, pad):
            key = (sid, a["detail"])
            if key not in gezien_per_type["GESLACHT-MISMATCH"]:
                gezien_per_type["GESLACHT-MISMATCH"].add(key)
                alle_anomalieen["GESLACHT-MISMATCH"].append(a)

        # 4. Yo-yo patronen
        for a in check_yoyo_patronen(speler, pad):
            key = (sid, a["detail"])
            if key not in gezien_per_type["YO-YO PATROON"]:
                gezien_per_type["YO-YO PATROON"].add(key)
                alle_anomalieen["YO-YO PATROON"].append(a)

        # 5. Grote regressie
        for a in check_regressie_voorbij_normaal(speler, pad):
            key = (sid, a["detail"])
            if key not in gezien_per_type["GROTE REGRESSIE"]:
                gezien_per_type["GROTE REGRESSIE"].add(key)
                alle_anomalieen["GROTE REGRESSIE"].append(a)

    # ---------------------------------------------------------------------------
    # Output
    # ---------------------------------------------------------------------------

    type_volgorde = [
        "CATEGORIE-SPRONG",
        "YO-YO PATROON",
        "LEEFTIJD-MISMATCH",
        "GROTE REGRESSIE",
        "GESLACHT-MISMATCH",
    ]

    totaal = sum(len(v) for v in alle_anomalieen.values())
    print("=" * 80)
    print(f"ANOMALIE-RAPPORT SPELERSPADEN c.k.v. Oranje Wit")
    print(f"Totaal: {totaal} anomalieën gevonden bij {len(spelers)} spelers")
    print("=" * 80)

    for type_naam in type_volgorde:
        items = alle_anomalieen.get(type_naam, [])
        if not items:
            continue

        # Sorteer op ernst (hoogste eerst)
        items.sort(key=lambda a: a["ernst"], reverse=True)

        print(f"\n{'─' * 80}")
        print(f"  {type_naam} ({len(items)} gevonden)")
        print(f"{'─' * 80}")

        for a in items:
            speler = a["speler"]
            pad = a["pad"]
            print(f"\n  [{type_naam}] {speler_header(speler)}")
            print(f"    Pad: {format_pad([(s, t) for s, t, _ in pad])}")
            print(f"    Probleem: {a['detail']}")

    # ---------------------------------------------------------------------------
    # Samenvatting
    # ---------------------------------------------------------------------------
    print(f"\n{'=' * 80}")
    print("SAMENVATTING")
    print(f"{'=' * 80}")
    for type_naam in type_volgorde:
        count = len(alle_anomalieen.get(type_naam, []))
        if count > 0:
            print(f"  {type_naam:25s}: {count:3d}")
    print(f"  {'─' * 35}")
    print(f"  {'TOTAAL':25s}: {totaal:3d}")
    print()

    # Unieke spelers met anomalieën
    unieke_spelers = set()
    for items in alle_anomalieen.values():
        for a in items:
            unieke_spelers.add(a["speler"]["speler_id"])
    print(f"  Unieke spelers met anomalieën: {len(unieke_spelers)}")
    print(f"  Van totaal {len(spelers)} spelers ({len(unieke_spelers)/len(spelers)*100:.1f}%)")
    print()


if __name__ == "__main__":
    main()
