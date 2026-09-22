# BabyAttire

A Shopify online store theme for selling baby clothing, from newborn to 24 months.
It is built on [Dawn 16.0.0](https://github.com/Shopify/dawn), Shopify's official
free theme, and customized for a baby clothing shop.

## What is customized

| Area | Change |
|---|---|
| Colors and shapes | Soft pastel color schemes (cream, blush pink, sage, dusty blue) with rounded buttons, cards and images. |
| Announcement bar | Rotating messages about shipping and returns. |
| Homepage | Hero banner, "Shop by age" collections, new arrivals, "Why parents love BabyAttire", gift sets, a parent FAQ and a newsletter signup. |
| Product page | Size guide link under the size picker, reassurance icons under the buy buttons, plus "Fabric & care", "Made for little ones" and "Shipping & returns" tabs. |
| Product badges | Tag a product `badge:Organic cotton` (or any text after `badge:`) to show that badge on product cards and the product page. |
| Size guide page | New `size-chart` section with an editable baby size table in pounds, inches, kilograms and centimeters. |
| Cart | Opens as a side drawer, with a free shipping progress bar and a gift message box. |
| Footer | Brand blurb, "Shop" and "Help" menus, a contact prompt and a newsletter signup. |
| Our story page | New `about` page template with the brand story, promises and links to shop. |
| FAQ page | New `faq` page template with questions on sizing, care, shipping and gifts. |

All text, colors and sections can be changed later in Shopify's theme editor
without touching code.

## 1. Create a Shopify store

Sign up at [shopify.com](https://www.shopify.com), which includes a free trial.
If you only want to build and test first, create a free development store from
a [Shopify Partners](https://www.shopify.com/partners) account instead.

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

The theme links to these collections by their handle, which is the last part of
the collection's web address. Create them in **Products > Collections**:

| Collection title | Handle |
|---|---|
| Newborn | `newborn` |
| 0-3 months | `0-3-months` |
| 3-6 months | `3-6-months` |
| 6-12 months | `6-12-months` |
| 12-24 months | `12-24-months` |
| New arrivals | `new-arrivals` |
| Gift sets | `gift-sets` |

Then finish these steps in the Shopify admin:

- **Size guide page.** Create a page titled "Size guide" in **Online Store > Pages**.
  Choose the `size-guide` template and make sure its handle is `size-guide`.
- **Products.** Add products with a **Size** option that uses the same values as
  the size chart, such as Newborn, 0-3M and 3-6M, and a **Color** option if needed.
- **Our story and FAQ pages.** Create a page titled "Our story" with the `about`
  template, and a page titled "FAQ" with the `faq` template. Replace the placeholder
  story text in the theme editor.
- **Contact page.** Create a page titled "Contact" with the `contact` template and
  the handle `contact`. The footer and FAQ page link to it.
- **Menus.** Edit **Online Store > Navigation > Main menu** to link the collections.
  The footer's "Shop" column uses the main menu. Its "Help" column uses the
  **Footer menu**, so add links there to the Size guide, FAQ, Our story, Contact
  and your policy pages.
- **Free shipping.** The cart's progress bar is set to $50 in **Theme settings > Cart**.
  Set up a matching free shipping rate in **Settings > Shipping and delivery**.
- **Badges (optional).** In a product's **Tags** field, add tags like `badge:New`
  or `badge:Organic cotton`. Up to two show per product. Change their color in
  **Theme settings > Badges**.
- **Images.** Add a hero image and a logo in the theme editor.
- **Policies.** The theme mentions free shipping over $50, 30-day returns and
  1-2 day order processing (in the announcement bar, homepage, product page and FAQ page).
  Change that text to match your real shipping and return policies before you launch.

## Updating the theme later

After editing files, preview with `shopify theme dev` and upload with
`shopify theme push`. If you change settings in the Shopify theme editor, run
`shopify theme pull` to bring those changes back here, then commit and push to GitHub.

## License

Dawn is copyright Shopify Inc. and licensed for building Shopify themes. See `LICENSE.md`.
