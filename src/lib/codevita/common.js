// Shared by the CodeVita pages and the CodeVita API (src/lib/server/codevita.js):
// labels, verdicts and the scorecard rules, so the page and the email agree.
//
// Anobyt is not affiliated with TCS. Everything here is practice on Anobyt; the
// scorecard always says so.

export const CV_LANGS = ["c", "cpp", "java", "python"];
export const CV_LANG_NAMES = { c: "C", cpp: "C++", java: "Java", python: "Python" };
export const DIFFICULTIES = ["Easy", "Medium", "Hard"];
export const DEFAULT_POINTS = { Easy: 100, Medium: 200, Hard: 300 };

export const TOPICS = [
  "Arrays",
  "Strings",
  "Mathematics",
  "Number Theory",
  "Sorting and Searching",
  "Recursion",
  "Backtracking",
  "Greedy",
  "Dynamic Programming",
  "Graphs",
  "Matrix",
  "Bit Manipulation",
  "Simulation",
  "Hashing",
  "Stacks and Queues",
  "Sliding Window",
  "Geometry",
];

export const DISCLAIMER =
  "Anobyt practice score. This is not an official TCS CodeVita result, and Anobyt is not affiliated with or endorsed by Tata Consultancy Services.";

/** Verdict codes for one test case. */
export const VERDICTS = {
  AC: { label: "Passed", short: "AC", tone: "good" },
  WA: { label: "Wrong answer", short: "WA", tone: "bad" },
  TLE: { label: "Time limit exceeded", short: "TLE", tone: "warn" },
  RE: { label: "Runtime error", short: "RE", tone: "bad" },
  MLE: { label: "Memory limit exceeded", short: "MLE", tone: "warn" },
  CE: { label: "Compilation error", short: "CE", tone: "bad" },
  SE: { label: "Runner unavailable", short: "SE", tone: "warn" },
};

export const STATUS_TONE = {
  Accepted: "good",
  "Partially accepted": "warn",
  "Wrong answer": "bad",
  "Time limit exceeded": "warn",
  "Runtime error": "bad",
  "Memory limit exceeded": "warn",
  "Compilation error": "bad",
  "Not judged": "warn",
};

/** Overall status from the per-case verdicts. */
export function overallStatus(cases) {
  if (!cases.length) return "Not judged";
  if (cases.some((c) => c.verdict === "CE")) return "Compilation error";
  const passed = cases.filter((c) => c.verdict === "AC").length;
  if (passed === cases.length) return "Accepted";
  if (cases.every((c) => c.verdict === "SE")) return "Not judged";
  if (passed > 0) return "Partially accepted";
  const count = (v) => cases.filter((c) => c.verdict === v).length;
  const worst = ["TLE", "MLE", "RE", "WA"].sort((a, b) => count(b) - count(a))[0];
  return VERDICTS[worst].label;
}

/** Performance band shown on the scorecard. */
export function performanceLevel({ accuracy, status, attemptNo }) {
  if (status === "Accepted") return attemptNo <= 1 ? "Outstanding" : "Proficient";
  if (accuracy >= 60) return "Developing";
  if (accuracy > 0) return "Needs practice";
  return "Getting started";
}

const LANG_TIPS = {
  c: "Use long long for large sums and products, and check array sizes against the constraints.",
  cpp: "Use long long for large sums, fast input (ios::sync_with_stdio(false); cin.tie(nullptr);) for big inputs, and check vector bounds.",
  java: "Read big inputs with BufferedReader instead of Scanner, use long for large sums, and keep the class name Main.",
  python: "Read big inputs with sys.stdin, avoid deep recursion (or raise the limit), and prefer built-ins over nested loops.",
};

/**
 * Areas to improve, worked out from the verdicts and the problem's editorial notes.
 * Returns plain sentences, most important first (at most 5).
 */
export function improvementAreas({ cases, problem, language }) {
  const out = [];
  const has = (v) => cases.some((c) => c.verdict === v);
  const samplesOk = cases.filter((c) => c.sample).every((c) => c.verdict === "AC");
  if (has("CE")) out.push(`Compilation: your code didn't compile in ${CV_LANG_NAMES[language] || language}. Run it on the sample input before submitting.`);
  if (has("TLE"))
    out.push(
      `Time complexity: some tests ran out of time.${problem?.complexity?.time ? ` The expected solution runs in ${problem.complexity.time}.` : ""} Re-read the constraints and look for a faster approach.`,
    );
  if (has("MLE")) out.push("Memory: your program used more memory than allowed. Avoid storing everything at once and pick smaller data types where you can.");
  if (has("RE")) out.push(`Runtime safety: your program crashed on some tests. ${LANG_TIPS[language] || "Check array bounds and division by zero."}`);
  if (has("WA") && samplesOk) out.push("Edge cases: the samples passed but hidden tests failed, so think about the smallest and largest inputs and special values.");
  else if (has("WA")) out.push("Correctness: the sample tests failed. Dry-run your logic on the sample by hand before coding.");
  const edge = (problem?.edgeCases || "").split("\n").map((s) => s.replace(/^[-*]\s*/, "").replace(/[.;]+$/, "").trim()).filter(Boolean);
  if ((has("WA") || has("RE")) && edge.length) out.push(`Check these cases: ${edge.slice(0, 3).join("; ")}.`);
  if (out.length && problem?.topics?.length) out.push(`Practise more ${problem.topics.slice(0, 2).join(" and ")} problems.`);
  return out.slice(0, 5);
}

/** Minutes and seconds, e.g. 12:05 (or 1:02:03). */
export function clock(totalSec) {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

export const fmtMs = (ms) => (typeof ms === "number" ? (ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${Math.round(ms)} ms`) : "—");
export const fmtKb = (kb) => (typeof kb === "number" && kb > 0 ? (kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`) : "—");

/** Starter code for each language (input/output problems). */
export const STARTERS = {
  c: `#include <stdio.h>\n\nint main(void) {\n    // Read the input from stdin and print the answer to stdout.\n\n    return 0;\n}\n`,
  cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // Read the input from stdin and print the answer to stdout.\n\n    return 0;\n}\n`,
  java: `import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // Read the input and print the answer.\n\n    }\n}\n`,
  python: `import sys\n\ndef main():\n    data = sys.stdin.read().split()\n    # Read the input and print the answer.\n\nmain()\n`,
};
