// CodeVita crash course: lessons, mock tests and the launch popup.
// Called from codevita.js, which passes in the shared helpers.
//
// Blob keys (store "anobyt-codevita"):
//   cv:learn                 { [lessonId]: lesson | { hidden: true } }  admin edits over the built-in lessons
//   cv:mocks                 [mock]                                     the admin's mock list (built-ins until saved)
//   cv:mockboard:<mockId>    [{ uid, name, score, max, solved, timeSec, at }]  first finished attempt per student
// Per student (cv:u:<uid>): lessons { id: doneAt }, mocks { [mockId]: { current, history } }.

import { CV_LESSONS } from "../codevita/learn.js";
import { CV_MOCKS } from "../codevita/mocks.js";
import { bool, fail, json, num, str } from "./http.js";

const KINDS = ["guide", "topic", "pattern"];
const MAX_LESSON = 60_000;
const BOARD_SIZE = 200;

const words = (v, max = 12) =>
  (Array.isArray(v) ? v : String(v || "").split(","))
    .map((x) => str(String(x), 60).trim())
    .filter(Boolean)
    .slice(0, max);
const slug = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 56);

// ---------- Lessons ----------

export function cleanLesson(l, id) {
  return {
    id,
    kind: KINDS.includes(l?.kind) ? l.kind : "topic",
    title: str(l?.title, 140).trim() || "Untitled lesson",
    summary: str(l?.summary, 400).trim(),
    minutes: Math.min(240, Math.max(1, Math.round(num(l?.minutes, 10)))),
    access: l?.access === "free" ? "free" : "premium",
    topics: words(l?.topics, 6),
    order: Math.round(num(l?.order, 1000)),
    body: str(l?.body, MAX_LESSON),
  };
}

const builtInLessons = CV_LESSONS.map((l) => ({ ...cleanLesson(l, l.id), builtIn: true }));

/** Built-in lessons with the admin's edits, plus the admin's own lessons, in order. */
export async function loadLessons(store, { includeHidden = false } = {}) {
  const saved = (await store.get("cv:learn")) || {};
  const out = builtInLessons.map((l) => {
    const o = saved[l.id];
    if (!o) return l;
    if (o.hidden && !o.title) return { ...l, hidden: true };
    return { ...cleanLesson(o, l.id), builtIn: true, edited: true, hidden: Boolean(o.hidden) };
  });
  const ids = new Set(out.map((l) => l.id));
  for (const [id, o] of Object.entries(saved)) if (!ids.has(id) && o?.title) out.push({ ...cleanLesson(o, id), hidden: Boolean(o.hidden) });
  out.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  return includeHidden ? out : out.filter((l) => !l.hidden);
}

const lessonRow = (l, locked, done) => ({ id: l.id, kind: l.kind, title: l.title, summary: l.summary, minutes: l.minutes, access: l.access, topics: l.topics, locked, done: Boolean(done) });

// ---------- Mock tests ----------

export function cleanMock(m, id) {
  return {
    id,
    title: str(m?.title, 120).trim() || "Mock test",
    summary: str(m?.summary, 400).trim(),
    minutes: Math.min(600, Math.max(5, Math.round(num(m?.minutes, 90)))),
    access: m?.access === "free" ? "free" : "premium",
    problems: [...new Set(words(m?.problems, 12).map((x) => x.toLowerCase()))],
    hidden: bool(m?.hidden),
  };
}

export async function loadMocks(store, { includeHidden = false } = {}) {
  const saved = await store.get("cv:mocks");
  const list = (Array.isArray(saved) ? saved : CV_MOCKS).map((m) => cleanMock(m, slug(m.id) || "mock"));
  return includeHidden ? list : list.filter((m) => !m.hidden);
}

const scoreOf = (att) => Object.values(att?.problems || {}).reduce((n, p) => n + (p.score || 0), 0);
const solvedOf = (att) => Object.values(att?.problems || {}).filter((p) => p.status === "Accepted").length;

/** Closes an attempt whose time ran out. Returns true when it changed. */
function expire(entry, now = Date.now()) {
  const cur = entry?.current;
  if (cur && !cur.finishedAt && now >= cur.endsAt) {
    cur.finishedAt = cur.endsAt;
    return true;
  }
  return false;
}

/** The attempt that is running right now for this mock, or null. */
export function activeAttempt(mine, mockId, now = Date.now()) {
  const cur = mine?.mocks?.[mockId]?.current;
  return cur && !cur.finishedAt && now < cur.endsAt ? cur : null;
}

/** Problem ids in any mock the student is sitting right now (their editorials stay hidden). */
export function problemsInActiveMocks(mine, now = Date.now()) {
  const out = new Set();
  for (const e of Object.values(mine?.mocks || {})) {
    const cur = e?.current;
    if (cur && !cur.finishedAt && now < cur.endsAt) (cur.pids || []).forEach((p) => out.add(p));
  }
  return out;
}

/** Records a judged mock submission on the student's attempt (called from finalize, before mine is saved). */
export function recordMockResult(mine, sub) {
  const cur = mine?.mocks?.[sub.mock]?.current;
  if (!cur || cur.id !== sub.attempt || sub.createdAt > cur.endsAt) return;
  const prev = cur.problems?.[sub.pid];
  const r = sub.result;
  if (!prev || r.score > prev.score || (r.score === prev.score && r.status === "Accepted" && prev.status !== "Accepted")) {
    cur.problems = cur.problems || {};
    cur.problems[sub.pid] = { score: r.score, max: r.maxScore, status: r.status, accuracy: r.accuracy, subId: sub.id, at: sub.createdAt };
  }
}

async function finishAttempt(store, uid, name, mockId, mine, bankById) {
  const entry = mine.mocks[mockId];
  const cur = entry.current;
  const max = (cur.pids || []).reduce((n, pid) => n + (bankById.get(pid)?.points || 0), 0);
  const summary = { id: cur.id, startedAt: cur.startedAt, finishedAt: cur.finishedAt, score: scoreOf(cur), max, solved: solvedOf(cur), total: (cur.pids || []).length, timeSec: Math.round((cur.finishedAt - cur.startedAt) / 1000) };
  entry.history = [summary, ...(entry.history || []).filter((h) => h.id !== cur.id)].slice(0, 10);
  if (!entry.boarded) {
    entry.boarded = true;
    const key = "cv:mockboard:" + mockId;
    const board = (await store.get(key)) || [];
    if (!board.some((b) => b.uid === uid)) {
      board.push({ uid, name: name || "Student", score: summary.score, max, solved: summary.solved, timeSec: summary.timeSec, at: summary.finishedAt });
      board.sort((a, b) => b.score - a.score || a.timeSec - b.timeSec || a.at - b.at);
      await store.set(key, board.slice(0, BOARD_SIZE));
    }
  }
}

// ---------- Promo and course card ----------

export function promoFrom(settings, access) {
  const plan = access?.codevita || {};
  const price = plan.enabled && plan.paid ? plan.price : 0;
  const fill = (t) => String(t || "").replace(/\{price\}/g, price ? `₹${price}` : "free");
  const p = settings.promo;
  return {
    visible: settings.visible,
    courseId: settings.courseId || "",
    price,
    days: plan.days || 0,
    card: { title: settings.cardTitle, summary: settings.cardSummary },
    promo: { enabled: settings.visible && p.enabled, headline: fill(p.headline), text: fill(p.text), priceText: fill(p.priceText), cta: p.cta, later: p.later, delaySec: p.delaySec },
  };
}

// Leaderboards show "Priya S." rather than full names.
const shortName = (n) => {
  const w = String(n || "Student").trim().split(/\s+/);
  return w.length > 1 ? `${w[0]} ${w[w.length - 1][0].toUpperCase()}.` : w[0];
};

// ---------- Student routes ----------

/**
 * Handles /api/cv/learn/* and /api/cv/mocks/*. Returns null when the path is not one of these.
 * deps: { loadBank, accessMap, row }
 */
export async function learnApi({ area, a, b, method, body, ctx, store, mine, deps }) {
  const uid = ctx.user?.id;
  const saveMine = (doc) => store.set("cv:u:" + uid, doc);
  const blankMine = () => ({ problems: {}, subs: [], ...(mine || {}) });

  if (area === "learn") {
    const lessons = await loadLessons(store);
    const locked = (l) => l.access === "premium" && !ctx.premium;
    const done = mine?.lessons || {};
    if (!a && method === "GET") return json({ items: lessons.map((l) => lessonRow(l, locked(l), done[l.id])), premium: ctx.premium, signedIn: Boolean(ctx.user) });

    const i = lessons.findIndex((l) => l.id === a);
    if (i < 0) return fail(404, "Lesson not found.");
    const l = lessons[i];

    if (b === "done" && method === "POST") {
      if (!ctx.user) return fail(401, "Sign in to track your progress.");
      if (locked(l)) return fail(403, "This lesson is part of the premium course.");
      const doc = blankMine();
      doc.lessons = { ...(doc.lessons || {}) };
      if (bool(body?.done)) doc.lessons[l.id] = Date.now();
      else delete doc.lessons[l.id];
      await saveMine(doc);
      return json({ done: Boolean(doc.lessons[l.id]) });
    }

    if (!b && method === "GET") {
      const bank = await deps.loadBank(store);
      const acc = deps.accessMap(bank, ctx.settings);
      const practice = l.topics.length
        ? bank
            .filter((p) => p.topics.some((t) => l.topics.includes(t)))
            .slice(0, 12)
            .map((p) => deps.row(p, acc.get(p.id), acc.get(p.id) === "premium" && !ctx.premium, mine, null))
        : [];
      const near = (x) => (x ? { id: x.id, title: x.title, locked: locked(x) } : null);
      const lesson = locked(l) ? { ...lessonRow(l, true, false), teaser: l.body.replace(/[#>*`]/g, "").slice(0, 320) } : { ...lessonRow(l, false, done[l.id]), body: l.body };
      return json({ lesson, practice, prev: near(lessons[i - 1]), next: near(lessons[i + 1]), premium: ctx.premium, signedIn: Boolean(ctx.user) });
    }
    return fail(404, "Not found.");
  }

  if (area === "mocks") {
    const now = Date.now();
    const mocks = await loadMocks(store);
    const bank = await deps.loadBank(store);
    const byId = new Map(bank.map((p) => [p.id, p]));
    const locked = (m) => m.access === "premium" && !ctx.premium;
    const pidsOf = (m) => m.problems.filter((pid) => byId.has(pid));

    // Close any attempt whose clock ran out, so lists and reports are up to date.
    if (ctx.user && mine?.mocks) {
      let changed = false;
      for (const [mid, e] of Object.entries(mine.mocks))
        if (expire(e, now)) {
          await finishAttempt(store, uid, ctx.user.name, mid, mine, byId);
          changed = true;
        }
      if (changed) await saveMine(mine);
    }
    const stateOf = (m) => {
      const e = mine?.mocks?.[m.id];
      const cur = e?.current;
      if (cur && !cur.finishedAt) return { state: "active", endsAt: cur.endsAt, score: scoreOf(cur) };
      if (e?.history?.length) return { state: "finished", best: Math.max(...e.history.map((h) => h.score)), last: e.history[0] };
      return { state: "new" };
    };
    const card = (m) => {
      const pids = pidsOf(m);
      const mix = Object.fromEntries(["Easy", "Medium", "Hard"].map((d) => [d, pids.filter((p) => byId.get(p).difficulty === d).length]));
      return { id: m.id, title: m.title, summary: m.summary, minutes: m.minutes, access: m.access, locked: locked(m), count: pids.length, maxScore: pids.reduce((n, p) => n + byId.get(p).points, 0), mix, ...(ctx.user ? stateOf(m) : { state: "new" }) };
    };

    if (!a && method === "GET") return json({ items: mocks.map(card), premium: ctx.premium, signedIn: Boolean(ctx.user), now });

    const m = mocks.find((x) => x.id === a);
    if (!m) return fail(404, "Mock test not found.");
    const pids = pidsOf(m);

    if (b === "start" && method === "POST") {
      if (!ctx.user) return fail(401, "Sign in to take a mock test. Your report is saved to your account.");
      if (locked(m)) return fail(403, "This mock test is part of the premium course.");
      if (!pids.length) return fail(400, "This mock test has no problems yet.");
      const doc = blankMine();
      doc.mocks = doc.mocks || {};
      const e = (doc.mocks[m.id] = doc.mocks[m.id] || { history: [] });
      if (e.current && !e.current.finishedAt && now < e.current.endsAt) return json({ attempt: e.current, now });
      e.current = { id: now.toString(36) + Math.random().toString(36).slice(2, 6), startedAt: now, endsAt: now + m.minutes * 60000, pids, problems: {} };
      await saveMine(doc);
      return json({ attempt: e.current, now }, 201);
    }

    if (b === "finish" && method === "POST") {
      if (!ctx.user) return fail(401, "Sign in first.");
      const e = mine?.mocks?.[m.id];
      if (!e?.current || e.current.finishedAt) return fail(400, "This mock test is not running.");
      e.current.finishedAt = Math.min(now, e.current.endsAt);
      await finishAttempt(store, uid, ctx.user.name, m.id, mine, byId);
      await saveMine(mine);
      return json({ ok: true });
    }

    if (!b && method === "GET") {
      const info = card(m);
      const board = ((await store.get("cv:mockboard:" + m.id)) || []).map((r, i) => ({ rank: i + 1, name: shortName(r.name), score: r.score, max: r.max, solved: r.solved, timeSec: r.timeSec, me: r.uid === uid }));
      const e = mine?.mocks?.[m.id];
      const cur = e?.current || null;
      const showProblems = !info.locked && cur; // titles stay hidden until the student starts
      const problems = showProblems
        ? (cur.pids || pids).filter((pid) => byId.has(pid)).map((pid) => {
            const p = byId.get(pid);
            const r = cur.problems?.[pid];
            return { id: pid, title: p.title, difficulty: p.difficulty, topics: p.topics, points: p.points, score: r?.score || 0, status: r?.status || null, accuracy: r?.accuracy ?? null, subId: r?.subId || null };
          })
        : [];
      return json({
        mock: info,
        attempt: cur ? { id: cur.id, startedAt: cur.startedAt, endsAt: cur.endsAt, finishedAt: cur.finishedAt || null, score: scoreOf(cur), solved: solvedOf(cur) } : null,
        problems,
        history: e?.history || [],
        board: board.slice(0, 20),
        myRank: board.find((r) => r.me) || null,
        boardSize: board.length,
        signedIn: Boolean(ctx.user),
        premium: ctx.premium,
        now,
      });
    }
    return fail(404, "Not found.");
  }
  return null;
}

// ---------- Admin routes ----------

/** Handles /api/cv/admin/learn/* and /api/cv/admin/mocks/*. Returns null for other paths. */
export async function learnAdminApi({ what, id, extra, method, body, store }) {
  if (what === "learn") {
    const saved = (await store.get("cv:learn")) || {};
    const builtIds = new Set(builtInLessons.map((l) => l.id));
    if (!id && method === "GET") return json({ items: await loadLessons(store, { includeHidden: true }), kinds: KINDS });
    if (id && extra === "restore" && method === "POST") {
      delete saved[id];
      await store.set("cv:learn", saved);
      return json({ ok: true });
    }
    if (method === "PUT" || (method === "POST" && !id)) {
      const lid = id || slug(body?.id || body?.title);
      if (!lid) return fail(400, "Give the lesson a title.");
      if (!id && (builtIds.has(lid) || saved[lid])) return fail(409, "A lesson with this id already exists. Change the title or id.");
      saved[lid] = { ...cleanLesson(body, lid), hidden: bool(body?.hidden) };
      await store.set("cv:learn", saved);
      return json({ lesson: saved[lid] }, id ? 200 : 201);
    }
    if (id && method === "DELETE") {
      if (builtIds.has(id)) saved[id] = { ...(saved[id] || {}), hidden: true };
      else delete saved[id];
      await store.set("cv:learn", saved);
      return json({ ok: true });
    }
    return fail(404, "Not found.");
  }

  if (what === "mocks") {
    if (method === "GET") return json({ items: await loadMocks(store, { includeHidden: true }) });
    if (method === "PUT") {
      const items = (Array.isArray(body?.items) ? body.items : []).slice(0, 60).map((m) => cleanMock(m, slug(m.id || m.title) || "mock"));
      const ids = new Set();
      for (const m of items) {
        if (ids.has(m.id)) return fail(400, `Two mock tests share the id "${m.id}". Give each one a different title.`);
        ids.add(m.id);
      }
      await store.set("cv:mocks", items);
      return json({ items });
    }
    if (method === "DELETE") {
      await store.delete("cv:mocks");
      return json({ items: await loadMocks(store, { includeHidden: true }) });
    }
    return fail(404, "Not found.");
  }
  return null;
}
