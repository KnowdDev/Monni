#!/usr/bin/env bash
# Compare monni-knowd on disk + origin/main vs Shopify LIVE theme code.
# Does not modify anything. Uses a temp pull from production.
#
# Usage: ./scripts/theme-audit-live-vs-git.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
THEME_DIR="$ROOT/monni-knowd"
TMP="$ROOT/tmp/theme-audit-live-$$"
STORE="${SHOPIFY_STORE:-tea-tonic-matakana.myshopify.com}"

CODE_PATHS=(
  "layout/*"
  "sections/*"
  "snippets/*"
  "assets/*"
  "locales/*"
  "blocks/*"
  "pixels/*"
  "config/settings_schema.json"
)

mkdir -p "$TMP"
cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT

cd "$THEME_DIR"
echo "Pulling LIVE theme code (monni-theme-2026) to temp…"
ONLY_FLAGS=()
for p in "${CODE_PATHS[@]}"; do
  ONLY_FLAGS+=(--only "$p")
done
shopify theme pull --live --store "$STORE" --path "$TMP" "${ONLY_FLAGS[@]}" >/dev/null

echo
echo "=== Drift report (production is source of truth for live site) ==="
echo

git fetch origin 2>/dev/null || true

local_vs_live=0
git_vs_live=0

while IFS= read -r rel; do
  [[ -z "$rel" ]] && continue
  live_file="$TMP/$rel"
  local_file="$THEME_DIR/$rel"
  [[ -f "$live_file" ]] || continue

  if [[ -f "$local_file" ]]; then
    if ! diff -q "$local_file" "$live_file" >/dev/null 2>&1; then
      echo "LOCAL  != LIVE   $rel"
      local_vs_live=$((local_vs_live + 1))
    fi
  else
    echo "LOCAL  missing     $rel  (exists on LIVE)"
    local_vs_live=$((local_vs_live + 1))
  fi

  if git -C "$ROOT" cat-file -e "origin/main:monni-knowd/$rel" 2>/dev/null; then
    if ! diff -q <(git -C "$ROOT" show "origin/main:monni-knowd/$rel") "$live_file" >/dev/null 2>&1; then
      echo "origin/main != LIVE   $rel"
      git_vs_live=$((git_vs_live + 1))
    fi
  else
    echo "origin/main missing   $rel  (exists on LIVE)"
    git_vs_live=$((git_vs_live + 1))
  fi
done < <(
  cd "$TMP" && find layout sections snippets assets locales blocks pixels config -type f 2>/dev/null | sed "s|^\\./||"
)

echo
echo "Summary:"
echo "  Files where LOCAL differs from LIVE:     $local_vs_live"
echo "  Files where origin/main differs from LIVE: $git_vs_live"
echo
echo "Git branch: $(git -C "$ROOT" branch --show-current) vs origin/main: $(git -C "$ROOT" status -sb | head -1 | cut -d' ' -f2-)"
echo
if [[ "$git_vs_live" -gt 0 ]]; then
  echo "⚠️  GitHub main is NOT a record of live theme code. Run theme-reconcile-from-live.sh"
  echo "   then commit on staging → PR → main before the next production deploy."
fi
