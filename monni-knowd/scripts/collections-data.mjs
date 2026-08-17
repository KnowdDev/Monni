/**
 * MONNI collection catalogue — source of truth for handles, hierarchy, and page copy.
 * Top line renders above the product grid; bottom paragraphs render below.
 */

export const collectionParents = [
  { key: 'wellness', label: 'Wellness', handle: 'wellness' },
  { key: 'beauty', label: 'Beauty', handle: 'beauty' },
  { key: 'clothing', label: 'Clothing', handle: 'clothing' },
  { key: 'jewellery', label: 'Jewellery', handle: 'all-jewellery' },
  { key: 'home', label: 'Home', handle: 'all-home' },
  { key: 'gifting', label: 'Gifting', handle: 'all-gifting' },
];

export const collections = [
  // ── Wellness ──────────────────────────────────────────────────────────────
  {
    handle: 'wellness',
    title: 'All Wellness',
    parent: 'wellness',
    nav_label: 'All Wellness',
    sort_order: 0,
    top_line: 'Wellbeing begins within.',
    bottom_paragraphs: [
      'At MONNI, it is approached through nourishment, daily rhythm, and a deep respect for the connection between body, mind, and the natural world.',
      'Our wellness collection brings together herbal teas, aromatherapy, and natural supplements, all selected to support everyday wellbeing in a grounded and holistic way. We are drawn to makers who understand plants, who work slowly, and who believe that the way something is made matters as much as what it does.',
    ],
  },
  {
    handle: 'monni-tea',
    title: 'Monni Tea',
    parent: 'wellness',
    nav_label: 'Monni Tea',
    sort_order: 1,
    top_line: 'A ritual made entirely for you.',
    bottom_paragraphs: [
      'Monni Tea is a carefully curated dispensary of certified organic single leaf herbs and botanicals, each chosen for their therapeutic qualities and their ability to support the body and mind in a genuine and meaningful way.',
      'Single leaf teas are available to shop online, allowing you to blend and create at home. For those who visit us in store, our team will create a custom blend to your specific needs, intentions and taste. A quiet and considered ritual, made entirely for you.',
    ],
  },
  {
    handle: 'tea',
    title: 'Tea',
    parent: 'wellness',
    nav_label: 'Tea',
    sort_order: 2,
    // Live smart-collection rule (Shopify TAG match is case-sensitive)
    smart_tag: 'tea',
    top_line: 'An act of nourishment, repeated daily.',
    bottom_paragraphs: [
      'Our collection spans herbal infusions and restorative blends, everyday drinking teas and single origin teas, chosen for their quality, their provenance and the quiet ritual of brewing and drinking. Whether you are drawn to something grounding and earthy, uplifting and bright, or deeply calming, there is a cup here for the moment you are in.',
    ],
  },
  {
    handle: 'aromatherapy',
    title: 'Aromatherapy',
    parent: 'wellness',
    nav_label: 'Aromatherapy',
    sort_order: 3,
    top_line: 'A quiet shift. A breath. A return.',
    bottom_paragraphs: [
      'The body responds to scent in ways that go beyond the surface.',
      'Our aromatherapy collection draws on the sensory qualities of botanicals to accompany all of life\'s moments. Essential oils, aromatic blends, and mists chosen not for trend but for genuine quality, to bring a sense of calm to a difficult moment, clarity to a clouded one, or simply to mark the transition from one part of the day to another.',
    ],
  },
  {
    handle: 'sleep',
    title: 'Sleep',
    parent: 'wellness',
    nav_label: 'Sleep',
    sort_order: 4,
    // Live smart-collection rule (Shopify TAG match is case-sensitive)
    smart_tag: 'sleep',
    top_line: 'A quieter end to the day.',
    bottom_paragraphs: [
      'Our sleep collection gathers the rituals that help the body soften into rest — supportive pillows, calming teas, night-time supplements, and a gentle sleep spray for the pillow and the air.',
      'Chosen for genuine quality and a slower approach to winding down, these are pieces for evenings that ask for less stimulation and more care.',
    ],
  },
  {
    handle: 'supplements',
    title: 'Supplements',
    parent: 'wellness',
    nav_label: 'Supplements',
    sort_order: 5,
    top_line: 'Nothing excessive. Everything purposeful.',
    bottom_paragraphs: [
      'A considered approach to supporting the body from within.',
      'Our supplements are selected with care and a genuine understanding of daily wellbeing, chosen to complement a considered, nourishing approach to everyday life. We favour formulations from makers who bring both rigour and integrity to their craft, working gently and thoughtfully.',
    ],
  },

  // ── Beauty ────────────────────────────────────────────────────────────────
  {
    handle: 'beauty',
    title: 'All Beauty',
    parent: 'beauty',
    nav_label: 'All Beauty',
    sort_order: 0,
    top_line: 'What we place on our skin matters.',
    bottom_paragraphs: [
      'At MONNI, we recognise skin as the body\'s largest organ and are deeply mindful of the products we bring into daily life and the ingredients absorbed through everyday care and ritual.',
      'Our beauty collection is curated with a focus on natural, low-tox, spray-free, and organic ingredients wherever possible, including our own Monni Botanicals line, bringing together products that genuinely support wellbeing, nourishment, and conscious living.',
      'From skincare and body care to hair, fragrance, and a tender collection for mother and baby, each product is selected for its integrity, its efficacy, and its alignment with a slower, more considered approach to beauty.',
    ],
  },
  {
    handle: 'monni-botanicals',
    title: 'Monni Botanicals',
    parent: 'beauty',
    nav_label: 'Monni Botanicals',
    sort_order: 1,
    top_line: 'Seed-to-bottle seasonal skincare, made slowly.',
    bottom_paragraphs: [
      'Monni Botanicals is a skincare line rooted in seasonality, plant knowledge, and thoughtful craft. Made slowly and with intention by The Herbologist in Aotearoa New Zealand, each product is inspired by a deep respect for the land and the native botanicals it sustains, kawakawa, manuka, and horopito alongside seasonal flowers and herbs.',
      'Hand-crafted in small batches that naturally vary in scent and colour, reflecting the season in which they were made.',
    ],
  },
  {
    handle: 'face',
    title: 'Face',
    parent: 'beauty',
    nav_label: 'Face',
    sort_order: 2,
    top_line: 'Chosen for what it does, and what it leaves out.',
    bottom_paragraphs: [
      'Our facial collection brings together botanical formulations from independent artisan producers who care deeply about the integrity of their ingredients.',
      'From facial oils and gentle cleansers to targeted serums and nourishing creams, each product is chosen for its purity, its sensory quality, and its ability to work with the skin. Made with natural and botanical ingredients, many grown using organic and regenerative practices.',
    ],
  },
  {
    handle: 'body-care',
    title: 'Body',
    parent: 'beauty',
    nav_label: 'Body',
    sort_order: 3,
    top_line: 'Every day, a small act of devotion.',
    bottom_paragraphs: [
      'Body care that turns an ordinary routine into something worth pausing for.',
      'Our collection offers botanical body oils, nourishing creams, rich balms, handcrafted soaps, and body brushes, gathered for their quality, gentleness, and the care with which they are made. Each product is made by people who care about what goes into them as much as we do.',
    ],
  },
  {
    handle: 'hair',
    title: 'Hair',
    parent: 'beauty',
    nav_label: 'Hair',
    sort_order: 4,
    top_line: 'Gentle haircare that begins at the scalp.',
    bottom_paragraphs: [
      'We have moved away from the idea that haircare needs to be complicated or chemical-laden.',
      'Our collection includes low-tox shampoos and treatments, botanical scalp oils, and beautifully made brushes and tools curated for their quality and longevity. These are products for people who want their hair to feel genuinely healthy, soft, strong, and cared for.',
    ],
  },
  {
    handle: 'fragrance',
    title: 'Fragrance',
    parent: 'beauty',
    nav_label: 'Fragrance',
    sort_order: 5,
    // Live smart-collection rule (Shopify TAG match is case-sensitive)
    smart_tag: 'Fragrance',
    top_line: 'Worn softly. Remembered long after.',
    bottom_paragraphs: [
      'Scent is a way of arriving somewhere, fully present, grounded, and yourself.',
      'Our fragrance collection is built around botanical perfumes and aromatic oils made by independent perfumers who work closely with raw plant materials. Earthy, resinous, floral, herbaceous, these are scents drawn from nature rather than a laboratory, chosen to linger softly and shift gently through the day.',
      'Whether worn on the skin or diffused into a room, each one creates a quiet atmosphere of its own.',
    ],
  },
  {
    handle: 'mother-and-baby',
    title: 'Mother & Baby',
    parent: 'beauty',
    nav_label: 'Mother & Baby',
    sort_order: 6,
    top_line: 'Gentle by nature. Made with reverence.',
    bottom_paragraphs: [
      'Our Mother & Baby collection is gathered with both mother and newborn in mind, offering gentle support through the tenderness of pregnancy, the rawness of postpartum, and the slow, sacred rhythms of early life together.',
      'From nourishing oils and gentle cleansers to protective balms and softly bristled brushes, each product is selected for its purity and gentleness. For new mothers, we also carry restorative herbal teas to support rest, recovery, and the quieter needs of this season.',
      'Nothing harsh. Nothing unnecessary. Only what truly nourishes, for the body that has given so much, and the new one just arriving.',
    ],
  },

  // ── Clothing ────────────────────────────────────────────────────────────
  {
    handle: 'clothing',
    title: 'All Clothing',
    parent: 'clothing',
    nav_label: 'All Clothing',
    sort_order: 0,
    // Live smart-collection rule (Shopify TAG match is case-sensitive)
    smart_tag: 'clothing',
    top_line: 'An extension of the way we live, move, and feel.',
    bottom_paragraphs: [
      'Since our founding, we have been committed to 100% natural fibres, silk, linen, cotton, and merino, long before slow fashion became a conversation.',
      'Our fabrics are carefully sourced, from sustainably milled textiles to limited edition runs in plant-dyed and designer materials, each chosen for their quality, integrity, and beauty. The collection is anchored by MONNI Label, alongside a curated selection of like-minded pieces designed to be worn with ease and intention.',
    ],
  },
  {
    handle: 'monni-label',
    title: 'MONNI Label',
    parent: 'clothing',
    nav_label: 'MONNI Label',
    sort_order: 1,
    top_line: 'Effortless, timeless, and deeply wearable.',
    bottom_paragraphs: [
      'MONNI Label is a collection of thoughtfully designed garments created to feel effortless, feminine, timeless, and deeply wearable. Designed by founder Monique Jansen, the label is an extension of the wider MONNI philosophy, bringing together a love of natural fibres, art, nature, and considered daily living.',
      'Each piece is created with intention, balancing comfort, ease, and understated elegance through relaxed silhouettes designed to move gently through seasons and everyday life.',
    ],
  },
  {
    handle: 'dresses',
    title: 'Dresses',
    parent: 'clothing',
    nav_label: 'Dresses',
    sort_order: 2,
    top_line: 'Made for the body, not the trend.',
    bottom_paragraphs: [
      'Our collection brings together fluid silhouettes cut on the bias, wrap forms that settle softly at the waist, and longer lengths that graze the ankle with quiet intention.',
      'Made mostly from silk, these pieces are not built around trends but around the body, the way it moves, breathes, and wants to feel at ease, in colours drawn from the natural world.',
    ],
  },
  {
    handle: 'tops',
    title: 'Tops',
    parent: 'clothing',
    nav_label: 'Tops',
    sort_order: 3,
    top_line: 'The pieces that anchor the wardrobe.',
    bottom_paragraphs: [
      'Our tops are shaped for real layering: bias-cut camisoles that sit beneath a kimono or stand alone, relaxed shirts that tuck or drape, soft fitted merinos to keep the body\'s warmth, wraps that tie loosely and hold their form through a long day.',
      'Cut in natural fibres that soften with wear, these are the pieces that anchor the wardrobe.',
    ],
  },
  {
    handle: 'pants',
    title: 'Pants',
    parent: 'clothing',
    nav_label: 'Pants',
    sort_order: 4,
    top_line: 'Thoughtful by nature. Relaxed by design.',
    bottom_paragraphs: [
      'Our collection includes wide-leg culotte silhouettes and flowing trousers cut with ease in mind, in linen and silk that breathe, drape, and age beautifully. These are the quiet anchors of a wardrobe built with intention.',
    ],
  },
  {
    handle: 'skirts',
    title: 'Skirts',
    parent: 'clothing',
    nav_label: 'Skirts',
    sort_order: 5,
    top_line: 'Designed to move beautifully through your day.',
    bottom_paragraphs: [
      'A skirt changes the way a day feels, unhurried, feminine, and quietly considered.',
      'Our collection offers a small and deliberate selection of bias-cut and wrap styles in natural fibres, designed to move beautifully and pair effortlessly with everything else in the MONNI wardrobe.',
    ],
  },
  {
    handle: 'shorts',
    title: 'Shorts',
    parent: 'clothing',
    nav_label: 'Shorts',
    sort_order: 6,
    top_line: 'Small in number, considered in every detail.',
    bottom_paragraphs: [
      'Our shorts are cut in silk and linen, a boxy shape for relaxed everyday wear, and a softly frilled style that sits somewhere between a short and a skirt. Easy, effortless, and made for the warmer hours.',
    ],
  },
  {
    handle: 'jumpsuits',
    title: 'Jumpsuits',
    parent: 'clothing',
    nav_label: 'Jumpsuits',
    sort_order: 7,
    top_line: 'One decision. All day comfort.',
    bottom_paragraphs: [
      'The MONNI Jumpsuit is cut with an ease that makes it feel less like a garment and more like a resolution, the answer to mornings when you want to move without thinking too hard about what you\'re wearing.',
      'With a relaxed silhouette, optional waist tie, and a shape that transitions from a slow breakfast to dinner without needing to change, it is the kind of piece that travels well and lives in constant rotation.',
    ],
  },
  {
    handle: 'kimonos',
    title: 'Kimonos',
    parent: 'clothing',
    nav_label: 'Kimonos',
    sort_order: 8,
    top_line: 'The most versatile thing in a considered wardrobe.',
    bottom_paragraphs: [
      'Inspired by the Japanese tradition of layered, considered dressing, our kimonos are long enough to wear as a coat, light enough to carry in a bag, and beautifully made in silk and linen that move with the body.',
      'Worn open over a slip dress, wrapped loosely at home, or pulled over a swimsuit at the beach, they adapt effortlessly.',
    ],
  },
  {
    handle: 'loungewear',
    title: 'Loungewear',
    parent: 'clothing',
    nav_label: 'Loungewear',
    sort_order: 9,
    top_line: 'For the hours that belong entirely to you.',
    bottom_paragraphs: [
      'Our loungewear collection moves away from the idea that comfort and beauty are in tension, soft robes and relaxed essentials made to be worn at home with genuine pleasure.',
      'Rest deserves the same intention as everything else. Garments made in fabrics that feel kind against the skin.',
    ],
  },

  // ── Jewellery ───────────────────────────────────────────────────────────
  {
    handle: 'all-jewellery',
    title: 'All Jewellery',
    parent: 'jewellery',
    nav_label: 'All Jewellery',
    sort_order: 0,
    top_line: 'Wear what moves you. Keep what matters.',
    bottom_paragraphs: [
      'We are proud to stock the work of three exceptional New Zealand makers, each bringing a distinct voice and philosophy to what it means to wear something beautiful.',
      'Charlotte Penman is inspired by nature, 20th century icons, antiquity jewels and the dreamy beauty of Balearic coastlines, her pieces carry a bohemian yet timeless sophistication, designed to be worn as amulet, keepsake or quiet armour for the everyday.',
      'Lisa Webb works from her Matakana studio, drawing on the wild coastlines, shifting light and untamed landscapes of the Tawharanui Peninsula, her work balancing the delicate and the bold.',
      'Monarc, founded by Ella Drake, is made from 100% recycled precious metals and aboveground diamonds and gemstones, refined, conscious, and quietly heirloom.',
    ],
  },
  {
    handle: 'fine-jewellery',
    title: 'Fine Jewellery',
    parent: 'jewellery',
    nav_label: 'Fine Jewellery',
    sort_order: 1,
    top_line: 'Not simply accessories. Future heirlooms.',
    bottom_paragraphs: [
      'Fine jewellery is chosen for those moments that ask for something more enduring, a piece to mark an occasion, carry a meaning, or simply wear as a quiet daily luxury.',
      'Handcrafted in precious metals with carefully sourced gemstones, each piece is made with the kind of intention that outlasts the moment of purchase.',
    ],
  },
  {
    handle: 'necklaces',
    title: 'Necklaces',
    parent: 'jewellery',
    nav_label: 'Necklaces',
    sort_order: 2,
    top_line: 'Close to the body. Close to the heart.',
    bottom_paragraphs: [
      'Our collection spans fine chains and pearl strands that carry the warmth of the Pacific, gemstone pendants in precious metals with stones gathered from across the world, and clean contemporary forms in recycled gold and silver made to be worn every day and kept forever.',
      'Choose one that means something to you, and it will mean something to the people who notice it.',
    ],
  },
  {
    handle: 'earrings',
    title: 'Earrings',
    parent: 'jewellery',
    nav_label: 'Earrings',
    sort_order: 3,
    top_line: 'The first thing caught by light.',
    bottom_paragraphs: [
      'Our earring collection spans delicate studs and fine gold forms, gemstone drops, sculptural hoops and huggies in recycled precious metals, and pearl forms that carry the softness of the ocean.',
      'Some are for every day, small enough to forget you are wearing them, beautiful enough that you won\'t want to. Others are for the moments that ask for a little more presence.',
      'Each pair is made to be worn closely and kept for a long time.',
    ],
  },
  {
    handle: 'rings',
    title: 'Rings',
    parent: 'jewellery',
    nav_label: 'Rings',
    sort_order: 4,
    top_line: 'Treasured today. Treasured always.',
    bottom_paragraphs: [
      'Our collection moves from fine everyday bands to sculptural statement forms, diamond solitaires and coloured stone settings with gemstones gathered from across the world, handcrafted shapes drawn from the landscapes of Aotearoa, and clean considered forms in recycled gold and silver.',
      'Whether chosen for daily wear, a significant occasion, or the simple pleasure of something beautiful on the finger, each ring is made to be worn, loved and passed on.',
    ],
  },
  {
    handle: 'bracelets',
    title: 'Bracelets',
    parent: 'jewellery',
    nav_label: 'Bracelets',
    sort_order: 5,
    top_line: 'Considered. Felt with every gesture.',
    bottom_paragraphs: [
      'Our bracelet collection offers pearl strands, delicate gold and gemstone forms, and fluid pieces in recycled precious metals with the quiet weight of something genuinely made.',
      'Pieces for layering or wearing alone, for gifting or keeping. Each one chosen because it will still feel relevant years from now.',
    ],
  },

  // ── Home ────────────────────────────────────────────────────────────────
  {
    handle: 'all-home',
    title: 'All Home',
    parent: 'home',
    nav_label: 'All Home',
    sort_order: 0,
    top_line: 'Objects that earn their place by being lived with.',
    bottom_paragraphs: [
      'Our home collection brings together handcrafted ceramics, candles, crystals, art, teaware, textiles, and objects for daily living, chosen for their beauty, their making, and their ability to bring a sense of calm and intention into the home.',
      'We are drawn to New Zealand artists and makers working with natural materials, and to objects that feel considered. Things that earn their place by being lived with.',
    ],
  },
  {
    // Live category collection handle is `art` (nav previously pointed at ghost `monni-art`)
    handle: 'art',
    title: 'Monni Art',
    parent: 'home',
    nav_label: 'Monni Art',
    sort_order: 1,
    // Matches existing Art-tagged products
    smart_tag: 'Art',
    top_line: 'Original works drawn from the land of Aotearoa.',
    bottom_paragraphs: [
      'The work of Monique Jansen (Ngati Porou) is rooted in whakapapa and a close relationship with the natural world, created using natural pigments sustainably foraged from native plants and Indian ink applied with brushes and calligraphy tools.',
      'Every shade is drawn directly from the land itself, the soft pink of puriri bark, the earthy tones of windswept coastlines, the greens of native flora and the ever-changing shades of ocean blue.',
      'Each artwork is an offering, made with genuine care for the land it depicts.',
    ],
  },
  {
    handle: 'ceramics-shop',
    title: 'Ceramics',
    parent: 'home',
    nav_label: 'Ceramics',
    sort_order: 2,
    top_line: 'Made by hand, for a life lived at a human pace.',
    bottom_paragraphs: [
      'Our ceramics are sourced from independent artists working across Auckland and Northland, potters whose pieces carry the marks of the hands that made them.',
      'From everyday vessels and cups to more sculptural objects, each piece is chosen for its tactile quality, its quiet beauty, and its ability to make the ordinary feel considered.',
      'A handmade bowl changes the experience of eating from it. A well-made mug changes the experience of the first cup of the morning.',
    ],
  },
  {
    handle: 'crystals-and-rituals',
    title: 'Crystals & Rituals',
    parent: 'home',
    nav_label: 'Crystals & Rituals',
    sort_order: 3,
    top_line: 'Ancient practices, quietly continued.',
    bottom_paragraphs: [
      'Sustainably sourced crystals, sage, and palo santo gathered from makers who approach the land and its resources with genuine care and reverence.',
      'These are not trends. They are ancient practices, quietly continued, objects that help us return to ourselves, breathe, and come back to what matters.',
    ],
  },
  {
    handle: 'homewares',
    title: 'Homewares',
    parent: 'home',
    nav_label: 'Homewares',
    sort_order: 4,
    top_line: 'The everyday made beautiful.',
    bottom_paragraphs: [
      'Our homewares collection brings together candles, textiles, baskets, and glassware chosen for natural materials, honest making, and the way they settle into a space without demanding attention.',
      'Objects that quietly earn their keep.',
    ],
  },
  {
    handle: 'home-care',
    title: 'Home Care',
    parent: 'home',
    nav_label: 'Home Care',
    sort_order: 5,
    // Live smart-collection rule (Shopify TAG match is case-sensitive)
    smart_tag: 'home care',
    top_line: 'Care for the spaces that hold you.',
    bottom_paragraphs: [
      'Our home care collection brings together natural cleaning and everyday essentials chosen for what they leave out as much as what they do — gentle on skin, kind to surfaces, and made without the harsh chemistry that so often fills the air at home.',
      'Hand washes, refills, and multipurpose sprays from makers who favour plant-based ingredients and refillable rituals, supporting a cleaner home that still feels calm to live in.',
    ],
  },
  {
    handle: 'teaware',
    title: 'Teaware',
    parent: 'home',
    nav_label: 'Teaware',
    sort_order: 6,
    top_line: 'The art of making something simple, sacred.',
    bottom_paragraphs: [
      'The way you make tea changes the way tea tastes.',
      'Our teaware is chosen for those who understand that a beautiful pot, a considered cup, a quiet moment of preparation can transform an ordinary morning into something worth pausing for. Pieces that balance beauty and function, selected to complement our tea collection and bring a sense of ceremony to even the simplest cup.',
    ],
  },
  {
    handle: 'pantry',
    title: 'Pantry',
    parent: 'home',
    nav_label: 'Pantry',
    sort_order: 7,
    top_line: 'Chosen because it is genuinely exceptional.',
    bottom_paragraphs: [
      'Our pantry collection is small and deliberate, each product chosen because it is genuinely exceptional, sourced from makers who care deeply about quality, integrity, and the land.',
      'These are the kinds of things you open with intention and share with people you love.',
    ],
  },

  // ── Gifting ─────────────────────────────────────────────────────────────
  {
    handle: 'all-gifting',
    title: 'All Gifting',
    parent: 'gifting',
    nav_label: 'All Gifting',
    sort_order: 0,
    top_line: 'Giving as a form of love.',
    bottom_paragraphs: [
      'At MONNI, we see gifting as an extension of care, a way of expressing love, gratitude, celebration, and connection through beautifully chosen objects that bring meaning to everyday life.',
      'Our collection brings together beauty, wellness, homewares, ceramics, and meaningful pieces, each chosen with intention and wrapped with care. Whether giving to a loved one, a client, or yourself, every gift should feel personal, considered, and memorable.',
    ],
  },
  {
    handle: 'giftboxes',
    title: 'Gift Boxes',
    parent: 'gifting',
    nav_label: 'Gift Boxes',
    sort_order: 1,
    top_line: 'Everything chosen. Nothing left to chance.',
    bottom_paragraphs: [
      'Our gift boxes are carefully curated to bring together objects that feel beautiful, useful, comforting, and meaningful.',
      'Each box is designed around a sense of experience, whether centred on rest, nourishment, celebration, self care, motherhood, home, or simple everyday pleasure. Every item is selected with intention and wrapped beautifully using recyclable tissue paper, dried flowers, and handwritten gift notes.',
    ],
  },
  {
    handle: 'cards',
    title: 'Cards',
    parent: 'gifting',
    nav_label: 'Cards',
    sort_order: 3,
    top_line: 'A small artwork worth keeping.',
    bottom_paragraphs: [
      'A handwritten card has the ability to transform a gift into something deeply personal.',
      'Our collection brings together carefully chosen designs for every meaningful moment, love, friendship, celebration, sympathy, and new beginnings, alongside a selection of cards featuring Monique Jansen\'s original ink line drawings, each one a small artwork in its own right and a card worth keeping.',
    ],
  },
  {
    handle: 'gift-card',
    title: 'Online Gift Card',
    parent: 'gifting',
    nav_label: 'Online Gift Card',
    sort_order: 4,
    top_line: 'An offering of trust, care, and possibility.',
    bottom_paragraphs: [
      'Sometimes the most thoughtful gift is the freedom to choose something personal. Our digital gift cards allow your loved one the time and space to select something meaningful for themselves, whether online or in store.',
      'We see gift cards not as impersonal, but as a conscious and sustainable way of gifting that allows the recipient to choose what they truly need, love, or feel drawn to.',
      'Gift cards are delivered by email and include instructions for redeeming online or in store. No additional processing fees. They do not expire.',
    ],
  },
];

/** Legacy handles that may still exist in Shopify — documented for redirects. */
export const legacyHandleMap = {
  body: 'body-care',
  bottoms: 'pants',
  'home-living': 'homewares',
  bracelet: 'bracelets',
  giftboxes: 'all-gifting',
  'sacred-rituals': 'crystals-and-rituals',
  'monni-art': 'art',
};
