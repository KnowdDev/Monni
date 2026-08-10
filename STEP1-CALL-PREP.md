# Monni Step 1 — Delivery Summary & Call Prep

**Prepared for:** Catch-up with Mark (business advisor) and Monique  
**Date:** 17 June 2026  
**Agency:** Knowd (Lex)  
**Client:** Monique Jansen / Monni (trading as Tea & Tonic, transitioning to MONNI)  
**Live store:** [teaandtonic.co.nz](https://teaandtonic.co.nz)  
**Theme:** `monni-knowd` — custom build on Shopify Skeleton Theme v1.0.0

---

## Executive summary (30-second version)

Knowd has delivered a **fully custom Shopify theme** from scratch — not a commercial theme, not Dawn — with luxury e-commerce UX (cart drawer, wishlist, shop mega-menu, brands directory, maker profiles, size guide, and a curated homepage). **Page speed is excellent:** Lighthouse **95 mobile / 99 desktop** (current).

At Monique's direction, the project **pivoted from the agreement's Next.js/Vercel headless approach to a native Shopify theme** on her existing Shopify Basic plan. All catalogue, content, and configuration work was done **manually in Shopify Admin** — products, collections, brand profiles, legal policies, redirects, and tracking setup.

A major piece of work not in the original agreement: **collection reorganisation**. The store had hundreds of overlapping collections; we worked with Monique to consolidate these into a clean, navigable structure and **set up proper 301 redirect URLs** for every retired collection path — a significant SEO win that protects existing Google rankings and link equity.

The **main gap against the agreement** is **attribution & tracking** — GA4 is not yet properly configured for e-commerce event tracking and checkout attribution. Domain migration to monni.co and Squarespace retirement are also still pending.

For the performance dashboard, Knowd proposes **replacing Looker Studio** with a purpose-built **Monni analytics app** — Next.js UI backed by Neon Postgres — that unifies Shopify sales, Google Ads, and GA4 in one place.

---

## Platform pivot (important context for Mark)

| Agreement (Step 1) | What was built |
|---|---|
| New site on **Next.js (Vercel)** | Custom **Shopify theme** on Skeleton base |
| Automated product sync via webhooks | Not needed — products live natively in Shopify |
| monni.co live, Squarespace retired | Still on **teaandtonic.co.nz**; MONNI rebrand in copy, Tea & Tonic logo in header until official migration |
| Vercel infrastructure (~USD $20/mo) | **Not applicable** — Shopify-only stack for the storefront |
| Looker Studio dashboard | **Proposed alternative:** custom Next.js + Neon analytics app (see below) |

**Why this matters for the call:** The core commerce experience is done on Shopify. The headless/Vercel storefront was replaced by a client decision to stay on Shopify — simpler to operate day-to-day. Knowd's Next.js expertise still applies to the proposed analytics platform, not the live storefront.

---

## Step 1 Agreement — deliverable status

| Deliverable | Agreement requirement | Status | Notes |
|---|---|---|---|
| **Site build** | Next.js on Vercel, Shopify-connected | ⚠️ **Pivoted** | Custom Shopify theme built and deployed. Fully functional storefront. |
| **Products migrated** | Full Tea & Tonic catalogue on Monni | ✅ **Done** | Full catalogue reviewed, organised, and live in Shopify. Clothing products manually tagged for size-guide logic. |
| **Page speed** | LCP < 2.5s, Lighthouse before/after documented | ✅ **Done** | **95 mobile / 99 desktop** Lighthouse. Hero images compressed to WebP, critical CSS inlined, self-hosted fonts, deferred scripts. |
| **Attribution & tracking** | GA4 cross-domain, UTM persistence, Shopify Customer Events pixel, documented locked config | ❌ **Not done** | GA4 not properly configured for e-commerce attribution. Customer Events pixels need manual setup and verification in Shopify Admin. Mark's revenue-share model depends on this. |
| **SEO foundations** | Schema.org, canonicals, sitemap, meta framework, indexable from day one | ✅ **Done** | Structured data, OG/Twitter meta, canonicals, clean collection architecture, 301 redirects on retired URLs. See collection reorganisation below. |
| **monni.co live** | Squarespace retired, domain pointed, 301 redirects | ⚠️ **Partial** | **Collection URL redirects done** in Shopify. Full domain cutover to monni.co and Squarespace retirement still pending. |
| **Tea & Tonic CTA fixes** | Improved CTAs on current site during parallel build | ✅ **Done** | Split-hero LCP fixes, clickable hero panels, homepage category grid with clear collection CTAs. |
| **Performance dashboard** | Looker Studio connected to GA4 + Shopify | ⚠️ **Proposed alternative** | See **Monni Analytics App** proposal below — replaces Looker with a custom platform. |

### Agreement items still outstanding (priority order)

1. **GA4 + Shopify Customer Events** — manual setup in Shopify Admin for e-commerce events (page views, product views, add to cart, purchases) with cross-domain when monni.co launches
2. **UTM persistence through checkout** — required for paid/email channel attribution
3. **Monni Analytics App** — custom dashboard (Neon + Next.js) replacing Looker Studio; unifies Shopify, Google Ads, and GA4
4. **Attribution config locked & documented** — GA4 property ID, model, lookback window, channel definitions (Agreement §5)
5. **Domain migration** — monni.co cutover, Squarespace retirement
6. **One-page handover document** — accounts, access roles, platform notes (Agreement §6)

---

## Collection reorganisation & SEO redirects

**Client-requested work — completed manually in Shopify Admin.**

### The problem

The Tea & Tonic store had **hundreds of collections** — many overlapping, vendor-specific, or legacy paths accumulated over years of trading. This created:

- Confusing navigation for customers
- Diluted SEO authority spread across hundreds of thin collection pages
- Duplicate/overlapping URLs competing for the same search terms
- A catalogue structure that didn't match the MONNI brand direction (6 core categories: Wellness, Beauty, Clothing, Jewellery, Home, Gifts)

### What we did (all manual)

1. **Audited the full collection list** with Monique — reviewed every collection, its products, traffic history, and purpose
2. **Designed a consolidated structure** aligned to the MONNI category model and shop mega-menu
3. **Merged and retired redundant collections** — products moved to the correct parent collections by hand
4. **Created 301 redirect URLs in Shopify** for every retired collection path, pointing to the appropriate new collection or category
5. **Updated navigation, homepage category grid, and shop hub** to reflect the new structure
6. **Verified internal links** across product pages, blog posts, and theme sections point to the new URLs

### SEO impact

This is one of the highest-value pieces of work delivered:

- **Link equity preserved** — old collection URLs that Google had indexed now 301 to the correct destination instead of 404ing
- **Crawl budget improved** — Google crawls fewer thin/duplicate pages, focuses authority on the collections that matter
- **Clearer site architecture** — a logical hierarchy (6 core categories → sub-collections → products) that search engines and customers can both navigate
- **Complements the theme's technical SEO** — structured data, canonicals, and meta tags now sit on top of a clean URL structure rather than a messy one

This work directly addresses the agreement's SEO foundations deliverable and goes well beyond what was scoped.

---

## Everything built — feature inventory

*All theme, content, and Shopify Admin work below was done by hand — design, build, configuration, and content entry.*

### Foundation & architecture

- **Base:** Shopify Skeleton Theme — zero Dawn/commercial theme bloat. All Liquid, CSS, and JS written custom.
- **43 custom sections**, **23 snippets**, **21 templates**, **12 JavaScript modules**
- **Vanilla JS only** — no jQuery, no React/Vue on the storefront. Custom Element for cart drawer.
- **Section/block architecture** — merchant-editable via Shopify theme editor
- **Design system:** CSS custom properties for colours, spacing, typography (Japanese-Scandinavian aesthetic)
- **Typography:** Self-hosted Cormorant Garamond (editorial) + Jost (UI) — no Google Fonts on homepage

---

### Homepage (8 sections live)

| Section | What it does |
|---|---|
| **Split hero** | Full-width 50/50 clickable panels (Clothing + Home). LCP-optimised WebP images with priority loading. |
| **Opening statement** | Brand manifesto — "It begins with love…" |
| **Category grid** | 6 tiles: Wellness, Beauty, Clothing, Jewellery, Home, Gifts — each with image, description, link |
| **Our Own Creations** | 3 columns: Monni Botanicals, Monni Label, Monni Art |
| **Seasonal spotlight** | Editorial feature card (currently Monni Botanicals / spring skincare) |
| **From the Makers** | Maker spotlight (Frolic Ceramics / Vicki Fanning, Matakana) |
| **From the Journal** | 3 curated blog post cards linking to journal articles |
| **Founder quote** | Full-bleed quote + "About MONNI" CTA |

**Additional homepage sections built but not on current index:** single hero, featured products, values blocks, collections grid, lookbook split, Instagram grid, embedded newsletter (v1 + v2).

---

### Navigation & header

- **Sticky header** with centred logo, search, wishlist link, cart icon with live item count
- **Shop mega-menu (desktop):** Full-width panel on hover — 6 category columns with featured collection, plus Brands, New Arrivals, Gift Card links
- **Mobile menu:** Full-screen overlay with nested accordions for shop categories
- **Optional announcement bar** (theme setting, default off)
- **Skip-to-content link** for accessibility

---

### Commerce — product page

- **Two-column layout:** Gallery (55%) + info panel (45%), stacks on mobile
- **Media gallery:** Thumbnails (desktop) / dots (mobile), video loads only when play is clicked
- **Product-type logic:** Different accordions and content for fragrance, beauty, homewares, clothing, jewellery
- **Variant selectors:** Colour swatches + size buttons; unavailable variants disabled
- **Quantity stepper** with inventory-aware max
- **Add to cart → opens cart drawer** with loading and success states
- **Wishlist button** on product page
- **Back-in-stock contact form** for sold-out variants
- **Accordions:** Product details, materials/ingredients, shipping & returns (type-specific)
- **Size guide links** for clothing products
- **Fragrance story block** for scent products
- **Related products** from configured collection
- **Recently viewed** (max 6 items, saved in browser)
- **Product structured data** for Google rich results

---

### Commerce — collection & search

- **Collection page:** Breadcrumb, description, product count, filter drawer (mobile + desktop), sort, pagination
- **Product cards:** 3:4 aspect ratio, hover second image, badges (New / Sale / Low stock), quick-add, wishlist heart
- **Filters update the page URL** — shareable, crawlable
- **Search results page**
- **All-collections listing page**

---

### Cart drawer

- **Slide-in from right** — primary cart experience, no full-page redirect
- **Line items:** Image, title, variant, price, quantity stepper, remove
- **Quantity updates in the background** — page doesn't reload
- **Free shipping progress bar** (threshold set in theme settings)
- **Expandable gift note** field
- **Checkout button** + express checkout (Shop Pay, Apple Pay, Google Pay)
- **"Secure checkout" trust line**
- **Full keyboard and screen reader support** — focus trap, escape to close

---

### Wishlist

- **Wishlist saved in the browser** — persists across visits on the same device
- **Heart icon** on product cards (visible on hover) and product page
- **Dedicated wishlist page** at `/pages/wishlist`
- **Add/remove without leaving the page**

---

### Brands (manually built in Shopify)

- **38 brand profiles** — each manually created in Shopify with name, tagline, editorial story, hero image, and linked collection
- **`/pages/brands`** — A–Z filter, live search, grid with "Discover the brand" links
- **Individual brand pages** — hero, story, "Shop [brand]" button, product grid
- Brands include: Absolute Essential, Artemis, Frolic Ceramics, Maryse, Amber & Gold, Charlotte Penman, and 32 others
- All brand copy written by hand — not templated or bulk-generated

---

### Makers (manually built in Shopify)

- **Makers directory** — grid of maker profiles with portrait, location, bio excerpt
- **Individual maker pages** — profile + their products
- **"Made by [maker]"** callout on relevant product pages
- Homepage maker spotlight (Frolic Ceramics)

---

### Content pages

| Page | Features |
|---|---|
| **About MONNI** | Long-form brand story, image gallery, values, founder pepeha + letter, visit-us details, featured products |
| **Shop hub** | Category entry point (6 tiles), brands strip, editorial links (new arrivals, gift card, brands) |
| **Size guide** | Tabbed clothing size tables, measuring guide, link back to the product you came from |
| **Contact** | Contact form, store hours, address, phone, email, social links |
| **Wishlist** | Saved items grid |
| **Journal (blog)** | Article listing + single post layout with featured image |
| **Legal policies** | Privacy, Terms, Refund, Contact — NZ-compliant copy written and entered manually in Shopify |
| **404** | Branded not-found page |
| **Password** | Store password page with optional newsletter |

---

### Footer

- **4 columns:** Brand/contact, Explore (shop links), Help (size guide, shipping, policies), Follow (social)
- **Embedded newsletter signup** on every page
- **Social links:** Instagram, Facebook
- **Payment icons**
- **Store hours, phone, email**

---

### Newsletter & email capture

- **Footer signup** on every page
- **Homepage scroll-triggered popup** (loads after page is idle — doesn't affect speed scores)
- **Password page newsletter** option
- **Email templates designed** (welcome, product promos, carousel email) — ready for Mailchimp/Klaviyo when needed

---

### Performance optimisations (Lighthouse 95 mobile / 99 desktop)

| Optimisation | What we did |
|---|---|
| **Hero image priority loading** | Preload the largest homepage image so it appears instantly |
| **Critical CSS inlined** | Above-the-fold styles embedded directly in the page — no render-blocking stylesheet for the hero |
| **Non-blocking CSS** | Full stylesheet loads asynchronously after first paint |
| **Self-hosted fonts** | Cormorant + Jost served from the theme — no external font requests on homepage |
| **WebP images** | All hero and product images compressed and served in modern WebP format |
| **Responsive images** | Every image has multiple sizes — browser picks the right one for the screen |
| **Conditional scripts** | JavaScript only loads on pages that need it; homepage defers non-essential scripts |
| **Deferred tracking pixels** | Strategy documented for loading GA4/Meta after page is interactive — protects Lighthouse scores |
| **Cart drawer** | No full-page reload on add-to-cart — instant feedback |
| **Scroll animations** | Fade-in on scroll; disabled for users who prefer reduced motion |
| **Accessibility** | Skip link, keyboard navigation, screen reader labels, 44px touch targets |

---

### SEO & structured data

- **Meta tags:** Unique page titles, descriptions, canonical URLs on every page
- **Open Graph + Twitter cards** — social sharing previews with product price on product pages
- **Structured data:** Organization, Website, and Product schema for Google rich results
- **Semantic HTML:** One heading per page, crawlable collection descriptions, image alt text on everything
- **Breadcrumbs** on collection and wishlist pages
- **Auto-generated sitemap** at `/sitemap.xml`
- **Collection reorganisation + 301 redirects** — see dedicated section above

---

### Tracking (not yet fully deployed)

Known tracking on teaandtonic.co.nz:

| Platform | Status |
|---|---|
| **Google Analytics / Google Ads** | App pixel installed — needs replacement with performance-optimised custom pixel in Shopify Customer Events |
| **Facebook / Meta** | App pixel installed — same, needs deferred custom pixel setup |
| **Mailchimp** | App pixel installed — recommended disconnect to improve page speed; email tracking handled separately |

**Next step:** Manually configure deferred custom pixels in Shopify Admin → Settings → Customer events. These fire e-commerce events (page views, product views, add to cart, purchases) without blocking page load. GA4 property ID and cross-domain settings to be locked per Agreement §5 once configured.

**Removed from new theme:** Hotjar tracking (was on old theme — removed for performance).

---

## Proposed: Monni Analytics App (replaces Looker Studio)

The Step 1 agreement specifies a **Looker Studio dashboard** connected to GA4 and Shopify. Knowd proposes a better alternative that serves the same purpose — and more — for the revenue-share reporting model.

### Why not Looker Studio?

| Looker Studio | Monni Analytics App |
|---|---|
| Generic Google tool — not built for Monni's attribution model | Purpose-built for Monni's new/returning customer + channel classification logic |
| Limited Shopify integration (manual connectors, laggy refresh) | Direct Shopify data — orders, customers, revenue, AOV in real time |
| No Google Ads integration without complex setup | Google Ads spend and ROAS alongside sales data |
| Read-only — can't action insights | Foundation for future features (campaign alerts, monthly reports, revenue-share auto-calculation) |
| Another platform login for Monique and Mark | Single branded dashboard at a Monni/Knowd URL |
| Free but limited | Runs on Neon (free tier) + Vercel (existing Knowd infrastructure) — negligible cost |

### What we'd build

**Stack:** Next.js UI · Neon Postgres · Vercel hosting

**Data sources unified in one dashboard:**

1. **Shopify** — orders, revenue, AOV, conversion rate, new vs returning customers (via `orders_count`), product performance, collection performance
2. **Google Analytics 4** — traffic, sessions, channel attribution, UTM source/medium, landing pages, e-commerce funnel
3. **Google Ads** — spend, clicks, impressions, ROAS, campaign performance

**Core views:**

- **Revenue overview** — daily/weekly/monthly revenue, AOV, order count, trend vs prior period
- **Channel attribution** — organic, direct, email, paid social, paid search — mapped to Agreement §5 channel definitions
- **New vs returning** — customer classification per revenue-share rules (8% new / 4% returning)
- **Paid performance** — Google Ads spend vs attributed revenue, ROAS by campaign
- **Email contribution** — traffic and revenue from `utm_medium=email` campaigns
- **Monthly revenue-share report** — auto-calculated per Agreement §4, exportable for invoicing

**How data flows:**

- Shopify order data synced daily (webhook or scheduled pull) into Neon
- GA4 Data API pulled on schedule for traffic and attribution metrics
- Google Ads API pulled on schedule for spend and campaign data
- Neon stores normalised, queryable history — not dependent on any third-party dashboard tool
- Next.js frontend renders charts, tables, and the monthly report

**Access:** Monique and Mark get login credentials. Data is never gated through Knowd — full transparency per Agreement §6.

**Timeline estimate:** 2–3 weeks after GA4 is properly configured (analytics app depends on clean source data).

**Agreement alignment:** Fulfils the "Performance dashboard" deliverable. Requires a brief written amendment to swap Looker Studio for the custom app — email confirmation from both parties is sufficient per Agreement §8.

---

## Bonus work — out of scope (not in Step 1 agreement)

| Feature | Why it's bonus |
|---|---|
| **Custom Shopify theme (vs headless Next.js)** | Agreement specified Next.js/Vercel. Staying on Shopify was client-directed; the theme build is substantially more work than connecting a headless frontend. |
| **Collection reorganisation + 301 redirects** | Client-requested. Hundreds of collections consolidated to a clean structure with redirect URLs for every retired path — major SEO work, not in agreement. |
| **38-brand directory** | Full brand pages with hand-written editorial copy, A–Z search, individual profile pages — not in agreement |
| **Makers system** | Maker directory, profiles, product linking — not in agreement |
| **Wishlist** | Full wishlist UX on cards, product page, and dedicated page — not in agreement |
| **Recently viewed products** | Saved in browser, max 6 items — not in agreement |
| **Shop mega-menu** | 6-category desktop panel + mobile accordions — not in agreement |
| **Shop hub page** | Curated category entry point with brands strip — not in agreement |
| **Size guide** | Tabbed clothing tables, back-to-product flow — not in agreement |
| **About MONNI page** | Full brand story, founder letter, pepeha, visit-us — not in agreement |
| **Homepage (8 custom sections)** | Split hero, category grid, creations, seasonal, makers, journal, founder — not in agreement |
| **Product-type logic** | Different UX for fragrance/beauty/clothing/jewellery/homewares — not in agreement |
| **Back-in-stock form** | Sold-out variant contact capture — not in agreement |
| **Fragrance story block** | Editorial content for scent products — not in agreement |
| **Newsletter popup** | Scroll-triggered homepage capture — not in agreement |
| **NZ legal policies** | Privacy (Act 2025), Terms, Refund, Contact — written and entered manually — not in agreement |
| **Brand foundation & theme spec** | Voice guide, 527-line build specification, Lighthouse audit documentation — not in agreement |
| **Email templates** | Welcome, product promo, carousel emails designed — not in agreement |
| **MONNI rebrand preparation** | Logo reserved, copy updated, legal entity "Tea & Tonic, operating as MONNI" — not in agreement |
| **Performance: 95/99 Lighthouse** | Agreement target was LCP < 2.5s; achieving 95+ mobile exceeds spec |
| **Monni Analytics App proposal** | Replaces Looker Studio with a superior custom platform — proposed, not yet built |

---

## Suggested talking points for the Mark call

### Lead with wins

> "The storefront is live and performing exceptionally — 95 mobile, 99 desktop Lighthouse. We've built a fully custom theme from scratch on Shopify with cart drawer, wishlist, a 38-brand directory, maker profiles, size guide, and a curated homepage. Monique chose to stay on Shopify rather than the headless approach in the original agreement, which gives her a simpler platform to manage. We also reorganised the collections — there were hundreds of overlapping ones — consolidated them into a clean structure and set up 301 redirects for every retired URL. That's a significant SEO improvement."

### Be transparent on gaps

> "The main outstanding item is attribution and tracking — GA4 isn't properly configured yet for e-commerce event tracking. That's the blocker for the revenue-share reporting model. Domain migration to monni.co is also still ahead of us, though the collection URL redirects are already in place."

### Propose the analytics app instead of Looker

> "Rather than Looker Studio, we'd like to propose building a purpose-built Monni analytics dashboard — Next.js front end, Neon database — that brings Shopify sales, Google Ads, and GA4 together in one place. It's built specifically for your attribution model: new vs returning customers, channel classification, monthly revenue-share calculations. It's more useful than Looker, costs essentially nothing to run, and Monique and you get direct login access. Happy to walk through what that looks like."

### Frame the pivot positively

> "Staying on Shopify means Monique manages products directly in Admin, no separate infrastructure to maintain for the storefront. The Next.js work shifts to the analytics platform — which is where the ongoing value for the revenue-share arrangement actually lives."

### Bonus value

> "Beyond the agreement, we've done the collection cleanup and redirects, built 38 brand profiles with hand-written copy, a makers system, wishlist, recently viewed, size guide, full About page, NZ-compliant legal policies, and an 8-section homepage. The collection reorganisation alone is the kind of work that typically gets overlooked but has real long-term SEO impact."

### Propose next steps

1. Configure GA4 + deferred custom pixels in Shopify Customer Events (manual setup + verification)
2. Lock attribution config per Agreement §5 (property ID, model, channels)
3. Build Monni Analytics App (Neon + Next.js) — brief agreement amendment to swap Looker Studio
4. Plan monni.co domain cutover (collection redirects already done)
5. Deliver one-page handover document

---

## Revenue share context (for Mark)

Per Agreement §4 (Option B):

| Revenue type | Rate |
|---|---|
| New customer — organic/direct/email/unpaid social | 8% |
| Returning customer — organic/direct/email/unpaid social | 4% |
| Any customer — paid ad attributed | 4% |
| Wholesale/offline/manual | 0% |

- **Year 1 cap:** NZD $1,200 + GST/month
- **Minimum:** NZD $350 + GST/month for first 6 months post-launch
- **Reporting:** Monthly, due by 5th — will be powered by the Monni Analytics App once built
- **Attribution source:** GA4 as single source of truth — **currently blocked by incomplete GA4 setup**
- **Customer classification:** Shopify `orders_count` at time of order, cross-referenced with GA4 channel data — both feeds will live in the analytics app

---

*Prepared 17 June 2026. GA4/tracking status should be re-verified in Shopify Admin before the call if changes have been made since this document was written.*
