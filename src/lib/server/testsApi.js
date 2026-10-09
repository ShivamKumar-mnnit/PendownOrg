// Server side of admin-created tests (MCQ, coding and Olympiad). Runs in the
// Netlify function `netlify/functions/tests.js` in production and in the
// Vite dev-server middleware locally, so both behave the same.
//
// Storage is injected (`store`), with get/set/delete/list over JSON values:
// Netlify Blobs in production, an in-memory map in local dev.
//
// Admin requests must send `x-admin-key` equal to the ADMIN_PASSWORD
// environment variable. Students never receive answers or hidden test
// cases; grading happens here.

import { handleCompile } from "../compileHandler.js";

export const TEST_TYPES = ["mcq", "coding", "olympiad"];
export const QUESTION_KINDS = ["single", "multi", "numeric", "coding"];
const LANGS = ["python", "javascript", "java", "c", "cpp"];
const MAX_TESTS = 500;
const MAX_QUESTIONS = 200;
const MAX_CASES = 15;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
const fail = (status, error) => json({ error }, status);

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function adminState(request, env) {
  const configured = typeof env.ADMIN_PASSWORD === "string" && env.ADMIN_PASSWORD.length > 0;
  const ok = configured && safeEqual(request.headers.get("x-admin-key") || "", env.ADMIN_PASSWORD);
  return { configured, ok };
}

const str = (v, max = 20000) => (typeof v === "string" ? v.slice(0, max) : "");
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/** Cleans an incoming test from the admin editor into the stored shape. */
export function sanitizeTest(input, id) {
  const type = TEST_TYPES.includes(input?.type) ? input.type : "mcq";
  const questions = (Array.isArray(input?.questions) ? input.questions : []).slice(0, MAX_QUESTIONS).map((q) => {
    const kind = QUESTION_KINDS.includes(q?.kind) ? q.kind : "single";
    const base = {
      kind,
      text: str(q.text),
      marks: Math.max(0, num(q.marks, 1)),
      negative: Math.max(0, num(q.negative, 0)),
      explanation: str(q.explanation, 5000),
    };
    if (kind === "single" || kind === "multi") {
      const options = (Array.isArray(q.options) ? q.options : []).slice(0, 8).map((o) => str(o, 2000));
      const correct = (Array.isArray(q.correct) ? q.correct : [q.correct])
        .map((x) => Math.trunc(num(x, -1)))
        .filter((x) => x >= 0 && x < options.length);
      return { ...base, options, correct: kind === "single" ? correct.slice(0, 1) : [...new Set(correct)].sort() };
    }
    if (kind === "numeric") {
      return { ...base, answer: num(q.answer, 0), tolerance: Math.max(0, num(q.tolerance, 0)) };
    }
    const cases = (list) =>
      (Array.isArray(list) ? list : []).slice(0, MAX_CASES).map((c) => ({ input: str(c?.input, 20000), output: str(c?.output, 20000) }));
    const languages = (Array.isArray(q.languages) ? q.languages : LANGS).filter((l) => LANGS.includes(l));
    return {
      ...base,
      negative: 0,
      languages: languages.length ? languages : LANGS,
      samples: cases(q.samples),
      cases: cases(q.cases),
    };
  });
  return {
    id,
    type,
    title: str(input?.title, 200).trim() || "Untitled test",
    description: str(input?.description, 5000),
    durationMin: Math.max(0, Math.min(600, Math.trunc(num(input?.durationMin, 30)))),
    published: Boolean(input?.published),
    shuffle: Boolean(input?.shuffle),
    showAnswers: input?.showAnswers !== false,
    questions,
    updatedAt: Date.now(),
  };
}

const totalMarks = (t) => t.questions.reduce((n, q) => n + q.marks, 0);

function summary(t) {
  return {
    id: t.id,
    type: t.type,
    title: t.title,
    description: t.description,
    durationMin: t.durationMin,
    published: t.published,
    questionCount: t.questions.length,
    totalMarks: totalMarks(t),
    updatedAt: t.updatedAt,
  };
}

/** The test as a student sees it: no answers, no hidden cases. */
export function publicTest(t) {
  return {
    ...summary(t),
    questions: t.questions.map((q) => {
      const out = { kind: q.kind, text: q.text, marks: q.marks, negative: q.negative };
      if (q.kind === "single" || q.kind === "multi") out.options = q.options;
      if (q.kind === "coding") {
        out.languages = q.languages;
        out.samples = q.samples;
        out.caseCount = q.cases.length;
      }
      return out;
    }),
  };
}

export const normalizeOutput = (s) =>
  String(s ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""))
    .join("\n")
    .replace(/\n+$/, "");

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}

/**
 * Grades one submission. `answers[i]` is: an option index (single), an
 * array of indexes (multi), a number (numeric), or { language, code } (coding).
 */
export async function gradeSubmission(test, answers, compile = handleCompile) {
  // Collect every coding test case first so they all run in parallel.
  const jobs = [];
  test.questions.forEach((q, i) => {
    if (q.kind !== "coding") return;
    const a = answers?.[i];
    if (!a || typeof a.code !== "string" || !a.code.trim() || !q.languages.includes(a.language)) return;
    const list = q.cases.length ? q.cases : q.samples;
    list.forEach((c, j) => jobs.push({ i, j, language: a.language, code: a.code, input: c.input, output: c.output }));
  });
  const ran = await mapLimit(jobs, 8, async (job) => {
    const r = await compile({ language: job.language, code: job.code, stdin: job.input });
    const out = r.body || {};
    const passed = r.statusCode < 400 && !out.error && normalizeOutput(out.stdout) === normalizeOutput(job.output);
    return { ...job, passed, error: out.error || (out.stderr ? String(out.stderr).slice(0, 500) : "") };
  });

  let score = 0;
  const results = test.questions.map((q, i) => {
    const a = answers?.[i];
    const r = { kind: q.kind, marks: q.marks, earned: 0, answered: a !== undefined && a !== null && a !== "" };
    if (q.kind === "single" || q.kind === "multi") {
      const picked = q.kind === "single" ? (Number.isInteger(a) ? [a] : []) : Array.isArray(a) ? [...new Set(a.map(Number))].sort() : [];
      r.answered = picked.length > 0;
      r.correct = r.answered && JSON.stringify(picked) === JSON.stringify(q.correct);
      r.earned = r.correct ? q.marks : r.answered ? -q.negative : 0;
      if (test.showAnswers) r.answer = q.correct;
    } else if (q.kind === "numeric") {
      r.answered = a !== undefined && a !== null && a !== "" && Number.isFinite(Number(a));
      r.correct = r.answered && Math.abs(Number(a) - q.answer) <= q.tolerance;
      r.earned = r.correct ? q.marks : r.answered ? -q.negative : 0;
      if (test.showAnswers) r.answer = q.answer;
    } else {
      const mine = ran.filter((x) => x.i === i);
      const total = (q.cases.length ? q.cases : q.samples).length;
      const passed = mine.filter((x) => x.passed).length;
      r.answered = mine.length > 0;
      r.casesPassed = passed;
      r.casesTotal = total;
      r.correct = total > 0 && passed === total;
      // Partial credit: marks in proportion to the test cases passed.
      r.earned = total ? Math.round((q.marks * passed * 100) / total) / 100 : 0;
      const firstError = mine.find((x) => !x.passed && x.error);
      if (firstError) r.error = firstError.error;
    }
    if (test.showAnswers && q.explanation) r.explanation = q.explanation;
    score += r.earned;
    return r;
  });
  return { score: Math.round(score * 100) / 100, total: totalMarks(test), results };
}

async function listTests(store) {
  const keys = await store.list("test:");
  const tests = await Promise.all(keys.map((k) => store.get(k)));
  return tests.filter(Boolean).sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Routes /api/tests[...] and /api/admin/login.
 * @param {Request} request
 * @param {{ get(k): Promise<any>, set(k, v): Promise<void>, delete(k): Promise<void>, list(prefix): Promise<string[]> }} store
 * @param {Record<string, string|undefined>} env
 */
export async function handleTestsApi(request, store, env, compile = handleCompile) {
  const url = new URL(request.url);
  const parts = url.pathname.replace(/\/+$/, "").split("/").filter(Boolean); // ["api", "tests", id?, action?]
  const method = request.method;
  const admin = adminState(request, env);
  const needAdmin = () =>
    admin.configured ? fail(401, "Wrong admin password.") : fail(503, "Admin password is not set up. Add ADMIN_PASSWORD in Netlify environment variables.");

  let body = null;
  if (method === "POST" || method === "PUT") {
    try {
      const raw = await request.text();
      body = raw ? JSON.parse(raw) : {};
    } catch {
      return fail(400, "Invalid JSON body.");
    }
  }

  try {
    if (parts[1] === "admin" && parts[2] === "login" && method === "POST") {
      return admin.ok ? json({ ok: true }) : needAdmin();
    }
    if (parts[1] !== "tests") return fail(404, "Not found.");
    const id = parts[2];
    const action = parts[3];

    if (!id) {
      if (method === "GET") {
        const all = await listTests(store);
        if (url.searchParams.get("all") === "1") {
          if (!admin.ok) return needAdmin();
          return json({ tests: all });
        }
        return json({ tests: all.filter((t) => t.published).map(summary) });
      }
      if (method === "POST") {
        if (!admin.ok) return needAdmin();
        if ((await store.list("test:")).length >= MAX_TESTS) return fail(400, "Too many tests. Delete some first.");
        const test = sanitizeTest(body, newId());
        await store.set("test:" + test.id, test);
        return json({ test }, 201);
      }
      return fail(405, "Method not allowed.");
    }

    if (!/^[a-z0-9]{4,40}$/.test(id)) return fail(404, "Test not found.");
    const test = await store.get("test:" + id);

    if (!action) {
      if (method === "GET") {
        if (!test || (!test.published && !admin.ok)) return fail(404, "Test not found.");
        return json({ test: admin.ok && url.searchParams.get("full") === "1" ? test : publicTest(test) });
      }
      if (method === "PUT") {
        if (!admin.ok) return needAdmin();
        if (!test) return fail(404, "Test not found.");
        const next = sanitizeTest(body, id);
        await store.set("test:" + id, next);
        return json({ test: next });
      }
      if (method === "DELETE") {
        if (!admin.ok) return needAdmin();
        await store.delete("test:" + id);
        const subs = await store.list(`sub:${id}:`);
        await Promise.all(subs.map((k) => store.delete(k)));
        return json({ ok: true });
      }
      return fail(405, "Method not allowed.");
    }

    if (action === "submit" && method === "POST") {
      if (!test || !test.published) return fail(404, "Test not found.");
      const name = str(body?.name, 120).trim();
      const email = str(body?.email, 200).trim();
      if (!name) return fail(400, "Enter your name before submitting.");
      const graded = await gradeSubmission(test, body?.answers || {}, compile);
      const record = {
        id: newId(),
        testId: id,
        name,
        email,
        score: graded.score,
        total: graded.total,
        timeTakenSec: Math.max(0, Math.trunc(num(body?.timeTakenSec, 0))),
        submittedAt: Date.now(),
        results: graded.results.map((r) => ({ earned: r.earned, correct: r.correct, casesPassed: r.casesPassed, casesTotal: r.casesTotal })),
      };
      await store.set(`sub:${id}:${record.submittedAt}-${record.id}`, record);
      return json(graded);
    }

    if (action === "results" && method === "GET") {
      if (!admin.ok) return needAdmin();
      const keys = await store.list(`sub:${id}:`);
      const subs = (await Promise.all(keys.map((k) => store.get(k)))).filter(Boolean).sort((a, b) => b.submittedAt - a.submittedAt);
      return json({ submissions: subs });
    }

    return fail(404, "Not found.");
  } catch (err) {
    console.error(err);
    return fail(500, "Something went wrong on the server. Please try again.");
  }
}

/** In-memory store for local development (data resets when the dev server restarts). */
export function memoryStore() {
  const m = new Map();
  return {
    async get(k) {
      return m.has(k) ? structuredClone(m.get(k)) : null;
    },
    async set(k, v) {
      m.set(k, structuredClone(v));
    },
    async delete(k) {
      m.delete(k);
    },
    async list(prefix) {
      return [...m.keys()].filter((k) => k.startsWith(prefix));
    },
  };
}
