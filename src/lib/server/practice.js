// The practice problem bank, served by the content API so that premium
// problems never ship in the site's JavaScript. Problems come from:
//   - src/lib/problems.js and src/lib/problemsMore.js (built in), and
//   - "col:problems" in the store: problems the admin added, edited copies
//     of built-in problems (same id) and hidden markers.
// Free or premium is worked out here from the admin's practice settings:
//   practice        { freePercent, years: { 1: { freeCount, solutions, hints, blurb }, ... } }
//   practice:order  { 1: [ids...], ... }   custom order set in the admin panel

import { BOOKS, PROBLEMS } from "../problems.js";
import { MORE_BOOKS, MORE_PROBLEMS } from "../problemsMore.js";
import { hasFeature } from "./auth.js";
import { num, str } from "./http.js";

export const ALL_BOOKS = [...BOOKS, ...MORE_BOOKS];
const BOOK = Object.fromEntries(ALL_BOOKS.map((b, i) => [b[0], { year: b[1], title: b[2], index: i }]));

export const YEARS = [1, 2, 3, 4];
export const YEAR_TITLES = { 1: "1st Year", 2: "2nd Year", 3: "3rd Year", 4: "4th Year" };
const YEAR_BLURBS = {
  1: "Programming basics: operators, conditions, loops, patterns, functions, recursion, arrays, strings and linked lists.",
  2: "Data structures: two pointers, hashing, stacks, sorting, searching and recursion.",
  3: "Algorithms: dynamic programming, graphs, greedy, sliding window and binary search.",
  4: "Placement level: interview classics, advanced DP and advanced graphs.",
};

// A first hint for every built-in topic (problems can add their own).
const TOPIC_HINTS = {
  ops: "Arithmetic operators (+, -, *, /, %) and comparisons are enough here. % gives the remainder.",
  ascii: "charCodeAt(i) gives a character's code and String.fromCharCode(n) turns a code back into a character.",
  ifelse: "Write the condition from the statement directly, then return one value for true and one for false.",
  loops: "Use a loop to visit each value once and keep a running result in a variable.",
  pattern: "Build each line with an inner loop, then join the lines.",
  rec: "Solve the smallest case directly, then call the function on a smaller input.",
  func: "Break the task into a small helper step, then call it.",
  arr: "Go through the array once, keeping track of what the answer needs.",
  str: "Strings work like arrays of characters: index them, loop over them, compare them.",
  ll: "Walk the list with a pointer: node = node.next until node is null.",
  med: "Think about which data structure (a hash map, a stack, two pointers) removes the inner loop.",
  adv: "Look for overlapping subproblems (dynamic programming) or a graph search (BFS or DFS).",
  hard: "Model the problem as a graph or a DP table before writing code.",
};

const SOLUTION_MODES = ["show", "solved", "premium", "hide"];
const HINT_MODES = ["show", "premium", "hide"];
export const DEFAULT_PRACTICE = {
  freePercent: 25,
  years: {
    1: { freeCount: null, solutions: "show", hints: "show", blurb: "" },
    2: { freeCount: null, solutions: "hide", hints: "show", blurb: "" },
    3: { freeCount: null, solutions: "premium", hints: "show", blurb: "" },
    4: { freeCount: null, solutions: "premium", hints: "show", blurb: "" },
  },
};

export function cleanPractice(input) {
  const pct = num(input?.freePercent, DEFAULT_PRACTICE.freePercent);
  const years = {};
  for (const y of YEARS) {
    const v = input?.years?.[y] || {};
    const d = DEFAULT_PRACTICE.years[y];
    const fc = v.freeCount;
    years[y] = {
      freeCount: fc === null || fc === undefined || fc === "" ? null : Math.max(0, Math.trunc(num(fc, 0))),
      solutions: SOLUTION_MODES.includes(v.solutions) ? v.solutions : d.solutions,
      hints: HINT_MODES.includes(v.hints) ? v.hints : d.hints,
      blurb: str(v.blurb, 400).trim(),
    };
  }
  return { freePercent: Math.min(100, Math.max(0, Math.round(pct))), years };
}
export const readPractice = async (store) => cleanPractice((await store.get("practice")) || {});

// ---- Built-in problems in the stored shape ----

const clone = (x) => JSON.parse(JSON.stringify(x));
const indent = (s, pad) => s.replace(/\n/g, "\n" + pad);

/** Readable JavaScript for a built-in reference function. */
function refSource(p) {
  const src = p.ref.toString();
  const gen = src.match(/^function anonymous\(([^)]*)\)\s*\{\s*([\s\S]*?)\s*\}$/);
  if (gen) {
    let body = gen[2].trim();
    if (body.startsWith("{") && body.endsWith("}")) body = body.slice(1, -1).trim();
    if (!/;\s*$|}\s*$/.test(body)) body += ";";
    return { params: gen[1].replace(/\s+/g, " ").trim(), body };
  }
  const own = src.match(/^function\s*[\w$]*\s*\(([^)]*)\)\s*\{([\s\S]*)\}$/);
  return own ? { params: own[1], body: own[2].trim() } : { params: p.pa, body: "return " + src + ";" };
}

function builtInSolution(p) {
  const { body, params } = refSource(p);
  const names = params.split(",").map((s) => s.trim());
  const ll = p.ll || [];
  if (!ll.length && !p.out) return `function ${p.fn}(${params}) {\n  ${indent(body, "  ")}\n}`;
  const lines = [`function ${p.fn}(${params}) {`];
  if (ll.length) {
    lines.push("  // Read the linked list into an array of values first.", "  const toArray = (node) => {", "    const values = [];", "    for (; node; node = node.next) values.push(node.val);", "    return values;", "  };");
    ll.forEach((ix) => lines.push(`  ${names[ix]} = toArray(${names[ix]});`));
  }
  if (p.out) {
    lines.push("  const answer = (() => {", `    ${indent(body, "    ")}`, "  })();", "  // Build a linked list from the answer.", "  let result = null;", "  for (let i = answer.length - 1; i >= 0; i--) result = { val: answer[i], next: result };", "  return result;");
  } else lines.push(`  ${indent(body, "  ")}`);
  lines.push("}");
  return lines.join("\n");
}

function fromBuiltIn(p, i) {
  const book = BOOK[p.b] || { year: 1, title: p.tp || "General", index: 99 };
  let ref = p.ref;
  if (p.sol) ref = new Function(`${p.sol}\nreturn ${p.fn};`)();
  return {
    id: p.id,
    title: p.t,
    difficulty: p.d,
    topic: book.title,
    book: p.b,
    year: book.year,
    kind: "function",
    description: p.desc,
    fn: p.fn,
    params: p.pa,
    tests: p.in.map((args) => ({ args, expected: ref(...clone(args)) ?? null })),
    ll: p.ll || [],
    out: Boolean(p.out),
    hints: p.h || (TOPIC_HINTS[p.b] ? [TOPIC_HINTS[p.b]] : []),
    solution: { code: p.sol || builtInSolution(p), explanation: p.ex || "" },
    solutionMode: "default",
    access: "auto",
    inputFormat: "",
    outputFormat: "",
    constraints: "",
    builtIn: true,
    published: true,
    seq: i,
  };
}

let builtCache = null;
export function builtInProblems() {
  if (!builtCache) builtCache = [...PROBLEMS, ...MORE_PROBLEMS].map(fromBuiltIn);
  return builtCache;
}

/** Every problem (built-in plus the admin's), in display order. `includeHidden` keeps hidden and draft ones (admin view). */
export async function loadBank(store, { includeHidden = false } = {}) {
  const saved = (await store.get("col:problems")) || [];
  const order = (await store.get("practice:order")) || {};
  const byId = new Map(saved.map((p) => [p.id, p]));
  const out = builtInProblems().map((p) => (byId.has(p.id) ? { ...p, ...byId.get(p.id), builtIn: true, edited: true, seq: p.seq } : p));
  const builtIds = new Set(out.map((p) => p.id));
  saved.forEach((p, i) => !builtIds.has(p.id) && out.push({ ...p, seq: 100000 + i }));
  const rank = {};
  for (const y of YEARS) (order[y] || []).forEach((id, i) => (rank[id] = i));
  const bookIndex = (p) => (BOOK[p.book] ? BOOK[p.book].index : 500);
  out.sort((a, b) => a.year - b.year || (rank[a.id] ?? 1e9) - (rank[b.id] ?? 1e9) || bookIndex(a) - bookIndex(b) || a.seq - b.seq);
  return includeHidden ? out : out.filter((p) => p.published !== false && !p.hidden);
}

const topicKey = (p) => (p.book && BOOK[p.book] ? p.book : "t:" + (p.topic || "General"));

/**
 * Marks each problem of one year "free" or "premium". Problems the admin
 * set by hand keep that; the rest are free up to the year's target
 * (a count, or the free percentage), spread fairly across topics so every
 * topic starts with some free problems.
 */
export function accessForYear(list, practice, year) {
  const cfg = practice.years[year] || {};
  const out = new Map();
  const auto = [];
  let fixedFree = 0;
  for (const p of list) {
    if (p.access === "free" || p.access === "premium") {
      out.set(p.id, p.access);
      if (p.access === "free") fixedFree++;
    } else auto.push(p);
  }
  const target = cfg.freeCount ?? Math.ceil((list.length * practice.freePercent) / 100);
  const left = Math.max(0, Math.min(auto.length, target - fixedFree));
  const groups = new Map();
  for (const p of auto) {
    const k = topicKey(p);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(p);
  }
  // Largest-remainder split of `left` free slots across topics.
  const shares = [...groups.values()].map((g) => {
    const exact = auto.length ? (left * g.length) / auto.length : 0;
    return { g, n: Math.floor(exact), r: exact - Math.floor(exact) };
  });
  let spare = left - shares.reduce((s, x) => s + x.n, 0);
  [...shares].sort((a, b) => b.r - a.r).forEach((x) => {
    if (spare > 0 && x.n < x.g.length) {
      x.n++;
      spare--;
    }
  });
  for (const { g, n } of shares) g.forEach((p, i) => out.set(p.id, i < n ? "free" : "premium"));
  return out;
}

/** Free/premium for the whole bank. */
export function accessMap(bank, practice) {
  const all = new Map();
  for (const y of YEARS) for (const [id, v] of accessForYear(bank.filter((p) => p.year === y), practice, y)) all.set(id, v);
  return all;
}

/** True when this user can open premium problems. With the feature switched off, everything is free. */
export function practiceUnlocked(user, access) {
  if (!access.practice?.enabled) return true;
  return hasFeature(user, "practice", access);
}

/** Who sees the solution and hints of a problem. */
export function visibility(p, practice, { premium, solved }) {
  const y = practice.years[p.year] || DEFAULT_PRACTICE.years[1];
  const sMode = SOLUTION_MODES.includes(p.solutionMode) ? p.solutionMode : y.solutions;
  const hMode = y.hints;
  const solution = sMode === "show" || (sMode === "premium" && premium) || (sMode === "solved" && solved);
  const hints = hMode === "show" || (hMode === "premium" && premium);
  return { solution, hints, solutionMode: sMode, hintMode: hMode };
}

/** The list row for a problem. */
export const listRow = (p, access, locked) => ({
  id: p.id,
  title: p.title,
  difficulty: p.difficulty,
  topic: p.topic,
  book: p.book || "",
  year: p.year,
  kind: p.kind,
  access,
  locked,
});

export function yearInfo(year, practice) {
  return { year, title: YEAR_TITLES[year], blurb: practice.years[year]?.blurb || YEAR_BLURBS[year] };
}

export const SOLUTION_LABELS = {
  show: "Full solutions with explanations",
  solved: "Solutions open once you solve the problem",
  premium: "Solutions for premium members",
  hide: "Write your own solutions (no solutions shown)",
};
