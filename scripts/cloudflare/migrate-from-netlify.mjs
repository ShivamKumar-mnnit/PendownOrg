// Moves the website's stored data from Netlify Blobs to Cloudflare (D1) and uploads the CodeVita
// built-in bank to R2, through the site's temporary /api/_migrate endpoint. See docs/cloudflare.md.
//
//   Everything:      node scripts/cloudflare/migrate-from-netlify.mjs
//   Only the bank:   node scripts/cloudflare/migrate-from-netlify.mjs --bank-only
//
// Environment variables:
//   MIGRATION_KEY        the same random value set as a secret on the Cloudflare Pages project
//   TARGET               where to send it (default https://anobyt.in)
//   NETLIFY_SITE_ID      Netlify -> Site configuration -> Site details -> Site ID   (not needed with --bank-only)
//   NETLIFY_AUTH_TOKEN   Netlify -> User settings -> Applications -> Personal access token (not needed with --bank-only)

import { getStore } from "@netlify/blobs";
import { CV_BUILTIN } from "../../src/lib/codevita/bank.js";

const STORES = ["anobyt-content", "anobyt-tests", "anobyt-codevita"];
const { MIGRATION_KEY, NETLIFY_SITE_ID, NETLIFY_AUTH_TOKEN } = process.env;
const TARGET = (process.env.TARGET || "https://anobyt.in").replace(/\/$/, "");
const bankOnly = process.argv.includes("--bank-only");

function need(name, value) {
  if (!value) {
    console.error(`Set ${name} first (see docs/cloudflare.md).`);
    process.exit(1);
  }
}
need("MIGRATION_KEY", MIGRATION_KEY);
if (!bankOnly) {
  need("NETLIFY_SITE_ID", NETLIFY_SITE_ID);
  need("NETLIFY_AUTH_TOKEN", NETLIFY_AUTH_TOKEN);
}

async function send(path, method, body) {
  const res = await fetch(TARGET + path, { method, headers: { "Content-Type": "application/json", "x-migration-key": MIGRATION_KEY }, body });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : {};
}

async function copyStore(name) {
  const store = getStore({ name, siteID: NETLIFY_SITE_ID, token: NETLIFY_AUTH_TOKEN });
  const { blobs } = await store.list();
  let done = 0;
  const failed = [];
  // A few at a time, so a big store doesn't hit rate limits.
  for (let i = 0; i < blobs.length; i += 4) {
    await Promise.all(
      blobs.slice(i, i + 4).map(async ({ key }) => {
        try {
          const value = await store.get(key, { type: "json" });
          if (value === null) return;
          const body = JSON.stringify({ store: name, key, value });
          if (body.length > 1_900_000) throw new Error(`too large for D1 (${Math.round(body.length / 1024)} KB)`);
          await send("/api/_migrate/item", "POST", body);
          done++;
        } catch (e) {
          failed.push(`${key}: ${e.message}`);
        }
      }),
    );
    process.stdout.write(`\r${name}: ${done}/${blobs.length}`);
  }
  console.log(`\r${name}: ${done} of ${blobs.length} copied${failed.length ? `, ${failed.length} failed` : ""}`);
  failed.forEach((f) => console.log(`  ${f}`));
  return failed.length;
}

let failures = 0;
if (!bankOnly) {
  for (const name of STORES) failures += await copyStore(name);
}

try {
  const r = await send("/api/_migrate/bank", "PUT", JSON.stringify(CV_BUILTIN));
  console.log(`CodeVita bank: ${r.problems} problems uploaded to R2`);
} catch (e) {
  failures++;
  console.log(`CodeVita bank upload failed: ${e.message}`);
}

console.log(failures ? `\nFinished with ${failures} problem(s); fix them and run again (it's safe to repeat).` : "\nAll done. Remove the MIGRATION_KEY secret from Cloudflare now.");
process.exit(failures ? 1 : 0);
