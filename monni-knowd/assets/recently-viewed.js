const RECENTLY_VIEWED_KEY = 'monni:recentlyViewed';
const RECENTLY_VIEWED_LIMIT = 6;

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function loadRecentlyViewed() {
  try {
    return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveRecentlyViewed(items) {
  try {
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(items.slice(0, RECENTLY_VIEWED_LIMIT)));
  } catch {
    // Quota exceeded or private mode
  }
}

function buildRecentlyViewedCard(item) {
  const imgHtml = item.image
    ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy" class="card-product__image">`
    : `<div class="card-product__placeholder texture-grain"><span>${escapeHtml(item.title)}</span></div>`;

  return `
    <article class="card-product recently-viewed__card">
      <div class="card-product__media" style="--card-aspect-ratio: 3/4;">
        <a href="${escapeHtml(item.url)}" class="card-product__image-link" aria-label="${escapeHtml(item.title)}">
          ${imgHtml}
        </a>
      </div>
      <a href="${escapeHtml(item.url)}" class="card-product__info-link">
        <div class="card-product__info">
          <h3 class="card-product__title">${escapeHtml(item.title)}</h3>
          <div class="card-product__price">${item.priceHtml || ''}</div>
        </div>
      </a>
    </article>
  `;
}

function renderRecentlyViewed({ container, grid, excludeId = null, excludeHandle = null, limit = 4 }) {
  if (!container || !grid) return;

  const recent = loadRecentlyViewed().filter((item) => {
    if (excludeId && item.id === excludeId) return false;
    if (excludeHandle && item.handle === excludeHandle) return false;
    return true;
  });

  const toRender = recent.slice(0, limit);
  if (toRender.length === 0) {
    container.setAttribute('hidden', '');
    grid.innerHTML = '';
    return;
  }

  container.removeAttribute('hidden');
  grid.innerHTML = toRender.map(buildRecentlyViewedCard).join('');
}

function recordProductPageView() {
  const productPage = document.querySelector('product-page');
  if (!productPage) return;

  const productId = productPage.dataset.productId;
  const productHandle = window.location.pathname.split('/').filter(Boolean).pop() || '';
  const productTitle = document.querySelector('.product-page__title')?.textContent?.trim() || '';

  const activeImage = productPage.querySelector('.media-gallery__slide.is-active .media-gallery__image');
  const firstImage = productPage.querySelector('.media-gallery__image');
  const productImage = activeImage?.src || firstImage?.src || '';

  const salePriceEl = document.querySelector('[data-sale-price]');
  const regularPriceEl = document.querySelector('[data-regular-price]');
  const comparePriceEl = document.querySelector('[data-compare-price]');
  let priceHtml = '';
  if (salePriceEl) {
    priceHtml = `<span class="card-product__price--sale">${escapeHtml(salePriceEl.textContent.trim())}</span>`;
    if (comparePriceEl) {
      priceHtml += `<span class="card-product__price--compare">${escapeHtml(comparePriceEl.textContent.trim())}</span>`;
    }
  } else if (regularPriceEl) {
    priceHtml = `<span class="card-product__price--regular">${escapeHtml(regularPriceEl.textContent.trim())}</span>`;
  }

  let recent = loadRecentlyViewed().filter((item) => item.id !== productId);
  recent.unshift({
    id: productId,
    handle: productHandle,
    title: productTitle,
    image: productImage,
    priceHtml,
    url: productPage.dataset.url,
  });
  saveRecentlyViewed(recent);
}

window.MonniRecentlyViewed = {
  escapeHtml,
  loadRecentlyViewed,
  saveRecentlyViewed,
  renderRecentlyViewed,
  recordProductPageView,
  buildRecentlyViewedCard,
};
