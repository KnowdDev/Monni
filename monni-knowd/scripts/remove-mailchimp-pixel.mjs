#!/usr/bin/env node
/**
 * Remove Mailchimp from teaandtonic.co.nz storefront.
 *
 * Mailchimp loads via the Shopify "Mailchimp Email SMS" app pixel — not theme code.
 * Disconnecting it removes ~140 KiB (form-assets.mailchimp.com) + the 4.6s critical chain.
 *
 * Usage:
 *   node scripts/remove-mailchimp-pixel.mjs
 *   node scripts/remove-mailchimp-pixel.mjs --open-admin
 */

const STORE = 'tea-tonic-matakana.myshopify.com';
const MAILCHIMP_PIXEL_ID = '2061762731';

const openAdmin = process.argv.includes('--open-admin');

const steps = `
Remove Mailchimp from ${STORE}
══════════════════════════════════════════════════════════════════

Mailchimp is NOT in theme Liquid — it is injected by the Shopify app pixel.

STEP 1 — Disconnect the app pixel (required)
  Admin → Settings → Customer events → App pixels
  Disconnect: "Mailchimp Email SMS" (storefront id ${MAILCHIMP_PIXEL_ID})

STEP 2 — Uninstall the Mailchimp app (recommended)
  Admin → Apps → Mailchimp Email SMS → Delete app
  This stops chimpstatic.com / mcjs-connected loaders on window.load.

STEP 3 — Verify
  Hard-refresh https://teaandtonic.co.nz → DevTools Network
  Confirm NO requests to:
    • form-assets.mailchimp.com
    • chimpstatic.com
    • mcjs.prd.a.intuit.com

Newsletter signups are handled by SenderKit (theme-native), not Mailchimp.

After disconnecting Mailchimp, defer Google + Meta pixels:
  node scripts/optimize-tracking-pixels.mjs --print-deferred-code
`;

console.log(steps);

if (openAdmin) {
  const url = `https://${STORE}/admin/settings/customer_events`;
  console.log(`Opening: ${url}`);
  import('node:child_process').then(({ execSync }) => {
    execSync(`open "${url}"`, { stdio: 'inherit' });
  });
}
