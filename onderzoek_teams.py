#!/usr/bin/env python3
import psycopg2
import json
from datetime import datetime

conn_string = "postgresql://postgres:owdb2026secret@shinkansen.proxy.rlwy.net:18957/oranjewit"

try:
    conn = psycopg2.connect(conn_string)
    cur = conn.cursor()
    print("✓ Verbonden met database\n")

    # Query 1: Aantal teams per seizoen
    print("=" * 60)
    print("QUERY 1: Aantal teams per seizoen")
    print("=" * 60)
    cur.execute("""
        SELECT seizoen, COUNT(DISTINCT team) as aantal_teams
        FROM competitie_spelers
        GROUP BY seizoen ORDER BY seizoen;
    """)
    rows = cur.fetchall()
    print(f"{'Seizoen':<15} {'Teams':<10}")
    print("-" * 25)
    for row in rows:
        print(f"{row[0]:<15} {row[1]:<10}")
    print()

    # Query 2: Teams in 2025-2026
    print("=" * 60)
    print("QUERY 2: Teams in 2025-2026 (competitie_spelers)")
    print("=" * 60)
    cur.execute("""
        SELECT DISTINCT team, competitie, COUNT(*) as spelers
        FROM competitie_spelers
        WHERE seizoen = '2025-2026'
        GROUP BY team, competitie ORDER BY team, competitie;
    """)
    rows = cur.fetchall()
    print(f"{'Team':<30} {'Competitie':<20} {'Spelers':<10}")
    print("-" * 60)
    for row in rows:
        print(f"{row[0]:<30} {row[1]:<20} {row[2]:<10}")
    print()

    # Query 3: Teams tabel voor 2025-2026
    print("=" * 60)
    print("QUERY 3: Teams tabel voor 2025-2026 (teams table)")
    print("=" * 60)
    cur.execute("""
        SELECT id, ow_code, naam, categorie, leeftijdsgroep, is_selectie
        FROM teams WHERE seizoen = '2025-2026' ORDER BY ow_code;
    """)
    rows = cur.fetchall()
    print(f"{'ID':<5} {'OW Code':<10} {'Naam':<25} {'Cat':<5} {'Leeft.gr':<15} {'Selectie':<10}")
    print("-" * 70)
    for row in rows:
        print(f"{row[0]:<5} {row[1]:<10} {row[2] or 'None':<25} {row[3]:<5} {row[4] or '-':<15} {str(row[5]):<10}")
    print()

    # Query 4: Team periodes
    print("=" * 60)
    print("QUERY 4: Team periodes voor 2025-2026")
    print("=" * 60)
    cur.execute("""
        SELECT t.ow_code, t.naam, tp.periode, tp.j_nummer, tp.pool, tp.sterkte
        FROM team_periodes tp
        JOIN teams t ON t.id = tp.team_id
        WHERE t.seizoen = '2025-2026'
        ORDER BY t.ow_code, tp.periode;
    """)
    rows = cur.fetchall()
    if rows:
        print(f"{'OW Code':<10} {'Naam':<25} {'Periode':<20} {'J-Nr':<10} {'Pool':<15} {'Sterkte':<8}")
        print("-" * 90)
        for row in rows:
            print(f"{row[0]:<10} {row[1] or '-':<25} {row[2]:<20} {row[3] or '-':<10} {row[4] or '-':<15} {str(row[5]) if row[5] else '-':<8}")
    else:
        print("⚠ GEEN team_periodes gevonden!")
    print()

    # Query 5: Teams 2024-2025
    print("=" * 60)
    print("QUERY 5: Teams in 2024-2025")
    print("=" * 60)
    cur.execute("""
        SELECT DISTINCT team FROM competitie_spelers
        WHERE seizoen = '2024-2025' ORDER BY team;
    """)
    rows = cur.fetchall()
    print(f"Aantal unieke teams: {len(rows)}\n")
    for i, row in enumerate(rows, 1):
        print(f"  {i:2}. {row[0]}")
    print()

    # ANALYSE
    print("=" * 60)
    print("ANALYSE")
    print("=" * 60)

    # Team count comparison
    cur.execute("""
        SELECT seizoen, COUNT(DISTINCT team) as teams
        FROM competitie_spelers
        WHERE seizoen IN ('2024-2025', '2025-2026')
        GROUP BY seizoen ORDER BY seizoen;
    """)
    teams_comp = cur.fetchall()
    print("\nTeam-telling vergelijking:")
    for row in teams_comp:
        print(f"  {row[0]}: {row[1]} teams")

    # Check duplicates in team names
    cur.execute("""
        SELECT COUNT(*) as total_rows, COUNT(DISTINCT team) as unique_teams
        FROM competitie_spelers WHERE seizoen = '2025-2026';
    """)
    dup_check = cur.fetchone()
    print(f"\n2025-2026 duplicaten check:")
    print(f"  Totale records: {dup_check[0]}")
    print(f"  Unieke teams: {dup_check[1]}")

    # Teams table count
    cur.execute("""
        SELECT COUNT(*) FROM teams WHERE seizoen = '2025-2026';
    """)
    teams_count = cur.fetchone()[0]
    print(f"\n  Teams in 'teams' tabel: {teams_count}")

    # Check team names without OW code
    cur.execute("""
        SELECT team, COUNT(*) as records
        FROM competitie_spelers
        WHERE seizoen = '2025-2026'
        GROUP BY team
        HAVING COUNT(*) > 10
        ORDER BY COUNT(*) DESC;
    """)
    suspicious = cur.fetchall()
    if suspicious:
        print("\n⚠ Teams met veel records (potentieel dubbele/variant names):")
        for row in suspicious:
            print(f"  {row[0]}: {row[1]} records")

    conn.close()

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
