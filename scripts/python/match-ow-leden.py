#!/usr/bin/env python
"""
match-ow-leden.py — Match OW-xxxx spelers aan echte Sportlink rel_codes

Gebruikt het alle-leden.json master ledenbestand om OW-xxxx spelers in
spelerspaden.json te koppelen aan hun echte Sportlink rel_code.

Matching-strategie (6 passes + datum-verificatie):
1. achternaam + initiaal (exacte key)
2. achternaam + roepnaam/voornaam
3. enige kandidaat met dezelfde achternaam
4. tussenvoegsels in achternaam
5. gehuwde naam (streepjes-achternamen)
6. spellingsnormalisatie (ij/y, oo/o, ck/k)

Extra verificatie: lid_sinds/afmelddatum moet overlappen met spelerspaden-seizoenen.

Gebruik:
  python scripts/match-ow-leden.py --dry-run    # alleen rapport
  python scripts/match-ow-leden.py              # wijzigingen doorvoeren
"""

import argparse
import json
import os
import re
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SPELERSPADEN_PATH = os.path.join(ROOT, "data", "spelers", "spelerspaden.json")
ALLE_LEDEN_PATH = os.path.join(ROOT, "data", "leden", "alle-leden.json")
RAPPORT_PATH = os.path.join(ROOT, "data", "spelers", "ow-matching-rapport.json")

TV = {"van", "de", "het", "der", "den", "'t", "ten", "ter", "in", "vd", "v.d.", "v.", "d."}


# ============================================================
# Naam-parsing (hergebruikt uit schoon-spelerspaden.py)
# ============================================================

def parse_naam(naam, roepnaam_hint=None):
    """Parse naamvariant naar componenten."""
    naam = naam.strip()

    # Extract roepnaam uit haakjes
    roepnaam = ""
    m = re.search(r"\((\w+)\)", naam)
    if m:
        roepnaam = m.group(1)
    naam_clean = re.sub(r"\s*\(.*?\)", "", naam).replace("*", "").strip()
    naam_clean = re.sub(r"\s+", " ", naam_clean)

    if "," in naam_clean:
        result = _parse_komma(naam_clean, roepnaam)
    else:
        result = _parse_voornaam_achternaam(naam_clean, roepnaam)

    # Override roepnaam als hint beschikbaar
    if roepnaam_hint and not result["roepnaam"]:
        result["roepnaam"] = roepnaam_hint.lower()
    if roepnaam_hint and not result["voornaam"]:
        result["voornaam"] = roepnaam_hint.lower()
    if roepnaam_hint and not result["initiaal"]:
        result["initiaal"] = roepnaam_hint[0].upper()

    return result


def _parse_komma(naam, roepnaam):
    left, right = naam.split(",", 1)
    left = left.strip()
    right = right.strip()

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

    if roepnaam:
        voornaam = roepnaam.lower()
    elif len(voornaam_raw) > 1:
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
    parts = naam.split()
    if not parts:
        return {"achternaam_basis": "", "achternaam_vol": "", "tussenvoegsels": "",
                "voornaam": "", "initiaal": "", "roepnaam": ""}

    # Special case: "Achternaam (Roepnaam)" — single word + roepnaam in parens
    if len(parts) == 1 and roepnaam:
        return {
            "achternaam_basis": parts[0].lower(),
            "achternaam_vol": parts[0].lower(),
            "tussenvoegsels": "",
            "voornaam": roepnaam.lower(),
            "initiaal": roepnaam[0].upper(),
            "roepnaam": roepnaam.lower(),
        }

    voornaam = parts[0].lower()
    initiaal = parts[0][0].upper()

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
# Spelling normalisatie
# ============================================================

def _normalize_spelling(s):
    s = s.lower()
    s = s.replace("-", " ").replace("  ", " ").strip()
    s = s.replace("oij", "oy").replace("ooy", "oy")
    s = s.replace("ij", "y")
    s = s.replace("oo", "o").replace("ee", "e")
    s = s.replace("ck", "k")
    if s.endswith("dt"):
        s = s[:-1]
    s = s.replace("ey", "ei")
    s = re.sub(r"(.)\1", r"\1", s)
    return s


def _gehuwde_naam_delen(achternaam):
    if "-" in achternaam:
        return [p.strip().lower() for p in achternaam.split("-") if p.strip()]
    return [achternaam.lower()]


# ============================================================
# Datum-verificatie
# ============================================================

def seizoen_to_years(seizoen):
    """'2015-2016' -> (2015, 2016)"""
    parts = seizoen.split("-")
    return int(parts[0]), int(parts[1])


def lidmaatschap_overlapt(lid, seizoenen, strict=True):
    """
    Check of lid_sinds/afmelddatum overlap heeft met spelerspaden-seizoenen.

    Bij strict=False: accepteer ook als er geen overlap is maar de naam matcht.
    Sportlink registreert soms herinschrijvingen met een nieuwe lid_sinds.
    """
    if not strict:
        return True

    lid_sinds = lid.get("lid_sinds")
    afmelddatum = lid.get("afmelddatum")

    if not lid_sinds:
        return True

    try:
        lid_start = int(lid_sinds[:4])
    except (ValueError, TypeError):
        return True

    lid_eind = 9999
    if afmelddatum:
        try:
            lid_eind = int(afmelddatum[:4])
        except (ValueError, TypeError):
            pass

    for szn in seizoenen:
        start, eind = seizoen_to_years(szn)
        if lid_start <= eind and lid_eind >= start:
            return True

    return False


# ============================================================
# Matching engine
# ============================================================

FAKE_ENTRIES = {
    "s1/s2", "s3/s4", "mw1", "mw2", "a1/a2", "a3/a4",
    "kangoeroes", "iis",
}


def is_fake_entry(speler):
    """Detect teamnamen en andere nep-entries die geen echte spelers zijn."""
    naam = speler.get("naam", "").strip().lower()
    # Exact match teamnamen
    if naam in FAKE_ENTRIES:
        return True
    # Patronen: "S1/S2   4/4 +5/5", "A1/A2   4/4 + 5/5"
    if re.match(r"^[a-z]\d+/[a-z]\d+\s", naam):
        return True
    return False


def match_ow_spelers(ow_spelers, leden):
    """
    Match OW-xxxx spelers aan leden uit alle-leden.json.

    Returns:
        matches: [{ow_idx, lid_idx, method, confidence}]
        unmatched: [ow_idx]
    """
    # Parse alle leden-namen en bouw lookups
    leden_parsed = []
    l_by_ach_ini = {}     # achternaam|initiaal -> [idx]
    l_by_ach_roep = {}    # achternaam|roepnaam -> [idx]
    l_by_ach = {}         # achternaam -> [idx]
    l_by_ach_vol = {}     # achternaam_vol -> [idx]
    l_by_ach_norm = {}    # genormaliseerde achternaam -> [idx]
    l_by_gehuwde = {}     # gehuwde deel|initiaal of |roepnaam -> [idx]

    for i, lid in enumerate(leden):
        # Leden-CSV heeft al gestructureerde velden
        ach = (lid.get("achternaam") or "").strip().lower()
        roep = (lid.get("roepnaam") or "").strip().lower()
        tv = (lid.get("tussenvoegsel") or "").strip().lower()
        vl = (lid.get("voorletters") or "").strip().replace(".", " ").strip()
        ini = vl[0].upper() if vl else (roep[0].upper() if roep else "")

        ach_vol = f"{tv} {ach}".strip() if tv else ach

        parsed = {
            "achternaam_basis": ach,
            "achternaam_vol": ach_vol,
            "tussenvoegsels": tv,
            "voornaam": roep,
            "initiaal": ini,
            "roepnaam": roep,
        }
        leden_parsed.append(parsed)

        # Lookups bouwen
        if ach and ini:
            l_by_ach_ini.setdefault(f"{ach}|{ini}", []).append(i)
        if ach and roep:
            l_by_ach_roep.setdefault(f"{ach}|{roep}", []).append(i)
        if ach:
            l_by_ach.setdefault(ach, []).append(i)
        if ach_vol:
            l_by_ach_vol.setdefault(ach_vol, []).append(i)
        if ach:
            l_by_ach_norm.setdefault(_normalize_spelling(ach), []).append(i)

        # Gehuwde naam delen
        for deel in _gehuwde_naam_delen(ach):
            if deel and ini:
                l_by_gehuwde.setdefault(f"{deel}|{ini}", []).append(i)
            if deel and roep:
                l_by_gehuwde.setdefault(f"{deel}|{roep}", []).append(i)

    # Nu matchen
    matches = []
    matched_l_indices = set()
    matched_ow_indices = set()

    def try_match(ow_idx, l_idx, method, skip_datecheck=False):
        if l_idx in matched_l_indices:
            return False
        if not skip_datecheck:
            speler = ow_spelers[ow_idx]
            lid = leden[l_idx]
            seizoenen = list(speler.get("seizoenen", {}).keys())
            if not lidmaatschap_overlapt(lid, seizoenen):
                return False
        matches.append({"ow_idx": ow_idx, "lid_idx": l_idx, "method": method})
        matched_l_indices.add(l_idx)
        matched_ow_indices.add(ow_idx)
        return True

    def find_and_match(ow_idx, ow_p, lookup, key, method):
        if ow_idx in matched_ow_indices:
            return
        candidates = [i for i in lookup.get(key, []) if i not in matched_l_indices]
        # Datum-filter
        speler = ow_spelers[ow_idx]
        seizoenen = list(speler.get("seizoenen", {}).keys())
        valid = [i for i in candidates if lidmaatschap_overlapt(leden[i], seizoenen)]
        if len(valid) == 1:
            try_match(ow_idx, valid[0], method)

    # Parse OW-xxxx namen
    ow_parsed = []
    for s in ow_spelers:
        p = parse_naam(s["naam"], s.get("roepnaam"))
        ow_parsed.append(p)

    # Pass 1: achternaam + initiaal
    for ow_idx, ow_p in enumerate(ow_parsed):
        key = f"{ow_p['achternaam_basis']}|{ow_p['initiaal']}"
        find_and_match(ow_idx, ow_p, l_by_ach_ini, key, "ach+ini")

    # Pass 2: achternaam + roepnaam
    for ow_idx, ow_p in enumerate(ow_parsed):
        if ow_idx in matched_ow_indices:
            continue
        if ow_p["roepnaam"]:
            key = f"{ow_p['achternaam_basis']}|{ow_p['roepnaam']}"
            find_and_match(ow_idx, ow_p, l_by_ach_roep, key, "ach+roep")

    # Pass 3: achternaam + voornaam (als anders dan roepnaam)
    for ow_idx, ow_p in enumerate(ow_parsed):
        if ow_idx in matched_ow_indices:
            continue
        if ow_p["voornaam"] and ow_p["voornaam"] != ow_p["roepnaam"]:
            key = f"{ow_p['achternaam_basis']}|{ow_p['voornaam']}"
            find_and_match(ow_idx, ow_p, l_by_ach_roep, key, "ach+vnaam")

    # Pass 4: achternaam_vol (met tussenvoegsels)
    for ow_idx, ow_p in enumerate(ow_parsed):
        if ow_idx in matched_ow_indices:
            continue
        # Probeer achternaam_vol als dat verschilt van basis
        if ow_p["achternaam_vol"] != ow_p["achternaam_basis"]:
            key = ow_p["achternaam_vol"]
            candidates = [i for i in l_by_ach_vol.get(key, []) if i not in matched_l_indices]
            speler = ow_spelers[ow_idx]
            seizoenen = list(speler.get("seizoenen", {}).keys())
            valid = [i for i in candidates if lidmaatschap_overlapt(leden[i], seizoenen)]
            if len(valid) == 1:
                try_match(ow_idx, valid[0], "ach_vol")
            elif len(valid) > 1 and ow_p["initiaal"]:
                ini_match = [i for i in valid if leden_parsed[i]["initiaal"] == ow_p["initiaal"]]
                if len(ini_match) == 1:
                    try_match(ow_idx, ini_match[0], "ach_vol+ini")

    # Pass 4b: achternaam_basis bevat tussenvoegsel -> zoek in ach_vol lookup
    # Bijv. OW naam "van Vliet" -> achternaam_basis="vliet" maar leden heeft ach_vol="van vliet"
    for ow_idx, ow_p in enumerate(ow_parsed):
        if ow_idx in matched_ow_indices:
            continue
        # Probeer achternaam_basis als vol-key in leden
        key = ow_p["achternaam_basis"]
        candidates = [i for i in l_by_ach_vol.get(key, []) if i not in matched_l_indices]
        if not candidates:
            continue
        speler = ow_spelers[ow_idx]
        seizoenen = list(speler.get("seizoenen", {}).keys())
        valid = [i for i in candidates if lidmaatschap_overlapt(leden[i], seizoenen)]
        if len(valid) == 1:
            try_match(ow_idx, valid[0], "basis_als_vol")
        elif len(valid) > 1 and ow_p["initiaal"]:
            ini_match = [i for i in valid if leden_parsed[i]["initiaal"] == ow_p["initiaal"]]
            if len(ini_match) == 1:
                try_match(ow_idx, ini_match[0], "basis_als_vol+ini")

    # Pass 5: enige achternaam-kandidaat
    for ow_idx, ow_p in enumerate(ow_parsed):
        if ow_idx in matched_ow_indices:
            continue
        find_and_match(ow_idx, ow_p, l_by_ach, ow_p["achternaam_basis"], "ach_enig")

    # Pass 6: gehuwde naam
    for ow_idx, ow_p in enumerate(ow_parsed):
        if ow_idx in matched_ow_indices:
            continue
        for deel in _gehuwde_naam_delen(ow_p["achternaam_basis"]):
            if ow_idx in matched_ow_indices:
                break
            if ow_p["initiaal"]:
                key = f"{deel}|{ow_p['initiaal']}"
                find_and_match(ow_idx, ow_p, l_by_gehuwde, key, "gehuwde")
            if ow_p["roepnaam"]:
                key = f"{deel}|{ow_p['roepnaam']}"
                find_and_match(ow_idx, ow_p, l_by_gehuwde, key, "gehuwde_roep")

    # Pass 7: genormaliseerde spelling
    for ow_idx, ow_p in enumerate(ow_parsed):
        if ow_idx in matched_ow_indices:
            continue
        an_norm = _normalize_spelling(ow_p["achternaam_basis"])
        candidates = [i for i in l_by_ach_norm.get(an_norm, []) if i not in matched_l_indices]
        speler = ow_spelers[ow_idx]
        seizoenen = list(speler.get("seizoenen", {}).keys())
        valid = [i for i in candidates if lidmaatschap_overlapt(leden[i], seizoenen)]
        if len(valid) == 1:
            try_match(ow_idx, valid[0], "spelling_norm")
        elif len(valid) > 1 and ow_p["initiaal"]:
            ini_match = [i for i in valid if leden_parsed[i]["initiaal"] == ow_p["initiaal"]]
            if len(ini_match) == 1:
                try_match(ow_idx, ini_match[0], "spelling_norm+ini")

    # Pass 8: herhaal ZONDER datumcheck (voor herinschrijvingen)
    # Sommige leden zijn heringeschreven met een nieuwe lid_sinds die niet overlapt
    for ow_idx, ow_p in enumerate(ow_parsed):
        if ow_idx in matched_ow_indices:
            continue
        # 8a: achternaam + initiaal (uniek)
        key = f"{ow_p['achternaam_basis']}|{ow_p['initiaal']}"
        candidates = [i for i in l_by_ach_ini.get(key, []) if i not in matched_l_indices]
        if len(candidates) == 1:
            try_match(ow_idx, candidates[0], "ach+ini_nodate", skip_datecheck=True)
            continue
        # 8a2: meerdere kandidaten maar roepnaam disambigueert
        if len(candidates) > 1 and ow_p["roepnaam"]:
            roep_match = [i for i in candidates if leden_parsed[i]["roepnaam"] == ow_p["roepnaam"]]
            if len(roep_match) == 1:
                try_match(ow_idx, roep_match[0], "ach+ini+roep_nodate", skip_datecheck=True)
                continue

    for ow_idx, ow_p in enumerate(ow_parsed):
        if ow_idx in matched_ow_indices:
            continue
        # 8b: achternaam + roepnaam
        if ow_p["roepnaam"]:
            key = f"{ow_p['achternaam_basis']}|{ow_p['roepnaam']}"
            candidates = [i for i in l_by_ach_roep.get(key, []) if i not in matched_l_indices]
            if len(candidates) == 1:
                try_match(ow_idx, candidates[0], "ach+roep_nodate", skip_datecheck=True)
                continue

    for ow_idx, ow_p in enumerate(ow_parsed):
        if ow_idx in matched_ow_indices:
            continue
        # 8c: achternaam_vol
        if ow_p["achternaam_vol"] != ow_p["achternaam_basis"]:
            candidates = [i for i in l_by_ach_vol.get(ow_p["achternaam_vol"], []) if i not in matched_l_indices]
            if len(candidates) == 1:
                try_match(ow_idx, candidates[0], "ach_vol_nodate", skip_datecheck=True)
                continue

    for ow_idx, ow_p in enumerate(ow_parsed):
        if ow_idx in matched_ow_indices:
            continue
        # 8d: enige achternaam
        candidates = [i for i in l_by_ach.get(ow_p["achternaam_basis"], []) if i not in matched_l_indices]
        if len(candidates) == 1:
            try_match(ow_idx, candidates[0], "ach_enig_nodate", skip_datecheck=True)

    for ow_idx, ow_p in enumerate(ow_parsed):
        if ow_idx in matched_ow_indices:
            continue
        # 8e: gehuwde naam
        for deel in _gehuwde_naam_delen(ow_p["achternaam_basis"]):
            if ow_idx in matched_ow_indices:
                break
            if ow_p["roepnaam"]:
                key = f"{deel}|{ow_p['roepnaam']}"
                candidates = [i for i in l_by_gehuwde.get(key, []) if i not in matched_l_indices]
                if len(candidates) == 1:
                    try_match(ow_idx, candidates[0], "gehuwde_nodate", skip_datecheck=True)

    for ow_idx, ow_p in enumerate(ow_parsed):
        if ow_idx in matched_ow_indices:
            continue
        # 8f: spelling normalisatie
        an_norm = _normalize_spelling(ow_p["achternaam_basis"])
        candidates = [i for i in l_by_ach_norm.get(an_norm, []) if i not in matched_l_indices]
        if len(candidates) == 1:
            try_match(ow_idx, candidates[0], "spelling_nodate", skip_datecheck=True)
        elif len(candidates) > 1 and ow_p["roepnaam"]:
            roep_match = [i for i in candidates if leden_parsed[i]["roepnaam"] == ow_p["roepnaam"]]
            if len(roep_match) == 1:
                try_match(ow_idx, roep_match[0], "spelling+roep_nodate", skip_datecheck=True)

    # Pass 9: fuzzy roepnaam (eerste 3+ letters) + achternaam
    # Vangt: Dave/Davy, Steven/Stefan, Mathijs/Matthijs, Ymke/Imke, Damian/Damien
    l_by_ach_roep_fuzzy = {}  # achternaam|roep[:3] -> [idx] (alleen als roep >= 3 chars)
    for i, p in enumerate(leden_parsed):
        ach = p["achternaam_basis"]
        roep = p["roepnaam"]
        if ach and roep and len(roep) >= 3:
            fuzzy_key = f"{ach}|{roep[:3]}"
            l_by_ach_roep_fuzzy.setdefault(fuzzy_key, []).append(i)

    for ow_idx, ow_p in enumerate(ow_parsed):
        if ow_idx in matched_ow_indices:
            continue
        roep = ow_p["roepnaam"] or ow_p["voornaam"]
        if not roep or len(roep) < 3:
            continue
        ach = ow_p["achternaam_basis"]
        fuzzy_key = f"{ach}|{roep[:3]}"
        candidates = [i for i in l_by_ach_roep_fuzzy.get(fuzzy_key, []) if i not in matched_l_indices]
        if len(candidates) == 1:
            try_match(ow_idx, candidates[0], "fuzzy_roep", skip_datecheck=True)

    unmatched = [i for i in range(len(ow_spelers)) if i not in matched_ow_indices]
    return matches, unmatched


# ============================================================
# Toepassen
# ============================================================

def apply_matches(paden, ow_indices, matches, leden, dry_run=False):
    """
    Pas matches toe op spelerspaden:
    - Vervang speler_id OW-xxxx -> rel_code
    - Vul geboortedatum aan
    - Vul geslacht aan
    - Merge bij duplicaten (als rel_code al bestaat)
    """
    # Bouw index: rel_code -> paden-index (voor duplicate check)
    relcode_to_idx = {}
    for i, s in enumerate(paden):
        if not s["speler_id"].startswith("OW-"):
            relcode_to_idx[s["speler_id"]] = i

    changes = []
    merges = []

    for match in matches:
        ow_idx = match["ow_idx"]
        lid_idx = match["lid_idx"]
        paden_idx = ow_indices[ow_idx]
        speler = paden[paden_idx]
        lid = leden[lid_idx]

        new_relcode = lid["rel_code"]
        old_id = speler["speler_id"]

        # Check: bestaat deze rel_code al in spelerspaden?
        if new_relcode in relcode_to_idx:
            existing_idx = relcode_to_idx[new_relcode]
            existing = paden[existing_idx]
            merges.append({
                "ow_id": old_id,
                "rel_code": new_relcode,
                "naam": speler["naam"],
                "ow_seizoenen": list(speler.get("seizoenen", {}).keys()),
                "bestaande_seizoenen": list(existing.get("seizoenen", {}).keys()),
            })
            continue

        change = {
            "paden_idx": paden_idx,
            "ow_id": old_id,
            "rel_code": new_relcode,
            "naam": speler["naam"],
            "lid_naam": f"{lid.get('roepnaam', '')} {lid.get('tussenvoegsel') or ''} {lid.get('achternaam', '')}".replace("  ", " ").strip(),
            "method": match["method"],
            "verrijkingen": [],
        }

        # Geboortedatum
        if lid.get("geboortedatum") and not speler.get("geboortedatum"):
            change["verrijkingen"].append(("geboortedatum", None, lid["geboortedatum"]))

        # Geslacht
        lid_geslacht = lid.get("geslacht")
        if lid_geslacht and not speler.get("geslacht"):
            change["verrijkingen"].append(("geslacht", None, lid_geslacht))

        # Roepnaam
        if lid.get("roepnaam") and not speler.get("roepnaam"):
            change["verrijkingen"].append(("roepnaam", None, lid["roepnaam"]))

        changes.append(change)

        if not dry_run:
            speler["speler_id"] = new_relcode
            if lid.get("geboortedatum"):
                speler["geboortedatum"] = lid["geboortedatum"]
            if lid_geslacht and not speler.get("geslacht"):
                speler["geslacht"] = lid_geslacht
            if lid.get("roepnaam") and not speler.get("roepnaam"):
                speler["roepnaam"] = lid["roepnaam"]

            # Update index
            relcode_to_idx[new_relcode] = paden_idx

    # Handle merges (OW-xxxx seizoenen toevoegen aan bestaand speler-record)
    merged_remove = []
    for merge in merges:
        if dry_run:
            continue

        existing_idx = relcode_to_idx[merge["rel_code"]]
        existing = paden[existing_idx]

        # Zoek het OW-xxxx record
        ow_record = None
        ow_paden_idx = None
        for i, s in enumerate(paden):
            if s["speler_id"] == merge["ow_id"]:
                ow_record = s
                ow_paden_idx = i
                break

        if ow_record:
            # Merge seizoenen
            for szn, data in ow_record.get("seizoenen", {}).items():
                if szn not in existing.get("seizoenen", {}):
                    existing.setdefault("seizoenen", {})[szn] = data

            merged_remove.append(ow_paden_idx)

    return changes, merges, set(merged_remove)


# ============================================================
# Main
# ============================================================

def main():
    parser = argparse.ArgumentParser(description="Match OW-xxxx spelers aan Sportlink rel_codes")
    parser.add_argument("--dry-run", action="store_true", help="Alleen rapport, geen wijzigingen")
    args = parser.parse_args()

    # Load data
    print("Laden spelerspaden...")
    with open(SPELERSPADEN_PATH, "r", encoding="utf-8") as f:
        paden = json.load(f)

    print("Laden alle-leden.json...")
    with open(ALLE_LEDEN_PATH, "r", encoding="utf-8") as f:
        alle_leden_data = json.load(f)
    leden = alle_leden_data["leden"]

    # Stap 0: Nep-entries en interne duplicaten detecteren
    fake_entries = []
    ow_all = []  # (paden_idx, speler)
    for i, s in enumerate(paden):
        if s["speler_id"].startswith("OW-"):
            if is_fake_entry(s):
                fake_entries.append((i, s))
            else:
                ow_all.append((i, s))

    if fake_entries:
        print(f"  Nep-entries (teamnamen etc.): {len(fake_entries)}")
        for idx, s in fake_entries:
            print(f"    {s['speler_id']}: {s['naam']}")

    # Stap 0b: Merge interne OW-xxxx duplicaten
    print("\nInterne OW-xxxx duplicaten detecteren...")
    from collections import defaultdict
    ow_by_key = defaultdict(list)
    for paden_idx, s in ow_all:
        roep = (s.get("roepnaam") or "").strip().lower()
        naam = s.get("naam", "").strip()
        p = parse_naam(naam, roep)
        ach = p["achternaam_basis"]
        # Gebruik roepnaam OF voornaam uit de naam-parsing
        rn = p["roepnaam"] or p["voornaam"] or roep
        if ach and rn:
            ow_by_key[(rn, ach)].append(paden_idx)

    internal_merges = []
    merged_indices = set()
    for (roep, ach), indices in ow_by_key.items():
        if len(indices) <= 1:
            continue
        # Merge alle seizoenen naar het eerste record
        primary_idx = indices[0]
        primary = paden[primary_idx]
        for dup_idx in indices[1:]:
            dup = paden[dup_idx]
            for szn, data in dup.get("seizoenen", {}).items():
                if szn not in primary.get("seizoenen", {}):
                    primary.setdefault("seizoenen", {})[szn] = data
            # Vul ontbrekende velden aan
            if not primary.get("geslacht") and dup.get("geslacht"):
                primary["geslacht"] = dup["geslacht"]
            if not primary.get("geboortedatum") and dup.get("geboortedatum"):
                primary["geboortedatum"] = dup["geboortedatum"]
            if not primary.get("roepnaam") and dup.get("roepnaam"):
                primary["roepnaam"] = dup["roepnaam"]
            merged_indices.add(dup_idx)
        internal_merges.append({
            "primary": primary["speler_id"],
            "merged": [paden[i]["speler_id"] for i in indices[1:]],
            "naam": f"{roep} {ach}",
            "seizoenen": sorted(primary.get("seizoenen", {}).keys()),
        })

    if internal_merges:
        print(f"  {len(internal_merges)} groepen samengevoegd ({len(merged_indices)} duplicaten verwijderd)")

    # Bouw schone OW-xxxx lijst (na interne merge)
    ow_indices = []
    ow_spelers = []
    for paden_idx, s in ow_all:
        if paden_idx not in merged_indices:
            ow_indices.append(paden_idx)
            ow_spelers.append(s)

    sl_count = len(paden) - len(ow_all) - len(fake_entries)
    print(f"\nSpelerspaden: {len(paden)} totaal ({sl_count} Sportlink, {len(ow_spelers)} OW-xxxx)")
    print(f"Alle leden: {len(leden)}")

    # Match
    print("\nMatching...")
    matches, unmatched = match_ow_spelers(ow_spelers, leden)

    print(f"\nResultaat:")
    print(f"  Gematcht:     {len(matches)} / {len(ow_spelers)} ({100*len(matches)/len(ow_spelers):.0f}%)")
    print(f"  Niet gematcht: {len(unmatched)}")

    # Match-methode verdeling
    from collections import Counter
    methods = Counter(m["method"] for m in matches)
    print(f"\n  Per methode:")
    for method, cnt in methods.most_common():
        print(f"    {method}: {cnt}")

    # Apply
    changes, merges, merge_remove_indices = apply_matches(paden, ow_indices, matches, leden, dry_run=args.dry_run)

    print(f"\n  Wijzigingen: {len(changes)} ID-vervangingen")
    print(f"  Merges: {len(merges)} (OW-xxxx seizoenen -> bestaand record)")

    # Rapport
    rapport = {
        "datum": date.today().isoformat(),
        "dry_run": args.dry_run,
        "ow_totaal_voor_dedup": len(ow_all),
        "nep_entries": len(fake_entries),
        "interne_merges": len(internal_merges),
        "ow_na_dedup": len(ow_spelers),
        "gematcht": len(matches),
        "niet_gematcht": len(unmatched),
        "wijzigingen": len(changes),
        "merges": len(merges),
        "per_methode": dict(methods.most_common()),
        "changes": [
            {
                "ow_id": c["ow_id"],
                "rel_code": c["rel_code"],
                "naam": c["naam"],
                "lid_naam": c["lid_naam"],
                "method": c["method"],
                "verrijkingen": c["verrijkingen"],
            }
            for c in changes
        ],
        "merges": [
            {
                "ow_id": m["ow_id"],
                "rel_code": m["rel_code"],
                "naam": m["naam"],
                "ow_seizoenen": m["ow_seizoenen"],
                "bestaande_seizoenen": m["bestaande_seizoenen"],
            }
            for m in merges
        ],
        "niet_gematcht_lijst": [
            {
                "ow_id": ow_spelers[i]["speler_id"],
                "naam": ow_spelers[i]["naam"],
                "seizoenen": list(ow_spelers[i].get("seizoenen", {}).keys()),
            }
            for i in unmatched
        ],
    }

    with open(RAPPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(rapport, f, ensure_ascii=False, indent=2)
    print(f"\nRapport geschreven: {RAPPORT_PATH}")

    if not args.dry_run:
        # Verwijder nep-entries + interne duplicaten + merge-duplicaten
        remove_indices = set(idx for idx, _ in fake_entries) | merged_indices | merge_remove_indices
        if remove_indices:
            for idx in sorted(remove_indices, reverse=True):
                paden.pop(idx)
            print(f"\n{len(remove_indices)} entries verwijderd ({len(fake_entries)} nep + {len(merged_indices)} intern-dedup + {len(merge_remove_indices)} merge-dedup)")

        if changes or merges or remove_indices:
            with open(SPELERSPADEN_PATH, "w", encoding="utf-8") as f:
                json.dump(paden, f, ensure_ascii=False, indent=2)
            print(f"Spelerspaden bijgewerkt: {SPELERSPADEN_PATH}")

        # Nieuwe tellingen
        new_ow = sum(1 for s in paden if s["speler_id"].startswith("OW-"))
        new_sl = len(paden) - new_ow
        print(f"\nNieuwe verdeling: {len(paden)} totaal ({new_sl} Sportlink, {new_ow} OW-xxxx)")
    elif args.dry_run:
        print("\n--- DRY RUN --- geen wijzigingen gemaakt")

    # Toon niet-gematchte
    if unmatched:
        print(f"\nNiet-gematchte OW-xxxx spelers ({len(unmatched)}):")
        for i in unmatched:
            s = ow_spelers[i]
            szns = sorted(s.get("seizoenen", {}).keys())
            szn_range = f"{szns[0]}..{szns[-1]}" if szns else "?"
            print(f"  {s['speler_id']}: {s['naam']} ({szn_range})")


if __name__ == "__main__":
    main()
