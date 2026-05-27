/**
 * Monni wishlist — localStorage, toggle on product cards, wishlist page render
 */
(function () {
  const WISHLIST_KEY = 'monni:wishlist';

  function stripMoney(value) {
    if (!value) return '';
    const str = String(value);
    if (!/[<>]/.test(str)) return str.trim();
    const div = document.createElement('div');
    div.innerHTML = str;
    return div.textContent.replace(/\s+/g, ' ').trim();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getWishlist() {
    try {
      const raw = JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
      return raw.map((item) => {
        if (typeof item === 'string') return { id: item };
        return {
          ...item,
          price: stripMoney(item.price),
          comparePrice: stripMoney(item.comparePrice),
        };
      });
    } catch {
      return [];
    }
  }

  function saveWishlist(list) {
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
    } catch {
      return false;
    }
    return true;
  }

  function itemFromButton(btn) {
    return {
      id: String(btn.dataset.wishlistToggle || ''),
      handle: btn.dataset.wishlistHandle || '',
      title: btn.dataset.wishlistTitle || '',
      image: btn.dataset.wishlistImage || '',
      price: stripMoney(btn.dataset.wishlistPrice),
      comparePrice: stripMoney(btn.dataset.wishlistComparePrice || ''),
      url: btn.dataset.wishlistUrl || '',
    };
  }

  function updateWishlistButtons() {
    const list = getWishlist();
    const ids = new Set(list.map((item) => String(item.id)));

    document.querySelectorAll('[data-wishlist-toggle]').forEach((btn) => {
      const id = String(btn.dataset.wishlistToggle);
      const active = ids.has(id);
      btn.classList.toggle('is-active', active);
      const label = active ? 'Remove from wishlist' : 'Add to wishlist';
      btn.setAttribute('aria-label', label);
      const textEl = btn.querySelector('[data-wishlist-text]');
      if (textEl) textEl.textContent = label;
    });

    const count = list.filter((item) => item.handle || item.id).length;
    document.querySelectorAll('[data-wishlist-count], [data-wishlist-count-mobile]').forEach((el) => {
      el.textContent = count;
      if (count > 0) {
        el.removeAttribute('hidden');
        el.hidden = false;
      } else {
        el.setAttribute('hidden', '');
        el.hidden = true;
      }
    });
  }

  function toggleWishlist(btn) {
    const item = itemFromButton(btn);
    if (!item.id) return;

    let list = getWishlist().filter((entry) => entry.handle || entry.id);
    const index = list.findIndex((entry) => String(entry.id) === item.id);

    if (index > -1) {
      list.splice(index, 1);
      btn.classList.remove('is-active');
    } else {
      if (!item.handle) return;
      list.push(item);
      btn.classList.add('is-active');
    }

    if (!saveWishlist(list)) return;

    updateWishlistButtons();
    renderWishlistPage();
    document.dispatchEvent(new CustomEvent('wishlist:updated', { detail: { count: list.length } }));
  }

  function formatPriceHtml(price, comparePrice) {
    const p = escapeHtml(stripMoney(price));
    const c = stripMoney(comparePrice);
    if (c) {
      return `<span class="card-product__price--sale">${p}</span><span class="card-product__price--compare">${escapeHtml(c)}</span>`;
    }
    return `<span class="card-product__price--regular">${p}</span>`;
  }

  function renderWishlistPage() {
    const emptyEl = document.querySelector('[data-wishlist-empty]');
    const gridEl = document.querySelector('[data-wishlist-grid]');
    if (!emptyEl || !gridEl) return;

    const list = getWishlist().filter((item) => item.handle);

    if (list.length === 0) {
      emptyEl.hidden = false;
      gridEl.hidden = true;
      gridEl.innerHTML = '';
      return;
    }

    emptyEl.hidden = true;
    gridEl.hidden = false;

    gridEl.innerHTML = list
      .map((item) => {
        const priceHtml = formatPriceHtml(item.price, item.comparePrice);

        const imgHtml = item.image
          ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy" width="600" height="800" class="card-product__image card-product__image--primary">`
          : `<div class="card-product__placeholder texture-grain"><span>${escapeHtml(item.title)}</span></div>`;

        return `
        <article class="card-product" data-product-id="${escapeHtml(item.id)}">
          <div class="card-product__media" style="--card-aspect-ratio: 3/4;">
            <a href="${escapeHtml(item.url)}" class="card-product__image-link" aria-label="${escapeHtml(item.title)}">
              ${imgHtml}
            </a>
            <button
              type="button"
              class="card-product__wishlist is-active"
              data-wishlist-toggle="${escapeHtml(item.id)}"
              data-wishlist-handle="${escapeHtml(item.handle)}"
              data-wishlist-title="${escapeHtml(item.title)}"
              data-wishlist-image="${escapeHtml(item.image)}"
              data-wishlist-price="${escapeHtml(item.price)}"
              data-wishlist-compare-price="${escapeHtml(item.comparePrice || '')}"
              data-wishlist-url="${escapeHtml(item.url)}"
              aria-label="Remove from wishlist"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
          </div>
          <a href="${escapeHtml(item.url)}" class="card-product__info-link">
            <div class="card-product__info">
              <h3 class="card-product__title">${escapeHtml(item.title)}</h3>
              <div class="card-product__price">${priceHtml}</div>
            </div>
          </a>
        </article>
      `;
      })
      .join('');
  }

  function migrateWishlistPrices() {
    const list = getWishlist();
    let changed = false;
    const migrated = list.map((item) => {
      const price = stripMoney(item.price);
      const comparePrice = stripMoney(item.comparePrice);
      if (price !== item.price || comparePrice !== item.comparePrice) changed = true;
      return { ...item, price, comparePrice };
    });
    if (changed) saveWishlist(migrated);
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-wishlist-toggle]');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(btn);
  });

  migrateWishlistPrices();
  updateWishlistButtons();
  renderWishlistPage();

  document.addEventListener('shopify:section:load', () => {
    updateWishlistButtons();
    renderWishlistPage();
  });
})();
