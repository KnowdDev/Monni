#!/usr/bin/env bash
# Copy LIVE theme CODE into monni-knowd (never touches ignored JSON content).
# Use after theme-audit-live-vs-git.sh shows drift.
#
# Usage:
#   ./scripts/theme-reconcile-from-live.sh          # copy live → working tree
#   ./scripts/theme-reconcile-from-live.sh --dry-run
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
THEME_DIR="$ROOT/monni-knowd"
TMP="$ROOT/tmp/theme-reconcile-live-$$"
STORE="${SHOPIFY_STORE:-tea-tonic-matakana.myshopify.com}"
DRY=0
[[ "${1:-}" == "--dry-run" ]] && DRY=1

mkdir -p "$TMP"
cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT

cd "$THEME_DIR"
if [[ ! -f .shopifyignore ]]; then
  echo "Refusing: missing .shopifyignore" >&2
  exit 1
fi

echo "Pulling LIVE theme code…"
shopify theme pull --live --store "$STORE" --path "$TMP" \
  --only "layout/*" \
  --only "sections/*" \
  --only "snippets/*" \
  --only "assets/*" \
  --only "locales/*" \
  --only "blocks/*" \
  --only "pixels/*" \
  --only "config/settings_schema.json" >/dev/null

copy_tree() {
  local src="$1" dest="$2"
  [[ -d "$src" ]] || return 0
  if [[ "$DRY" -eq 1 ]]; then
    echo "[dry-run] rsync $src/ → $dest/"
  else
    mkdir -p "$dest"
    rsync -a "$src/" "$dest/"
  fi
}

echo "Applying LIVE code to monni-knowd/ (content JSON still ignored on push)…"
copy_tree "$TMP/layout" "$THEME_DIR/layout"
copy_tree "$TMP/sections" "$THEME_DIR/sections"
copy_tree "$TMP/snippets" "$THEME_DIR/snippets"
copy_tree "$TMP/assets" "$THEME_DIR/assets"
copy_tree "$TMP/locales" "$THEME_DIR/locales"
copy_tree "$TMP/blocks" "$THEME_DIR/blocks"
copy_tree "$TMP/pixels" "$THEME_DIR/pixels"
if [[ -f "$TMP/config/settings_schema.json" ]]; then
  if [[ "$DRY" -eq 1 ]]; then
    echo "[dry-run] cp settings_schema.json"
  else
    cp "$TMP/config/settings_schema.json" "$THEME_DIR/config/settings_schema.json"
  fi
fi

echo
if [[ "$DRY" -eq 1 ]]; then
  echo "Dry run complete. Re-run without --dry-run to apply."
else
  echo "Done. Next:"
  echo "  1. ./scripts/theme-audit-live-vs-git.sh   (LOCAL vs LIVE should be 0)"
  echo "  2. git diff monni-knowd/                  (review)"
  echo "  3. Commit on staging branch → PR → main"
  echo "  4. Feature work (e.g. ingredients) on a branch; deploy staging first"
fi
