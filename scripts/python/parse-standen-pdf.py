"""
Parse KNKV eindstanden-PDF's en importeer in PostgreSQL.

Leest PDF's uit docs/Eindstanden/, filtert poules met Oranje Wit (D),
en schrijft direct naar de pool_standen/pool_stand_regels tabellen.

Gebruik:
    python scripts/python/parse-standen-pdf.py                    # alle PDF's
    python scripts/python/parse-standen-pdf.py 2425_ZWT_nj.pdf    # enkel bestand
    python scripts/python/parse-standen-pdf.py --dry-run           # alleen parsen, niet schrijven
"""

import os
import re
import sys
import pdfplumber
import psycopg2
from datetime import datetime
from pathlib import Path

# Paden
ROOT = Path(__file__).resolve().parent.parent.parent
PDF_DIR = ROOT / "docs" / "Eindstanden"

# Database
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:owdb2026secret@shinkansen.proxy.rlwy.net:18957/oranjewit"
)

# Periode-mapping
PERIODE_MAP = {
    "nj": "veld_najaar",
    "zaal": "zaal",
    "vj": "veld_voorjaar",
    "veld": "veld_voorjaar",  # sommige bestanden gebruiken "veld" i.p.v. "vj"
}

# Regex voor standregels: positie teamnaam GS WN GL VL PT VR - TG
STAND_REGEL_RE = re.compile(
    r"^\s*(\d+)\s+"           # positie
    r"(.+?)\s+"               # teamnaam
    r"(\d+)\s+"               # GS
    r"(\d+)\s+"               # WN
    r"(\d+)\s+"               # GL
    r"(\d+)\s+"               # VL
    r"(-?\d+)\s+"             # PT (kan negatief zijn bij strafpunten)
    r"(\d+)\s*-\s*"           # VR -
    r"(\d+)\s*$"              # TG
)

# Regels die we NIET als niveau-header moeten behandelen
SKIP_PREFIXES = (
    "KNKV", "Stand per", "Uitslagen", "Poule ", "GS WN",
)

# Heuristiek: lijkt dit op een standregel die de regex niet matcht?
# Voorkomt dat standregels uit andere poules als niveau worden opgepikt
LIJKT_OP_STAND_RE = re.compile(r"^\s*\d+\s+.+\d+\s*-\s*\d+")


# Datumformaten in de PDF's
DATUM_RE_NL = re.compile(r"Stand per (\d{1,2}-\d{1,2}-\d{4})")
DATUM_RE_US = re.compile(r"Stand per (\d{1,2}/\d{1,2}/\d{4})")


def parse_filename(filename):
    """Parse bestandsnaam naar seizoen, regio, periode."""
    stem = Path(filename).stem.lower()
    parts = stem.split("_")
    if len(parts) < 3:
        return None, None, None

    ssss = parts[0]
    try:
        start_jaar = 2000 + int(ssss[:2])
    except ValueError:
        return None, None, None

    seizoen = f"{start_jaar}-{start_jaar + 1}"
    regio = parts[1].upper()
    periode_code = parts[2].lower()

    # Sommige bestanden: 2425_alles_vj.pdf
    if regio == "ALLES":
        regio = "LND"

    periode = PERIODE_MAP.get(periode_code)
    if not periode:
        return None, None, None

    return seizoen, regio, periode


def parse_stand_datum(text):
    """Extract stand-datum uit tekst."""
    m = DATUM_RE_US.search(text)
    if m:
        try:
            return datetime.strptime(m.group(1), "%m/%d/%Y").date()
        except ValueError:
            pass

    m = DATUM_RE_NL.search(text)
    if m:
        try:
            return datetime.strptime(m.group(1), "%d-%m-%Y").date()
        except ValueError:
            pass

    return None


def parse_pdf(filepath):
    """Parse een eindstanden-PDF en retourneer poules met OW (D)."""
    pdf = pdfplumber.open(filepath)
    all_poules = []
    current_niveau = None
    poule_niveau = None
    current_poule = None
    current_stand = []
    stand_datum = None
    in_stand = False

    for page in pdf.pages:
        text = page.extract_text()
        if not text:
            continue

        # Probeer datum te vinden
        if not stand_datum:
            stand_datum = parse_stand_datum(text)

        for line in text.split("\n"):
            line = line.strip()
            if not line:
                continue

            # Datum op latere pagina's
            if not stand_datum:
                d = parse_stand_datum(line)
                if d:
                    stand_datum = d

            # Skip bekende metadata-regels
            # NB: "KNKV-DISTRICT-..." staat bovenaan elke pagina maar
            # onderbreekt NIET een lopende poulestand
            if line.startswith("KNKV"):
                continue
            if line.startswith(("Stand per", "Uitslagen")):
                in_stand = False
                continue

            # Poule-header
            if line.startswith("Poule "):
                # Sla vorige poule op als die bestond
                if current_poule and current_stand:
                    all_poules.append({
                        "pool": current_poule,
                        "niveau": poule_niveau,
                        "stand": list(current_stand),
                    })
                current_poule = line[6:].strip()
                poule_niveau = current_niveau  # Leg niveau vast bij openen poule
                current_stand = []
                in_stand = False
                continue

            # Kolomheader
            if line == "GS WN GL VL PT VR TG":
                in_stand = True
                continue

            # Standregels: altijd proberen als we in een poule zitten
            if current_poule:
                m = STAND_REGEL_RE.match(line)
                if m:
                    current_stand.append({
                        "positie": int(m.group(1)),
                        "team_naam": m.group(2).strip(),
                        "gs": int(m.group(3)),
                        "wn": int(m.group(4)),
                        "gl": int(m.group(5)),
                        "vl": int(m.group(6)),
                        "pt": int(m.group(7)),
                        "vr": int(m.group(8)),
                        "tg": int(m.group(9)),
                        "is_ow": "Oranje Wit (D)" in m.group(2),
                    })
                    in_stand = True
                    continue
                elif in_stand:
                    in_stand = False

            # Niveau-header detectie: alles wat geen metadata, poule, kolom of standregel is
            # Extra filter: skip regels die eruitzien als standregels (cijfer ... cijfer - cijfer)
            if not in_stand and not LIJKT_OP_STAND_RE.match(line):
                current_niveau = line

    # Laatste poule opslaan
    if current_poule and current_stand:
        all_poules.append({
            "pool": current_poule,
            "niveau": poule_niveau,
            "stand": list(current_stand),
        })

    pdf.close()

    # Filter: alleen poules waar Oranje Wit (D) in speelt
    ow_poules = [
        p for p in all_poules
        if any(r["is_ow"] for r in p["stand"])
    ]

    return ow_poules, stand_datum


def import_to_db(conn, seizoen, regio, periode, poules, stand_datum, bron_bestand):
    """Schrijf geparsede poules naar de database."""
    cur = conn.cursor()
    pool_count = 0
    regel_count = 0

    for poule in poules:
        # Upsert PoolStand
        cur.execute("""
            INSERT INTO pool_standen (seizoen, periode, pool, niveau, regio, stand_datum, bron_bestand)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (seizoen, periode, pool) DO UPDATE SET
                niveau = EXCLUDED.niveau,
                regio = EXCLUDED.regio,
                stand_datum = EXCLUDED.stand_datum,
                bron_bestand = EXCLUDED.bron_bestand
            RETURNING id
        """, (seizoen, periode, poule["pool"], poule["niveau"], regio,
              stand_datum, bron_bestand))
        stand_id = cur.fetchone()[0]

        # Verwijder bestaande regels (volledig vervangen)
        cur.execute("DELETE FROM pool_stand_regels WHERE pool_stand_id = %s", (stand_id,))

        # Insert regels
        for r in poule["stand"]:
            cur.execute("""
                INSERT INTO pool_stand_regels
                    (pool_stand_id, positie, team_naam, is_ow, gs, wn, gl, vl, pt, vr, tg)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (stand_id, r["positie"], r["team_naam"], r["is_ow"],
                  r["gs"], r["wn"], r["gl"], r["vl"], r["pt"], r["vr"], r["tg"]))
            regel_count += 1

        pool_count += 1

    conn.commit()
    cur.close()
    return pool_count, regel_count


def process_file(filepath, conn, dry_run=False):
    """Verwerk een enkel PDF-bestand."""
    filename = os.path.basename(filepath)
    seizoen, regio, periode = parse_filename(filename)

    if not seizoen:
        print(f"  SKIP {filename}: kan bestandsnaam niet parsen")
        return None

    # Alleen ZWT en LND/ALLES
    if regio not in ("ZWT", "LND"):
        return None

    print(f"  {filename} -> {seizoen} {regio} {periode}", end="")

    poules, stand_datum = parse_pdf(filepath)

    print(f" -> {len(poules)} poules met OW (D)", end="")

    if dry_run:
        total_regels = sum(len(p["stand"]) for p in poules)
        print(f", {total_regels} regels (dry-run)")
        return {
            "bestand": filename,
            "seizoen": seizoen,
            "regio": regio,
            "periode": periode,
            "poules": len(poules),
            "regels": total_regels,
        }

    if poules:
        pool_count, regel_count = import_to_db(
            conn, seizoen, regio, periode, poules, stand_datum, filename
        )
        print(f", {regel_count} regels -> DB")
    else:
        print(" (geen data)")

    return {
        "bestand": filename,
        "seizoen": seizoen,
        "regio": regio,
        "periode": periode,
        "poules": len(poules),
    }


def main():
    dry_run = "--dry-run" in sys.argv
    specific_file = None

    for arg in sys.argv[1:]:
        if arg != "--dry-run" and arg.endswith(".pdf"):
            specific_file = arg

    # Database connectie
    conn = None
    if not dry_run:
        conn = psycopg2.connect(DATABASE_URL)

    try:
        if specific_file:
            # Enkel bestand
            filepath = PDF_DIR / specific_file
            if not filepath.exists():
                filepath = Path(specific_file)
            if not filepath.exists():
                print(f"Bestand niet gevonden: {specific_file}")
                sys.exit(1)
            process_file(str(filepath), conn, dry_run)
        else:
            # Alle PDF's verwerken
            pdfs = sorted(PDF_DIR.glob("*.pdf"))
            print(f"Gevonden: {len(pdfs)} PDF's in {PDF_DIR}")
            print()

            # Sorteer: LND eerst, ZWT daarna zodat ZWT kan overschrijven
            # (ZWT heeft betere niveau-detectie vanwege kleinere PDF's)
            # LND voegt extra poules toe die niet in ZWT staan
            pdfs_sorted = sorted(pdfs, key=lambda p: (
                parse_filename(p.name)[0] or "",  # seizoen
                parse_filename(p.name)[2] or "",  # periode
                1 if "ZWT" in p.name.upper() else 0,  # LND eerst, ZWT overschrijft
            ))

            results = []
            for pdf_path in pdfs_sorted:
                result = process_file(str(pdf_path), conn, dry_run)
                if result:
                    results.append(result)

            # Samenvatting
            print(f"\n{'='*60}")
            print(f"Totaal: {len(results)} bestanden verwerkt")
            total_poules = sum(r.get("poules", 0) for r in results)
            print(f"Totaal poules met OW (D): {total_poules}")
            if dry_run:
                total_regels = sum(r.get("regels", 0) for r in results)
                print(f"Totaal regels: {total_regels}")
                print("(dry-run: geen data geschreven)")

    finally:
        if conn:
            conn.close()


if __name__ == "__main__":
    main()
