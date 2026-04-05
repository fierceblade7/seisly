#!/bin/bash

BASE="http://localhost:3000"
EMAIL="e2e-test-$(date +%s)@seisly-test.com"
SCHEME="seis"
ADMIN_PW="sl-adm-2026-x7k9p2-4tr87g"
SUPABASE_URL="https://eiokgduaolunamqxkzfq.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpb2tnZHVhb2x1bmFtcXhremZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA0MDM3OSwiZXhwIjoyMDkwNjE2Mzc5fQ.aF8SKVF90d5e15SfkUDf9YVi9D7iww8qMlfW9_8bSAo"
PASS=0
FAIL=0

sb_get() {
  curl -s "$SUPABASE_URL/rest/v1/$1" \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY"
}

sb_patch() {
  curl -s "$SUPABASE_URL/rest/v1/$1" \
    -X PATCH \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=minimal" \
    -d "$2"
}

sb_delete() {
  curl -s "$SUPABASE_URL/rest/v1/$1" \
    -X DELETE \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "Prefer: return=minimal"
}

report() {
  if [ "$1" = "PASS" ]; then
    PASS=$((PASS+1))
    echo "  PASS: $2"
  else
    FAIL=$((FAIL+1))
    echo "  FAIL: $2 -- $3"
  fi
}

echo "=== SEISLY API E2E TEST ==="
echo "Email: $EMAIL"
echo ""

# 1. Create application
echo "--- 1. Create application ---"
CODE=$(curl -s -o /tmp/e2e-body.txt -w "%{http_code}" -X POST "$BASE/api/application/save" \
  -H "Content-Type: application/json" \
  -d '{"email":"'"$EMAIL"'","scheme":"seis","companyName":"E2E Test Co Ltd","companyNumber":"99999999","utr":"9999999999","incorporatedAt":"2024-01-15","isKic":false,"riskToCapital":"Test risk narrative for e2e. Company is pre-revenue and dependent on product development and sales execution.","qualifyingActivity":"trade","tradeStarted":true,"tradeStartDate":"2024-03-01","tradeDescription":"SaaS compliance software for UK SMEs.","previousVcs":false,"previousVcsTypes":[],"raisingAmount":"150000","sharePurpose":"Hire engineers and expand marketing.","proposedInvestors":[{"name":"Test Investor","address":"1 Test St","amount":"150000"}],"shareClass":"Ordinary shares","preferentialRights":false,"preferentialRightsDetail":"","withinInitialPeriod":"yes","hasSubsidiaries":false,"grossAssetsBefore":"up_to_350k","grossAssetsAfter":"","employeeCount":"3","ukIncorporated":true,"registeredAddress":{"line1":"1 Test St","line2":"","city":"London","postcode":"SW1A 1AA"},"ukEstablishmentAddress":{"line1":"","line2":"","city":"","postcode":""},"establishmentNarrative":"","hasCommercialSale":null,"firstCommercialSaleDate":"","outsidePeriodReason":"","previousInvestmentAmount":"","previousInvestmentDate":"","newMarketDetails":"","signatoryName":"Test Person","signatoryPosition":"Director"}')
if [ "$CODE" = "200" ]; then
  sleep 1
  DB=$(sb_get "applications?email=eq.$EMAIL&scheme=eq.$SCHEME&select=company_name,qualifying_activity,is_kic,proposed_investors,signatory_name")
  if echo "$DB" | grep -q "E2E Test Co Ltd" && echo "$DB" | grep -q "trade"; then
    report "PASS" "Application created with all fields"
  else
    report "FAIL" "Fields missing in DB" "$DB"
  fi
else
  report "FAIL" "HTTP $CODE" "$(cat /tmp/e2e-body.txt)"
fi

# 2. Simulate payment
echo "--- 2. Simulate payment ---"
sb_patch "applications?email=eq.$EMAIL&scheme=eq.$SCHEME" '{"paid":true,"paid_at":"2026-04-05T00:00:00Z","status":"paid"}' > /dev/null
DB=$(sb_get "applications?email=eq.$EMAIL&scheme=eq.$SCHEME&select=paid,status")
if echo "$DB" | grep -q '"paid":true'; then
  report "PASS" "Payment simulated"
else
  report "FAIL" "Payment not set" "$DB"
fi

# 3. Validation - invalid docType
echo "--- 3. Validation - invalid docType ---"
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/documents/upload" \
  -F "file=@scripts/e2e-api-test.sh;type=application/pdf" \
  -F "docType=invalid_type" \
  -F "email=$EMAIL" \
  -F "scheme=$SCHEME")
if [ "$CODE" = "400" ]; then
  report "PASS" "Invalid docType rejected"
else
  report "FAIL" "Expected 400, got $CODE"
fi

# 4. Validation - missing declaration fields
echo "--- 4. Validation - missing declaration fields ---"
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/application/declare" \
  -H "Content-Type: application/json" -d '{"email":"x"}')
if [ "$CODE" = "400" ]; then
  report "PASS" "Missing declaration fields rejected"
else
  report "FAIL" "Expected 400, got $CODE"
fi

# 5. Review status
echo "--- 5. Review status ---"
CODE=$(curl -s -o /tmp/e2e-body.txt -w "%{http_code}" "$BASE/api/review/status?email=$EMAIL&scheme=$SCHEME")
BODY=$(cat /tmp/e2e-body.txt)
if [ "$CODE" = "200" ]; then
  if echo "$BODY" | grep -q "ai_review_result"; then
    report "FAIL" "Review status leaks ai_review_result"
  else
    report "PASS" "Review status returns limited fields only"
  fi
else
  report "FAIL" "HTTP $CODE" "$BODY"
fi

# 6. Admin - view applications
echo "--- 6. Admin - view all applications ---"
CODE=$(curl -s -o /tmp/e2e-body.txt -w "%{http_code}" "$BASE/api/admin/all-applications" \
  -H "x-admin-password: $ADMIN_PW")
if [ "$CODE" = "200" ] && cat /tmp/e2e-body.txt | grep -q "E2E Test Co"; then
  report "PASS" "Admin sees test application"
else
  report "FAIL" "HTTP $CODE"
fi

# 7. Admin - wrong password
echo "--- 7. Admin - wrong password ---"
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/admin/all-applications" \
  -H "x-admin-password: wrong")
if [ "$CODE" = "401" ]; then
  report "PASS" "Wrong password returns 401"
else
  report "FAIL" "Expected 401, got $CODE"
fi

# 8. Admin - save notes
echo "--- 8. Admin - save notes ---"
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/admin/update-application" \
  -H "Content-Type: application/json" -H "x-admin-password: $ADMIN_PW" \
  -d '{"email":"'"$EMAIL"'","scheme":"seis","updates":{"admin_notes":"E2E test note"}}')
if [ "$CODE" = "200" ]; then
  DB=$(sb_get "applications?email=eq.$EMAIL&scheme=eq.$SCHEME&select=admin_notes")
  if echo "$DB" | grep -q "E2E test note"; then
    report "PASS" "Admin notes saved"
  else
    report "FAIL" "Notes not persisted" "$DB"
  fi
else
  report "FAIL" "HTTP $CODE"
fi

# 9. Admin - field whitelist
echo "--- 9. Admin - field whitelist ---"
CODE=$(curl -s -o /tmp/e2e-body.txt -w "%{http_code}" -X POST "$BASE/api/admin/update-application" \
  -H "Content-Type: application/json" -H "x-admin-password: $ADMIN_PW" \
  -d '{"email":"'"$EMAIL"'","scheme":"seis","updates":{"paid":false}}')
BODY=$(cat /tmp/e2e-body.txt)
if [ "$CODE" = "400" ] && echo "$BODY" | grep -q "No valid fields"; then
  report "PASS" "Disallowed field rejected"
else
  report "FAIL" "Expected 400, got $CODE" "$BODY"
fi

# 10. Declaration
echo "--- 10. Declaration ---"
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/application/declare" \
  -H "Content-Type: application/json" \
  -d '{"email":"'"$EMAIL"'","scheme":"seis","name":"Test Person","position":"Director"}')
if [ "$CODE" = "200" ]; then
  DB=$(sb_get "applications?email=eq.$EMAIL&scheme=eq.$SCHEME&select=declared_at,declared_by_name,status")
  if echo "$DB" | grep -q "Test Person"; then
    report "PASS" "Declaration signed"
  else
    report "FAIL" "Declaration fields not set" "$DB"
  fi
else
  report "FAIL" "HTTP $CODE"
fi

# 11. Review results before release
echo "--- 11. Review results before release ---"
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/review/results?email=$EMAIL&scheme=$SCHEME")
if [ "$CODE" = "404" ]; then
  report "PASS" "Review results 404 before release"
else
  report "FAIL" "Expected 404, got $CODE"
fi

# 12. Ops endpoint
echo "--- 12. Ops endpoint ---"
CODE=$(curl -s -o /tmp/e2e-body.txt -w "%{http_code}" "$BASE/api/admin/ops" \
  -H "x-admin-password: $ADMIN_PW")
if [ "$CODE" = "200" ] && cat /tmp/e2e-body.txt | grep -q "totalApps"; then
  report "PASS" "Ops returns metrics"
else
  report "FAIL" "HTTP $CODE"
fi

# 13. Submissions tab (should not show until authorised)
echo "--- 13. Submissions tab ---"
CODE=$(curl -s -o /tmp/e2e-body.txt -w "%{http_code}" "$BASE/api/admin/applications" \
  -H "x-admin-password: $ADMIN_PW")
if [ "$CODE" = "200" ]; then
  report "PASS" "Submissions endpoint responds"
else
  report "FAIL" "HTTP $CODE"
fi

# 14. Declaration on unpaid app should fail
echo "--- 14. Declaration requires paid ---"
CODE=$(curl -s -o /tmp/e2e-body.txt -w "%{http_code}" -X POST "$BASE/api/application/declare" \
  -H "Content-Type: application/json" \
  -d '{"email":"nonexistent@test.com","scheme":"seis","name":"X","position":"Director"}')
if [ "$CODE" = "404" ]; then
  report "PASS" "Declaration on nonexistent app returns 404"
else
  report "FAIL" "Expected 404, got $CODE" "$(cat /tmp/e2e-body.txt)"
fi

# 15. Rate limiting responds normally
echo "--- 15. Rate limiting ---"
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/application/save" \
  -H "Content-Type: application/json" -d '{"email":"ratetest@test.com","scheme":"seis"}')
if [ "$CODE" = "200" ]; then
  report "PASS" "Rate-limited route responds within limits"
else
  report "FAIL" "HTTP $CODE"
fi
sb_delete "applications?email=eq.ratetest@test.com" > /dev/null 2>&1

# CLEANUP
echo ""
echo "--- Cleanup ---"
sb_delete "applications?email=eq.$EMAIL" > /dev/null 2>&1
sb_delete "application_documents?email=eq.$EMAIL" > /dev/null 2>&1
echo "Done."

echo ""
echo "==========================="
echo "PASSED: $PASS"
echo "FAILED: $FAIL"
echo "TOTAL:  $((PASS+FAIL))"
echo "==========================="
