# Customer Events pixels

## PostHog Checkout (required before ads)

Theme PostHog covers browse → **Product Viewed** → **Added to Cart** → **Checkout Started**.
This custom Customer Events pixel covers **Purchase** on Shopify thank-you.

Checkout / thank-you **cannot** run theme JS. Without this pixel, PostHog will never see sales.

### Install (Admin only)

1. Open [Customer events](https://admin.shopify.com/store/tea-tonic-matakana/settings/customer_events)
2. **Add custom pixel** → name it exactly: `PostHog Checkout`
3. Paste the full contents of `posthog-checkout.js`
4. Permission: analytics / not required for ads-only
5. Connect / Save

Do **not** add a second full-storefront PostHog pixel. Theme snippet already loads PostHog on `teaandtonic.co.nz`.

## Remove Mailchimp (Aug 2026)

Mailchimp is not in theme code — disconnect the app pixel, then uninstall the app:

```bash
node scripts/remove-mailchimp-pixel.mjs
```

Newsletter signups use SenderKit (`senderkit-newsletter.js`), not Mailchimp.

## Deferred Google + Meta pixels (PageSpeed)

Disconnect the **Google & YouTube** and **Facebook & Instagram** app pixels first, then add custom pixels:

| Pixel file | Replaces | Est. savings |
|---|---|---|
| `gtm-deferred.js` | Google & YouTube app pixel | ~223 KiB unused JS + 244ms main-thread |
| `meta-deferred.js` | Facebook & Instagram app pixel | ~40 KiB unused JS + 122ms main-thread |

```bash
node scripts/optimize-tracking-pixels.mjs --print-deferred-code
```

## Funnel (locked names)

| Shopify / theme source | PostHog event |
|---|---|
| Product template | `Product Viewed` |
| `cart:added` / `/cart/add.js` | `Added to Cart` |
| Checkout button + pixel `checkout_started` | `Checkout Started` |
| Pixel `checkout_completed` | `Purchase` |

## Attribution join

First-touch `utm_*`, `gclid`, `gbraid`, and `ph_distinct_id` are written to Shopify **cart attributes** (become order note attributes). The pixel bootstraps PostHog with `ph_distinct_id` so Purchase joins the browse person.

## Google Ads URL suffix (set on campaigns before spend)

Search / Shopping:

`utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={adgroupid}&utm_term={keyword}`

PMax:

`utm_source=google&utm_medium=performance_max&utm_campaign={campaignid}`
