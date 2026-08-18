/**
 * Monni Product Page JavaScript
 * Handles variant switching, gallery interactions, and add-to-cart functionality
 */

class ProductPage {
  constructor() {
    this.productPage = document.querySelector('product-page');
    if (!this.productPage) return;

    this.productId = this.productPage.dataset.productId;
    this.sectionId = this.productPage.dataset.sectionId;
    this.productUrl = this.productPage.dataset.url;
    this.moneyFormat = this.productPage.dataset.moneyFormat || window.Shopify?.money_format || '${{amount}}';
    this.variants = this.parseVariants();

    this.initGallery();
    this.initVariantSelector();
    this.initQuantitySelector();
  }

  parseVariants() {
    const script = this.productPage.querySelector('script[data-product-variants]');
    const raw = script?.textContent || this.productPage.dataset.productVariants || '[]';
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  // Gallery functionality
  initGallery() {
    const gallery = this.productPage.querySelector('media-gallery');
    if (!gallery) return;

    const thumbs = gallery.querySelectorAll('.media-gallery__thumb');
    const dots = gallery.querySelectorAll('.media-gallery__dot');
    const slides = gallery.querySelectorAll('.media-gallery__slide');
    const mainGallery = gallery.querySelector('.media-gallery__main');

    // Thumbnail click
    thumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        const index = thumb.dataset.index;
        this.setActiveSlide(index, slides, thumbs, dots);
      });
    });

    // Dot click
    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        const index = dot.dataset.index;
        this.setActiveSlide(index, slides, thumbs, dots);
      });
    });

    // Main gallery click for zoom
    if (mainGallery) {
      mainGallery.addEventListener('click', () => {
        const activeSlide = gallery.querySelector('.media-gallery__slide.is-active');
        if (activeSlide) {
          const activeImage = activeSlide.querySelector('img, video');
          if (activeImage) {
            this.openLightbox(activeImage.src || activeImage.currentSrc);
          }
        }
      });
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const activeIndex = Array.from(slides).findIndex(slide => slide.classList.contains('is-active'));
        if (activeIndex === -1) return;

        let newIndex;
        if (e.key === 'ArrowLeft') {
          newIndex = activeIndex > 0 ? activeIndex - 1 : slides.length - 1;
        } else {
          newIndex = activeIndex < slides.length - 1 ? activeIndex + 1 : 0;
        }

        this.setActiveSlide(newIndex, slides, thumbs, dots);
      }

      // Close lightbox with Escape
      if (e.key === 'Escape') {
        this.closeLightbox();
      }
    });
  }

  openLightbox(imageSrc) {
    // Create lightbox if it doesn't exist
    let lightbox = document.querySelector('.lightbox');
    if (!lightbox) {
      lightbox = document.createElement('div');
      lightbox.className = 'lightbox';
      lightbox.innerHTML = `
        <div class="lightbox__backdrop"></div>
        <div class="lightbox__content">
          <button class="lightbox__close" aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <img class="lightbox__image" src="" alt="">
        </div>
      `;
      document.body.appendChild(lightbox);

      // Close on backdrop click
      lightbox.querySelector('.lightbox__backdrop').addEventListener('click', () => this.closeLightbox());
      // Close on close button click
      lightbox.querySelector('.lightbox__close').addEventListener('click', () => this.closeLightbox());
    }

    // Set image source and show lightbox
    const lightboxImage = lightbox.querySelector('.lightbox__image');
    lightboxImage.src = imageSrc;
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  closeLightbox() {
    const lightbox = document.querySelector('.lightbox');
    if (lightbox) {
      lightbox.classList.remove('is-open');
      document.body.style.overflow = '';
    }
  }

  setActiveSlide(index, slides, thumbs, dots) {
    // Remove active classes
    slides.forEach(slide => slide.classList.remove('is-active'));
    thumbs.forEach(thumb => thumb.classList.remove('is-selected'));
    dots.forEach(dot => dot.classList.remove('is-active'));

    // Add active classes
    slides[index]?.classList.add('is-active');
    thumbs[index]?.classList.add('is-selected');
    dots[index]?.classList.add('is-active');
  }

  // Variant selector functionality
  initVariantSelector() {
    const variantSelector = this.productPage.querySelector('[data-variant-selector]');
    if (!variantSelector) return;

    const inputs = variantSelector.querySelectorAll('.product-page__variant-input');
    const swatches = variantSelector.querySelectorAll('.product-page__variant-swatch');

    inputs.forEach((input) => {
      input.addEventListener('change', () => {
        const fieldset = input.closest('fieldset');
        fieldset?.querySelectorAll('.product-page__variant-swatch').forEach((swatch) => {
          swatch.classList.toggle('is-selected', swatch.dataset.value === input.value);
        });

        this.applyVariant(this.getSelectedVariant());
      });
    });

    swatches.forEach((swatch) => {
      swatch.addEventListener('click', () => {
        const input = document.getElementById(swatch.htmlFor);
        if (input && !input.checked) {
          input.checked = true;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    });
  }

  getSelectedVariant() {
    const variantSelector = this.productPage.querySelector('[data-variant-selector]');
    if (variantSelector) {
      const selectedValues = Array.from(
        variantSelector.querySelectorAll('.product-page__variant-input:checked')
      ).map((input) => input.value);

      if (selectedValues.length) {
        const match = this.variants.find((variant) => {
          const options = variant.options || [];
          return selectedValues.every((value, index) => String(options[index]) === String(value));
        });
        if (match) return match;
        return null;
      }
    }

    const variantIdInput = this.productPage.querySelector('[data-variant-id]');
    if (variantIdInput?.value) {
      return this.variants.find((variant) => String(variant.id) === String(variantIdInput.value)) || null;
    }

    return this.variants[0] || null;
  }

  applyVariant(variant) {
    this.updateVariantId(variant);
    this.updatePrice(variant);
    this.updateAvailability(variant);
    this.updateVariantUrl(variant);
    this.updateGallery(variant);
    if (this.updateQuantityForVariant) {
      this.updateQuantityForVariant();
    }
  }

  updateVariantId(variant) {
    const variantIdInput = this.productPage.querySelector('[data-variant-id]');
    if (!variantIdInput) return;
    variantIdInput.value = variant ? variant.id : '';
  }

  updatePrice(variant) {
    const wrapper = this.productPage.querySelector('[data-price-wrapper]');
    if (!wrapper) return;

    wrapper.replaceChildren();
    if (!variant) return;

    const price = Number(variant.price) || 0;
    const compareAt = Number(variant.compare_at_price) || 0;
    const onSale = compareAt > price;
    const priceText = variant.price_formatted || this.formatMoney(price);
    const compareText = variant.compare_at_price_formatted || this.formatMoney(compareAt);

    if (onSale) {
      wrapper.appendChild(
        this.createPriceSpan('product-page__price--compare', 'comparePrice', 'Regular price', compareText)
      );
      wrapper.appendChild(
        this.createPriceSpan('product-page__price--sale', 'salePrice', 'Sale price', priceText)
      );
    } else {
      wrapper.appendChild(
        this.createPriceSpan('product-page__price--regular', 'regularPrice', 'Regular price', priceText)
      );
    }

    if (!variant.available) {
      const soldOut = document.createElement('span');
      soldOut.className = 'product-page__price--sold-out';
      soldOut.textContent = 'Sold out';
      wrapper.appendChild(soldOut);
    }
  }

  createPriceSpan(className, datasetKey, hiddenLabel, text) {
    const span = document.createElement('span');
    span.className = className;
    span.dataset[datasetKey] = '';

    const hidden = document.createElement('span');
    hidden.className = 'visually-hidden';
    hidden.textContent = hiddenLabel;
    span.appendChild(hidden);
    span.appendChild(document.createTextNode(` ${text}`));
    return span;
  }

  updateAvailability(variant) {
    const button = this.productPage.querySelector('[data-add-to-cart]');
    const available = Boolean(variant?.available);
    const addLabel = button?.dataset.addLabel || 'Add to cart';
    const soldOutLabel = button?.dataset.soldOutLabel || 'Sold out';

    if (button) {
      const textEl = button.querySelector('[data-add-to-cart-text]');
      button.disabled = !available;
      button.dataset.available = available ? 'true' : 'false';
      if (textEl) textEl.textContent = available ? addLabel : soldOutLabel;
    }

    const backInStock = this.productPage.querySelector('[data-back-in-stock]');
    if (backInStock) backInStock.hidden = available;

    const bodyInput = this.productPage.querySelector('[data-back-in-stock-body]');
    if (bodyInput && variant) {
      const title = bodyInput.dataset.backInStockTitle || '';
      const variantTitle = (variant.options || []).filter(Boolean).join(' / ') || 'Default';
      bodyInput.value = `Back in stock request for: ${title} - Variant: ${variantTitle}`;
    }
  }

  updateGallery(variant) {
    if (!variant?.featured_media_id) return;
    const gallery = this.productPage.querySelector('media-gallery');
    if (!gallery) return;

    const slides = gallery.querySelectorAll('.media-gallery__slide');
    const index = Array.from(slides).findIndex(
      (slide) => String(slide.dataset.mediaId) === String(variant.featured_media_id)
    );
    if (index < 0) return;

    this.setActiveSlide(
      index,
      slides,
      gallery.querySelectorAll('.media-gallery__thumb'),
      gallery.querySelectorAll('.media-gallery__dot')
    );
  }

  updateVariantUrl(variant) {
    if (this.productPage.dataset.updateUrl !== 'true' || !variant || !this.productUrl) return;

    const url = new URL(this.productUrl, window.location.origin);
    url.searchParams.set('variant', String(variant.id));
    window.history.replaceState({}, '', `${url.pathname}${url.search}`);
  }

  formatMoney(cents) {
    if (cents == null || cents === '') return '';
    const value = Number(cents);
    if (Number.isNaN(value)) return '';

    if (typeof Shopify !== 'undefined' && typeof Shopify.formatMoney === 'function') {
      return Shopify.formatMoney(value, this.moneyFormat);
    }

    const abs = Math.abs(value) / 100;
    const formatted = abs.toFixed(2);
    const [whole, fraction] = formatted.split('.');
    const withSeparators = Number(whole).toLocaleString('en-NZ');
    const replacements = {
      amount: `${withSeparators}.${fraction}`,
      amount_no_decimals: withSeparators,
      amount_with_comma_separator: `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${fraction}`,
      amount_no_decimals_with_comma_separator: whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.'),
      amount_with_apostrophe_separator: `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, "'")}.${fraction}`,
    };
    const placeholder = (this.moneyFormat || '${{amount}}').replace(
      /\{\{\s*(\w+)\s*\}\}/,
      (_, key) => replacements[key] || formatted
    );
    return value < 0 ? `-${placeholder}` : placeholder;
  }

  // Quantity selector — select (1–max) with +/- buttons
  initQuantitySelector() {
    const wrapper = this.productPage.querySelector('[data-quantity-selector]');
    if (!wrapper) return;

    const select = wrapper.querySelector('[data-quantity-input]');
    const decreaseBtn = wrapper.querySelector('[data-quantity-decrease]');
    const increaseBtn = wrapper.querySelector('[data-quantity-increase]');
    const errorEl = wrapper.querySelector('[data-quantity-error]');
    if (!select || !decreaseBtn || !increaseBtn) return;

    const storeMax = parseInt(wrapper.dataset.quantityMax, 10) || 20;
    let errorTimeout;

    const getMaxForVariant = () => {
      let max = storeMax;
      const variant = this.getSelectedVariant();
      if (
        variant &&
        variant.inventory_management === 'shopify' &&
        variant.inventory_policy !== 'continue' &&
        variant.inventory_quantity > 0
      ) {
        max = Math.min(max, variant.inventory_quantity);
      }
      return Math.max(1, max);
    };

    const getSelectMax = () => {
      const lastOption = select.options[select.options.length - 1];
      return lastOption ? parseInt(lastOption.value, 10) : 1;
    };

    const updateButtons = () => {
      const value = parseInt(select.value, 10) || 1;
      const max = getSelectMax();
      decreaseBtn.disabled = value <= 1;
      increaseBtn.disabled = value >= max;
    };

    const showError = (message) => {
      if (!errorEl) return;
      errorEl.textContent = message;
      errorEl.hidden = false;
      clearTimeout(errorTimeout);
      errorTimeout = setTimeout(() => {
        errorEl.hidden = true;
      }, 2500);
    };

    const rebuildOptions = (max, preferredValue) => {
      const previousValue = parseInt(select.value, 10) || 1;
      const value = Math.min(Math.max(1, preferredValue ?? previousValue), max);

      select.innerHTML = '';
      for (let i = 1; i <= max; i += 1) {
        const option = document.createElement('option');
        option.value = String(i);
        option.textContent = String(i);
        if (i === value) option.selected = true;
        select.appendChild(option);
      }

      updateButtons();
    };

    this.updateQuantityForVariant = () => {
      rebuildOptions(getMaxForVariant(), parseInt(select.value, 10) || 1);
    };

    decreaseBtn.addEventListener('click', () => {
      const value = parseInt(select.value, 10) || 1;
      if (value <= 1) {
        showError('Minimum quantity is 1');
        return;
      }
      select.value = String(value - 1);
      select.dispatchEvent(new Event('change', { bubbles: true }));
      updateButtons();
    });

    increaseBtn.addEventListener('click', () => {
      const value = parseInt(select.value, 10) || 1;
      const max = getSelectMax();
      if (value >= max) {
        showError(`Maximum quantity is ${max}`);
        return;
      }
      select.value = String(value + 1);
      select.dispatchEvent(new Event('change', { bubbles: true }));
      updateButtons();
    });

    select.addEventListener('change', () => {
      const value = parseInt(select.value, 10);
      const max = getSelectMax();
      if (isNaN(value) || value < 1) {
        select.value = '1';
      } else if (value > max) {
        select.value = String(max);
        showError(`Maximum quantity is ${max}`);
      }
      updateButtons();
    });

    this.updateQuantityForVariant();
  }

}

// Product form handling for add to cart
class ProductForm {
  constructor() {
    this.form = document.querySelector('form[data-product-form]');
    if (!this.form) return;

    this.addToCartButton = this.form.querySelector('[data-add-to-cart]');
    
    this.init();
  }

  init() {
    this.form.addEventListener('submit', this.handleSubmit.bind(this));
  }

  async handleSubmit(e) {
    e.preventDefault();

    if (!this.addToCartButton || this.addToCartButton.disabled) return;

    const formData = new FormData(this.form);
    const submitButton = this.addToCartButton;
    const textEl = submitButton.querySelector('[data-add-to-cart-text]');
    const originalText = (textEl?.textContent || submitButton.textContent || 'Add to cart').trim();
    const setButtonText = (text) => {
      if (textEl) textEl.textContent = text;
      else submitButton.textContent = text;
    };

    submitButton.disabled = true;
    setButtonText('Adding...');

    try {
      const cartAddUrl = (() => {
        const root = window.Shopify?.routes?.root || '/';
        if (root.startsWith('http') && !root.startsWith(window.location.origin)) {
          return '/cart/add.js';
        }
        return root + 'cart/add.js';
      })();
      const response = await fetch(cartAddUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      const data = await response.json();

      if (response.ok) {
        setButtonText('Added!');

        document.dispatchEvent(new CustomEvent('cart:added', {
          detail: { data }
        }));

        setTimeout(() => {
          const available = submitButton.dataset.available !== 'false';
          submitButton.disabled = !available;
          setButtonText(
            available
              ? (submitButton.dataset.addLabel || originalText)
              : (submitButton.dataset.soldOutLabel || 'Sold out')
          );
        }, 2000);
      } else {
        throw new Error(data.description || 'Could not add to cart');
      }
    } catch (error) {
      submitButton.disabled = false;
      setButtonText(originalText);
      submitButton.setAttribute('aria-invalid', 'true');
      submitButton.dataset.cartError = error?.message || 'Could not add to cart. Please try again.';
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ProductPage();
    new ProductForm();
    initRecentlyViewed();
  });
} else {
  new ProductPage();
  new ProductForm();
  initRecentlyViewed();
}

function initRecentlyViewed() {
  if (!window.MonniRecentlyViewed) return;

  const productPage = document.querySelector('product-page');
  if (!productPage) return;

  window.MonniRecentlyViewed.recordProductPageView();
  window.MonniRecentlyViewed.renderRecentlyViewed({
    container: document.querySelector('[data-recently-viewed]'),
    grid: document.querySelector('[data-recently-viewed-grid]'),
    excludeId: productPage.dataset.productId,
    limit: 4,
  });
}
