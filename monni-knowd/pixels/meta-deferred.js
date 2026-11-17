/**
 * Meta pixel for Shopify Customer Events.
 *
 * Admin → Settings → Customer events → Add custom pixel
 * Name: Meta
 * Permission: Marketing
 * Paste this file, then Connect.
 *
 * Do not paste this into theme.liquid. The Facebook & Instagram app pixel
 * must stay disconnected, or purchases are counted twice.
 *
 * Pixel ID: 338962594137574
 */
(function () {
  var PIXEL_ID = '338962594137574';
  var loaded = false;

  function rawId(value) {
    if (value == null || value === '') return '';
    var id = String(value);
    var parts = id.split('/');
    return parts[parts.length - 1];
  }

  function money(amount) {
    var n = parseFloat(amount);
    return isNaN(n) ? 0 : n;
  }

  function ensureFb() {
    if (loaded || window.fbq) {
      loaded = true;
      return;
    }
    loaded = true;
    !(function (f, b, e, v, n, t) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      (b.head || b.documentElement).appendChild(t);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', PIXEL_ID);
  }

  function track(name, params, eventId) {
    ensureFb();
    if (eventId) fbq('track', name, params || {}, { eventID: String(eventId) });
    else if (params) fbq('track', name, params);
    else fbq('track', name);
  }

  function variantContent(variant, quantity) {
    if (!variant) return null;
    var id = rawId(variant.id);
    if (!id) return null;
    var price = variant.price || {};
    return {
      id: id,
      quantity: quantity || 1,
      value: money(price.amount),
      currency: price.currencyCode || 'NZD',
      name: (variant.product && variant.product.title) || variant.title || ''
    };
  }

  function lineContents(checkout) {
    var items = (checkout && checkout.lineItems) || [];
    var ids = [];
    var contents = [];
    var count = 0;
    items.forEach(function (item) {
      var content = variantContent(item.variant, item.quantity || 1);
      if (!content) return;
      ids.push(content.id);
      contents.push({ id: content.id, quantity: content.quantity });
      count += content.quantity;
    });
    return { ids: ids, contents: contents, count: count };
  }

  analytics.subscribe('page_viewed', function () {
    track('PageView');
  });

  analytics.subscribe('product_viewed', function (event) {
    var content = variantContent(event.data && event.data.productVariant, 1);
    if (!content) return;
    track('ViewContent', {
      content_ids: [content.id],
      content_type: 'product',
      content_name: content.name,
      value: content.value,
      currency: content.currency
    });
  });

  analytics.subscribe('product_added_to_cart', function (event) {
    var line = event.data && event.data.cartLine;
    var variant = line && (line.merchandise || line.variant);
    var content = variantContent(variant, (line && line.quantity) || 1);
    if (!content) return;
    var lineCost = line && line.cost && line.cost.totalAmount;
    track('AddToCart', {
      content_ids: [content.id],
      content_type: 'product',
      content_name: content.name,
      contents: [{ id: content.id, quantity: content.quantity }],
      value: lineCost ? money(lineCost.amount) : content.value * content.quantity,
      currency: (lineCost && lineCost.currencyCode) || content.currency
    });
  });

  analytics.subscribe('checkout_started', function (event) {
    var checkout = event.data && event.data.checkout;
    if (!checkout) return;
    var lines = lineContents(checkout);
    var total = checkout.totalPrice || {};
    track('InitiateCheckout', {
      content_ids: lines.ids,
      content_type: 'product',
      contents: lines.contents,
      num_items: lines.count,
      value: money(total.amount),
      currency: total.currencyCode || 'NZD'
    });
  });

  analytics.subscribe('checkout_completed', function (event) {
    var checkout = event.data && event.data.checkout;
    if (!checkout) return;
    ensureFb();
    var user = {};
    if (checkout.email) user.em = checkout.email;
    var phone = checkout.phone || (checkout.shippingAddress && checkout.shippingAddress.phone);
    if (phone) user.ph = phone;
    if (user.em || user.ph) fbq('init', PIXEL_ID, user);

    var lines = lineContents(checkout);
    var total = checkout.totalPrice || {};
    var orderId = rawId(checkout.order && checkout.order.id) || checkout.token || '';
    track('Purchase', {
      content_ids: lines.ids,
      content_type: 'product',
      contents: lines.contents,
      num_items: lines.count,
      value: money(total.amount),
      currency: total.currencyCode || 'NZD'
    }, orderId);
  });

  analytics.subscribe('search_submitted', function (event) {
    var search = event.data && event.data.searchResult;
    var query = search && search.query;
    if (!query) return;
    track('Search', { search_string: query });
  });
})();
