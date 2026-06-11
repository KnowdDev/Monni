#!/usr/bin/env node
/**
 * Ensures the Shop page exists with the shop page template.
 *
 * Usage:
 *   SHOPIFY_ADMIN_TOKEN=... node scripts/ensure-shop-page.mjs
 */

const STORE = process.env.SHOPIFY_STORE || 'tea-tonic-matakana.myshopify.com';
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = '2025-01';

if (!TOKEN) {
  console.error('Missing SHOPIFY_ADMIN_TOKEN');
  process.exit(1);
}

const endpoint = `https://${STORE}/admin/api/${API_VERSION}/graphql.json`;

async function gql(query, variables = {}) {
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

const FIND_PAGE = `
  query FindShopPage {
    pages(first: 1, query: "handle:shop") {
      nodes { id handle title templateSuffix }
    }
  }
`;

const CREATE_PAGE = `
  mutation CreateShopPage($page: PageCreateInput!) {
    pageCreate(page: $page) {
      page { id handle title templateSuffix }
      userErrors { field message }
    }
  }
`;

const UPDATE_PAGE = `
  mutation UpdateShopPage($id: ID!, $page: PageUpdateInput!) {
    pageUpdate(id: $id, page: $page) {
      page { id handle title templateSuffix }
      userErrors { field message }
    }
  }
`;

async function main() {
  const existing = await gql(FIND_PAGE);
  const page = existing.data.pages.nodes[0];

  if (page) {
    if (page.templateSuffix === 'shop') {
      console.log(`Shop page already exists: /pages/${page.handle}`);
      return;
    }

    const updated = await gql(UPDATE_PAGE, {
      id: page.id,
      page: {
        templateSuffix: 'shop',
        isPublished: true,
      },
    });
    const errors = updated.data.pageUpdate.userErrors;
    if (errors?.length) throw new Error(JSON.stringify(errors, null, 2));
    console.log(`Updated shop page template: /pages/${updated.data.pageUpdate.page.handle}`);
    return;
  }

  const created = await gql(CREATE_PAGE, {
    page: {
      title: 'Shop',
      handle: 'shop',
      templateSuffix: 'shop',
      isPublished: true,
    },
  });
  const errors = created.data.pageCreate.userErrors;
  if (errors?.length) throw new Error(JSON.stringify(errors, null, 2));
  console.log(`Created shop page: /pages/${created.data.pageCreate.page.handle}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
