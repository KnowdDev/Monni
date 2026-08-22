/**
 * Deferred Google tag — paste into Shopify Admin as a CUSTOM pixel.
 *
 * Admin → Settings → Customer events → Add custom pixel
 * Name: GTM deferred
 * Permissions: Marketing + Analytics → Connect
 *
 * Keep Google & YouTube app CONVERSION MEASUREMENT OFF (feeds stay; no duplicate gtag).
 *
 * Tag: Tea & Tonic Matakana
 * IDs: AW-16826543864, GT-TQT9B5FH
 */
(function () {
  var loaded = false;
  var loading = false;
  var waiters = [];
  var ids = ['AW-16826543864', 'GT-TQT9B5FH'];

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

  analytics.subscribe('checkout_started', function (event) {
    ensureGtag();
    var checkout = event.data && event.data.checkout;
    runGtag(function () {
      gtag('event', 'begin_checkout', {
        currency: checkout && checkout.currencyCode,
        value: checkout && checkout.totalPrice && checkout.totalPrice.amount
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
