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
    this._scrollY = 0;
    this._onTouchMove = null;
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
    this.scrollExtras = this.querySelector('[data-cart-drawer-scroll-extras]');
    this.subtotalEl = this.querySelector('[data-cart-drawer-subtotal]');
    this.shippingBar = this.querySelector('[data-cart-drawer-shipping]');
    this.shippingProgress = this.querySelector('[data-cart-drawer-shipping-progress]');
    this.shippingLabel = this.querySelector('[data-cart-drawer-shipping-label]');
    this.noteInput = this.querySelector('[data-cart-note]');
    this.scrollBody = this.querySelector('[data-cart-drawer-body]');

    this.bindEvents();
    this.bindPubSub();
    this.refreshShippingThreshold();

    window.addEventListener('beforeunload', () => {
      if (this.isOpen) this.unlockScroll();
    });
  }

  /**
   * Page HTML can stay cached after theme setting updates.
   * Sync threshold from a fresh Section Rendering API response.
   */
  async refreshShippingThreshold() {
    try {
      const res = await fetch(CartDrawer.cartUrl('?sections=cart-drawer'));
      if (!res.ok) return;
      const data = await res.json();
      const html = data?.['cart-drawer'] || '';
      const match = html.match(/data-shipping-threshold="(\d+(?:\.\d+)?)"/);
      if (!match) return;
      this.dataset.shippingThreshold = match[1];

      const cartRes = await fetch(CartDrawer.cartUrl('cart.js'));
      const cart = cartRes.ok ? await cartRes.json() : null;
      this.updateShippingBar(cart?.total_price || 0);
    } catch {
      /* ignore — keep SSR threshold */
    }
  }

  disconnectedCallback() {
    if (this.isOpen) this.unlockScroll();
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
    this.lockScroll();

    requestAnimationFrame(() => {
      this.closeBtn?.focus();
    });

    this.fetchCart();
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.classList.remove('is-open');
    this.unlockScroll();

    if (this.lastFocusedElement) {
      this.lastFocusedElement.focus();
      this.lastFocusedElement = null;
    }
  }

  lockScroll() {
    this._scrollY = window.scrollY;
    document.documentElement.classList.add('cart-drawer-open');
    document.body.classList.add('cart-drawer-open');
    document.body.style.position = 'fixed';
    document.body.style.top = `-${this._scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';

    if (!this._onTouchMove) {
      this._onTouchMove = (e) => {
        if (!this.isOpen) return;
        if (this.scrollBody?.contains(e.target)) return;
        e.preventDefault();
      };
    }

    document.addEventListener('touchmove', this._onTouchMove, { passive: false });
  }

  unlockScroll() {
    if (!document.body.classList.contains('cart-drawer-open')) return;

    document.documentElement.classList.remove('cart-drawer-open');
    document.body.classList.remove('cart-drawer-open');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';

    if (this._onTouchMove) {
      document.removeEventListener('touchmove', this._onTouchMove);
    }

    window.scrollTo(0, this._scrollY || 0);
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
      if (!response.ok) return;
      const cart = await response.json();
      this.updateCart(cart);
      if (typeof publish === 'function') {
        publish('cart-update', { cart });
      }
    } catch {
      /* network error — avoid console noise in production */
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
    if (this.scrollExtras) this.scrollExtras.hidden = true;
  }

  showItems() {
    if (this.itemsContainer) this.itemsContainer.hidden = false;
    if (this.emptyState) this.emptyState.hidden = true;
    if (this.footer) this.footer.hidden = false;
    if (this.scrollExtras) this.scrollExtras.hidden = false;
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
      this.fetchCart();
      if (typeof publish === 'function') {
        publish('cart-error', { error: err });
      }
    }
  }

  async updateNote() {
    if (!this.noteInput) return;
    try {
      await fetch(CartDrawer.cartUrl('cart/update.js'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ note: this.noteInput.value }),
      });
    } catch {
      /* ignore note save failures */
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
