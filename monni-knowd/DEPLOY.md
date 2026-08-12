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

## One-time GitHub setup

1. Create a Theme Access password (or Admin API token with `write_themes`).
2. Repo → Settings → Secrets → `SHOPIFY_CLI_THEME_TOKEN`.
3. Repo → Settings → Environments → create `production` (optional required reviewers).
