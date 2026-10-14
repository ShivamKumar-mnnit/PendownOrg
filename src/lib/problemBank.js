// Practice problems in the browser. The problem bank lives on the server
// (/api/practice and /api/problems), which decides what is free or premium
// and only sends premium problems, solutions and hints to accounts allowed
// to see them. This file loads them and judges answers:
//   - "function" problems: JavaScript runs in the browser; Python runs on the
//     code runner with a small harness that calls the student's function.
//   - "stdio" problems: any language, judged on the server against the
//     sample and hidden test cases.

import { useEffect, useState } from "react";
import { call } from "./testsApi";
import { runCode } from "./compiler";
import { syncSolved, useAccount, userHeaders } from "./account";
import { getStudent, markProblemSolved } from "./student";

const clone = (x) => JSON.parse(JSON.stringify(x));
const enc = encodeURIComponent;
export const LANG_NAMES = { javascript: "JavaScript", python: "Python", java: "Java", c: "C", cpp: "C++" };
export const YEAR_NAMES = { 1: "1st Year", 2: "2nd Year", 3: "3rd Year", 4: "4th Year" };

export const difficultyClass = (d) => (d === "Easy" ? "free" : d === "Medium" ? "med" : "adv");

const get = (path) => call(path, { headers: userHeaders() });

/** Loads an API path again whenever the signed-in account or its premium access changes. */
function useApi(path, bump = 0) {
  const { user, features, loaded } = useAccount();
  const key = `${path}|${user?.id || ""}|${features?.practice?.has ? 1 : 0}|${loaded ? 1 : 0}|${bump}`;
  const [state, setState] = useState({ key: "", data: null, error: "" });
  useEffect(() => {
    if (!loaded) return;
    let on = true;
    get(path).then(
      (data) => on && setState({ key, data, error: "" }),
      (e) => on && setState({ key, data: null, error: e.message || "Couldn't load. Please refresh." }),
    );
    return () => {
      on = false;
    };
  }, [key, path, loaded]);
  const fresh = state.key === key;
  return { data: fresh ? state.data : null, error: fresh ? state.error : "", loading: !fresh };
}

/** The four years with problem counts, plus the practice plan. `index` adds a light list of every problem. */
export const usePractice = (index = false) => useApi(`/api/practice${index ? "?index=1" : ""}`);
/** One year's problem list, each marked free or premium (and locked for this account). */
export const useYear = (year) => useApi(`/api/practice/${enc(year)}`);
/** One problem, or { locked: true } with a short teaser when it needs premium access. */
export const useProblem = (id, bump = 0) => useApi(`/api/problems/${enc(id)}`, bump);

/** Groups problems by topic, keeping first-seen order. */
export function groupByTopic(list) {
  const groups = new Map();
  for (const p of list) {
    const key = p.book || "t:" + p.topic;
    if (!groups.has(key)) groups.set(key, { key, title: p.topic || "More problems", items: [] });
    groups.get(key).items.push(p);
  }
  return [...groups.values()];
}

export function languagesFor(p) {
  return p.kind === "stdio" ? p.languages || ["python", "javascript", "java", "c", "cpp"] : ["javascript", "python"];
}

const STDIO_STARTER = {
  python: "# Read input, then print the answer\ndata = input()\n",
  javascript: 'const input = require("fs").readFileSync(0, "utf8").trim();\n// Print the answer with console.log\n',
  java: "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Read input, then print the answer\n    }\n}\n",
  c: "#include <stdio.h>\n\nint main() {\n    // Read input, then print the answer\n    return 0;\n}\n",
  cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Read input, then print the answer\n    return 0;\n}\n",
};

export function starterFor(p, lang) {
  if (p.kind === "stdio") return p.starter?.[lang] || STDIO_STARTER[lang] || "";
  const hint = p.ll?.length ? "head is a node with val and next (None/null at the end)." : "write your solution here";
  if (lang === "python") return `def ${p.fn}(${p.params}):\n    # ${hint}\n    pass\n`;
  return `function ${p.fn}(${p.params}) {\n  // ${hint}\n\n}\n`;
}

export function exampleOf(p) {
  if (p.kind === "stdio") return p.samples?.[0] ? { input: p.samples[0].input, output: p.samples[0].output } : null;
  const t = p.tests?.[0];
  if (!t) return null;
  return { call: `${p.fn}(${t.args.map((x) => JSON.stringify(x)).join(", ")})`, returns: JSON.stringify(t.expected) };
}

export function fullDescription(p) {
  return (
    (p.description || "") +
    (p.ll?.length ? " The list is given by its head node. Each node has val and next (null at the end). Examples show lists as arrays." : "") +
    (p.out ? " Return the head node of the result (null for an empty list)." : "")
  );
}

const show = (v) => (v === undefined ? "undefined" : JSON.stringify(v));
const paramNames = (p) => String(p.params || "").split(",").map((x) => x.trim()).filter(Boolean);

/** The first two tests, shown as sample test cases on the problem page. */
export function samplesOf(p) {
  if (p.kind === "stdio") return (p.samples || []).map((s) => ({ input: s.input, output: s.output }));
  const names = paramNames(p);
  return (p.tests || []).slice(0, 2).map((t) => ({
    input: t.args.map((a, i) => `${names[i] || "arg" + (i + 1)} = ${show(a)}`).join("\n"),
    output: show(t.expected),
  }));
}

/** Input format, output format and constraints, written for function problems when the admin left them empty. */
export function formatsOf(p) {
  if (p.kind === "stdio") return { input: p.inputFormat || "", output: p.outputFormat || "", constraints: p.constraints || "" };
  const names = paramNames(p);
  const ll = new Set(p.ll || []);
  const input =
    p.inputFormat ||
    `Write a function \`${p.fn}(${names.join(", ")})\`. It receives:\n` +
      names.map((n, i) => `- \`${n}\`${ll.has(i) ? ": the head node of a linked list (each node has val and next)" : ""}`).join("\n");
  const output = p.outputFormat || (p.out ? "Return the head node of the resulting linked list (null for an empty list)." : "Return the answer from the function. Don't print it.");
  const constraints = p.constraints || "Your function is called once per test case. Each test must finish within 2 seconds.";
  return { input, output, constraints };
}

// ---- Judging ----

function toList(a) {
  return Array.isArray(a) ? a.reduceRight((next, val) => ({ val, next }), null) : a;
}
function toArr(h) {
  const r = [];
  let c = 0;
  while (h && typeof h === "object" && c++ < 100000) {
    r.push(h.val);
    h = h.next;
  }
  return r;
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Runs JavaScript in the browser against every test. */
export function judgeJs(p, code) {
  let f;
  try {
    f = new Function(code + "\nreturn typeof " + p.fn + ' === "function" ? ' + p.fn + " : undefined;")();
  } catch (e) {
    return { err: `${e.name}: ${e.message}` };
  }
  if (typeof f !== "function") return { err: `Define a function named ${p.fn}.` };
  const res = p.tests.map((t) => {
    let got;
    let err = "";
    try {
      const ar = clone(t.args);
      (p.ll || []).forEach((ix) => (ar[ix] = toList(ar[ix])));
      got = f(...ar);
      if (p.out) got = toArr(got);
    } catch (e) {
      err = `${e.name}: ${e.message}`;
    }
    return { a: t.args, exp: t.expected, got, err, pass: !err && same(got, t.expected) };
  });
  return { res, ok: res.every((x) => x.pass) };
}

/** Wraps a Python solution so one run checks every test; results come back as marked JSON lines. */
export function pythonHarness(p, code) {
  return `import json as _json, sys as _sys
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next
def _to_list(a):
    h = None
    for v in reversed(a):
        h = ListNode(v, h)
    return h
def _to_arr(h):
    r = []
    while h is not None and len(r) < 100000:
        r.append(h.val)
        h = h.next
    return r

${code}

_tests = _json.loads(_sys.stdin.read())
for _args in _tests:
    try:
        for _i in ${JSON.stringify(p.ll || [])}:
            _args[_i] = _to_list(_args[_i])
        _r = ${p.fn}(*_args)
        ${p.out ? "_r = _to_arr(_r)" : "pass"}
        print("@@R " + _json.dumps(_r))
    except Exception as _e:
        print("@@E " + type(_e).__name__ + ": " + str(_e))
`;
}

async function judgePython(p, code) {
  if (!new RegExp(`def\\s+${p.fn}\\s*\\(`).test(code)) return { err: `Define a function named ${p.fn} with def ${p.fn}(${p.params}):` };
  const out = await runCode({ language: "python", code: pythonHarness(p, code), stdin: JSON.stringify(p.tests.map((t) => t.args)) });
  const lines = String(out.stdout || "")
    .split("\n")
    .filter((l) => l.startsWith("@@"));
  if (!lines.length) return { err: out.stderr || out.error || "Your code didn't run. Check for syntax errors.", raw: out };
  const printed = String(out.stdout || "")
    .split("\n")
    .filter((l) => l && !l.startsWith("@@"))
    .join("\n");
  const res = p.tests.map((t, i) => {
    const line = lines[i];
    if (!line) return { a: t.args, exp: t.expected, err: out.stderr || "Stopped before this test (time limit or crash).", pass: false };
    if (line.startsWith("@@E ")) return { a: t.args, exp: t.expected, err: line.slice(4), pass: false };
    let got;
    try {
      got = JSON.parse(line.slice(4));
    } catch {
      got = line.slice(4);
    }
    return { a: t.args, exp: t.expected, got, pass: same(got, t.expected) };
  });
  return { res, ok: res.every((x) => x.pass), printed };
}

async function judgeStdio(p, lang, code, samplesOnly) {
  const d = await call(`/api/problems/${encodeURIComponent(p.id)}/judge`, { method: "POST", body: { language: lang, code, samplesOnly }, headers: userHeaders() });
  return {
    stdio: true,
    res: d.results.map((r) => ({ ...r, a: r.input, exp: r.expected })),
    ok: d.passed === d.total && d.total > 0,
  };
}

/**
 * Judges an answer. "run" checks the sample tests only; "submit" checks
 * every test and records the problem as solved when all of them pass.
 */
export async function judgeAnswer(p, lang, code, mode = "submit") {
  const run = mode === "run";
  const q = p.kind === "stdio" ? p : { ...p, tests: run ? (p.tests || []).slice(0, 2) : p.tests || [] };
  let r;
  try {
    r = p.kind === "stdio" ? await judgeStdio(q, lang, code, run) : lang === "python" ? await judgePython(q, code) : judgeJs(q, code);
  } catch (e) {
    return { err: e.message || "Couldn't check your answer. Please try again." };
  }
  r.mode = mode;
  if (r.res && p.kind !== "stdio") r.res = r.res.map((x, i) => ({ ...x, sample: i < 2 ? true : undefined }));
  if (r.ok && !run) r.solved = recordSolved(p.id);
  return r;
}

// ---- Solved problems (this browser, plus the account when signed in) ----

const SOLVED_KEY = "anobyt_solved";
export function solvedSet() {
  try {
    return new Set(JSON.parse(localStorage.getItem(SOLVED_KEY) || "[]"));
  } catch {
    return new Set();
  }
}
export function recordSolved(id) {
  const s = solvedSet();
  s.add(id);
  try {
    localStorage.setItem(SOLVED_KEY, JSON.stringify([...s]));
  } catch {
    /* storage blocked */
  }
  syncSolved([id]);
  return markProblemSolved(id);
}

/** Problems solved in this browser plus those saved to the account. */
export function useSolved() {
  const { user } = useAccount();
  const [local] = useState(() => {
    const s = solvedSet();
    Object.keys(getStudent()?.done || {}).forEach((id) => s.add(id));
    return s;
  });
  return new Set([...local, ...(user?.progress?.solved || [])]);
}
