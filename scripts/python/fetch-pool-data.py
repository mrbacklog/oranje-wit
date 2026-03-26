#!/usr/bin/env python3
"""
Haal alle PoolStand en PoolStandRegel data op uit PostgreSQL
voor seizoen 2025-2026 en 2024-2025.
"""

import os
import json
import csv
import sys
from io import StringIO
from collections import defaultdict

try:
    import psycopg2
    from psycopg2.extras import DictCursor
except ImportError:
    print("⚠️  psycopg2 niet geïnstalleerd. Probeer: pip install psycopg2-binary")
    sys.exit(1)

# Database connection
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL niet ingesteld in .env")
    sys.exit(1)

def fetch_pool_data(seizoen):
    """Haal alle pool-data op voor een seizoen"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor(cursor_factory=DictCursor)

        query = """
        SELECT
          ps.seizoen,
          ps.periode,
          ps.pool,
          ps.niveau,
          ps.regio,
          ps.stand_datum,
          psr.positie,
          psr.team_naam,
          psr.is_ow,
          psr.gs as gespeeld,
          psr.wn as gewonnen,
          psr.gl as gelijk,
          psr.vl as verloren,
          psr.pt as punten,
          psr.vr as doelpunten_voor,
          psr.tg as doelpunten_tegen
        FROM pool_standen ps
        LEFT JOIN pool_stand_regels psr ON ps.id = psr.pool_stand_id
        WHERE ps.seizoen = %s
        ORDER BY ps.periode, ps.niveau, ps.pool, psr.positie
        """

        cur.execute(query, (seizoen,))
        rows = cur.fetchall()
        cur.close()
        conn.close()

        return rows
    except Exception as e:
        print(f"ERROR: Kan database niet bereiken: {e}", file=sys.stderr)
        sys.exit(1)

def main():
    for seizoen in ["2025-2026", "2024-2025"]:
        print(f"\n{'='*70}")
        print(f"PoolStand data voor {seizoen}")
        print(f"{'='*70}\n")

        rows = fetch_pool_data(seizoen)

        if not rows:
            print(f"⚠️  Geen data gevonden voor {seizoen}")
            continue

        print(f"✓ {len(rows)} teamrecords opgehaald\n")

        # Aggregeer per niveau
        niveaus = defaultdict(lambda: {
            'teams': 0,
            'ow_teams': 0,
            'pools': set(),
            'min_punten': float('inf'),
            'max_punten': float('-inf'),
            'punten': [],
            'gespeeld': []
        })

        # CSV output
        print("PERIODE,POOL,NIVEAU,REGIO,STAND_DATUM,POSITIE,TEAM_NAAM,IS_OW,GESPEELD,GEWONNEN,GELIJK,VERLOREN,PUNTEN,DOELPUNTEN_VOOR,DOELPUNTEN_TEGEN,DOELVERSCHIL")

        for row in rows:
            if row['team_naam']:
                # CSV line
                doelverschil = (row['doelpunten_voor'] or 0) - (row['doelpunten_tegen'] or 0)
                print(f"{row['periode']},{row['pool']},{row['niveau'] or ''},{row['regio'] or ''},{row['stand_datum'] or ''},"\
                      f"{row['positie']},{row['team_naam']},{'JA' if row['is_ow'] else 'NEE'},"\
                      f"{row['gespeeld']},{row['gewonnen']},{row['gelijk']},{row['verloren']},"\
                      f"{row['punten']},{row['doelpunten_voor']},{row['doelpunten_tegen']},{doelverschil}")

                # Aggregatie
                niveau = row['niveau'] or 'onbekend'
                niveaus[niveau]['teams'] += 1
                if row['is_ow']:
                    niveaus[niveau]['ow_teams'] += 1
                niveaus[niveau]['pools'].add(row['pool'])
                if row['punten']:
                    niveaus[niveau]['min_punten'] = min(niveaus[niveau]['min_punten'], row['punten'])
                    niveaus[niveau]['max_punten'] = max(niveaus[niveau]['max_punten'], row['punten'])
                    niveaus[niveau]['punten'].append(row['punten'])
                if row['gespeeld']:
                    niveaus[niveau]['gespeeld'].append(row['gespeeld'])

        # Statistieken
        print(f"\n\n=== STATISTIEKEN PER NIVEAU ===\n")
        for niveau in sorted(niveaus.keys()):
            stats = niveaus[niveau]
            gem_punten = sum(stats['punten']) / len(stats['punten']) if stats['punten'] else 0
            gem_gespeeld = sum(stats['gespeeld']) / len(stats['gespeeld']) if stats['gespeeld'] else 0
            pools_str = ', '.join(sorted(stats['pools']))

            print(f"{niveau}")
            print(f"  Teams: {stats['teams']} (waarvan {stats['ow_teams']} OW)")
            print(f"  Pools: {pools_str}")
            print(f"  Punten: min={stats['min_punten']}, max={stats['max_punten']}, gem={gem_punten:.1f}")
            print(f"  Gespeeld: gem={gem_gespeeld:.1f}\n")

if __name__ == "__main__":
    main()
