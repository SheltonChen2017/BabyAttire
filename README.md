# BabyAttire

A Shopify online store theme for selling baby clothing, from newborn to 24 months.
It is built on [Dawn 16.0.0](https://github.com/Shopify/dawn), Shopify's official
free theme, and customized for a baby clothing shop.

## What is customized

| Area | Change |
|---|---|
| Colors and shapes | Soft pastel color schemes (cream, blush pink, sage, dusty blue) with rounded buttons, cards and images. |
| Announcement bar | Rotating messages about shipping and returns. |
| Homepage | Hero banner, "Shop by age" collections, new arrivals, "Shop by category", "Why parents love BabyAttire", gift sets, a parent FAQ and a newsletter signup. |
| Product page | Size guide link under the size picker, reassurance icons under the buy buttons, plus "Fabric & care", "Made for little ones" and "Shipping & returns" tabs. "Fabric & care" shows each product's own `custom.fabric_care` field when it is filled in. |
| Product badges | Tag a product `badge:Organic cotton` (or any text after `badge:`) to show that badge on product cards and the product page. |
| Size guide page | New `size-chart` section with an editable baby size table in pounds, inches, kilograms and centimeters. |
| Cart | Opens as a side drawer, with a free shipping progress bar and a gift message box. |
| Footer | Brand blurb, "Shop" and "Help" menus, a contact prompt and a newsletter signup. |
| Our story page | New `about` page template with the brand story, promises and links to shop. |
| FAQ page | New `faq` page template with questions on sizing, care, shipping and gifts. |
| Password and 404 pages | A branded "coming soon" page with email signup, and a "page not found" page that suggests new arrivals. |

All text, colors and sections can be changed later in Shopify's theme editor
without touching code.

The [`setup`](setup/README.md) folder fills a new store with 18 sample products,
collections, pages and menus, so the whole shopping flow works right away.
Every business default chosen along the way, such as prices, the free shipping
minimum and the return window, is listed in [DECISIONS.md](DECISIONS.md).

## 1. Create a Shopify store

Sign up at [shopify.com](https://www.shopify.com), which includes a free trial.
If you only want to build and test first, create a free development store in the
[Shopify Dev Dashboard](https://dev.shopify.com) instead.

## 2. Install the Shopify command-line tool

Install [Node.js](https://nodejs.org) first, then run:

```bash
npm install -g @shopify/cli
```

On a Mac you can use `brew install shopify-cli` instead.

## 3. Preview the theme on your store

```bash
cd C:\git\BabyAttire
shopify theme dev --store your-store-name.myshopify.com
```

A browser window asks you to log in to Shopify. The command then prints a local
preview link that updates as you edit files.

## 4. Upload the theme

```bash
shopify theme push --unpublished
```

Then go to **Online Store > Themes** in your Shopify admin, find BabyAttire,
and click **Publish** when you are happy with it.

## 5. Set up your store content

The fastest way is the setup script, which creates the sample products,
collections, pages, menus, policies and homepage images for you. See
[setup/README.md](setup/README.md).

To set up by hand instead, create these automated collections in
**Products > Collections**. The theme links to them by handle, which is the last
part of the collection's web address:

| Collection title | Handle |
|---|---|
| Newborn | `newborn` |
| 0-3 months | `0-3-months` |
| 3-6 months | `3-6-months` |
| 6-12 months | `6-12-months` |
| 12-24 months | `12-24-months` |
| New arrivals | `new-arrivals` |
| Gift sets | `gift-sets` |
| Bodysuits | `bodysuits` |
| Sleepwear | `sleepwear` |
| Outfits & sets | `outfits` |
| Accessories | `accessories` |

Then finish these steps in the Shopify admin:

- **Pages.** In **Online Store > Pages**, create these pages with these templates:
  "Size guide" (`size-guide`), "Our story" (`about`), "FAQ" (`faq`) and
  "Contact" (`contact`). Their handles must be `size-guide`, `about`, `faq` and
  `contact`.
- **Products.** Import `setup/products.csv`, or add products with a **Size** option
  that uses the size chart's values, such as Newborn, 0-3M and 3-6M, and a
  **Color** option if needed.
- **Menus.** Edit **Online Store > Navigation > Main menu** to link the collections.
  The footer's "Shop" column uses the main menu. Its "Help" column uses the
  **Footer menu**, so add links there to the Size guide, FAQ, Our story, Contact
  and your policy pages.
- **Images.** Upload `setup/images/babyattire-hero.jpg` and
  `babyattire-story.jpg` in **Content > Files**. The homepage and Our story page
  pick them up by filename. Add a logo in the theme editor if you have one.

For both options:

- **Free shipping.** The cart's progress bar is set to $50 in **Theme settings > Cart**.
  Set up a matching free shipping rate in **Settings > Shipping and delivery**.
- **Badges (optional).** In a product's **Tags** field, add tags like `badge:New`
  or `badge:Organic cotton`. Up to two show per product. Change their color in
  **Theme settings > Badges**.
- **Policies.** The theme and sample policies promise free shipping over $50,
  30-day returns and 1-2 day order processing. Change them to match your real
  policies before you launch. [DECISIONS.md](DECISIONS.md) lists every place.

## Updating the theme later

After editing files, preview with `shopify theme dev` and upload with
`shopify theme push`. If you change settings in the Shopify theme editor, run
`shopify theme pull` to bring those changes back here, then commit and push to GitHub.

## License

Dawn is copyright Shopify Inc. and licensed for building Shopify themes. See `LICENSE.md`.
