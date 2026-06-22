# Breadcrumb metafields — setup & troubleshooting

Taxonomy-driven breadcrumbs ship in `snippets/breadcrumb-taxonomy.liquid`. The theme works **without** metafields today (via `collection:` tags and a hardcoded parent map), but metafields are the long-term source of truth.

---

## Metafield definitions (create once in Shopify Admin)

**Settings → Custom data**

### 1. Collection: `custom.parent_collection`

| Field | Value |
|-------|-------|
| Name | Parent collection |
| Namespace and key | `custom.parent_collection` |
| Type | Collection reference |
| Owner | Collection |

Points a sub-collection at its parent, e.g. **Rings** → **All Jewellery** (`all-jewellery`).

### 2. Product: `custom.primary_collection`

| Field | Value |
|-------|-------|
| Name | Primary collection |
| Namespace and key | `custom.primary_collection` |
| Type | Collection reference |
| Owner | Product |

The canonical category for a product, e.g. a ring → **Rings** (`rings`).

---

## How the theme resolves breadcrumbs

### Product pages (visible: `Home / [parent] / [primary]` — no product title)

Priority for **primary** (deepest category):

1. `product.metafields.custom.primary_collection`
2. URL `collection` (when reached via `/collections/…/products/…`)
3. `collection:{handle}` tags on the product (prefers sub-collections)
4. `product.collections` (most specific non-merchandising collection wins)

Priority for **parent**:

1. `primary_collection.metafields.custom.parent_collection`
2. Hardcoded handle map in `breadcrumb-taxonomy.liquid` (fallback only)

### Collection pages (visible: `Home / [parent] / [current collection]`)

- **Primary** = current collection
- **Parent** = `collection.metafields.custom.parent_collection`, then handle map fallback

### Excluded handles (never appear in trail)

`new-arrivals`, `sale`, `bestsellers`, `gift-guide`

---

## Canonical parent map (for backfill reference)

Sub-collection handle → parent collection handle:

| Sub-collections | Parent handle | Admin title |
|-----------------|---------------|-------------|
| `monni-tea`, `tea`, `aromatherapy`, `supplements` | `wellness` | All Wellness |
| `monni-botanicals`, `face`, `body`, `hair`, `fragrance`, `mother-and-baby` | `beauty` | All Beauty |
| `monni-label`, `dresses`, `tops`, `pants`, `skirts`, `shorts`, `jumpsuits`, `kimonos`, `loungewear` | `clothing` | All Clothing |
| `fine-jewellery`, `necklaces`, `earrings`, `rings`, `bracelets` | `all-jewellery` | All Jewellery |
| `monni-art`, `ceramics`, `crystals-and-rituals`, `homewares`, `teaware`, `pantry` | `all-home` | All Home |
| `giftboxes`, `cards`, `gift-card` | `all-gifting` | All Gifting |

Source of truth for catalogue copy/hierarchy: `monni-knowd/scripts/collections-data.mjs`  
Product → collection mapping script: `scripts/map-products-to-collections.mjs`

---

## Backfill checklist

### Collections (~30 min)

For each sub-collection in the table above, set **Parent collection** to the parent row.

Example: open **Rings** → Custom data → Parent collection → **All Jewellery**.

### Products (bulk)

Each product needs **Primary collection** = its deepest sub-category (e.g. Rings, Monni Botanicals, Face).

Options:

- **Manual** — fine for edge cases and new products
- **Bulk editor** — Products → select → Columns → add metafield column
- **Script** — extend `scripts/map-products-to-collections.mjs` to write `custom.primary_collection` via Admin API (uses same inference as `collection:` tags)

After backfill, the hardcoded parent map in the theme is ignored for any collection that has `parent_collection` set.

---

## Troubleshooting

### Only "Home" shows

| Cause | Fix |
|-------|-----|
| Product has no metafield, no `collection:` tags, not in any collection | Set `primary_collection` or run mapping script |
| Product only in merchandising collection | Assign to a taxonomy collection; merchandising handles are excluded |
| Direct `/products/…` URL with no tags | Set `primary_collection` metafield |

### Wrong category (e.g. shows parent instead of sub-collection)

| Cause | Fix |
|-------|-----|
| `primary_collection` points at parent (e.g. All Beauty) not sub (Monni Botanicals) | Update metafield to deepest sub-collection |
| Multiple `collection:` tags; theme picks most specific | Remove conflicting tags or set metafield (metafield wins) |

### Missing parent (e.g. `Home / Rings` instead of `Home / All Jewellery / Rings`)

| Cause | Fix |
|-------|-----|
| `parent_collection` not set on sub-collection | Set on collection in Admin |
| Parent handle wrong in Admin | Should reference `all-jewellery`, not a typo |

### Breadcrumb differs by entry URL

| Cause | Fix |
|-------|-----|
| Relying on URL/fallback instead of metafields | Set `primary_collection` on product — trail becomes identical everywhere |

### Merchandising collection in trail

| Cause | Fix |
|-------|-----|
| `primary_collection` or `parent_collection` set to `new-arrivals` etc. | Clear metafield; excluded handles are stripped automatically |

### JSON-LD errors in Rich Results Test

- Visible link text must match JSON-LD `name` values exactly
- Product pages: final JSON-LD item is product title (no `item` URL) — intentional
- Test: [Google Rich Results Test](https://search.google.com/test/rich-results)

---

## Behaviour reference (by design)

- **Product pages:** category crumbs are links; product title is **not** in the visible trail (H1 names the page)
- **Collection pages:** current collection is plain text with `aria-current="page"`
- **Mobile (<480px):** `Home / … / [primary]` when parent + primary exist
- **Separators:** CSS `::after`, not literal `/` in markup

---

## When you add a new sub-collection

1. Create the Shopify collection
2. Set `custom.parent_collection` → parent
3. Tag products with `collection:{handle}` (or run mapping script)
4. Optionally set `custom.primary_collection` on products
5. If you skip step 2, add the handle to the `case` block in `breadcrumb-taxonomy.liquid` until metafields are set

---

## Related files

| File | Purpose |
|------|---------|
| `snippets/breadcrumb-taxonomy.liquid` | Logic, markup, JSON-LD |
| `sections/product.liquid` | Renders snippet on product |
| `sections/collection.liquid` | Renders snippet on collection |
| `assets/critical.css` | Breadcrumb styles |
| `scripts/map-products-to-collections.mjs` | Product → collection inference |
| `monni-knowd/scripts/collections-data.mjs` | Catalogue hierarchy & copy |
