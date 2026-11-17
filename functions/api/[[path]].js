// Cloudflare Pages Function for every /api/* request: the same handlers the Netlify functions use
// (netlify/functions/*), with Cloudflare storage underneath.
//
// Bindings (Cloudflare dashboard -> the Pages project -> Settings -> Bindings):
//   DB       D1 database        accounts, purchases, content, tests, CodeVita progress (functions/_lib/d1Store.js)
//   CV_BANK  R2 bucket          codevita-bank.json, the built-in CodeVita bank with hidden test cases
// Environment variables (Settings -> Variables and Secrets):
//   ADMIN_PASSWORD, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET
// Setup and data migration: docs/cloudflare.md.

import { handleAccountsApi } from "../../src/lib/server/accountsApi.js";
import { handleContentApi } from "../../src/lib/server/contentApi.js";
import { handleTestsApi } from "../../src/lib/server/testsApi.js";
import { handleCodevitaApi, setBuiltinBank } from "../../src/lib/server/codevita.js";
import { readRunner } from "../../src/lib/server/auth.js";
import { handleCompile } from "../../src/lib/compileHandler.js";
import { d1Store } from "../_lib/d1Store.js";

const json = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

// Which handler serves which paths (the same split as the Netlify functions' config.path).
const ACCOUNTS = [/^\/api\/(auth|pay|manage|workspace)\//];
const CONTENT = [/^\/api\/(content|events|premium)\//, /^\/api\/(leads|codes|problems|practice)(\/|$)/];
const TESTS = [/^\/api\/tests(\/|$)/, /^\/api\/admin\/login$/];
const matches = (rules, path) => rules.some((r) => r.test(path));

// The CodeVita bank is ~8 MB with its hidden test cases, too big to bundle into a Cloudflare
// function, so it's read once per worker instance from the private R2 bucket.
let bankEnv = null;
setBuiltinBank(async () => {
  const obj = await bankEnv?.CV_BANK?.get("codevita-bank.json");
  if (!obj) {
    console.log("CodeVita: codevita-bank.json not found in the CV_BANK R2 bucket; built-in problems are empty.");
    return [];
  }
  return obj.json();
});

async function compile(request, env) {
  if (request.method !== "POST") return json({ error: "Use POST." }, 405);
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }
  // The backup runner (admin -> Compiler) is optional; a storage hiccup must not stop the main runner.
  const runner = await readRunner(d1Store(env.DB, "anobyt-content")).catch(() => null);
  const { statusCode, body: out } = await handleCompile(body, runner);
  return json(out, statusCode);
}

/**
 * One-off data import from Netlify (scripts/cloudflare/migrate-from-netlify.mjs). Off unless the
 * MIGRATION_KEY secret is set, and every request must carry it. Remove the secret afterwards.
 *   POST /api/_migrate/item  {store, key, value}   one stored value -> D1
 *   PUT  /api/_migrate/bank  <codevita bank JSON>  -> R2 codevita-bank.json
 */
async function migrate(request, env, path) {
  const key = env.MIGRATION_KEY;
  if (!key || key.length < 24) return json({ error: "Not found." }, 404);
  if (request.headers.get("x-migration-key") !== key) return json({ error: "Wrong migration key." }, 401);
  if (path === "/api/_migrate/item" && request.method === "POST") {
    const { store, key: k, value } = await request.json();
    if (!["anobyt-content", "anobyt-tests", "anobyt-codevita"].includes(store) || typeof k !== "string" || !k) return json({ error: "Bad item." }, 400);
    await d1Store(env.DB, store).set(k, value);
    return json({ ok: true });
  }
  if (path === "/api/_migrate/bank" && request.method === "PUT") {
    if (!env.CV_BANK) return json({ error: "Add an R2 binding named CV_BANK first." }, 500);
    const text = await request.text();
    const list = JSON.parse(text);
    if (!Array.isArray(list) || !list.length) return json({ error: "The bank must be a non-empty JSON array." }, 400);
    await env.CV_BANK.put("codevita-bank.json", text, { httpMetadata: { contentType: "application/json" } });
    setBuiltinBank(async () => list); // pick it up without waiting for a new instance
    return json({ ok: true, problems: list.length });
  }
  return json({ error: "Not found." }, 404);
}

export async function onRequest({ request, env }) {
  const path = new URL(request.url).pathname;
  const admin = { ADMIN_PASSWORD: env.ADMIN_PASSWORD };
  try {
    if (path.startsWith("/api/_migrate/")) return await migrate(request, env, path);
    if (path === "/api/compile") return await compile(request, env);
    if (matches(ACCOUNTS, path))
      return await handleAccountsApi(request, d1Store(env.DB, "anobyt-content"), {
        ...admin,
        RAZORPAY_KEY_ID: env.RAZORPAY_KEY_ID,
        RAZORPAY_KEY_SECRET: env.RAZORPAY_KEY_SECRET,
        RAZORPAY_WEBHOOK_SECRET: env.RAZORPAY_WEBHOOK_SECRET,
      });
    if (matches(CONTENT, path)) return await handleContentApi(request, d1Store(env.DB, "anobyt-content"), admin);
    if (matches(TESTS, path)) return await handleTestsApi(request, d1Store(env.DB, "anobyt-tests"), admin, undefined, d1Store(env.DB, "anobyt-content"));
    if (path.startsWith("/api/cv/")) {
      bankEnv = env;
      return await handleCodevitaApi(request, d1Store(env.DB, "anobyt-codevita"), d1Store(env.DB, "anobyt-content"), admin);
    }
    // /api/mail/send (bulk login emails) isn't ported: nodemailer can't run here, and the admin
    // screen sends through the data service's /api/email/student-credentials instead.
    return json({ error: "Not found." }, 404);
  } catch (e) {
    console.log(`API error on ${path}: ${e?.stack || e}`);
    return json({ error: e?.message?.includes("D1 binding") ? e.message : "The server had a problem. Please try again." }, 500);
  }
}
