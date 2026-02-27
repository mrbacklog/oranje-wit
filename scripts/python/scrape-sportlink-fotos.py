#!/usr/bin/env python3
"""
Scrape ledenfoto-URLs uit Sportlink Clubweb en exporteer naar CSV.

Gebruik (PowerShell):
  $env:SPORTLINK_SESSION_COOKIE="..."
  $env:SPORTLINK_XSRF_TOKEN="..."
  python scripts/python/scrape-sportlink-fotos.py --output "output/leden_fotos.csv"
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import sys
import time
from typing import Any

import requests

BASE_URL = "https://clubweb.sportlink.com"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Sportlink ledenfoto scraper (naam, relatiecode, signed foto_url)."
    )
    parser.add_argument("--output", default="output/leden_fotos.csv")
    parser.add_argument(
        "--members-csv",
        default="",
        help="Optioneel pad naar CSV met leden (bijv. docs/alle leden.csv) als bron i.p.v. search-endpoint.",
    )
    parser.add_argument("--search-endpoint", default="/api/persons/search")
    parser.add_argument("--search-method", choices=["GET", "POST"], default="GET")
    parser.add_argument("--photo-endpoint", default="/api/persons/{relatiecode}/photo")
    parser.add_argument(
        "--auth-mode",
        choices=["cookie", "bearer"],
        default="cookie",
        help="cookie = sportlink_session + XSRF, bearer = Authorization token",
    )
    parser.add_argument("--navajo-instance", default="KNKV")
    parser.add_argument("--navajo-locale", default="nl")
    parser.add_argument(
        "--search-navajo-entity",
        default="member/search/SearchMembers",
        help="x-navajo-entity header voor search requests",
    )
    parser.add_argument(
        "--photo-navajo-entity",
        default="member/MemberPhoto",
        help="x-navajo-entity header voor photo requests",
    )
    parser.add_argument("--page-size", type=int, default=100)
    parser.add_argument(
        "--max-members",
        type=int,
        default=0,
        help="0 = geen limiet, anders stop na N leden (handig voor test).",
    )
    parser.add_argument("--delay", type=float, default=0.25, help="Seconden tussen requests")
    parser.add_argument("--timeout", type=int, default=30, help="Request timeout in seconden")
    parser.add_argument(
        "--include-former-members",
        action="store_true",
        help="Neem ook oud-leden mee (indien endpoint dit ondersteunt).",
    )
    parser.add_argument(
        "--field-items",
        default="items",
        help="Veldnaam van lijst met leden in search response (bijv. items/results/data).",
    )
    parser.add_argument(
        "--field-total",
        default="totalCount",
        help="Veldnaam met totaal aantal leden in search response.",
    )
    parser.add_argument(
        "--field-relation-code",
        default="relationCode",
        help="Veldnaam relatiecode in member object.",
    )
    parser.add_argument(
        "--field-full-name",
        default="fullName",
        help="Veldnaam volledige naam in member object.",
    )
    parser.add_argument(
        "--debug-first-response",
        action="store_true",
        help="Print keys van eerste response om veldnamen snel te vinden.",
    )
    return parser.parse_args()


def build_session(args: argparse.Namespace) -> requests.Session:
    s = requests.Session()
    common_headers = {
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
    }

    if args.auth_mode == "cookie":
        session_cookie = os.getenv("SPORTLINK_SESSION_COOKIE", "").strip()
        xsrf_token = os.getenv("SPORTLINK_XSRF_TOKEN", "").strip()
        if not session_cookie:
            raise RuntimeError("SPORTLINK_SESSION_COOKIE ontbreekt.")
        if not xsrf_token:
            raise RuntimeError("SPORTLINK_XSRF_TOKEN ontbreekt.")

        s.cookies.set("sportlink_session", session_cookie, domain="clubweb.sportlink.com")
        # Sommige backends accepteren alleen de cookie naast de header.
        s.cookies.set("XSRF-TOKEN", xsrf_token, domain="clubweb.sportlink.com")
        common_headers["X-XSRF-TOKEN"] = xsrf_token

    if args.auth_mode == "bearer":
        bearer = os.getenv("SPORTLINK_BEARER_TOKEN", "").strip()
        if not bearer:
            raise RuntimeError("SPORTLINK_BEARER_TOKEN ontbreekt.")
        if not bearer.lower().startswith("bearer "):
            bearer = f"Bearer {bearer}"
        common_headers["Authorization"] = bearer
        common_headers["x-navajo-instance"] = args.navajo_instance
        common_headers["x-navajo-locale"] = args.navajo_locale

    s.headers.update(common_headers)
    return s


def request_search_page(
    session: requests.Session,
    args: argparse.Namespace,
    page: int,
) -> requests.Response:
    url = BASE_URL + args.search_endpoint
    params = {"page": page, "pageSize": args.page_size}
    if args.include_former_members:
        params["includeFormerMembers"] = "true"

    if args.search_method == "GET":
        return session.get(url, params=params, timeout=args.timeout)

    payload = {"page": page, "pageSize": args.page_size}
    if args.include_former_members:
        payload["includeFormerMembers"] = True
    headers: dict[str, str] = {}
    if args.auth_mode == "bearer":
        headers["x-navajo-entity"] = args.search_navajo_entity
        headers["content-type"] = "text/plain;charset=UTF-8"
        payload = {
            "PageNumber": page,
            "PageSize": args.page_size,
            "IncludeFormerMembers": bool(args.include_former_members),
            "Filters": {"InputSimple": {"SearchValue": {"Options": [{"Value": ""}]}}},
        }
        return session.post(url, data=json.dumps(payload), headers=headers, timeout=args.timeout)
    return session.post(url, json=payload, timeout=args.timeout)


def get_member_name(member: dict[str, Any], full_name_field: str) -> str:
    name = str(member.get(full_name_field) or "").strip()
    if name:
        return name

    first = str(
        member.get("firstName")
        or member.get("voornaam")
        or member.get("roepnaam")
        or ""
    ).strip()
    middle = str(member.get("middleName") or member.get("tussenvoegsel") or "").strip()
    last = str(member.get("lastName") or member.get("achternaam") or "").strip()
    return " ".join(part for part in [first, middle, last] if part).strip()


def load_members_from_csv(csv_path: str) -> list[dict[str, Any]]:
    members: list[dict[str, Any]] = []
    with open(csv_path, "r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f, delimiter=";")
        for row in reader:
            relation_code = str(row.get("Rel. code") or "").strip().strip('"')
            full_name = str(row.get("Naam") or "").strip().strip('"')
            if not relation_code:
                continue
            members.append(
                {
                    "PublicPersonId": relation_code,
                    "FullName": full_name,
                    "relationCode": relation_code,
                    "fullName": full_name,
                }
            )
    return members


def get_all_members(session: requests.Session, args: argparse.Namespace) -> list[dict[str, Any]]:
    members: list[dict[str, Any]] = []
    page = 1
    seen_codes: set[str] = set()

    while True:
        response = request_search_page(session, args, page)
        if response.status_code == 401:
            raise RuntimeError("Niet geauthenticeerd (401). Controleer je cookies/tokens.")
        if response.status_code != 200:
            raise RuntimeError(
                f"Zoek-endpoint gaf HTTP {response.status_code}: {response.text[:250]}"
            )

        try:
            data = response.json()
        except json.JSONDecodeError as exc:
            raise RuntimeError(f"Geen JSON uit zoek-endpoint: {response.text[:250]}") from exc

        if page == 1 and args.debug_first_response:
            keys = list(data.keys()) if isinstance(data, dict) else []
            print(f"[debug] Eerste response keys: {keys}")

        if not isinstance(data, dict):
            raise RuntimeError(f"Onverwacht response-formaat, verwacht dict maar kreeg: {type(data)}")

        items = data.get(args.field_items, [])
        if not items and isinstance(data.get("Members"), list):
            items = data.get("Members", [])
        if not isinstance(items, list):
            raise RuntimeError(
                f"Veld '{args.field_items}' is geen lijst. Gebruik --field-items met juiste waarde."
            )

        if not items:
            break

        page_new = 0
        for item in items:
            if not isinstance(item, dict):
                continue
            rel = str(item.get(args.field_relation_code) or "").strip()
            if rel and rel in seen_codes:
                continue
            if rel:
                seen_codes.add(rel)
            members.append(item)
            page_new += 1
            if args.max_members and len(members) >= args.max_members:
                break

        total = data.get(args.field_total)
        total_text = str(total) if total is not None else "?"
        print(
            f"- Pagina {page}: +{page_new} leden "
            f"(totaal opgehaald: {len(members)}/{total_text})"
        )

        if isinstance(total, int) and len(members) >= total:
            break
        if args.max_members and len(members) >= args.max_members:
            break

        page += 1
        time.sleep(args.delay)

    return members


def extract_photo_url(payload: Any) -> str | None:
    if isinstance(payload, str):
        payload = payload.strip()
        return payload if payload.startswith("http") else None

    if isinstance(payload, dict):
        for key in (
            "url",
            "photoUrl",
            "imageUrl",
            "src",
            "downloadUrl",
            "signedUrl",
            "documentUrl",
        ):
            value = payload.get(key)
            if isinstance(value, str) and value.startswith("http"):
                return value
        for value in payload.values():
            found = extract_photo_url(value)
            if found:
                return found

    if isinstance(payload, list):
        for value in payload:
            found = extract_photo_url(value)
            if found:
                return found

    return None


def get_photo_url(
    session: requests.Session,
    args: argparse.Namespace,
    relatiecode: str,
) -> str | None:
    url = BASE_URL + args.photo_endpoint.format(relatiecode=relatiecode)
    headers: dict[str, str] = {}
    if args.auth_mode == "bearer":
        headers["x-navajo-entity"] = args.photo_navajo_entity
    response = session.get(url, headers=headers, timeout=args.timeout)

    if response.status_code in (204, 404):
        return None
    if response.status_code == 401:
        raise RuntimeError("Sessie verlopen tijdens foto-ophalen (401).")
    if response.status_code != 200:
        return None

    text = response.text.strip()
    if not text:
        return None

    try:
        payload = response.json()
    except json.JSONDecodeError:
        return text if text.startswith("http") else None

    return extract_photo_url(payload)


def ensure_output_dir(path: str) -> None:
    parent = os.path.dirname(path)
    if parent:
        os.makedirs(parent, exist_ok=True)


def write_csv(rows: list[dict[str, str]], output_path: str) -> None:
    ensure_output_dir(output_path)
    with open(output_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["naam", "relatiecode", "foto_url"])
        writer.writeheader()
        writer.writerows(rows)


def main() -> int:
    args = parse_args()

    try:
        session = build_session(args)
    except RuntimeError as exc:
        print(f"Fout: {exc}")
        print(
            "Zet eerst omgevingsvariabelen:\n"
            '  $env:SPORTLINK_SESSION_COOKIE="..."\n'
            '  $env:SPORTLINK_XSRF_TOKEN="..."'
        )
        return 1

    print("Sportlink ledenfoto scraper gestart.")
    print(f"- Search endpoint: {args.search_endpoint} ({args.search_method})")
    print(f"- Photo endpoint:  {args.photo_endpoint}")

    if args.members_csv:
        if not os.path.exists(args.members_csv):
            print(f"Fout: members CSV niet gevonden: {args.members_csv}")
            return 1
        members = load_members_from_csv(args.members_csv)
        if args.max_members:
            members = members[: args.max_members]
        print(f"- Leden geladen uit CSV: {args.members_csv} ({len(members)} records)")
    else:
        try:
            members = get_all_members(session, args)
        except RuntimeError as exc:
            print(f"Fout bij leden ophalen: {exc}")
            return 1

    if not members:
        print("Geen leden gevonden. Controleer endpoint + veldnamen.")
        return 1

    print(f"- Totaal leden gevonden: {len(members)}")
    print("- Foto-URLs ophalen...")

    rows: list[dict[str, str]] = []
    zonder_foto = 0
    fouten = 0

    for idx, member in enumerate(members, start=1):
        relatiecode = str(member.get(args.field_relation_code) or "").strip()
        naam = get_member_name(member, args.field_full_name)

        if not relatiecode:
            fouten += 1
            rows.append({"naam": naam, "relatiecode": "", "foto_url": ""})
            continue

        try:
            photo_url = get_photo_url(session, args, relatiecode)
        except RuntimeError as exc:
            print(f"  ! Stoppen: {exc}")
            return 1

        if not photo_url:
            zonder_foto += 1

        rows.append(
            {
                "naam": naam,
                "relatiecode": relatiecode,
                "foto_url": photo_url or "",
            }
        )

        if idx % 50 == 0 or idx == len(members):
            pct = round((idx / len(members)) * 100)
            print(f"  - {idx}/{len(members)} ({pct}%) verwerkt")

        time.sleep(args.delay)

    write_csv(rows, args.output)
    met_foto = len(rows) - zonder_foto

    print("\nKlaar.")
    print(f"- CSV: {args.output}")
    print(f"- Totaal: {len(rows)}")
    print(f"- Met foto: {met_foto}")
    print(f"- Zonder foto: {zonder_foto}")
    print(f"- Zonder relatiecode/fouten: {fouten}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
