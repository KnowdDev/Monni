#!/usr/bin/env node
/**
 * Update Shopify legal policies from scripts/policies-content.mjs
 *
 * Usage:
 *   SHOPIFY_ADMIN_TOKEN=... node scripts/update-policies.mjs
 *   SHOPIFY_ADMIN_TOKEN=... node scripts/update-policies.mjs --dry-run
 */

import {
  CONTACT_INFORMATION,
  PRIVACY_POLICY,
  REFUND_POLICY,
  TERMS_OF_SERVICE,
} from './policies-content.mjs';

const STORE = process.env.SHOPIFY_STORE || 'tea-tonic-matakana.myshopify.com';
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const DRY_RUN = process.argv.includes('--dry-run');

const POLICIES = [
  { type: 'CONTACT_INFORMATION', body: CONTACT_INFORMATION },
  { type: 'PRIVACY_POLICY', body: PRIVACY_POLICY },
  { type: 'TERMS_OF_SERVICE', body: TERMS_OF_SERVICE },
  { type: 'REFUND_POLICY', body: REFUND_POLICY },
];

if (!TOKEN && !DRY_RUN) {
  console.error('Missing SHOPIFY_ADMIN_TOKEN');
  process.exit(1);
}

const endpoint = `https://${STORE}/admin/api/2025-01/graphql.json`;

async function gql(query, variables = {}) {
  if (DRY_RUN) return { data: {} };
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

async function updatePolicy(type, body) {
  if (DRY_RUN) {
    console.log(`[dry-run] update ${type} (${body.length} chars)`);
    return;
  }

  const { data } = await gql(
    `mutation ShopPolicyUpdate($shopPolicy: ShopPolicyInput!) {
      shopPolicyUpdate(shopPolicy: $shopPolicy) {
        shopPolicy { id type title }
        userErrors { field message }
      }
    }`,
    { shopPolicy: { type, body } }
  );

  const result = data?.shopPolicyUpdate;
  const errors = result?.userErrors || [];
  if (errors.length) throw new Error(`${type}: ${errors.map((e) => e.message).join('; ')}`);
  console.log(`Updated ${type}: ${result.shopPolicy.title}`);
}

async function main() {
  for (const policy of POLICIES) {
    await updatePolicy(policy.type, policy.body);
  }
  console.log('Done.');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
