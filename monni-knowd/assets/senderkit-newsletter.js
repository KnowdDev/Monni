/**
 * Dual-submit Shopify newsletter forms → SenderKit public widget (no API key).
 * Keeps native {% form 'customer' %} submit; fire-and-forget enrolls SenderKit.
 */
(function () {
  var ORIGIN = 'https://senderkit.io';
  var meta = document.querySelector('meta[name="senderkit-signup-slug"]');
  var slug = (meta && meta.content) || window.SENDERKIT_SIGNUP_SLUG || '';
  if (!slug) return;

  function fieldValue(form, names) {
    for (var i = 0; i < names.length; i++) {
      var el = form.querySelector('[name="' + names[i] + '"]');
      if (el && el.value) return String(el.value).trim();
    }
    return '';
  }

  function enroll(form) {
    var email = fieldValue(form, ['contact[email]', 'email']);
    if (!email) return;

    var payload = {
      email: email,
      consentGiven: true
    };

    var firstName = fieldValue(form, ['contact[first_name]', 'firstName', 'first_name']);
    var lastName = fieldValue(form, ['contact[last_name]', 'lastName', 'last_name']);
    if (firstName) payload.firstName = firstName;
    if (lastName) payload.lastName = lastName;

    try {
      fetch(ORIGIN + '/api/widget/signup/' + encodeURIComponent(slug), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
        mode: 'cors'
      }).catch(function () {
        // Shopify submit must not fail if SenderKit is unreachable.
      });
    } catch (e) {
      // Ignore.
    }
  }

  function bind(form) {
    if (!form || form.getAttribute('data-senderkit-bound') === 'true') return;
    form.setAttribute('data-senderkit-bound', 'true');
    form.addEventListener(
      'submit',
      function () {
        if (typeof form.checkValidity === 'function' && !form.checkValidity()) return;
        enroll(form);
      },
      true
    );
  }

  function scan() {
    var forms = document.querySelectorAll(
      'form[data-senderkit-newsletter], form.newsletter__form, form.newsletter-v2__form, form.newsletter-popup__form, form.footer__newsletter-form'
    );
    for (var i = 0; i < forms.length; i++) bind(forms[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scan);
  } else {
    scan();
  }

  // Theme editor / section re-renders
  document.addEventListener('shopify:section:load', scan);
})();
