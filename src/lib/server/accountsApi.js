// Accounts, payments and the college / student-records workspace.
//
//   /api/auth/*       sign up, sign in, profile, practice progress
//   /api/pay/*        prices, Razorpay checkout, manual UPI payments, webhook
//   /api/manage/*     admin only: feature prices, payment accounts, payments,
//                     users and college accounts, backup code runner
//   /api/workspace/*  student records for users with the Student records or
//                     College panel feature
//
// Runs in netlify/functions/accounts.js (store "anobyt-content") and in the
// Vite dev middleware. Prices always come from the server's own settings,
// never from the browser, and access is granted only after the payment
// signature checks out (or the admin approves a manual payment).

import { DEFAULTS } from "../content/defaults.js";
import { handleCompile } from "../compileHandler.js";
import { adminState, bool, fail, json, needAdmin, newId, num, readAll, readBody, str } from "./http.js";
import {
  FEATURES,
  activeGrants,
  checkPassword,
  cleanAccess,
  featureSummary,
  hasFeature,
  hashPassword,
  hex,
  hmacRaw,
  makeUserToken,
  moduleIsFree,
  publicUser,
  readAccess,
  readRunner,
  readUser,
} from "./auth.js";

const MAX_USERS = 50000;
const MAX_STUDENTS = 5000;
const ROLES = ["student", "college"];
const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const normEmail = (e) => str(e, 200).trim().toLowerCase();

// ---- Payment settings ----

function cleanPayAccount(a, old) {
  const provider = a?.provider === "upi" ? "upi" : "razorpay";
  return {
    id: str(a?.id, 40) || newId(),
    label: str(a?.label, 120).trim() || (provider === "upi" ? "UPI" : "Razorpay"),
    provider,
    keyId: str(a?.keyId, 120).trim(),
    // An empty secret from the admin form means "keep the saved one".
    keySecret: str(a?.keySecret, 200).trim() || old?.keySecret || "",
    webhookSecret: str(a?.webhookSecret, 200).trim() || old?.webhookSecret || "",
    upiId: str(a?.upiId, 120).trim(),
    payeeName: str(a?.payeeName, 120).trim(),
    instructions: str(a?.instructions, 1000),
    active: bool(a?.active),
  };
}

async function readPayCfg(store) {
  const c = (await store.get("paycfg")) || {};
  return { currency: "INR", businessName: str(c.businessName, 120) || "Anobyt", accounts: Array.isArray(c.accounts) ? c.accounts : [] };
}

/** The Razorpay account in use: Netlify env vars win, else the first active account saved in the admin panel. */
function razorpayAccount(cfg, env) {
  if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET)
    return { id: "env", label: "Netlify environment", provider: "razorpay", keyId: env.RAZORPAY_KEY_ID, keySecret: env.RAZORPAY_KEY_SECRET, webhookSecret: env.RAZORPAY_WEBHOOK_SECRET || "" };
  return cfg.accounts.find((a) => a.active && a.provider === "razorpay" && a.keyId && a.keySecret) || null;
}
const upiAccount = (cfg) => cfg.accounts.find((a) => a.active && a.provider === "upi" && a.upiId) || null;

// ---- What can be bought ----

async function readCourses(store) {
  const saved = await store.get("col:courses");
  return Array.isArray(saved) ? saved : structuredClone(DEFAULTS.courses);
}

/** Works out the title and price of an item on the server. Returns { item, title, amount, days } or { error }. */
async function priceItem(store, raw, access) {
  const type = raw?.type;
  if (type === "feature") {
    const cfg = access[raw.id];
    if (!FEATURES[raw.id] || !cfg?.enabled) return { error: "That feature isn't available." };
    if (!cfg.paid || !cfg.price) return { error: "That feature is free. Sign in to use it." };
    return { item: { type, id: raw.id }, title: FEATURES[raw.id].title, amount: cfg.price, days: cfg.days };
  }
  if (type === "course" || type === "module") {
    const courses = await readCourses(store);
    const c = courses.find((x) => x.id === raw.courseId || x.id === raw.id);
    if (!c || !c.published || c.tier !== "premium") return { error: "That course isn't for sale." };
    if (type === "course") {
      if (!(c.price > 0)) return { error: "This course doesn't have a price yet." };
      return { item: { type, id: c.id }, title: c.title, amount: c.price, days: 0 };
    }
    const idx = c.modules.findIndex((m) => m.id === raw.moduleId);
    const m = c.modules[idx];
    if (!m) return { error: "That module doesn't exist." };
    if (moduleIsFree(c, idx)) return { error: "That module is free." };
    if (!(m.price > 0)) return { error: "This module is sold only with the full course." };
    return { item: { type, courseId: c.id, moduleId: m.id }, title: `${c.title}: ${m.title || `Module ${idx + 1}`}`, amount: m.price, days: 0 };
  }
  return { error: "Unknown item." };
}

function owns(user, item, access) {
  if (item.type === "feature") return hasFeature(user, item.id, access);
  const g = activeGrants(user);
  if (hasFeature(user, "allCourses", access)) return true;
  if (item.type === "course") return g.some((x) => x.type === "course" && x.id === item.id);
  return g.some((x) => (x.type === "course" && x.id === item.courseId) || (x.type === "module" && x.courseId === item.courseId && x.moduleId === item.moduleId));
}

/** Adds the bought item to the account (extending a feature that is still running). */
async function grant(store, userId, pay) {
  const user = await store.get("user:" + userId);
  if (!user) return;
  const now = Date.now();
  const grants = (user.grants || []).filter((g) => !(g.type === pay.item.type && g.id === pay.item.id && g.moduleId === pay.item.moduleId && g.courseId === pay.item.courseId));
  const prev = (user.grants || []).find((g) => g.type === "feature" && pay.item.type === "feature" && g.id === pay.item.id && g.expiresAt > now);
  const start = prev ? prev.expiresAt : now;
  grants.push({ ...pay.item, expiresAt: pay.days ? start + pay.days * 864e5 : 0, payment: pay.id, grantedAt: now });
  await store.set("user:" + userId, { ...user, grants });
}

async function markPaid(store, pay, extra) {
  if (pay.status === "paid") return pay;
  const next = { ...pay, ...extra, status: "paid", paidAt: Date.now() };
  await store.set("pay:" + pay.id, next);
  await grant(store, pay.userId, next);
  return next;
}

const authHeader = (acc) => "Basic " + btoa(`${acc.keyId}:${acc.keySecret}`);

// ---- Users ----

function cleanGrants(list) {
  return (Array.isArray(list) ? list : []).slice(0, 200).flatMap((g) => {
    const expiresAt = Math.max(0, num(g?.expiresAt, 0));
    if (g?.type === "feature" && FEATURES[g.id]) return [{ type: "feature", id: g.id, expiresAt, grantedAt: num(g.grantedAt, Date.now()), payment: str(g.payment, 80) }];
    if (g?.type === "course" && g.id) return [{ type: "course", id: str(g.id, 60), expiresAt, grantedAt: num(g.grantedAt, Date.now()), payment: str(g.payment, 80) }];
    if (g?.type === "module" && g.courseId && g.moduleId)
      return [{ type: "module", courseId: str(g.courseId, 60), moduleId: str(g.moduleId, 60), expiresAt, grantedAt: num(g.grantedAt, Date.now()), payment: str(g.payment, 80) }];
    return [];
  });
}

async function createUser(store, body, { role = "student", grants = [] } = {}) {
  const email = normEmail(body?.email);
  const name = str(body?.name, 120).trim();
  const password = typeof body?.password === "string" ? body.password : "";
  if (!name) return { error: fail(400, "Enter your name.") };
  if (!emailOk(email)) return { error: fail(400, "Enter a valid email.") };
  if (password.length < 8) return { error: fail(400, "Use a password of at least 8 characters.") };
  if (await store.get("email:" + email)) return { error: fail(400, "An account with this email already exists. Sign in instead.") };
  if ((await store.list("user:")).length >= MAX_USERS) return { error: fail(503, "Sign-ups are closed right now.") };
  const user = {
    id: newId(),
    name,
    email,
    phone: str(body?.phone, 30).trim(),
    college: str(body?.college, 200).trim(),
    year: str(body?.year, 40),
    role: ROLES.includes(role) ? role : "student",
    collegeName: str(body?.collegeName, 200).trim(),
    pass: await hashPassword(password),
    sv: 0,
    grants: cleanGrants(grants),
    progress: { solved: [] },
    createdAt: Date.now(),
  };
  await store.set("user:" + user.id, user);
  await store.set("email:" + email, { id: user.id });
  return { user };
}

async function userByEmail(store, email) {
  const ref = await store.get("email:" + normEmail(email));
  return ref ? store.get("user:" + ref.id) : null;
}

// ---- Student records ----

function cleanStudent(s, id, old) {
  return {
    id,
    name: str(s?.name, 120).trim(),
    email: normEmail(s?.email),
    phone: str(s?.phone, 30).trim(),
    roll: str(s?.roll, 60).trim(),
    branch: str(s?.branch, 120).trim(),
    year: str(s?.year, 40).trim(),
    section: str(s?.section, 40).trim(),
    notes: str(s?.notes, 2000),
    createdAt: old?.createdAt || Date.now(),
    updatedAt: Date.now(),
  };
}

// ---- Router ----

export async function handleAccountsApi(request, store, env, deps = {}) {
  const fetchImpl = deps.fetch || fetch;
  const url = new URL(request.url);
  const [area, a, b, c] = url.pathname.replace(/\/+$/, "").split("/").filter(Boolean).slice(1);
  const method = request.method;

  try {
    // Razorpay webhook: verified against the raw body, so it is read before JSON parsing.
    if (area === "pay" && a === "webhook" && method === "POST") {
      const raw = await request.text();
      const cfg = await readPayCfg(store);
      const acc = razorpayAccount(cfg, env);
      const secret = acc?.webhookSecret;
      if (!secret) return fail(400, "Webhook secret is not set.");
      const sig = request.headers.get("x-razorpay-signature") || "";
      if (sig !== hex(await hmacRaw(secret, raw))) return fail(400, "Bad signature.");
      const evt = JSON.parse(raw || "{}");
      const orderId = evt.payload?.order?.entity?.id || evt.payload?.payment?.entity?.order_id;
      const paymentId = evt.payload?.payment?.entity?.id || "";
      if ((evt.event === "order.paid" || evt.event === "payment.captured") && orderId) {
        const pay = await store.get("pay:" + orderId);
        if (pay) await markPaid(store, pay, { paymentId: pay.paymentId || paymentId, via: "webhook" });
      }
      return json({ ok: true });
    }

    const { body, error } = await readBody(request);
    if (error) return error;
    const admin = adminState(request, env);
    const access = await readAccess(store);

    // ---------- /api/auth ----------
    if (area === "auth") {
      if (a === "signup" && method === "POST") {
        if (body?.website) return fail(400, "Please try again.");
        const { user, error: err } = await createUser(store, body);
        if (err) return err;
        return json({ token: await makeUserToken(store, user), user: publicUser(user), features: featureSummary(user, access) }, 201);
      }
      if (a === "login" && method === "POST") {
        const user = await userByEmail(store, body?.email);
        const bad = fail(400, "Wrong email or password.");
        if (!user || user.disabled) return bad;
        if (user.lockUntil && user.lockUntil > Date.now()) return fail(429, "Too many wrong attempts. Try again in 15 minutes.");
        if (!(await checkPassword(body?.password, user.pass))) {
          const failed = (user.failed || 0) + 1;
          await store.set("user:" + user.id, { ...user, failed: failed >= 8 ? 0 : failed, lockUntil: failed >= 8 ? Date.now() + 15 * 6e4 : 0 });
          return bad;
        }
        const next = { ...user, failed: 0, lockUntil: 0, lastLoginAt: Date.now() };
        await store.set("user:" + user.id, next);
        return json({ token: await makeUserToken(store, next), user: publicUser(next), features: featureSummary(next, access) });
      }
      const user = await readUser(request, store);
      if (!user) return fail(401, "Please sign in again.");
      if (a === "me" && method === "GET") return json({ user: publicUser(user), features: featureSummary(user, access) });
      if (a === "me" && method === "PUT") {
        const next = { ...user, name: str(body?.name, 120).trim() || user.name, phone: str(body?.phone ?? user.phone, 30).trim(), college: str(body?.college ?? user.college, 200).trim(), year: str(body?.year ?? user.year, 40) };
        if (body?.newPassword) {
          if (!(await checkPassword(body.password, user.pass))) return fail(400, "Your current password is wrong.");
          if (String(body.newPassword).length < 8) return fail(400, "Use a new password of at least 8 characters.");
          next.pass = await hashPassword(String(body.newPassword));
          next.sv = (user.sv || 0) + 1; // signs out other devices
        }
        await store.set("user:" + user.id, next);
        return json({ user: publicUser(next), token: next.sv !== user.sv ? await makeUserToken(store, next) : undefined });
      }
      if (a === "logout" && method === "POST") {
        if (body?.everywhere) await store.set("user:" + user.id, { ...user, sv: (user.sv || 0) + 1 });
        return json({ ok: true });
      }
      if (a === "progress" && method === "PUT") {
        const add = (Array.isArray(body?.solved) ? body.solved : []).map((x) => str(x, 80)).filter(Boolean);
        const solved = [...new Set([...(user.progress?.solved || []), ...add])].slice(-5000);
        await store.set("user:" + user.id, { ...user, progress: { solved, updatedAt: Date.now() } });
        return json({ solved: solved.length });
      }
      return fail(404, "Not found.");
    }

    // ---------- /api/pay ----------
    if (area === "pay") {
      const cfg = await readPayCfg(store);
      const rzp = razorpayAccount(cfg, env);
      const upi = upiAccount(cfg);
      if (a === "config" && method === "GET") {
        const features = {};
        for (const id of Object.keys(FEATURES)) features[id] = { ...FEATURES[id], ...access[id] };
        return json({
          currency: cfg.currency,
          businessName: cfg.businessName,
          razorpay: rzp ? { keyId: rzp.keyId } : null,
          upi: upi ? { upiId: upi.upiId, payeeName: upi.payeeName, instructions: upi.instructions } : null,
          features,
        });
      }
      const user = await readUser(request, store);
      if (!user) return fail(401, "Sign in to buy.");
      if (a === "mine" && method === "GET") {
        const pays = (await readAll(store, "pay:")).filter((p) => p.userId === user.id && p.status !== "created").sort((x, y) => y.createdAt - x.createdAt);
        return json({ payments: pays.map(({ userId: _u, ...p }) => p) });
      }
      if ((a === "order" || a === "manual") && method === "POST") {
        const priced = await priceItem(store, body?.item, access);
        if (priced.error) return fail(400, priced.error);
        if (owns(user, priced.item, access)) return fail(400, "You already have this.");
        const base = { userId: user.id, userEmail: user.email, userName: user.name, item: priced.item, title: priced.title, amount: priced.amount, days: priced.days, currency: cfg.currency, createdAt: Date.now() };
        if (a === "manual") {
          if (!upi) return fail(400, "UPI payments are not set up.");
          const utr = str(body?.utr, 40).trim();
          if (!/^[A-Za-z0-9]{6,40}$/.test(utr)) return fail(400, "Enter the UPI transaction ID (UTR) from your payment app.");
          const pay = { ...base, id: "upi_" + newId(), provider: "upi", accountId: upi.id, utr, status: "pending" };
          await store.set("pay:" + pay.id, pay);
          return json({ payment: pay }, 201);
        }
        if (!rzp) return fail(400, "Online payments are not set up yet.");
        const res = await fetchImpl("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: { Authorization: authHeader(rzp), "Content-Type": "application/json" },
          body: JSON.stringify({ amount: Math.round(priced.amount * 100), currency: cfg.currency, receipt: newId(), notes: { user: user.email, item: priced.title.slice(0, 200) } }),
        }).catch(() => null);
        const order = res ? await res.json().catch(() => null) : null;
        if (!res?.ok || !order?.id) return fail(502, order?.error?.description || "Could not start the payment. Please try again.");
        const pay = { ...base, id: order.id, provider: "razorpay", accountId: rzp.id, status: "created" };
        await store.set("pay:" + pay.id, pay);
        return json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: rzp.keyId, name: cfg.businessName, description: priced.title, prefill: { name: user.name, email: user.email, contact: user.phone } }, 201);
      }
      if (a === "verify" && method === "POST") {
        const orderId = str(body?.orderId, 80);
        const paymentId = str(body?.paymentId, 80);
        const pay = orderId ? await store.get("pay:" + orderId) : null;
        if (!pay || pay.userId !== user.id) return fail(404, "Payment not found.");
        if (pay.status === "paid") return json({ ok: true, payment: pay });
        const acc = pay.accountId === "env" ? rzp : cfg.accounts.find((x) => x.id === pay.accountId) || rzp;
        if (!acc?.keySecret) return fail(400, "Payments are not set up.");
        const expected = hex(await hmacRaw(acc.keySecret, `${orderId}|${paymentId}`));
        if (!paymentId || expected !== str(body?.signature, 200)) {
          await store.set("pay:" + pay.id, { ...pay, status: "failed", failedAt: Date.now() });
          return fail(400, "We couldn't confirm this payment. If money was taken, contact us with your payment ID.");
        }
        const done = await markPaid(store, pay, { paymentId, via: "checkout" });
        const fresh = await store.get("user:" + user.id);
        return json({ ok: true, payment: done, user: publicUser(fresh), features: featureSummary(fresh, access) });
      }
      return fail(404, "Not found.");
    }

    // ---------- /api/workspace ----------
    if (area === "workspace") {
      const user = await readUser(request, store);
      if (!user) return fail(401, "Please sign in.");
      if (a !== "students") return fail(404, "Not found.");
      if (!hasFeature(user, "studentData", access)) return fail(403, "Student records are a premium feature.");
      const prefix = `stu:${user.id}:`;
      if (!b && method === "GET") {
        const rows = (await readAll(store, prefix)).sort((x, y) => x.name.localeCompare(y.name));
        // College panel: show practice progress for students who have an account with the same email.
        if (hasFeature(user, "collegePanel", access)) {
          await Promise.all(
            rows.map(async (r) => {
              const u = r.email ? await userByEmail(store, r.email) : null;
              r.linked = Boolean(u);
              if (u) {
                r.solved = u.progress?.solved?.length || 0;
                r.lastActive = u.progress?.updatedAt || u.lastLoginAt || 0;
              }
            }),
          );
        }
        return json({ students: rows, panel: hasFeature(user, "collegePanel", access) });
      }
      if (b === "import" && method === "POST") {
        const rows = (Array.isArray(body?.rows) ? body.rows : []).slice(0, 2000);
        const existing = await readAll(store, prefix);
        if (existing.length + rows.length > MAX_STUDENTS) return fail(400, `You can keep up to ${MAX_STUDENTS} students.`);
        const byKey = new Map(existing.map((r) => [r.email || r.roll || r.id, r]));
        let added = 0;
        let updated = 0;
        for (const row of rows) {
          const key = normEmail(row?.email) || str(row?.roll, 60).trim();
          const old = key ? byKey.get(key) : null;
          const rec = cleanStudent(row, old?.id || newId(), old);
          if (!rec.name) continue;
          await store.set(prefix + rec.id, old ? { ...old, ...Object.fromEntries(Object.entries(rec).filter(([, v]) => v !== "")) } : rec);
          if (old) updated++;
          else added++;
        }
        return json({ added, updated });
      }
      if (!b && method === "POST") {
        if ((await store.list(prefix)).length >= MAX_STUDENTS) return fail(400, `You can keep up to ${MAX_STUDENTS} students.`);
        const rec = cleanStudent(body, newId());
        if (!rec.name) return fail(400, "Enter the student's name.");
        await store.set(prefix + rec.id, rec);
        return json({ student: rec }, 201);
      }
      const old = b ? await store.get(prefix + b) : null;
      if (!old) return fail(404, "Student not found.");
      if (method === "PUT") {
        const rec = cleanStudent(body, b, old);
        if (!rec.name) return fail(400, "Enter the student's name.");
        await store.set(prefix + b, rec);
        return json({ student: rec });
      }
      if (method === "DELETE") {
        await store.delete(prefix + b);
        return json({ ok: true });
      }
      return fail(405, "Method not allowed.");
    }

    // ---------- /api/manage (admin) ----------
    if (area === "manage") {
      if (!admin.ok) return needAdmin(admin);

      if (a === "access") {
        if (method === "GET") return json({ access, features: FEATURES });
        if (method === "PUT") {
          const next = cleanAccess(body);
          await store.set("access", next);
          return json({ access: next });
        }
      }

      if (a === "payment-settings") {
        const cfg = await readPayCfg(store);
        const mask = (x) => ({ ...x, keySecret: "", hasSecret: Boolean(x.keySecret), webhookSecret: "", hasWebhookSecret: Boolean(x.webhookSecret) });
        const envNote = env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET ? { keyId: env.RAZORPAY_KEY_ID, webhook: Boolean(env.RAZORPAY_WEBHOOK_SECRET) } : null;
        if (method === "GET") return json({ settings: { ...cfg, accounts: cfg.accounts.map(mask) }, env: envNote });
        if (method === "PUT") {
          const old = new Map(cfg.accounts.map((x) => [x.id, x]));
          const accounts = (Array.isArray(body?.accounts) ? body.accounts : []).slice(0, 20).map((x) => cleanPayAccount(x, old.get(x?.id)));
          const next = { currency: "INR", businessName: str(body?.businessName, 120).trim() || "Anobyt", accounts };
          await store.set("paycfg", next);
          return json({ settings: { ...next, accounts: accounts.map(mask) }, env: envNote });
        }
      }

      if (a === "payment-test" && method === "POST") {
        // Checks a Razorpay key pair by asking Razorpay for one recent order.
        const cfg = await readPayCfg(store);
        const acc = b === "env" ? razorpayAccount({ accounts: [] }, env) : cfg.accounts.find((x) => x.id === b);
        if (!acc || acc.provider !== "razorpay") return fail(404, "Account not found.");
        const res = await fetchImpl("https://api.razorpay.com/v1/orders?count=1", { headers: { Authorization: authHeader(acc) } }).catch(() => null);
        if (!res) return json({ ok: false, message: "Could not reach Razorpay." });
        if (res.ok) return json({ ok: true, message: `Keys work (${acc.keyId.startsWith("rzp_live") ? "live mode" : "test mode"}).` });
        const d = await res.json().catch(() => null);
        return json({ ok: false, message: d?.error?.description || `Razorpay said ${res.status}.` });
      }

      if (a === "payments") {
        if (!b && method === "GET") {
          const pays = (await readAll(store, "pay:")).sort((x, y) => y.createdAt - x.createdAt);
          return json({ payments: url.searchParams.get("all") === "1" ? pays : pays.filter((p) => p.status !== "created") });
        }
        const pay = await store.get("pay:" + b);
        if (!pay) return fail(404, "Payment not found.");
        if (method === "PUT") {
          if (body?.action === "approve") return json({ payment: await markPaid(store, pay, { via: "admin" }) });
          if (body?.action === "reject") {
            const next = { ...pay, status: "rejected", note: str(body?.note, 500) };
            await store.set("pay:" + pay.id, next);
            return json({ payment: next });
          }
          return fail(400, "Unknown action.");
        }
      }

      if (a === "users") {
        if (!b && method === "GET") {
          const users = (await readAll(store, "user:")).sort((x, y) => y.createdAt - x.createdAt).map(publicUser);
          return json({ users });
        }
        if (!b && method === "POST") {
          const { user, error: err } = await createUser(store, body, { role: body?.role, grants: body?.grants });
          if (err) return err;
          return json({ user: publicUser(user) }, 201);
        }
        const user = await store.get("user:" + b);
        if (!user) return fail(404, "User not found.");
        if (method === "GET") {
          const pays = (await readAll(store, "pay:")).filter((p) => p.userId === b).sort((x, y) => y.createdAt - x.createdAt);
          return json({ user: publicUser(user), payments: pays });
        }
        if (method === "PUT") {
          const next = {
            ...user,
            name: str(body?.name ?? user.name, 120).trim() || user.name,
            phone: str(body?.phone ?? user.phone, 30).trim(),
            college: str(body?.college ?? user.college, 200).trim(),
            role: ROLES.includes(body?.role) ? body.role : user.role,
            collegeName: str(body?.collegeName ?? user.collegeName, 200).trim(),
            disabled: body?.disabled !== undefined ? bool(body.disabled) : Boolean(user.disabled),
            grants: body?.grants !== undefined ? cleanGrants(body.grants) : user.grants,
          };
          if (body?.password) {
            if (String(body.password).length < 8) return fail(400, "Use a password of at least 8 characters.");
            next.pass = await hashPassword(String(body.password));
            next.sv = (user.sv || 0) + 1;
            next.failed = 0;
            next.lockUntil = 0;
          }
          if (next.disabled && !user.disabled) next.sv = (user.sv || 0) + 1;
          await store.set("user:" + b, next);
          return json({ user: publicUser(next) });
        }
        if (method === "DELETE") {
          await store.delete("user:" + b);
          await store.delete("email:" + user.email);
          await Promise.all((await store.list(`stu:${b}:`)).map((k) => store.delete(k)));
          return json({ ok: true });
        }
      }

      if (a === "runner") {
        const r = await readRunner(store);
        if (!b && method === "GET") return json({ runner: { ...r, judge0Key: "", hasKey: Boolean(r.judge0Key) } });
        if (!b && method === "PUT") {
          const urlIn = str(body?.judge0Url, 300).trim();
          if (urlIn && !/^https:\/\//i.test(urlIn)) return fail(400, "The backup runner URL must start with https://");
          const next = { judge0Url: urlIn, judge0Key: str(body?.judge0Key, 300).trim() || r.judge0Key, judge0Host: str(body?.judge0Host, 200).trim(), prefer: body?.prefer === "judge0" && urlIn ? "judge0" : "primary" };
          if (body?.clearKey) next.judge0Key = "";
          await store.set("runner", next);
          return json({ runner: { ...next, judge0Key: "", hasKey: Boolean(next.judge0Key) } });
        }
        if (b === "test" && method === "POST") {
          const samples = {
            python: 'print(int(input()) * 2)',
            javascript: 'const n = Number(require("fs").readFileSync(0, "utf8").trim()); console.log(n * 2);',
            java: "import java.util.*;\npublic class Main { public static void main(String[] a) { Scanner s = new Scanner(System.in); System.out.println(s.nextInt() * 2); } }",
            c: '#include <stdio.h>\nint main(){int n; scanf("%d",&n); printf("%d\\n", n*2); return 0;}',
            cpp: "#include <iostream>\nint main(){int n; std::cin>>n; std::cout<<n*2<<std::endl; return 0;}",
          };
          const which = c === "backup" ? { ...r, prefer: "judge0" } : c === "main" ? null : r;
          if (c === "backup" && !r.judge0Url) return fail(400, "Save a backup runner first.");
          const results = await Promise.all(
            Object.entries(samples).map(async ([language, code]) => {
              const t = Date.now();
              const out = await (deps.compile || handleCompile)({ language, code, stdin: "21" }, which);
              const ok = out.statusCode < 400 && String(out.body?.stdout || "").trim() === "42";
              return { language, ok, ms: Date.now() - t, message: ok ? "Works" : out.body?.error || out.body?.stderr || `Got "${String(out.body?.stdout || "").slice(0, 80)}"`, runner: out.body?.runner || "main" };
            }),
          );
          return json({ results });
        }
      }
      return fail(404, "Not found.");
    }

    return fail(404, "Not found.");
  } catch (err) {
    console.error(err);
    return fail(500, "Something went wrong on the server. Please try again.");
  }
}
