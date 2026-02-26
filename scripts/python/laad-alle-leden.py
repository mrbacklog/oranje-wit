#!/usr/bin/env python
"""
laad-alle-leden.py — Sportlink 'alle leden' CSV -> alle-leden.json + DB sync

Leest de complete Sportlink ledenexport (actief + oud-leden) en maakt er:
1. data/leden/alle-leden.json  — het master ledenbestand
2. Optioneel (--sync-db): vult de PostgreSQL leden-tabel via UPSERT

Gebruik:
  python scripts/laad-alle-leden.py              # alleen JSON genereren
  python scripts/laad-alle-leden.py --sync-db    # JSON + database vullen
"""

import argparse
import csv
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(ROOT, "data", "leden", "snapshots", "raw", "alle-leden-sportlink.csv")
OUTPUT_PATH = os.path.join(ROOT, "data", "leden", "alle-leden.json")


def parse_geslacht(raw):
    """'Man' -> 'M', 'Vrouw' -> 'V'"""
    if not raw:
        return None
    raw = raw.strip().lower()
    if raw in ("man", "m"):
        return "M"
    if raw in ("vrouw", "v"):
        return "V"
    return None


def parse_date(raw):
    """Parse date string, return ISO format or None."""
    if not raw or not raw.strip():
        return None
    raw = raw.strip()
    # Expect YYYY-MM-DD from Sportlink
    if len(raw) >= 10 and raw[4] == "-" and raw[7] == "-":
        return raw[:10]
    return None


def strip_quotes(val):
    """Strip surrounding quotes from CSV values."""
    if val and val.startswith('"') and val.endswith('"'):
        return val[1:-1]
    return val


def load_csv(path):
    """Load alle leden CSV and return list of parsed records."""
    records = []
    dupes = {}

    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter=";")
        for row in reader:
            # Strip quotes from all values
            row = {k: strip_quotes(v.strip()) if v else None for k, v in row.items()}

            rel_code = (row.get("Rel. code") or "").strip()
            if not rel_code:
                continue

            geboortedatum = parse_date(row.get("Geb.dat."))
            geboortejaar = int(geboortedatum[:4]) if geboortedatum else None

            record = {
                "rel_code": rel_code,
                "roepnaam": (row.get("Roepnaam") or "").strip(),
                "achternaam": (row.get("Achternaam") or "").strip(),
                "tussenvoegsel": (row.get("Tussenvoegsel(s)") or "").strip() or None,
                "voorletters": (row.get("Voorletter(s)") or "").strip() or None,
                "geslacht": parse_geslacht(row.get("Geslacht")),
                "geboortedatum": geboortedatum,
                "geboortejaar": geboortejaar,
                "lid_sinds": parse_date(row.get("Lid sinds")),
                "afmelddatum": parse_date(row.get("Afmelddatum")),
                "lidsoort": (row.get("Lidsoort") or "").strip() or None,
            }

            # Track duplicates (some people have 2 rel_codes, e.g. Ron Appelboom)
            if rel_code in dupes:
                print(f"  ! Dubbele rel_code: {rel_code} ({record['roepnaam']} {record['achternaam']})")
                continue
            dupes[rel_code] = True

            records.append(record)

    return records


def write_json(records, path):
    """Write records to JSON."""
    output = {
        "_meta": {
            "beschrijving": "Master ledenregister c.k.v. Oranje Wit - alle leden ooit ingeschreven",
            "bron": "data/leden/snapshots/raw/alle-leden-sportlink.csv",
            "totaal": len(records),
            "gegenereerd": __import__("datetime").date.today().isoformat(),
        },
        "leden": records,
    }

    with open(path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)


def sync_db(records):
    """Sync records to PostgreSQL leden table."""
    try:
        import psycopg2
    except ImportError:
        print("ERROR: psycopg2 niet geinstalleerd. Installeer met: pip install psycopg2-binary")
        sys.exit(1)

    from dotenv import load_dotenv
    load_dotenv(os.path.join(ROOT, ".env"))

    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("ERROR: DATABASE_URL niet gevonden in .env")
        sys.exit(1)

    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    upsert_sql = """
        INSERT INTO leden (rel_code, roepnaam, achternaam, tussenvoegsel, voorletters,
                           geslacht, geboortejaar, geboortedatum, lid_sinds, afmelddatum,
                           lidsoort, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, now())
        ON CONFLICT (rel_code) DO UPDATE SET
            roepnaam = COALESCE(NULLIF(EXCLUDED.roepnaam, ''), leden.roepnaam),
            achternaam = COALESCE(NULLIF(EXCLUDED.achternaam, ''), leden.achternaam),
            tussenvoegsel = COALESCE(EXCLUDED.tussenvoegsel, leden.tussenvoegsel),
            voorletters = COALESCE(EXCLUDED.voorletters, leden.voorletters),
            geslacht = COALESCE(EXCLUDED.geslacht, leden.geslacht),
            geboortejaar = COALESCE(EXCLUDED.geboortejaar, leden.geboortejaar),
            geboortedatum = COALESCE(EXCLUDED.geboortedatum, leden.geboortedatum),
            lid_sinds = COALESCE(EXCLUDED.lid_sinds, leden.lid_sinds),
            afmelddatum = COALESCE(EXCLUDED.afmelddatum, leden.afmelddatum),
            lidsoort = COALESCE(EXCLUDED.lidsoort, leden.lidsoort),
            updated_at = now()
    """

    inserted = 0
    updated = 0
    for r in records:
        cur.execute(upsert_sql, (
            r["rel_code"], r["roepnaam"], r["achternaam"], r["tussenvoegsel"],
            r["voorletters"], r["geslacht"], r["geboortejaar"], r["geboortedatum"],
            r["lid_sinds"], r["afmelddatum"], r["lidsoort"],
        ))
        if cur.statusmessage.startswith("INSERT"):
            inserted += 1
        else:
            updated += 1

    conn.commit()

    cur.execute("SELECT COUNT(*) FROM leden")
    total = cur.fetchone()[0]

    cur.close()
    conn.close()

    print(f"\nDatabase sync:")
    print(f"  Inserted: {inserted}")
    print(f"  Updated:  {updated}")
    print(f"  Totaal in DB: {total}")


def main():
    parser = argparse.ArgumentParser(description="Laad alle leden CSV naar JSON en optioneel DB")
    parser.add_argument("--sync-db", action="store_true", help="Sync naar PostgreSQL")
    args = parser.parse_args()

    print(f"Laden: {CSV_PATH}")
    records = load_csv(CSV_PATH)
    print(f"  {len(records)} leden geladen")

    # Stats
    actief = sum(1 for r in records if not r["afmelddatum"])
    oud = sum(1 for r in records if r["afmelddatum"])
    met_geb = sum(1 for r in records if r["geboortedatum"])
    print(f"  Actief: {actief}, Oud-lid: {oud}")
    print(f"  Met geboortedatum: {met_geb}")

    # Lidsoort verdeling
    from collections import Counter
    lidsoorten = Counter(r["lidsoort"] for r in records)
    for ls, cnt in lidsoorten.most_common():
        print(f"    {ls}: {cnt}")

    print(f"\nSchrijven: {OUTPUT_PATH}")
    write_json(records, OUTPUT_PATH)
    print(f"  {len(records)} leden geschreven")

    if args.sync_db:
        sync_db(records)


if __name__ == "__main__":
    main()
