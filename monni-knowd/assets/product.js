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

    this.initGallery();
    this.initVariantSelector();
    this.initQuantitySelector();
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
    const variantIdInput = this.productPage.querySelector('[data-variant-id]');

    inputs.forEach(input => {
      input.addEventListener('change', () => {
        // Update swatch visuals
        const optionName = input.name;
        const selectedValue = input.value;

        swatches.forEach(swatch => {
          if (swatch.dataset.value === selectedValue) {
            swatch.classList.add('is-selected');
          } else {
            swatch.classList.remove('is-selected');
          }
        });

        // Update variant ID based on selected options
        this.updateVariantId();
        this.updateVariantUrl();
      });
    });

    // Swatch click
    swatches.forEach(swatch => {
      swatch.addEventListener('click', () => {
        const input = document.getElementById(swatch.htmlFor);
        if (input) {
          input.checked = true;
          input.dispatchEvent(new Event('change'));
        }
      });
    });
  }

  getSelectedVariant() {
    const variants = JSON.parse(this.productPage.dataset.productVariants || '[]');
    const variantIdInput = this.productPage.querySelector('[data-variant-id]');
    if (variantIdInput?.value) {
      const byId = variants.find((variant) => String(variant.id) === String(variantIdInput.value));
      if (byId) return byId;
    }

    const variantSelector = this.productPage.querySelector('[data-variant-selector]');
    if (!variantSelector) return variants[0] || null;

    const selectedOptions = {};
    const inputs = variantSelector.querySelectorAll('.product-page__variant-input:checked');
    inputs.forEach((input) => {
      selectedOptions[input.name] = input.value;
    });

    return (
      variants.find((variant) =>
        Object.keys(selectedOptions).every((option) => variant.options.includes(selectedOptions[option]))
      ) || null
    );
  }

  updateVariantId() {
    const matchingVariant = this.getSelectedVariant();

    const variantIdInput = this.productPage.querySelector('[data-variant-id]');
    if (variantIdInput && matchingVariant) {
      variantIdInput.value = matchingVariant.id;
    }

    if (this.updateQuantityForVariant) {
      this.updateQuantityForVariant();
    }
  }

  updateVariantUrl() {
    const formData = new FormData(this.productPage.querySelector('form[data-product-form]'));
    const params = new URLSearchParams(formData).toString();
    const url = `${this.productUrl}?${params}`;

    window.history.replaceState({}, '', url);
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

    const variantSelector = this.productPage.querySelector('[data-variant-selector]');
    if (variantSelector) {
      variantSelector.addEventListener('change', () => this.updateQuantityForVariant());
    }

    this.updateQuantityForVariant();
  }

}

// Product form handling for add to cart
class ProductForm {
  constructor() {
    this.form = document.querySelector('form[data-product-form]');
    if (!this.form) return;

    this.addToCartButton = this.form.querySelector('[data-add-to-cart]');
    this.variantSelector = this.form.querySelector('[data-variant-selector]');
    
    this.init();
  }

  init() {
    this.form.addEventListener('submit', this.handleSubmit.bind(this));
    this.updateAddToCartState();
  }

  async handleSubmit(e) {
    e.preventDefault();

    if (!this.addToCartButton || this.addToCartButton.disabled) return;

    const formData = new FormData(this.form);
    const submitButton = this.addToCartButton;
    const originalText = submitButton.textContent;

    // Show loading state
    submitButton.disabled = true;
    submitButton.textContent = 'Adding...';

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
        // Success - update button text temporarily
        submitButton.textContent = 'Added!';
        
        // Emit event for cart drawer to listen to
        document.dispatchEvent(new CustomEvent('cart:added', {
          detail: { data }
        }));

        // Reset button after delay
        setTimeout(() => {
          submitButton.disabled = false;
          submitButton.textContent = originalText;
        }, 2000);
      } else {
        throw new Error(data.description || 'Could not add to cart');
      }
    } catch (error) {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
      submitButton.setAttribute('aria-invalid', 'true');
      submitButton.dataset.cartError = error?.message || 'Could not add to cart. Please try again.';
    }
  }

  updateAddToCartState() {
    if (!this.variantSelector) return;

    const inputs = this.variantSelector.querySelectorAll('input[type="radio"]');
    inputs.forEach(input => {
      input.addEventListener('change', () => {
        // Check if selected variant is available
        // This would typically involve checking the variant data
        // For now, we'll keep the button enabled
        if (this.addToCartButton) {
          this.addToCartButton.disabled = false;
        }
      });
    });
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
