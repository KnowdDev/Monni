# Lighthouse 95+ Fix Guide — Tea & Tonic Matakana
**Audit date:** 27 May 2026 | **Tool:** Lighthouse 13.3.0 (Mobile, Slow 4G)  
**Current scores:** Performance 71 · Accessibility 90 · Best Practices 92 · SEO 69  
**Target scores:** Performance 95+ · Accessibility 95+ · Best Practices 95+ · SEO 95+

---

## Current Metrics vs Targets

| Metric | Current | Target | Gap |
|---|---|---|---|
| First Contentful Paint (FCP) | 1.2 s | < 1.8 s | ✅ passing |
| Largest Contentful Paint (LCP) | 9.1 s | < 2.5 s | 🔴 Critical |
| Total Blocking Time (TBT) | 130 ms | < 200 ms | ✅ passing |
| Cumulative Layout Shift (CLS) | 0 | < 0.1 | ✅ passing |
| Speed Index (SI) | 4.7 s | < 3.4 s | 🟠 Needs work |

---

## 🔴 PERFORMANCE (71 → 95+)

### P1 — Fix LCP Image (9.1 s → target < 2.5 s) · CRITICAL

**Problem:** The LCP element is the "Monni" hero image. It has a 690 ms resource load delay and 1,840 ms load duration. It is missing `fetchpriority="high"`.

**LCP breakdown:**
- Time to First Byte: 0 ms ✅
- Resource load delay: 690 ms 🔴 (should be < 200 ms)
- Resource load duration: 1,840 ms 🔴 (image too large)
- Element render delay: 70 ms ✅

**Fix in `sections/split-hero.liquid` (or whichever section renders this image):**

```liquid
{%- comment -%} BEFORE — missing fetchpriority {%- endcomment -%}
<img src="{{ image | image_url: width: 800 }}"
     srcset="..."
     sizes="(min-width: 768px) 50vw, 100vw"
     alt="{{ image.alt }}"
     loading="eager"
     decoding="async"
     width="6000"
     height="4000"
     class="split-hero__image">

{%- comment -%} AFTER — add fetchpriority, convert to WebP, correct dimensions {%- endcomment -%}
<img src="{{ image | image_url: width: 800, format: 'webp' }}"
     srcset="{{ image | image_url: width: 400, format: 'webp' }} 400w,
             {{ image | image_url: width: 800, format: 'webp' }} 800w,
             {{ image | image_url: width: 1200, format: 'webp' }} 1200w"
     sizes="(min-width: 768px) 50vw, 100vw"
     alt="{{ image.alt }}"
     loading="eager"
     fetchpriority="high"
     decoding="async"
     width="{{ image.width }}"
     height="{{ image.height }}"
     class="split-hero__image">
```

**Also add a `<link rel="preload">` in `layout/theme.liquid` `<head>`:**

```liquid
{%- if section.settings.image != blank -%}
  <link rel="preload"
        as="image"
        href="{{ section.settings.image | image_url: width: 800, format: 'webp' }}"
        imagesrcset="{{ section.settings.image | image_url: width: 400, format: 'webp' }} 400w,
                     {{ section.settings.image | image_url: width: 800, format: 'webp' }} 800w"
        imagesizes="(min-width: 768px) 50vw, 100vw"
        fetchpriority="high">
{%- endif -%}
```

---

### P2 — Convert "Monni" hero image to WebP · Est savings 80 KiB

**Problem:** `MONNIxLOF….jpg` is served as JPEG (118.8 KiB). No WebP/AVIF version.

**Fix:** Update all hero/split-section image calls to use Shopify's built-in format transformation:

```liquid
{%- comment -%} Replace all hero img_url calls with format: 'webp' {%- endcomment -%}
{{ image | image_url: width: 800, format: 'webp' }}
```

Shopify's CDN handles conversion automatically when `format: 'webp'` is passed. Apply to every `image_url` filter on above-the-fold images.

---

### P3 — Fix Render-Blocking CSS · Est savings 310 ms

**Problem:** Three CSS files block initial render:
- `compiled_assets/styles.css` (9.7 KiB, 470 ms)
- `assets/critical.css` (8.6 KiB, 160 ms)
- `accelerated-checkout-backwards-compat.css` (2.8 KiB, 470 ms)

**Fix in `layout/theme.liquid`:** Inline critical CSS and defer the rest.

```liquid
{%- comment -%} STEP 1: Inline truly critical CSS (above-the-fold only) {%- endcomment -%}
<style>
  /* Paste minified critical CSS here — header, hero, nav only */
  /* Generate with: https://www.criticalcss.com or Penthouse */
</style>

{%- comment -%} STEP 2: Load full stylesheet asynchronously {%- endcomment -%}
<link rel="preload" href="{{ 'compiled_assets/styles.css' | asset_url }}" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="{{ 'compiled_assets/styles.css' | asset_url }}"></noscript>

{%- comment -%} STEP 3: Defer accelerated-checkout CSS (not needed for paint) {%- endcomment -%}
<link rel="stylesheet" href="{{ 'accelerated-checkout-backwards-compat.css' | asset_url }}" media="print" onload="this.media='all'">
```

---

### P4 — Minify `compiled_assets/styles.css` · Est savings 2.5 KiB

**Problem:** `compiled_assets/styles.css` (9.7 KiB) is not minified — 2.5 KiB of whitespace/comments.

**Fix options (choose one):**
1. Run through your build process: `cssnano`, `clean-css`, or `postcss --use cssnano`
2. Use Shopify CLI minification in your theme build pipeline
3. Rename file to `.min.css` after minifying and update the reference in `theme.liquid`

```bash
# CLI fix (run in theme root)
npx cleancss -o assets/compiled_assets.min.css assets/compiled_assets/styles.css
```

---

### P5 — Remove Unused JavaScript · Est savings 226 KiB

**Problem:** Three large JS bundles with significant unused code:

| File | Size | Unused | Action |
|---|---|---|---|
| `mailchimp form-assets` | 110 KiB | 80 KiB | Load on interaction |
| `portable-wallets.en.js` | 74 KiB | 49 KiB | Lazy load |
| `wpm/b6aad4977….js` (Web Pixel Manager) | 63 KiB | 28 KiB | Defer |

**Fix — Mailchimp: load only when user interacts with signup form:**

```liquid
{%- comment -%} In your newsletter section Liquid file {%- endcomment -%}
<div id="mc-embed-signup" data-src="//cdn-images.mailchimp.com/embedcode/...">
  <!-- Placeholder form markup here -->
</div>

<script>
  // Load Mailchimp JS only when user focuses the email input
  document.querySelector('#mc-embed-signup input[type="email"]')
    ?.addEventListener('focus', () => {
      if (!window.mcLoaded) {
        window.mcLoaded = true;
        const s = document.createElement('script');
        s.src = 'https://chimpstatic.com/mcjs-connected/.../b553a3a….js?shop=tea-tonic-matakana.myshopify.com';
        document.head.appendChild(s);
      }
    }, { once: true });
</script>
```

**Fix — `portable-wallets.en.js`: defer until after page load:**

In `theme.liquid`, find the script tag loading `portable-wallets.en.js` and change:
```html
<!-- BEFORE -->
<script src="...portable-wallets.en.js"></script>

<!-- AFTER -->
<script src="...portable-wallets.en.js" defer></script>
```

**Fix — Web Pixel Manager (`wpm/*.js`): already deferred by Shopify — no action needed, but audit your installed Shopify apps and remove any unused pixel/tracking apps from the Shopify admin.**

---

### P6 — Remove Unused CSS · Est savings 91 KiB

**Problem:** `vendor.css` from `cdn.shopify.com` (96 KiB) has 91 KiB unused.

**Fix:** This is Shopify's theme kit vendor CSS — you cannot directly modify it. Mitigation options:

1. **PurgeCSS on your own theme CSS:** In your build step, add PurgeCSS to strip unused selectors from your own stylesheets.
2. **Split your CSS:** Move section-specific CSS into `<style>` blocks within each section's Liquid file. Shopify will only include them on pages that render that section.

```liquid
{%- comment -%} In each section .liquid file, add section-scoped styles {%- endcomment -%}
{% stylesheet %}
  .my-section { ... }
{% endstylesheet %}
```

---

### P7 — Fix Cache Lifetimes · Est savings 570 KiB

**Problem:** Many assets have very short cache TTLs (1 minute), forcing re-download on every visit.

| Domain | Issue | Your Control |
|---|---|---|
| `cdn.shopify.com` preview bar assets | 1m TTL | ❌ Shopify-controlled |
| `form-assets.mailchimp.com` | 1m TTL | ❌ Third-party |
| `chimpstatic.com` Mailchimp JS | 5m TTL | ❌ Third-party |
| `mcjs.prd.a.intuit.com` | **No cache at all** | ❌ Third-party |
| Your store's `portable-wallets.en.js` | 5m TTL | ⚠️ Partial |

**Fix for assets you control:** Add cache headers via Shopify's CDN. For assets in `assets/`, Shopify automatically sets long cache TTLs when you use the `asset_url` filter with content hashing.

Ensure you're using versioned asset URLs:
```liquid
{{ 'styles.css' | asset_url }}
{%- comment -%} Shopify appends ?v=hash automatically — long TTL applied {%- endcomment -%}
```

**Fix for third-party scripts (Mailchimp, Intuit):** Self-host critical third-party scripts where licensing permits, or load them lazily (see P5 above). This removes the no-cache penalty from your critical path.

---

### P8 — Remove Excessive Preconnect Hints

**Problem:** More than 4 `<link rel="preconnect">` found. `fonts.shopifycdn.com` is preconnected but never used — wasted DNS + TLS handshake.

**Fix in `layout/theme.liquid` `<head>`:**

```liquid
{%- comment -%} REMOVE this unused preconnect {%- endcomment -%}
<!-- DELETE: <link rel="preconnect" href="https://fonts.shopifycdn.com" crossorigin=""> -->

{%- comment -%} KEEP only the origins you actually load resources from first-paint {%- endcomment -%}
<link rel="preconnect" href="https://cdn.shopify.com">
<link rel="preconnect" href="https://shop.app" crossorigin>
{%- comment -%} Maximum 4 preconnects total {%- endcomment -%}
```

---

### P9 — Fix Non-Composited Animation

**Problem:** `html.p-theme-dark-experimental` uses `scrollbar-color` CSS property which is not compositable and can cause layout shifts.

**Fix in your theme CSS or `base.css`:**

```css
/* BEFORE — causes non-composited animation warning */
html {
  scrollbar-color: var(--color-scrollbar) transparent;
}

/* AFTER — wrap in @supports to prevent issues where not supported */
@supports (scrollbar-color: auto) {
  html {
    scrollbar-color: var(--color-scrollbar) transparent;
    scrollbar-width: thin;
  }
}
```

---

### P10 — Fix Legacy JavaScript Polyfill · Est savings 6 KiB

**Problem:** `portable-wallets.en.js` includes `Array.prototype.flatMap` polyfill — unnecessary for modern browsers (Baseline 2019).

**Fix:** If you control this bundle's build config, update your Browserslist target:

```json
// .browserslistrc or package.json
{
  "browserslist": [
    "last 2 Chrome versions",
    "last 2 Firefox versions",
    "last 2 Safari versions",
    "last 2 Edge versions"
  ]
}
```

If this is a Shopify-managed file (part of an app), contact the app developer or raise a support ticket — this is their bundle to fix.

---

## 🟡 ACCESSIBILITY (90 → 95+)

### A1 — Fix `aria-hidden` on Focusable Element

**Problem:** The header checkbox (`#header-menu-state-…`) is `aria-hidden="true"` but is focusable, making it invisible to screen readers while remaining in the tab order.

**Fix in `sections/header.liquid`:**

```liquid
{%- comment -%} BEFORE {%- endcomment -%}
<input id="header-menu-state-{{ section.id }}"
       class="header__menu-state"
       type="checkbox"
       data-header-menu-state
       aria-hidden="true">

{%- comment -%} AFTER — remove aria-hidden, use visually-hidden CSS instead {%- endcomment -%}
<input id="header-menu-state-{{ section.id }}"
       class="header__menu-state visually-hidden"
       type="checkbox"
       data-header-menu-state
       tabindex="-1">
```

Add to your CSS if not already present:
```css
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

---

### A2 — Fix Footer Link Colour Contrast

**Problem:** Footer links (© copyright, Refund policy, Privacy policy, Terms of service, Shipping policy, Contact information) fail WCAG AA contrast ratio (requires ≥ 4.5:1 for normal text).

**Fix in `sections/footer.liquid` or your theme CSS:**

```css
/* Find the footer link colour and darken it */
.footer a,
.footer p {
  /* Example: if current colour is #999 on white → fails (2.8:1) */
  /* Fix: use #767676 minimum for white background (4.54:1) */
  color: #595959; /* 7:1 ratio on white — AAA compliant */
}

/* Or if footer has a dark background, ensure links are light enough */
.footer--dark a,
.footer--dark p {
  color: #d4d4d4; /* Check your actual background colour */
}
```

Use the [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) to verify your specific colour pair achieves ≥ 4.5:1.

---

### A3 — Add `title` to Preview Bar `<iframe>`

**Problem:** `#PBarNextFrame` iframe has no `title` attribute — screen readers can't identify it.

**Note:** This iframe is injected by Shopify's preview bar (theme editor toolbar) and **only appears in preview/editor mode**, not on your live store. This will not affect your live store's accessibility score.

If you do have control over iframes in your theme:
```liquid
{%- comment -%} For any iframes you add in your theme {%- endcomment -%}
<iframe src="..." title="Descriptive name of iframe content"></iframe>
```

---

### A4 — Fix ARIA Role on `<label>` Element

**Problem:** A `<label>` element has `role="button"` — labels cannot have button roles.

**Fix in `sections/header.liquid`:**

```liquid
{%- comment -%} BEFORE — invalid ARIA role on label {%- endcomment -%}
<label for="header-menu-state-{{ section.id }}"
       class="header__menu-toggle"
       role="button"
       tabindex="0"
       aria-controls="header-drawer-{{ section.id }}"
       data-header-menu-toggle>
  Toggle navigation menu
</label>

{%- comment -%} AFTER — use a button element instead {%- endcomment -%}
<button class="header__menu-toggle"
        type="button"
        aria-expanded="false"
        aria-controls="header-drawer-{{ section.id }}"
        data-header-menu-toggle>
  <span class="visually-hidden">Toggle navigation menu</span>
  {%- comment -%} Your hamburger icon SVG here {%- endcomment -%}
</button>
```

Update associated JavaScript to target the button and manage `aria-expanded` state:
```javascript
const menuToggle = document.querySelector('[data-header-menu-toggle]');
menuToggle?.addEventListener('click', () => {
  const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!expanded));
});
```

---

## 🟡 BEST PRACTICES (92 → 95+)

### B1 — Fix Console Errors

**Problem:** Multiple errors logged to browser console that Lighthouse flags:

| Error | Source | Fix |
|---|---|---|
| `ERR_BLOCKED_BY_CLIENT` for Shopify telemetry | Ad blocker in test env | Not fixable — only in Lighthouse. Ignore. |
| `400 Bad Request` on `monorail-edge.shopifysvc.com` | Shopify analytics | Not fixable — Shopify-controlled. |
| `404 Not Found` for `web-pixel-*.modern.js` | Broken pixel apps | **Fix: Remove broken app pixels from Shopify Admin → Settings → Customer events** |
| `404 Not Found` for `/shopify_pay/accelerated_checkout` | Shop Pay not enabled | **Fix: Enable Shop Pay in Shopify Admin → Settings → Payments, or remove the accelerated checkout script** |
| MIME type error for web pixel scripts | Consequence of 404s above | Resolved when 404s are fixed |
| CSP violation for `shop.app` framing | CSP misconfiguration | See B2 below |

**Action required — remove broken web pixels:**
1. Go to Shopify Admin → Settings → Customer events
2. Identify and remove any pixel apps returning 404
3. Reinstall or replace them if needed

---

### B2 — Strengthen Content Security Policy

**Problem:** CSP is missing `script-src` and `object-src` directives (High severity). HSTS `max-age` is too low and missing `includeSubDomains` and `preload`. No COOP header.

**These are largely Shopify platform-level headers** — you have limited control. However, you can improve what you can via your theme:

For HSTS and COOP, raise a ticket with Shopify or ensure your custom domain is configured correctly. Shopify manages server headers, but you can contact Shopify Support to enable HSTS preloading for your domain.

For the CSP `shop.app` framing violation — this is a Shopify bug in preview mode, not your live store.

---

## 🔴 SEO (69 → 95+)

### S1 — Remove `noindex, nofollow` Meta Tag · CRITICAL

**Problem:** The page has `<meta name="robots" content="noindex,nofollow">` AND `robots.txt` also blocks crawlers. This is why your SEO score is 69 — Google literally cannot index this page.

**This is because you're testing a Shopify preview URL** (`shopifypreview.com`), not your live store URL. Preview URLs are intentionally blocked from indexing by Shopify.

**Fix for your LIVE store:**
1. Verify your live store (`tea-tonic-matakana.myshopify.com` or your custom domain) does NOT have this meta tag
2. In Shopify Admin → Online Store → Preferences → ensure "Password protect" is off
3. Run PageSpeed Insights against your **live domain** (not a preview URL) to get an accurate SEO score

**Fix in `layout/theme.liquid` to ensure the noindex only applies to non-production environments:**

```liquid
{%- comment -%} Only add noindex on password/preview pages, not live store {%- endcomment -%}
{%- unless request.design_mode or shop.password_enabled -%}
  {%- comment -%} Remove any hardcoded noindex meta tags {%- endcomment -%}
{%- endunless -%}
```

Search for and remove any hardcoded:
```html
<!-- DELETE THIS if found in theme.liquid or SEO snippet -->
<meta name="robots" content="noindex,nofollow">
```

---

### S2 — SEO Best Practices (Pre-validate Before Live Audit)

Once you re-run PageSpeed on your live URL, ensure these pass (currently showing passed but validate on live):

- ✅ `<title>` tag present and descriptive
- ✅ Meta description present
- ✅ Images have `alt` text
- ✅ Links have descriptive text
- ✅ `hreflang` if multilingual
- ✅ Structured data (Product schema for Shopify — add via JSON-LD)

**Add Product structured data in `sections/product-template.liquid`:**

```liquid
<script type="application/ld+json">
{
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": {{ product.title | json }},
  "image": {{ product.featured_image | image_url: width: 800 | prepend: 'https:' | json }},
  "description": {{ product.description | strip_html | json }},
  "brand": {
    "@type": "Brand",
    "name": {{ product.vendor | json }}
  },
  "offers": {
    "@type": "Offer",
    "url": {{ canonical_url | json }},
    "priceCurrency": {{ cart.currency.iso_code | json }},
    "price": {{ product.price | money_without_currency | json }},
    "availability": "{% if product.available %}https://schema.org/InStock{% else %}https://schema.org/OutOfStock{% endif %}"
  }
}
</script>
```

---

## Priority Order of Fixes

Complete in this sequence for maximum score impact:

| Priority | Fix | Score Impact | Effort |
|---|---|---|---|
| 1 | **S1** — Remove noindex (test on live URL) | SEO: +26 pts | 5 min |
| 2 | **P1** — Add `fetchpriority="high"` to LCP image | Perf: +15 pts | 10 min |
| 3 | **P1** — Preload LCP image in `<head>` | Perf: +8 pts | 15 min |
| 4 | **P2** — Convert hero images to WebP | Perf: +6 pts | 20 min |
| 5 | **B1** — Remove broken 404 web pixels from Shopify Admin | Best Practices: +3 pts | 10 min |
| 6 | **A4** — Replace `<label role="button">` with `<button>` | Accessibility: +4 pts | 30 min |
| 7 | **A1** — Fix `aria-hidden` on header checkbox | Accessibility: +2 pts | 15 min |
| 8 | **A2** — Fix footer link contrast | Accessibility: +2 pts | 10 min |
| 9 | **P3** — Defer non-critical CSS | Perf: +5 pts | 45 min |
| 10 | **P5** — Lazy-load Mailchimp JS | Perf: +8 pts | 30 min |
| 11 | **P8** — Remove unused preconnect (fonts.shopifycdn.com) | Perf: +2 pts | 5 min |
| 12 | **P4** — Minify `compiled_assets/styles.css` | Perf: +2 pts | 30 min |
| 13 | **P9** — Wrap `scrollbar-color` in `@supports` | Perf: +1 pt | 5 min |

---

## What You Cannot Fix (Platform Constraints)

These are Shopify/third-party controlled and will not affect your live store score:

- **Preview bar vendor JS** (185 KiB, 1m cache) — only present in theme preview mode
- **Shopify telemetry errors** (`ERR_BLOCKED_BY_CLIENT`) — Lighthouse ad-blocker artifact
- **`monorail-edge` 400 error** — Shopify analytics, platform-level
- **Intuit/Mailchimp cache TTLs** — third-party CDN, not controllable
- **HSTS / COOP headers** — Shopify server configuration

---

## Validation Checklist

After applying fixes, run PageSpeed on your **live store URL**, not the preview URL:

```
https://pagespeed.web.dev/
→ Enter: https://tea-tonic-matakana.myshopify.com  (or your custom domain)
→ Test both Mobile and Desktop
```

Expected results after all fixes:
- Performance: **95+** (LCP < 2.5 s is the key driver)
- Accessibility: **95+**
- Best Practices: **95+** (console errors cleared)
- SEO: **95+** (live URL has no noindex)
