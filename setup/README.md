# Store setup

This folder fills an empty Shopify store with a working sample catalog, so the
theme has real products, collections, pages and menus to show. Once it has run,
a shopper can browse by age or category, pick a size and color, add to cart,
see the free shipping bar, leave a gift message and check out.

| File | What it is |
|---|---|
| `catalog.json` | The sample store: 18 products, 11 collections, 4 pages, 2 menus, 2 policies. Edit this to change what gets created. |
| `seed-store.mjs` | Creates everything in `catalog.json` through Shopify's Admin API. |
| `products.csv` | The same products in Shopify's import format, for setting up by hand instead. |
| `images/` | Drawn placeholder images for every product and color, plus the homepage and Our story images. |
| `make_images.py` | Redraws `images/` from `catalog.json`. |
| `check-queries.mjs` | Checks the setup script against Shopify's real API schema, without a store. |

The images are served from this repository on GitHub, so the repository must
stay public while you run the setup. To use another host, upload `images/` and
set `IMAGE_BASE_URL` to that folder's address.

## Option A: automatic setup (recommended)

You need Node.js 18 or newer.

### 1. Create a development store

In the [Shopify Dev Dashboard](https://dev.shopify.com), create a free
development store. Development stores can take test orders, and you don't pay
until you move to a paid plan.

### 2. Create an app that can edit the store

1. In the Dev Dashboard, go to **Apps > Create app** and name it "BabyAttire setup".
2. Under **Access**, choose these Admin API scopes:
   `write_products`, `write_publications`, `write_files`,
   `write_online_store_pages`, `write_online_store_navigation`,
   `write_legal_policies`
3. Release the version, then **Install** the app on your development store.
4. From the app's **Settings** page, copy the **Client ID** and **Client secret**.

### 3. Run the setup

In PowerShell, from the repository folder:

```powershell
$env:SHOPIFY_STORE = "your-store.myshopify.com"
$env:SHOPIFY_CLIENT_ID = "paste the client ID"
$env:SHOPIFY_CLIENT_SECRET = "paste the client secret"
node setup/seed-store.mjs
```

If you already have an Admin API access token (starting with `shpat_`), set
`SHOPIFY_ADMIN_TOKEN` instead of the client ID and secret.

The setup prints each thing it creates. To preview without touching the store,
run `node setup/seed-store.mjs --dry-run`. To run only some steps, use for
example `--only=pages,menus`. The steps are `metafields`, `files`, `products`,
`collections`, `pages`, `menus` and `policies`.

Running it again is safe. It skips products, collections, pages, images and
policies that already exist. The main menu and footer menu are always
replaced with the ones in `catalog.json`.

## Option B: set up by hand

1. **Products:** go to **Products > Import** and upload `setup/products.csv`.
2. **Fabric & care field:** go to **Settings > Custom data > Products** and add a
   definition named "Fabric & care" with namespace and key `custom.fabric_care`,
   type **Multi-line text**. Do this before importing so the care text comes in.
3. **Collections:** create each collection in `catalog.json` as an automated
   collection. Use the same handle and the conditions listed there. For example,
   "0-3 months" has the condition "Variant's title contains 0-3M".
4. **Pages, menus, images and policies:** follow the checklist in the main README.

## After either option

These steps can't be done by the setup script:

1. **Free shipping.** In **Settings > Shipping and delivery**, add a free rate for
   orders of $50 and up, next to your standard rate. The cart's progress bar
   promises this.
2. **Upload the theme.** Run `shopify theme push --unpublished`, then publish
   BabyAttire in **Online Store > Themes**.
3. **Test checkout.** In **Settings > Payments**, turn on test mode, or use the
   Bogus Gateway on a development store. Place an order with card number `1`
   to try the whole flow.
4. **Password page.** Development stores are password protected. The theme's
   password page shows a "coming soon" message with an email signup. Remove the
   password in **Online Store > Preferences** when you launch.
5. **Collection filters (optional).** Install Shopify's free **Search & Discovery**
   app and add filters for Size, Color, Product type and Price. They appear on
   collection and search pages so parents can narrow down to their baby's size.

## Checking the script

After changing `seed-store.mjs` or `catalog.json`, check it against Shopify's
API schema:

```bash
cd setup
npm install
node check-queries.mjs
```

This downloads the schema for the API version the script uses (2026-07) and
reports any query or input that Shopify would reject.
