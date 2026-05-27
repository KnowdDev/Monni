(() => {
  const rootSelector = '[data-header-root]';

  const getRoot = (element) => element?.closest(rootSelector) || null;

  const collapsePanel = (button) => {
    if (!(button instanceof HTMLElement)) return;

    const panelId = button.getAttribute('aria-controls');
    const panel = panelId ? document.getElementById(panelId) : null;

    button.setAttribute('aria-expanded', 'false');

    if (!(panel instanceof HTMLElement)) return;

    panel.hidden = true;
    panel.querySelectorAll('[data-header-mobile-toggle]').forEach((nestedButton) => {
      if (nestedButton instanceof HTMLElement) {
        nestedButton.setAttribute('aria-expanded', 'false');
      }
    });
    panel.querySelectorAll('[data-header-mobile-panel]').forEach((nestedPanel) => {
      if (nestedPanel instanceof HTMLElement) {
        nestedPanel.hidden = true;
      }
    });
  };

  const expandPanel = (button) => {
    if (!(button instanceof HTMLElement)) return;

    const panelId = button.getAttribute('aria-controls');
    const panel = panelId ? document.getElementById(panelId) : null;

    button.setAttribute('aria-expanded', 'true');

    if (panel instanceof HTMLElement) {
      panel.hidden = false;
    }
  };

  const closeSiblingPanels = (button) => {
    const list = button.closest('[data-header-mobile-list]');
    if (!(list instanceof HTMLElement)) return;

    list.querySelectorAll('[data-header-mobile-toggle]').forEach((candidate) => {
      if (!(candidate instanceof HTMLElement) || candidate === button) return;
      if (candidate.closest('[data-header-mobile-list]') !== list) return;
      collapsePanel(candidate);
    });
  };

  const resetMobilePanels = (root) => {
    root.querySelectorAll('[data-header-mobile-toggle]').forEach((button) => {
      collapsePanel(button);
    });
  };

  const syncGlobalState = () => {
    const hasOpenMenu = Array.from(document.querySelectorAll('[data-header-menu-state]')).some(
      (input) => input instanceof HTMLInputElement && input.checked
    );

    document.documentElement.classList.toggle('header-menu-open', hasOpenMenu);
  };

  const setDrawerState = (root, isOpen) => {
    if (!(root instanceof HTMLElement)) return;

    const menuState = root.querySelector('[data-header-menu-state]');
    const closeButton = root.querySelector('[data-header-menu-close]');

    if (menuState instanceof HTMLInputElement) {
      menuState.checked = isOpen;
    }

    root.classList.toggle('header--menu-open', isOpen);

    if (isOpen) {
      window.requestAnimationFrame(() => {
        if (closeButton instanceof HTMLElement) {
          closeButton.focus();
        }
      });
    } else {
      resetMobilePanels(root);
    }

    syncGlobalState();
  };

  const closeAllDrawers = () => {
    document.querySelectorAll(rootSelector).forEach((root) => {
      if (root instanceof HTMLElement) {
        setDrawerState(root, false);
      }
    });
  };

  document.addEventListener('change', (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.matches('[data-header-menu-state]')) return;

    const root = getRoot(input);
    if (!(root instanceof HTMLElement)) return;

    root.classList.toggle('header--menu-open', input.checked);

    if (!input.checked) {
      resetMobilePanels(root);
    }

    syncGlobalState();
  });

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;

    const mobileToggle = event.target.closest('[data-header-mobile-toggle]');
    if (mobileToggle instanceof HTMLElement) {
      event.preventDefault();
      closeSiblingPanels(mobileToggle);

      const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
      if (isExpanded) {
        collapsePanel(mobileToggle);
      } else {
        expandPanel(mobileToggle);
      }
      return;
    }

    const drawerLink = event.target.closest('[data-header-menu-drawer] a');
    if (drawerLink instanceof HTMLElement) {
      const root = getRoot(drawerLink);
      if (root instanceof HTMLElement) {
        setDrawerState(root, false);
      }
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeAllDrawers();
      return;
    }

    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (!(event.target instanceof Element)) return;

    const labelButton = event.target.closest('[data-header-menu-toggle], [data-header-menu-close]');
    if (!(labelButton instanceof HTMLElement)) return;

    event.preventDefault();
    labelButton.click();
  });

  let resizeFrame = null;
  window.addEventListener('resize', () => {
    if (resizeFrame) window.cancelAnimationFrame(resizeFrame);

    resizeFrame = window.requestAnimationFrame(() => {
      document.querySelectorAll(rootSelector).forEach((root) => {
        if (!(root instanceof HTMLElement)) return;

        const breakpoint = Number(root.dataset.headerBreakpoint || '1160');
        if (window.innerWidth > breakpoint) {
          setDrawerState(root, false);
        }
      });
    });
  });

  document.addEventListener('shopify:section:load', () => {
    closeAllDrawers();
  });

  function syncWishlistCount() {
    try {
      const raw = JSON.parse(localStorage.getItem('monni:wishlist') || '[]');
      const count = raw.filter((item) =>
        typeof item === 'object' ? item.handle || item.id : item
      ).length;
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
    } catch {
      /* ignore */
    }
  }

  document.addEventListener('wishlist:updated', syncWishlistCount);

  syncWishlistCount();
  syncGlobalState();
})();
