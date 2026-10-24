#!/usr/bin/env node
/**
 * Upload newsletters/hair-edition-newsletter.html to Senderkit (no send).
 *   HATCHED_API_KEY=sk_live_... node scripts/sync-hair-edition-senderkit.mjs
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(__dirname, '../../newsletters/hair-edition-newsletter.html'), 'utf8');
const key = process.env.HATCHED_API_KEY || process.env.SENDERKIT_API_KEY;
const id = '3df60a09-fe8a-4087-b128-920c523e8a20';

if (!key) {
  console.error('Set HATCHED_API_KEY or SENDERKIT_API_KEY');
  process.exit(1);
}

const res = await fetch(`https://send.hatched.digital/api/templates/${id}`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    html,
    subject: 'Healthy hair edition — tips, giveaway & favourites',
  }),
});

const json = await res.json();
if (!res.ok) {
  console.error(json);
  process.exit(1);
}
const out = json.template?.html || '';
console.log('Saved template', id);
console.log('  bytes:', out.length);
console.log('  gloria:', out.includes('amber-gold-gloria-tea'));
console.log('  recipe anchor:', out.includes('#molasses-banana-bread'));
