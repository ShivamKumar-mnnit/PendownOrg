// CodeVita crash course: question bank, judge, submissions and scorecards.
//
//   /api/cv/home                     hub summary, plan prices, my progress
//   /api/cv/problems                 the question bank (rows, free/premium, solved)
//   /api/cv/problems/:id             one problem (statement, samples; editorial when allowed)
//   /api/cv/run                      run code on custom input or on the samples
//   /api/cv/submit                   start a submission (code is frozen here)
//   /api/cv/submissions/:sid/judge   judge the next batch of test cases
//   /api/cv/submissions/:sid         a submission and its scorecard
//   /api/cv/me                       my submissions and progress
//   /api/cv/admin/*                  admin only (x-admin-key = ADMIN_PASSWORD)
//
// Two stores: `store` ("anobyt-codevita") holds the bank overrides, hidden test
// cases, submissions and progress; `content` ("anobyt-content") holds accounts,
// prices, courses and the backup runner, shared with the rest of the site.
//
//   cv:settings        free share, linked course, time factors, probe on/off
//   cv:bank            problems the admin added or edited (no hidden cases)
//   cv:cases:<id>      hidden test cases of an added/edited problem
//   cv:order           custom order of problem ids
//   cv:stats           { <problem id>: { attempts, solvers } }
//   cv:sub:<sid>       one submission (code, per-case results, scorecard)
//   cv:u:<user id>     a student's progress and recent submissions
//   cv:recent          the latest 1000 submissions (admin view)
//
// Hidden test cases never leave the server. Each judge call runs at most
// BATCH cases, so a submission never runs into the function time limit.

import { CV_BUILTIN } from "../codevita/bank.js";
import { CV_LANGS, DEFAULT_POINTS, DIFFICULTIES, DISCLAIMER, TOPICS, improvementAreas, overallStatus, performanceLevel } from "../codevita/common.js";
import { readProbe, withProbe } from "../codevita/probe.js";
import { explainResult } from "../compiler.js";
import { handleCompile } from "../compileHandler.js";
import { adminState, bool, fail, json, mapLimit, needAdmin, newId, num, readBody, str } from "./http.js";
import { cleanAccess, courseUnlocks, hasFeature, readAccess, readRunner, readUser } from "./auth.js";
import { activeAttempt, learnAdminApi, learnApi, loadLessons, loadMocks, problemsInActiveMocks, promoFrom, recordMockResult } from "./codevitaLearn.js";

const BATCH = 3;
const MAX_CODE = 64_000;
const MAX_STDIN = 64_000;
const MAX_CASE = 1_000_000;
const MAX_CASES = 60;
const MAX_PROBLEMS = 3000;
const HARD_TIMEOUT_MS = 7000;

export const DEFAULT_CV_SETTINGS = {
  freePercent: 15,
  courseId: "",
  factors: { c: 1, cpp: 1, java: 2, python: 3 },
  probe: true,
  intro: "",
  announcement: "",
  visible: true,
  cardTitle: "TCS CodeVita Crash Course",
  cardSummary: "Lessons on every CodeVita topic, CodeVita-style problems with hidden tests, detailed solutions in C++, Java and Python, mock tests and scorecards.",
  promo: {
    enabled: true,
    headline: "🚀 TCS CodeVita Preparation Starts Here!",
    text: "Prepare for TCS CodeVita with CodeVita-style problems, realistic coding practice, detailed solutions, mock tests and performance tracking.",
    priceText: "Get Complete Access for Just {price}!",
    cta: "Explore Crash Course",
    later: "Maybe Later",
    delaySec: 3,
  },
};

const list = (v, max = 50) => (Array.isArray(v) ? v.slice(0, max) : []);
const words = (v, max = 12, len = 60) =>
  (Array.isArray(v) ? v : String(v || "").split(","))
    .map((x) => str(String(x), len).trim())
    .filter(Boolean)
    .slice(0, max);
const slug = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 56);
const normOut = (s) =>
  String(s ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""))
    .join("\n")
    .replace(/\n+$/, "");

export function cleanSettings(s) {
  const f = s?.factors || {};
  const factor = (l) => Math.min(10, Math.max(0.5, num(f[l], DEFAULT_CV_SETTINGS.factors[l])));
  return {
    freePercent: Math.min(100, Math.max(0, Math.round(num(s?.freePercent, DEFAULT_CV_SETTINGS.freePercent)))),
    courseId: str(s?.courseId, 60).trim(),
    factors: { c: factor("c"), cpp: factor("cpp"), java: factor("java"), python: factor("python") },
    probe: s?.probe === undefined ? true : bool(s.probe),
    intro: str(s?.intro, 4000),
    announcement: str(s?.announcement, 400),
    visible: s?.visible === undefined ? true : bool(s.visible),
    cardTitle: str(s?.cardTitle, 120).trim() || DEFAULT_CV_SETTINGS.cardTitle,
    cardSummary: str(s?.cardSummary, 400).trim() || DEFAULT_CV_SETTINGS.cardSummary,
    promo: cleanPromo(s?.promo),
  };
}

function cleanPromo(p) {
  const d = DEFAULT_CV_SETTINGS.promo;
  const t = (v, max, def) => str(v, max).trim() || def;
  return {
    enabled: p?.enabled === undefined ? d.enabled : bool(p.enabled),
    headline: t(p?.headline, 140, d.headline),
    text: t(p?.text, 400, d.text),
    priceText: t(p?.priceText, 140, d.priceText),
    cta: t(p?.cta, 40, d.cta),
    later: t(p?.later, 40, d.later),
    delaySec: Math.min(60, Math.max(0, Math.round(num(p?.delaySec, d.delaySec)))),
  };
}
const readSettings = async (store) => cleanSettings((await store.get("cv:settings")) || {});

// ---- Problems ----

const ioCase = (c, max = MAX_CASE) => ({ input: str(c?.input, max), output: str(c?.output, max) });

/** Whatever the admin (or a bulk upload) sends, only this shape is stored. */
export function cleanProblem(p, id) {
  const difficulty = DIFFICULTIES.includes(p?.difficulty) ? p.difficulty : "Medium";
  const ed = p?.editorial || {};
  const sol = p?.solutions || {};
  return {
    id,
    title: str(p?.title, 160).trim() || "Untitled problem",
    difficulty,
    topics: words(p?.topics, 6),
    patterns: words(p?.patterns, 6),
    companies: words(p?.companies, 8),
    season: str(p?.season, 20).trim(),
    source: p?.source === "pyq" ? "pyq" : "original",
    summary: str(p?.summary, 300),
    statement: str(p?.statement, 30000),
    inputFormat: str(p?.inputFormat, 5000),
    outputFormat: str(p?.outputFormat, 5000),
    constraints: str(p?.constraints, 5000),
    samples: list(p?.samples, 6).map((c) => ({ ...ioCase(c, 20000), explanation: str(c?.explanation, 4000) })),
    timeLimit: Math.min(10, Math.max(0.5, num(p?.timeLimit, 1))),
    memoryLimit: Math.min(1024, Math.max(32, Math.trunc(num(p?.memoryLimit, 256)))),
    points: Math.min(1000, Math.max(10, Math.trunc(num(p?.points, DEFAULT_POINTS[difficulty])))),
    access: ["free", "premium"].includes(p?.access) ? p.access : "auto",
    published: p?.published !== false,
    hidden: bool(p?.hidden),
    builtIn: bool(p?.builtIn),
    hints: list(p?.hints, 6).map((h) => str(h, 1500).trim()).filter(Boolean),
    editorial: {
      idea: str(ed.idea, 8000),
      brute: str(ed.brute, 8000),
      better: str(ed.better, 8000),
      optimal: str(ed.optimal, 12000),
      dryRun: str(ed.dryRun, 8000),
      mistakes: str(ed.mistakes, 5000),
      edgeCases: str(ed.edgeCases, 5000),
    },
    complexity: { time: str(p?.complexity?.time, 80), space: str(p?.complexity?.space, 80) },
    solutions: Object.fromEntries(CV_LANGS.filter((l) => typeof sol[l] === "string" && sol[l].trim()).map((l) => [l, str(sol[l], 30000)])),
    updatedAt: Date.now(),
  };
}

const cleanCases = (v) => list(v, MAX_CASES).map((c) => ioCase(c)).filter((c) => c.input !== "" || c.output !== "");

let builtCache = null;
function builtIns() {
  if (!builtCache) builtCache = CV_BUILTIN.map((p, i) => ({ ...cleanProblem(p, p.id), builtIn: true, seq: i, updatedAt: 0 }));
  return builtCache;
}
const builtInCases = new Map(CV_BUILTIN.map((p) => [p.id, p.cases || []]));

/** Every problem (built-in plus the admin's), in display order. */
async function loadBank(store, { includeHidden = false } = {}) {
  const [saved, order] = await Promise.all([store.get("cv:bank"), store.get("cv:order")]);
  const mine = Array.isArray(saved) ? saved : [];
  const byId = new Map(mine.map((p) => [p.id, p]));
  const out = builtIns().map((p) => (byId.has(p.id) ? { ...byId.get(p.id), builtIn: true, edited: true, seq: p.seq } : p));
  const ids = new Set(out.map((p) => p.id));
  mine.forEach((p, i) => !ids.has(p.id) && out.push({ ...p, seq: 10000 + i }));
  const rank = new Map((Array.isArray(order) ? order : []).map((id, i) => [id, i]));
  const dRank = (p) => DIFFICULTIES.indexOf(p.difficulty);
  out.sort((a, b) => (rank.get(a.id) ?? 1e9) - (rank.get(b.id) ?? 1e9) || dRank(a) - dRank(b) || a.seq - b.seq);
  return includeHidden ? out : out.filter((p) => p.published !== false && !p.hidden);
}

async function casesOf(store, p) {
  const own = await store.get("cv:cases:" + p.id);
  if (Array.isArray(own)) return own;
  return builtInCases.get(p.id) || [];
}

/**
 * Free or premium for every published problem. Problems the admin marked keep
 * that; the rest are free up to the free share (at least one), taking easier
 * problems first and spreading the free ones across topics.
 */
export function accessMap(bank, settings) {
  const out = new Map();
  const auto = [];
  let fixedFree = 0;
  for (const p of bank) {
    if (p.access === "free" || p.access === "premium") {
      out.set(p.id, p.access);
      if (p.access === "free") fixedFree++;
    } else auto.push(p);
  }
  const target = settings.freePercent > 0 ? Math.max(1, Math.ceil((bank.length * settings.freePercent) / 100)) : 0;
  let left = Math.max(0, Math.min(auto.length, target - fixedFree));
  const dRank = (p) => DIFFICULTIES.indexOf(p.difficulty);
  const pool = [...auto].sort((a, b) => dRank(a) - dRank(b));
  const perTopic = new Map();
  const picked = new Set();
  while (left > 0) {
    let best = null;
    let bestCount = Infinity;
    for (const p of pool) {
      if (picked.has(p.id)) continue;
      const c = perTopic.get(p.topics[0] || "") || 0;
      if (c < bestCount) {
        best = p;
        bestCount = c;
        if (c === 0) break;
      }
    }
    if (!best) break;
    picked.add(best.id);
    perTopic.set(best.topics[0] || "", bestCount + 1);
    left--;
  }
  for (const p of auto) out.set(p.id, picked.has(p.id) ? "free" : "premium");
  return out;
}

const row = (p, access, locked, mine, stats) => ({
  id: p.id,
  title: p.title,
  difficulty: p.difficulty,
  topics: p.topics,
  patterns: p.patterns,
  companies: p.companies,
  season: p.season,
  source: p.source,
  summary: p.summary,
  points: p.points,
  access,
  locked,
  solved: Boolean(mine?.problems?.[p.id]?.solved),
  attempted: Boolean(mine?.problems?.[p.id]),
  best: mine?.problems?.[p.id]?.bestScore || 0,
  solvers: stats?.[p.id]?.solvers || 0,
  attempts: stats?.[p.id]?.attempts || 0,
});

/** The problem as a student sees it: no hidden cases; the editorial and solutions only when allowed. */
function publicProblem(p, { full, caseCount }) {
  const { seq: _s, edited: _e, ...rest } = p;
  const out = { ...rest, caseCount, hasEditorial: Boolean(p.editorial?.optimal || p.editorial?.idea), solutionLangs: Object.keys(p.solutions || {}) };
  if (!full) {
    out.editorial = null;
    out.solutions = {};
  }
  return out;
}

// ---- Who can open what ----

async function context(request, store, content, env) {
  const [user, access, settings] = await Promise.all([readUser(request, content), readAccess(content), readSettings(store)]);
  const admin = adminState(request, env).ok;
  let premium = admin || !access.codevita?.enabled || hasFeature(user, "codevita", access);
  if (!premium && user && settings.courseId) premium = courseUnlocks(user, settings.courseId, access).all;
  return { user, access, settings, premium, admin };
}

async function planFor(ctx, content) {
  const pick = (id) => (ctx.access[id] ? { enabled: ctx.access[id].enabled, paid: ctx.access[id].paid, price: ctx.access[id].price, days: ctx.access[id].days } : null);
  let course = null;
  if (ctx.settings.courseId) {
    const courses = (await content.get("col:courses")) || [];
    const c = courses.find((x) => x.id === ctx.settings.courseId && x.published);
    if (c && c.tier === "premium" && c.price > 0) course = { id: c.id, title: c.title, price: c.price };
    else if (c) course = { id: c.id, title: c.title, price: 0 };
  }
  return { codevita: pick("codevita"), allAccess: pick("allAccess"), course };
}

// ---- Running code ----

const limitMs = (p, lang, settings) => Math.round(p.timeLimit * 1000 * (settings.factors[lang] || 1));

/**
 * Runs one input and returns { verdict, stdout, stderr, timeMs, memoryKb, exitCode }.
 * `expected` null means "just run" (custom input): the verdict is then AC when it ran.
 */
async function runOne({ language, code, input, expected, p, settings, runner, compile }) {
  const tl = limitMs(p, language, settings);
  const r = await compile({ language, code, stdin: input }, runner, {
    timeoutMs: Math.min(HARD_TIMEOUT_MS, tl + 3000),
    cpuLimitSec: Math.min(15, tl / 1000),
    memoryLimitKb: p.memoryLimit * 1024 * (language === "java" ? 2 : 1),
  });
  if (r.statusCode === 504) return { verdict: "TLE", stdout: "", stderr: "", timeMs: tl, exitCode: null, note: "Stopped after the time limit." };
  if (r.statusCode >= 500 || (r.statusCode >= 400 && !r.body?.stdout && !r.body?.stderr))
    return { verdict: "SE", stdout: "", stderr: "", error: r.body?.error || "The code runner is unavailable right now.", exitCode: null };
  const body = r.body || {};
  const probe = readProbe(body.stderr);
  const res = { ...body, stderr: probe.stderr };
  // Some runners mark any stderr output as an error; the probe's own line must not count.
  if (res.status !== "SUCCESS" && (res.exitCode === 0 || res.exitCode === undefined) && !probe.stderr.trim() && !body.error) res.status = "SUCCESS";
  const timeMs = probe.cpuMs ?? body.executionTimeMs;
  const memoryKb = body.memoryKb ?? probe.memoryKb;
  const ex = explainResult(res, language);
  const base = { stdout: String(res.stdout ?? "").slice(0, 20000), stderr: String(probe.stderr || "").slice(0, 4000), timeMs, memoryKb, exitCode: res.exitCode ?? null };
  if (ex.kind === "compile") return { ...base, verdict: "CE", note: ex.title + (ex.line ? ` on line ${ex.line}` : "") };
  if (ex.kind === "timeout") return { ...base, verdict: "TLE", timeMs: Math.max(timeMs || 0, tl) };
  if (ex.kind === "service") return { ...base, verdict: "SE", error: ex.detail };
  if (ex.kind !== "ok") return { ...base, verdict: "RE", note: ex.title };
  if (typeof timeMs === "number" && timeMs > tl) return { ...base, verdict: "TLE" };
  if (typeof memoryKb === "number" && memoryKb > p.memoryLimit * 1024 * (language === "java" ? 2 : 1)) return { ...base, verdict: "MLE" };
  if (expected === null) return { ...base, verdict: "AC" };
  return { ...base, verdict: normOut(res.stdout) === normOut(expected) ? "AC" : "WA" };
}

// ---- Submissions ----

function scorecard(sub, p, prior) {
  const cases = sub.cases.filter(Boolean);
  const total = sub.total;
  const passed = cases.filter((c) => c.verdict === "AC").length;
  const accuracy = total ? Math.round((passed / total) * 1000) / 10 : 0;
  const status = overallStatus(cases);
  const attemptNo = (prior?.attempts || 0) + 1;
  const times = cases.map((c) => c.timeMs).filter((x) => typeof x === "number");
  const mems = cases.map((c) => c.memoryKb).filter((x) => typeof x === "number");
  return {
    total,
    passed,
    failed: total - passed,
    accuracy,
    score: total ? Math.round((sub.points * passed) / total) : 0,
    maxScore: sub.points,
    status,
    level: performanceLevel({ accuracy, status, attemptNo }),
    attemptNo,
    timeMs: times.length ? Math.max(...times) : null,
    avgTimeMs: times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null,
    memoryKb: mems.length ? Math.max(...mems) : null,
    areas: improvementAreas({ cases, problem: { ...p, edgeCases: p.editorial?.edgeCases }, language: sub.language }),
    disclaimer: DISCLAIMER,
  };
}

/** The submission as its owner (or the admin) sees it: hidden inputs and outputs stay on the server. */
function publicSub(sub) {
  const { code, ...rest } = sub;
  return { ...rest, code, cases: sub.cases.map((c, i) => (c ? { i, ...c } : { i, pending: true, sample: i < sub.samples })) };
}

async function finalize(store, sub, p, user) {
  const uid = sub.uid;
  const mine = uid !== "admin" ? (await store.get("cv:u:" + uid)) || { problems: {}, subs: [] } : null;
  const prior = mine?.problems?.[sub.pid];
  sub.result = scorecard(sub, p, prior);
  sub.status = "done";
  sub.finishedAt = Date.now();
  await store.set("cv:sub:" + sub.id, sub);
  if (!mine) return sub;

  const r = sub.result;
  const solved = r.status === "Accepted";
  const firstSolve = solved && !prior?.solved;
  mine.problems = mine.problems || {};
  mine.problems[sub.pid] = {
    attempts: (prior?.attempts || 0) + 1,
    bestScore: Math.max(prior?.bestScore || 0, r.score),
    bestAccuracy: Math.max(prior?.bestAccuracy || 0, r.accuracy),
    solved: Boolean(prior?.solved || solved),
    solvedAt: prior?.solvedAt || (solved ? sub.finishedAt : 0),
    lastAt: sub.finishedAt,
    lastStatus: r.status,
    difficulty: p.difficulty,
    topics: p.topics,
  };
  const summary = { id: sub.id, pid: sub.pid, title: sub.title, difficulty: p.difficulty, language: sub.language, status: r.status, score: r.score, maxScore: r.maxScore, accuracy: r.accuracy, at: sub.finishedAt, elapsedSec: sub.elapsedSec, ...(sub.mock ? { mock: sub.mock } : {}) };
  mine.subs = [summary, ...(mine.subs || [])].slice(0, 300);
  if (sub.mock) recordMockResult(mine, sub);
  mine.name = user?.name || mine.name || "";
  mine.email = user?.email || mine.email || "";
  await store.set("cv:u:" + uid, mine);

  // Counters and the admin feed are read-modify-write: a rare lost update under heavy load is acceptable here.
  const stats = (await store.get("cv:stats")) || {};
  const s = stats[sub.pid] || { attempts: 0, solvers: 0 };
  stats[sub.pid] = { attempts: s.attempts + 1, solvers: s.solvers + (firstSolve ? 1 : 0) };
  const recent = (await store.get("cv:recent")) || [];
  await Promise.all([store.set("cv:stats", stats), store.set("cv:recent", [{ ...summary, uid, name: mine.name, email: mine.email }, ...recent].slice(0, 1000))]);
  return sub;
}

// ---- Router ----

export async function handleCodevitaApi(request, store, content, env, compile = handleCompile) {
  const url = new URL(request.url);
  const parts = url.pathname.replace(/\/+$/, "").split("/").filter(Boolean).slice(2); // drop "api", "cv"
  const method = request.method;
  const { body, error } = await readBody(request);
  if (error) return error;
  const [area, a, b] = parts;

  try {
    if (area === "admin") return await adminApi({ request, store, content, env, method, parts: parts.slice(1), body, compile, url });

    // The launch popup and the course card: cheap, no sign-in needed, called on every page of the site.
    if (area === "promo" && method === "GET") {
      const [settings, access] = await Promise.all([readSettings(store), readAccess(content)]);
      return json(promoFrom(settings, access));
    }

    const ctx = await context(request, store, content, env);
    if (!ctx.settings.visible && !ctx.admin) return fail(404, "The CodeVita crash course isn't open yet. Please check back soon.");
    const mine = ctx.user ? await store.get("cv:u:" + ctx.user.id) : null;

    const learned = await learnApi({ area, a, b, method, body, ctx, store, mine, deps: { loadBank, accessMap, row } });
    if (learned) return learned;

    // ---------- hub ----------
    if (area === "home" && method === "GET") {
      const [bank, stats] = await Promise.all([loadBank(store), store.get("cv:stats")]);
      const acc = accessMap(bank, ctx.settings);
      const count = (f) => bank.filter(f).length;
      const solved = Object.entries(mine?.problems || {}).filter(([, v]) => v.solved);
      const firstFree = bank.find((p) => acc.get(p.id) === "free");
      return json({
        totals: {
          problems: bank.length,
          free: count((p) => acc.get(p.id) === "free"),
          byDifficulty: Object.fromEntries(DIFFICULTIES.map((d) => [d, count((p) => p.difficulty === d)])),
          topics: [...new Set(bank.flatMap((p) => p.topics))].sort((x, y) => TOPICS.indexOf(x) - TOPICS.indexOf(y)),
          solvers: Object.values(stats || {}).reduce((n, s) => n + (s.solvers || 0), 0),
        },
        me: ctx.user
          ? {
              name: ctx.user.name,
              solved: solved.length,
              attempted: Object.keys(mine?.problems || {}).length,
              score: Object.values(mine?.problems || {}).reduce((n, v) => n + (v.bestScore || 0), 0),
              recent: (mine?.subs || []).slice(0, 5),
            }
          : null,
        premium: ctx.premium,
        signedIn: Boolean(ctx.user),
        plan: await planFor(ctx, content),
        settings: { intro: ctx.settings.intro, announcement: ctx.settings.announcement, courseId: ctx.settings.courseId },
        offer: promoFrom(ctx.settings, ctx.access),
        learn: await (async () => {
          const ls = await loadLessons(store);
          const done = mine?.lessons || {};
          return { total: ls.length, free: ls.filter((l) => l.access === "free").length, done: ls.filter((l) => done[l.id]).length };
        })(),
        mocks: (await loadMocks(store)).length,
        startHere: firstFree ? { id: firstFree.id, title: firstFree.title } : null,
        disclaimer: DISCLAIMER,
      });
    }

    if (area === "problems" && !a && method === "GET") {
      const [bank, stats] = await Promise.all([loadBank(store), store.get("cv:stats")]);
      const acc = accessMap(bank, ctx.settings);
      return json({ items: bank.map((p) => row(p, acc.get(p.id), acc.get(p.id) === "premium" && !ctx.premium, mine, stats)), premium: ctx.premium, signedIn: Boolean(ctx.user) });
    }

    if (area === "problems" && a && !b && method === "GET") {
      const bank = await loadBank(store, { includeHidden: ctx.admin });
      const p = bank.find((x) => x.id === a);
      if (!p) return fail(404, "Problem not found.");
      const acc = accessMap(bank.filter((x) => x.published !== false && !x.hidden), ctx.settings).get(p.id) || "premium";
      const locked = acc === "premium" && !ctx.premium;
      const i = bank.indexOf(p);
      const near = (q) => (q ? { id: q.id, title: q.title } : null);
      if (locked)
        return json({
          locked: true,
          item: { ...row(p, acc, true, mine, null), teaser: String(p.statement || "").slice(0, 260) },
          plan: await planFor(ctx, content),
          signedIn: Boolean(ctx.user),
          prev: near(bank[i - 1]),
          next: near(bank[i + 1]),
        });
      const cases = await casesOf(store, p);
      // During a mock test the editorial, solutions and hints stay hidden, as in the real round.
      const inMock = problemsInActiveMocks(mine).has(p.id);
      const item = { ...publicProblem(p, { full: (ctx.premium || acc === "free") && !inMock, caseCount: cases.length }), access: acc };
      if (inMock) Object.assign(item, { hints: [], hasEditorial: false, solutionLangs: [], inMock: true });
      return json({
        locked: false,
        item,
        mine: mine?.problems?.[p.id] || null,
        premium: ctx.premium,
        signedIn: Boolean(ctx.user),
        plan: ctx.premium ? null : await planFor(ctx, content),
        prev: near(bank[i - 1]),
        next: near(bank[i + 1]),
        user: ctx.user ? { name: ctx.user.name, id: ctx.user.id } : null,
      });
    }

    // Shared checks for run and submit.
    async function openProblem(id) {
      const bank = await loadBank(store, { includeHidden: ctx.admin });
      const p = bank.find((x) => x.id === id);
      if (!p) return { err: fail(404, "Problem not found.") };
      const acc = accessMap(bank.filter((x) => x.published !== false && !x.hidden), ctx.settings).get(p.id) || "premium";
      if (acc === "premium" && !ctx.premium) return { err: fail(403, "This is a premium problem. Unlock the Complete TCS CodeVita Crash Course to solve it.") };
      if (!CV_LANGS.includes(body?.language)) return { err: fail(400, "Pick C, C++, Java or Python.") };
      const code = str(body?.code, MAX_CODE + 1);
      if (!code.trim()) return { err: fail(400, "Write some code first.") };
      if (code.length > MAX_CODE) return { err: fail(413, "Your code is too long (64 KB at most).") };
      return { p, code };
    }

    // ---------- run (custom input or samples) ----------
    if (area === "run" && method === "POST") {
      const { p, code, err } = await openProblem(str(body?.id, 80));
      if (err) return err;
      const runner = await readRunner(content).catch(() => null);
      const run = (input, expected) =>
        runOne({ language: body.language, code: ctx.settings.probe ? withProbe(body.language, code) : code, input, expected, p, settings: ctx.settings, runner, compile });
      if (body?.mode === "samples") {
        const results = await mapLimit(p.samples, 3, async (s) => ({ input: s.input, expected: s.output, ...(await run(s.input, s.output)) }));
        return json({ mode: "samples", results, passed: results.filter((r) => r.verdict === "AC").length, total: results.length, limitMs: limitMs(p, body.language, ctx.settings) });
      }
      const stdin = str(body?.stdin, MAX_STDIN);
      return json({ mode: "custom", result: await run(stdin, null), limitMs: limitMs(p, body.language, ctx.settings) });
    }

    // ---------- submit ----------
    if (area === "submit" && method === "POST") {
      const validate = ctx.admin && bool(body?.validate);
      if (!ctx.user && !validate) return fail(401, "Sign in to submit. Your scorecard and progress are saved to your account.");
      const { p, code, err } = await openProblem(str(body?.id, 80));
      if (err) return err;
      if (mine?.lastSubmitAt && Date.now() - mine.lastSubmitAt < 5000 && !validate) return fail(429, "Please wait a few seconds between submissions.");
      let mock = null;
      if (body?.mock && !validate) {
        const mid = str(body.mock, 80);
        const att = activeAttempt(mine, mid);
        if (!att) return fail(409, "This mock test has ended. Open its report to see your result.");
        if (!(att.pids || []).includes(p.id)) return fail(400, "This problem is not part of the mock test.");
        mock = { mock: mid, attempt: att.id };
      }
      const cases = await casesOf(store, p);
      const total = p.samples.length + cases.length;
      if (!total) return fail(400, "This problem has no test cases yet.");
      const sub = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        uid: validate ? "admin" : ctx.user.id,
        name: validate ? "Admin check" : ctx.user.name || "",
        email: validate ? "" : ctx.user.email || "",
        pid: p.id,
        title: p.title,
        difficulty: p.difficulty,
        topics: p.topics,
        points: p.points,
        language: body.language,
        code,
        elapsedSec: Math.max(0, Math.min(86400, Math.trunc(num(body?.elapsedSec, 0)))),
        timed: Math.max(0, Math.min(600, Math.trunc(num(body?.timedMinutes, 0)))),
        limitMs: limitMs(p, body.language, ctx.settings),
        samples: p.samples.length,
        total,
        cases: Array(total).fill(null),
        status: "judging",
        createdAt: Date.now(),
        ...(mock || {}),
      };
      await store.set("cv:sub:" + sub.id, sub);
      if (ctx.user && !validate) await store.set("cv:u:" + ctx.user.id, { problems: {}, subs: [], ...(mine || {}), lastSubmitAt: Date.now() });
      return json({ id: sub.id, total, batch: BATCH, batches: Math.ceil(total / BATCH) }, 201);
    }

    // ---------- submissions ----------
    if (area === "submissions" && a) {
      if (!/^[a-z0-9]{6,30}$/.test(a)) return fail(404, "Submission not found.");
      const sub = await store.get("cv:sub:" + a);
      if (!sub) return fail(404, "Submission not found.");
      const own = ctx.admin || (ctx.user && sub.uid === ctx.user.id);
      if (!own) return fail(ctx.user ? 403 : 401, "Sign in with the account that made this submission.");

      if (b === "judge" && method === "POST") {
        if (sub.status === "done") return json({ submission: publicSub(sub), done: true });
        const bank = await loadBank(store, { includeHidden: true });
        const p = bank.find((x) => x.id === sub.pid);
        if (!p) return fail(404, "This problem was removed.");
        const hidden = await casesOf(store, p);
        const all = [...p.samples.map((c) => ({ ...c, sample: true })), ...hidden.map((c) => ({ ...c, sample: false }))].slice(0, sub.total);
        const todo = [];
        for (let i = 0; i < sub.total && todo.length < BATCH; i++) if (!sub.cases[i]) todo.push(i);
        const runner = await readRunner(content).catch(() => null);
        const code = ctx.settings.probe ? withProbe(sub.language, sub.code) : sub.code;
        const ran = await mapLimit(todo, BATCH, async (i) => {
          const t = all[i] || { input: "", output: "" };
          const r = await runOne({ language: sub.language, code, input: t.input, expected: t.output, p, settings: ctx.settings, runner, compile });
          const out = { sample: i < sub.samples, verdict: r.verdict, timeMs: r.timeMs ?? null, memoryKb: r.memoryKb ?? null, note: r.note || r.error || "" };
          if (i < sub.samples) Object.assign(out, { input: t.input.slice(0, 4000), expected: t.output.slice(0, 4000), got: r.stdout.slice(0, 4000), stderr: r.stderr.slice(0, 2000) });
          else if (r.verdict === "CE" || r.verdict === "RE") out.stderr = r.stderr.slice(0, 1500);
          return [i, out];
        });
        for (const [i, out] of ran) sub.cases[i] = out;
        // A compile error is the same on every test, so the rest don't need to run.
        const ce = ran.find(([, o]) => o.verdict === "CE");
        if (ce) for (let i = 0; i < sub.total; i++) if (!sub.cases[i]) sub.cases[i] = { sample: i < sub.samples, verdict: "CE", timeMs: null, memoryKb: null, note: ce[1].note };
        const done = sub.cases.every(Boolean);
        if (done) await finalize(store, sub, p, ctx.user);
        else await store.set("cv:sub:" + sub.id, sub);
        return json({ submission: publicSub(sub), done });
      }
      if (!b && method === "GET") {
        // Recommended next: unsolved problems on the same topics, one level up when this one was solved.
        const bank = await loadBank(store);
        const acc = accessMap(bank, ctx.settings);
        const owner = sub.uid === ctx.user?.id ? mine : await store.get("cv:u:" + sub.uid);
        const solved = (pid) => owner?.problems?.[pid]?.solved;
        const up = sub.result?.status === "Accepted" ? 1 : 0;
        const want = DIFFICULTIES[Math.min(2, DIFFICULTIES.indexOf(sub.difficulty) + up)];
        const score = (q) => (q.topics.some((t) => sub.topics?.includes(t)) ? 2 : 0) + (q.difficulty === want ? 1 : 0) + (acc.get(q.id) === "free" || ctx.premium ? 0.5 : 0);
        const next = bank
          .filter((q) => q.id !== sub.pid && !solved(q.id))
          .map((q) => ({ q, s: score(q) }))
          .filter((x) => x.s >= 2)
          .sort((x, y) => y.s - x.s)
          .slice(0, 3)
          .map(({ q }) => ({ id: q.id, title: q.title, difficulty: q.difficulty, topics: q.topics, locked: acc.get(q.id) === "premium" && !ctx.premium }));
        return json({ submission: publicSub(sub), student: { name: sub.name, id: sub.uid }, next });
      }
      return fail(404, "Not found.");
    }

    if (area === "me" && method === "GET") {
      if (!ctx.user) return fail(401, "Sign in to see your submissions.");
      const pid = url.searchParams.get("problem");
      const subs = (mine?.subs || []).filter((s) => !pid || s.pid === pid);
      return json({ subs: subs.slice(0, 100), problems: mine?.problems || {} });
    }

    return fail(404, "Not found.");
  } catch (err) {
    console.error(err);
    return fail(500, "Something went wrong on the server. Please try again.");
  }
}

// ---- Admin ----

async function adminApi({ request, store, content, env, method, parts, body, url }) {
  const admin = adminState(request, env);
  if (!admin.ok) return needAdmin(admin);
  const [what, id] = parts;

  if (what === "bank" && method === "GET") {
    const [bank, settings, stats, order] = await Promise.all([loadBank(store, { includeHidden: true }), readSettings(store), store.get("cv:stats"), store.get("cv:order")]);
    const acc = accessMap(bank.filter((p) => p.published !== false && !p.hidden), settings);
    const caseCounts = await mapLimit(bank, 16, async (p) => (await casesOf(store, p)).length);
    const courses = ((await content.get("col:courses")) || []).map((c) => ({ id: c.id, title: c.title, tier: c.tier, price: c.price }));
    return json({
      items: bank.map((p, i) => {
        const { statement: _s, editorial: _e, solutions, ...rest } = p;
        return { ...rest, solutionLangs: Object.keys(solutions || {}), computedAccess: p.hidden || p.published === false ? "hidden" : acc.get(p.id), caseCount: caseCounts[i], stats: stats?.[p.id] || null };
      }),
      settings,
      order: order || [],
      courses,
      topics: TOPICS,
      price: (await readAccess(content)).codevita,
    });
  }

  const learnt = await learnAdminApi({ what, id, extra: parts[2], method, body, store });
  if (learnt) return learnt;

  // The crash course price lives with the other premium prices (Admin → Prices and features); this edits just its row.
  if (what === "price" && method === "PUT") {
    const access = await readAccess(content);
    const cur = access.codevita;
    const next = cleanAccess({
      ...access,
      codevita: { enabled: body?.enabled ?? cur.enabled, paid: body?.paid ?? cur.paid, price: body?.price ?? cur.price, days: body?.days ?? cur.days },
    });
    await content.set("access", next);
    return json({ price: next.codevita });
  }

  if (what === "settings" && method === "PUT") {
    const settings = cleanSettings({ ...(await readSettings(store)), ...body });
    await store.set("cv:settings", settings);
    return json({ settings });
  }

  if (what === "order" && method === "PUT") {
    const ids = list(body?.ids, MAX_PROBLEMS).map((x) => str(x, 80));
    await store.set("cv:order", ids);
    return json({ ok: true });
  }

  const saved = (await store.get("cv:bank")) || [];
  async function upsert(p, pid, cases) {
    const builtIn = builtIns().some((x) => x.id === pid);
    const item = { ...cleanProblem(p, pid), builtIn };
    const i = saved.findIndex((x) => x.id === pid);
    if (i >= 0) saved[i] = item;
    else saved.push(item);
    if (cases !== undefined) await store.set("cv:cases:" + pid, cleanCases(cases));
    return item;
  }

  if (what === "problems") {
    if (!id && method === "POST") {
      if (saved.length >= MAX_PROBLEMS) return fail(400, "Too many problems. Delete some first.");
      const bank = await loadBank(store, { includeHidden: true });
      let pid = slug(body?.id || body?.title) || newId();
      if (bank.some((x) => x.id === pid)) pid = `${pid}-${newId().slice(-4)}`;
      const item = await upsert(body || {}, pid, body?.cases || []);
      await store.set("cv:bank", saved);
      return json({ item }, 201);
    }
    if (!id || !/^[a-z0-9-]{1,80}$/.test(id)) return fail(404, "Problem not found.");
    if (method === "GET") {
      const p = (await loadBank(store, { includeHidden: true })).find((x) => x.id === id);
      if (!p) return fail(404, "Problem not found.");
      return json({ item: { ...p, cases: await casesOf(store, p) } });
    }
    if (method === "PUT") {
      const item = await upsert(body || {}, id, Array.isArray(body?.cases) ? body.cases : undefined);
      await store.set("cv:bank", saved);
      return json({ item });
    }
    if (method === "DELETE") {
      // A built-in problem can't be removed from the code, so deleting it hides it. Restore = delete the hidden copy.
      const builtIn = builtIns().find((x) => x.id === id);
      const i = saved.findIndex((x) => x.id === id);
      if (builtIn && url.searchParams.get("restore") !== "1") {
        const base = i >= 0 ? saved[i] : builtIn;
        if (i >= 0) saved[i] = { ...base, hidden: true };
        else saved.push({ ...base, hidden: true });
      } else {
        if (i >= 0) saved.splice(i, 1);
        await store.delete("cv:cases:" + id);
      }
      await store.set("cv:bank", saved);
      return json({ ok: true });
    }
    return fail(405, "Method not allowed.");
  }

  // Bulk upload: { problems: [ {id?, title, ..., cases: [...]}, ... ] }. Same id = update.
  if (what === "bulk" && method === "POST") {
    const items = list(body?.problems, 500);
    if (!items.length) return fail(400, "No problems in the file.");
    const bank = await loadBank(store, { includeHidden: true });
    const known = new Set(bank.map((p) => p.id));
    let created = 0;
    let updated = 0;
    const errors = [];
    for (const [n, p] of items.entries()) {
      if (!p || typeof p !== "object" || !String(p.title || "").trim()) {
        errors.push(`Problem ${n + 1}: needs a title.`);
        continue;
      }
      if (!String(p.statement || "").trim()) {
        errors.push(`"${p.title}": needs a statement.`);
        continue;
      }
      const pid = slug(p.id || p.title) || newId();
      if (known.has(pid)) updated++;
      else created++;
      known.add(pid);
      await upsert(p, pid, Array.isArray(p.cases) ? p.cases : undefined);
    }
    if (saved.length > MAX_PROBLEMS) return fail(400, "That would go over the problem limit.");
    await store.set("cv:bank", saved);
    return json({ created, updated, errors });
  }

  if (what === "submissions" && method === "GET") {
    const recent = (await store.get("cv:recent")) || [];
    const pid = url.searchParams.get("problem") || "";
    const q = (url.searchParams.get("q") || "").toLowerCase();
    const rows = recent.filter((s) => (!pid || s.pid === pid) && (!q || `${s.name} ${s.email} ${s.title}`.toLowerCase().includes(q)));
    return json({ items: rows.slice(0, 500) });
  }

  if (what === "students" && id && method === "GET") {
    const mine = await store.get("cv:u:" + id);
    return mine ? json({ student: mine }) : fail(404, "No CodeVita activity for this student yet.");
  }

  // Checks the runner and the memory probe with a tiny program in each language.
  if (what === "runner-check" && method === "POST") {
    const runner = await readRunner(content).catch(() => null);
    const settings = await readSettings(store);
    const hello = {
      c: '#include <stdio.h>\nint main(void){int a,b;scanf("%d %d",&a,&b);printf("%d\\n",a+b);return 0;}',
      cpp: "#include <bits/stdc++.h>\nusing namespace std;\nint main(){int a,b;cin>>a>>b;cout<<a+b<<endl;}",
      java: "import java.util.*;\npublic class Main { public static void main(String[] x){ Scanner s=new Scanner(System.in); System.out.println(s.nextInt()+s.nextInt()); } }",
      python: "a, b = map(int, input().split())\nprint(a + b)",
    };
    const p = { timeLimit: 2, memoryLimit: 256 };
    const results = await mapLimit(CV_LANGS, 4, async (l) => {
      const r = await runOne({ language: l, code: settings.probe ? withProbe(l, hello[l]) : hello[l], input: "2 3\n", expected: "5", p, settings, runner, compile: handleCompile });
      return { language: l, verdict: r.verdict, timeMs: r.timeMs ?? null, memoryKb: r.memoryKb ?? null, note: r.note || r.error || r.stderr || "" };
    });
    return json({ results, probe: settings.probe });
  }

  return fail(404, "Not found.");
}
