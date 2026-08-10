# SenderKit ↔ Shopify newsletter sync — friction + status

**Updated:** 2026-07-13  
**Client:** Monni / Tea and Tonic (`teaandtonic.co.nz`)  
**Shopify:** `tea-tonic-matakana.myshopify.com`  
**Theme:** `monni-knowd`

---

## Status (what works now)

| Piece | Detail |
|-------|--------|
| Test audience | `Shopify Newsletter Test` — `798bfa1e-1a19-4f57-af66-6e94b85417ba` |
| Production audience (do not use yet) | `the Monni edit` — `97a558a5-31ba-4cdc-88b5-c4bf2f202a16` |
| Public signup form | slug **`monni-shopify-test`** (id `c6a40f50-51a0-4a67-b74d-95ff7f34a311`), double opt-in **off** |
| Theme dual-submit | Footer/popup → `POST https://senderkit.io/api/widget/signup/monni-shopify-test` (**verified live**) |
| Native Shopify webhook URL | `https://senderkit.io/api/webhooks/shopify` |
| Shopify webhooks | `APP_UNINSTALLED`, `CUSTOMERS_CREATE`, `CUSTOMERS_UPDATE`, `CUSTOMERS_EMAIL_MARKETING_CONSENT_UPDATE` → SenderKit |
| SenderKit connection | `8d115f45-2665-4f73-933e-0274bdeb1872` — `has_access_token: true`, audience test |
| Checkout/consent **subscribe** e2e | **PASS** — `sk-native-e2e+1783939337@teaandtonic.co.nz` landed in test audience |
| Checkout/consent **unsubscribe** e2e | **PASS** (fix `0d0c88d`) — `sk-unsub-retest2+1783940222@teaandtonic.co.nz` got `unsubscribed_at=2026-07-13T10:57:10.481Z` |

Soft-unsub root cause (SenderKit): `UPDATE … WHERE unsubscribed_at = NULL` matched zero rows in SQL; fixed with `.is(null)` → `IS NULL` + update-by-subscriber-id. First retest during deploy still failed; second retest after production landed **PASS**.

Entry points wired in theme:
- `snippets/newsletter-popup.liquid`
- `sections/homepage-newsletter.liquid`
- `sections/homepage-newsletter-v2.liquid`
- `sections/footer.liquid`

---

## Remaining friction (share with SenderKit AI IDE)

### 1. High — No MCP tools for signup forms
Creating/listing/updating signup forms required raw HTTP:
- `GET/POST /api/signup-forms`
- `PATCH /api/signup-forms/:id`

**Ask:** Add MCP tools: `list_signup_forms`, `create_signup_form`, `update_signup_form`.

### 2. High — `subscribe.js` ORIGIN bug on third-party sites
```js
var ORIGIN = window.SENDERKIT_ORIGIN || window.location.origin || "http://localhost:3000";
```
When the script is loaded on Shopify (`teaandtonic.co.nz`), `ORIGIN` becomes the **Shopify** origin, so widget calls hit the wrong host.

**Ask:** Default `ORIGIN` to `https://senderkit.io` (or the script’s own `src` origin), not `window.location.origin`.

Workaround used: theme JS hardcodes `https://senderkit.io`.

### 3. Medium — Contacts API validation errors are opaque
Wrong body → `{"error":"Required"}` with no field path. Correct body needs:
- `contacts` (array)
- `consentAcknowledged: true`
- `audienceId` or `audienceName`

**Ask:** Return structured Zod issues; document `/api/subscribers/add` and `/api/widget/signup/:slug` on senderkit.io/docs.

### 4. Medium — `create_audience` MCP still broken
Fails with empty-array validation. Workaround: `add_subscriber` + `audienceName`, or HTTP after form exists.

### 5. Medium — Webhook HMAC secret not set on receiver
Receiver is live **without** `SHOPIFY_WEBHOOK_SECRET` (HMAC skipped when unset). Need the Shopify app client secret in Vercel env, then enforce verification.

### 6. Low — Theme dual-submit not yet on **main** live theme
Only on development theme `#157218308267`. After storefront smoke test, push to `monni-theme-2026` (`#156090564779`) or publish.

### 7. Low — One vault `custom_senderkit` TOKEN is revoked
Prefix `sk_live_07f864da…`. Fresh key created: **Monni Shopify Sync** (`contact:write`/`contact:read`). Update One vault.

---

## Flip to production (after sign-off)

1. Create SenderKit signup form bound to audience `97a558a5-31ba-4cdc-88b5-c4bf2f202a16`.
2. Theme setting **SenderKit signup form slug** → that production slug (Theme settings → SenderKit newsletter).
3. Vercel env `SENDERKIT_AUDIENCE_ID` → `97a558a5-31ba-4cdc-88b5-c4bf2f202a16` and redeploy `monni-shopify-senderkit-sync`.
4. Push/publish theme to main.

---

## Ask of SenderKit (priority)

1. Fix `subscribe.js` ORIGIN default for third-party embeds.  
2. MCP + docs for signup forms + contacts API.  
3. Structured validation errors on `/api/subscribers/add`.
