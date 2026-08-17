/**
 * PostHog Shopify behavioural tracking.
 * Subscribes to the theme's existing pub/sub + DOM custom events and forwards
 * them to PostHog as named events with rich properties.
 *
 * Depends on: window.posthog (loaded via snippets/posthog.liquid)
 *             pubsub.js (subscribe/publish globals) — optional, gracefully degrades
 *
 * Events captured:
 *   product_added_to_cart  — from `cart:added` CustomEvent (product.js)
 *   cart_updated           — from `cart-update` pub/sub (cart-drawer.js)
 *   cart_error             — from `cart-error` pub/sub (cart-drawer.js)
 *   wishlist_updated       — from `wishlist:updated` CustomEvent (wishlist.js)
 *   newsletter_subscribed  — from newsletter form submit (popup + footer)
 *   search_performed       — from search form submit
 *   variant_changed        — from variant selector change on product pages
 *   checkout_started       — from checkout button click / navigation to /checkout
 *   cart_viewed            — when cart drawer opens or /cart is visited
 */
(function () {
  'use strict';

  if (!window.posthog || typeof window.posthog.capture !== 'function') return;

  // Respect Do Not Track (mirrors snippet guard for safety)
  var dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
  if (dnt === '1' || dnt === 'yes') return;

  var posthog = window.posthog;

  // ─── Helpers ────────────────────────────────────────────────────────────
  function safeCapture(event, properties) {
    try {
      posthog.capture(event, properties || {});
    } catch (e) {
      // Never let analytics break the storefront
    }
  }

  // Shopify cart.js returns prices in cents (integer). Convert to dollars.
  function centsToDollars(cents) {
    if (typeof cents !== 'number') return null;
    return (cents / 100).toFixed(2);
  }

  // Normalise a cart.js cart object into PostHog-friendly properties
  function cartProps(cart) {
    if (!cart || typeof cart !== 'object') return {};
    return {
      cart_id: cart.token || cart.id,
      cart_item_count: cart.item_count,
      cart_total: centsToDollars(cart.total_price),
      cart_total_price_cents: cart.total_price,
      cart_currency: cart.currency,
      cart_items_subtotal: centsToDollars(cart.items_subtotal_price),
      cart_item_ids: (cart.items || []).map(function (i) { return i.product_id; }),
      cart_item_handles: (cart.items || []).map(function (i) { return i.handle; }),
      cart_item_count_unique: (cart.items || []).length,
      cart_has_gift_card: (cart.items || []).some(function (i) { return i.gift_card; }),
      cart_attributes: cart.attributes ? Object.keys(cart.attributes) : []
    };
  }

  // Normalise a single cart line item (from cart/add.js response or cart:added detail)
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
      price_cents: item.price,
      line_price: centsToDollars(item.line_price),
      requires_shipping: item.requires_shipping,
      taxable: item.taxable,
      gift_card: item.gift_card
    };
  }

  // ─── 1. Product added to cart (DOM CustomEvent from product.js) ─────────
  document.addEventListener('cart:added', function (event) {
    var detail = event.detail || {};
    var data = detail.data || {};
    // cart/add.js returns the added line item
    safeCapture('product_added_to_cart', Object.assign(
      { source: 'product_form' },
      lineItemProps(data)
    ));
  });

  // ─── 2. Cart updated (pub/sub from cart-drawer.js) ──────────────────────
  if (typeof subscribe === 'function') {
    subscribe('cart-update', function (payload) {
      var cart = payload && payload.cart;
      safeCapture('cart_updated', cartProps(cart));
    });

    // ─── 3. Cart error (pub/sub from cart-drawer.js) ──────────────────────
    subscribe('cart-error', function (payload) {
      safeCapture('cart_error', {
        error: payload && payload.error ? String(payload.error) : 'unknown',
        source: 'cart_drawer'
      });
    });
  }

  // ─── 4. Wishlist updated (DOM CustomEvent from wishlist.js) ─────────────
  document.addEventListener('wishlist:updated', function (event) {
    var detail = event.detail || {};
    safeCapture('wishlist_updated', {
      wishlist_count: detail.count,
      source: 'wishlist_toggle'
    });
  });

  // ─── 5. Newsletter subscribed (any newsletter form submit) ─────────────
  // Covers popup form + footer form + standalone newsletter pages.
  document.addEventListener('submit', function (event) {
    var form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    var isNewsletter =
      form.classList.contains('newsletter-popup__form') ||
      form.classList.contains('footer__newsletter-form') ||
      form.classList.contains('newsletter-form') ||
      (form.action && form.action.indexOf('subscribe') > -1) ||
      (form.querySelector && form.querySelector('input[type="email"]') && form.action && form.action.indexOf('contact') > -1);
    if (!isNewsletter) return;
    var source = 'unknown';
    if (form.classList.contains('newsletter-popup__form') || form.closest('.newsletter-popup')) {
      source = 'popup';
    } else if (form.closest('footer') || form.classList.contains('footer__newsletter-form')) {
      source = 'footer';
    } else if (form.closest('.newsletter-page')) {
      source = 'newsletter_page';
    }
    var emailInput = form.querySelector('input[type="email"]');
    safeCapture('newsletter_subscribed', {
      source: source,
      form_id: form.id || null,
      has_email: !!(emailInput && emailInput.value)
    });
  }, true); // capture phase — fires before any handler might redirect

  // ─── 6. Search performed (search page form + brands-directory search) ───
  document.addEventListener('submit', function (event) {
    var form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    var isSearchForm =
      form.classList.contains('search-page__form') ||
      form.getAttribute('role') === 'search' ||
      (form.action && form.action.indexOf('/search') > -1);
    if (!isSearchForm) return;
    var queryInput = form.querySelector('input[name="q"], input[type="search"]');
    safeCapture('search_performed', {
      query: queryInput ? queryInput.value : null,
      query_length: queryInput ? queryInput.value.length : 0,
      form_class: form.className
    });
  }, true);

  // ─── 7. Variant changed (product page radio/selector change) ───────────
  // Uses event delegation on the variant selector container.
  document.addEventListener('change', function (event) {
    var target = event.target;
    if (!(target instanceof Element)) return;
    var selector = target.closest('[data-variant-selector]');
    if (!selector) return;
    var variantIdInput = selector.querySelector('[data-variant-id]');
    var productPage = target.closest('[data-product-page], .product-page');
    var productTitleEl = productPage ? productPage.querySelector('[data-product-title], .product-page__title, h1') : null;
    safeCapture('variant_changed', {
      variant_id: variantIdInput ? variantIdInput.value : null,
      option_name: target.name,
      option_value: target.value,
      product_id: productPage ? productPage.dataset.productId : null,
      product_title: productTitleEl ? productTitleEl.textContent.trim() : null,
      source: 'variant_selector'
    });
  });

  // ─── 8. Checkout started (checkout button click + /checkout navigation) ─
  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!(target instanceof Element)) return;
    var checkoutEl = target.closest('[name="checkout"], a[href*="/checkout"], button[data-checkout]');
    if (!checkoutEl) return;
    // Fetch current cart to enrich the event
    safeCapture('checkout_started', {
      source: 'checkout_button',
      button_label: checkoutEl.textContent ? checkoutEl.textContent.trim() : null
    });
    // Best-effort cart snapshot
    try {
      fetch('/cart.js', { credentials: 'same-origin' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (cart) {
          if (cart) safeCapture('checkout_started_cart', cartProps(cart));
        })
        .catch(function () {});
    } catch (e) {}
  });

  // ─── 9. Cart viewed (cart drawer open + /cart page) ─────────────────────
  // Cart drawer: detect via the custom element or a class toggle.
  var cartDrawer = document.querySelector('cart-drawer, .cart-drawer, [data-cart-drawer]');
  if (cartDrawer && typeof MutationObserver !== 'undefined') {
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName !== 'open' && m.attributeName !== 'class') return;
        var isOpen = cartDrawer.hasAttribute('open') ||
                     cartDrawer.classList.contains('is-open') ||
                     cartDrawer.classList.contains('open');
        if (isOpen && !cartDrawer.dataset.phCartViewed) {
          cartDrawer.dataset.phCartViewed = '1';
          safeCapture('cart_viewed', { source: 'cart_drawer' });
        } else if (!isOpen) {
          delete cartDrawer.dataset.phCartViewed;
        }
      });
    });
    observer.observe(cartDrawer, { attributes: true, attributeFilter: ['open', 'class'] });
  }

  // /cart page view — fired on load when page type is cart
  if (window.location.pathname === '/cart') {
    safeCapture('cart_viewed', { source: 'cart_page' });
  }

  // ─── 10. Cart drawer opened via header cart link (fallback) ─────────────
  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!(target instanceof Element)) return;
    var cartLink = target.closest('a[href*="/cart"], [data-cart-link], [aria-controls*="cart"]');
    if (cartLink && !cartLink.matches('[name="checkout"]')) {
      safeCapture('cart_link_clicked', {
        link_href: cartLink.getAttribute('href'),
        link_text: cartLink.textContent ? cartLink.textContent.trim() : null
      });
    }
  });
})();
