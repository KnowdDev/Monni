(() => {
  const rootSelector = '[data-header-root]';

  const getRoot = (element) => element?.closest(rootSelector) || null;

  const collapsePanel = (button) => {
    if (!(button instanceof HTMLElement)) return;

    const panelId = button.getAttribute('aria-controls');
    const panel = panelId ? document.getElementById(panelId) : null;

    button.setAttribute('aria-expanded', 'false');
    syncToggleSymbol(button, false);

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

  const syncToggleSymbol = (button, isExpanded) => {
    if (!(button instanceof HTMLElement)) return;
    const symbol = button.querySelector('span[aria-hidden="true"]');
    if (symbol) symbol.textContent = isExpanded ? '−' : '+';
  };

  const expandPanel = (button) => {
    if (!(button instanceof HTMLElement)) return;

    const panelId = button.getAttribute('aria-controls');
    const panel = panelId ? document.getElementById(panelId) : null;

    button.setAttribute('aria-expanded', 'true');
    syncToggleSymbol(button, true);

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
    const hasOpenMenu = Array.from(document.querySelectorAll('[data-header-root]')).some(
      (root) => root instanceof HTMLElement && root.classList.contains('header--menu-open')
    );

    document.documentElement.classList.toggle('header-menu-open', hasOpenMenu);
  };

  const setDrawerState = (root, isOpen) => {
    if (!(root instanceof HTMLElement)) return;

    const menuToggle = root.querySelector('[data-header-menu-toggle]');
    const closeButton = root.querySelector('[data-header-menu-close]');
    const drawer = root.querySelector('[data-header-menu-drawer]');
    const backdrop = root.querySelector('[data-header-menu-backdrop]');

    root.classList.toggle('header--menu-open', isOpen);

    if (menuToggle instanceof HTMLElement) {
      menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      menuToggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
    }

    if (drawer instanceof HTMLElement) {
      drawer.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      drawer.toggleAttribute('hidden', !isOpen);
    }

    if (backdrop instanceof HTMLElement) {
      backdrop.toggleAttribute('hidden', !isOpen);
    }

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

  const megaMenuControllers = [];

  const closeAllMegaMenus = () => {
    megaMenuControllers.forEach((controller) => controller.forceClose());
  };

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

  document.addEventListener('pageshow', () => {
    megaMenuControllers.forEach((controller) => controller.scheduleEnableMegaMenu());
    closeAllDrawers();
  });

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;

    const menuToggle = event.target.closest('[data-header-menu-toggle]');
    if (menuToggle instanceof HTMLElement) {
      const root = getRoot(menuToggle);
      if (root instanceof HTMLElement) {
        const isOpen = root.classList.contains('header--menu-open');
        setDrawerState(root, !isOpen);
      }
      return;
    }

    const menuClose = event.target.closest('[data-header-menu-close], [data-header-menu-backdrop]');
    if (menuClose instanceof HTMLElement) {
      const root = getRoot(menuClose);
      if (root instanceof HTMLElement) {
        setDrawerState(root, false);
      }
      return;
    }

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
      return;
    }

    const navLink = event.target.closest('.header__nav--desktop a.header__menu-link:not([data-header-shop-trigger])');
    if (navLink instanceof HTMLElement) {
      closeAllMegaMenus();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeAllDrawers();
      closeAllMegaMenus();
    }
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
    closeAllMegaMenus();
  });

  document.addEventListener('wishlist:updated', syncWishlistCount);

  document.querySelectorAll('[data-header-root]').forEach((root) => {
    if (!(root instanceof HTMLElement)) return;

    const item = root.querySelector('.header__menu-item--mega');
    const trigger = root.querySelector('[data-header-shop-trigger]');
    const panel = root.querySelector('.header__mega-panel');
    if (!(item instanceof HTMLElement)) return;

    let closeTimer = null;
    let openTimer = null;
    let megaReady = false;
    let enableTimer = null;

    const cancelOpen = () => {
      if (openTimer) {
        window.clearTimeout(openTimer);
        openTimer = null;
      }
    };

    const setOpen = (isOpen) => {
      if (isOpen && !megaReady) return;

      cancelOpen();
      item.classList.toggle('is-shop-open', isOpen);
      if (trigger instanceof HTMLElement) {
        trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      }
      if (panel instanceof HTMLElement) {
        panel.toggleAttribute('hidden', !isOpen);
        panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      }
    };

    const forceClose = () => {
      cancelOpen();
      if (closeTimer) {
        window.clearTimeout(closeTimer);
        closeTimer = null;
      }
      item.classList.remove('is-shop-open');
      if (trigger instanceof HTMLElement) {
        trigger.setAttribute('aria-expanded', 'false');
      }
      if (panel instanceof HTMLElement) {
        panel.setAttribute('hidden', '');
        panel.setAttribute('aria-hidden', 'true');
      }
    };

    const enableMegaMenu = () => {
      if (megaReady) return;
      megaReady = true;
      root.setAttribute('data-mega-ready', 'true');
      if (enableTimer) {
        window.clearTimeout(enableTimer);
        enableTimer = null;
      }
    };

    const scheduleEnableMegaMenu = () => {
      forceClose();
      megaReady = false;
      root.removeAttribute('data-mega-ready');
      if (enableTimer) window.clearTimeout(enableTimer);
      enableTimer = window.setTimeout(enableMegaMenu, 750);
    };

    forceClose();
    enableTimer = window.setTimeout(enableMegaMenu, 750);

    megaMenuControllers.push({ root, forceClose, scheduleEnableMegaMenu });

    // Hover zone = Shop trigger + mega panel only.
    // Do NOT close on shell mouseleave — WebKit/Safari fires that when the pointer
    // moves into the absolutely positioned panel (outside the shell's content box),
    // which causes an open/close flicker and makes the menu unusable.
    const isInsideMegaZone = (node) => {
      if (!(node instanceof Node)) return false;
      if (item.contains(node)) return true;
      if (panel instanceof HTMLElement && panel.contains(node)) return true;
      return false;
    };

    const cancelClose = () => {
      if (closeTimer) {
        window.clearTimeout(closeTimer);
        closeTimer = null;
      }
    };

    const scheduleClose = () => {
      if (!megaReady) return;
      cancelOpen();
      cancelClose();
      closeTimer = window.setTimeout(() => {
        closeTimer = null;
        setOpen(false);
      }, 220);
    };

    const openMenu = ({ immediate = false } = {}) => {
      if (!megaReady) return;
      cancelClose();
      if (immediate) {
        cancelOpen();
        setOpen(true);
        return;
      }
      if (openTimer) return;
      openTimer = window.setTimeout(() => {
        openTimer = null;
        setOpen(true);
      }, 120);
    };

    const handleMegaEnter = () => {
      if (!megaReady) return;
      const alreadyOpen = item.classList.contains('is-shop-open');
      openMenu({ immediate: alreadyOpen });
    };

    const handleMegaLeave = (event) => {
      if (!megaReady) return;
      // Still moving within Shop ↔ panel (or Safari null relatedTarget while crossing).
      if (isInsideMegaZone(event.relatedTarget)) return;
      scheduleClose();
    };

    const openMenuFromFocus = (event) => {
      if (!megaReady) return;
      const target = event.target;
      if (!(target instanceof HTMLElement) || !target.matches(':focus-visible')) return;
      openMenu({ immediate: true });
    };

    item.addEventListener('mouseenter', handleMegaEnter);
    item.addEventListener('mouseleave', handleMegaLeave);

    if (panel instanceof HTMLElement) {
      panel.addEventListener('mouseenter', () => openMenu({ immediate: true }));
      panel.addEventListener('mouseleave', handleMegaLeave);
    }

    item.addEventListener('focusin', openMenuFromFocus);
    item.addEventListener('focusout', (event) => {
      if (!megaReady) return;
      if (isInsideMegaZone(event.relatedTarget)) return;
      scheduleClose();
    });

    if (panel instanceof HTMLElement) {
      panel.addEventListener('focusin', openMenuFromFocus);
      panel.addEventListener('focusout', (event) => {
        if (!megaReady) return;
        if (isInsideMegaZone(event.relatedTarget)) return;
        scheduleClose();
      });
    }
  });

  syncWishlistCount();
  syncGlobalState();
})();
