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
| Product page | Size guide link under the size picker, plus "Fabric & care", "Made for little ones" and "Shipping & returns" tabs. |
| Size guide page | New `size-chart` section with an editable baby size table in pounds, inches, kilograms and centimeters. |
| Cart | Opens as a side drawer. |

All text, colors and sections can be changed later in Shopify's theme editor
without touching code.

## 1. Create a Shopify store

Sign up at [shopify.com](https://www.shopify.com), which includes a free trial.
If you only want to build and test first, create a free development store from
a [Shopify Partners](https://www.shopify.com/partners) account instead.

## 2. Install the Shopify command-line tool

```bash
brew tap shopify/shopify
brew install shopify-cli
```

## 3. Preview the theme on your store

```bash
cd ~/Documents/BabyAttire
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
- **Menu.** Edit **Online Store > Navigation > Main menu** to link the collections.
- **Images.** Add a hero image and a logo in the theme editor.
- **Policies.** The theme mentions free shipping over $50 and 30-day returns.
  Change that text to match your real shipping and return policies before you launch.

## Updating the theme later

After editing files, preview with `shopify theme dev` and upload with
`shopify theme push`. If you change settings in the Shopify theme editor, run
`shopify theme pull` to bring those changes back here, then commit and push to GitHub.

## License

Dawn is copyright Shopify Inc. and licensed for building Shopify themes. See `LICENSE.md`.
