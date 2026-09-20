#!/bin/bash
# Seeds a real demo business account for the demo-video recording.
# Idempotent-ish: uses a fixed, recognizable email so re-runs reuse state
# where possible, but registration will just 400 harmlessly on a re-run
# (the account already exists) — that's fine, this is throwaway.
set -e
BASE="http://localhost:5051"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OWNER_EMAIL="demo-owner@postplotter-demo.test"
ADMIN_EMAIL="demo-admin@postplotter-demo.test"
# Required so no credential is committed to the repo. Any throwaway value.
PASSWORD="${DEMO_PASSWORD:?set DEMO_PASSWORD to a throwaway password}"

echo "owner: $OWNER_EMAIL"
echo "$OWNER_EMAIL" > "$DIR/owner_email.txt"
echo "$ADMIN_EMAIL" > "$DIR/admin_email.txt"
printf '%s' "$PASSWORD" > "$DIR/owner_password.txt"

curl -s -c "$DIR/owner.cookies" -X POST "$BASE/api/register" -H "Content-Type: application/json" \
  -d "{\"email\":\"$OWNER_EMAIL\",\"password\":\"$PASSWORD\"}" || true
echo
curl -s -c "$DIR/admin.cookies" -X POST "$BASE/api/register" -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$PASSWORD\"}" || true
echo

# Grant the second account platform-admin (needed only to create the org),
# then create the demo business, set its contact info and one rate.
# Note: local dev shares the real database — delete these throwaway
# accounts and the "Southern Fence Co." org when you're done recording.
REPO_ROOT="$(cd "$DIR/../.." && pwd)"
(cd "$REPO_ROOT" && npx tsx --env-file=.env script/_grant_admin.ts "$ADMIN_EMAIL")
curl -s -b "$DIR/admin.cookies" -X POST "$BASE/api/admin/organizations" -H "Content-Type: application/json" \
  -d "{\"name\":\"Southern Fence Co.\",\"firstAdminEmail\":\"$OWNER_EMAIL\"}" || true
echo
curl -s -b "$DIR/owner.cookies" -X PUT "$BASE/api/my-organization" -H "Content-Type: application/json" \
  -d '{"phone":"901-555-0142","email":"info@southernfenceco.example"}' || true
echo
curl -s -b "$DIR/owner.cookies" -X PUT "$BASE/api/my-organization/rates" -H "Content-Type: application/json" \
  -d '{"rates":[{"material":"wood_pine_cedar_picket","height":6,"ratePerFoot":28.5}]}' || true
echo
