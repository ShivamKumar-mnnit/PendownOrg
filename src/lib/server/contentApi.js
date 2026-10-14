// Server side of the content management system: courses (with premium
// lessons), events and registrations, FAQs, site settings, the admin inbox
// (bookings and college requests) and premium access codes.
//
// Runs in netlify/functions/content.js in production and in the Vite dev
// middleware locally. Storage is injected (get/set/delete/list over JSON).
//
// Premium lessons: their content (url and body) is only sent to a browser
// holding a token from POST /api/premium/redeem, which checks an access code
// the admin created. Tokens are signed with a key derived from
// ADMIN_PASSWORD and re-checked against the code on every request, so
// deactivating or deleting a code locks content again straight away.

import { adminState, bool, fail, json, mapLimit, needAdmin, newId, num, readBody, str } from "./http.js";
import { courseUnlocks, moduleIsFree, readAccess, readRunner, readUser } from "./auth.js";
import { ALL_BOOKS, SOLUTION_LABELS, YEARS, accessForYear, accessMap, cleanPractice, listRow, loadBank, practiceUnlocked, readPractice, visibility, yearInfo } from "./practice.js";
import { handleCompile } from "../compileHandler.js";
import { COURSE_TIERS, DEFAULTS, DEFAULT_SETTINGS, EVENT_CATEGORIES, EVENT_MODES, LESSON_TYPES } from "../content/defaults.js";

const COLLECTIONS = ["courses", "events", "faqs"];
const MAX_ITEMS = 300;
const MAX_LEADS = 5000;
const MAX_REGS = 5000;
const LEAD_KINDS = ["booking", "college", "premium", "contact"];

const slug = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
const safeUrl = (v) => {
  const s = str(v, 2000).trim();
  return /^(https?:\/\/|\/)/i.test(s) ? s : "";
};
const list = (v, max = 50) => (Array.isArray(v) ? v.slice(0, max) : []);

// ---- Sanitizers: whatever the admin sends, only these shapes get stored ----

function cleanCourse(c, id) {
  return {
    id,
    title: str(c.title, 200).trim() || "Untitled course",
    tier: COURSE_TIERS.includes(c.tier) ? c.tier : "free",
    level: str(c.level, 80),
    summary: str(c.summary, 600),
    description: str(c.description, 20000),
    icon: str(c.icon, 8),
    cover: safeUrl(c.cover),
    priceLabel: str(c.priceLabel, 60),
    // Paid access: the whole course for `price`, or single modules at their own price.
    price: Math.max(0, Math.round(num(c.price, 0) * 100) / 100),
    freeModules: Math.max(0, Math.trunc(num(c.freeModules, 0))),
    lessonCount: Math.max(0, Math.trunc(num(c.lessonCount, 0))),
    outline: list(c.outline, 40).map((x) => str(x, 200)).filter(Boolean),
    modules: list(c.modules, 40).map((m) => ({
      id: typeof m?.id === "string" && /^[a-z0-9-]{1,40}$/.test(m.id) ? m.id : "m-" + newId(),
      title: str(m?.title, 200),
      access: ["free", "paid"].includes(m?.access) ? m.access : "auto",
      price: Math.max(0, Math.round(num(m?.price, 0) * 100) / 100),
      lessons: list(m?.lessons, 100).map((l) => ({
        id: typeof l?.id === "string" && /^[a-z0-9-]{1,40}$/.test(l.id) ? l.id : newId(),
        title: str(l?.title, 200),
        type: LESSON_TYPES[l?.type] ? l.type : "article",
        duration: str(l?.duration, 40),
        url: safeUrl(l?.url),
        body: str(l?.body, 50000),
        preview: bool(l?.preview),
      })),
    })),
    published: bool(c.published),
    updatedAt: Date.now(),
  };
}

function cleanEvent(e, id) {
  const capacity = Math.max(0, Math.trunc(num(e.capacity, 0)));
  return {
    id,
    title: str(e.title, 200).trim() || "Untitled event",
    category: EVENT_CATEGORIES[e.category] ? e.category : "tech-talk",
    mode: EVENT_MODES[e.mode] ? e.mode : "online",
    start: str(e.start, 40),
    end: str(e.end, 40),
    venue: str(e.venue, 300),
    summary: str(e.summary, 600),
    description: str(e.description, 20000),
    cover: safeUrl(e.cover),
    speakers: list(e.speakers, 12).map((s) => ({ name: str(s?.name, 120), role: str(s?.role, 160), photo: safeUrl(s?.photo) })).filter((s) => s.name),
    agenda: list(e.agenda, 40).map((a) => ({ time: str(a?.time, 40), title: str(a?.title, 300) })).filter((a) => a.title),
    tags: list(e.tags, 12).map((t) => str(t, 40).trim()).filter(Boolean),
    priceLabel: str(e.priceLabel, 60),
    capacity,
    registration: ["form", "external", "none"].includes(e.registration) ? e.registration : "form",
    registerUrl: safeUrl(e.registerUrl),
    joinUrl: safeUrl(e.joinUrl),
    recordingUrl: safeUrl(e.recordingUrl),
    featured: bool(e.featured),
    published: bool(e.published),
    updatedAt: Date.now(),
  };
}

function cleanFaq(f, id) {
  return { id, q: str(f.q, 500).trim(), a: str(f.a, 5000), published: f.published !== false, updatedAt: Date.now() };
}

const CLEAN = { courses: cleanCourse, events: cleanEvent, faqs: cleanFaq };

function cleanSettings(s) {
  const a = s?.announcement || {};
  return {
    topbar: str(s?.topbar, 200),
    contactEmail: str(s?.contactEmail, 200),
    announcement: { active: bool(a.active), text: str(a.text, 300), link: safeUrl(a.link), linkLabel: str(a.linkLabel, 60) },
  };
}

// ---- Collections ----

async function readCol(store, col) {
  const saved = await store.get("col:" + col);
  return Array.isArray(saved) ? saved : structuredClone(DEFAULTS[col]);
}
const writeCol = (store, col, items) => store.set("col:" + col, items);

/**
 * Strips paid lesson content the viewer can't open. A module is open when it
 * is free (free course, marked free, or within the free-module count), when
 * the viewer bought the course or that module, or holds an access code for
 * the course. Preview lessons are always open.
 */
function publicCourse(c, unlocks) {
  const all = c.tier === "free" || unlocks.all;
  return {
    ...c,
    unlocked: all,
    modules: c.modules.map((m, i) => {
      const free = moduleIsFree(c, i);
      const open = all || free || unlocks.modules.has(m.id);
      return {
        ...m,
        free,
        unlocked: open,
        lessons: m.lessons.map((l) => (open || l.preview ? l : { id: l.id, title: l.title, type: l.type, duration: l.duration, preview: false, locked: true })),
      };
    }),
  };
}

// ---- Practice problems ----
// The built-in problems live on the server (src/lib/server/practice.js).
// "col:problems" holds what the admin adds, plus edited copies of built-in
// problems (same id) and "hidden" markers. Premium problems are only sent
// to accounts that unlocked practice.

const DIFFICULTIES = ["Easy", "Medium", "Hard", "Advanced"];
const LANGS = ["python", "javascript", "java", "c", "cpp"];
const ident = (v) => (/^[A-Za-z_$][\w$]{0,40}$/.test(String(v || "")) ? String(v) : "solve");
const small = (v) => {
  try {
    const t = JSON.stringify(v);
    return t !== undefined && t.length <= 20000;
  } catch {
    return false;
  }
};
const ioCases = (v) => list(v, 20).map((c) => ({ input: str(c?.input, 20000), output: str(c?.output, 20000) }));

function cleanProblem(p, id) {
  const kind = p?.kind === "stdio" ? "stdio" : "function";
  const base = {
    id,
    title: str(p?.title, 200).trim() || "Untitled problem",
    difficulty: DIFFICULTIES.includes(p?.difficulty) ? p.difficulty : "Easy",
    topic: str(p?.topic, 80).trim() || "General",
    book: str(p?.book, 40).trim(),
    year: Math.min(4, Math.max(1, Math.trunc(num(p?.year, 1)))),
    kind,
    description: str(p?.description, 20000),
    builtIn: bool(p?.builtIn),
    hidden: bool(p?.hidden),
    published: p?.published !== false,
    access: ["free", "premium"].includes(p?.access) ? p.access : "auto",
    hints: list(p?.hints, 10).map((h) => str(h, 1000).trim()).filter(Boolean),
    solution: { code: str(p?.solution?.code, 20000), explanation: str(p?.solution?.explanation, 5000) },
    solutionMode: ["show", "solved", "premium", "hide"].includes(p?.solutionMode) ? p.solutionMode : "default",
    inputFormat: str(p?.inputFormat, 3000),
    outputFormat: str(p?.outputFormat, 3000),
    constraints: str(p?.constraints, 3000),
    updatedAt: Date.now(),
  };
  if (kind === "function") {
    return {
      ...base,
      fn: ident(p?.fn),
      params: str(p?.params, 200).replace(/[^\w$, ]/g, ""),
      tests: list(p?.tests, 30)
        .filter((t) => Array.isArray(t?.args) && small(t.args) && small(t.expected ?? null))
        .map((t) => ({ args: t.args, expected: t.expected ?? null })),
      ll: list(p?.ll, 4).map((x) => Math.trunc(num(x, -1))).filter((x) => x >= 0),
      out: bool(p?.out),
    };
  }
  const starter = {};
  for (const l of LANGS) if (typeof p?.starter?.[l] === "string" && p.starter[l].trim()) starter[l] = str(p.starter[l], 20000);
  const languages = list(p?.languages, 5).filter((l) => LANGS.includes(l));
  return { ...base, samples: ioCases(p?.samples), cases: ioCases(p?.cases), languages: languages.length ? languages : LANGS, starter };
}

/** The problem as students see it: hidden test cases removed, solution and hints only when allowed. */
function publicProblem(p, vis) {
  const { cases, solution, hints, seq: _s, ...rest } = p;
  const out = { ...rest, hints: vis.hints ? hints || [] : [], hintCount: (hints || []).length, solution: vis.solution && solution?.code ? solution : null, hasSolution: Boolean(solution?.code), solutionMode: vis.solutionMode, hintMode: vis.hintMode };
  if (p.kind === "stdio") out.caseCount = (cases || []).length;
  return out;
}

async function practicePlan(store, request) {
  const [user, access] = await Promise.all([readUser(request, store), readAccess(store)]);
  const pick = (id) => ({ enabled: access[id].enabled, paid: access[id].paid, price: access[id].price, days: access[id].days });
  return { user, access, plan: { practice: pick("practice"), allAccess: pick("allAccess") }, unlocked: practiceUnlocked(user, access), signedIn: Boolean(user) };
}

const normOut = (s) =>
  String(s ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""))
    .join("\n")
    .replace(/\n+$/, "");

function courseSummary(c) {
  const lessons = c.modules.reduce((n, m) => n + m.lessons.length, 0);
  const { modules: _m, description: _d, ...rest } = c;
  return { ...rest, lessons, moduleCount: c.modules.length };
}

async function eventView(store, e, admin) {
  const regs = e.registration === "form" ? (await store.list(`reg:${e.id}:`)).length : 0;
  // The join link is only handed out with a registration (or to the admin).
  const { joinUrl, ...rest } = e;
  return {
    ...rest,
    ...(admin ? { joinUrl } : {}),
    hasJoinLink: Boolean(joinUrl),
    registered: regs,
    spotsLeft: e.capacity ? Math.max(0, e.capacity - regs) : null,
  };
}

// ---- Premium tokens ----

const enc = new TextEncoder();
const b64url = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
const fromB64url = (s) => atob(s.replace(/-/g, "+").replace(/_/g, "/"));

async function hmac(env, data) {
  const key = await crypto.subtle.importKey("raw", enc.encode("anobyt-premium:" + env.ADMIN_PASSWORD), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

async function makeToken(env, code) {
  const payload = b64url(enc.encode(JSON.stringify({ c: code, t: Date.now() })));
  return `${payload}.${await hmac(env, payload)}`;
}

const codeUsable = (rec) => rec && rec.active && (!rec.expiresAt || rec.expiresAt > Date.now());
const codeCovers = (rec, courseId) => rec.scope === "all" || (Array.isArray(rec.scope) && rec.scope.includes(courseId));

/** Returns the live access-code record behind a token, or null. */
async function readToken(request, store, env) {
  const token = request.headers.get("x-premium-token") || "";
  if (!env.ADMIN_PASSWORD || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  if (sig !== (await hmac(env, payload))) return null;
  try {
    const { c } = JSON.parse(fromB64url(payload));
    const rec = await store.get("code:" + c);
    return codeUsable(rec) ? rec : null;
  } catch {
    return null;
  }
}

const normCode = (c) =>
  String(c || "")
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 32);
function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return "AB-" + [...bytes].map((b) => chars[b % chars.length]).join("");
}

// ---- Router ----

/**
 * Routes /api/content/*, /api/events/*, /api/leads*, /api/codes*, /api/problems*, /api/practice* and /api/premium/*.
 */
export async function handleContentApi(request, store, env, compile = handleCompile) {
  const url = new URL(request.url);
  const parts = url.pathname.replace(/\/+$/, "").split("/").filter(Boolean).slice(1); // drop "api"
  const method = request.method;
  const admin = adminState(request, env);
  const deny = () => needAdmin(admin);
  const { body, error } = await readBody(request);
  if (error) return error;

  try {
    const [area, a, b] = parts;

    // ---------- /api/content ----------
    if (area === "content") {
      if (a === "settings") {
        if (method === "GET") return json({ settings: { ...DEFAULT_SETTINGS, ...((await store.get("settings")) || {}) } });
        if (method === "PUT") {
          if (!admin.ok) return deny();
          const settings = cleanSettings(body);
          await store.set("settings", settings);
          return json({ settings });
        }
        return fail(405, "Method not allowed.");
      }
      if (!COLLECTIONS.includes(a)) return fail(404, "Not found.");
      const items = await readCol(store, a);

      if (!b) {
        if (method === "GET") {
          if (url.searchParams.get("all") === "1") {
            if (!admin.ok) return deny();
            return json({ items });
          }
          const pub = items.filter((x) => x.published);
          if (a === "courses") return json({ items: pub.map(courseSummary) });
          if (a === "events") return json({ items: await Promise.all(pub.map((e) => eventView(store, e, false))) });
          return json({ items: pub });
        }
        if (method === "POST") {
          if (!admin.ok) return deny();
          if (items.length >= MAX_ITEMS) return fail(400, "Too many items. Delete some first.");
          let id = slug(body?.title || body?.q) || newId();
          if (items.some((x) => x.id === id)) id = `${id}-${newId().slice(-4)}`;
          const item = CLEAN[a](body || {}, id);
          await writeCol(store, a, [...items, item]);
          return json({ item }, 201);
        }
        if (method === "PUT" && Array.isArray(body?.order)) {
          // Reorder: body.order is the list of ids in their new order.
          if (!admin.ok) return deny();
          const rank = new Map(body.order.map((id, i) => [id, i]));
          const sorted = [...items].sort((x, y) => (rank.get(x.id) ?? 1e9) - (rank.get(y.id) ?? 1e9));
          await writeCol(store, a, sorted);
          return json({ items: sorted });
        }
        return fail(405, "Method not allowed.");
      }

      const idx = items.findIndex((x) => x.id === b);
      const item = items[idx];
      if (method === "GET") {
        if (!item || (!item.published && !admin.ok)) return fail(404, "Not found.");
        if (admin.ok && url.searchParams.get("full") === "1") return json({ item });
        if (a === "courses") {
          const [rec, user, access] = await Promise.all([readToken(request, store, env), readUser(request, store), readAccess(store)]);
          const unlocks = courseUnlocks(user, item.id, access);
          if (rec && codeCovers(rec, item.id)) unlocks.all = true;
          return json({ item: publicCourse(item, unlocks), signedIn: Boolean(user) });
        }
        if (a === "events") return json({ item: await eventView(store, item, false) });
        return json({ item });
      }
      if (!admin.ok) return deny();
      if (!item) return fail(404, "Not found.");
      if (method === "PUT") {
        const next = CLEAN[a](body || {}, b);
        const copy = [...items];
        copy[idx] = next;
        await writeCol(store, a, copy);
        return json({ item: next });
      }
      if (method === "DELETE") {
        await writeCol(store, a, items.filter((x) => x.id !== b));
        if (a === "events") await Promise.all((await store.list(`reg:${b}:`)).map((k) => store.delete(k)));
        return json({ ok: true });
      }
      return fail(405, "Method not allowed.");
    }

    // ---------- /api/events/:id/register, /api/events/:id/registrations ----------
    if (area === "events" && a) {
      const events = await readCol(store, "events");
      const ev = events.find((x) => x.id === a);
      if (b === "register" && method === "POST") {
        if (!ev || !ev.published) return fail(404, "Event not found.");
        if (ev.registration !== "form") return fail(400, "This event does not take registrations here.");
        if (body?.website) return json({ ok: true }); // honeypot: bots fill hidden fields
        const name = str(body?.name, 120).trim();
        const email = str(body?.email, 200).trim();
        const phone = str(body?.phone, 30).trim();
        if (!name || !/^\S+@\S+\.\S+$/.test(email)) return fail(400, "Enter your name and a valid email.");
        const keys = await store.list(`reg:${a}:`);
        if (keys.length >= MAX_REGS) return fail(400, "Registrations are closed.");
        if (ev.capacity && keys.length >= ev.capacity) return fail(400, "Sorry, this event is full.");
        const existing = await Promise.all(keys.map((k) => store.get(k)));
        const already = existing.some((r) => r && r.email.toLowerCase() === email.toLowerCase());
        if (!already) {
          const rec = { id: newId(), name, email, phone, college: str(body?.college, 200), year: str(body?.year, 40), createdAt: Date.now() };
          await store.set(`reg:${a}:${rec.createdAt}-${rec.id}`, rec);
        }
        return json({ ok: true, already, joinUrl: ev.joinUrl || "" });
      }
      if (b === "registrations" && method === "GET") {
        if (!admin.ok) return deny();
        const keys = await store.list(`reg:${a}:`);
        const regs = (await Promise.all(keys.map((k) => store.get(k)))).filter(Boolean).sort((x, y) => y.createdAt - x.createdAt);
        return json({ registrations: regs });
      }
      return fail(404, "Not found.");
    }

    // ---------- /api/leads ----------
    if (area === "leads") {
      if (!a && method === "POST") {
        if (body?.website) return json({ ok: true });
        const kind = LEAD_KINDS.includes(body?.kind) ? body.kind : "contact";
        const keys = await store.list("lead:");
        if (keys.length >= MAX_LEADS) return fail(503, "Inbox is full.");
        const data = {};
        for (const [k, v] of Object.entries(body?.data || {}).slice(0, 20)) data[str(k, 40)] = str(String(v ?? ""), 1000);
        const lead = {
          id: `${Date.now()}-${newId().slice(-6)}`,
          kind,
          name: str(body?.name, 120).trim(),
          phone: str(body?.phone, 30).trim(),
          email: str(body?.email, 200).trim(),
          data,
          status: "new",
          createdAt: Date.now(),
        };
        if (!lead.name && !lead.phone && !lead.email) return fail(400, "Add a name, phone or email.");
        await store.set("lead:" + lead.id, lead);
        return json({ ok: true }, 201);
      }
      if (!admin.ok) return deny();
      if (!a && method === "GET") {
        const keys = await store.list("lead:");
        const leads = (await Promise.all(keys.map((k) => store.get(k)))).filter(Boolean).sort((x, y) => y.createdAt - x.createdAt);
        return json({ leads });
      }
      const key = "lead:" + a;
      const lead = await store.get(key);
      if (!lead) return fail(404, "Not found.");
      if (method === "PUT") {
        const next = { ...lead, status: body?.status === "done" ? "done" : "new", note: str(body?.note ?? lead.note, 2000) };
        await store.set(key, next);
        return json({ lead: next });
      }
      if (method === "DELETE") {
        await store.delete(key);
        return json({ ok: true });
      }
      return fail(405, "Method not allowed.");
    }

    // ---------- /api/codes (admin) ----------
    if (area === "codes") {
      if (!admin.ok) return deny();
      if (!a && method === "GET") {
        const keys = await store.list("code:");
        const codes = (await Promise.all(keys.map((k) => store.get(k)))).filter(Boolean).sort((x, y) => y.createdAt - x.createdAt);
        return json({ codes });
      }
      if (!a && method === "POST") {
        const code = normCode(body?.code) || randomCode();
        if (code.length < 4) return fail(400, "Codes need at least 4 letters or digits.");
        if (await store.get("code:" + code)) return fail(400, "That code already exists.");
        const scope = Array.isArray(body?.scope) ? body.scope.map((x) => str(x, 60)).slice(0, 50) : "all";
        const rec = {
          code,
          label: str(body?.label, 200),
          scope: Array.isArray(scope) && !scope.length ? "all" : scope,
          expiresAt: body?.expiresAt ? Math.max(0, num(new Date(body.expiresAt).getTime(), 0)) : 0,
          maxUses: Math.max(0, Math.trunc(num(body?.maxUses, 0))),
          uses: 0,
          active: true,
          createdAt: Date.now(),
        };
        await store.set("code:" + code, rec);
        return json({ code: rec }, 201);
      }
      const key = "code:" + normCode(a);
      const rec = await store.get(key);
      if (!rec) return fail(404, "Code not found.");
      if (method === "PUT") {
        const next = { ...rec, active: body?.active !== undefined ? bool(body.active) : rec.active, label: body?.label !== undefined ? str(body.label, 200) : rec.label };
        await store.set(key, next);
        return json({ code: next });
      }
      if (method === "DELETE") {
        await store.delete(key);
        return json({ ok: true });
      }
      return fail(405, "Method not allowed.");
    }

    // ---------- /api/practice ----------
    if (area === "practice") {
      if (a === "settings") {
        if (!admin.ok) return deny();
        if (method === "GET") return json({ practice: await readPractice(store) });
        if (method === "PUT") {
          const practice = cleanPractice(body);
          await store.set("practice", practice);
          return json({ practice });
        }
        return fail(405, "Method not allowed.");
      }
      if (a === "order") {
        if (!admin.ok) return deny();
        if (method !== "PUT") return fail(405, "Method not allowed.");
        const year = Math.trunc(num(body?.year, 0));
        if (!YEARS.includes(year)) return fail(400, "Pick a year from 1 to 4.");
        const ids = list(body?.ids, 5000).map((x) => str(x, 80)).filter(Boolean);
        const order = (await store.get("practice:order")) || {};
        await store.set("practice:order", { ...order, [year]: ids });
        return json({ ok: true });
      }
      if (method !== "GET") return fail(405, "Method not allowed.");
      const [bank, practice, ctx] = await Promise.all([loadBank(store), readPractice(store), practicePlan(store, request)]);
      const { plan, unlocked, signedIn } = ctx;
      if (!a) {
        const access = accessMap(bank, practice);
        const years = YEARS.map((y) => {
          const l = bank.filter((p) => p.year === y);
          return { ...yearInfo(y, practice), total: l.length, free: l.filter((p) => access.get(p.id) === "free").length, topics: new Set(l.map((p) => p.topic)).size, solutions: SOLUTION_LABELS[practice.years[y].solutions] };
        });
        const out = { years, plan, unlocked, signedIn, freePercent: practice.freePercent };
        if (url.searchParams.get("index") === "1") out.index = bank.map((p) => ({ id: p.id, title: p.title, difficulty: p.difficulty, year: p.year, topic: p.topic }));
        return json(out);
      }
      const year = Number(a);
      if (!YEARS.includes(year)) return fail(404, "Not found.");
      const l = bank.filter((p) => p.year === year);
      const access = accessForYear(l, practice, year);
      const cfg = practice.years[year];
      return json({
        ...yearInfo(year, practice),
        rules: { solutions: cfg.solutions, hints: cfg.hints, solutionsLabel: SOLUTION_LABELS[cfg.solutions] },
        problems: l.map((p) => listRow(p, access.get(p.id), access.get(p.id) === "premium" && !unlocked)),
        plan,
        unlocked,
        signedIn,
      });
    }

    // ---------- /api/problems ----------
    if (area === "problems") {
      const saved = await store.get("col:problems");
      const items = Array.isArray(saved) ? saved : [];
      if (!a) {
        if (method === "GET") {
          if (url.searchParams.get("all") === "1") {
            if (!admin.ok) return deny();
            const [bank, practice, order] = await Promise.all([loadBank(store, { includeHidden: true }), readPractice(store), store.get("practice:order")]);
            const access = accessMap(bank.filter((p) => p.published !== false && !p.hidden), practice);
            return json({ items: bank.map((p) => ({ ...p, computedAccess: access.get(p.id) || "hidden" })), practice, order: order || {}, books: ALL_BOOKS });
          }
          const bank = await loadBank(store);
          return json({ items: bank.map((p) => listRow(p, "", false)) });
        }
        if (method === "POST") {
          if (!admin.ok) return deny();
          if (items.length >= 2000) return fail(400, "Too many problems. Delete some first.");
          let id = slug(body?.title) || newId();
          const bank = await loadBank(store, { includeHidden: true });
          if (bank.some((x) => x.id === id)) id = `${id}-${newId().slice(-4)}`;
          const item = cleanProblem(body || {}, id);
          await store.set("col:problems", [...items, item]);
          return json({ item }, 201);
        }
        return fail(405, "Method not allowed.");
      }
      if (!/^[a-z0-9-]{1,60}$/.test(a)) return fail(404, "Problem not found.");
      const idx = items.findIndex((x) => x.id === a);

      // Students: the problem (or a locked notice) and the stdio judge.
      if (method === "GET" || (b === "judge" && method === "POST")) {
        if (method === "GET" && b) return fail(404, "Not found.");
        if (method === "GET" && admin.ok && url.searchParams.get("full") === "1") {
          const p = (await loadBank(store, { includeHidden: true })).find((x) => x.id === a);
          return p ? json({ item: p }) : fail(404, "Problem not found.");
        }
        const [bank, practice, ctx] = await Promise.all([loadBank(store), readPractice(store), practicePlan(store, request)]);
        const p = bank.find((x) => x.id === a);
        if (!p) return fail(404, "Problem not found.");
        const yearList = bank.filter((x) => x.year === p.year);
        const access = accessForYear(yearList, practice, p.year).get(p.id);
        const locked = access === "premium" && !ctx.unlocked;
        if (locked) {
          if (method === "POST") return fail(403, "This is a premium problem. Unlock premium practice to solve it.");
          return json({ locked: true, item: { ...listRow(p, access, true), teaser: String(p.description || "").slice(0, 220) }, plan: ctx.plan, signedIn: ctx.signedIn, yearFree: yearList.length ? [...accessForYear(yearList, practice, p.year).values()].filter((v) => v === "free").length : 0 });
        }
        if (method === "GET") {
          const solved = Boolean(ctx.user?.progress?.solved?.includes(p.id));
          const premium = ctx.unlocked && ctx.access.practice?.enabled !== false && ctx.signedIn;
          const vis = visibility(p, practice, { premium, solved });
          const pos = yearList.findIndex((x) => x.id === p.id);
          const near = (i) => (yearList[i] ? { id: yearList[i].id, title: yearList[i].title } : null);
          return json({ locked: false, item: { ...publicProblem(p, vis), access }, prev: near(pos - 1), next: near(pos + 1), signedIn: ctx.signedIn, unlocked: ctx.unlocked, plan: ctx.plan });
        }
        if (p.kind !== "stdio") return fail(400, "This problem is checked in your browser.");
        if (!p.languages.includes(body?.language)) return fail(400, "That language isn't allowed for this problem.");
        const code = str(body?.code, 100000);
        if (!code.trim()) return fail(400, "Write some code first.");
        const runner = await readRunner(store);
        const all = [...p.samples.map((t) => ({ ...t, sample: true })), ...(body?.samplesOnly ? [] : p.cases.map((t) => ({ ...t, sample: false })))];
        const ran = await mapLimit(all, 6, async (t) => {
          const r = await compile({ language: body.language, code, stdin: t.input }, runner);
          const out = r.body || {};
          const pass = r.statusCode < 400 && !out.error && out.status !== "ERROR" && normOut(out.stdout) === normOut(t.output);
          const error = out.error || (pass ? "" : String(out.stderr || "").slice(0, 1500));
          return t.sample ? { sample: true, input: t.input, expected: t.output, got: String(out.stdout ?? "").slice(0, 5000), pass, error } : { sample: false, pass, error: error ? error.slice(0, 300) : "" };
        });
        return json({ results: ran, passed: ran.filter((r) => r.pass).length, total: ran.length });
      }
      if (b) return fail(404, "Not found.");
      if (!admin.ok) return deny();
      if (method === "PUT") {
        // Upsert, so editing a built-in problem saves a copy that replaces it.
        const next = cleanProblem(body || {}, a);
        const copy = [...items];
        if (idx >= 0) copy[idx] = next;
        else copy.push(next);
        await store.set("col:problems", copy);
        return json({ item: next });
      }
      if (method === "DELETE") {
        await store.set("col:problems", items.filter((x) => x.id !== a));
        return json({ ok: true });
      }
      return fail(405, "Method not allowed.");
    }

    // ---------- /api/premium ----------
    if (area === "premium") {
      if (!env.ADMIN_PASSWORD) return fail(503, "Premium access is not set up yet.");
      if (a === "redeem" && method === "POST") {
        const code = normCode(body?.code);
        const rec = code ? await store.get("code:" + code) : null;
        if (!codeUsable(rec)) return fail(400, "That code isn't valid or has expired.");
        if (rec.maxUses && rec.uses >= rec.maxUses) return fail(400, "That code has already been used the maximum number of times.");
        await store.set("code:" + code, { ...rec, uses: rec.uses + 1, lastUsedAt: Date.now() });
        return json({ token: await makeToken(env, code), scope: rec.scope, label: rec.label });
      }
      if (a === "me" && method === "GET") {
        const rec = await readToken(request, store, env);
        return rec ? json({ active: true, scope: rec.scope, label: rec.label, expiresAt: rec.expiresAt }) : json({ active: false });
      }
      return fail(404, "Not found.");
    }

    return fail(404, "Not found.");
  } catch (err) {
    console.error(err);
    return fail(500, "Something went wrong on the server. Please try again.");
  }
}
