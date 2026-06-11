function initSizeGuidePage() {
  const root = document.querySelector('.size-guide');
  if (!root) return;

  initSizeGuideBackLink(root);
  initSizeGuideRecentlyViewed(root);
}

function initSizeGuideBackLink(root) {
  const banner = root.querySelector('[data-size-guide-back]');
  if (!banner) return;

  const params = new URLSearchParams(window.location.search);
  const fromHandle = params.get('from');
  if (!fromHandle) return;

  const recent = window.MonniRecentlyViewed?.loadRecentlyViewed?.() || [];
  const cached = recent.find((item) => item.handle === fromHandle);

  if (cached?.url && cached?.title) {
    showBackLink(banner, cached.url, cached.title, cached.image);
    return;
  }

  fetch(`/products/${encodeURIComponent(fromHandle)}.js`)
    .then((response) => (response.ok ? response.json() : null))
    .then((product) => {
      if (!product) return;
      const image = product.featured_image || product.images?.[0] || '';
      showBackLink(banner, product.url, product.title, image);
    })
    .catch(() => {});
}

function showBackLink(banner, url, title, image) {
  const link = banner.querySelector('[data-size-guide-back-link]');
  const label = banner.querySelector('[data-size-guide-back-label]');
  const media = banner.querySelector('[data-size-guide-back-image]');

  if (link) link.href = url;
  if (label) label.textContent = title;
  if (media && image) {
    media.innerHTML = `<img src="${image}" alt="" loading="lazy" width="48" height="60">`;
  }

  banner.hidden = false;
}

function initSizeGuideRecentlyViewed(root) {
  const container = root.querySelector('[data-recently-viewed]');
  const grid = root.querySelector('[data-recently-viewed-grid]');
  if (!container || !grid || !window.MonniRecentlyViewed) return;

  const fromHandle = new URLSearchParams(window.location.search).get('from');
  window.MonniRecentlyViewed.renderRecentlyViewed({
    container,
    grid,
    excludeHandle: null,
    limit: 4,
  });

  if (fromHandle && container.hidden) {
    fetch(`/products/${encodeURIComponent(fromHandle)}.js`)
      .then((response) => (response.ok ? response.json() : null))
      .then((product) => {
        if (!product) return;
        grid.innerHTML = window.MonniRecentlyViewed.buildRecentlyViewedCard({
          id: String(product.id),
          handle: product.handle,
          title: product.title,
          image: product.featured_image || product.images?.[0] || '',
          priceHtml: product.price
            ? `<span class="card-product__price--regular">${formatMoney(product.price)}</span>`
            : '',
          url: product.url,
        });
        container.removeAttribute('hidden');
        const heading = container.querySelector('[data-recently-viewed-heading]');
        if (heading) heading.textContent = 'Continue shopping';
      })
      .catch(() => {});
  }
}

function formatMoney(cents) {
  if (window.Shopify?.formatMoney) {
    return window.Shopify.formatMoney(cents);
  }
  return `$${(cents / 100).toFixed(2)}`;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSizeGuidePage);
} else {
  initSizeGuidePage();
}
