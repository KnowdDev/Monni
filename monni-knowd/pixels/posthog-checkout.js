/**
 * MONNI — PostHog checkout / purchase pixel (Customer Events → Custom pixel)
 *
 * Theme PostHog covers browse → Product Viewed → Added to Cart → Checkout Started.
 * Shopify checkout / thank-you cannot run theme JS, so Purchase must come from here.
 *
 * Init PostHog ONLY inside event callbacks so array.js is not loaded on every
 * storefront page (avoids doubling the theme snippet).
 *
 * INSTALL
 * 1. Shopify Admin → Settings → Customer events → Add custom pixel
 * 2. Name: "PostHog Checkout"
 *    https://admin.shopify.com/store/tea-tonic-matakana/settings/customer_events
 * 3. Paste this entire file
 * 4. Connect / Save
 *
 * Funnel names (locked for ads sprints):
 *   checkout_completed → Purchase
 *   checkout_started   → Checkout Started
 */
(function () {
  var POSTHOG_KEY = 'phc_AAJHNqhULC9nsSjFNwWcXb2YBoPBHAEymLofatPXJogg';
  var API_HOST = 'https://eu.i.posthog.com';
  var booting = false;
  var readyQueue = [];
  var bootDistinctId = null;

  function attrMap(checkout) {
    var out = {};
    var attrs = (checkout && checkout.attributes) || [];
    for (var i = 0; i < attrs.length; i++) {
      var a = attrs[i];
      if (!a) continue;
      var key = a.key || a.name;
      if (key) out[key] = a.value;
    }
    return out;
  }

  function whenReady(fn, distinctId) {
    if (window.posthog && typeof window.posthog.capture === 'function' && window.posthog.__loaded) {
      fn(window.posthog);
      return;
    }
    readyQueue.push(fn);
    if (distinctId && !bootDistinctId) bootDistinctId = distinctId;
    if (booting) return;
    booting = true;

    !(function (t, e) {
      var o, n, p, r;
      e.__SV ||
        ((window.posthog = e),
        (e._i = []),
        (e.init = function (i, s, a) {
          function g(t, e) {
            var o = e.split('.');
            2 == o.length && ((t = t[o[0]]), (e = o[1]));
            t[e] = function () {
              t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
            };
          }
          ((p = t.createElement('script')).type = 'text/javascript'),
            (p.crossOrigin = 'anonymous'),
            (p.async = true),
            (p.src =
              s.api_host.replace('.i.posthog.com', '-assets.i.posthog.com') +
              '/static/array.js'),
            (r = t.getElementsByTagName('script')[0]).parentNode.insertBefore(p, r);
          var u = e;
          for (
            void 0 !== a ? (u = e[a] = []) : (a = 'posthog'),
              u.people = u.people || [],
              u.toString = function (t) {
                var e = 'posthog';
                return ('posthog' !== a && (e += '.' + a), t || (e += ' (stub)'), e);
              },
              u.people.toString = function () {
                return u.toString(1) + '.people (stub)';
              },
              o =
                'capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagResult reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys getNextSurveyStep onSessionId'.split(
                  ' '
                ),
              n = 0;
            n < o.length;
            n++
          )
            g(u, o[n]);
          e._i.push([i, s, a]);
        }),
        (e.__SV = 1));
    })(document, window.posthog || []);

    var initOpts = {
      api_host: API_HOST,
      defaults: '2026-05-30',
      capture_pageview: false,
      autocapture: false,
      disable_session_recording: true,
      loaded: function (ph) {
        var q = readyQueue.splice(0, readyQueue.length);
        for (var i = 0; i < q.length; i++) {
          try {
            q[i](ph);
          } catch (err) {}
        }
      },
    };
    if (bootDistinctId) initOpts.bootstrap = { distinctID: bootDistinctId };
    posthog.init(POSTHOG_KEY, initOpts);
  }

  function money(amountObj) {
    if (!amountObj) return 0;
    var n = parseFloat(amountObj.amount);
    return isNaN(n) ? 0 : n;
  }

  function mapLineItems(checkout) {
    var items = (checkout && checkout.lineItems) || [];
    return items.map(function (item) {
      var variant = item.variant || {};
      var product = variant.product || {};
      var price = variant.price || {};
      return {
        product_id: product.id || item.id || '',
        title: product.title || item.title || '',
        quantity: item.quantity || 0,
        price: money(price),
        currency: price.currencyCode || (checkout.totalPrice && checkout.totalPrice.currencyCode) || 'NZD',
        sku: variant.sku || '',
        variant_id: variant.id || '',
        variant_title: variant.title || '',
      };
    });
  }

  function applyAttribution(ph, checkout) {
    var attrs = attrMap(checkout);
    var once = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'gbraid', 'wbraid', 'gad_source', 'landing_page'].forEach(function (k) {
      if (attrs[k]) once[k] = attrs[k];
    });
    if (Object.keys(once).length) ph.register_once(once);
    var email = checkout && checkout.email;
    if (email) {
      ph.identify(email, {
        email: email,
        shopify_customer_id: (checkout.order && checkout.order.customer && checkout.order.customer.id) || '',
      });
    }
    return attrs;
  }

  analytics.subscribe('checkout_completed', function (event) {
    var checkout = event.data && event.data.checkout;
    if (!checkout) return;
    var attrs = attrMap(checkout);
    whenReady(function (ph) {
      applyAttribution(ph, checkout);
      var order = checkout.order || {};
      var total = checkout.totalPrice || {};
      ph.capture('Purchase', {
        value: money(total),
        revenue: money(total),
        currency: total.currencyCode || 'NZD',
        order_id: order.id || checkout.token || '',
        order_number: order.name || order.id || '',
        email: checkout.email || '',
        item_count: (checkout.lineItems || []).reduce(function (n, i) {
          return n + (i.quantity || 0);
        }, 0),
        products: mapLineItems(checkout),
        utm_source: attrs.utm_source || '',
        utm_medium: attrs.utm_medium || '',
        utm_campaign: attrs.utm_campaign || '',
        gclid: attrs.gclid || '',
        source: 'shopify_customer_events',
        shopify_client_id: event.clientId || '',
        created_at: event.timestamp || '',
      });
    }, attrs.ph_distinct_id);
  });

  analytics.subscribe('checkout_started', function (event) {
    var checkout = event.data && event.data.checkout;
    if (!checkout) return;
    var attrs = attrMap(checkout);
    whenReady(function (ph) {
      applyAttribution(ph, checkout);
      var total = checkout.totalPrice || {};
      ph.capture('Checkout Started', {
        value: money(total),
        currency: total.currencyCode || 'NZD',
        item_count: (checkout.lineItems || []).reduce(function (n, i) {
          return n + (i.quantity || 0);
        }, 0),
        products: mapLineItems(checkout),
        utm_source: attrs.utm_source || '',
        utm_campaign: attrs.utm_campaign || '',
        source: 'shopify_customer_events',
        shopify_client_id: event.clientId || '',
      });
    }, attrs.ph_distinct_id);
  });
})();
