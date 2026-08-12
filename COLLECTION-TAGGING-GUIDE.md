# MONNI Collection Tagging Guide

This guide explains how collections are structured on the MONNI website, how top/bottom copy works, and how to assign products to the right collection in Shopify Admin (and via Lightspeed if your inventory syncs product fields to Shopify).

## How collection pages work

Each collection page has **two pieces of copy**:

| Position | Field in Shopify | What it looks like |
|----------|------------------|-------------------|
| **Top of page** (above products) | Metafield `monni.top_line` | One short line in fine, elegant type |
| **Bottom of page** (below products) | Metafield `monni.bottom_intro` | Full category introduction for SEO and customers who want to read more |

Copy is managed in [`monni-knowd/scripts/collections-data.mjs`](monni-knowd/scripts/collections-data.mjs) and synced to Shopify with:

```bash
SHOPIFY_ADMIN_TOKEN=... node monni-knowd/scripts/seed-collections.mjs
```

**We did not automatically assign products to collections.** Empty collections will show “No products found” until you add products manually. This avoids mis-categorisation.

---

## Site structure — 6 main categories

| Category | Parent collection handle | URL |
|----------|-------------------------|-----|
| Wellness | `wellness` | `/collections/wellness` |
| Beauty | `beauty` | `/collections/beauty` |
| Clothing | `clothing` | `/collections/clothing` |
| Jewellery | `all-jewellery` | `/collections/all-jewellery` |
| Home | `all-home` | `/collections/all-home` |
| Gifting | `all-gifting` | `/collections/all-gifting` |

Each parent has sub-collections listed in the mega menu under **Shop**.

### Bespoke & Corporate Gifting (pages, not collections)

These are **custom pages**, not product grids:

| Page | URL |
|------|-----|
| Bespoke Gifting | `/pages/bespoke-gifting` |
| Corporate Gifting | `/pages/corporate-gifting` |

Contact: hello@teaandtonic.co.nz | 09 422 9083

---

## Full collection reference

### Wellness

| Title | Handle | URL |
|-------|--------|-----|
| All Wellness | `wellness` | `/collections/wellness` |
| Monni Tea | `monni-tea` | `/collections/monni-tea` |
| Tea | `tea` | `/collections/tea` |
| Aromatherapy | `aromatherapy` | `/collections/aromatherapy` |
| Sleep | `sleep` | `/collections/sleep` |
| Supplements | `supplements` | `/collections/supplements` |

### Beauty

| Title | Handle | URL |
|-------|--------|-----|
| All Beauty | `beauty` | `/collections/beauty` |
| Monni Botanicals | `monni-botanicals` | `/collections/monni-botanicals` |
| Face | `face` | `/collections/face` |
| Body | `body` | `/collections/body` |
| Hair | `hair` | `/collections/hair` |
| Fragrance | `fragrance` | `/collections/fragrance` |
| Mother & Baby | `mother-and-baby` | `/collections/mother-and-baby` |

### Clothing

| Title | Handle | URL |
|-------|--------|-----|
| All Clothing | `clothing` | `/collections/clothing` |
| MONNI Label | `monni-label` | `/collections/monni-label` |
| Dresses | `dresses` | `/collections/dresses` |
| Tops | `tops` | `/collections/tops` |
| Pants | `pants` | `/collections/pants` |
| Skirts | `skirts` | `/collections/skirts` |
| Shorts | `shorts` | `/collections/shorts` |
| Jumpsuits | `jumpsuits` | `/collections/jumpsuits` |
| Kimonos | `kimonos` | `/collections/kimonos` |
| Loungewear | `loungewear` | `/collections/loungewear` |

### Jewellery

| Title | Handle | URL |
|-------|--------|-----|
| All Jewellery | `all-jewellery` | `/collections/all-jewellery` |
| Fine Jewellery | `fine-jewellery` | `/collections/fine-jewellery` |
| Necklaces | `necklaces` | `/collections/necklaces` |
| Earrings | `earrings` | `/collections/earrings` |
| Rings | `rings` | `/collections/rings` |
| Bracelets | `bracelets` | `/collections/bracelets` |

### Home

| Title | Handle | URL |
|-------|--------|-----|
| All Home | `all-home` | `/collections/all-home` |
| Monni Art | `monni-art` | `/collections/monni-art` |
| Ceramics | `ceramics` | `/collections/ceramics` |
| Crystals & Rituals | `crystals-and-rituals` | `/collections/crystals-and-rituals` |
| Homewares | `homewares` | `/collections/homewares` |
| Home Care | `home-care` | `/collections/home-care` |
| Teaware | `teaware` | `/collections/teaware` |
| Pantry | `pantry` | `/collections/pantry` |

### Gifting

| Title | Handle | URL |
|-------|--------|-----|
| All Gifting | `all-gifting` | `/collections/all-gifting` |
| Gift Boxes | `giftboxes` | `/collections/giftboxes` |
| Cards | `cards` | `/collections/cards` |
| Online Gift Card | `gift-card` | `/collections/gift-card` |

---

## Legacy handle map (redirects)

If old URLs still receive traffic, add **301 redirects** in Shopify Admin → Online Store → Navigation → URL Redirects:

| Old handle | New canonical handle |
|------------|---------------------|
| `body-care` | `body` |
| `body` | `body-care` (live Body collection — `/collections/body` 404s) |
| `bracelet` | `bracelets` (legacy singular handle — now redirected) |
| `bottoms` | `pants` |
| `home-living` | `homewares` |
| `bracelet` | `bracelets` |
| `sacred-rituals` | `crystals-and-rituals` |
| `art` | `monni-art` (if Monni Art products only) |
| `giftboxes` (as parent) | `all-gifting` (parent nav now uses `all-gifting`) |

The `giftboxes` collection still exists for Gift Boxes products — only the **parent category nav** points to `all-gifting`.

---

## How to assign products in Shopify Admin

**Important:** Many shop collections are still **automated (smart)** collections. For those, Shopify will **not** let you manually “Add to collection” — membership is controlled by **tags** (and sometimes product type/vendor).

| Collection | Handle | Type | How a product gets in |
|------------|--------|------|------------------------|
| All Wellness | `wellness` | Manual | Add to collection in Admin, **or** run the mapping script |
| Aromatherapy | `aromatherapy` | Smart | Exact tag: `Aromatherapy` |
| Body | `body-care` | Smart | Exact tag: `Body` |
| Face | `face` | Smart | Exact tag: `Face` (capital F) |
| Hair | `hair` | Smart | Exact tag: `hair` (lowercase) |
| Mother & Baby | `mother-and-baby` | Smart | Exact tag: `Mother & Baby` |
| All Beauty | `beauty` | Smart | Tag `Beauty` (or other beauty rule tags) |
| Tops | `tops` | Smart | Exact tag: `Top` or `Tops` (product type alone is not enough) |
| Brand collections (e.g. The Knitter) | brand handle | Manual | On the product: **Collections → Add to collection**. Tags like `theknitter` do nothing for brand pages. |

### For smart collections (Body, Aromatherapy, Face, etc.)

1. Open the product in **Products**.
2. In **Tags**, add the exact trigger tag (case matters).
3. Save — the product appears in the collection automatically.
4. Do **not** try to drag it into the collection from the collection page; Shopify blocks that for smart collections.

### For manual collections (All Wellness, brand collections like Nara, Monni Tea, etc.)

1. Go to **Products** → open a product.
2. Scroll to **Collections**.
3. Click **Add to collection** and select the collection.
4. Save.

A product can belong to **multiple collections** (e.g. an essential roller in both `Aromatherapy` / `Body` via tags **and** `All Wellness` via manual membership).

### Lightspeed → Shopify (easiest ongoing path)

Keep using tags — that is the system of record for smart collections:

| In Lightspeed / Shopify | Effect |
|-------------------------|--------|
| Tag `Aromatherapy` | Lands in Aromatherapy |
| Tag `Body` | Lands in Body |
| Tag `Face` | Lands in Face |
| Tag `Hair` (or legacy `hair`) | Lands in Hair |
| Tag `Mother & Baby` | Lands in Mother & Baby |
| Tag `Sleep` (or legacy `sleep`) | Lands in Sleep |
| Tag `Gift Boxes` (or legacy `gift box`) | Lands in Gift Boxes |
| Tag `Wellness` + add to `All Wellness` (manual) | Parent wellness grid |
| Product type / title cues | Mapping script can infer tags on sync |

After Lightspeed syncs new products, run:

```bash
SHOPIFY_ADMIN_TOKEN=... SHOPIFY_STORE=tea-tonic-matakana.myshopify.com \
  node scripts/map-products-to-collections.mjs --dry-run
# then without --dry-run when the preview looks right
```

The script:
- Infers one or more categories from tags/type/title (supports dual like Body + Aromatherapy)
- Adds the exact smart-collection trigger tags
- Adds products to **manual** parent collections (`wellness`, `clothing`, etc.)
- Writes `PRODUCT-COLLECTION-MANUAL-REVIEW.md` if anything is unclear

**Sold-out products:** smart collections used to also require inventory > 0 (so OOS items vanished and could not be “added”). That inventory gate has been removed for Body, Aromatherapy, Hair, Supplements, Ceramics, Art, and Gift Boxes so tagged products still appear when out of stock.

---

## Suggested tagging conventions (Lightspeed / bulk import)

If you manage inventory in **Lightspeed** (or another system) that syncs to Shopify, use consistent **Vendor**, **Product type**, and **Tags** so staff know which collection each product belongs in.

### Brand-led collections (assign by Vendor)

| Vendor in Shopify | Target collection |
|-------------------|-------------------|
| Monni Botanicals | `monni-botanicals` |
| MONNI Label | `monni-label` |
| Monique Jansen Art | `monni-art` |

### Optional product tags (for import workflows)

Use tags in the format `collection:{handle}` if your sync tool maps tags to collections:

| Tag | Collection |
|-----|------------|
| `collection:tea` | Tea |
| `collection:face` | Face |
| `collection:dresses` | Dresses |
| `collection:necklaces` | Necklaces |
| `collection:ceramics` | Ceramics |
| `collection:giftboxes` | Gift Boxes |

These tags are **operational** — smart collections on the live store match them. Prefer exact tags above over inventing new ones.

### Product type examples

| Product type | Likely collection(s) |
|--------------|---------------------|
| Face Oil | `face`, `beauty` |
| Body Balm | `body`, `beauty` |
| Dress | `dresses`, `monni-label`, `clothing` |
| Necklace | `necklaces`, `all-jewellery` |
| Gift Box | `giftboxes`, `all-gifting` |

When unsure, leave the product out of the sub-collection and add it to the parent only (`beauty`, `wellness`, etc.) until you confirm placement.

---

## What Knowd did / did not do

**Done:**
- Created or updated 41 collections with client-approved top/bottom copy
- Added theme support for top line above grid and bottom intro below grid
- Updated shop navigation to match the new hierarchy
- Created Bespoke Gifting and Corporate Gifting pages

**Not done originally (by design at seed time):**
- No bulk product moves between collections on first seed
- Copy seed did not convert legacy smart collections to manual
- Live store still uses smart rules for Body, Aromatherapy, Face, Hair, etc. — membership is tag-driven

**Fixed Jul 2026:**
- Removed `inventory > 0` AND-gates on key smart collections (OOS products with the right tag now appear)
- Re-ran product→collection mapping (tags + manual parent memberships)
- Mapping script now supports multi-category tags (e.g. Body + Aromatherapy)

---

## Re-syncing copy after edits

1. Edit copy in `monni-knowd/scripts/collections-data.mjs`
2. Run: `SHOPIFY_ADMIN_TOKEN=... node monni-knowd/scripts/seed-collections.mjs`
3. Or sync a single collection: `--only=face,tea`

For gifting pages: `node monni-knowd/scripts/seed-gifting-pages.mjs`
