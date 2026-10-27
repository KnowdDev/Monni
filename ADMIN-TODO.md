# Wave 2 staging editor steps

Code is on the staging theme. These steps are done in the theme editor on staging (theme 158178476203). Do not edit the live theme.

Homepage → Customize.

1. Hero. Leave it. When the jewellery photo arrives, open the split hero and replace the right-hand image. The label stays Jewellery.
2. Opening statement. The paragraph is the new wording. If an old second line is still visible in the editor, it is no longer used.
3. Featured products. Christmas Gift Guide shows while “Preview Christmas Gift Guide now” is ticked (it is ticked, so staging shows the gift guide before 1 November). After review, untick it. From 1 November to 25 December the heading is Christmas Gift Guide and the link is Shop gifts. From 26 December it returns to Best sellers and Shop all. Confirm the hand-picked Christmas products, and the best-sellers collection for the rest of the year.
4. Shop by category. Six tiles are already set (Wellness, Beauty, Clothing, Jewellery, Home, Gifting). Replace a photo there if you want a new one. The row slides three at a time on desktop and two at a time on a phone.
5. Our Own Creations. Order on the page is Botanicals, then Label, then Art, even if the block list is reversed. Art uses “whole image, sitting at the bottom” when the title contains Art. When the full-size photos arrive, replace the three images. Links stay Discover.
6. Meet the Maker. Leave Wild Earth as it is. It should sit immediately above the footer.
7. From the Journal. It is hidden (Show on the homepage is off). Remove the section from the homepage so it is not left empty in the list. Journal stays in the header and the footer.
8. Section order, top to bottom: Hero, Opening statement, Featured products, Shop by category, Our Own Creations, Meet the Maker. Nothing else on the homepage.
9. Footer. Card logos are greyscale. No editor step unless you would rather hide them with “Show payment icons”.

Size guide.

- The page template `page.size-guide` already uses the Size guide section. Open Online Store → Pages → Size Guide and confirm the theme template is size-guide. Do not create a second page.
- Copy on the page comes from the section. The old introduction stored on the template is no longer shown.

Product pairing (do this in Admin, not the theme editor).

- Install Shopify’s free Search & Discovery app if it is not installed.
- Search & Discovery → Product recommendations → Complementary products → set the source to automatic.
- The theme shows a product’s custom paired products when those are set (maximum 2). Otherwise it asks Shopify for complementary products, then related products, and shows up to 2 in the same Pair it with row.
- Fix any wrong matches in Search & Discovery. Do not change the product page layout for this.

# Wave 3

Do this on the staging theme (158178476203), then on the live theme only after Lex says so. Do not edit gift card amounts until Lex approves the list below.

Pair it with.

The product page shows two products. If nothing is set by hand, Shopify's automatic related products are used. A row appears only when there are two in-stock products, never this product, and never a sold-out product. To set pairs yourself, use Search & Discovery. That is the fastest way. The custom metafield is the other way, and it has to be created first because it is not on the store yet.

Search & Discovery, complementary products. Steps checked against [Shopify's product recommendations guide](https://help.shopify.com/en/manual/online-store/search-and-discovery/product-recommendations).

1. From your Shopify admin, go to Apps > Search & Discovery.
2. Click Product recommendations, then Add recommendations.
3. Select the product.
4. Select complementary products. Pick at least two that are in stock. The page shows the first two.
5. Click Save.

You can do several products at once from the same guide: on the Recommendations page, select the products, click Bulk edit, choose the recommendations, then Save.

Custom paired products. The theme reads `custom.paired_products` before anything else, then `monni.paired_products` if that ever exists. Neither definition is on the store today. Create `custom.paired_products` before the bulk editor can show it. Steps checked against [creating custom metafield definitions](https://help.shopify.com/en/manual/custom-data/metafields/metafield-definitions/creating-custom-metafield-definitions) and [editing metafields in bulk](https://help.shopify.com/en/manual/custom-data/metafields/bulk-edit-metafields).

1. Open a product. In the Metafields section, click Add definition. You can also create the definition from Settings > Metafields and metaobjects.
2. Name it Paired products.
3. In Namespace and key, set `custom.paired_products`.
4. Click Select type, choose Product, then click One value and select List of values.
5. Save.
6. Go to Products. Tick the products you want to edit. Click Edit products.
7. Click Columns. In the Metafields section, select Paired products.
8. Click the field in each row, set the products, then click Save. Use Chrome, Firefox, or Safari. Edge can fail on this editor.

The row uses that list only when at least two of those products are in stock and are not the product itself.

Opening statement.

On the homepage, open Opening statement. Sentence is the line Monni wrote, including the comma. Sentence ending is "from women-founded makers who care for people and planet." Clear Sentence ending to drop that ending. Leave the sentence as it is.

Start a return.

There is no Start a Return page in Admin yet. The footer already links to `/pages/start-a-return`. The default page template already shows the return layout for that address. Do not assign a different theme template, and do not paste the returns policy into the page. The page shows Settings > Policies > Refund policy.

Steps checked against [creating and editing pages](https://help.shopify.com/en/manual/online-store/add-edit-pages).

1. From your Shopify admin, go to Online Store > Pages.
2. Click Add page.
3. Title: Start a Return.
4. Leave the content field empty.
5. Keep Visibility set to Visible.
6. In Search engine listing preview, click the pencil icon. Set the URL handle to `start-a-return`.
7. Click Save.

Gift card amounts.

The storefront reads whatever denominations are on the Gift Card product. It does not hardcode them. On 28 Oct 2026 the online Gift Card (`/products/gift-card`) shows seven amounts: $20, $50, $100, $150, $200, $250, $500. Monni wants $50, $100, $150, $200, $300, $400, $500, with $50 the smallest. That change is in Admin, not the theme. Leave the draft product "vend-internal-gift-card" alone.

Steps checked against [adding or updating gift card products](https://help.shopify.com/en/manual/products/gift-card-products/add-update-gift-card-products).

1. From your Shopify admin, go to Products > Gift cards, then View gift card products. Or search for Gift Card and open the active product, not the draft.
2. Replace the denominations so they are $50, $100, $150, $200, $300, $400 and $500. Delete $20 and $250 with the trash icon. Add $300 and $400 with Add denomination. $50 stays the smallest. A gift card must keep at least one denomination, and each amount must be greater than zero.
3. Save. Cards already issued are not changed.
