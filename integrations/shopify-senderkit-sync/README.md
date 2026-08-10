# Shopify → SenderKit consent sync

Standalone Vercel Edge function that receives Shopify customer / marketing-consent webhooks and enrolls **SUBSCRIBED** contacts into a SenderKit audience.

## Env vars

| Key | Value |
|-----|--------|
| `SENDERKIT_API_KEY` | `sk_live_…` with `contact:write` (use `Monni Shopify Sync`) |
| `SENDERKIT_AUDIENCE_ID` | Test: `798bfa1e-1a19-4f57-af66-6e94b85417ba` |
| `SHOPIFY_WEBHOOK_SECRET` | From Shopify webhook (recommended) |

## Deploy

```bash
cd integrations/shopify-senderkit-sync
npx vercel --yes
npx vercel env add SENDERKIT_API_KEY
npx vercel env add SENDERKIT_AUDIENCE_ID
npx vercel env add SHOPIFY_WEBHOOK_SECRET
npx vercel --prod --yes
```

Webhook URL: `https://<deployment>/api/webhook`

## Shopify topics

- `customers/create`
- `customers/update`
- `customers_email_marketing_consent/update`

## Flip to production audience

Set `SENDERKIT_AUDIENCE_ID=97a558a5-31ba-4cdc-88b5-c4bf2f202a16` after test sign-off.
