#!/usr/bin/env node
/**
 * Map active Shopify products to canonical MONNI collections + apply collection: tags.
 * Usage: SHOPIFY_ADMIN_TOKEN=... SHOPIFY_STORE=tea-tonic-matakana.myshopify.com node scripts/map-products-to-collections.mjs [--dry-run]
 */

const STORE = process.env.SHOPIFY_STORE || 'tea-tonic-matakana.myshopify.com';
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const DRY_RUN = process.argv.includes('--dry-run');
const API = `https://${STORE}/admin/api/2024-10`;

if (!TOKEN) {
  console.error('Set SHOPIFY_ADMIN_TOKEN');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function shopify(path, { method = 'GET', body } = {}) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: {
        'X-Shopify-Access-Token': TOKEN,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 429) {
      const retry = Number(res.headers.get('Retry-After') || 2);
      await sleep(retry * 1000);
      continue;
    }
    const text = await res.text();
    if (!res.ok) throw new Error(`${method} ${path} ${res.status}: ${text.slice(0, 400)}`);
    return text ? JSON.parse(text) : {};
  }
  throw new Error(`Rate limited: ${path}`);
}

async function paginate(path, key) {
  const items = [];
  let url = `${path}${path.includes('?') ? '&' : '?'}limit=250`;
  while (url) {
    const res = await fetch(`${API}${url.replace(API, '')}`, {
      headers: { 'X-Shopify-Access-Token': TOKEN },
    });
    if (!res.ok) throw new Error(`GET ${url} ${res.status}`);
    const data = await res.json();
    items.push(...(data[key] || []));
    const link = res.headers.get('link') || '';
    const next = link.match(/<[^>]*page_info=([^>&]+)[^>]*>;\s*rel="next"/);
    url = next ? `${path.split('?')[0]}?limit=250&page_info=${next[1]}` : null;
    if (url) await sleep(300);
  }
  return items;
}

// Canonical hierarchy from collections-data.mjs / COLLECTION-TAGGING-GUIDE.md
const PARENT_BY_SUB = {
  'monni-tea': 'wellness',
  tea: 'wellness',
  aromatherapy: 'wellness',
  sleep: 'wellness',
  supplements: 'wellness',
  'monni-botanicals': 'beauty',
  face: 'beauty',
  body: 'beauty',
  'body-care': 'beauty', // live smart collection handle (title: Body)
  hair: 'beauty',
  fragrance: 'beauty',
  'mother-and-baby': 'beauty',
  'monni-label': 'clothing',
  dresses: 'clothing',
  tops: 'clothing',
  pants: 'clothing',
  skirts: 'clothing',
  shorts: 'clothing',
  jumpsuits: 'clothing',
  kimonos: 'clothing',
  loungewear: 'clothing',
  'fine-jewellery': 'all-jewellery',
  necklaces: 'all-jewellery',
  earrings: 'all-jewellery',
  rings: 'all-jewellery',
  bracelets: 'all-jewellery',
  'monni-art': 'all-home',
  ceramics: 'all-home',
  'crystals-and-rituals': 'all-home',
  homewares: 'all-home',
  teaware: 'all-home',
  pantry: 'all-home',
  giftboxes: 'all-gifting',
  cards: 'all-gifting',
  'gift-card': 'all-gifting',
};

// Live Shopify handles that differ from our canonical taxonomy handles
const LIVE_HANDLE = {
  body: 'body-care',
  bracelet: 'bracelets',
};

const VENDOR_SUB = {
  'monni botanicals': 'monni-botanicals',
  'monni label': 'monni-label',
  'monique jansen art': 'monni-art',
  'monique jansen': 'monni-art',
  'the herbologist': 'monni-botanicals',
};

// Smart-collection trigger tags (legacy rules still active on store)
const SMART_TAGS = {
  face: ['Face', 'face care'],
  body: ['Body'],
  fragrance: ['Fragrance'],
  // First tag in each list is the exact Shopify smart-collection condition (case-sensitive)
  hair: ['hair', 'Hair'],
  'mother-and-baby': ['Mother & Baby', 'Baby'],
  dresses: ['Dress'],
  tops: ['Top', 'Tops', 'Shirt', 'Camisole', 'Blouse'],
  pants: ['Pants', 'Trousers', 'Culotte', 'Bottoms'],
  skirts: ['Skirt'],
  shorts: ['Shorts'],
  jumpsuits: ['Jumpsuit'],
  kimonos: ['Kimono'],
  loungewear: ['Loungewear', 'Pyjama', 'Pajama', 'Lingerie', 'Underwear'],
  necklaces: ['Necklace'],
  earrings: ['Earrings', 'Earring'],
  rings: ['Ring'],
  bracelets: ['Bracelet'],
  ceramics: ['ceramics', 'Ceramic', 'Pottery'],
  teaware: ['Teaware', 'Tea Pot', 'Teapot', 'Cup', 'Mug'],
  aromatherapy: ['Aromatherapy', 'Essential Oil'],
  sleep: ['sleep', 'Sleep'],
  supplements: ['Supplements', 'Supplement'],
  giftboxes: ['gift box', 'Gift Box'],
  cards: ['Card', 'Greeting Card'],
  'monni-art': ['Art', 'Print'],
  homewares: ['Homewares', 'Home', 'Candle', 'Diffuser', 'Book'],
  'home-care': ['home care', 'Home Care'],
  pantry: ['Pantry', 'Food', 'Honey', 'Chocolate', 'Edible'],
  tea: ['Tea', 'Herbal Tea'],
  'monni-tea': ['Monni Tea', 'Herbal'],
};

function norm(s) {
  return (s || '').toLowerCase().trim();
}

function parseTags(tags) {
  if (Array.isArray(tags)) return tags.map((t) => t.trim()).filter(Boolean);
  return (tags || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

function hasAny(haystack, needles) {
  const h = norm(haystack);
  return needles.some((n) => h.includes(norm(n)));
}

function tagSetIncludes(tags, candidates) {
  const lower = new Set(tags.map((t) => norm(t)));
  return candidates.some((c) => lower.has(norm(c)));
}

function inferSubCollections(product) {
  const title = product.title || '';
  const type = product.product_type || '';
  const vendor = product.vendor || '';
  const tags = parseTags(product.tags);
  const blob = `${title} ${type} ${vendor} ${tags.join(' ')}`;
  const subs = [];
  const reasons = [];

  const addSub = (sub, confidence, reason) => {
    if (!sub || subs.includes(sub)) return;
    subs.push(sub);
    reasons.push(reason);
    return confidence;
  };

  // Jewellery never maps to tea/wellness via fuzzy patterns (chai⊂Chain false positive)
  const isJewellery =
    /jewellery|jewelry|necklace|bracelet|earring|\bring\b/i.test(`${title} ${type}`) ||
    ['jewellery', 'jewelry', 'necklaces', 'bracelets', 'earrings', 'rings'].includes(norm(type));

  // Title/type-strong tea signals override generic legacy tags (e.g. "Yoni tea" tagged Body)
  if (
    !isJewellery &&
    // Word-bound chai — bare /chai/ matched "Chain" and put jewellery into Tea
    (/\btea\b|tisane|infusion|\bchai\b|matcha/i.test(title) || norm(type) === 'tea') &&
    !/teaware|teapot|tea pot|tea cup|tea towel/i.test(blob)
  ) {
    addSub('tea', 'high', 'title/type:tea');
    return { subs, confidence: 'high', reason: reasons.join('+') };
  }

  // Vendor-led brand collections (additive with tag matches below)
  const vendorKey = norm(vendor);
  for (const [v, sub] of Object.entries(VENDOR_SUB)) {
    if (vendorKey.includes(v)) addSub(sub, 'high', `vendor:${vendor}`);
  }

  // All matching smart-collection trigger tags (supports Body + Aromatherapy etc.)
  for (const [handle, tagList] of Object.entries(SMART_TAGS)) {
    if (isJewellery && (handle === 'tea' || handle === 'monni-tea')) continue;
    if (tagSetIncludes(tags, tagList)) {
      const hit = tagList.find((t) => tagSetIncludes(tags, [t]));
      addSub(handle, 'high', `tag:${hit}`);
    }
  }

  // collection: handle tags
  for (const collectionTag of tags.filter((t) => norm(t).startsWith('collection:'))) {
    const handle = collectionTag.split(':').slice(1).join(':').trim();
    const canonical = handle === 'body-care' ? 'body' : handle;
    if (isJewellery && (canonical === 'tea' || canonical === 'monni-tea' || canonical === 'wellness')) continue;
    if (PARENT_BY_SUB[canonical] || ['wellness', 'beauty', 'clothing', 'all-jewellery', 'all-home', 'all-gifting'].includes(canonical)) {
      addSub(canonical, 'high', collectionTag);
    }
  }

  if (subs.length) {
    return { subs, confidence: 'high', reason: reasons.join('+') };
  }

  // Gift card
  if (hasAny(blob, ['gift card', 'e-gift', 'egift']) || norm(type) === 'gift card') {
    return { subs: ['gift-card'], confidence: 'high', reason: 'gift-card' };
  }

  // Product type + title rules
  const rules = [
    [/perfume|eau de parfum|fragrance|cologne|parfum/i, 'fragrance'],
    [/face oil|cleanser|serum|moistur|toner|facial|spf|sunscreen|lip balm|eye cream|mask/i, 'face'],
    [/shampoo|conditioner|hair oil|hair mask|scalp/i, 'hair'],
    [/body oil|body balm|body butter|body cream|body wash|body scrub|soap|deodorant|hand cream|lotion|handwash|nail brush|face cloth|muslin|lube|carrier oil|kernel oil/i, 'body'],
    [/baby|mother|maternity|nappy|nursing|pregnancy|postpartum/i, 'mother-and-baby'],
    [/dress/i, 'dresses'],
    [/jumpsuit|playsuit|romper/i, 'jumpsuits'],
    [/kimono/i, 'kimonos'],
    [/skirt/i, 'skirts'],
    [/shorts/i, 'shorts'],
    [/\bpants\b|trouser|culotte|legging/i, 'pants'],
    // Word-boundary on "top" — bare /top/ matched "Topaz" and put jewellery in Tops/Clothing
    [/\btops?\b|shirt|blouse|camisole|\btee\b|t-shirt|\btank\b/i, 'tops'],
    // Do NOT match bare "night" (e.g. Night Cream) — that put Face products into loungewear/clothing
    [/loungewear|pyjama|pajama|bathrobe|nightwear|nightie|nightdress|\brobe\b/i, 'loungewear'],
    [/necklace|pendant|choker/i, 'necklaces'],
    [/earring|hoop|stud/i, 'earrings'],
    [/\bring\b|signet/i, 'rings'],
    [/bracelet|bangle|cuff/i, 'bracelets'],
    [/fine jewellery|fine jewelry|gold chain|silver chain|14k|18k/i, 'fine-jewellery'],
    [/crystal|ritual|sage|smudge|incense|palo santo/i, 'crystals-and-rituals'],
    [/ceramic|pottery|vase|bowl|plate|mug|cup|teapot|teaware|tea pot/i, 'teaware'],
    [/canvas|print|artwork|painting|poster|art print/i, 'monni-art'],
    [/gift box|gift set|hamper|curated box/i, 'giftboxes'],
    [/greeting card|\bcard\b/i, 'cards'],
    [/essential oil|aromatherapy|diffuser oil|room spray|mist/i, 'aromatherapy'],
    // Sleep before tea/homewares so pillows, sleep sprays, and night blends land correctly
    [/\bsleep\b|sleep spray|eye mask|sleep mask|dreamland|go pillow|pillowcase|elevation pad/i, 'sleep'],
    [/supplement|vitamin|capsule|probiotic|collagen|powder/i, 'supplements'],
    // Word-bound chai — bare /chai/ matched "Chain" (Suitor/Cor Chain → Tea)
    [/\btea\b|infusion|tisane|\bchai\b|matcha|\bherbal\b/i, 'tea'],
    [/honey|jam|chocolate|pantry|food|edible|olive oil|vinegar|spice/i, 'pantry'],
    [/candle|homeware|home decor|throw|blanket|linen towel|diffuser|vessel|pillow|pillowcase|cleaning spray|handwash/i, 'homewares'],
    [/tonic|roll-on|temple|essential oil blend/i, 'aromatherapy'],
    [/brief|underwear|lingerie/i, 'loungewear'],
  ];

  for (const [re, sub] of rules) {
    if (re.test(blob)) return { subs: [sub], confidence: 'medium', reason: `pattern:${sub}` };
  }

  // Broad fallbacks by product_type
  const typeMap = {
    perfume: 'fragrance',
    fragrance: 'fragrance',
    aromatherapy: 'aromatherapy',
    'face oil': 'face',
    skincare: 'face',
    face: 'face',
    soap: 'body',
    body: 'body',
    'body balm': 'body',
    'mother & baby': 'mother-and-baby',
    hair: 'hair',
    dress: 'dresses',
    top: 'tops',
    pants: 'pants',
    skirt: 'skirts',
    necklace: 'necklaces',
    earrings: 'earrings',
    ring: 'rings',
    bracelet: 'bracelets',
    tea: 'tea',
    'gift box': 'giftboxes',
    card: 'cards',
    books: 'homewares',
    pillows: 'homewares',
    clothing: 'loungewear',
  };
  const typeKey = norm(type);
  if (typeMap[typeKey]) return { subs: [typeMap[typeKey]], confidence: 'medium', reason: `type:${type}` };

  return { subs: [], confidence: 'low', reason: 'unclassified' };
}

function liveHandle(handle) {
  return LIVE_HANDLE[handle] || handle;
}

function targetCollections(subs) {
  const targets = [];
  for (const sub of subs) {
    const parent = PARENT_BY_SUB[sub];
    if (parent) targets.push(parent);
    targets.push(liveHandle(sub));
  }
  return [...new Set(targets)];
}

function tagsToAdd(existingTags, subs) {
  const tags = [...existingTags];
  const add = (t) => {
    if (!tags.some((x) => norm(x) === norm(t))) tags.push(t);
  };

  for (const sub of subs) {
    add(`collection:${sub}`);
    const parent = PARENT_BY_SUB[sub];
    if (parent) add(`collection:${parent}`);

    // Legacy smart-collection tags (exact case required by Shopify rules)
    const smart = SMART_TAGS[sub === 'body-care' ? 'body' : sub];
    if (smart && !(sub === 'giftboxes' && existingTags.some((t) => /gift card/i.test(t)))) {
      add(smart[0]);
    }

    if (parent === 'beauty') add('Beauty');
    if (parent === 'wellness') {
      add('Wellness');
      add('All Wellness'); // client-facing tag used on store
    }
  }

  return tags;
}

async function main() {
  console.log(DRY_RUN ? 'DRY RUN — no writes' : 'LIVE — applying changes');

  const [customCollections, smartCollections, products, collects] = await Promise.all([
    paginate('/custom_collections.json', 'custom_collections'),
    paginate('/smart_collections.json', 'smart_collections'),
    paginate('/products.json?status=active', 'products'),
    paginate('/collects.json', 'collects'),
  ]);

  const collectionByHandle = new Map();
  for (const c of [...customCollections, ...smartCollections]) {
    collectionByHandle.set(c.handle, { id: c.id, kind: customCollections.some((x) => x.id === c.id) ? 'custom' : 'smart' });
  }

  const customIds = new Set(customCollections.map((c) => c.id));
  const collectsByProduct = new Map();
  for (const col of collects) {
    if (!collectsByProduct.has(col.product_id)) collectsByProduct.set(col.product_id, new Set());
    collectsByProduct.get(col.product_id).add(col.collection_id);
  }

  const results = { mapped: [], manualReview: [], skipped: [], errors: [] };
  let collectCreates = 0;
  let tagUpdates = 0;

  for (const product of products) {
    if (product.status !== 'active') continue;

    const existingTags = parseTags(product.tags);
    const { subs, confidence, reason } = inferSubCollections(product);
    const targets = targetCollections(subs);
    const existingCollectionIds = collectsByProduct.get(product.id) || new Set();
    const existingHandles = [...existingCollectionIds]
      .map((id) => {
        for (const [h, meta] of collectionByHandle) if (meta.id === id) return h;
        return null;
      })
      .filter(Boolean);

    if (!subs.length || confidence === 'low') {
      results.manualReview.push({
        id: product.id,
        title: product.title,
        handle: product.handle,
        vendor: product.vendor,
        product_type: product.product_type,
        tags: existingTags.join(', '),
        current_collections: existingHandles.join(', ') || '(none)',
        suggested: subs.join(', ') || '(none)',
        reason,
      });
      continue;
    }

    const newTags = tagsToAdd(existingTags, subs);
    const tagChanged = newTags.length !== existingTags.length || newTags.some((t, i) => norm(t) !== norm(existingTags[i] || ''));

    const customTargets = targets.filter((h) => collectionByHandle.get(h)?.kind === 'custom');
    const missingCustom = customTargets.filter((h) => {
      const id = collectionByHandle.get(h)?.id;
      return id && !existingCollectionIds.has(id);
    });

    results.mapped.push({
      id: product.id,
      title: product.title,
      handle: product.handle,
      vendor: product.vendor,
      product_type: product.product_type,
      confidence,
      reason,
      subs,
      targets,
      missingCustom,
      tagChanged,
      current_collections: existingHandles.join(', ') || '(none)',
    });

    if (!DRY_RUN) {
      for (const handle of missingCustom) {
        const collection_id = collectionByHandle.get(handle)?.id;
        if (!collection_id) continue;
        try {
          await shopify('/collects.json', {
            method: 'POST',
            body: { collect: { product_id: product.id, collection_id } },
          });
          collectCreates++;
          await sleep(250);
        } catch (err) {
          if (!String(err.message).includes('already exists')) {
            results.errors.push({ product: product.title, handle, error: err.message });
          }
        }
      }

      if (tagChanged) {
        try {
          await shopify(`/products/${product.id}.json`, {
            method: 'PUT',
            body: { product: { id: product.id, tags: newTags.join(', ') } },
          });
          tagUpdates++;
          await sleep(250);
        } catch (err) {
          results.errors.push({ product: product.title, action: 'tags', error: err.message });
        }
      }
    }
  }

  // Write manual review file
  const reviewLines = [
    '# Products needing manual collection assignment',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Total active products: ${products.length}`,
    `Auto-mapped: ${results.mapped.length}`,
    `Needs review: ${results.manualReview.length}`,
    '',
    '| Product | Handle | Vendor | Type | Current collections | Tags | Suggested | Notes |',
    '|---------|--------|--------|------|---------------------|------|-----------|-------|',
    ...results.manualReview.map(
      (p) =>
        `| ${p.title.replace(/\|/g, '\\|')} | ${p.handle} | ${p.vendor} | ${p.product_type} | ${p.current_collections} | ${p.tags.replace(/\|/g, '\\|')} | ${p.suggested} | ${p.reason} |`,
    ),
  ];

  const fs = await import('node:fs');
  fs.writeFileSync('PRODUCT-COLLECTION-MANUAL-REVIEW.md', reviewLines.join('\n'));

  const summaryPath = 'PRODUCT-COLLECTION-MAPPING-SUMMARY.json';
  fs.writeFileSync(
    summaryPath,
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        dry_run: DRY_RUN,
        totals: {
          active_products: products.length,
          mapped: results.mapped.length,
          manual_review: results.manualReview.length,
          errors: results.errors.length,
        },
        collect_creates: collectCreates,
        tag_updates: tagUpdates,
        mapped_sample: results.mapped.slice(0, 20),
        errors: results.errors,
      },
      null,
      2,
    ),
  );

  console.log('\nSummary:');
  console.log(`  Active products: ${products.length}`);
  console.log(`  Mapped: ${results.mapped.length}`);
  console.log(`  Manual review: ${results.manualReview.length}`);
  console.log(`  Custom collects ${DRY_RUN ? 'would create' : 'created'}: ${DRY_RUN ? results.mapped.reduce((n, p) => n + p.missingCustom.length, 0) : collectCreates}`);
  console.log(`  Tag updates ${DRY_RUN ? 'needed' : 'applied'}: ${DRY_RUN ? results.mapped.filter((p) => p.tagChanged).length : tagUpdates}`);
  console.log(`  Errors: ${results.errors.length}`);
  console.log(`  Wrote PRODUCT-COLLECTION-MANUAL-REVIEW.md`);
  console.log(`  Wrote ${summaryPath}`);
}

import { fileURLToPath } from 'node:url';
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
