#!/usr/bin/env bash
# scripts/db/verify_schema.sh — Verify all expected tables exist
set -euo pipefail

DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:54422/postgres}"

echo "━━━ Hanachan DB: Verifying Schema ━━━"

EXPECTED_TABLES=(
    "subjects"
    "subject_details"
    "subject_relations"
    "spaced_repetition_systems"
    "users_profile"
    "assignments"
    "reviews"
    "review_statistics"
    "study_materials"
    "level_progressions"
    "custom_decks"
    "custom_deck_items"
    "custom_deck_progress"
)

MISSING=0
for table in "${EXPECTED_TABLES[@]}"; do
    EXISTS=$(psql "$DB_URL" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema='public' AND table_name='$table');" 2>/dev/null | tr -d ' ')
    if [ "$EXISTS" = "t" ]; then
        echo "  ✅ $table"
    else
        echo "  ❌ $table — MISSING"
        MISSING=$((MISSING + 1))
    fi
done

# Check SRS seed data
SRS_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM public.spaced_repetition_systems;" 2>/dev/null | tr -d ' ')
echo ""
echo "  SRS Systems seeded: $SRS_COUNT"

# Check summary view
VIEW_EXISTS=$(psql "$DB_URL" -t -c "SELECT EXISTS (SELECT FROM information_schema.views WHERE table_schema='public' AND table_name='v_assignment_summary');" 2>/dev/null | tr -d ' ')
if [ "$VIEW_EXISTS" = "t" ]; then
    echo "  ✅ v_assignment_summary (view)"
else
    echo "  ❌ v_assignment_summary (view) — MISSING"
    MISSING=$((MISSING + 1))
fi

echo ""
if [ "$MISSING" -eq 0 ]; then
    echo "✅ All $((${#EXPECTED_TABLES[@]} + 1)) schema objects verified."
else
    echo "❌ $MISSING schema objects missing. Run scripts/db/init_schema.sh first."
    exit 1
fi
