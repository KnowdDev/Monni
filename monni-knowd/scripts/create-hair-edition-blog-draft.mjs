#!/usr/bin/env node
/**
 * Create a draft Journal article merging Healthy Locks tips + Molasses Banana Bread.
 *
 * Usage:
 *   SHOPIFY_ADMIN_TOKEN=shpat_... node scripts/create-hair-edition-blog-draft.mjs
 *   SHOPIFY_ADMIN_TOKEN=shpat_... node scripts/create-hair-edition-blog-draft.mjs --dry-run
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const REPO_ROOT = join(ROOT, '..');

const STORE = process.env.SHOPIFY_STORE || 'tea-tonic-matakana.myshopify.com';
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = '2025-01';
const DRY_RUN = process.argv.includes('--dry-run');

const BLOG_HANDLE = 'journal';
const ARTICLE_HANDLE = 'ten-tips-healthy-locks-molasses-banana-bread';
const ARTICLE_TITLE = 'Ten Tips for Healthy Locks & Monni\'s Molasses Banana Bread';
const AUTHOR = 'Amber McLennan';
const SUMMARY =
  'Community herbalist Amber shares ten easy tips for thick, healthy hair — plus Monni\'s gluten-free molasses banana bread recipe to nourish your ends from within.';

const HERO_IMAGE_URL =
  'https://cdn.shopify.com/s/files/1/2511/3170/t/61/assets/monarc-hairpin-hand.jpg';
const UNSPLASH_BANANA_URL =
  'https://images.unsplash.com/photo-1632931057819-4eefffa8e007?auto=format&fit=crop&w=1400&q=80';

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

async function getBlogId() {
  const json = await gql(
    `query Blogs($query: String!) {
      blogs(first: 1, query: $query) {
        nodes { id handle title }
      }
    }`,
    { query: `handle:${BLOG_HANDLE}` }
  );
  const blog = json.data.blogs.nodes[0];
  if (!blog) throw new Error(`Blog not found: ${BLOG_HANDLE}`);
  return blog.id;
}

async function findExistingArticle(blogId) {
  const json = await gql(
    `query Article($query: String!) {
      articles(first: 1, query: $query) {
        nodes { id handle title isPublished }
      }
    }`,
    { query: `handle:${ARTICLE_HANDLE}` }
  );
  return json.data.articles.nodes[0] || null;
}

async function uploadImageFromUrl(sourceUrl, filename, mimeType = 'image/jpeg') {
  if (DRY_RUN) {
    console.log(`[dry-run] would upload ${filename} from ${sourceUrl}`);
    return sourceUrl;
  }

  const download = await fetch(sourceUrl);
  if (!download.ok) throw new Error(`Download failed: ${download.status} ${sourceUrl}`);
  const buffer = Buffer.from(await download.arrayBuffer());

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
          id
          ... on MediaImage { id image { url width height } }
        }
        userErrors { field message }
      }
    }`,
    {
      files: [{ originalSource: target.resourceUrl, contentType: 'IMAGE', filename }],
    }
  );

  const errors = created.data.fileCreate.userErrors;
  if (errors?.length) throw new Error(JSON.stringify(errors, null, 2));

  const file = created.data.fileCreate.files[0];
  let url = file?.image?.url;

  if (!url && file?.id) {
    for (let attempt = 0; attempt < 8 && !url; attempt += 1) {
      await new Promise((r) => setTimeout(r, 1500));
      const polled = await gql(
        `query File($id: ID!) {
          node(id: $id) {
            ... on MediaImage { image { url } }
          }
        }`,
        { id: file.id }
      );
      url = polled.data.node?.image?.url;
    }
  }

  if (!url) {
    console.warn(`Shopify file URL not ready; using source URL in article body: ${sourceUrl}`);
    return sourceUrl;
  }
  console.log(`Uploaded ${filename}: ${url}`);
  return url;
}

function loadBodyHtml(bananaImageUrl) {
  const templatePath = join(REPO_ROOT, 'monni-theme/blogposts/healthy-locks-molasses-banana-bread.html');
  const raw = readFileSync(templatePath, 'utf8');
  return raw.replaceAll('{{BANANA_BREAD_IMAGE_URL}}', bananaImageUrl);
}

async function createDraftArticle(blogId, bodyHtml) {
  const input = {
    blogId,
    title: ARTICLE_TITLE,
    handle: ARTICLE_HANDLE,
    author: { name: AUTHOR },
    summary: SUMMARY,
    body: bodyHtml,
    isPublished: false,
    image: {
      url: HERO_IMAGE_URL,
      altText: 'Half-up hairstyle with a Monarc hair pin',
    },
  };

  if (DRY_RUN) {
    console.log('[dry-run] would create draft article:', ARTICLE_TITLE);
    console.log('[dry-run] handle:', ARTICLE_HANDLE);
    return null;
  }

  const json = await gql(
    `mutation ArticleCreate($article: ArticleCreateInput!) {
      articleCreate(article: $article) {
        article { id title handle isPublished }
        userErrors { field message }
      }
    }`,
    { article: input }
  );

  const errors = json.data.articleCreate.userErrors;
  if (errors?.length) throw new Error(JSON.stringify(errors, null, 2));
  return json.data.articleCreate.article;
}

async function updateDraftArticle(id, bodyHtml) {
  const input = {
    title: ARTICLE_TITLE,
    author: { name: AUTHOR },
    summary: SUMMARY,
    body: bodyHtml,
    isPublished: false,
    image: {
      url: HERO_IMAGE_URL,
      altText: 'Half-up hairstyle with a Monarc hair pin',
    },
  };

  if (DRY_RUN) {
    console.log('[dry-run] would update existing draft:', id);
    return null;
  }

  const json = await gql(
    `mutation ArticleUpdate($id: ID!, $article: ArticleUpdateInput!) {
      articleUpdate(id: $id, article: $article) {
        article { id title handle isPublished }
        userErrors { field message }
      }
    }`,
    { id, article: input }
  );

  const errors = json.data.articleUpdate.userErrors;
  if (errors?.length) throw new Error(JSON.stringify(errors, null, 2));
  return json.data.articleUpdate.article;
}

async function main() {
  console.log('Creating Hair Edition journal draft…');
  const blogId = DRY_RUN ? 'gid://shopify/Blog/0' : await getBlogId();
  if (!DRY_RUN) console.log('Journal blog:', blogId);

  const bananaImageUrl = await uploadImageFromUrl(
    UNSPLASH_BANANA_URL,
    'hair-edition-molasses-banana-bread-unsplash.jpg',
    'image/jpeg'
  );

  const bodyHtml = loadBodyHtml(bananaImageUrl);
  const existing = DRY_RUN ? null : await findExistingArticle(blogId);

  const article = existing
    ? await updateDraftArticle(existing.id, bodyHtml)
    : await createDraftArticle(blogId, bodyHtml);

  if (article) {
    const adminUrl = `https://${STORE}/admin/blogs/${BLOG_HANDLE}/articles/${article.id.split('/').pop()}`;
    console.log('\nDraft saved:');
    console.log('  Title:', article.title);
    console.log('  Handle:', article.handle);
    console.log('  Admin:', adminUrl);
    console.log('  Preview (when published):', `https://teaandtonic.co.nz/blogs/journal/${article.handle}`);
  } else if (DRY_RUN) {
    console.log('\nDry run complete — HTML length:', bodyHtml.length);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
