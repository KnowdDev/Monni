#!/usr/bin/env node
/**
 * Fix skirts, shorts, and giftboxes collection membership + tagging.
 * Usage: SHOPIFY_ADMIN_TOKEN=... node scripts/fix-collection-skirts-shorts-giftboxes.mjs [--dry-run]
 */

const STORE = process.env.SHOPIFY_STORE || 'tea-tonic-matakana.myshopify.com';
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const DRY_RUN = process.argv.includes('--dry-run');
const API = `https://${STORE}/admin/api/2024-10`;

if (!TOKEN && !DRY_RUN) {
  console.error('Set SHOPIFY_ADMIN_TOKEN');
  process.exit(1);
}

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
  if (!res.ok) throw new Error(`${method} ${path} ${res.status}: ${text.slice(0, 500)}`);
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

function parseTags(tags) {
  if (Array.isArray(tags)) return [...tags];
  return (tags || '').split(',').map((t) => t.trim()).filter(Boolean);
}

function addTags(existing, toAdd) {
  const tags = [...existing];
  for (const t of toAdd) {
    if (!tags.some((x) => x.toLowerCase() === t.toLowerCase())) tags.push(t);
  }
  return tags;
}

function removeTags(existing, toRemove) {
  const remove = new Set(toRemove.map((t) => t.toLowerCase()));
  return existing.filter((t) => !remove.has(t.toLowerCase()));
}

async function updateProductTags(productId, mutator) {
  const { product } = await rest(`/products/${productId}.json`);
  const tags = mutator(parseTags(product.tags));
  if (DRY_RUN) {
    console.log(`  [dry-run] tags -> ${tags.join(', ')}`);
    return;
  }
  await rest(`/products/${productId}.json`, {
    method: 'PUT',
    body: { product: { id: productId, tags: tags.join(', ') } },
  });
}

async function addCollect(productId, collectionId) {
  if (DRY_RUN) {
    console.log(`  [dry-run] collect product ${productId} -> collection ${collectionId}`);
    return;
  }
  try {
    await rest('/collects.json', {
      method: 'POST',
      body: { collect: { product_id: productId, collection_id: collectionId } },
    });
  } catch (err) {
    if (!String(err.message).includes('already exists')) throw err;
  }
}

async function publishProduct(productId) {
  if (DRY_RUN) {
    console.log(`  [dry-run] publish product ${productId}`);
    return;
  }
  await gql(
    `mutation($id: ID!) {
      productUpdate(input: { id: $id, status: ACTIVE }) {
        product { id status }
        userErrors { message }
      }
    }`,
    { id: `gid://shopify/Product/${productId}` },
  );
}

async function main() {
  const collections = await gql(`query {
    skirts: collectionByHandle(handle: "skirts") { legacyResourceId }
    shorts: collectionByHandle(handle: "shorts") { legacyResourceId }
    giftboxes: collectionByHandle(handle: "giftboxes") { id legacyResourceId ruleSet { appliedDisjunctively rules { column relation condition } } }
  }`);

  const SKIRTS = {
    collectionId: Number(collections.skirts.legacyResourceId),
    products: [
      { id: 8351108858027, title: 'MONNI Bias Skirt | Long' },
      { id: 8375526391979, title: 'MONNI Bias Skirt | Short' },
    ],
    addTags: ['Skirt', 'collection:skirts', 'collection:clothing'],
  };

  const SHORTS = {
    collectionId: Number(collections.shorts.legacyResourceId),
    products: [{ id: 7459610099883, title: 'MONNI Juniper Frill Short' }],
    addTags: ['Shorts', 'collection:shorts', 'collection:clothing'],
  };

  console.log('=== Skirts ===');
  for (const p of SKIRTS.products) {
    console.log(p.title);
    await addCollect(p.id, SKIRTS.collectionId);
    await updateProductTags(p.id, (tags) => addTags(tags, SKIRTS.addTags));
    await sleep(300);
  }

  console.log('\n=== Shorts ===');
  for (const p of SHORTS.products) {
    console.log(p.title);
    await addCollect(p.id, SHORTS.collectionId);
    await updateProductTags(p.id, (tags) => addTags(tags, SHORTS.addTags));
    await sleep(300);
  }

  console.log('\n=== Gift Card / Gift Wrap tag cleanup ===');
  await updateProductTags(7046911557803, (tags) =>
    removeTags(tags, ['gift box', 'collection:giftboxes']),
  );
  console.log('Gift Card: removed gift box + collection:giftboxes tags');
  await sleep(300);

  await updateProductTags(6974386995371, (tags) =>
    removeTags(tags, ['gift box', 'collection:giftboxes']),
  );
  console.log('Gift Wrap: removed gift box + collection:giftboxes tags');
  await sleep(300);

  console.log('\n=== Publish in-stock gift boxes ===');
  const giftBoxesToPublish = [
    { id: 8493671710891, title: 'Seasonal Gift Box' },
    { id: 8310232678571, title: 'Tea and Tonic Mini Face Gift Box' },
    { id: 8310232613035, title: 'Tea and Tonic Mini Body Gift Box' },
  ];
  for (const p of giftBoxesToPublish) {
    console.log(p.title);
    await updateProductTags(p.id, (tags) => addTags(tags, ['gift box', 'collection:giftboxes', 'collection:all-gifting']));
    await publishProduct(p.id);
    await sleep(400);
  }

  console.log('\n=== Giftboxes smart collection rules ===');
  const giftboxesId = collections.giftboxes.id;
  if (DRY_RUN) {
    console.log('[dry-run] Would set rules: tag gift box + type Gift Boxes + inventory > 0');
  } else {
    const result = await gql(
      `mutation($input: CollectionInput!) {
        collectionUpdate(input: $input) {
          collection { handle productsCount { count } }
          userErrors { field message }
        }
      }`,
      {
        input: {
          id: giftboxesId,
          ruleSet: {
            appliedDisjunctively: false,
            rules: [
              { column: 'TAG', relation: 'EQUALS', condition: 'gift box' },
              { column: 'TYPE', relation: 'EQUALS', condition: 'Gift Boxes' },
              { column: 'VARIANT_INVENTORY', relation: 'GREATER_THAN', condition: '0' },
            ],
          },
        },
      },
    );
    const errors = result.collectionUpdate.userErrors;
    if (errors?.length) throw new Error(errors.map((e) => e.message).join('; '));
    console.log(`giftboxes collection now has ${result.collectionUpdate.collection.productsCount.count} products (admin)`);
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
