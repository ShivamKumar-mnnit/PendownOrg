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

import { adminState, fail, json, needAdmin, newId, num, readBody, str } from "./http.js";
import { COURSE_TIERS, DEFAULTS, DEFAULT_SETTINGS, EVENT_CATEGORIES, EVENT_MODES, LESSON_TYPES } from "../content/defaults.js";

const COLLECTIONS = ["courses", "events", "faqs"];
const MAX_ITEMS = 300;
const MAX_LEADS = 5000;
const MAX_REGS = 5000;
const LEAD_KINDS = ["booking", "college", "premium", "contact"];

const bool = (v) => v === true || v === "true";
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
    lessonCount: Math.max(0, Math.trunc(num(c.lessonCount, 0))),
    outline: list(c.outline, 40).map((x) => str(x, 200)).filter(Boolean),
    modules: list(c.modules, 40).map((m) => ({
      title: str(m?.title, 200),
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

/** Strips premium lesson content unless the course is free, the lesson is a preview, or access is granted. */
function publicCourse(c, unlocked) {
  const open = c.tier === "free" || unlocked;
  return {
    ...c,
    unlocked: open,
    modules: c.modules.map((m) => ({
      ...m,
      lessons: m.lessons.map((l) => (open || l.preview ? l : { id: l.id, title: l.title, type: l.type, duration: l.duration, preview: false, locked: true })),
    })),
  };
}

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
 * Routes /api/content/*, /api/events/*, /api/leads*, /api/codes* and /api/premium/*.
 */
export async function handleContentApi(request, store, env) {
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
          const rec = await readToken(request, store, env);
          return json({ item: publicCourse(item, Boolean(rec && codeCovers(rec, item.id))) });
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
