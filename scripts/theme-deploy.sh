#!/usr/bin/env bash
# Deploy Monni theme code to Shopify staging or production.
# Respects monni-knowd/.shopifyignore (never pushes merchant content JSON).
#
# Usage:
#   ./scripts/theme-deploy.sh staging
#   ./scripts/theme-deploy.sh production
#   ./scripts/theme-deploy.sh production --dry-run
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
THEME_DIR="$ROOT/monni-knowd"
ENV_NAME="${1:-}"
shift || true

if [[ -z "$ENV_NAME" || "$ENV_NAME" == "-h" || "$ENV_NAME" == "--help" ]]; then
  cat <<'EOF'
Deploy Monni theme → Shopify

  ./scripts/theme-deploy.sh staging [--dry-run]
  ./scripts/theme-deploy.sh production [--dry-run]

Workflow:
  1. Work on a branch / push code to GitHub `staging`
  2. Deploy: ./scripts/theme-deploy.sh staging
  3. Preview: https://tea-tonic-matakana.myshopify.com/?preview_theme_id=158178476203
  4. Confirm → merge to `main`
  5. Deploy: ./scripts/theme-deploy.sh production
EOF
  exit 0
fi

DRY_RUN=0
EXTRA=()
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    *) EXTRA+=("$arg") ;;
  esac
done

cd "$THEME_DIR"

if [[ ! -f shopify.theme.toml ]]; then
  echo "Missing monni-knowd/shopify.theme.toml" >&2
  exit 1
fi

if [[ ! -f .shopifyignore ]]; then
  echo "Refusing to deploy without .shopifyignore" >&2
  exit 1
fi

# Safety: content layer must stay ignored
if ! grep -q 'config/settings_data.json' .shopifyignore || ! grep -q 'templates/index.json' .shopifyignore; then
  echo "ERROR: .shopifyignore is missing required content ignores" >&2
  exit 1
fi

case "$ENV_NAME" in
  staging)
    echo "→ Deploying CODE to staging theme (monni-staging #158178476203)"
    CMD=(shopify theme push -e staging "${EXTRA[@]}")
    ;;
  production|prod|live|main)
    echo "→ Deploying CODE to PRODUCTION live theme (monni-theme-2026 #156090564779)"
    if [[ "$DRY_RUN" -eq 0 ]]; then
      read -r -p "Type 'production' to confirm live push: " confirm
      if [[ "$confirm" != "production" ]]; then
        echo "Aborted."
        exit 1
      fi
    fi
    CMD=(shopify theme push -e production --allow-live "${EXTRA[@]}")
    ;;
  *)
    echo "Unknown environment: $ENV_NAME (use staging|production)" >&2
    exit 1
    ;;
esac

if [[ "$DRY_RUN" -eq 1 ]]; then
  CMD+=(--dry-run)
fi

echo "Running: ${CMD[*]}"
"${CMD[@]}"

if [[ "$ENV_NAME" == "staging" ]]; then
  echo
  echo "Preview: https://tea-tonic-matakana.myshopify.com/?preview_theme_id=158178476203"
  echo "Or:      https://teaandtonic.co.nz/?preview_theme_id=158178476203"
fi
