#!/usr/bin/env node
/**
 * Seed MONNI brand metaobjects in Shopify.
 *
 * Prerequisites:
 *   1. Create a Custom app (or use existing) with Admin API access:
 *      read/write metaobjects, read products, read collections
 *   2. Export token: export SHOPIFY_ADMIN_TOKEN="shpat_..."
 *   3. Optional: export SHOPIFY_STORE="tea-tonic-matakana.myshopify.com"
 *
 * Usage:
 *   node scripts/seed-brands.mjs
 *   node scripts/seed-brands.mjs --dry-run
 *   node scripts/seed-brands.mjs --only absolute-essential,kinto
 */

import { brands } from './brands-data.mjs';

const STORE = process.env.SHOPIFY_STORE || 'tea-tonic-matakana.myshopify.com';
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = '2025-01';
const DRY_RUN = process.argv.includes('--dry-run');
const onlyArg = process.argv.find((arg) => arg.startsWith('--only='));
const ONLY = onlyArg ? onlyArg.replace('--only=', '').split(',').map((s) => s.trim()) : null;

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
  if (!response.ok || json.errors?.length) {
    throw new Error(JSON.stringify(json.errors || json, null, 2));
  }
  return json;
}

function toRichText(paragraphs) {
  return {
    type: 'root',
    children: paragraphs.map((text) => ({
      type: 'paragraph',
      children: [{ type: 'text', value: text }],
    })),
  };
}

const DEFINITION_QUERY = `
  query {
    metaobjectDefinitionByType(type: "brand") {
      id
      type
    }
  }
`;

const DEFINITION_CREATE = `
  mutation CreateBrandDefinition($definition: MetaobjectDefinitionCreateInput!) {
    metaobjectDefinitionCreate(definition: $definition) {
      metaobjectDefinition { id type }
      userErrors { field message }
    }
  }
`;

const UPSERT = `
  mutation UpsertBrand($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
    metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
      metaobject { id handle displayName }
      userErrors { field message }
    }
  }
`;

async function ensureDefinition() {
  const existing = await gql(DEFINITION_QUERY);
  if (existing.data?.metaobjectDefinitionByType?.id) {
    console.log('Brand metaobject definition already exists.');
    return;
  }

  const definition = {
    name: 'Brand',
    type: 'brand',
    access: {
      storefront: 'PUBLIC_READ',
    },
    capabilities: {
      onlineStore: { enabled: true, data: { urlHandle: 'brands' } },
    },
    fieldDefinitions: [
      { key: 'name', name: 'Name', type: 'single_line_text_field', required: true },
      { key: 'tagline', name: 'Tagline', type: 'single_line_text_field' },
      { key: 'description', name: 'Description', type: 'rich_text_field' },
      { key: 'collection_handle', name: 'Collection handle', type: 'single_line_text_field' },
      { key: 'vendor_match', name: 'Vendor match', type: 'single_line_text_field' },
      { key: 'published', name: 'Published', type: 'boolean' },
      { key: 'hero_image', name: 'Hero image', type: 'file_reference' },
    ],
  };

  if (DRY_RUN) {
    console.log('[dry-run] Would create brand metaobject definition');
    return;
  }

  const result = await gql(DEFINITION_CREATE, { definition });
  const errors = result.data?.metaobjectDefinitionCreate?.userErrors || [];
  if (errors.length) throw new Error(errors.map((e) => e.message).join('; '));
  console.log('Created brand metaobject definition.');
}

async function upsertBrand(brand) {
  const fields = [
    { key: 'name', value: brand.name },
    { key: 'tagline', value: brand.tagline || '' },
    { key: 'description', value: JSON.stringify(toRichText(brand.paragraphs)) },
    { key: 'collection_handle', value: brand.collection_handle || '' },
    { key: 'vendor_match', value: brand.vendor_match || brand.name },
    { key: 'published', value: String(brand.published !== false) },
  ];

  const variables = {
    handle: { type: 'brand', handle: brand.handle },
    metaobject: {
      fields,
      capabilities: { onlineStore: { templateSuffix: '' } },
    },
  };

  if (DRY_RUN) {
    console.log(`[dry-run] ${brand.handle} — ${brand.name}`);
    return;
  }

  const result = await gql(UPSERT, variables);
  const errors = result.data?.metaobjectUpsert?.userErrors || [];
  if (errors.length) throw new Error(`${brand.handle}: ${errors.map((e) => e.message).join('; ')}`);
  const saved = result.data?.metaobjectUpsert?.metaobject;
  console.log(`Saved ${saved?.handle} (${saved?.displayName})`);
}

async function main() {
  const list = ONLY ? brands.filter((b) => ONLY.includes(b.handle)) : brands;
  console.log(`Seeding ${list.length} brand(s) to ${STORE}${DRY_RUN ? ' [dry-run]' : ''}`);
  await ensureDefinition();
  for (const brand of list) {
    await upsertBrand(brand);
  }
  console.log('Done.');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
