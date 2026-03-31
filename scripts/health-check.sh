#!/bin/bash
# Health check script voor c.k.v. Oranje Wit
# Gebruik: ./scripts/health-check.sh [url]

URL="${1:-https://www.ckvoranjewit.app/api/health}"

echo "Health check: $URL"
echo "---"

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}\nTIME_TOTAL:%{time_total}" "$URL")

BODY=$(echo "$RESPONSE" | sed '/^HTTP_CODE:/d;/^TIME_TOTAL:/d')
HTTP_CODE=$(echo "$RESPONSE" | grep "^HTTP_CODE:" | cut -d: -f2)
TIME_TOTAL=$(echo "$RESPONSE" | grep "^TIME_TOTAL:" | cut -d: -f2)

echo "Status: HTTP $HTTP_CODE"
echo "Tijd: ${TIME_TOTAL}s"
echo "---"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"

if [ "$HTTP_CODE" = "200" ]; then
  echo "---"
  echo "GEZOND"
  exit 0
else
  echo "---"
  echo "ONGEZOND"
  exit 1
fi
