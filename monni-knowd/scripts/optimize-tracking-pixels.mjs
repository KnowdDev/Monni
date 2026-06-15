#!/usr/bin/env node
/**
 * Inspect Shopify Customer Events pixels and print deferred custom-pixel code.
 *
 * LIMITATIONS
 * • Google & YouTube, Mailchimp, and Facebook pixels are *app pixels* owned by
 *   those apps. webPixelDelete only removes pixels created by the calling app.
 * • Shopify CLI store auth (theme dev) lacks read_pixels / write_pixels.
 * • Pixel changes are store-wide — no homepage-only scope in Shopify.
 *
 * Usage:
 *   node scripts/optimize-tracking-pixels.mjs --print-deferred-code
 *   SHOPIFY_ADMIN_TOKEN=shpat_... node scripts/optimize-tracking-pixels.mjs --status
 */

const STORE = process.env.SHOPIFY_STORE || 'tea-tonic-matakana.myshopify.com';
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = '2025-01';
const endpoint = `https://${STORE}/admin/api/${API_VERSION}/graphql.json`;

const PRINT_CODE = process.argv.includes('--print-deferred-code');
const STATUS = process.argv.includes('--status');

/** Known app pixels on teaandtonic.co.nz (Jun 2026). */
const KNOWN_PIXELS = {
  mailchimp: {
    storefrontId: '2061762731',
    label: 'Mailchimp Email SMS',
  },
  google: {
    storefrontId: '1727103147',
    label: 'Google & YouTube (GTM / gtag)',
    tagIds: ['AW-16826543864', 'GT-5RFWJ4S9'],
  },
  facebook: {
    storefrontId: '229671083',
    label: 'Facebook / Meta pixel',
    pixelId: '338962594137574',
  },
};

async function gql(query, variables = {}) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors?.length) {
    throw new Error(JSON.stringify(json.errors || json, null, 2));
  }
  return json.data;
}

async function probeScopes() {
  const checks = [
    { label: 'read_pixels (serverPixel)', query: '{ serverPixel { id status } }' },
    { label: 'read_themes', query: '{ themes(first: 1) { nodes { id } } }' },
  ];

  for (const check of checks) {
    try {
      await gql(check.query);
      console.log(`✓ ${check.label}`);
    } catch (err) {
      console.log(`✗ ${check.label} — ${err.message.split('\n')[0]}`);
    }
  }
}

function printDeferredCustomPixels() {
  const google = KNOWN_PIXELS.google;
  const facebook = KNOWN_PIXELS.facebook;

  console.log(`
═══════════════════════════════════════════════════════════════════
DEFERRED CUSTOM PIXEL CODE
Admin → Settings → Customer events → Add custom pixel → paste → Connect
═══════════════════════════════════════════════════════════════════

First DISCONNECT these app pixels (same screen, App pixels section):
  • Mailchimp Email SMS
  • Google & YouTube
  • Facebook & Instagram

─── Custom pixel: "GTM deferred" ───
(Subscribes to Shopify events — removes the "not subscribed" warning)

(function () {
  var loaded = false;
  var loading = false;
  var waiters = [];
  var ids = ${JSON.stringify(google.tagIds)};

  function runGtag(fn) {
    if (loaded && window.gtag) fn();
    else waiters.push(fn);
  }

  function flush() {
    waiters.splice(0).forEach(function (fn) {
      try { fn(); } catch (e) {}
    });
  }

  function loadGtag() {
    if (loaded || loading) return;
    loading = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ids[0];
    s.onload = function () {
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      window.gtag = gtag;
      gtag('js', new Date());
      ids.forEach(function (id) {
        gtag('config', id, { send_page_view: false });
      });
      loaded = true;
      flush();
    };
    document.head.appendChild(s);
  }

  function ensureGtag() { loadGtag(); }

  ['scroll', 'click', 'keydown', 'touchstart'].forEach(function (evt) {
    document.addEventListener(evt, loadGtag, { once: true, passive: true });
  });
  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadGtag, { timeout: 4000 });
  } else {
    setTimeout(loadGtag, 2500);
  }

  analytics.subscribe('page_viewed', function (event) {
    ensureGtag();
    runGtag(function () {
      gtag('event', 'page_view', {
        page_location: event.context.document.location.href,
        page_title: event.context.document.title
      });
    });
  });

  analytics.subscribe('product_viewed', function (event) {
    ensureGtag();
    var v = event.data && event.data.productVariant;
    if (!v) return;
    runGtag(function () {
      gtag('event', 'view_item', {
        currency: v.price.currencyCode,
        value: v.price.amount,
        items: [{
          item_id: v.sku || v.id,
          item_name: v.product.title,
          price: v.price.amount,
          quantity: 1
        }]
      });
    });
  });

  analytics.subscribe('product_added_to_cart', function (event) {
    ensureGtag();
    var line = event.data && event.data.cartLine;
    if (!line || !line.merchandise) return;
    var v = line.merchandise;
    runGtag(function () {
      gtag('event', 'add_to_cart', {
        currency: v.price.currencyCode,
        value: v.price.amount * line.quantity,
        items: [{
          item_id: v.sku || v.id,
          item_name: v.product.title,
          price: v.price.amount,
          quantity: line.quantity
        }]
      });
    });
  });

  analytics.subscribe('checkout_completed', function (event) {
    ensureGtag();
    var checkout = event.data && event.data.checkout;
    if (!checkout) return;
    runGtag(function () {
      gtag('event', 'purchase', {
        transaction_id: checkout.order && checkout.order.id,
        currency: checkout.currencyCode,
        value: checkout.totalPrice && checkout.totalPrice.amount,
        tax: checkout.totalTax && checkout.totalTax.amount,
        shipping: checkout.shippingLine && checkout.shippingLine.price && checkout.shippingLine.price.amount
      });
    });
  });
})();

─── Custom pixel: "Meta deferred" ───

(function () {
  var loaded = false;
  var loading = false;
  var waiters = [];
  var pixelId = '${facebook.pixelId}';

  function runFb(fn) {
    if (loaded && window.fbq) fn();
    else waiters.push(fn);
  }

  function flush() {
    waiters.splice(0).forEach(function (fn) {
      try { fn(); } catch (e) {}
    });
  }

  function loadFb() {
    if (loaded || loading) return;
    loading = true;
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(
    window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', pixelId);
    loaded = true;
    flush();
  }

  function ensureFb() { loadFb(); }

  ['scroll', 'click', 'keydown', 'touchstart'].forEach(function (evt) {
    document.addEventListener(evt, loadFb, { once: true, passive: true });
  });
  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadFb, { timeout: 4000 });
  } else {
    setTimeout(loadFb, 2500);
  }

  analytics.subscribe('page_viewed', function () {
    ensureFb();
    runFb(function () { fbq('track', 'PageView'); });
  });

  analytics.subscribe('product_viewed', function (event) {
    ensureFb();
    var v = event.data && event.data.productVariant;
    if (!v) return;
    runFb(function () {
      fbq('track', 'ViewContent', {
        content_ids: [v.sku || v.id],
        content_name: v.product.title,
        value: v.price.amount,
        currency: v.price.currencyCode
      });
    });
  });

  analytics.subscribe('checkout_completed', function (event) {
    ensureFb();
    var checkout = event.data && event.data.checkout;
    if (!checkout) return;
    runFb(function () {
      fbq('track', 'Purchase', {
        value: checkout.totalPrice && checkout.totalPrice.amount,
        currency: checkout.currencyCode
      });
    });
  });
})();

─── Mailchimp ───
Disconnect the Mailchimp app pixel. The chimpstatic.com loader is also injected
by the Mailchimp app on window.load — disconnecting the app pixel stops the
113 KiB form-assets payload on initial load.

═══════════════════════════════════════════════════════════════════
`);
}

async function main() {
  if (PRINT_CODE) {
    printDeferredCustomPixels();
    return;
  }

  console.log(`Store: ${STORE}\n`);
  console.log('Live storefront app pixels:');
  for (const [key, pixel] of Object.entries(KNOWN_PIXELS)) {
    console.log(`  ${key}: ${pixel.label} (id ${pixel.storefrontId})`);
  }

  if (!TOKEN) {
    console.log('\nNo SHOPIFY_ADMIN_TOKEN set.');
    console.log('Shopify CLI theme auth cannot manage pixels (needs write_pixels).');
    console.log('\nNext: node scripts/optimize-tracking-pixels.mjs --print-deferred-code');
    return;
  }

  if (STATUS) {
    console.log('\nProbing token scopes…');
    await probeScopes();
    console.log('\nDisconnect app pixels in Admin → Settings → Customer events.');
    console.log('API cannot disconnect third-party app pixels — Admin UI only.');
    console.log('Then: node scripts/optimize-tracking-pixels.mjs --print-deferred-code');
    return;
  }

  console.log('\nExamples:');
  console.log('  node scripts/optimize-tracking-pixels.mjs --print-deferred-code');
  console.log('  SHOPIFY_ADMIN_TOKEN=shpat_... node scripts/optimize-tracking-pixels.mjs --status');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
