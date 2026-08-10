# Matariki 2026 Newsletter

**Subject:** Wishing you well this Matariki — Matariki Giveaway inside  
**Senderkit template:** [Matariki 2026 Newsletter](https://senderkit.io/app/templates/7f773cae-cadd-4ef9-a6f4-92195e849ccf)  
**Source MJML:** [`matariki-newsletter.mjml`](./matariki-newsletter.mjml)  
**Client HTML (reference):** [`matariki-newsletter-client.html`](./matariki-newsletter-client.html)

## Notes

- Converted from the original HTML design to email-optimised MJML
- **Content verified in sync** with client HTML (Jul 2026) — all copy matches
- Unsubscribe link removed — SenderKit injects the compliance footer automatically
- Physical address removed from template footer — SenderKit adds this on send
- Hero portrait and artwork uploaded to R2 (CDN URLs in MJML)
- Hero portrait cropped to 16:9 (waist-up, mountain top retained)
- Typography matches website: **Cormorant Garamond** (headings/editorial) + **Jost** (body), self-hosted woff2 `@font-face` from theme assets
- Wordmarks (MONNI, Ngā mihi o Matariki, TEA & TONIC) rendered as **Cormorant Garamond Light PNGs** for pixel-perfect weight across all email clients
- Tea image uses Shopify product photo (`mj-image` in MJML)

## Intentional differences from client HTML

| Item | Client HTML | MJML template |
|------|-------------|---------------|
| Footer address | `5A, 2 Matakana Valley Road…` | Omitted — SenderKit compliance footer |
| Unsubscribe link | Present | Omitted — SenderKit injects automatically |
| Divider after "What is Matariki" | Present | Restored to match client HTML |
| Tea image | Placeholder | Live product image |
| Benefits / How to brew | `<li>` lists | `mj-text` lines with en-dash prefixes |

## Image assets

| Asset | R2 URL |
|-------|--------|
| Hero portrait (Monique) | `https://pub-ad1ae2d4dd2545039ecde7acbcdcac8f.r2.dev/assets/5530889b-e2b5-436d-a4bd-c2f9ccdf8ff6/7837155c-77fb-498f-8b96-12cae90834bb.jpeg` (16:9, 1066×599, q95 + unsharp) |
| Ngā Maunga Tupuna artwork | `https://pub-ad1ae2d4dd2545039ecde7acbcdcac8f.r2.dev/assets/5530889b-e2b5-436d-a4bd-c2f9ccdf8ff6/6c776a05-dc9a-469e-8d7f-2624dda73c34.jpeg` |

Local copies extracted from the original HTML are in [`assets/`](./assets/).
