#!/usr/bin/env node
/**
 * Write SEO titles and descriptions only.
 * Does NOT change collection titles, smart-collection rules, or brand body copy.
 *
 *   SHOPIFY_ADMIN_TOKEN=... node scripts/seed-seo.mjs
 *   SHOPIFY_ADMIN_TOKEN=... node scripts/seed-seo.mjs --dry-run
 */

import { collections } from './collections-data.mjs';
import { brands } from './brands-data.mjs';
import { collectionSeo, brandSeo, pageSeo, validateSeoCopy } from './seo-data.mjs';

const STORE = process.env.SHOPIFY_STORE || 'tea-tonic-matakana.myshopify.com';
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = '2025-01';
const DRY_RUN = process.argv.includes('--dry-run');
const PAGE_ONLY = process.argv.includes('--page-only');

if (!TOKEN && !DRY_RUN) {
  console.error('Missing SHOPIFY_ADMIN_TOKEN. Use --dry-run to validate locally.');
  process.exit(1);
}

const endpoint = `https://${STORE}/admin/api/${API_VERSION}/graphql.json`;

async function gql(query, variables = {}) {
  if (DRY_RUN) return { data: {}, dryRun: true };
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await response.json();
  if (!json.data && (json.errors?.length || !response.ok)) {
    throw new Error(JSON.stringify(json.errors || json, null, 2));
  }
  return json;
}

const FIND_COLLECTION = `
  query FindCollection($handle: String!) {
    collectionByHandle(handle: $handle) {
      id
      handle
      title
    }
  }
`;

const UPDATE_COLLECTION_SEO = `
  mutation UpdateCollectionSeo($input: CollectionInput!) {
    collectionUpdate(input: $input) {
      collection { id handle }
      userErrors { field message }
    }
  }
`;

const FIND_METAFIELD_DEFS = `
  query FindCollectionMetafieldDefs {
    metafieldDefinitions(first: 50, ownerType: COLLECTION, namespace: "monni") {
      nodes { id key }
    }
  }
`;

const CREATE_DEFINITION = `
  mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $definition) {
      createdDefinition { id key }
      userErrors { field message }
    }
  }
`;

const SET_METAFIELDS = `
  mutation SetCollectionMetafields($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields { key namespace }
      userErrors { field message }
    }
  }
`;

const BRAND_DEFINITION = `
  query {
    metaobjectDefinitionByType(type: "brand") {
      id
      displayNameKey
      fieldDefinitions { key }
    }
  }
`;

const UPDATE_BRAND_DEFINITION = `
  mutation UpdateBrandDefinition($id: ID!, $definition: MetaobjectDefinitionUpdateInput!) {
    metaobjectDefinitionUpdate(id: $id, definition: $definition) {
      metaobjectDefinition { id displayNameKey }
      userErrors { field message }
    }
  }
`;

const UPSERT_BRAND_SEO = `
  mutation UpsertBrandSeo($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
    metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
      metaobject { id handle }
      userErrors { field message }
    }
  }
`;

const FIND_PAGE = `
  query FindPage($query: String!) {
    pages(first: 5, query: $query) {
      nodes { id handle title }
    }
  }
`;

async function ensureCollectionSeoMetafields() {
  const existing = await gql(FIND_METAFIELD_DEFS);
  const keys = new Set((existing.data?.metafieldDefinitions?.nodes || []).map((node) => node.key));
  const needed = [
    { key: 'seo_title', name: 'SEO title', type: 'single_line_text_field' },
    { key: 'seo_description', name: 'SEO description', type: 'multi_line_text_field' },
  ];

  for (const def of needed) {
    if (keys.has(def.key)) continue;
    if (DRY_RUN) {
      console.log(`[dry-run] Would create metafield definition monni.${def.key}`);
      continue;
    }
    const result = await gql(CREATE_DEFINITION, {
      definition: {
        name: def.name,
        namespace: 'monni',
        key: def.key,
        type: def.type,
        ownerType: 'COLLECTION',
      },
    });
    const errors = result.data?.metafieldDefinitionCreate?.userErrors || [];
    if (errors.length) throw new Error(errors.map((e) => e.message).join('; '));
    console.log(`Created metafield definition monni.${def.key}`);
  }
}

async function updateCollectionSeo(entry) {
  const seo = collectionSeo[entry.handle];
  if (!seo) return { action: 'skip-no-copy', handle: entry.handle };

  if (DRY_RUN) return { action: 'dry-run', handle: entry.handle };

  const found = await gql(FIND_COLLECTION, { handle: entry.handle });
  const collectionId = found.data?.collectionByHandle?.id;
  if (!collectionId) {
    console.warn(`SKIP ${entry.handle}: not visible to Admin API`);
    return { action: 'missing', handle: entry.handle };
  }

  const updated = await gql(UPDATE_COLLECTION_SEO, {
    input: {
      id: collectionId,
      seo: {
        title: seo.title,
        description: seo.description,
      },
    },
  });
  const updateErrors = updated.data?.collectionUpdate?.userErrors || [];
  if (updateErrors.length) {
    throw new Error(`${entry.handle} seo: ${updateErrors.map((e) => e.message).join('; ')}`);
  }

  const metaResult = await gql(SET_METAFIELDS, {
    metafields: [
      {
        ownerId: collectionId,
        namespace: 'monni',
        key: 'seo_title',
        type: 'single_line_text_field',
        value: seo.title,
      },
      {
        ownerId: collectionId,
        namespace: 'monni',
        key: 'seo_description',
        type: 'multi_line_text_field',
        value: seo.description,
      },
    ],
  });
  const metaErrors = metaResult.data?.metafieldsSet?.userErrors || [];
  if (metaErrors.length) {
    throw new Error(`${entry.handle} metafields: ${metaErrors.map((e) => e.message).join('; ')}`);
  }

  console.log(`Updated SEO ${entry.handle}`);
  return { action: 'updated', handle: entry.handle };
}

async function ensureBrandSeoFields() {
  const existing = await gql(BRAND_DEFINITION);
  const definition = existing.data?.metaobjectDefinitionByType;
  if (!definition?.id) {
    console.warn('Brand metaobject definition not found; skip brand SEO fields.');
    return;
  }

  const keys = new Set((definition.fieldDefinitions || []).map((field) => field.key));
  const operations = [];
  if (!keys.has('seo_title')) {
    operations.push({
      create: {
        key: 'seo_title',
        name: 'SEO title',
        type: 'single_line_text_field',
      },
    });
  }
  if (!keys.has('seo_description')) {
    operations.push({
      create: {
        key: 'seo_description',
        name: 'SEO description',
        type: 'multi_line_text_field',
      },
    });
  }

  const needsDisplayName = definition.displayNameKey !== 'name';
  if (!operations.length && !needsDisplayName) return;
  if (DRY_RUN) {
    console.log('[dry-run] Would update brand definition displayNameKey/seo fields');
    return;
  }

  const result = await gql(UPDATE_BRAND_DEFINITION, {
    id: definition.id,
    definition: {
      ...(needsDisplayName ? { displayNameKey: 'name' } : {}),
      ...(operations.length ? { fieldDefinitions: operations } : {}),
    },
  });
  const errors = result.data?.metaobjectDefinitionUpdate?.userErrors || [];
  if (errors.length) throw new Error(`brand definition: ${errors.map((e) => e.message).join('; ')}`);
  console.log('Updated brand metaobject definition for SEO.');
}

async function updateBrandSeo(brand) {
  const seo = brandSeo[brand.handle];
  if (!seo) return { action: 'skip', handle: brand.handle };
  if (DRY_RUN) return { action: 'dry-run', handle: brand.handle };

  const result = await gql(UPSERT_BRAND_SEO, {
    handle: { type: 'brand', handle: brand.handle },
    metaobject: {
      fields: [
        { key: 'seo_title', value: seo.title },
        { key: 'seo_description', value: seo.description },
      ],
    },
  });
  const errors = result.data?.metaobjectUpsert?.userErrors || [];
  if (errors.length) {
    throw new Error(`${brand.handle}: ${errors.map((e) => e.message).join('; ')}`);
  }
  console.log(`Updated brand SEO ${brand.handle}`);
  return { action: 'updated', handle: brand.handle };
}

async function updateBrandsPageSeo() {
  const seo = pageSeo.brands;
  if (DRY_RUN) {
    console.log('[dry-run] Would update /pages/brands SEO');
    return;
  }

  const found = await gql(FIND_PAGE, { query: 'handle:brands' });
  const page = (found.data?.pages?.nodes || []).find((node) => node.handle === 'brands');
  if (!page?.id) {
    console.warn('SKIP page brands: not found');
    return;
  }

  const result = await gql(SET_METAFIELDS, {
    metafields: [
      {
        ownerId: page.id,
        namespace: 'global',
        key: 'title_tag',
        type: 'single_line_text_field',
        value: seo.title,
      },
      {
        ownerId: page.id,
        namespace: 'global',
        key: 'description_tag',
        type: 'single_line_text_field',
        value: seo.description,
      },
    ],
  });
  const errors = result.data?.metafieldsSet?.userErrors || [];
  if (errors.length) throw new Error(`page brands: ${errors.map((e) => e.message).join('; ')}`);
  console.log('Updated SEO page:brands');
}

async function main() {
  const issues = validateSeoCopy();
  if (issues.length) {
    console.error('SEO copy validation failed:');
    for (const issue of issues) console.error(`  - ${issue}`);
    process.exit(1);
  }

  console.log(`Seeding SEO to ${STORE}${DRY_RUN ? ' [dry-run]' : ''}${PAGE_ONLY ? ' [page-only]' : ''}`);
  if (!PAGE_ONLY) {
    await ensureCollectionSeoMetafields();

    let missing = 0;
    for (const entry of collections) {
      const result = await updateCollectionSeo(entry);
      if (result.action === 'missing') missing += 1;
    }

    await ensureBrandSeoFields();
    for (const brand of brands) {
      await updateBrandSeo(brand);
    }
    if (missing) console.log(`${missing} collection(s) skipped (Admin-invisible).`);
  }

  await updateBrandsPageSeo();
  console.log('Done.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
