#!/usr/bin/env node
/**
 * Seed MONNI collections in Shopify with top/bottom copy metafields.
 *
 * Usage:
 *   SHOPIFY_ADMIN_TOKEN=... node scripts/seed-collections.mjs
 *   SHOPIFY_ADMIN_TOKEN=... node scripts/seed-collections.mjs --dry-run
 *   SHOPIFY_ADMIN_TOKEN=... node scripts/seed-collections.mjs --only=face,tea
 */

import { collections } from './collections-data.mjs';

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
    children: (paragraphs || []).map((text) => ({
      type: 'paragraph',
      children: [{ type: 'text', value: text }],
    })),
  };
}

const METAFIELD_DEFS = [
  { key: 'top_line', name: 'Top line', type: 'single_line_text_field' },
  { key: 'bottom_intro', name: 'Bottom intro', type: 'rich_text_field' },
];

const FIND_DEFINITIONS = `
  query FindCollectionMetafieldDefs {
    metafieldDefinitions(first: 50, ownerType: COLLECTION, namespace: "monni") {
      nodes { id key namespace }
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

const FIND_COLLECTION = `
  query FindCollection($handle: String!) {
    collectionByHandle(handle: $handle) {
      id
      handle
      title
    }
  }
`;

const CREATE_COLLECTION = `
  mutation CreateCollection($input: CollectionInput!) {
    collectionCreate(input: $input) {
      collection { id handle title }
      userErrors { field message }
    }
  }
`;

const UPDATE_COLLECTION = `
  mutation UpdateCollection($input: CollectionInput!) {
    collectionUpdate(input: $input) {
      collection { id handle title }
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

const PUBLICATIONS_QUERY = `
  query GetPublications {
    publications(first: 20) {
      nodes { id name }
    }
  }
`;

const PUBLISH_COLLECTION = `
  mutation PublishCollection($id: ID!, $input: [PublicationInput!]!) {
    publishablePublish(id: $id, input: $input) {
      publishable {
        ... on Collection { id handle }
      }
      userErrors { field message }
    }
  }
`;

let onlineStorePublicationId = null;

async function getOnlineStorePublicationId() {
  if (onlineStorePublicationId) return onlineStorePublicationId;
  const result = await gql(PUBLICATIONS_QUERY);
  const publication = (result.data?.publications?.nodes || []).find(
    (node) => node.name === 'Online Store'
  );
  if (!publication?.id) {
    throw new Error('Could not find Online Store publication');
  }
  onlineStorePublicationId = publication.id;
  return onlineStorePublicationId;
}

async function publishCollection(collectionId, handle) {
  if (DRY_RUN) return;

  const publicationId = await getOnlineStorePublicationId();
  const result = await gql(PUBLISH_COLLECTION, {
    id: collectionId,
    input: [{ publicationId }],
  });
  const errors = result.data?.publishablePublish?.userErrors || [];
  if (errors.length) {
    throw new Error(`${handle} publish: ${errors.map((e) => e.message).join('; ')}`);
  }
}

async function ensureMetafieldDefinitions() {
  const existing = await gql(FIND_DEFINITIONS);
  const existingKeys = new Set(
    (existing.data?.metafieldDefinitions?.nodes || []).map((node) => node.key)
  );

  for (const def of METAFIELD_DEFS) {
    if (existingKeys.has(def.key)) continue;

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

async function upsertCollection(entry) {
  if (DRY_RUN) {
    console.log(`[dry-run] ${entry.handle} — ${entry.title}`);
    return { action: 'dry-run', handle: entry.handle };
  }

  const found = await gql(FIND_COLLECTION, { handle: entry.handle });
  let collectionId = found.data?.collectionByHandle?.id;
  let action = 'updated';

  if (!collectionId) {
    const created = await gql(CREATE_COLLECTION, {
      input: {
        title: entry.title,
        handle: entry.handle,
      },
    });
    const createErrors = created.data?.collectionCreate?.userErrors || [];
    if (createErrors.length) {
      throw new Error(`${entry.handle}: ${createErrors.map((e) => e.message).join('; ')}`);
    }
    collectionId = created.data.collectionCreate.collection.id;
    action = 'created';
  } else {
    const updated = await gql(UPDATE_COLLECTION, {
      input: {
        id: collectionId,
        title: entry.title,
      },
    });
    const updateErrors = updated.data?.collectionUpdate?.userErrors || [];
    if (updateErrors.length) {
      throw new Error(`${entry.handle}: ${updateErrors.map((e) => e.message).join('; ')}`);
    }
  }

  const metafields = [
    {
      ownerId: collectionId,
      namespace: 'monni',
      key: 'top_line',
      type: 'single_line_text_field',
      value: entry.top_line || '',
    },
    {
      ownerId: collectionId,
      namespace: 'monni',
      key: 'bottom_intro',
      type: 'rich_text_field',
      value: JSON.stringify(toRichText(entry.bottom_paragraphs)),
    },
  ];

  const metaResult = await gql(SET_METAFIELDS, { metafields });
  const metaErrors = metaResult.data?.metafieldsSet?.userErrors || [];
  if (metaErrors.length) {
    throw new Error(`${entry.handle} metafields: ${metaErrors.map((e) => e.message).join('; ')}`);
  }

  await publishCollection(collectionId, entry.handle);

  console.log(`${action === 'created' ? 'Created' : 'Updated'} ${entry.handle} (${entry.title})`);
  return { action, handle: entry.handle };
}

async function main() {
  const list = ONLY ? collections.filter((c) => ONLY.includes(c.handle)) : collections;
  console.log(`Seeding ${list.length} collection(s) to ${STORE}${DRY_RUN ? ' [dry-run]' : ''}`);
  await ensureMetafieldDefinitions();

  const summary = { created: 0, updated: 0, dryRun: 0 };
  for (const entry of list) {
    const result = await upsertCollection(entry);
    if (result.action === 'created') summary.created += 1;
    else if (result.action === 'updated') summary.updated += 1;
    else summary.dryRun += 1;
  }

  console.log(`Done. created=${summary.created} updated=${summary.updated}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
