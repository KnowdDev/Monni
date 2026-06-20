#!/usr/bin/env node
/**
 * Create brand collections, assign active vendor products, and link brand metaobjects.
 * Usage: SHOPIFY_ADMIN_TOKEN=... node scripts/seed-brand-collections.mjs [--dry-run] [--only handle1,handle2]
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { brands } from './brands-data.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STORE = process.env.SHOPIFY_STORE || 'tea-tonic-matakana.myshopify.com';
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const DRY_RUN = process.argv.includes('--dry-run');
const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const ONLY = onlyArg ? onlyArg.replace('--only=', '').split(',').map((s) => s.trim()) : null;

const VENDOR_OVERRIDES = {
  maryse: 'Maryse',
};

if (!TOKEN && !DRY_RUN) {
  console.error('Set SHOPIFY_ADMIN_TOKEN');
  process.exit(1);
}

const API = `https://${STORE}/admin/api/2024-10`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function rest(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'X-Shopify-Access-Token': TOKEN,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} ${res.status}: ${text.slice(0, 400)}`);
  return text ? JSON.parse(text) : {};
}

async function gql(query, variables = {}) {
  const res = await fetch(`${API}/graphql.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors?.length) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

async function fetchActiveProducts(vendor) {
  const items = [];
  let cursor = null;
  while (true) {
    const data = await gql(
      `query($q: String!, $cursor: String) {
        products(first: 250, after: $cursor, query: $q) {
          pageInfo { hasNextPage endCursor }
          edges { node { legacyResourceId title handle vendor } }
        }
      }`,
      { q: `status:active vendor:'${vendor.replace(/'/g, "\\'")}'`, cursor },
    );
    items.push(...data.products.edges.map((e) => e.node));
    if (!data.products.pageInfo.hasNextPage) break;
    cursor = data.products.pageInfo.endCursor;
    await sleep(200);
  }
  return items;
}

async function getOrCreateCollection(brand) {
  const handle = brand.handle;
  const existing = await gql(
    `query($h: String!) {
      collectionByHandle(handle: $h) {
        id legacyResourceId handle title
        ruleSet { rules { column } }
      }
    }`,
    { h: handle },
  );
  if (existing.collectionByHandle) {
    const isSmart = (existing.collectionByHandle.ruleSet?.rules?.length ?? 0) > 0;
    return {
      collection: {
        id: Number(existing.collectionByHandle.legacyResourceId),
        handle: existing.collectionByHandle.handle,
      },
      created: false,
      smart: isSmart,
    };
  }
  if (DRY_RUN) {
    return { collection: { id: 0, handle }, created: true, smart: false };
  }
  const created = await rest('/custom_collections.json', {
    method: 'POST',
    body: {
      custom_collection: {
        title: brand.name,
        handle,
        body_html: brand.tagline ? `<p>${brand.tagline}</p>` : '',
        published: true,
        sort_order: 'best-selling',
      },
    },
  });
  return { collection: created.custom_collection, created: true, smart: false };
}

async function upsertBrandMeta(brand, vendorMatch) {
  if (DRY_RUN) return;
  const fields = [
    { key: 'collection_handle', value: brand.handle },
    ...(vendorMatch !== brand.vendor_match
      ? [{ key: 'vendor_match', value: vendorMatch }]
      : []),
  ];
  const result = await gql(
    `mutation UpsertBrand($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
      metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
        metaobject { handle }
        userErrors { field message }
      }
    }`,
    {
      handle: { type: 'brand', handle: brand.handle },
      metaobject: { fields },
    },
  );
  const errors = result.metaobjectUpsert.userErrors;
  if (errors?.length) throw new Error(`${brand.handle}: ${errors.map((e) => e.message).join('; ')}`);
}

function patchBrandsDataFiles(handles, vendorOverrides) {
  const paths = [
    join(__dirname, 'brands-data.mjs'),
    join(__dirname, '../../monni-theme/scripts/brands-data.mjs'),
  ];
  for (const path of paths) {
    let content = readFileSync(path, 'utf8');
    for (const handle of handles) {
      const collectionRe = new RegExp(
        `(handle: '${handle}',[\\s\\S]*?collection_handle: )''`,
      );
      content = content.replace(collectionRe, `$1'${handle}'`);
      if (vendorOverrides[handle]) {
        const vendorRe = new RegExp(
          `(handle: '${handle}',[\\s\\S]*?vendor_match: )'[^']*'`,
        );
        content = content.replace(vendorRe, `$1'${vendorOverrides[handle]}'`);
      }
    }
    writeFileSync(path, content);
    console.log(`Patched ${path}`);
  }
}

async function main() {
  const targets = brands.filter((b) => {
    if (ONLY && !ONLY.includes(b.handle)) return false;
    if (ONLY) return true;
    return b.published !== false && !b.collection_handle;
  });

  console.log(`${DRY_RUN ? '[dry-run] ' : ''}Seeding ${targets.length} brand collection(s)`);
  const summary = [];

  for (const brand of targets) {
    const vendorMatch = VENDOR_OVERRIDES[brand.handle] || brand.vendor_match || brand.name;
    const products = DRY_RUN ? [] : await fetchActiveProducts(vendorMatch);

    if (!DRY_RUN && products.length === 0) {
      summary.push({ handle: brand.handle, status: 'skipped', reason: 'no active products' });
      console.log(`Skip ${brand.handle} — no active products for vendor "${vendorMatch}"`);
      continue;
    }

    const { collection, created, smart } = await getOrCreateCollection(brand);
    let added = 0;

    if (!DRY_RUN && !smart) {
      for (const product of products) {
        try {
          await rest('/collects.json', {
            method: 'POST',
            body: {
              collect: {
                product_id: Number(product.legacyResourceId),
                collection_id: collection.id,
              },
            },
          });
          added++;
          await sleep(250);
        } catch (err) {
          if (!String(err.message).includes('already exists')) throw err;
        }
      }
    }

    if (!DRY_RUN) {
      await upsertBrandMeta(brand, vendorMatch);
    }

    summary.push({
      handle: brand.handle,
      name: brand.name,
      vendor: vendorMatch,
      collection: brand.handle,
      created,
      smart: smart ?? false,
      products: products.length,
      added,
      status: 'ok',
    });
    console.log(
      `${created ? 'Created' : smart ? 'Linked smart' : 'Updated'} ${brand.handle}: ${products.length} product(s)`,
    );
  }

  if (!DRY_RUN && !ONLY) {
    const okHandles = summary.filter((s) => s.status === 'ok').map((s) => s.handle);
    patchBrandsDataFiles(okHandles, VENDOR_OVERRIDES);
  } else if (!DRY_RUN && ONLY) {
    const okHandles = summary.filter((s) => s.status === 'ok').map((s) => s.handle);
    patchBrandsDataFiles(okHandles, VENDOR_OVERRIDES);
  }

  console.log('\nDone.');
  console.log(JSON.stringify({ totals: summary.length, ok: summary.filter((s) => s.status === 'ok').length, skipped: summary.filter((s) => s.status === 'skipped').length, summary }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
