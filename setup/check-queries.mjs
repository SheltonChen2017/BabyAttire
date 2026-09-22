#!/usr/bin/env node
// Checks seed-store.mjs against Shopify's real Admin API schema, without a store:
// every query and mutation must be valid, and the product, collection and menu
// input built from catalog.json must match the API's input types.
//
// Usage (from the setup folder):
//   npm install
//   node check-queries.mjs

import { buildClientSchema, coerceInputValue, getIntrospectionQuery, parse, validate } from 'graphql';
import { API_VERSION, Q, collectionInput, loadCatalog, menuItems, productInput } from './seed-store.mjs';

// shopify.dev serves the Admin API schema publicly for its API explorer.
const res = await fetch(`https://shopify.dev/admin-graphql-direct-proxy/${API_VERSION}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: getIntrospectionQuery({ inputValueDeprecation: true }) }),
});
if (!res.ok) throw new Error(`Could not download the ${API_VERSION} schema (${res.status})`);
const schema = buildClientSchema((await res.json()).data);

let problems = 0;
const fail = (label, messages) => {
  problems += messages.length;
  for (const m of messages) console.log(`FAIL ${label}: ${m}`);
};

for (const [name, source] of Object.entries(Q)) {
  const errors = validate(schema, parse(source));
  if (errors.length) fail(name, errors.map((e) => e.message));
}

function checkInput(label, typeName, value) {
  const messages = [];
  coerceInputValue(value, schema.getType(typeName), (path, _invalid, error) => {
    messages.push(`${path.join('.') || '(root)'}: ${error.message}`);
  });
  if (messages.length) fail(label, messages);
}

const catalog = loadCatalog();
const base = 'https://example.com/images';
for (const p of catalog.products) {
  const input = productInput(p, catalog, base);
  checkInput(p.handle, 'ProductSetInput', input);
  if (input.variants.length > 2048) fail(p.handle, ['too many variants']);
}
for (const c of catalog.collections) checkInput(c.handle, 'CollectionCreateInput', collectionInput(c));

const ids = { collections: {}, pages: {} };
catalog.collections.forEach((c, i) => (ids.collections[c.handle] = `gid://shopify/Collection/${i + 1}`));
catalog.pages.forEach((p, i) => (ids.pages[p.handle] = `gid://shopify/Page/${i + 1}`));
for (const m of catalog.menus) {
  for (const item of menuItems(m.items, ids)) checkInput(`menu ${m.handle}`, 'MenuItemCreateInput', item);
}

console.log(problems ? `\n${problems} problem(s) found.` : `All queries and inputs are valid for Admin API ${API_VERSION}.`);
process.exit(problems ? 1 : 0);
