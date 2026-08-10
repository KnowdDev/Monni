const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const counts = {};
let url = 'https://tea-tonic-matakana.myshopify.com/admin/api/2024-10/products.json?status=active&limit=250&fields=id,tags';
while (url) {
  const r = await fetch(url, { headers: { 'X-Shopify-Access-Token': TOKEN } });
  const j = await r.json();
  for (const p of j.products) {
    for (const t of p.tags.split(',').map((x) => x.trim())) {
      if (t.startsWith('collection:')) counts[t.slice(11)] = (counts[t.slice(11)] || 0) + 1;
    }
  }
  const link = r.headers.get('link') || '';
  const m = link.match(/page_info=([^>&]+)[^>]*>; rel="next"/);
  url = m
    ? `https://tea-tonic-matakana.myshopify.com/admin/api/2024-10/products.json?status=active&limit=250&fields=id,tags&page_info=${m[1]}`
    : null;
}
console.log(Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}: ${v}`).join('\n'));
