#!/usr/bin/env node
/**
 * Tag all clothing collection products with "clothing" in Shopify.
 *
 * Usage:
 *   SHOPIFY_ADMIN_TOKEN=... node scripts/tag-clothing-products.mjs
 *   SHOPIFY_ADMIN_TOKEN=... node scripts/tag-clothing-products.mjs --dry-run
 */

const STORE = process.env.SHOPIFY_STORE || 'tea-tonic-matakana.myshopify.com';
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const DRY_RUN = process.argv.includes('--dry-run');

const CLOTHING_COLLECTIONS = [
  'clothing',
  'all-clothing',
  'monni-art',
  'monni-label',
  'dresses',
  'tops',
  'bottoms',
  'jumpsuits',
  'loungewear',
];

if (!TOKEN && !DRY_RUN) {
  console.error('Missing SHOPIFY_ADMIN_TOKEN');
  process.exit(1);
}

const endpoint = `https://${STORE}/admin/api/2025-01/graphql.json`;

async function gql(query, variables = {}) {
  if (DRY_RUN && !query.includes('collection')) {
    return { data: {} };
  }
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await response.json();
  if (json.errors?.length) throw new Error(JSON.stringify(json.errors, null, 2));
  return json;
}

async function getCollectionProducts(handle) {
  const products = [];
  let cursor = null;

  for (let page = 0; page < 20; page++) {
    const { data } = await gql(
      `query CollectionProducts($handle: String!, $cursor: String) {
        collectionByHandle(handle: $handle) {
          products(first: 100, after: $cursor) {
            pageInfo { hasNextPage endCursor }
            edges { node { id handle title tags } }
          }
        }
      }`,
      { handle, cursor }
    );

    const collection = data?.collectionByHandle;
    if (!collection) return products;

    for (const edge of collection.products.edges) {
      products.push(edge.node);
    }

    if (!collection.products.pageInfo.hasNextPage) break;
    cursor = collection.products.pageInfo.endCursor;
  }

  return products;
}

async function addClothingTag(product) {
  if (product.tags.includes('clothing')) {
    return 'skipped';
  }

  if (DRY_RUN) {
    console.log(`[dry-run] tag clothing: ${product.handle}`);
    return 'tagged';
  }

  const { data } = await gql(
    `mutation TagsAdd($id: ID!, $tags: [String!]!) {
      tagsAdd(id: $id, tags: $tags) {
        userErrors { field message }
      }
    }`,
    { id: product.id, tags: ['clothing'] }
  );

  const errors = data?.tagsAdd?.userErrors || [];
  if (errors.length) throw new Error(`${product.handle}: ${errors.map((e) => e.message).join('; ')}`);
  return 'tagged';
}

async function main() {
  const byId = new Map();

  for (const handle of CLOTHING_COLLECTIONS) {
    const products = await getCollectionProducts(handle);
    console.log(`Collection ${handle}: ${products.length} product(s)`);
    for (const product of products) {
      byId.set(product.id, product);
    }
  }

  console.log(`Unique clothing products: ${byId.size}${DRY_RUN ? ' [dry-run]' : ''}`);

  let tagged = 0;
  let skipped = 0;

  for (const product of byId.values()) {
    const result = await addClothingTag(product);
    if (result === 'tagged') {
      tagged += 1;
      if (!DRY_RUN) console.log(`Tagged: ${product.handle}`);
    } else {
      skipped += 1;
    }
  }

  console.log(`Done. Tagged ${tagged}, already tagged ${skipped}.`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
