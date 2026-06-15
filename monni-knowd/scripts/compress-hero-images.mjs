#!/usr/bin/env node
/**
 * Download homepage split-hero images, compress to WebP, upload to Shopify Files,
 * and update theme templates/index.json on MAIN + DEVELOPMENT themes.
 *
 * Usage:
 *   SHOPIFY_ADMIN_TOKEN=... node scripts/compress-hero-images.mjs
 *   SHOPIFY_ADMIN_TOKEN=... node scripts/compress-hero-images.mjs --dry-run
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const STORE = process.env.SHOPIFY_STORE || 'tea-tonic-matakana.myshopify.com';
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = '2025-01';
const DRY_RUN = process.argv.includes('--dry-run');
const TMP_DIR = join(process.cwd(), 'scripts', '.tmp', 'hero-images');

const THEMES = {
  main: '156090564779',
  development: '156090269867',
};

const endpoint = `https://${STORE}/admin/api/${API_VERSION}/graphql.json`;

if (!TOKEN && !DRY_RUN) {
  console.error('Missing SHOPIFY_ADMIN_TOKEN');
  process.exit(1);
}

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
  if (!response.ok || json.errors?.length) {
    throw new Error(JSON.stringify(json.errors || json, null, 2));
  }
  return json;
}

function stripIndexComment(raw) {
  return raw.replace(/^\/\*[\s\S]*?\*\/\s*/, '');
}

async function getThemeIndexJson(themeId) {
  const json = await gql(
    `query ThemeIndex($id: ID!) {
      theme(id: $id) {
        name
        role
        files(filenames: ["templates/index.json"], first: 1) {
          nodes {
            body {
              ... on OnlineStoreThemeFileBodyText { content }
            }
          }
        }
      }
    }`,
    { id: `gid://shopify/OnlineStoreTheme/${themeId}` }
  );
  const theme = json.data.theme;
  const raw = theme.files.nodes[0]?.body?.content;
  if (!raw) throw new Error(`No index.json on theme ${themeId}`);
  return { theme, index: JSON.parse(stripIndexComment(raw)) };
}

async function lookupFile(filename) {
  const json = await gql(
    `query FileLookup($q: String!) {
      files(first: 1, query: $q) {
        nodes {
          ... on MediaImage {
            id
            image { url width height }
          }
        }
      }
    }`,
    { q: `filename:${filename}` }
  );
  const node = json.data.files.nodes[0];
  if (!node?.image?.url) throw new Error(`File not found: ${filename}`);
  return node.image;
}

function compressToWebp(inputPath, outputPath, maxWidth, quality = 80) {
  execFileSync('cwebp', ['-quiet', '-q', String(quality), '-resize', String(maxWidth), '0', inputPath, '-o', outputPath], {
    stdio: 'inherit',
  });
}

function compressResponsiveSet(inputPath, assetBase, qualities = { 480: 72, 720: 72, 1080: 68 }) {
  const assetsDir = join(process.cwd(), 'assets');
  const outputs = [];
  for (const [width, quality] of Object.entries(qualities)) {
    const suffix = width === '1080' ? '' : `-${width}`;
    const filename = `${assetBase}${suffix}.webp`;
    const outPath = join(assetsDir, filename);
    compressToWebp(inputPath, outPath, Number(width), quality);
    outputs.push({ filename, outPath, width: Number(width) });
  }
  return outputs;
}

async function uploadWebp(localPath, filename) {
  if (DRY_RUN) {
    console.log(`[dry-run] would upload ${filename}`);
    return `shopify://shop_images/${filename}`;
  }

  const buffer = readFileSync(localPath);
  const mimeType = 'image/webp';

  const staged = await gql(
    `mutation StagedUpload($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets { url resourceUrl parameters { name value } }
        userErrors { field message }
      }
    }`,
    {
      input: [{ filename, mimeType, resource: 'FILE', httpMethod: 'POST' }],
    }
  );

  const target = staged.data.stagedUploadsCreate.stagedTargets[0];
  const form = new FormData();
  for (const param of target.parameters) form.append(param.name, param.value);
  form.append('file', new Blob([buffer], { type: mimeType }), filename);

  const uploadRes = await fetch(target.url, { method: 'POST', body: form });
  if (!uploadRes.ok) {
    throw new Error(`Staged upload failed: ${uploadRes.status} ${await uploadRes.text()}`);
  }

  const created = await gql(
    `mutation FileCreate($files: [FileCreateInput!]!) {
      fileCreate(files: $files) {
        files {
          ... on MediaImage { id image { url } }
        }
        userErrors { field message }
      }
    }`,
    {
      files: [{ originalSource: target.resourceUrl, contentType: 'FILE', filename }],
    }
  );

  const errors = created.data.fileCreate.userErrors;
  if (errors?.length) throw new Error(JSON.stringify(errors, null, 2));

  const file = created.data.fileCreate.files[0];
  console.log(`Uploaded ${filename}: ${file.image?.url || file.id}`);
  return `shopify://shop_images/${filename}`;
}

async function upsertThemeIndex(themeId, indexObject) {
  const header =
    '/*\n * ------------------------------------------------------------\n * IMPORTANT: The contents of this file are auto-generated.\n *\n * This file may be updated by the Shopify admin theme editor\n * or related systems. Please exercise caution as any changes\n * made to this file may be overwritten.\n * ------------------------------------------------------------\n */';
  const content = `${header}\n${JSON.stringify(indexObject, null, 2)}\n`;

  if (DRY_RUN) {
    console.log(`[dry-run] would update theme ${themeId} index.json`);
    return;
  }

  const response = await fetch(`https://${STORE}/admin/api/${API_VERSION}/themes/${themeId}/assets.json`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': TOKEN,
    },
    body: JSON.stringify({
      asset: { key: 'templates/index.json', value: content },
    }),
  });

  const json = await response.json();
  if (!response.ok) throw new Error(JSON.stringify(json, null, 2));
  console.log(`Updated templates/index.json on theme ${themeId}`);
}

async function processHeroImage(sourceFilename, outputFilename) {
  console.log(`\nProcessing ${sourceFilename} -> ${outputFilename}`);
  const image = await lookupFile(sourceFilename);
  console.log(`  Source: ${image.width}x${image.height} ${image.url}`);

  const targetWidth = Math.min(image.width, 2160);
  const quality = image.width <= 1440 ? 68 : 78;

  mkdirSync(TMP_DIR, { recursive: true });
  const srcPath = join(TMP_DIR, sourceFilename);
  const outPath = join(TMP_DIR, outputFilename);

  if (!DRY_RUN) {
    const res = await fetch(image.url);
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    writeFileSync(srcPath, Buffer.from(await res.arrayBuffer()));
    const srcSize = statSync(srcPath).size;
    console.log(`  Downloaded ${(srcSize / 1024).toFixed(1)} KiB`);

    compressToWebp(srcPath, outPath, targetWidth, quality);
    const outSize = statSync(outPath).size;
    console.log(`  Compressed ${(outSize / 1024).toFixed(1)} KiB (${Math.round((1 - outSize / srcSize) * 100)}% smaller)`);
  }

  const shopifyRef = await uploadWebp(outPath, outputFilename);
  return shopifyRef;
}

async function main() {
  const themeUpdates = [];

  for (const [key, themeId] of Object.entries(THEMES)) {
    const { theme, index } = await getThemeIndexJson(themeId);
    const split = index.sections['split-hero']?.settings;
    if (!split?.image_left || !split?.image_right) {
      console.warn(`Skipping ${theme.name} — no split-hero images`);
      continue;
    }

    const leftSrc = split.image_left.replace('shopify://shop_images/', '');
    const rightSrc = split.image_right.replace('shopify://shop_images/', '');
    const suffix = key === 'main' ? '' : '-dev';

    const leftOut = `monni-split-hero-left${suffix}.webp`;
    const rightOut = `monni-split-hero-right${suffix}.webp`;

    const leftRef = await processHeroImage(leftSrc, leftOut);
    const rightRef = await processHeroImage(rightSrc, rightOut);

    split.image_left = leftRef;
    split.image_right = rightRef;
    themeUpdates.push({ themeId, themeName: theme.name, role: theme.role, index });
  }

  for (const update of themeUpdates) {
    await upsertThemeIndex(update.themeId, update.index);
    console.log(`Theme "${update.themeName}" (${update.role}) hero images updated.`);
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
