/**
 * Shopify marketing-consent → SenderKit audience sync
 * Deploy as a Vercel serverless function (standalone) or Cloudflare Worker.
 *
 * Env:
 *   SENDERKIT_API_KEY          sk_live_… (contact:write)
 *   SENDERKIT_AUDIENCE_ID      798bfa1e-1a19-4f57-af66-6e94b85417ba (test)
 *   SHOPIFY_WEBHOOK_SECRET     from Shopify webhook subscription (optional but recommended)
 */
export const config = { runtime: 'edge' };

const SENDERKIT_ADD = 'https://senderkit.io/api/subscribers/add';

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

async function verifyShopifyHmac(rawBody, hmacHeader, secret) {
  if (!secret) return true; // allow unverified in bootstrap; set secret in production
  if (!hmacHeader) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  const digest = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return timingSafeEqual(digest, hmacHeader);
}

function consentState(customer) {
  const state =
    customer?.email_marketing_consent?.state ||
    customer?.emailMarketingConsent?.marketingState ||
    customer?.accepts_marketing;
  if (state === true) return 'subscribed';
  if (!state) return null;
  return String(state).toLowerCase();
}

async function syncToSenderKit(customer) {
  const email = customer?.email;
  if (!email) return { skipped: true, reason: 'no_email' };

  const state = consentState(customer);
  if (state !== 'subscribed') {
    return { skipped: true, reason: 'not_subscribed', state };
  }

  const apiKey = process.env.SENDERKIT_API_KEY;
  const audienceId = process.env.SENDERKIT_AUDIENCE_ID;
  if (!apiKey || !audienceId) {
    return { error: 'missing_env' };
  }

  const res = await fetch(SENDERKIT_ADD, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      audienceId,
      contacts: [
        {
          email,
          firstName: customer.first_name || customer.firstName || undefined,
          lastName: customer.last_name || customer.lastName || undefined,
          customFields: {
            shopify_customer_id: String(customer.admin_graphql_api_id || customer.id || ''),
            source: 'shopify_webhook'
          }
        }
      ],
      consentAcknowledged: true
    })
  });

  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export default async function handler(req) {
  if (req.method === 'GET') {
    return new Response(JSON.stringify({ ok: true, service: 'shopify-senderkit-sync' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const rawBody = await req.text();
  const hmac = req.headers.get('x-shopify-hmac-sha256') || '';
  const topic = req.headers.get('x-shopify-topic') || '';
  const verified = await verifyShopifyHmac(rawBody, hmac, process.env.SHOPIFY_WEBHOOK_SECRET || '');

  if (!verified) {
    return new Response(JSON.stringify({ error: 'invalid_hmac' }), { status: 401 });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400 });
  }

  // customers/* payloads are the customer object; consent update may wrap it
  const customer = payload.customer || payload;
  const result = await syncToSenderKit(customer);

  return new Response(
    JSON.stringify({ ok: true, topic, result }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
