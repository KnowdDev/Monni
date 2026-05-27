/**
 * Monni Collection Page JavaScript
 * Handles filtering and sorting
 */

class CollectionPage {
  constructor() {
    this.collectionPage = document.querySelector('collection-page');
    if (!this.collectionPage) return;

    this.initFilters();
    this.initSort();
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

    const openFilter = () => {
      filters.classList.add('is-open');
      if (filtersBackdrop) filtersBackdrop.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    };

    const closeFilter = () => {
      filters.classList.remove('is-open');
      if (filtersBackdrop) filtersBackdrop.classList.remove('is-open');
      document.body.style.overflow = '';
    };

    // Toggle filter drawer
    filterToggle.addEventListener('click', () => {
      filters.classList.contains('is-open') ? closeFilter() : openFilter();
    });

    // Close filter drawer via close button
    if (filtersClose) {
      filtersClose.addEventListener('click', closeFilter);
    }

    // Close filter drawer via backdrop click
    if (filtersBackdrop) {
      filtersBackdrop.addEventListener('click', closeFilter);
    }

    // Restore scroll if navigating away with filter open
    window.addEventListener('beforeunload', () => { document.body.style.overflow = ''; });

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

}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new CollectionPage();
  });
} else {
  new CollectionPage();
}
