/**
 * SEO titles and meta descriptions for collection, brand, and key pages.
 * In sync with on-page copy. No em dashes. Titles end with MONNI so the
 * theme does not append the old shop name.
 *
 * Title aim: 40-60 characters. Description aim: 140-160 characters.
 */

import { collections } from './collections-data.mjs';
import { brands } from './brands-data.mjs';

export const SEO_BRAND = 'MONNI';

function noDash(text) {
  return String(text || '')
    .replace(/[\u2014\u2013\u2012]/g, ',')
    .replace(/\s+/g, ' ')
    .trim();
}

function clipMeta(text, max = 158) {
  const cleaned = noDash(text);
  if (cleaned.length <= max) return cleaned;
  const cut = cleaned.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  const clipped = (lastSpace > 110 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:]$/, '');
  return `${clipped}.`;
}

/** Unique, keyword-led collection SEO. Descriptions paraphrases of live page copy. */
export const collectionSeo = {
  wellness: {
    title: 'Wellbeing | Tea, Aromatherapy and Supplements | MONNI',
    description:
      'Shop herbal tea, aromatherapy and natural supplements at MONNI. Wellness chosen for nourishment, daily rhythm and a deep respect for body, mind and nature.',
  },
  'monni-tea': {
    title: 'Monni Tea | Organic Single Leaf Herbs | MONNI',
    description:
      'Monni Tea is a certified organic dispensary of single leaf herbs and botanicals. Blend at home, or visit us in Matakana for a custom blend made for you.',
  },
  tea: {
    title: 'Herbal Tea and Restorative Blends | MONNI',
    description:
      'Shop herbal infusions, everyday drinking teas and single origin teas at MONNI. Chosen for quality, provenance and the unhurried ritual of brewing and drinking.',
  },
  aromatherapy: {
    title: 'Aromatherapy | Essential Oils and Botanical Mists | MONNI',
    description:
      'Shop essential oils, aromatic blends and mists at MONNI. Aromatherapy chosen for genuine quality, to bring calm, clarity or a quiet shift in the day.',
  },
  sleep: {
    title: 'Sleep | Calming Tea, Mists and Silk Masks | MONNI',
    description:
      'Shop calming teas, herbs, pillow mists, travel pillows and silk eye masks at MONNI. Sleep support chosen to ease the body toward genuine rest.',
  },
  supplements: {
    title: 'Natural Supplements | Daily Wellbeing | MONNI',
    description:
      'Shop considered supplements at MONNI, chosen to support the body from within. Formulations from makers who bring both rigour and integrity to daily wellbeing.',
  },
  beauty: {
    title: 'Natural Beauty | Low-Tox Skincare and Body | MONNI',
    description:
      'Shop natural, low-tox beauty at MONNI, including Monni Botanicals. Skincare, body, hair, fragrance and mother and baby care chosen for integrity and efficacy.',
  },
  'monni-botanicals': {
    title: 'Monni Botanicals | Seed-to-Bottle Skincare NZ | MONNI',
    description:
      'Monni Botanicals is seasonal seed-to-bottle skincare made slowly in Aotearoa. Kawakawa, manuka and horopito, hand-crafted in small batches by The Herbologist.',
  },
  face: {
    title: 'Botanical Face Care | Natural Skincare | MONNI',
    description:
      'Shop botanical facial oils, cleansers, serums and creams at MONNI. Face care from artisan makers, chosen for purity, sensory quality and what it leaves out.',
  },
  'body-care': {
    title: 'Botanical Body Care | Oils, Balms and Soap | MONNI',
    description:
      'Shop botanical body oils, creams, balms, soaps and brushes at MONNI. Body care that turns an ordinary routine into a small, daily act of devotion.',
  },
  hair: {
    title: 'Gentle Haircare | Low-Tox Hair and Scalp | MONNI',
    description:
      'Shop low-tox shampoos, botanical scalp oils and lasting hair brushes at MONNI. Gentle haircare that begins at the scalp, without chemical-laden formulas.',
  },
  fragrance: {
    title: 'Botanical Fragrance | Natural Perfume | MONNI',
    description:
      'Shop botanical perfumes and oils at MONNI. Fragrance from independent perfumers working with raw plant materials, worn softly and remembered long after.',
  },
  'mother-and-baby': {
    title: 'Mother and Baby | Gentle Botanical Care | MONNI',
    description:
      'Shop gentle oils, cleansers, balms and herbal teas for pregnancy, postpartum and newborn at MONNI. Mother and baby care made with purity and reverence.',
  },
  clothing: {
    title: 'Natural Fibre Clothing | Silk, Linen, Cotton | MONNI',
    description:
      'Shop silk, linen, cotton and merino clothing at MONNI. Natural fibres chosen long before slow fashion became a conversation, led by MONNI Label.',
  },
  'monni-label': {
    title: 'MONNI Label | Natural Fibre Clothing NZ | MONNI',
    description:
      'MONNI Label is clothing designed by Monique Jansen in natural fibres. Effortless, feminine, timeless pieces made to move gently through everyday life.',
  },
  dresses: {
    title: 'Silk Dresses | Natural Fibre Clothing | MONNI',
    description:
      'Shop silk dresses at MONNI, made for the body, not the trend. Bias-cut, wrap and longer lengths in natural fibres, in colours drawn from the natural world.',
  },
  tops: {
    title: 'Tops | Silk, Linen and Merino Layers | MONNI',
    description:
      'Shop silk camisoles, relaxed shirts, merino knits and wraps at MONNI. Natural fibre tops shaped for real layering, the pieces that anchor the wardrobe.',
  },
  pants: {
    title: 'Linen and Silk Pants | Relaxed Trousers | MONNI',
    description:
      'Shop wide-leg culottes and flowing trousers in linen and silk at MONNI. Pants cut with ease in mind, quiet anchors of a wardrobe built with intention.',
  },
  skirts: {
    title: 'Skirts | Bias-Cut Silk and Linen | MONNI',
    description:
      'Shop a small selection of bias-cut and wrap skirts in natural fibres at MONNI. Designed to move with ease through the day and pair with the MONNI wardrobe.',
  },
  shorts: {
    title: 'Shorts | Silk and Linen Summer Wear | MONNI',
    description:
      'Shop silk and linen shorts at MONNI, from a boxy everyday cut to a softly frilled style. Easy, effortless pieces made for the warmer hours.',
  },
  jumpsuits: {
    title: 'MONNI Jumpsuit | All-Day Natural Comfort | MONNI',
    description:
      'The MONNI Jumpsuit is cut for all-day ease in natural fibres. A relaxed silhouette with optional waist tie, from a slow breakfast through to dinner.',
  },
  kimonos: {
    title: 'Kimonos | Silk and Linen Layering | MONNI',
    description:
      'Shop silk and linen kimonos at MONNI, long enough to wear as a coat and light enough to carry. Inspired by layered Japanese dressing, they adapt with ease.',
  },
  loungewear: {
    title: 'Silk Loungewear | Robes and Rest at Home | MONNI',
    description:
      'Shop silk loungewear and relaxed robes at MONNI. Comfort and beauty without tension, garments cut in fabrics that feel kind against the skin.',
  },
  'all-jewellery': {
    title: 'New Zealand Jewellery | Fine and Everyday | MONNI',
    description:
      'Shop NZ jewellery at MONNI from Charlotte Penman, Lisa Webb and Monarc. Pieces to wear what moves you and keep what matters, from Matakana, New Zealand.',
  },
  'fine-jewellery': {
    title: 'Fine Jewellery | Precious Metals and Stones | MONNI',
    description:
      'Shop fine jewellery at MONNI, handcrafted in precious metals with carefully sourced gemstones. Future heirlooms to mark an occasion or wear as everyday luxury.',
  },
  necklaces: {
    title: 'Necklaces | Pearls, Gold and Gemstones | MONNI',
    description:
      'Shop pearl strands, gemstone pendants and recycled gold necklaces at MONNI. Pieces designed to be worn close to the body, every day, and kept forever.',
  },
  earrings: {
    title: 'Earrings | Gold, Pearls and Gemstones | MONNI',
    description:
      'Shop gold studs, gemstone drops, sculptural hoops and pearl earrings at MONNI. Everyday pairs and pieces for moments that ask for a little more presence.',
  },
  rings: {
    title: 'Rings | Everyday and Occasion Jewellery | MONNI',
    description:
      'Shop everyday bands, sculptural rings and gemstone settings at MONNI. Rings made to be worn, loved and passed on, from daily wear to a significant occasion.',
  },
  bracelets: {
    title: 'Bracelets | Pearls, Gold and Gemstones | MONNI',
    description:
      'Shop pearl strands, gold and gemstone bracelets at MONNI, including recycled precious metals. Pieces for layering or wearing alone, built to last for years.',
  },
  'all-home': {
    title: 'Home | Ceramics, Art and Everyday Objects | MONNI',
    description:
      'Shop handmade ceramics, candles, crystals, art, teaware and textiles at MONNI. Home objects chosen for their making, and for being lived with every day.',
  },
  art: {
    title: 'MONNI Art | Original Works from Aotearoa | MONNI',
    description:
      'Original works by Monique Jansen, drawn from the land of Aotearoa with natural pigments. Art rooted in whakapapa, native plants, coastline and ocean light.',
  },
  'ceramics-shop': {
    title: 'Handmade Ceramics | Auckland and Northland | MONNI',
    description:
      'Shop handmade ceramics from independent artists across Auckland and Northland. Everyday cups, vessels and objects that make the ordinary feel considered.',
  },
  'crystals-and-rituals': {
    title: 'Crystals and Rituals | Sage and Palo Santo | MONNI',
    description:
      'Shop sustainably sourced crystals, sage and palo santo at MONNI. Ancient practices, quietly continued, to help you return to breath and what matters.',
  },
  homewares: {
    title: 'Homewares | Candles, Textiles and Glassware | MONNI',
    description:
      'Shop candles, textiles, baskets and glassware at MONNI. Homewares in natural materials, chosen to settle into a space without demanding attention.',
  },
  'home-care': {
    title: 'Natural Home Care | Gentle Cleaning | MONNI',
    description:
      'Shop plant-based hand wash, refills and multipurpose sprays at MONNI. Natural home care that is gentle on skin, kind to surfaces and calm to live with.',
  },
  teaware: {
    title: 'Teaware | Pots, Cups and Tea Ritual | MONNI',
    description:
      'Shop teapots, cups and the pieces that make tea taste different at MONNI. Teaware chosen to bring a sense of ceremony to even the simplest cup.',
  },
  pantry: {
    title: 'Pantry | Exceptional Food from Makers | MONNI',
    description:
      'A small, deliberate pantry at MONNI. Food chosen because it is genuinely exceptional, from makers who care about quality, integrity and the land.',
  },
  'all-gifting': {
    title: 'Considered Gifts | Beauty, Wellness and Home | MONNI',
    description:
      'Shop considered gifts at MONNI, from beauty and wellness to homewares and ceramics. Giving as a form of love, wrapped with care in Matakana, New Zealand.',
  },
  giftboxes: {
    title: 'Gift Boxes | Curated and Beautifully Wrapped | MONNI',
    description:
      'Shop curated gift boxes at MONNI for rest, nourishment, motherhood, home and everyday pleasure. Wrapped with recyclable tissue, dried flowers and a note.',
  },
  cards: {
    title: 'Greeting Cards | Art and Everyday Notes | MONNI',
    description:
      'Shop greeting cards at MONNI for love, friendship, celebration, sympathy and new beginnings, including Monique Jansen ink drawings worth keeping.',
  },
  'gift-card': {
    title: 'Gift Cards | Redeem Online or In Store | MONNI',
    description:
      'Give a MONNI gift card and let someone choose what they need. Delivered by email, redeemable online or in Matakana. No extra fees, and they do not expire.',
  },
};

const brandCategory = {
  'absolute-essential': 'Medicinal Essential Oils',
  'alexandra-beauty': 'Organic Skincare',
  'amber-and-gold': 'Herbal Teas',
  aotea: 'Native Botanical Skincare',
  artemis: 'Herbal Teas and Tonics',
  bepure: 'Nutritional Supplements',
  chakra: 'Crystals and Rituals',
  'charlotte-penman': 'NZ Jewellery',
  'come-clean': 'Natural Intimate Care',
  coskin: 'Natural Sunscreen',
  dwyer: 'Matakana Perfume',
  'eco-art': 'Beeswax Candles',
  'fountain-of-youth': 'Botanical Breast Care',
  'frolic-ceramics': 'Handmade Ceramics',
  hyoumankind: 'Sleep Pillows',
  'jan-haora': 'Beeswax Ear Candles',
  'keller-bursten': 'Natural Body Brushes',
  kinto: 'Japanese Teaware',
  'le-panier': 'Raffia Baskets',
  'le-verre-beldi': 'Handmade Glassware',
  'lisa-webb': 'Matakana Jewellery',
  'live-wild': 'Wholefood Wellbeing',
  'maeve-ceramics': 'Handmade Ceramics',
  'mahurangi-olives': 'Olive Oil and Soap',
  'mangawhai-honey': 'Local Honey',
  maryse: 'Botanical Face Oils',
  melitta: 'Daily SPF Skincare',
  'monarc-jewellery': 'Recycled Fine Jewellery',
  'monni-botanicals': 'Seasonal Skincare NZ',
  'monni-label': 'Natural Fibre Clothing',
  'monni-art': 'Original Aotearoa Art',
  mothermade: 'Organic Mushroom Extracts',
  nara: 'Mother and Baby Skincare',
  'nz-charly': 'Independent Maker',
  'on-sundays': 'Organic Loose Leaf Tea',
  'people-of-the-earth': 'Reef-Safe Suncare',
  'roger-orfevre': 'French Kitchen Tools',
  santosa: 'Natural Home Care',
  'sattva-soul': 'Ayurvedic Supplements',
  'soul-centre': 'Healing and Plant Care',
  'storm-and-india': 'Organic Herbal Tea',
  'sunhouse-chai': 'Organic Chai',
  superfeast: 'Tonic Herbs and Mushrooms',
  'suzanne-day': 'Cards and Objects',
  tahi: 'Native Botanical Oils',
  'the-knitter': 'Handmade Knitwear',
  'ti-point-olives': 'Northland Olive Oil',
  vania: 'Gemstone Jewellery',
  'wild-earth': 'Natural Perfume',
  'wild-and-indigo': 'Naturally Dyed Textiles',
};

const brandDescriptionOverride = {
  'amber-and-gold':
    'Amber and Gold herbal teas and flower essences at MONNI. Earthy, nurturing support for the body from within, crafted with intent. Shop in Matakana, New Zealand.',
  'charlotte-penman':
    'Charlotte Penman jewellery at MONNI. Romantic, talismanic NZ pieces worn as amulet, keepsake or quiet armour. Shop the collection in Matakana.',
  'lisa-webb':
    'Lisa Webb jewellery, made in Matakana and inspired by the Tawharanui coast. Local, considered pieces that feel, from the first wear, like they were yours.',
  'monarc-jewellery':
    'Monarc Jewellery at MONNI. Recycled precious metals and aboveground diamonds, B Corp certified NZ pieces made to be worn, loved and passed on.',
  'monni-botanicals':
    'Monni Botanicals is seed-to-bottle seasonal skincare, made slowly in Aotearoa with kawakawa, manuka and horopito. Shop the range at MONNI, Matakana.',
  'monni-label':
    'MONNI Label is natural fibre clothing designed by Monique Jansen in Aotearoa. Silk, linen, cotton and merino pieces made to be worn for years, not a moment.',
  'monni-art':
    'MONNI Art by Monique Jansen. Original works from Aotearoa using natural pigments foraged from the land. Shop original art at MONNI, Matakana.',
  dwyer:
    'Dwyer is Matakana perfume and facial oils, blended by hand in small batches. Local, handcrafted scent and skin rituals, available at MONNI.',
};

export const pageSeo = {
  brands: {
    title: 'Shop by Brand | Independent Makers | MONNI',
    description:
      'Discover the makers behind MONNI. Independent brands chosen for quality, integrity and the rituals of everyday wellbeing. Shop by brand in Matakana, NZ.',
  },
};

function brandTitle(brand) {
  const category = brandCategory[brand.handle];
  const long = category ? `${brand.name} | ${category} | MONNI` : `${brand.name} | MONNI`;
  if (long.length <= 60) return long;
  const shorter = `${brand.name} | ${category} | MONNI`;
  if (category && shorter.length <= 60) return shorter;
  return `${brand.name} | MONNI`;
}

function brandDescription(brand) {
  if (brandDescriptionOverride[brand.handle]) return clipMeta(brandDescriptionOverride[brand.handle]);
  if (brand.tagline) {
    const withPlace = `${noDash(brand.tagline)} Shop at MONNI, Matakana.`;
    if (noDash(brand.tagline).length >= 130 && noDash(brand.tagline).length <= 160) {
      return noDash(brand.tagline);
    }
    return clipMeta(withPlace);
  }
  return clipMeta(
    `Discover ${brand.name} at MONNI in Matakana. Independent makers chosen for quality, integrity and the rituals of everyday wellbeing.`
  );
}

export const brandSeo = Object.fromEntries(
  brands.map((brand) => [
    brand.handle,
    {
      title: brandTitle(brand),
      description: brandDescription(brand),
    },
  ])
);

export function seoForCollection(handle) {
  return collectionSeo[handle] || null;
}

export function getCollectionEntries() {
  return collections.map((entry) => ({
    handle: entry.handle,
    ...collectionSeo[entry.handle],
  }));
}

export function validateSeoCopy() {
  const issues = [];
  const dash = /[\u2014\u2013\u2012]/;
  const check = (kind, handle, { title, description }) => {
    if (!title || !description) issues.push(`${kind}:${handle} missing title or description`);
    if (dash.test(title) || dash.test(description)) issues.push(`${kind}:${handle} contains a dash character`);
    if (title && title.length > 62) issues.push(`${kind}:${handle} title ${title.length} chars: ${title}`);
    if (description && (description.length < 110 || description.length > 160)) {
      issues.push(`${kind}:${handle} description ${description.length} chars`);
    }
    if (title && !title.includes('MONNI')) issues.push(`${kind}:${handle} title missing MONNI`);
  };

  for (const [handle, seo] of Object.entries(collectionSeo)) check('collection', handle, seo);
  for (const [handle, seo] of Object.entries(brandSeo)) check('brand', handle, seo);
  for (const [handle, seo] of Object.entries(pageSeo)) check('page', handle, seo);

  const missingCollections = collections.filter((entry) => !collectionSeo[entry.handle]).map((e) => e.handle);
  if (missingCollections.length) issues.push(`collections missing SEO: ${missingCollections.join(', ')}`);

  return issues;
}
