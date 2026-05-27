/**
 * Minimal scroll-reveal animations using IntersectionObserver.
 * No external dependencies. Respects prefers-reduced-motion.
 */

(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  function init() {
    const elements = document.querySelectorAll('[data-animate]');
    const viewportH = window.innerHeight || document.documentElement.clientHeight;

    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < viewportH * 0.92) {
        el.classList.add('is-visible');
      }
    });

    document.documentElement.classList.add('js-animations');

    elements.forEach((el) => observer.observe(el));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
