#!/usr/bin/env node
/**
 * Ensures bespoke/corporate gifting pages exist with gifting-service template.
 *
 * Usage:
 *   SHOPIFY_ADMIN_TOKEN=... node scripts/seed-gifting-pages.mjs
 *   SHOPIFY_ADMIN_TOKEN=... node scripts/seed-gifting-pages.mjs --dry-run
 */

import { giftingLegacyRedirects, giftingPages } from './gifting-pages-data.mjs';

const STORE = process.env.SHOPIFY_STORE || 'tea-tonic-matakana.myshopify.com';
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = '2025-01';
const DRY_RUN = process.argv.includes('--dry-run');

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

function toHtml(paragraphs) {
  return paragraphs.map((p) => `<p>${p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`).join('');
}

const FIND_PAGE = `
  query FindPage($query: String!) {
    pages(first: 1, query: $query) {
      nodes { id handle title templateSuffix isPublished }
    }
  }
`;

const CREATE_PAGE = `
  mutation CreatePage($page: PageCreateInput!) {
    pageCreate(page: $page) {
      page { id handle title templateSuffix }
      userErrors { field message }
    }
  }
`;

const UPDATE_PAGE = `
  mutation UpdatePage($id: ID!, $page: PageUpdateInput!) {
    pageUpdate(id: $id, page: $page) {
      page { id handle title templateSuffix }
      userErrors { field message }
    }
  }
`;

async function upsertPage(entry) {
  if (DRY_RUN) {
    console.log(`[dry-run] /pages/${entry.handle} — ${entry.title}`);
    return;
  }

  const found = await gql(FIND_PAGE, { query: `handle:${entry.handle}` });
  const existing = found.data.pages.nodes[0];
  const bodyHtml = toHtml(entry.paragraphs);

  const pageInput = {
    title: entry.title,
    handle: entry.handle,
    templateSuffix: entry.templateSuffix || 'gifting-service',
    isPublished: true,
    body: bodyHtml,
  };

  if (existing) {
    const updated = await gql(UPDATE_PAGE, {
      id: existing.id,
      page: pageInput,
    });
    const errors = updated.data.pageUpdate.userErrors || [];
    if (errors.length) throw new Error(`${entry.handle}: ${errors.map((e) => e.message).join('; ')}`);
    console.log(`Updated /pages/${entry.handle}`);
    return;
  }

  const created = await gql(CREATE_PAGE, { page: pageInput });
  const errors = created.data.pageCreate.userErrors || [];
  if (errors.length) throw new Error(`${entry.handle}: ${errors.map((e) => e.message).join('; ')}`);
  console.log(`Created /pages/${entry.handle}`);
}

async function upsertRedirect(entry) {
  if (DRY_RUN) {
    console.log(`[dry-run] redirect ${entry.path} -> ${entry.target}`);
    return;
  }

  const found = await gql(
    `query FindRedirect($query: String!) {
      urlRedirects(first: 1, query: $query) {
        nodes { id path target }
      }
    }`,
    { query: `path:${entry.path}` }
  );
  const existing = found.data.urlRedirects.nodes[0];

  if (existing?.target === entry.target) {
    console.log(`Redirect already set: ${entry.path}`);
    return;
  }

  if (existing) {
    const updated = await gql(
      `mutation UpdateRedirect($id: ID!, $urlRedirect: UrlRedirectInput!) {
        urlRedirectUpdate(id: $id, urlRedirect: $urlRedirect) {
          urlRedirect { path target }
          userErrors { field message }
        }
      }`,
      { id: existing.id, urlRedirect: { path: entry.path, target: entry.target } }
    );
    const errors = updated.data.urlRedirectUpdate.userErrors || [];
    if (errors.length) throw new Error(`${entry.path}: ${errors.map((e) => e.message).join('; ')}`);
    console.log(`Updated redirect ${entry.path} -> ${entry.target}`);
    return;
  }

  const created = await gql(
    `mutation CreateRedirect($urlRedirect: UrlRedirectInput!) {
      urlRedirectCreate(urlRedirect: $urlRedirect) {
        urlRedirect { path target }
        userErrors { field message }
      }
    }`,
    { urlRedirect: { path: entry.path, target: entry.target } }
  );
  const errors = created.data.urlRedirectCreate.userErrors || [];
  if (errors.length) throw new Error(`${entry.path}: ${errors.map((e) => e.message).join('; ')}`);
  console.log(`Created redirect ${entry.path} -> ${entry.target}`);
}

async function unpublishLegacyPage(handle) {
  if (!handle) return;

  const found = await gql(FIND_PAGE, { query: `handle:${handle}` });
  const existing = found.data.pages.nodes[0];
  if (!existing) return;

  if (!existing.isPublished) {
    console.log(`Legacy page already unpublished: /pages/${handle}`);
    return;
  }

  const updated = await gql(UPDATE_PAGE, {
    id: existing.id,
    page: { isPublished: false },
  });
  const errors = updated.data.pageUpdate.userErrors || [];
  if (errors.length) throw new Error(`${handle}: ${errors.map((e) => e.message).join('; ')}`);
  console.log(`Unpublished legacy page /pages/${handle}`);
}

async function main() {
  console.log(`Seeding ${giftingPages.length} gifting page(s) to ${STORE}${DRY_RUN ? ' [dry-run]' : ''}`);
  for (const entry of giftingPages) {
    await upsertPage(entry);
  }
  for (const entry of giftingLegacyRedirects) {
    await upsertRedirect(entry);
    await unpublishLegacyPage(entry.unpublishHandle);
  }
  console.log('Done.');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
