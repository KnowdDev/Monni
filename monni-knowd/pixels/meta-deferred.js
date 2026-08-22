/**
 * Deferred Meta / Facebook pixel — paste into Shopify Admin.
 *
 * Admin → Settings → Customer events → Add custom pixel → Connect
 * FIRST disconnect the "Facebook & Instagram" app pixel to avoid duplicate fbq loads.
 *
 * Pixel ID: 338962594137574
 */
(function () {
  var loaded = false;
  var loading = false;
  var waiters = [];
  var pixelId = '338962594137574';

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
