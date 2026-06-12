/**
 * Homepage newsletter slide-in — scroll trigger, first visit only.
 */
(function () {
  const STORAGE_KEY = 'monni:newsletter-popup';

  const popup = document.querySelector('[data-newsletter-popup]');
  if (!popup) return;

  const closeBtn = popup.querySelector('[data-newsletter-popup-close]');
  const form = popup.querySelector('.newsletter-popup__form');
  const threshold = parseInt(popup.dataset.scrollOffset, 10) || 360;
  const hasSuccess = Boolean(popup.querySelector('.newsletter-popup__success'));
  const hasErrors = Boolean(popup.querySelector('.newsletter-popup__error'));
  const stored = localStorage.getItem(STORAGE_KEY);

  const mark = (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch (e) {
      // Private browsing.
    }
  };

  if ((stored === 'shown' || stored === 'dismissed' || stored === 'submitted') && !hasErrors && !hasSuccess) return;

  let revealed = false;

  const reveal = () => {
    if (revealed) return;
    revealed = true;
    popup.classList.add('is-visible');
    popup.setAttribute('aria-hidden', 'false');
    closeBtn?.focus({ preventScroll: true });
  };

  const dismiss = () => {
    mark('dismissed');
    popup.classList.remove('is-visible');
    popup.setAttribute('aria-hidden', 'true');
  };

  const onScroll = () => {
    if (window.scrollY >= threshold) {
      reveal();
      mark('shown');
      window.removeEventListener('scroll', onScroll);
    }
  };

  if (hasSuccess) {
    mark('submitted');
    reveal();
  } else if (hasErrors) {
    reveal();
  } else {
    window.addEventListener('scroll', onScroll, { passive: true });
    if (window.scrollY >= threshold) onScroll();
  }

  closeBtn?.addEventListener('click', dismiss);

  popup.addEventListener('click', (event) => {
    if (event.target === popup) dismiss();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && popup.classList.contains('is-visible')) {
      dismiss();
    }
  });

  form?.addEventListener('submit', () => {
    if (form.checkValidity()) mark('submitted');
  });
})();
