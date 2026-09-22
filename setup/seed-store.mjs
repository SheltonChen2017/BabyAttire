#!/usr/bin/env node
// BabyAttire store setup.
//
// Fills an empty Shopify store with everything the theme expects, using
// setup/catalog.json: sample products with images, smart collections, pages,
// navigation menus, shipping and refund policies, and the homepage images.
//
// It only creates what is missing. Existing products, collections and files
// with the same handle or filename are left alone, so it is safe to re-run.
// The two menus (main-menu and footer) are always replaced with the catalog's.
//
// Usage:
//   node setup/seed-store.mjs --dry-run          show what would happen, no store needed
//   node setup/seed-store.mjs                    set up the store
//   node setup/seed-store.mjs --only=pages,menus run some steps only
//   node setup/seed-store.mjs --csv              write setup/products.csv for manual import
//
// Environment:
//   SHOPIFY_STORE          your-store.myshopify.com
//   SHOPIFY_ADMIN_TOKEN    Admin API access token (shpat_...), or instead:
//   SHOPIFY_CLIENT_ID      client ID and secret of an app from the Dev Dashboard
//   SHOPIFY_CLIENT_SECRET  that is installed on the store
//   IMAGE_BASE_URL         where setup/images is served from (defaults to this
//                          repo on GitHub, which must be public)
//
// See setup/README.md for how to get a token and which scopes the app needs.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const API_VERSION = '2026-07';
const DEFAULT_IMAGE_BASE_URL = 'https://raw.githubusercontent.com/SheltonChen2017/BabyAttire/main/setup/images';
const STEPS = ['metafields', 'files', 'products', 'collections', 'pages', 'menus', 'policies'];

// ---------------------------------------------------------------------------
// GraphQL documents. Exported so setup/check-queries.mjs can validate them.

export const Q = {
  metafieldDefinitionCreate: `
    mutation CreateDefinition($definition: MetafieldDefinitionInput!) {
      metafieldDefinitionCreate(definition: $definition) {
        createdDefinition { id }
        userErrors { field message code }
      }
    }`,
  filesByName: `
    query FilesByName($query: String!) {
      files(first: 5, query: $query) { nodes { id alt fileStatus } }
    }`,
  fileCreate: `
    mutation CreateFiles($files: [FileCreateInput!]!) {
      fileCreate(files: $files) {
        files { id fileStatus }
        userErrors { field message code }
      }
    }`,
  productByHandle: `
    query ProductByHandle($handle: String!) {
      productByIdentifier(identifier: { handle: $handle }) { id title }
    }`,
  productSet: `
    mutation SetProduct($input: ProductSetInput!) {
      productSet(input: $input, synchronous: true) {
        product { id handle }
        userErrors { field message code }
      }
    }`,
  onlineStorePublication: `
    query Publications {
      publications(first: 25) {
        nodes { id catalog { title } channels(first: 5) { nodes { name handle } } }
      }
    }`,
  publish: `
    mutation Publish($id: ID!, $input: [PublicationInput!]!) {
      publishablePublish(id: $id, input: $input) {
        userErrors { field message }
      }
    }`,
  collectionByHandle: `
    query CollectionByHandle($handle: String!) {
      collectionByIdentifier(identifier: { handle: $handle }) { id title }
    }`,
  collectionCreate: `
    mutation CreateCollection($collection: CollectionCreateInput!) {
      collectionCreate(collection: $collection) {
        collection { id handle }
        userErrors { field message }
      }
    }`,
  pageByHandle: `
    query PageByHandle($query: String!) {
      pages(first: 1, query: $query) { nodes { id handle templateSuffix } }
    }`,
  pageCreate: `
    mutation CreatePage($page: PageCreateInput!) {
      pageCreate(page: $page) {
        page { id handle }
        userErrors { field message code }
      }
    }`,
  pageUpdate: `
    mutation UpdatePage($id: ID!, $page: PageUpdateInput!) {
      pageUpdate(id: $id, page: $page) {
        page { id }
        userErrors { field message code }
      }
    }`,
  menus: `
    query Menus {
      menus(first: 50) { nodes { id handle title } }
    }`,
  menuCreate: `
    mutation CreateMenu($title: String!, $handle: String!, $items: [MenuItemCreateInput!]!) {
      menuCreate(title: $title, handle: $handle, items: $items) {
        menu { id }
        userErrors { field message code }
      }
    }`,
  menuUpdate: `
    mutation UpdateMenu($id: ID!, $title: String!, $handle: String, $items: [MenuItemUpdateInput!]!) {
      menuUpdate(id: $id, title: $title, handle: $handle, items: $items) {
        menu { id }
        userErrors { field message code }
      }
    }`,
  shopPolicies: `
    query Policies {
      shop { shopPolicies { type body } }
    }`,
  shopPolicyUpdate: `
    mutation UpdatePolicy($shopPolicy: ShopPolicyInput!) {
      shopPolicyUpdate(shopPolicy: $shopPolicy) {
        shopPolicy { id }
        userErrors { field message code }
      }
    }`,
};

// ---------------------------------------------------------------------------
// Pure helpers that turn catalog entries into API input.

const slug = (text) => text.toLowerCase().replace(/\s+/g, '-');

export function imageUrl(base, product, color) {
  return `${base.replace(/\/$/, '')}/${product.handle}-${slug(color)}.jpg`;
}

// A product only gets a Color option when it comes in more than one color.
export function productInput(product, catalog, base) {
  const multiColor = product.colors.length > 1;
  const options = [{ name: 'Size', position: 1, values: product.sizes.map((name) => ({ name })) }];
  if (multiColor) options.push({ name: 'Color', position: 2, values: product.colors.map((name) => ({ name })) });

  const files = product.colors.map((color) => ({
    originalSource: imageUrl(base, product, color),
    contentType: 'IMAGE',
    alt: multiColor ? `${product.title} in ${color}` : product.title,
  }));

  const variants = [];
  for (const color of product.colors) {
    for (const size of product.sizes) {
      const optionValues = [{ optionName: 'Size', name: size }];
      if (multiColor) optionValues.push({ optionName: 'Color', name: color });
      variants.push({
        optionValues,
        price: product.price,
        ...(product.compare_at_price ? { compareAtPrice: product.compare_at_price } : {}),
        inventoryPolicy: 'DENY',
        inventoryItem: { tracked: false, requiresShipping: true },
        taxable: true,
        ...(multiColor ? { file: files[product.colors.indexOf(color)] } : {}),
      });
    }
  }

  return {
    title: product.title,
    handle: product.handle,
    descriptionHtml: product.description,
    vendor: catalog.vendor,
    productType: product.type,
    tags: product.tags,
    status: 'ACTIVE',
    productOptions: options,
    variants,
    files,
    metafields: [
      { namespace: 'custom', key: 'fabric_care', type: 'multi_line_text_field', value: product.fabric_care },
    ],
  };
}

export function collectionInput(collection) {
  return {
    title: collection.title,
    handle: collection.handle,
    descriptionHtml: collection.description,
    sortOrder: collection.sort_order || 'BEST_SELLING',
    sources: [
      {
        source: {
          title: `${collection.title} rules`,
          inclusion: {
            matchType: 'ALL',
            conditions: collection.conditions.map((c) => ({
              [c.field]: { relation: c.relation, values: c.values, matchType: 'ANY' },
            })),
          },
        },
      },
    ],
  };
}

// Menu items in the catalog point at a collection or page handle, or a URL.
export function menuItems(items, ids) {
  return items.map((item) => {
    const out = { title: item.title };
    if (item.collection) {
      out.type = 'COLLECTION';
      out.resourceId = ids.collections[item.collection];
      if (!out.resourceId) throw new Error(`Menu item "${item.title}": collection ${item.collection} not found`);
    } else if (item.page) {
      out.type = 'PAGE';
      out.resourceId = ids.pages[item.page];
      if (!out.resourceId) throw new Error(`Menu item "${item.title}": page ${item.page} not found`);
    } else if (item.url) {
      out.type = 'HTTP';
      out.url = item.url;
    } else {
      out.type = item.type || 'CATALOG';
    }
    if (item.items) out.items = menuItems(item.items, ids);
    return out;
  });
}

// ---------------------------------------------------------------------------
// Shopify client

async function getToken(store) {
  if (process.env.SHOPIFY_ADMIN_TOKEN) return process.env.SHOPIFY_ADMIN_TOKEN;
  const { SHOPIFY_CLIENT_ID: id, SHOPIFY_CLIENT_SECRET: secret } = process.env;
  if (!id || !secret) {
    throw new Error('Set SHOPIFY_ADMIN_TOKEN, or SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET. See setup/README.md.');
  }
  const res = await fetch(`https://${store}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: id, client_secret: secret }),
  });
  if (res.status === 404) {
    throw new Error(`There is no Shopify store at ${store}. Check SHOPIFY_STORE; it's shown in your admin's address bar.`);
  }
  if (!res.ok) {
    const text = await res.text();
    const detail = text.trimStart().startsWith('<') ? '' : `: ${text.slice(0, 300)}`;
    throw new Error(
      `Shopify rejected the client ID and secret (${res.status})${detail}. Check that they are copied correctly ` +
        'and that the app is installed on this store.'
    );
  }
  const body = await res.json().catch(() => null);
  if (!body?.access_token) {
    throw new Error(
      `${store} did not return an access token. Check that SHOPIFY_STORE is your store's .myshopify.com ` +
        'address and that the app is installed on that store.'
    );
  }
  return body.access_token;
}

function client(store, token) {
  return async function gql(query, variables = {}, attempt = 1) {
    const res = await fetch(`https://${store}/admin/api/${API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
      body: JSON.stringify({ query, variables }),
    });
    const throttled = res.status === 429;
    const body = throttled ? null : await res.json().catch(() => null);
    if (throttled || (Array.isArray(body?.errors) && body.errors.some((e) => e.extensions?.code === 'THROTTLED'))) {
      if (attempt > 6) throw new Error('Shopify kept throttling requests; try again in a minute.');
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
      return gql(query, variables, attempt + 1);
    }
    if (res.ok && !body) {
      throw new Error(`${store} answered with a web page instead of API data. Check SHOPIFY_STORE.`);
    }
    if (!res.ok || body?.errors) {
      const detail = typeof body?.errors === 'string' ? body.errors : body?.errors ? JSON.stringify(body.errors) : res.statusText;
      if (res.status === 404) throw new Error(`There is no Shopify store at ${store}. Check SHOPIFY_STORE.`);
      if (res.status === 401 || res.status === 403) {
        throw new Error(`Shopify refused the request (${res.status}). Check the token and app scopes: ${detail}`);
      }
      throw new Error(`GraphQL error (${res.status}): ${detail}`);
    }
    return body.data;
  };
}

function checkErrors(label, errors) {
  if (errors?.length) throw new Error(`${label}: ${errors.map((e) => e.message).join('; ')}`);
}

// ---------------------------------------------------------------------------
// Steps

async function ensureMetafieldDefinition(gql, dry) {
  const definition = {
    name: 'Fabric & care',
    namespace: 'custom',
    key: 'fabric_care',
    type: 'multi_line_text_field',
    ownerType: 'PRODUCT',
    description: 'Shown in the "Fabric & care" tab on the product page.',
    pin: true,
  };
  if (dry) return log('metafields', 'would create product metafield custom.fabric_care');
  const data = await gql(Q.metafieldDefinitionCreate, { definition });
  const errors = data.metafieldDefinitionCreate.userErrors;
  if (errors.some((e) => e.code === 'TAKEN')) return log('metafields', 'custom.fabric_care already exists');
  checkErrors('Metafield definition', errors);
  log('metafields', 'created custom.fabric_care');
}

async function ensureShopImages(gql, catalog, base, dry) {
  for (const image of catalog.shop_images) {
    const name = image.filename.replace(/\.[^.]+$/, '');
    if (dry) {
      log('files', `would upload ${image.filename}`);
      continue;
    }
    const found = await gql(Q.filesByName, { query: `filename:${name}*` });
    if (found.files.nodes.length) {
      log('files', `${image.filename} already uploaded`);
      continue;
    }
    const data = await gql(Q.fileCreate, {
      files: [{ originalSource: `${base}/${image.filename}`, filename: image.filename, alt: image.alt, contentType: 'IMAGE' }],
    });
    checkErrors(image.filename, data.fileCreate.userErrors);
    log('files', `uploaded ${image.filename}`);
  }
}

async function onlineStoreId(gql) {
  const data = await gql(Q.onlineStorePublication);
  const isOnlineStore = (p) =>
    /online store/i.test(p.catalog?.title || '') ||
    p.channels?.nodes.some((c) => /online store/i.test(c.name) || c.handle === 'online_store');
  const match = data.publications.nodes.find(isOnlineStore);
  if (!match) throw new Error('Could not find the Online Store sales channel. Is it installed on this store?');
  return match.id;
}

async function ensureProducts(gql, catalog, base, publicationId, dry) {
  for (const product of catalog.products) {
    const input = productInput(product, catalog, base);
    if (dry) {
      log('products', `would create ${product.handle} (${input.variants.length} variants, $${product.price})`);
      continue;
    }
    const existing = await gql(Q.productByHandle, { handle: product.handle });
    if (existing.productByIdentifier) {
      log('products', `${product.handle} already exists`);
      continue;
    }
    const data = await gql(Q.productSet, { input });
    checkErrors(product.handle, data.productSet.userErrors);
    const id = data.productSet.product.id;
    const pub = await gql(Q.publish, { id, input: [{ publicationId }] });
    checkErrors(`Publishing ${product.handle}`, pub.publishablePublish.userErrors);
    log('products', `created ${product.handle}`);
  }
}

async function ensureCollections(gql, catalog, publicationId, dry, ids) {
  for (const collection of catalog.collections) {
    if (dry) {
      ids.collections[collection.handle] = `gid://shopify/Collection/${collection.handle}`;
      log('collections', `would create ${collection.handle}`);
      continue;
    }
    const existing = await gql(Q.collectionByHandle, { handle: collection.handle });
    if (existing.collectionByIdentifier) {
      ids.collections[collection.handle] = existing.collectionByIdentifier.id;
      log('collections', `${collection.handle} already exists`);
      continue;
    }
    const data = await gql(Q.collectionCreate, { collection: collectionInput(collection) });
    checkErrors(collection.handle, data.collectionCreate.userErrors);
    const id = data.collectionCreate.collection.id;
    ids.collections[collection.handle] = id;
    const pub = await gql(Q.publish, { id, input: [{ publicationId }] });
    checkErrors(`Publishing ${collection.handle}`, pub.publishablePublish.userErrors);
    log('collections', `created ${collection.handle}`);
  }
}

async function ensurePages(gql, catalog, dry, ids) {
  for (const page of catalog.pages) {
    if (dry) {
      ids.pages[page.handle] = `gid://shopify/Page/${page.handle}`;
      log('pages', `would create ${page.handle} (template ${page.template})`);
      continue;
    }
    const found = (await gql(Q.pageByHandle, { query: `handle:${page.handle}` })).pages.nodes[0];
    if (found) {
      ids.pages[page.handle] = found.id;
      if ((found.templateSuffix || '') !== page.template) {
        const data = await gql(Q.pageUpdate, { id: found.id, page: { templateSuffix: page.template } });
        checkErrors(page.handle, data.pageUpdate.userErrors);
        log('pages', `${page.handle} exists, switched it to the ${page.template} template`);
      } else {
        log('pages', `${page.handle} already exists`);
      }
      continue;
    }
    const data = await gql(Q.pageCreate, {
      page: { title: page.title, handle: page.handle, body: page.body, templateSuffix: page.template, isPublished: true },
    });
    checkErrors(page.handle, data.pageCreate.userErrors);
    ids.pages[page.handle] = data.pageCreate.page.id;
    log('pages', `created ${page.handle}`);
  }
}

async function lookupIds(gql, catalog, ids) {
  for (const c of catalog.collections) {
    if (ids.collections[c.handle]) continue;
    const found = await gql(Q.collectionByHandle, { handle: c.handle });
    if (found.collectionByIdentifier) ids.collections[c.handle] = found.collectionByIdentifier.id;
  }
  for (const p of catalog.pages) {
    if (ids.pages[p.handle]) continue;
    const found = (await gql(Q.pageByHandle, { query: `handle:${p.handle}` })).pages.nodes[0];
    if (found) ids.pages[p.handle] = found.id;
  }
}

async function ensureMenus(gql, catalog, dry, ids) {
  const existing = dry ? [] : (await gql(Q.menus)).menus.nodes;
  for (const menu of catalog.menus) {
    const items = menuItems(menu.items, ids);
    const current = existing.find((m) => m.handle === menu.handle);
    if (dry) {
      log('menus', `would set ${menu.handle}: ${items.map((i) => i.title).join(', ')}`);
    } else if (current) {
      const data = await gql(Q.menuUpdate, { id: current.id, title: menu.title, handle: menu.handle, items });
      checkErrors(menu.handle, data.menuUpdate.userErrors);
      log('menus', `updated ${menu.handle}`);
    } else {
      const data = await gql(Q.menuCreate, { title: menu.title, handle: menu.handle, items });
      checkErrors(menu.handle, data.menuCreate.userErrors);
      log('menus', `created ${menu.handle}`);
    }
  }
}

async function ensurePolicies(gql, catalog, dry) {
  const current = dry ? [] : (await gql(Q.shopPolicies)).shop.shopPolicies;
  for (const [type, body] of Object.entries(catalog.policies)) {
    const existing = current.find((p) => p.type === type);
    if (existing?.body?.trim()) {
      log('policies', `${type} already written, left as is`);
      continue;
    }
    if (dry) {
      log('policies', `would write ${type}`);
      continue;
    }
    const data = await gql(Q.shopPolicyUpdate, { shopPolicy: { type, body } });
    checkErrors(type, data.shopPolicyUpdate.userErrors);
    log('policies', `wrote ${type}`);
  }
}

// ---------------------------------------------------------------------------
// CSV export for stores set up by hand (Products > Import in the admin)

const CSV_COLUMNS = [
  'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Type', 'Tags', 'Published',
  'Option1 Name', 'Option1 Value', 'Option2 Name', 'Option2 Value',
  'Variant Price', 'Variant Compare At Price', 'Variant Inventory Policy',
  'Variant Fulfillment Service', 'Variant Requires Shipping', 'Variant Taxable',
  'Image Src', 'Image Position', 'Image Alt Text', 'Variant Image',
  'Fabric & care (product.metafields.custom.fabric_care)', 'Status',
];

export function productsCsv(catalog, base) {
  const esc = (v) => (v === undefined || v === null ? '' : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
  const rows = [CSV_COLUMNS];
  for (const p of catalog.products) {
    const multiColor = p.colors.length > 1;
    const images = p.colors.map((c) => imageUrl(base, p, c));
    let first = true;
    let index = 0;
    for (const color of p.colors) {
      for (const size of p.sizes) {
        const row = {
          Handle: p.handle,
          'Option1 Name': first ? 'Size' : '',
          'Option1 Value': size,
          'Option2 Name': first && multiColor ? 'Color' : '',
          'Option2 Value': multiColor ? color : '',
          'Variant Price': p.price,
          'Variant Compare At Price': p.compare_at_price || '',
          'Variant Inventory Policy': 'deny',
          'Variant Fulfillment Service': 'manual',
          'Variant Requires Shipping': 'TRUE',
          'Variant Taxable': 'TRUE',
          'Variant Image': multiColor ? images[p.colors.indexOf(color)] : '',
        };
        if (first) {
          Object.assign(row, {
            Title: p.title, 'Body (HTML)': p.description, Vendor: catalog.vendor, Type: p.type,
            Tags: p.tags.join(', '), Published: 'TRUE', Status: 'active',
            'Fabric & care (product.metafields.custom.fabric_care)': p.fabric_care,
          });
        }
        if (index < images.length) {
          Object.assign(row, { 'Image Src': images[index], 'Image Position': index + 1, 'Image Alt Text': p.title });
        }
        rows.push(CSV_COLUMNS.map((c) => row[c]));
        first = false;
        index += 1;
      }
    }
  }
  return rows.map((r) => r.map(esc).join(',')).join('\n') + '\n';
}

// ---------------------------------------------------------------------------

function log(step, message) {
  console.log(`[${step}] ${message}`);
}

export function loadCatalog() {
  return JSON.parse(readFileSync(join(HERE, 'catalog.json'), 'utf8'));
}

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes('--dry-run');
  const onlyArg = args.find((a) => a.startsWith('--only='));
  const only = onlyArg ? onlyArg.slice(7).split(',') : STEPS;
  const unknown = only.filter((s) => !STEPS.includes(s));
  if (unknown.length) throw new Error(`Unknown step(s): ${unknown.join(', ')}. Steps: ${STEPS.join(', ')}`);

  const catalog = loadCatalog();
  const base = (process.env.IMAGE_BASE_URL || DEFAULT_IMAGE_BASE_URL).replace(/\/$/, '');

  if (args.includes('--csv')) {
    const out = join(HERE, 'products.csv');
    writeFileSync(out, productsCsv(catalog, base));
    console.log(`Wrote ${out}`);
    return;
  }

  let gql = null;
  if (!dry) {
    const store = (process.env.SHOPIFY_STORE || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!store.endsWith('.myshopify.com')) {
      throw new Error("Set SHOPIFY_STORE to your store's address, like babyattire-dev.myshopify.com");
    }
    const placeholders = {
      SHOPIFY_STORE: ['your-store.myshopify.com', 'babyattire-dev.myshopify.com'].includes(store),
      SHOPIFY_ADMIN_TOKEN: /\.\.\.$/.test(process.env.SHOPIFY_ADMIN_TOKEN ?? 'unset'),
      SHOPIFY_CLIENT_ID: /\.\.\.$/.test(process.env.SHOPIFY_CLIENT_ID ?? 'unset'),
      SHOPIFY_CLIENT_SECRET: /\.\.\.$/.test(process.env.SHOPIFY_CLIENT_SECRET ?? 'unset'),
    };
    const unfilled = Object.keys(placeholders).filter((k) => placeholders[k]);
    if (unfilled.length) {
      throw new Error(
        `${unfilled.join(', ')} ${unfilled.length > 1 ? 'still have their example values' : 'still has its example value'} from the instructions. ` +
          `Replace ${unfilled.length > 1 ? 'them' : 'it'} with your store's real details.` +
          " See setup/README.md, steps 1-3."
      );
    }
    gql = client(store, await getToken(store));
    console.log(`Setting up ${store} (Admin API ${API_VERSION})`);
  } else {
    console.log('Dry run: nothing is sent to Shopify.');
  }

  const ids = { collections: {}, pages: {} };
  const publicationId = dry ? null : only.some((s) => s === 'products' || s === 'collections') ? await onlineStoreId(gql) : null;

  if (only.includes('metafields')) await ensureMetafieldDefinition(gql, dry);
  if (only.includes('files')) await ensureShopImages(gql, catalog, base, dry);
  if (only.includes('products')) await ensureProducts(gql, catalog, base, publicationId, dry);
  if (only.includes('collections')) await ensureCollections(gql, catalog, publicationId, dry, ids);
  if (only.includes('pages')) await ensurePages(gql, catalog, dry, ids);
  if (only.includes('menus')) {
    if (dry) {
      for (const c of catalog.collections) ids.collections[c.handle] ??= `gid://shopify/Collection/${c.handle}`;
      for (const p of catalog.pages) ids.pages[p.handle] ??= `gid://shopify/Page/${p.handle}`;
    } else {
      await lookupIds(gql, catalog, ids);
    }
    await ensureMenus(gql, catalog, dry, ids);
  }
  if (only.includes('policies')) await ensurePolicies(gql, catalog, dry);

  console.log('\nDone. Still to do by hand (see setup/README.md):');
  console.log('  - Add a free shipping rate for orders over $50 in Settings > Shipping and delivery');
  console.log('  - Push the theme: shopify theme push --unpublished, then publish it');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(`\nSetup stopped: ${err.message}`);
    process.exitCode = 1;
  });
}
