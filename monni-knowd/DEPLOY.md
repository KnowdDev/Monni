# Monni theme deploy workflow

## Environments

| Env | Git branch | Shopify theme | ID | URL |
|---|---|---|---|---|
| **Staging** | `staging` | `monni-staging` | `158178476203` | [Preview](https://teaandtonic.co.nz/?preview_theme_id=158178476203) |
| **Production** | `main` | `monni-theme-2026` (live) | `156090564779` | https://teaandtonic.co.nz |

## Day-to-day

1. Branch from `staging` (or work on `staging` directly for small fixes).
2. Make theme changes under `monni-knowd/`.
3. Deploy to staging:
   ```bash
   ./scripts/theme-deploy.sh staging
   ```
4. QA on the preview URL above.
5. When confirmed, merge `staging` → `main` (PR preferred).
6. Deploy to production:
   ```bash
   ./scripts/theme-deploy.sh production
   ```
   (prompts for confirmation)

Or rely on GitHub Actions once `SHOPIFY_CLI_THEME_TOKEN` is set:
- push to `staging` → auto-deploys staging theme
- push to `main` → deploys live (GitHub Environment: `production`)

## Hard rules

- Always deploy from `monni-knowd/` with `.shopifyignore` present.
- Never push `config/settings_data.json` or JSON page templates casually — they hold merchant content.
- Prefer Liquid/schema/asset changes; let the theme editor own homepage/About/Contact content.

## When Git and live Shopify disagree

Production can drift ahead of `origin/main` (manual `theme push`, editor hotfixes, deploys from uncommitted local). **The live storefront is what customers see; Git must be updated to match before you merge or deploy again.**

```bash
# 1) Report drift (read-only)
./scripts/theme-audit-live-vs-git.sh

# 2) Copy LIVE code into monni-knowd/ (never pulls settings_data / page JSON)
./scripts/theme-reconcile-from-live.sh --dry-run
./scripts/theme-reconcile-from-live.sh

# 3) Re-audit — LOCAL vs LIVE should be 0
./scripts/theme-audit-live-vs-git.sh

# 4) Commit on `staging`, PR to `main` (records truth in GitHub; CI may re-push same code)
# 5) New features: branch from updated staging → push staging theme → QA → merge → production
```

**Never** `git checkout -- monni-knowd` blindly to “clean up” — that drops live fixes. **Never** push production from a dirty tree without reconciling first.

Optional WIP safety net before reconcile:

```bash
git checkout -b backup/wip-$(date +%Y%m%d)
git add -A && git commit -m "WIP backup before live reconcile"
git checkout main
```

## One-time GitHub setup

1. Create a Theme Access password (or Admin API token with `write_themes`).
2. Repo → Settings → Secrets → `SHOPIFY_CLI_THEME_TOKEN`.
3. Repo → Settings → Environments → create `production` (optional required reviewers).
