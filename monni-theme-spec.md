# Monni — Shopify Theme Build Specification

> **Purpose**: This document is the single source of truth for building the Monni Shopify theme. Every architectural decision, performance constraint, UX pattern, and design rule defined here must be implemented. The target is a Lighthouse score of 95+ on both mobile and desktop, with conversion rates and UX benchmarks consistent with best-in-class luxury e-commerce.

---

## 1. Foundation & Architecture

### Base
- Build on **Shopify Skeleton Theme** — no Dawn, no pre-built commercial theme. Zero inherited bloat.
- All Liquid, CSS, and JS files are authored from scratch or curated minimally.
- Section/block architecture throughout — every content area is a Shopify section with schema-driven settings.
- Use **Shopify's Theme Check** linter on every file before commit.

### File Structure
```
/assets          → compiled CSS, compiled JS, fonts (self-hosted), SVG sprites
/config          → settings_schema.json, settings_data.json
/layout          → theme.liquid (only one layout file)
/locales         → en.default.json
/sections        → one file per section, schema at bottom
/snippets        → atomic reusable components (card-product, icon, image, etc.)
/templates       → JSON templates only (no .liquid templates)
```

### JavaScript Rules
- **Zero jQuery.** Vanilla JS only.
- All interactive components are **Custom Elements** (Web Components). Each registers once: `customElements.define('media-gallery', MediaGallery)`.
- JS is **ES modules**, bundled with esbuild. Output: one `theme.js` bundle, deferred.
- Third-party scripts (analytics, chat) load via `{{ content_for_header }}` + async/defer only. Never render-blocking.
- No JS framework (React, Vue, Alpine). DOM manipulation is minimal and surgical.
- Event delegation over per-element listeners.

### CSS Rules
- Single compiled stylesheet: `theme.css`. No inline `<style>` blocks except critical above-the-fold CSS inlined in `<head>`.
- CSS custom properties for every design token (colour, spacing, radius, typography). No hardcoded values in component CSS.
- Mobile-first media queries: `min-width` only.
- No CSS-in-JS, no utility-class frameworks (no Tailwind). Semantic BEM class naming.
- Use `contain: layout style` on expensive components (carousels, modals) to prevent repaints.
- `will-change: transform` only on elements confirmed to animate — never applied globally.

---

## 2. Performance — Lighthouse 95+ Target

Every build decision is made through the lens of Core Web Vitals.

### Largest Contentful Paint (LCP) — Target: < 2.0s
- Hero image: always `loading="eager"` + `fetchpriority="high"` + preload `<link rel="preload">` in `<head>`.
- All hero images served via Shopify CDN with explicit `width` and `height` attributes (no layout shift).
- Use `srcset` and `sizes` on every `<img>`. Never a fixed-width image above the fold.
- Shopify image URL filter pattern: `{{ image | image_url: width: 1200 }}` with full srcset at 400w, 600w, 800w, 1200w, 1600w.
- Fonts: self-hosted WOFF2 only, preloaded in `<head>`, `font-display: swap`.
- No Google Fonts API calls. No Typekit. No external font CDN.

### Cumulative Layout Shift (CLS) — Target: < 0.05
- Every image has explicit `width` and `height` in HTML (not CSS). Use `aspect-ratio` CSS as fallback.
- Skeleton loaders (CSS only, no JS) for any dynamically injected content.
- Font fallback metrics matched to the loaded typeface using `ascent-override`, `descent-override`, `line-gap-override`.
- No content injected above existing DOM nodes after load.
- Cart drawer slides in from the side — never reflows page content.

### Interaction to Next Paint (INP) — Target: < 100ms
- Add-to-cart: optimistic UI update first, fetch in background.
- No synchronous XHR anywhere.
- Debounce all scroll and resize listeners (16ms minimum).
- Variant switching: pure CSS where possible (hide/show via `[data-variant]` selectors), no re-render.

### Total Blocking Time — Target: < 150ms
- Main thread budget: one JS bundle < 40KB gzipped.
- All analytics (GA4, Meta Pixel) loaded in a `requestIdleCallback` wrapper.
- No Shopify app scripts that inject `<script>` tags synchronously. Audit every installed app.

### Additional Performance Rules
- Enable Shopify's **Storefront Renderer** caching (section rendering API-safe markup).
- HTTP/2 push hints for critical resources via `link` header where Shopify CDN supports it.
- Use `content-visibility: auto` on below-fold sections (product grids, footer).
- Lazy load all images below the fold: `loading="lazy"` + `decoding="async"`.
- Use `IntersectionObserver` for any scroll-triggered animation — threshold 0.15, rootMargin 50px.
- Ship no unused CSS. Build step strips all unreferenced rules.
- Compress all SVG assets with SVGO before adding to `/assets`.

---

## 3. Brand & Visual Design System

### Design Philosophy
The site is a digital sanctuary. Every element earns its place. Stillness, intention, and restraint are the aesthetic. Reference: Assembly Label NZ, Able Fragrance, Frama CPH (with lighter hand).

### Colour Tokens
```css
:root {
  /* Primary neutrals */
  --color-stone:        #F4F1EC;   /* page background */
  --color-stone-dark:   #E8E3DB;   /* secondary surfaces */
  --color-warm-white:   #FAF8F5;   /* card backgrounds */
  --color-linen:        #EDE7DC;   /* hover states, dividers */

  /* Timber/blush */
  --color-timber:       #C8A882;   /* accent, borders */
  --color-blush:        #E8D5CB;   /* soft accent fills */

  /* Text */
  --color-ink:          #1E1C1A;   /* primary text */
  --color-ink-muted:    #6B6560;   /* secondary text */
  --color-ink-ghost:    #A09890;   /* placeholders, captions */

  /* Functional */
  --color-success:      #4A7C59;
  --color-error:        #B5472A;

  /* Spacing scale (8-point grid) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;
  --space-9: 96px;
  --space-10: 128px;

  /* Type scale */
  --text-xs:   11px;
  --text-sm:   13px;
  --text-base: 15px;
  --text-md:   17px;
  --text-lg:   21px;
  --text-xl:   28px;
  --text-2xl:  36px;
  --text-3xl:  48px;
  --text-4xl:  64px;

  /* Radius */
  --radius-sm:  2px;
  --radius-md:  4px;
  --radius-pill: 100px;

  /* Transitions */
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --duration-fast: 160ms;
  --duration-base: 280ms;
  --duration-slow: 480ms;
}
```

### Typography
- **Primary typeface**: A refined sans-serif with Japanese/Nordic sensibility. Recommended: `Söhne` (Klim Type Foundry) or `Neue Montreal`. Self-hosted WOFF2.
- **Secondary/editorial typeface**: A delicate serif for pull quotes and editorial moments. Recommended: `Canela Text` or `Cormorant`. Self-hosted WOFF2.
- **Tracking**: Uppercase labels always `letter-spacing: 0.12em`. Body copy `letter-spacing: 0.01em`. Never use `letter-spacing` on body paragraphs above 0.02em.
- **Line height**: Body `1.7`. Headings `1.15`. Display type `1.05`.
- **Font weight**: 300 (light editorial), 400 (body), 500 (UI labels). Never 700+.

### Motion & Animation Principles
- All animation serves function — never decorative for its own sake.
- Entrance animations: fade-up, 24px translate, 480ms, `--ease-out`. Applied once on IntersectionObserver trigger.
- Hover states on interactive elements: 160ms, opacity + subtle transform only.
- Page transitions: none (complexity without reward on Shopify). Instead, optimise perceived performance with instant skeleton states.
- Respect `prefers-reduced-motion`: all transitions/animations wrapped in `@media (prefers-reduced-motion: no-preference)`.

---

## 4. Layout System

### Grid
```css
.container {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 var(--space-5);          /* mobile: 24px */
}

@media (min-width: 768px) {
  .container { padding: 0 var(--space-7); }  /* tablet: 48px */
}

@media (min-width: 1200px) {
  .container { padding: 0 var(--space-8); }  /* desktop: 64px */
}
```

- Twelve-column CSS Grid underlies all layout. Components express spans, not widths.
- Product grid: 2-col mobile → 3-col tablet → 4-col desktop.
- Full-bleed sections break out of container intentionally.

---

## 5. Section Specifications

### 5.1 Header
- **Sticky** on scroll down; hides after 80px scroll, reveals on scroll up (`scroll-direction` detection via JS, `translate3d` transform only — no layout reflow).
- Logo: SVG inline (no `<img>` for logo — avoids extra request and enables CSS colour control).
- Navigation: flat links only. No dropdowns in the traditional sense. On hover/focus, a full-width **mega-panel** slides down (CSS transition, not JS height animation). Panel contains featured image + category links side by side.
- Mobile: hamburger opens a full-screen overlay menu. CSS transform slide-in from left. `aria-expanded` managed.
- Cart icon shows item count badge (Shopify `cart.item_count`). Updates on add-to-cart via Fetch API — no page reload.
- No announcement bar by default. If used: single line, dismissible, cookie-persisted.

**Schema settings**: logo, logo width, enable sticky, show search, menu handle.

### 5.2 Hero — Full-bleed Image/Video
- Full-viewport-height (`100svh` with `100vh` fallback).
- Background: `<img>` with `object-fit: cover` (not CSS background-image — allows preload and LCP attribution).
- Optional: background video (`<video autoplay muted loop playsinline>`). Lazy-initiated — poster image shows until IntersectionObserver triggers video load.
- Text overlay: absolutely positioned, vertically centred or bottom-left. Max-width 560px.
- CTA button: see Button spec below.
- Supports mobile-specific image via separate Shopify section setting.
- Parallax: **disabled by default**. If enabled by merchant, capped at 20% transform — never exceeds GPU budget.

**Schema settings**: image (mobile + desktop), video (mp4 URL), heading, subheading, CTA label, CTA URL, text alignment, overlay opacity, content vertical position.

### 5.3 Product Card (Snippet: `card-product.liquid`)
This is the most reused component. Optimise obsessively.

```
┌─────────────────────────────┐
│  [Product Image]            │
│  aspect-ratio: 3/4          │
│  hover: second image fades in│
├─────────────────────────────┤
│  Vendor (small, muted)      │
│  Product Title              │
│  Price  ~~Compare~~         │
│  [Quick add: variant select]│
└─────────────────────────────┘
```

- Image: `aspect-ratio: 3/4` enforced in CSS (no JS height matching).
- Second image on hover: absolutely positioned, `opacity: 0`, transitions to `opacity: 1` on `.card:hover`. Only loaded when `IntersectionObserver` marks card as visible.
- Quick add: hidden by default, slides up on hover. Single product = directly adds. Multiple variants = opens size selector inline (not a modal).
- Wishlist icon: top-right, `opacity: 0`, visible on card hover. Uses `localStorage` for client-side wishlist state.
- Badge: "New", "Sale", "Low stock" — rendered by Liquid logic, not JS.

**Performance**: card images use `loading="lazy"` + explicit `width`/`height`. First 4 cards in any grid use `loading="eager"`.

### 5.4 Product Grid Section
- Configurable: 2/3/4 columns (desktop), collection handle, product count, sort, filter visibility.
- **Infinite scroll vs pagination**: Use pagination by default (better for SEO and LCP). Offer "load more" button as schema option — not auto-trigger infinite scroll.
- Filter: collapsible sidebar on desktop, drawer on mobile. Filter state managed in URL params (`?filter.p.tag=...`) — shareable, crawlable.
- Sort: native `<select>` styled with CSS. No custom dropdown JS unless strictly necessary.

### 5.5 Product Page (`sections/product.liquid`)
Two-column layout: gallery left (55%), info right (45%). Stacks to single column on mobile.

**Gallery (Custom Element: `<media-gallery>`)**:
- Main image: `aspect-ratio: 4/5`, `object-fit: contain` on light background.
- Thumbnails: vertical strip on desktop (left of main image), horizontal dots on mobile.
- Pinch-zoom on mobile: native browser zoom — no JS zoom library.
- Video support: `<video>` or YouTube embed (load iframe only on play button click to save ~540KB initial load).

**Info panel**:
- Vendor, title, price in that order.
- Price: show compare-at if exists. Sale badge auto-renders.
- Star rating: only if reviews app is installed. Render via `{% render 'product-reviews-stars' %}` snippet that outputs an empty string if app is absent.
- Variant selector: swatch for colour (CSS background, no image requests), button group for size. Unavailable variants: strikethrough + disabled state via `[data-variant-available="false"]`.
- Quantity: `+/-` stepper with `<input type="number">` core. Min 1, max `variant.inventory_quantity` (if tracked).
- Add to cart: full-width button. On submit: button shows loading spinner (CSS), then success state (checkmark), then resets after 2000ms. Cart drawer opens automatically.
- Sticky add-to-cart bar: appears after scrolling past the main button. Shows product title, selected variant, price, and compact add button. `position: sticky` — no JS scroll listener needed.
- Accordion: Product Details, Ingredients/Materials, Shipping & Returns. CSS `<details>/<summary>` — zero JS.
- Recently viewed: client-side, `localStorage`, max 6 items, rendered via JS after LCP is complete.

### 5.6 Cart Drawer (Custom Element: `<cart-drawer>`)
- Slide-in from right. `transform: translateX(100%)` → `translateX(0)`. `backdrop-filter: none` — pure overlay `<div>` at `opacity: 0.4` (better performance than blur).
- Never a full page cart redirect. Always drawer.
- Line items: image, title, variant, price, quantity stepper, remove.
- Quantity update: debounced 300ms Fetch API to `/cart/change.js`. Optimistic UI (update DOM immediately, revert on error).
- Upsell/complementary product: one product only, below line items. Powered by `product.metafields.custom.complementary_product` — merchant-configurable, not algorithmic.
- Cart totals: subtotal, note about taxes/shipping.
- Checkout button: prominent, full-width.
- Express checkout: Shopify's `{{ content_for_additional_checkout_buttons }}` below primary button.
- Free shipping progress bar: CSS `width` transition based on `cart.total_price` vs threshold set in theme settings.

### 5.7 Featured Collection (Horizontal Scroll)
- Mobile: horizontal scroll snap. `scroll-snap-type: x mandatory`. No JS carousel library.
- Desktop: static grid.
- Scroll indicator: CSS-only fade mask on right edge to signal scrollability.

### 5.8 Editorial / Content Sections
- **Split content**: 50/50 image + text. Alternating layout per block. Schema: image, heading, body, CTA, image position (left/right).
- **Quote/pull**: `<blockquote>` with serif typeface, large — editorial moment only. Used sparingly.
- **Testimonials**: Static. No carousel autoplay. Manual prev/next. Schema: testimonial blocks (quote, author, product).
- **Brand story**: Full-bleed with constrained text column. Max-width 680px for readability.

### 5.9 Email Capture
- Embedded section — never a popup.
- Single `<input type="email">` + submit. Integrates with Shopify's Customers API or Klaviyo form embed.
- No modal, no exit-intent, no cookie wall. The brand does not interrupt.

### 5.10 Footer
- Four columns desktop, stacked mobile.
- Columns: Shop (category links), Help (FAQ, returns, contact), About, Newsletter.
- Social links: SVG icon links, no third-party icon fonts.
- Payment icons: Shopify's `{% render 'payment-icons' %}`.
- Copyright, locale/currency selector (Shopify Markets).
- No "Powered by Shopify" (remove via `layout/theme.liquid`).

---

## 6. Conversion Optimisation

These patterns are non-negotiable for a high-converting luxury store. All are brand-aligned and non-aggressive.

### Urgency & Scarcity (Tasteful)
- "Only 3 left" badge: renders when `variant.inventory_quantity <= 5` AND `variant.inventory_management == "shopify"`. Liquid-rendered, no JS.
- No fake countdown timers. No "X people viewing this." These undermine the brand's trust equity.

### Trust Signals
- Shipping & returns summary line directly beneath the add-to-cart button. One sentence. E.g., "Free shipping over $150 · 30-day returns."
- Secure checkout lock icon + "Secure checkout" label within the cart drawer — rendered via Shopify Payments SVG.

### Social Proof
- Star rating + review count on product card and product page (if reviews app present).
- "As seen in" / press logos section — static image component, schema-driven.

### Cross-sell
- "Complete the look" or "You may also like" on product page — max 4 products. Uses `product.metafields.custom.related_products` (manually curated) OR Shopify's Search & Discovery app recommendations API (`/recommendations/products.json`).

### Bundles
- Bundle section component: groups 2–4 products with combined pricing. Schema-driven per section. No app required — built in Liquid.

### Gift Cards & Notes
- Cart note input (expandable `<textarea>`) with "Add a gift note" toggle. Submitted with checkout.

### Checkout Optimisation (within Shopify constraints)
- Shopify Payments enabled for accelerated checkout (Shop Pay, Apple Pay, Google Pay).
- `{{ content_for_additional_checkout_buttons }}` surfaces these on product page and cart drawer.
- Checkout branding (Shopify Plus only): logo, brand colours, font applied to checkout via admin. Document this as a post-launch step.

---

## 7. SEO Architecture

### Technical SEO
- `<title>` tag: `{{ page_title }} | {{ shop.name }}`. Max 60 characters.
- Meta description: from `{{ page_description }}`. Truncate at 155 characters in Liquid.
- Canonical URLs on all paginated pages (`?page=2` etc.): `<link rel="canonical" href="{{ canonical_url }}">`.
- `robots.txt.liquid`: allow all, disallow `/checkout`, `/cart`, `/account`.
- XML sitemap: Shopify auto-generates. Verify inclusion of collections, products, pages, blogs.
- hreflang: implement if using Shopify Markets for international.

### Structured Data (JSON-LD)
Inject via `{% render 'schema-product' %}` snippet on product pages:

```json
{
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": "{{ product.title | json }}",
  "image": ["{{ product.featured_image | image_url: width: 1200 }}"],
  "description": "{{ product.description | strip_html | json }}",
  "sku": "{{ product.selected_or_first_available_variant.sku | json }}",
  "brand": { "@type": "Brand", "name": "{{ product.vendor | json }}" },
  "offers": {
    "@type": "Offer",
    "url": "{{ shop.url }}{{ product.url }}",
    "priceCurrency": "{{ cart.currency.iso_code }}",
    "price": "{{ product.selected_or_first_available_variant.price | money_without_currency }}",
    "availability": "{% if product.available %}https://schema.org/InStock{% else %}https://schema.org/OutOfStock{% endif %}"
  }
}
```

Also implement: `Organization`, `WebSite` (with SearchAction sitelinks), `BreadcrumbList`.

### On-Page SEO
- Every page: one `<h1>` only. Product title is always `<h1>`.
- Collection description: rendered as `<p>` below heading — crawlable, not hidden.
- Image `alt` attributes: `{{ media.alt | default: product.title | escape }}` — never empty.
- Breadcrumbs: rendered HTML + JSON-LD schema on collection and product pages.
- Blog: rendered with full article markup, author, date, categories. Supports Open Graph.

---

## 8. Accessibility (WCAG 2.1 AA)

- Colour contrast: all text against backgrounds ≥ 4.5:1. Test with Stark or axe DevTools.
- Focus states: visible, custom-styled (2px solid `var(--color-timber)`, 2px offset). Never `outline: none` without a replacement.
- Skip navigation link: first focusable element, visually hidden until focused.
- All icon-only buttons: `aria-label` required.
- Modal/drawer: focus trap with `tabindex` management. `aria-modal="true"`. Escape key closes.
- Form labels: every `<input>` has a corresponding `<label>`. No placeholder-as-label.
- `aria-live="polite"` region for cart count updates, form submission feedback, variant availability changes.
- Keyboard navigation: all interactive elements reachable and operable by keyboard.
- Images: decorative images `alt=""`. Informational images descriptive alt text.

---

## 9. Responsive & Mobile Experience

- Breakpoints: `480px`, `768px`, `1024px`, `1200px`, `1440px`. No breakpoints between 1200–1440 needed.
- Touch targets: minimum 44×44px for all interactive elements.
- Mobile header: logo centred, hamburger left, cart right.
- Swipe gestures on gallery (CSS scroll snap — no JS swipe library).
- No horizontal scroll on any viewport width.
- Forms: `font-size: 16px` minimum on inputs to prevent iOS zoom-on-focus.
- `viewport` meta: `<meta name="viewport" content="width=device-width, initial-scale=1">` — never disable user scaling.

---

## 10. Shopify-Specific Best Practices

### Liquid Performance
- Avoid `{% for %}` loops over full product catalogues in Liquid. Use paginated collections.
- Limit `product.metafields` calls — batch where possible.
- Use `{% liquid %}` tags for multi-line logic to reduce whitespace in output.
- `{% render %}` over `{% include %}` — `render` has isolated scope, prevents variable bleed.
- Enable `output_html_escaped` in schema settings for all text settings that accept HTML.

### Sections & Blocks
- Maximum flexibility: every visual section is a section file with a schema. Merchants can reorder.
- Use `limit` on blocks where appropriate (e.g., max 6 testimonials, max 4 features).
- Presets: every section has at least one `presets` entry so it appears in the theme editor "Add section" list.
- Section groups: header and footer in `header` and `footer` section groups for editor compatibility.

### Metafields
Document all metafields used. Register definitions in `settings_schema.json`:
| Namespace | Key | Type | Usage |
|-----------|-----|------|-------|
| `custom` | `complementary_product` | Product reference | Cart upsell |
| `custom` | `related_products` | List of product references | PDP cross-sell |
| `custom` | `short_description` | Single-line text | Card subtitle |
| `custom` | `care_instructions` | Multi-line text | Accordion tab |
| `custom` | `ingredient_list` | Multi-line text | Accordion tab (beauty) |

### Apps (Approved, Performance-Audited Only)
Install only what is necessary. Every app is a potential LCP regression.

| Category | App | Notes |
|----------|-----|-------|
| Reviews | Judge.me or Okendo | Async load only |
| Search | Shopify Search & Discovery | Native, free, no JS overhead |
| Email | Klaviyo | Load script in `requestIdleCallback` |
| Analytics | GA4 via GTM | GTM loads deferred |
| Subscriptions | Recharge (if needed) | Audit JS weight before installing |

Disqualify any app that injects synchronous `<script>` tags into `<head>`.

---

## 11. Theme Settings (Global)

Expose in `config/settings_schema.json`:

- **Colours**: All tokens above — merchant-overridable via colour pickers.
- **Typography**: Font family selectors (from curated list), base sizes, heading weights.
- **Layout**: Max container width, section vertical spacing scale (compact / default / spacious).
- **Logo**: Upload, width (px), show text fallback.
- **Favicon**: Upload.
- **Social**: Instagram, Pinterest, Facebook, TikTok URLs.
- **Cart**: Enable cart drawer (yes/no), free shipping threshold, enable gift note.
- **Checkout**: Upsell product handle (for checkout page upsell if Shopify Plus).
- **Announcement bar**: Text, URL, background colour, enable/disable.
- **Currency**: Show currency selector in header/footer.

---

## 12. Quality Assurance Checklist

Run before every deployment. Do not ship until all pass.

### Performance
- [ ] Lighthouse Mobile ≥ 95 (Performance, Accessibility, Best Practices, SEO)
- [ ] Lighthouse Desktop ≥ 95 all categories
- [ ] LCP < 2.0s on mobile (throttled 4G)
- [ ] CLS < 0.05
- [ ] INP < 100ms
- [ ] Total JS (gzipped) < 40KB
- [ ] Total CSS (gzipped) < 20KB
- [ ] No render-blocking resources in PageSpeed Insights
- [ ] All images have `width` + `height` attributes
- [ ] No images above 200KB (WebP at quality 75–80)

### Functionality
- [ ] Add to cart works: single variant, multi-variant, sold out state
- [ ] Cart drawer opens, updates quantity, removes items, closes
- [ ] Variant switching updates price, images, availability without page reload
- [ ] Collection filters update URL and results without page reload
- [ ] Search returns results, handles zero-results state gracefully
- [ ] All forms validate and submit correctly
- [ ] Newsletter signup integrates with email platform
- [ ] Checkout flow complete (test with real card in staging)

### Accessibility
- [ ] axe DevTools zero critical errors on all page templates
- [ ] Keyboard navigation: tab through all interactive elements
- [ ] Screen reader test: NVDA/VoiceOver on product page and cart flow
- [ ] All images have meaningful alt text
- [ ] Focus styles visible on all interactive elements

### SEO
- [ ] Google Rich Results Test: Product structured data valid
- [ ] All pages have unique `<title>` and meta description
- [ ] No duplicate `<h1>` tags
- [ ] Canonical tags present on paginated pages
- [ ] Sitemap accessible at `/sitemap.xml`
- [ ] `robots.txt` correct
- [ ] Open Graph tags on all pages (title, description, image)

### Visual / Brand
- [ ] All sections render correctly at 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll at any viewport
- [ ] Hover and focus states consistent across all interactive elements
- [ ] Brand colour tokens consistent — no hardcoded colours anywhere
- [ ] Animations respect `prefers-reduced-motion`
- [ ] All fonts loading correctly — no FOIT visible

### Cross-browser
- [ ] Chrome (latest), Safari (latest), Firefox (latest)
- [ ] iOS Safari 15+, Chrome Android
- [ ] Test on real iOS device (Safari rendering differs from simulator)

---

## 13. Deployment & Handoff

- Theme code lives in a **private GitHub repository**. Each environment (staging, production) is a separate Shopify theme.
- Use **Shopify CLI 3.x** for local development (`shopify theme dev`).
- PR review before any push to production theme.
- Use Shopify's **Theme Inspector** Chrome extension to profile Liquid render time.
- Document all metafields, custom settings, and app dependencies in a `/docs/SETUP.md` within the repo.
- Provide merchant with a **Theme Editor guide** (Loom video + written reference) for all content-managed sections.

---

*All decisions in this document serve one goal: a Monni customer who opens the site on a phone in a café queue finds something that feels as quiet, considered, and beautiful as the store itself — and leaves having found what they came for.*
