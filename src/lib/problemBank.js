// Practice problems as the site shows them: the built-in problems from
// problems.js merged with what the admin adds, edits or hides in the admin
// panel (/api/problems). Also judges answers:
//   - "function" problems: JavaScript runs in the browser; Python runs on the
//     code runner with a small harness that calls the student's function.
//   - "stdio" problems: any language, judged on the server against the
//     sample and hidden test cases.

import { useEffect, useState } from "react";
import { BOOKS, BOOK_NAMES, PROBLEMS } from "./problems";
import { call } from "./testsApi";
import { runCode } from "./compiler";
import { syncSolved } from "./account";
import { markProblemSolved } from "./student";

const clone = (x) => JSON.parse(JSON.stringify(x));
const YEAR_OF = Object.fromEntries(BOOKS.map((b) => [b[0], b[1]]));
export const LANG_NAMES = { javascript: "JavaScript", python: "Python", java: "Java", c: "C", cpp: "C++" };

/** Converts a built-in problem (with a reference function) to the stored JSON shape. */
export function fromBuiltIn(p) {
  return {
    id: p.id,
    title: p.t,
    difficulty: p.d,
    topic: p.tp || BOOK_NAMES[p.b],
    book: p.b,
    year: YEAR_OF[p.b] || 1,
    kind: "function",
    description: p.desc,
    fn: p.fn,
    params: p.pa,
    tests: p.in.map((args) => ({ args, expected: p.ref(...clone(args)) })),
    ll: p.ll || [],
    out: Boolean(p.out),
    builtIn: true,
    published: true,
  };
}

let builtCache = null;
export function builtInProblems() {
  if (!builtCache) builtCache = PROBLEMS.map(fromBuiltIn);
  return builtCache;
}

function merge(remote) {
  const hidden = new Set(remote?.hidden || []);
  const byId = new Map((remote?.items || []).map((p) => [p.id, p]));
  const out = builtInProblems()
    .filter((p) => !hidden.has(p.id))
    .map((p) => (byId.has(p.id) ? { ...byId.get(p.id), builtIn: true } : p));
  const builtIds = new Set(out.map((p) => p.id));
  for (const p of remote?.items || []) if (!builtIds.has(p.id) && !hidden.has(p.id)) out.push(p);
  return out;
}

let remoteCache = null;
let remotePromise = null;
function loadRemote() {
  if (!remotePromise)
    remotePromise = call("/api/problems").then(
      (d) => (remoteCache = d),
      () => (remoteCache = { items: [], hidden: [] }),
    );
  return remotePromise;
}

/** All problems: built-ins straight away, then with the admin's changes once loaded. */
export function useProblems() {
  const [list, setList] = useState(() => merge(remoteCache));
  const [loaded, setLoaded] = useState(Boolean(remoteCache));
  useEffect(() => {
    let on = true;
    loadRemote().then(() => {
      if (!on) return;
      setList(merge(remoteCache));
      setLoaded(true);
    });
    return () => {
      on = false;
    };
  }, []);
  return { problems: list, loaded };
}

export const problemsForYear = (list, year) => list.filter((p) => p.year === year);

/** Groups problems by book / topic, keeping first-seen order (books in BOOKS order first). */
export function groupByTopic(list) {
  const groups = new Map();
  for (const b of BOOKS) groups.set(b[0], { key: b[0], title: b[2], items: [] });
  for (const p of list) {
    const key = p.book && groups.has(p.book) ? p.book : "t:" + p.topic;
    if (!groups.has(key)) groups.set(key, { key, title: p.topic || "More problems", items: [] });
    groups.get(key).items.push(p);
  }
  return [...groups.values()].filter((g) => g.items.length);
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

async function judgeStdio(p, lang, code) {
  const d = await call(`/api/problems/${encodeURIComponent(p.id)}/judge`, { method: "POST", body: { language: lang, code } });
  return {
    stdio: true,
    res: d.results.map((r) => ({ ...r, a: r.input, exp: r.expected })),
    ok: d.passed === d.total && d.total > 0,
  };
}

/** Judges an answer and records it as solved when every test passes. */
export async function judgeAnswer(p, lang, code) {
  let r;
  try {
    r = p.kind === "stdio" ? await judgeStdio(p, lang, code) : lang === "python" ? await judgePython(p, code) : judgeJs(p, code);
  } catch (e) {
    return { err: e.message || "Couldn't check your answer. Please try again." };
  }
  if (r.ok) r.solved = recordSolved(p.id);
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
