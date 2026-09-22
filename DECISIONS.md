# Owner decisions

These are the business and content choices made while building BabyAttire.
Each one was a default picked on the owner's behalf. Change any of them
before launch. The "Where to change it" column says how.

Items marked **Check before launch** are promises to customers or facts about
the business. They must match what you actually do.

## Policies and promises

| Decision | Default | Where to change it |
|---|---|---|
| Free shipping minimum | $50, in the store's main currency | Theme settings > Cart > Free shipping bar. Also the announcement bar, product page icons, FAQ page and `catalog.json` policies. **Check before launch** |
| Order processing time | Ships in 1-2 business days | Homepage FAQ, FAQ page, product "Shipping & returns" tab, shipping policy. **Check before launch** |
| Delivery time | 3-7 business days, US standard shipping | Shipping policy (Settings > Policies). **Check before launch** |
| Returns | 30 days, unworn and unwashed with tags, refund within 5 business days | Refund policy, FAQ page, product tab, announcement bar. **Check before launch** |
| Non-returnable items | Opened scratch mittens and socks, for hygiene | Refund policy. **Check before launch** |
| Contact response time | "Within one business day" | Contact page text (Online Store > Pages > Contact). **Check before launch** |
| Free shipping bar in other currencies | Hidden when the shopper uses a currency other than the store's | `snippets/free-shipping-bar.liquid` |

## Catalog

| Decision | Default | Where to change it |
|---|---|---|
| Sample products | 18 products across bodysuits, sleepwear, outfits, accessories and gift sets | `setup/catalog.json`, or edit them in the admin after setup |
| Prices | $10 to $75. Bodysuits $18-20, sleepers $32-34, gift sets $68-75 | `setup/catalog.json` or the admin |
| Sale example | Everyday Bodysuit 3-Pack at $45, marked down from $54, to show the sale badge | `setup/catalog.json` |
| Sizes | Newborn, 0-3M, 3-6M, 6-12M, 12-18M, 18-24M, plus "One size" for bibs | Size chart section on the Size guide page, and product options |
| Colors | Oat, Blush, Sage, Dusty Blue, Cloud, Butter, Stripe | `setup/catalog.json` |
| Color option | Only added when a product comes in more than one color | `productInput()` in `setup/seed-store.mjs` |
| Inventory | Not tracked, so nothing sells out in the prototype | Each variant in the admin: turn on "Track quantity" |
| Fabric claims | Organic cotton for most pieces, with fabric percentages per product | `fabric_care` in `setup/catalog.json`, or each product's "Fabric & care" field. **Check before launch** |
| Vendor | BabyAttire | `setup/catalog.json` |
| Product images | Drawn placeholders, one per color | Replace with real photos in the admin |
| Taxes | Every variant is taxable. In many US states baby clothing is exempt | Settings > Taxes and duties. **Check before launch** |

## Collections

| Decision | Default | Where to change it |
|---|---|---|
| Age collections | Automated: a product joins "0-3 months" when any variant's title contains 0-3M. "12-24 months" includes both 12-18M and 18-24M | Products > Collections |
| Category collections | Automated by product type: Bodysuit, Sleepwear, Outfit set, Accessory, Gift set | Products > Collections |
| New arrivals | Products tagged `new`, newest first | Add or remove the `new` tag on products |
| Collection sort | Best selling, except New arrivals | Each collection in the admin |

## Store content and layout

| Decision | Default | Where to change it |
|---|---|---|
| Brand tagline | "Soft clothes for tiny humans" | Theme settings > Brand information, homepage hero |
| Our story text | A short founder story written as a stand-in: parents frustrated by scratchy baby clothes, with pieces "tested by real families" | Theme editor > Our story page. **Check before launch** |
| Homepage order | Hero, shop by age, new arrivals, shop by category, why parents love us, gift sets, FAQ, newsletter | Theme editor > Home page |
| Main menu | Shop by age (dropdown), Shop by category (dropdown), New arrivals, Gift sets, Size guide | `menus` in `setup/catalog.json`, or Online Store > Navigation |
| Footer menu | Size guide, FAQ, Our story, Contact, Shipping policy, Refund policy | Same as above |
| Product badges | Tags starting with `badge:`, at most 2 per product, sage color | Product tags, Theme settings > Badges |
| Gift messages | Uses the cart note, labelled "Add a gift message or special instructions" | Theme settings > Cart > Show cart note, and `locales/en.default.json` |
| Gift wrapping | Not offered | A future "gift wrap" product could be added to the cart drawer |
| Cart style | Side drawer | Theme settings > Cart |
| Password page | "Soft clothes for tiny humans, coming soon" with email signup | Theme editor > Password page |
| Logo | Store name shown as text, no logo image | Theme settings > Logo |
| Fonts | Assistant, Dawn's default | Theme settings > Typography |
| Social links | None | Theme settings > Social media |
| Language and currency | English and US dollars | Settings > Languages and Settings > Markets |

## Technical

| Decision | Default | Why |
|---|---|---|
| Admin API version | 2026-07 | Latest stable version when this was built. Update `API_VERSION` in `setup/seed-store.mjs` and run `setup/check-queries.mjs` |
| Image hosting for setup | This GitHub repository, which must stay public during setup | Shopify needs a public URL to copy images from. Set `IMAGE_BASE_URL` to use another host |
| Re-running setup | Skips anything that already exists, except menus, which are replaced | Keeps changes made in the admin |
