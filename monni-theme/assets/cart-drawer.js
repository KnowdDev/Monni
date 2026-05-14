/**
 * CartDrawer — Custom Element
 * Hyper-optimised right-side cart drawer for Monni.
 * Optimistic UI, debounced quantity updates, focus trap, reduced-motion support.
 */

class CartDrawer extends HTMLElement {
  constructor() {
    super();
    this.debouncedChange = null;
    this.isOpen = false;
    this.lastFocusedElement = null;
  }

  static cartUrl(path) {
    const root = window.Shopify?.routes?.root || '/';
    // On shopify theme dev, routes.root points to the live store domain,
    // which causes CORS when fetching from localhost. Fall back to relative.
    if (root.startsWith('http') && !root.startsWith(window.location.origin)) {
      return '/' + path.replace(/^\//, '');
    }
    return root + path;
  }

  connectedCallback() {
    if (window.Shopify?.designMode) return;

    this.backdrop = this.querySelector('[data-cart-drawer-backdrop]');
    this.closeBtn = this.querySelector('[data-cart-drawer-close]');
    this.itemsContainer = this.querySelector('[data-cart-drawer-items]');
    this.emptyState = this.querySelector('[data-cart-drawer-empty]');
    this.footer = this.querySelector('[data-cart-drawer-footer]');
    this.subtotalEl = this.querySelector('[data-cart-drawer-subtotal]');
    this.shippingBar = this.querySelector('[data-cart-drawer-shipping]');
    this.shippingProgress = this.querySelector('[data-cart-drawer-shipping-progress]');
    this.shippingLabel = this.querySelector('[data-cart-drawer-shipping-label]');
    this.noteInput = this.querySelector('[data-cart-note]');

    this.bindEvents();
    this.bindPubSub();
  }

  bindEvents() {
    this.backdrop?.addEventListener('click', () => this.close());
    this.closeBtn?.addEventListener('click', () => this.close());

    this.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
      if (e.key === 'Tab') this.trapFocus(e);
    });

    this.addEventListener('click', (e) => {
      const decreaseBtn = e.target.closest('[data-quantity-decrease]');
      const increaseBtn = e.target.closest('[data-quantity-increase]');
      const removeBtn = e.target.closest('[data-cart-remove]');

      if (decreaseBtn) {
        const input = decreaseBtn.closest('.cart-drawer__item-quantity')?.querySelector('input');
        if (input) this.changeQuantity(input, parseInt(input.value, 10) - 1);
        return;
      }

      if (increaseBtn) {
        const input = increaseBtn.closest('.cart-drawer__item-quantity')?.querySelector('input');
        if (input) this.changeQuantity(input, parseInt(input.value, 10) + 1);
        return;
      }

      if (removeBtn) {
        const item = removeBtn.closest('[data-cart-item]');
        if (item?.dataset.line) this.updateLine(item.dataset.line, 0);
      }
    });

    this.addEventListener('change', (e) => {
      const quantityInput = e.target.closest('[data-quantity-input]');
      if (quantityInput) {
        const value = parseInt(quantityInput.value, 10);
        if (!isNaN(value) && value >= 0) {
          this.changeQuantity(quantityInput, value);
        }
      }
    });

    this.noteInput?.addEventListener('change', () => this.updateNote());
  }

  bindPubSub() {
    document.addEventListener('cart:added', () => {
      const wasOpen = this.isOpen;
      this.open();
      if (wasOpen) this.fetchCart();
    });

    document.addEventListener('click', (e) => {
      const toggle = e.target.closest('[data-cart-toggle]');
      if (toggle) {
        e.preventDefault();
        this.open();
      }
    });
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.lastFocusedElement = document.activeElement;
    this.classList.add('is-open');
    document.documentElement.classList.add('cart-drawer-open');

    requestAnimationFrame(() => {
      const focusable = this.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      focusable?.focus();
    });

    this.fetchCart();
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.classList.remove('is-open');
    document.documentElement.classList.remove('cart-drawer-open');

    if (this.lastFocusedElement) {
      this.lastFocusedElement.focus();
      this.lastFocusedElement = null;
    }
  }

  trapFocus(e) {
    const focusable = Array.from(
      this.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ).filter((el) => !el.disabled && el.offsetParent !== null);

    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  async fetchCart() {
    if (this._fetchingCart) return;
    this._fetchingCart = true;
    try {
      const response = await fetch(CartDrawer.cartUrl('cart.js'));
      const cart = await response.json();
      this.updateCart(cart);
      if (typeof publish === 'function') {
        publish('cart-update', { cart });
      }
    } catch (err) {
      console.error('Cart fetch error:', err);
    } finally {
      this._fetchingCart = false;
    }
  }

  updateCart(cart) {
    document.querySelectorAll('[data-cart-count]').forEach((el) => {
      el.textContent = cart.item_count;
      el.setAttribute('data-cart-count', cart.item_count);
      if (cart.item_count === 0) {
        el.classList.add('is-empty');
      } else {
        el.classList.remove('is-empty');
      }
    });

    if (!cart || !cart.items || cart.items.length === 0 || cart.item_count === 0) {
      this.showEmpty();
    } else {
      this.renderItems(cart.items);
      this.showItems();
    }

    if (this.subtotalEl) {
      this.subtotalEl.textContent = this.formatMoney(cart.total_price);
    }

    this.updateShippingBar(cart.total_price);

    if (this.noteInput && cart.note !== undefined) {
      this.noteInput.value = cart.note || '';
    }
  }

  showEmpty() {
    if (this.itemsContainer) this.itemsContainer.hidden = true;
    if (this.emptyState) this.emptyState.hidden = false;
    if (this.footer) this.footer.hidden = true;
  }

  showItems() {
    if (this.itemsContainer) this.itemsContainer.hidden = false;
    if (this.emptyState) this.emptyState.hidden = true;
    if (this.footer) this.footer.hidden = false;
  }

  renderItems(items) {
    if (!this.itemsContainer || !Array.isArray(items)) return;
    this.itemsContainer.innerHTML = items.map((item, index) => this.renderItem(item, index + 1)).join('');
  }

  renderItem(item, line) {
    const variantTitle = item.variant_title && item.variant_title !== 'Default Title'
      ? `<p class="cart-drawer__item-variant">${this.escapeHtml(item.variant_title)}</p>`
      : '';

    const sellingPlan = item.selling_plan_allocation
      ? `<p class="cart-drawer__item-plan">${this.escapeHtml(item.selling_plan_allocation.selling_plan.name)}</p>`
      : '';

    const imageHtml = item.image
      ? `<img src="${this.escapeHtml(item.image)}" alt="${this.escapeHtml(item.image_alt || item.product_title)}" width="80" height="80" loading="lazy">`
      : `<div class="cart-drawer__item-image-placeholder">${this.escapeHtml(item.product_title?.charAt(0))}</div>`;

    return `
      <div class="cart-drawer__item" data-cart-item data-line="${line}" data-variant-id="${item.variant_id}">
        <div class="cart-drawer__item-image">
          <a href="${item.url || '#'}">${imageHtml}</a>
        </div>
        <div class="cart-drawer__item-details">
          <a href="${item.url || '#'}" class="cart-drawer__item-title">${this.escapeHtml(item.product_title)}</a>
          ${variantTitle}
          ${sellingPlan}
          <div class="cart-drawer__item-price">${this.formatMoney(item.final_line_price)}</div>
        </div>
        <div class="cart-drawer__item-actions">
          <div class="cart-drawer__item-quantity">
            <button type="button" data-quantity-decrease aria-label="Decrease quantity">−</button>
            <input type="number" name="quantity" value="${item.quantity}" min="0" data-quantity-input aria-label="Quantity">
            <button type="button" data-quantity-increase aria-label="Increase quantity">+</button>
          </div>
          <button type="button" class="cart-drawer__item-remove" data-cart-remove aria-label="Remove ${this.escapeHtml(item.product_title)}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
    `;
  }

  changeQuantity(input, newQuantity) {
    const item = input.closest('[data-cart-item]');
    const line = item?.dataset.line;
    if (!line) return;

    if (newQuantity < 0) return;

    input.value = newQuantity;

    clearTimeout(this.debouncedChange);
    this.debouncedChange = setTimeout(() => {
      this.updateLine(line, newQuantity);
    }, 300);
  }

  async updateLine(line, quantity) {
    try {
      const response = await fetch(CartDrawer.cartUrl('cart/change.js'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ line: parseInt(line, 10), quantity }),
      });

      const cart = await response.json();

      if (!response.ok) throw new Error(cart.description || 'Update failed');

      this.updateCart(cart);
      if (typeof publish === 'function') {
        publish('cart-update', { cart });
      }
    } catch (err) {
      console.error('Cart update error:', err);
      this.fetchCart();
      if (typeof publish === 'function') {
        publish('cart-error', { error: err });
      }
    }
  }

  async updateNote() {
    if (!this.noteInput) return;
    try {
      await fetch(`${window.Shopify?.routes?.root || '/'}cart/update.js`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ note: this.noteInput.value }),
      });
    } catch (err) {
      console.error('Note update error:', err);
    }
  }

  updateShippingBar(totalPrice) {
    if (!this.shippingBar) return;
    const threshold = parseInt(this.dataset.shippingThreshold || '0', 10) * 100;
    if (!threshold) return;

    const progress = Math.min((totalPrice / threshold) * 100, 100);
    const remaining = Math.max(threshold - totalPrice, 0);

    if (this.shippingProgress) {
      this.shippingProgress.style.width = `${progress}%`;
    }

    if (this.shippingLabel) {
      if (remaining === 0) {
        this.shippingLabel.innerHTML = 'You have free shipping!';
      } else {
        this.shippingLabel.innerHTML = `Free shipping over ${this.formatMoney(threshold)} — <span class="cart-drawer__shipping-remaining">${this.formatMoney(remaining)}</span> away`;
      }
    }
  }

  formatMoney(cents) {
    if (typeof Shopify !== 'undefined' && Shopify.formatMoney) {
      return Shopify.formatMoney(cents, window.Shopify?.money_format || '${{amount}}');
    }
    const value = (cents / 100).toFixed(2);
    const format = window.Shopify?.money_format || '${{amount}}';
    return format.replace('{{amount}}', value).replace('{{amount_no_decimals}}', Math.round(cents / 100).toString());
  }

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

customElements.define('cart-drawer', CartDrawer);

// ─────────────────────────────────────────────────────────────────────────────
// Card Product Interactions: Wishlist + Quick Add
// ─────────────────────────────────────────────────────────────────────────────

const WISHLIST_KEY = 'monni:wishlist';

function getWishlist() {
  try {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveWishlist(list) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
}

function toggleWishlist(productId) {
  const list = getWishlist();
  const idx = list.indexOf(productId);
  if (idx > -1) {
    list.splice(idx, 1);
    saveWishlist(list);
    return false; // removed
  }
  list.push(productId);
  saveWishlist(list);
  return true; // added
}

function updateWishlistButtons() {
  const list = getWishlist();
  document.querySelectorAll('[data-wishlist-toggle]').forEach(btn => {
    const id = String(btn.dataset.wishlistToggle);
    const active = list.includes(id);
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-label', active ? 'Remove from wishlist' : 'Add to wishlist');
  });
}

function initCardInteractions() {
  // Wishlist: event delegation
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-wishlist-toggle]');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();

    const id = String(btn.dataset.wishlistToggle);
    const added = toggleWishlist(id);
    btn.classList.toggle('is-active', added);
    btn.setAttribute('aria-label', added ? 'Remove from wishlist' : 'Add to wishlist');
  });

  // Quick Add: cart drawer upsell only
  document.addEventListener('click', e => {
    const btn = e.target.closest('.cart-drawer__upsell-add');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();

    const variantIdRaw = btn.dataset.variantId || btn.dataset.quickAdd;
    const variantId = Number(variantIdRaw);
    if (!variantIdRaw || !variantId || isNaN(variantId)) {
      console.error('Invalid variant ID:', variantIdRaw, 'Button:', btn);
      return;
    }

    const originalHTML = btn.innerHTML;
    btn.classList.add('is-loading');
    btn.innerHTML = '<span style="display:inline-block;width:14px;height:14px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:spin 0.6s linear infinite;"></span>';

    const cartAddUrl = (() => {
      const root = window.Shopify?.routes?.root || '/';
      if (root.startsWith('http') && !root.startsWith(window.location.origin)) {
        return '/cart/add.js';
      }
      return root + 'cart/add.js';
    })();

    fetch(cartAddUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: JSON.stringify({ id: variantId, quantity: 1 }),
    })
      .then(async r => {
        const text = await r.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          console.error('Cart add returned non-JSON. Status:', r.status, 'Body:', text.slice(0, 500));
          throw new Error('Unexpected response from server. Please refresh and try again.');
        }
        if (!r.ok || data.status) {
          const msg = data.description || data.message || `Error ${data.status || r.status}`;
          console.error('Cart add error response:', data);
          throw new Error(msg);
        }
        return data;
      })
      .then(data => {
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
        document.dispatchEvent(new CustomEvent('cart:added', { detail: { data } }));
        setTimeout(() => {
          btn.classList.remove('is-loading');
          btn.innerHTML = originalHTML;
        }, 1500);
      })
      .catch(err => {
        console.error('Quick add error:', err);
        btn.classList.remove('is-loading');
        btn.innerHTML = originalHTML;
        alert(err.message || 'Could not add to cart. Please try again or visit the product page.');
      });
  });

  // Spin animation for loading state
  if (!document.getElementById('card-spin-style')) {
    const style = document.createElement('style');
    style.id = 'card-spin-style';
    style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(style);
  }

  // Init wishlist state on page load
  updateWishlistButtons();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCardInteractions);
} else {
  initCardInteractions();
}
