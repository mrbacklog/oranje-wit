#!/usr/bin/env python3
"""
Importeer Sportlink ledenfoto's naar PostgreSQL als WebP (lid_fotos).

Flow:
1) Lees leden uit CSV (standaard docs/alle leden.csv)
2) Haal per relatiecode een signed foto-URL op via Sportlink MemberPhoto
3) Download afbeelding
4) Converteer naar WebP
5) UPSERT in tabel lid_fotos

Vereist:
- env: SPORTLINK_BEARER_TOKEN
- env: DATABASE_URL (in .env of shell)
- pip: requests, psycopg2-binary, Pillow, python-dotenv
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import os
import sys
import time
from typing import Any

import requests
from PIL import Image, UnidentifiedImageError


BASE_URL = "https://clubweb.sportlink.com"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Importeer Sportlink ledenfoto's naar DB als WebP."
    )
    parser.add_argument("--members-csv", default="docs/alle leden.csv")
    parser.add_argument(
        "--photo-endpoint",
        default="/navajo/entity/common/clubweb/member/MemberPhoto?NotificationId=-1&PublicPersonId={relatiecode}",
    )
    parser.add_argument("--output-csv", default="output/leden_fotos_db_import.csv")
    parser.add_argument("--max-members", type=int, default=0, help="0 = alles")
    parser.add_argument(
        "--start-index",
        type=int,
        default=0,
        help="0-based startpositie in CSV voor batch-uitrol.",
    )
    parser.add_argument("--delay", type=float, default=0.10)
    parser.add_argument("--timeout", type=int, default=30)
    parser.add_argument("--webp-quality", type=int, default=80)
    parser.add_argument("--skip-existing", action="store_true")
    return parser.parse_args()


def build_sportlink_session() -> requests.Session:
    token = os.getenv("SPORTLINK_BEARER_TOKEN", "").strip()
    if not token:
        raise RuntimeError("SPORTLINK_BEARER_TOKEN ontbreekt.")
    if not token.lower().startswith("bearer "):
        token = f"Bearer {token}"

    s = requests.Session()
    s.headers.update(
        {
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "nl-NL,nl;q=0.9,en;q=0.8",
            "X-Requested-With": "XMLHttpRequest",
            "Referer": BASE_URL + "/member/search",
            "Origin": BASE_URL,
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/133.0.0.0 Safari/537.36"
            ),
            "Authorization": token,
            "x-navajo-instance": "KNKV",
            "x-navajo-locale": "nl",
        }
    )
    return s


def load_members_from_csv(csv_path: str, start_index: int, max_members: int) -> list[dict[str, str]]:
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"CSV niet gevonden: {csv_path}")

    all_rows: list[dict[str, str]] = []
    with open(csv_path, "r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f, delimiter=";")
        for row in reader:
            rel = str(row.get("Rel. code") or "").strip().strip('"')
            naam = str(row.get("Naam") or "").strip().strip('"')
            if not rel:
                continue
            all_rows.append({"relatiecode": rel, "naam": naam})

    if start_index < 0:
        start_index = 0
    sliced = all_rows[start_index:]
    if max_members:
        sliced = sliced[:max_members]
    return sliced


def extract_photo_url(payload: Any) -> str | None:
    if isinstance(payload, dict):
        photo = payload.get("Photo")
        if isinstance(photo, dict):
            url = photo.get("Url")
            if isinstance(url, str) and url.startswith("http"):
                return url
        for value in payload.values():
            found = extract_photo_url(value)
            if found:
                return found
    if isinstance(payload, list):
        for value in payload:
            found = extract_photo_url(value)
            if found:
                return found
    if isinstance(payload, str) and payload.startswith("http"):
        return payload
    return None


def get_signed_photo_url(
    session: requests.Session,
    photo_endpoint: str,
    relatiecode: str,
    timeout: int,
) -> str | None:
    url = BASE_URL + photo_endpoint.format(relatiecode=relatiecode)
    headers = {"x-navajo-entity": "member/MemberPhoto"}
    resp = session.get(url, headers=headers, timeout=timeout)

    if resp.status_code in (204, 404):
        return None
    if resp.status_code == 401:
        raise RuntimeError("401 van Sportlink: token verlopen of ongeldig.")
    if resp.status_code != 200:
        return None

    try:
        payload = resp.json()
    except json.JSONDecodeError:
        return None
    return extract_photo_url(payload)


def download_image_bytes(url: str, timeout: int) -> bytes | None:
    r = requests.get(url, timeout=timeout)
    if r.status_code != 200:
        return None
    return r.content


def to_webp_bytes(raw_bytes: bytes, quality: int) -> bytes:
    try:
        with Image.open(io.BytesIO(raw_bytes)) as img:
            # WebP ondersteunt alpha, converteer alleen wanneer nodig.
            if img.mode not in ("RGB", "RGBA"):
                img = img.convert("RGBA" if "A" in img.getbands() else "RGB")

            buffer = io.BytesIO()
            img.save(buffer, format="WEBP", quality=quality, method=6)
            return buffer.getvalue()
    except UnidentifiedImageError as exc:
        raise RuntimeError("Kon image niet lezen (onbekend formaat).") from exc


def ensure_output_dir(path: str) -> None:
    parent = os.path.dirname(path)
    if parent:
        os.makedirs(parent, exist_ok=True)


def connect_db():
    try:
        import psycopg2
    except ImportError as exc:
        raise RuntimeError("psycopg2-binary ontbreekt. Installeer met: pip install psycopg2-binary") from exc

    from dotenv import load_dotenv

    load_dotenv(".env")
    db_url = os.getenv("DATABASE_URL", "").strip()
    if not db_url:
        raise RuntimeError("DATABASE_URL niet gevonden (shell of .env).")
    return psycopg2.connect(db_url)


def table_exists(conn, table_name: str) -> bool:
    cur = conn.cursor()
    cur.execute(
        """
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = %s
        )
        """,
        (table_name,),
    )
    exists = bool(cur.fetchone()[0])
    cur.close()
    return exists


def load_existing_relcodes(conn) -> set[str]:
    cur = conn.cursor()
    cur.execute("SELECT rel_code FROM lid_fotos")
    rows = cur.fetchall()
    cur.close()
    return {str(r[0]) for r in rows}


def upsert_lid_foto(
    conn,
    rel_code: str,
    bron_url: str,
    webp_bytes: bytes,
    content_hash: str,
) -> None:
    sql = """
        INSERT INTO lid_fotos (rel_code, bron_url, image_webp, content_hash, source_updated_at, created_at, updated_at)
        VALUES (%s, %s, %s, %s, now(), now(), now())
        ON CONFLICT (rel_code) DO UPDATE SET
            bron_url = EXCLUDED.bron_url,
            image_webp = EXCLUDED.image_webp,
            content_hash = EXCLUDED.content_hash,
            source_updated_at = now(),
            updated_at = now()
    """
    cur = conn.cursor()
    cur.execute(sql, (rel_code, bron_url, psycopg2_binary(webp_bytes), content_hash))
    cur.close()


def psycopg2_binary(payload: bytes):
    import psycopg2

    return psycopg2.Binary(payload)


def write_report(rows: list[dict[str, str]], path: str) -> None:
    ensure_output_dir(path)
    with open(path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "naam",
                "relatiecode",
                "foto_url",
                "status",
                "fout",
                "bytes_webp",
                "hash",
            ],
        )
        writer.writeheader()
        writer.writerows(rows)


def main() -> int:
    args = parse_args()

    try:
        session = build_sportlink_session()
        conn = connect_db()
    except Exception as exc:
        print(f"Fout bij init: {exc}")
        return 1

    if not table_exists(conn, "lid_fotos"):
        conn.close()
        print("Fout: tabel 'lid_fotos' bestaat nog niet in de database.")
        print("Voer eerst schema update uit vanuit de repo-root:")
        print("  pnpm db:push")
        return 1

    try:
        members = load_members_from_csv(args.members_csv, args.start_index, args.max_members)
    except Exception as exc:
        print(f"Fout bij leden inlezen: {exc}")
        return 1

    if not members:
        print("Geen leden gevonden in CSV.")
        return 1

    existing = set()
    if args.skip_existing:
        try:
            existing = load_existing_relcodes(conn)
            print(f"- Bestaande foto's in DB: {len(existing)}")
        except Exception as exc:
            print(f"Waarschuwing: kon bestaande foto's niet laden: {exc}")

    print(f"- Te verwerken leden: {len(members)}")

    report_rows: list[dict[str, str]] = []
    inserted_or_updated = 0
    no_photo = 0
    errors = 0

    for idx, member in enumerate(members, start=1):
        rel = member["relatiecode"]
        naam = member["naam"]

        if args.skip_existing and rel in existing:
            report_rows.append(
                {
                    "naam": naam,
                    "relatiecode": rel,
                    "foto_url": "",
                    "status": "SKIPPED_EXISTING",
                    "fout": "",
                    "bytes_webp": "",
                    "hash": "",
                }
            )
            continue

        foto_url = ""
        status = "OK"
        fout = ""
        bytes_webp = ""
        chash = ""

        try:
            foto_url = get_signed_photo_url(session, args.photo_endpoint, rel, args.timeout) or ""
            if not foto_url:
                status = "NO_PHOTO"
                no_photo += 1
            else:
                raw = download_image_bytes(foto_url, args.timeout)
                if not raw:
                    status = "DOWNLOAD_FAILED"
                    errors += 1
                    fout = "download failed"
                else:
                    webp = to_webp_bytes(raw, args.webp_quality)
                    chash = hashlib.sha256(webp).hexdigest()
                    upsert_lid_foto(conn, rel, foto_url, webp, chash)
                    conn.commit()
                    inserted_or_updated += 1
                    bytes_webp = str(len(webp))
        except Exception as exc:
            conn.rollback()
            status = "ERROR"
            errors += 1
            fout = str(exc)[:200]

        report_rows.append(
            {
                "naam": naam,
                "relatiecode": rel,
                "foto_url": foto_url,
                "status": status,
                "fout": fout,
                "bytes_webp": bytes_webp,
                "hash": chash,
            }
        )

        if idx % 25 == 0 or idx == len(members):
            pct = round((idx / len(members)) * 100)
            print(
                f"  - {idx}/{len(members)} ({pct}%) "
                f"ok={inserted_or_updated} no_photo={no_photo} errors={errors}"
            )

        time.sleep(args.delay)

    conn.close()

    write_report(report_rows, args.output_csv)

    print("\nKlaar.")
    print(f"- Report CSV: {args.output_csv}")
    print(f"- Upserts naar DB: {inserted_or_updated}")
    print(f"- Zonder foto: {no_photo}")
    print(f"- Fouten: {errors}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
