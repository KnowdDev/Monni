/**
 * PostHog surgical funnel + first-touch ads attribution.
 *
 * Funnel (must match pixels/posthog-checkout.js and ads sprint queries):
 *   Product Viewed · Added to Cart · Checkout Started
 * Purchase is Customer Events only (checkout / thank-you cannot run theme JS).
 *
 * Attribution: persist utm_* / gclid / gbraid / wbraid first-touch onto cart
 * attributes so Shopify order note_attributes join PostHog + Google Ads.
 *
 * Full SDK may load late (idle/interaction). This file:
 *   - syncs cart attrs immediately via attribution-bootstrap
 *   - queues ATC / Checkout Started until PostHog is ready
 *   - forces SDK load on cart/checkout interactions
 */
(function () {
  'use strict';

  var ATTR_KEYS = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'utm_term',
    'gclid',
    'gbraid',
    'wbraid',
    'gad_source',
    'landing_page',
    'ph_distinct_id'
  ];

  var queue = [];

  function ensureSdk() {
    if (window.posthog && typeof window.posthog.capture === 'function') return;
    if (typeof window.__monniLoadPostHog === 'function') window.__monniLoadPostHog();
  }

  function phReady(fn) {
    if (window.posthog && typeof window.posthog.capture === 'function') {
      fn(window.posthog);
      return;
    }
    document.addEventListener('posthog:ready', function (e) {
      if (e.detail && e.detail.posthog) fn(e.detail.posthog);
    }, { once: true });
    var n = 0;
    var t = setInterval(function () {
      n += 1;
      if (window.posthog && typeof window.posthog.capture === 'function') {
        clearInterval(t);
        fn(window.posthog);
      } else if (n > 80) {
        clearInterval(t);
      }
    }, 250);
  }

  function safeCapture(event, properties) {
    try {
      if (window.posthog && typeof window.posthog.capture === 'function') {
        window.posthog.capture(event, properties || {});
        return;
      }
      queue.push({ event: event, properties: properties || {} });
      ensureSdk();
    } catch (e) {}
  }

  function flushQueue(posthog) {
    while (queue.length) {
      var item = queue.shift();
      try {
        posthog.capture(item.event, item.properties);
      } catch (e) {}
    }
  }

  function centsToDollars(cents) {
    if (typeof cents !== 'number') return null;
    return (cents / 100).toFixed(2);
  }

  function cartProps(cart) {
    if (!cart || typeof cart !== 'object') return {};
    return {
      cart_id: cart.token || cart.id,
      cart_item_count: cart.item_count,
      cart_total: centsToDollars(cart.total_price),
      cart_currency: cart.currency,
      cart_item_ids: (cart.items || []).map(function (i) { return i.product_id; }),
      cart_item_handles: (cart.items || []).map(function (i) { return i.handle; })
    };
  }

  function lineItemProps(item) {
    if (!item || typeof item !== 'object') return {};
    return {
      product_id: item.product_id,
      variant_id: item.variant_id,
      product_title: item.product_title || item.title,
      variant_title: item.variant_title,
      product_handle: item.handle,
      product_type: item.product_type,
      product_vendor: item.vendor,
      quantity: item.quantity,
      price: centsToDollars(item.price),
      line_price: centsToDollars(item.line_price)
    };
  }

  function readUrlAttribution() {
    var params = new URLSearchParams(window.location.search);
    var out = {};
    ATTR_KEYS.forEach(function (k) {
      if (k === 'ph_distinct_id' || k === 'landing_page') return;
      var v = params.get(k);
      if (v) out[k] = v;
    });
    if (out.gclid || out.gbraid || (out.utm_source && String(out.utm_source).toLowerCase() === 'google')) {
      out.landing_page = window.location.pathname;
    }
    return out;
  }

  function bootstrapAttribution() {
    if (window.__monniAttribution) return window.__monniAttribution;
    try {
      return JSON.parse(sessionStorage.getItem('monni_attribution') || '{}');
    } catch (e) {
      return {};
    }
  }

  function firstTouchFrom(cart, urlBits, distinctId) {
    var existing = (cart && cart.attributes) || {};
    var next = {};
    ATTR_KEYS.forEach(function (k) {
      if (existing[k]) return;
      if (k === 'ph_distinct_id' && distinctId) next[k] = distinctId;
      else if (urlBits[k]) next[k] = urlBits[k];
    });
    return next;
  }

  function patchCartAttributes(urlBits, distinctId) {
    fetch('/cart.js', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (cart) {
        if (!cart) return;
        var patch = firstTouchFrom(cart, urlBits, distinctId);
        if (!Object.keys(patch).length) return;
        return fetch('/cart/update.js', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          body: JSON.stringify({ attributes: patch })
        });
      })
      .catch(function () {});
  }

  function syncCartAttribution(posthog) {
    var distinctId = posthog && posthog.get_distinct_id ? posthog.get_distinct_id() : null;
    var urlBits = readUrlAttribution();
    var bootstrap = bootstrapAttribution();
    var merged = Object.assign({}, bootstrap, urlBits);
    if (posthog && Object.keys(urlBits).length) posthog.register_once(urlBits);
    patchCartAttributes(merged, distinctId || merged.ph_distinct_id);
  }

  /* Cart attrs immediately — no SDK required */
  syncCartAttribution(null);

  /* Wire funnel listeners early; captures queue until SDK ready */
  var lastAddKey = '';
  function captureAddToCart(item, source) {
    var key = String(item.variant_id || item.product_id || '') + ':' + String(item.quantity || 1);
    var now = Date.now();
    if (lastAddKey === key + ':' + Math.floor(now / 2000)) return;
    lastAddKey = key + ':' + Math.floor(now / 2000);
    safeCapture('Added to Cart', Object.assign({ source: source }, lineItemProps(item)));
    syncCartAttribution(window.posthog || null);
  }

  document.addEventListener('cart:added', function (event) {
    var detail = event.detail || {};
    captureAddToCart(detail.data || {}, 'product_form');
  });

  var originalFetch = window.fetch;
  if (typeof originalFetch === 'function') {
    window.fetch = function () {
      var args = arguments;
      var input = args[0];
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      return originalFetch.apply(this, args).then(function (response) {
        if (url.indexOf('/cart/add') !== -1 && response && response.ok) {
          try {
            var clone = response.clone();
            clone.json().then(function (data) {
              if (data && data.product_id) captureAddToCart(data, 'cart_add_js');
            }).catch(function () {});
          } catch (e) {}
        }
        return response;
      });
    };
  }

  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!(target instanceof Element)) return;
    var checkoutEl = target.closest('[name="checkout"], a[href*="/checkout"], button[data-checkout]');
    if (!checkoutEl) return;
    ensureSdk();
    fetch('/cart.js', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (cart) {
        safeCapture('Checkout Started', Object.assign({ source: 'checkout_button' }, cartProps(cart)));
      })
      .catch(function () {
        safeCapture('Checkout Started', { source: 'checkout_button' });
      });
    syncCartAttribution(window.posthog || null);
  });

  if (window.location.pathname === '/cart') {
    safeCapture('cart_viewed', { source: 'cart_page' });
  }

  phReady(function (posthog) {
    var dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
    if (dnt === '1' || dnt === 'yes') return;
    flushQueue(posthog);
    syncCartAttribution(posthog);
  });
})();
