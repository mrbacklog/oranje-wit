"""
schoon-spelerspaden.py

Opschonen en verrijken van spelerspaden.json op basis van het
autoritatieve Telling-bestand (2010-2019).

Stappen:
1. Match Telling-spelers met spelerspaden via robuuste naam-matching
2. Opschonen: verwijder OW-xxxx entries die niet in Telling voorkomen
3. Verrijken: vul geslacht, team en roepnaam aan uit Telling
4. Toevoegen: voeg ontbrekende Telling-spelers toe aan spelerspaden

Gebruik:
  python scripts/schoon-spelerspaden.py --dry-run    # alleen rapport
  python scripts/schoon-spelerspaden.py              # wijzigingen doorvoeren
"""

import json
import os
import re
import sys
from datetime import date

# --- Config ---

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SPELERSPADEN_PATH = os.path.join(ROOT, "data", "spelers", "spelerspaden.json")
TELLING_PATH = os.path.join(ROOT, "data", "aggregaties", "teamindelingen-telling.json")
RAPPORT_PATH = os.path.join(ROOT, "data", "spelers", "spelerspaden-opschoning.json")

TELLING_SEIZOENEN = [
    "2010-2011", "2011-2012", "2012-2013", "2013-2014",
    "2014-2015", "2015-2016", "2016-2017", "2017-2018",
    "2019-2020",
]

TV = {"van", "de", "het", "der", "den", "'t", "ten", "ter", "in"}


# ============================================================
# Naam-parsing
# ============================================================

def parse_naam(naam):
    """
    Parse elke naamvariant naar gestandaardiseerde componenten.

    Ondersteunde formaten:
    - "Achternaam, [tv] Initiaal (Roepnaam)"  (spelerspaden + telling 2011+)
    - "Achternaam, Voornaam [tv]"              (spelerspaden variant)
    - "Voornaam [tv] Achternaam"               (telling 2010-2011)
    """
    naam = naam.strip()

    # Extract roepnaam uit haakjes
    roepnaam = ""
    m = re.search(r"\((\w+)\)", naam)
    if m:
        roepnaam = m.group(1)
    naam_clean = re.sub(r"\s*\(.*?\)", "", naam).replace("*", "").strip()
    naam_clean = re.sub(r"\s+", " ", naam_clean)

    if "," in naam_clean:
        return _parse_komma_formaat(naam_clean, roepnaam)
    else:
        return _parse_voornaam_achternaam(naam_clean, roepnaam)


def _parse_komma_formaat(naam, roepnaam):
    """Parse 'Achternaam, [tv] Voornaam/Initiaal' of 'Achternaam-X, [tv] Y'."""
    left, right = naam.split(",", 1)
    left = left.strip()
    right = right.strip()

    # Right: [tussenvoegsels] voornaam/initiaal
    r_parts = right.replace(".", " ").split()
    tv_parts = []
    rest_parts = []
    for p in r_parts:
        if not rest_parts and p.lower() in TV:
            tv_parts.append(p.lower())
        else:
            rest_parts.append(p)

    achternaam_basis = left.lower()
    tussenvoegsels = " ".join(tv_parts)
    voornaam_raw = rest_parts[0] if rest_parts else ""
    initiaal = voornaam_raw[0].upper() if voornaam_raw else ""

    # Voornaam: roepnaam > lange naam > raw
    if roepnaam:
        voornaam = roepnaam.lower()
    elif len(voornaam_raw) > 2:
        voornaam = voornaam_raw.lower()
    else:
        voornaam = ""

    achternaam_vol = f"{tussenvoegsels} {achternaam_basis}".strip() if tussenvoegsels else achternaam_basis

    return {
        "achternaam_basis": achternaam_basis,
        "achternaam_vol": achternaam_vol,
        "tussenvoegsels": tussenvoegsels,
        "voornaam": voornaam,
        "initiaal": initiaal,
        "roepnaam": roepnaam.lower() if roepnaam else "",
    }


def _parse_voornaam_achternaam(naam, roepnaam):
    """Parse 'Voornaam [tv] Achternaam' (Telling 2010-2011 formaat)."""
    parts = naam.split()
    if not parts:
        return {"achternaam_basis": "", "achternaam_vol": "", "tussenvoegsels": "",
                "voornaam": "", "initiaal": "", "roepnaam": ""}

    voornaam = parts[0].lower()
    initiaal = parts[0][0].upper()

    # Vind tussenvoegsels en achternaam
    tv_parts = []
    an_parts = []
    for p in parts[1:]:
        if p.lower() in TV and not an_parts:
            tv_parts.append(p.lower())
        else:
            an_parts.append(p.lower())

    achternaam_basis = " ".join(an_parts)
    tussenvoegsels = " ".join(tv_parts)
    achternaam_vol = f"{tussenvoegsels} {achternaam_basis}".strip() if tussenvoegsels else achternaam_basis

    return {
        "achternaam_basis": achternaam_basis,
        "achternaam_vol": achternaam_vol,
        "tussenvoegsels": tussenvoegsels,
        "voornaam": voornaam,
        "initiaal": initiaal,
        "roepnaam": roepnaam.lower() if roepnaam else voornaam,
    }


# ============================================================
# Matching
# ============================================================

def _normalize_spelling(s):
    """Normaliseer veelvoorkomende spellingvariaties."""
    s = s.lower()
    # Streepjes en spaties normaliseren
    s = s.replace("-", " ").replace("  ", " ").strip()
    # ij/y variaties (incl. oij/ooy/oy)
    s = s.replace("oij", "oy").replace("ooy", "oy")
    s = s.replace("ij", "y")
    # Dubbele klinkers
    s = s.replace("oo", "o").replace("ee", "e")
    # ck/k variatie
    s = s.replace("ck", "k")
    # dt/t variatie
    if s.endswith("dt"):
        s = s[:-1]
    # ey/ei variatie
    s = s.replace("ey", "ei")
    # Dubbele medeklinkers vereenvoudigen
    s = re.sub(r"(.)\1", r"\1", s)
    return s


def _gehuwde_naam_basis(achternaam):
    """
    Haal de basis-achternaam uit een gehuwde naam.
    'Camphens-Moerman' -> 'camphens'
    'Visser-Michelsen' -> 'visser'
    'Kuijper-Vanhooydonck' -> ['kuijper', 'vanhooydonck']
    """
    if "-" in achternaam:
        parts = achternaam.split("-")
        return [p.strip().lower() for p in parts if p.strip()]
    return [achternaam.lower()]


def match_seizoen(telling_spelers, paden_spelers):
    """
    Match Telling-spelers met spelerspaden-entries voor één seizoen.

    Returns:
        matched: [(telling_idx, paden_idx, match_type)]
        telling_only: [telling_idx]
        paden_only: [paden_idx]
    """
    # Parse alle namen
    t_parsed = [(i, parse_naam(sp["naam"])) for i, sp in enumerate(telling_spelers)]
    p_parsed = [(i, parse_naam(sp["naam"])) for i, sp in enumerate(paden_spelers)]

    # Bouw lookups voor paden
    p_by_key = {}      # achternaam_basis|initiaal -> [(idx, parsed)]
    p_by_vnkey = {}    # achternaam_basis|voornaam -> [(idx, parsed)]
    p_by_an = {}       # achternaam_basis -> [(idx, parsed)]
    p_by_an_norm = {}  # genormaliseerde achternaam -> [(idx, parsed)]
    p_by_gehuwde = {}  # deel van gehuwde naam|initiaal -> [(idx, parsed)]

    for idx, p in p_parsed:
        key = f"{p['achternaam_basis']}|{p['initiaal']}"
        p_by_key.setdefault(key, []).append((idx, p))
        if p["voornaam"]:
            vnkey = f"{p['achternaam_basis']}|{p['voornaam']}"
            p_by_vnkey.setdefault(vnkey, []).append((idx, p))
        p_by_an.setdefault(p["achternaam_basis"], []).append((idx, p))

        # Genormaliseerde spelling
        an_norm = _normalize_spelling(p["achternaam_basis"])
        p_by_an_norm.setdefault(an_norm, []).append((idx, p))

        # Gehuwde naam-delen
        for deel in _gehuwde_naam_basis(p["achternaam_basis"]):
            gkey = f"{deel}|{p['initiaal']}"
            p_by_gehuwde.setdefault(gkey, []).append((idx, p))
            if p["voornaam"]:
                gvnkey = f"{deel}|{p['voornaam']}"
                p_by_gehuwde.setdefault(gvnkey, []).append((idx, p))

    matched = []
    matched_p_indices = set()
    matched_t_indices = set()

    def try_match(t_idx, p_idx, match_type):
        if p_idx not in matched_p_indices:
            matched.append((t_idx, p_idx, match_type))
            matched_t_indices.add(t_idx)
            matched_p_indices.add(p_idx)
            return True
        return False

    # Pass 1: exacte key (achternaam + initiaal)
    for t_idx, t in t_parsed:
        key = f"{t['achternaam_basis']}|{t['initiaal']}"
        candidates = [c for c in p_by_key.get(key, []) if c[0] not in matched_p_indices]
        if len(candidates) == 1:
            try_match(t_idx, candidates[0][0], "key")

    # Pass 2: achternaam + voornaam
    for t_idx, t in t_parsed:
        if t_idx in matched_t_indices:
            continue
        if not t["voornaam"]:
            continue
        vnkey = f"{t['achternaam_basis']}|{t['voornaam']}"
        candidates = [c for c in p_by_vnkey.get(vnkey, []) if c[0] not in matched_p_indices]
        if len(candidates) == 1:
            try_match(t_idx, candidates[0][0], "voornaam")

    # Pass 3: enige kandidaat met dezelfde achternaam
    for t_idx, t in t_parsed:
        if t_idx in matched_t_indices:
            continue
        candidates = [c for c in p_by_an.get(t["achternaam_basis"], []) if c[0] not in matched_p_indices]
        if len(candidates) == 1:
            try_match(t_idx, candidates[0][0], "achternaam_enig")

    # Pass 4: achternaam_vol match (met tussenvoegsels volledig)
    p_by_anvol = {}
    for idx, p in p_parsed:
        if idx not in matched_p_indices:
            p_by_anvol.setdefault(p["achternaam_vol"], []).append((idx, p))

    for t_idx, t in t_parsed:
        if t_idx in matched_t_indices:
            continue
        candidates = [c for c in p_by_anvol.get(t["achternaam_vol"], []) if c[0] not in matched_p_indices]
        if len(candidates) == 1:
            try_match(t_idx, candidates[0][0], "achternaam_vol")

    # Pass 5: gehuwde naam — match op deel van achternaam + initiaal/voornaam
    # Bijv. Telling "Barbara Camphens" matcht Paden "Camphens-Moerman, B."
    for t_idx, t in t_parsed:
        if t_idx in matched_t_indices:
            continue
        # Zoek in gehuwde-naam lookup
        gkey = f"{t['achternaam_basis']}|{t['initiaal']}"
        candidates = [c for c in p_by_gehuwde.get(gkey, []) if c[0] not in matched_p_indices]
        if len(candidates) == 1:
            try_match(t_idx, candidates[0][0], "gehuwde_naam")
            continue
        if t["voornaam"]:
            gvnkey = f"{t['achternaam_basis']}|{t['voornaam']}"
            candidates = [c for c in p_by_gehuwde.get(gvnkey, []) if c[0] not in matched_p_indices]
            if len(candidates) == 1:
                try_match(t_idx, candidates[0][0], "gehuwde_naam_vn")

    # Pass 6: genormaliseerde spelling (ij/y, oo/o variaties)
    for t_idx, t in t_parsed:
        if t_idx in matched_t_indices:
            continue
        an_norm = _normalize_spelling(t["achternaam_basis"])
        candidates = [c for c in p_by_an_norm.get(an_norm, []) if c[0] not in matched_p_indices]
        if len(candidates) == 1:
            try_match(t_idx, candidates[0][0], "spelling_norm")
        elif len(candidates) > 1 and t["initiaal"]:
            # Filter op initiaal
            ini_cands = [c for c in candidates if c[1]["initiaal"] == t["initiaal"]]
            if len(ini_cands) == 1:
                try_match(t_idx, ini_cands[0][0], "spelling_norm_ini")

    telling_only = [i for i, _ in t_parsed if i not in matched_t_indices]
    paden_only = [i for i, _ in p_parsed if i not in matched_p_indices]

    return matched, telling_only, paden_only


# ============================================================
# Opschonen, verrijken, toevoegen
# ============================================================

def bepaal_acties(paden, telling_data):
    """
    Analyseer alle seizoenen en bepaal welke acties nodig zijn.
    Returns een rapport-dict.
    """
    rapport = {
        "datum": date.today().isoformat(),
        "seizoenen": {},
        "verwijderen": [],       # (speler_idx, reden)
        "verrijken": [],         # (speler_idx, veld, oude_waarde, nieuwe_waarde)
        "toevoegen": [],         # nieuwe speler-dicts
    }

    # Index: per seizoen welke paden-spelers er zijn
    paden_per_seizoen = {}
    for idx, speler in enumerate(paden):
        for szn in speler.get("seizoenen", {}):
            paden_per_seizoen.setdefault(szn, []).append(idx)

    # Per seizoen matchen
    telling_only_totaal = {}  # telling_naam -> set(seizoenen) voor toevoeg-logica

    for szn in TELLING_SEIZOENEN:
        if szn not in telling_data.get("seizoenen", {}):
            continue

        td = telling_data["seizoenen"][szn]
        telling_spelers = td["spelers"]

        # Paden-spelers voor dit seizoen
        pad_indices = paden_per_seizoen.get(szn, [])
        pad_spelers = [{"naam": paden[i]["naam"], "idx": i} for i in pad_indices]

        matched, t_only, p_only = match_seizoen(telling_spelers, pad_spelers)

        # Seizoen-rapport
        szn_rapport = {
            "telling_totaal": len(telling_spelers),
            "paden_totaal": len(pad_spelers),
            "matched": len(matched),
            "telling_only": len(t_only),
            "paden_only": len(p_only),
            "match_pct": round(len(matched) / len(telling_spelers) * 100, 1) if telling_spelers else 0,
        }
        rapport["seizoenen"][szn] = szn_rapport

        # --- Verrijken: gematchte spelers ---
        for t_idx, p_local_idx, match_type in matched:
            t_sp = telling_spelers[t_idx]
            p_global_idx = pad_spelers[p_local_idx]["idx"]
            speler = paden[p_global_idx]
            szn_data = speler["seizoenen"].get(szn, {})

            # Geslacht aanvullen
            if not speler.get("geslacht") and t_sp.get("geslacht"):
                g = "V" if t_sp["geslacht"] in ("V", "D") else "M"
                rapport["verrijken"].append((p_global_idx, "geslacht", speler.get("geslacht"), g, szn))

            # Team corrigeren
            t_team = t_sp.get("team")
            p_team = szn_data.get("team")
            if t_team and p_team and t_team != p_team:
                rapport["verrijken"].append((p_global_idx, f"seizoenen.{szn}.team", p_team, t_team, szn))

            # Roepnaam aanvullen
            t_parsed = parse_naam(t_sp["naam"])
            if t_parsed["roepnaam"] and not speler.get("roepnaam"):
                rapport["verrijken"].append((p_global_idx, "roepnaam", None, t_parsed["roepnaam"].capitalize(), szn))

        # --- Opschonen: paden-only entries ---
        for p_local_idx in p_only:
            p_global_idx = pad_spelers[p_local_idx]["idx"]
            speler = paden[p_global_idx]

            # Alleen OW-xxxx IDs verwijderen
            if speler.get("speler_id", "").startswith("OW-"):
                # Check of deze speler ook in andere Telling-seizoenen voorkomt (dan niet verwijderen)
                andere_seizoenen = [s for s in speler.get("seizoenen", {}) if s != szn]
                alleen_dit_seizoen = all(s not in TELLING_SEIZOENEN or s == szn for s in andere_seizoenen)

                rapport["verwijderen"].append({
                    "speler_idx": p_global_idx,
                    "speler_id": speler["speler_id"],
                    "naam": speler["naam"],
                    "seizoen": szn,
                    "reden": "niet_in_telling",
                    "alle_seizoenen": list(speler.get("seizoenen", {}).keys()),
                    "alleen_verwijder_seizoen": True,  # verwijder alleen dit seizoen, niet de hele speler
                })

        # --- Telling-only: kandidaten voor toevoeging ---
        for t_idx in t_only:
            t_sp = telling_spelers[t_idx]
            naam = t_sp["naam"]
            telling_only_totaal.setdefault(naam, set()).add(szn)

    # --- Toevoegen: spelers die in meerdere Telling-seizoenen voorkomen ---
    max_ow = 0
    for sp in paden:
        sid = sp.get("speler_id", "")
        if sid.startswith("OW-"):
            try:
                num = int(sid.replace("OW-", ""))
                max_ow = max(max_ow, num)
            except ValueError:
                pass

    ow_counter = max_ow + 1

    for naam, seizoenen in telling_only_totaal.items():
        # Voeg toe als in minstens 2 seizoenen OF als het een duidelijke voornaam+achternaam is
        parsed = parse_naam(naam)
        heeft_voornaam = len(parsed["voornaam"]) > 2

        if len(seizoenen) >= 2 or heeft_voornaam:
            # Bouw seizoenen-dict
            szn_dict = {}
            for szn in seizoenen:
                td = telling_data["seizoenen"][szn]
                for sp in td["spelers"]:
                    if sp["naam"] == naam:
                        g_raw = sp.get("geslacht")
                        geslacht = "V" if g_raw in ("V", "D") else ("M" if g_raw in ("M", "H") else None)
                        szn_dict[szn] = {
                            "team": sp.get("team", "Onbekend"),
                            "categorie": "Onbekend",
                            "rol": "speler",
                        }
                        break

            # Bepaal geslacht uit Telling
            geslacht = None
            for szn in seizoenen:
                td = telling_data["seizoenen"][szn]
                for sp in td["spelers"]:
                    if sp["naam"] == naam and sp.get("geslacht"):
                        geslacht = "V" if sp["geslacht"] in ("V", "D") else "M"
                        break
                if geslacht:
                    break

            nieuwe_speler = {
                "speler_id": f"OW-{ow_counter:04d}",
                "naam": naam,
                "roepnaam": parsed["roepnaam"].capitalize() if parsed["roepnaam"] else "",
                "geslacht": geslacht,
                "geboortedatum": None,
                "bron_id": "telling",
                "seizoenen": szn_dict,
            }
            rapport["toevoegen"].append(nieuwe_speler)
            ow_counter += 1

    return rapport


def pas_toe(paden, rapport):
    """Pas de wijzigingen uit het rapport toe op de spelerspaden."""
    # 1. Verrijken
    for item in rapport["verrijken"]:
        idx, veld, _oud, nieuw, _szn = item
        if "." in veld:
            parts = veld.split(".")
            obj = paden[idx]
            for p in parts[:-1]:
                obj = obj[p]
            obj[parts[-1]] = nieuw
        else:
            paden[idx][veld] = nieuw

    # 2. Opschonen: verwijder seizoen-entries (niet hele spelers)
    seizoenen_te_verwijderen = {}  # speler_idx -> set(seizoenen)
    for item in rapport["verwijderen"]:
        idx = item["speler_idx"]
        szn = item["seizoen"]
        seizoenen_te_verwijderen.setdefault(idx, set()).add(szn)

    for idx, seizoenen in seizoenen_te_verwijderen.items():
        for szn in seizoenen:
            if szn in paden[idx].get("seizoenen", {}):
                del paden[idx]["seizoenen"][szn]

    # Verwijder spelers die geen seizoenen meer over hebben
    paden[:] = [sp for sp in paden if sp.get("seizoenen")]

    # 3. Toevoegen
    for nieuwe_speler in rapport["toevoegen"]:
        paden.append(nieuwe_speler)

    return paden


# ============================================================
# Main
# ============================================================

def main():
    dry_run = "--dry-run" in sys.argv

    # Laad data
    with open(SPELERSPADEN_PATH, "r", encoding="utf-8") as f:
        paden = json.load(f)
    with open(TELLING_PATH, "r", encoding="utf-8") as f:
        telling_data = json.load(f)

    print(f"Spelerspaden: {len(paden)} spelers")
    print(f"Telling-seizoenen: {', '.join(TELLING_SEIZOENEN)}")
    print(f"Modus: {'DRY-RUN (geen wijzigingen)' if dry_run else 'TOEPASSEN'}")
    print()

    # Analyseer
    rapport = bepaal_acties(paden, telling_data)

    # Print rapport
    print("=" * 60)
    print("  MATCHING PER SEIZOEN")
    print("=" * 60)
    for szn in sorted(rapport["seizoenen"].keys()):
        s = rapport["seizoenen"][szn]
        print(f"  {szn}: {s['matched']}/{s['telling_totaal']} matched ({s['match_pct']}%), "
              f"T-only={s['telling_only']}, P-only={s['paden_only']}")

    print()
    print("=" * 60)
    print("  ACTIES")
    print("=" * 60)

    # Verrijken
    verrijkingen_per_veld = {}
    for item in rapport["verrijken"]:
        veld = item[1].split(".")[0] if "." in item[1] else item[1]
        verrijkingen_per_veld[veld] = verrijkingen_per_veld.get(veld, 0) + 1
    print(f"\n  Verrijken: {len(rapport['verrijken'])} wijzigingen")
    for veld, count in sorted(verrijkingen_per_veld.items()):
        print(f"    {veld}: {count}")

    # Opschonen
    unique_spelers_te_verwijderen = len(set(item["speler_idx"] for item in rapport["verwijderen"]))
    print(f"\n  Opschonen: {len(rapport['verwijderen'])} seizoen-entries verwijderen "
          f"(bij {unique_spelers_te_verwijderen} unieke spelers)")

    # Eerste 10 verwijderingen tonen
    if rapport["verwijderen"]:
        print("    Voorbeelden:")
        for item in rapport["verwijderen"][:10]:
            print(f"      {item['speler_id']} {item['naam'][:35]:<35s} szn={item['seizoen']} "
                  f"alle_szn={item['alle_seizoenen']}")

    # Toevoegen
    print(f"\n  Toevoegen: {len(rapport['toevoegen'])} nieuwe spelers")
    if rapport["toevoegen"]:
        print("    Voorbeelden:")
        for sp in rapport["toevoegen"][:10]:
            szn_list = list(sp["seizoenen"].keys())
            print(f"      {sp['speler_id']} {sp['naam'][:35]:<35s} g={sp['geslacht']} "
                  f"szn={szn_list}")

    # Samenvatting
    print()
    print("=" * 60)
    print("  SAMENVATTING")
    print("=" * 60)
    print(f"  Spelers voor:  {len(paden)}")
    print(f"  Verrijkingen:  {len(rapport['verrijken'])}")
    print(f"  Verwijderingen:{len(rapport['verwijderen'])} seizoen-entries ({unique_spelers_te_verwijderen} spelers)")
    print(f"  Toevoegingen:  {len(rapport['toevoegen'])} spelers")
    print(f"  Spelers na:    ~{len(paden) - unique_spelers_te_verwijderen + len(rapport['toevoegen'])}")

    if dry_run:
        # Sla rapport op
        rapport_out = {
            "_meta": {"datum": rapport["datum"], "modus": "dry-run"},
            "seizoenen": rapport["seizoenen"],
            "verrijken_count": len(rapport["verrijken"]),
            "verwijderen_count": len(rapport["verwijderen"]),
            "toevoegen_count": len(rapport["toevoegen"]),
            "verwijderen_details": rapport["verwijderen"][:50],
            "toevoegen_details": [
                {"naam": sp["naam"], "geslacht": sp["geslacht"],
                 "seizoenen": list(sp["seizoenen"].keys())}
                for sp in rapport["toevoegen"][:50]
            ],
        }
        os.makedirs(os.path.dirname(RAPPORT_PATH), exist_ok=True)
        with open(RAPPORT_PATH, "w", encoding="utf-8") as f:
            json.dump(rapport_out, f, ensure_ascii=False, indent=2)
        print(f"\n  Rapport: {RAPPORT_PATH}")
        print("  Draai zonder --dry-run om wijzigingen door te voeren.")
    else:
        # Toepassen
        paden = pas_toe(paden, rapport)

        # Opslaan
        with open(SPELERSPADEN_PATH, "w", encoding="utf-8") as f:
            json.dump(paden, f, ensure_ascii=False, indent=2)
        print(f"\n  Opgeslagen: {SPELERSPADEN_PATH} ({len(paden)} spelers)")

        # Volledig rapport opslaan
        rapport_out = {
            "_meta": {"datum": rapport["datum"], "modus": "toegepast"},
            "seizoenen": rapport["seizoenen"],
            "verrijken_count": len(rapport["verrijken"]),
            "verwijderen_count": len(rapport["verwijderen"]),
            "toevoegen_count": len(rapport["toevoegen"]),
        }
        os.makedirs(os.path.dirname(RAPPORT_PATH), exist_ok=True)
        with open(RAPPORT_PATH, "w", encoding="utf-8") as f:
            json.dump(rapport_out, f, ensure_ascii=False, indent=2)
        print(f"  Rapport: {RAPPORT_PATH}")


if __name__ == "__main__":
    main()
