/**
 * Monni Collection Page JavaScript
 * Handles filtering, sorting, and quick add functionality
 */

class CollectionPage {
  constructor() {
    this.collectionPage = document.querySelector('collection-page');
    if (!this.collectionPage) return;

    this.initFilters();
    this.initSort();
    this.initQuickAdd();
  }

  // Filter functionality
  initFilters() {
    const filterToggle = this.collectionPage.querySelector('[data-filter-toggle]');
    const filters = this.collectionPage.querySelector('[data-filters]');
    const filtersClose = this.collectionPage.querySelector('[data-filters-close]');
    const filtersBackdrop = this.collectionPage.querySelector('[data-filters-backdrop]');
    const filtersForm = this.collectionPage.querySelector('.collection-page__filters-form');
    const filtersClear = this.collectionPage.querySelector('[data-filters-clear]');

    if (!filterToggle || !filters) return;

    // Toggle filter drawer
    filterToggle.addEventListener('click', () => {
      filters.classList.toggle('is-open');
      if (filtersBackdrop) {
        filtersBackdrop.classList.toggle('is-open');
      }
    });

    // Close filter drawer via close button
    if (filtersClose) {
      filtersClose.addEventListener('click', () => {
        filters.classList.remove('is-open');
        if (filtersBackdrop) {
          filtersBackdrop.classList.remove('is-open');
        }
      });
    }

    // Close filter drawer via backdrop click
    if (filtersBackdrop) {
      filtersBackdrop.addEventListener('click', () => {
        filters.classList.remove('is-open');
        filtersBackdrop.classList.remove('is-open');
      });
    }

    // Clear filters
    if (filtersClear) {
      filtersClear.addEventListener('click', () => {
        this.clearFilters();
      });
    }

    // Update filter count on checkbox change
    if (filtersForm) {
      const filterInputs = filtersForm.querySelectorAll('.collection-page__filter-input');
      filterInputs.forEach(input => {
        input.addEventListener('change', () => {
          this.updateFilterCount();
        });
      });
    }

    // Update filter count badge
    this.updateFilterCount();
  }

  clearFilters() {
    // Redirect to collection URL without any query parameters
    const currentUrl = new URL(window.location.href);
    currentUrl.search = ''; // Remove all query parameters
    window.location.href = currentUrl.toString();
  }

  updateFilterCount() {
    const filterInputs = this.collectionPage.querySelectorAll('.collection-page__filter-input:checked');
    const filterCountBadge = this.collectionPage.querySelector('[data-filter-count]');
    
    if (filterCountBadge) {
      const count = filterInputs.length;
      filterCountBadge.textContent = count > 0 ? count : '';
    }
  }

  // Sort functionality
  initSort() {
    const sortSelect = this.collectionPage.querySelector('[data-sort-select]');
    if (!sortSelect) return;

    sortSelect.addEventListener('change', () => {
      const sortValue = sortSelect.value;
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('sort_by', sortValue);
      window.location.href = currentUrl.toString();
    });
  }

  // Quick add functionality
  initQuickAdd() {
    const quickAddButtons = this.collectionPage.querySelectorAll('[data-quick-add]');
    
    quickAddButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
        e.preventDefault();
        const productId = button.dataset.quickAdd;
        await this.quickAddToCart(productId, button);
      });
    });
  }

  async quickAddToCart(productId, button) {
    const originalContent = button.innerHTML;
    
    // Show loading state
    button.disabled = true;
    button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="animate-spin"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="32"/></svg>';

    try {
      // Fetch product data to get first available variant
      const productResponse = await fetch(`/products/${productId}?view=ajax`);
      const productData = await productResponse.json();
      
      if (!productData || !productData.variants || productData.variants.length === 0) {
        throw new Error('No variants found');
      }

      // Find first available variant
      const availableVariant = productData.variants.find(v => v.available) || productData.variants[0];
      
      if (!availableVariant) {
        throw new Error('No available variants');
      }

      // Add to cart
      const formData = new FormData();
      formData.append('id', availableVariant.id);
      formData.append('quantity', 1);

      const response = await fetch(window.Shopify.routes.root + 'cart/add.js', {
        method: 'POST',
        body: formData,
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      const data = await response.json();

      if (response.ok) {
        // Success
        button.innerHTML = '✓';
        button.classList.add('is-success');
        
        // Emit event for cart drawer to listen to
        document.dispatchEvent(new CustomEvent('cart:added', {
          detail: { data }
        }));

        // Reset button after delay
        setTimeout(() => {
          button.disabled = false;
          button.innerHTML = originalContent;
          button.classList.remove('is-success');
        }, 2000);
      } else {
        throw new Error(data.description || 'Could not add to cart');
      }
    } catch (error) {
      console.error('Quick add error:', error);
      button.disabled = false;
      button.innerHTML = originalContent;
      alert(error.message || 'Could not add to cart. Please try again.');
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new CollectionPage();
  });
} else {
  new CollectionPage();
}
