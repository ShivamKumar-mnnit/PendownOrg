// Interview scorecard: the sections a trainer scores (0-10 each), the overall percentage and the
// "areas to improve" suggestions. Keys match the data service's ScoreSections record.

export const SECTIONS = [
  ["basicCoding", "Basic coding knowledge", "Coding"],
  ["mediumCoding", "Medium coding knowledge", "Coding"],
  ["advancedCoding", "Advanced coding knowledge", "Coding"],
  ["codeExecution1", "Code execution 1", "Coding"],
  ["codeExecution2", "Code execution 2", "Coding"],
  ["coreCodingConcepts", "Core coding concepts", "Coding"],
  ["conversation", "Conversation", "Communication"],
  ["behavioural", "Behavioural", "Communication"],
  ["resumeScore", "Resume", "Profile"],
  ["aptitude", "Aptitude", "Reasoning"],
  ["logicalThinking", "Logical thinking", "Reasoning"],
  ["questionAsking", "Question asking", "Communication"],
  ["aiKnowledgeAndUsage", "AI knowledge and usage", "Profile"],
];

export const INTEREST = { POSITIVE: "Positive", NEGATIVE: "Negative" };

/** What to work on when a section scores low. */
const TIPS = {
  basicCoding: "Revise language basics: loops, conditions, arrays, strings and functions. Solve 2-3 easy problems a day.",
  mediumCoding: "Practise medium problems on hashing, two pointers, sliding window, recursion and sorting.",
  advancedCoding: "Work up to harder topics: dynamic programming, graphs, trees and greedy proofs.",
  codeExecution1: "Write code that compiles and runs first time: dry-run it, handle edge cases and test with your own inputs.",
  codeExecution2: "Finish the second problem end to end: plan before typing, then debug methodically instead of rewriting.",
  coreCodingConcepts: "Strengthen core concepts: OOP, time and space complexity, memory, and how the data structures you use work.",
  conversation: "Think out loud while solving and explain your approach before you code. Keep answers structured.",
  behavioural: "Prepare STAR-style stories (situation, task, action, result) for teamwork, conflict and failure questions.",
  resumeScore: "Tighten your resume: one page, measurable impact, and be ready to explain every project line by line.",
  aptitude: "Practise timed aptitude: percentages, ratios, time and work, probability and data interpretation.",
  logicalThinking: "Break problems into smaller steps and state your assumptions. Puzzles and pattern problems help.",
  questionAsking: "Ask clarifying questions before solving: input limits, edge cases and expected output.",
  aiKnowledgeAndUsage: "Learn the basics of how AI tools work and use them responsibly to learn, debug and review code.",
};

const num = (v) => (v === "" || v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(v));

/** Average of the scored sections as a percentage, or null when nothing is scored. Same rule as the server. */
export function overallPercent(sections) {
  const scored = SECTIONS.map(([k]) => num(sections?.[k])).filter((v) => v !== null);
  if (!scored.length) return null;
  return Math.round((scored.reduce((a, b) => a + b, 0) / scored.length) * 10 * 100) / 100;
}

export function band(percent) {
  if (percent === null || percent === undefined) return { label: "Not scored", tone: "" };
  if (percent >= 80) return { label: "Excellent", tone: "free" };
  if (percent >= 65) return { label: "Good", tone: "free" };
  if (percent >= 50) return { label: "Average", tone: "med" };
  return { label: "Needs work", tone: "adv" };
}

/** Score tone for one 0-10 section. */
export const scoreTone = (v) => (v === null || v === undefined ? "" : v >= 7 ? "free" : v >= 5 ? "med" : "adv");

/**
 * Suggested areas to improve: every section under 6, weakest first (at most 6), plus a
 * general note on interest when it was negative.
 */
export function suggestAreas(sections, interest) {
  const low = SECTIONS.map(([k, label]) => ({ k, label, v: num(sections?.[k]) }))
    .filter((s) => s.v !== null && s.v < 6)
    .sort((a, b) => a.v - b.v)
    .slice(0, 6)
    .map((s) => `${s.label}: ${TIPS[s.k]}`);
  if (interest === "NEGATIVE") low.push("Interest: show more curiosity and energy. Read about the role and the company before the interview.");
  return low;
}

/** Strengths: sections scored 8 or more. */
export const strengths = (sections) => SECTIONS.filter(([k]) => num(sections?.[k]) >= 8).map(([, label]) => label);

/** Form state -> ScorecardRequest body. */
export function toRequest(f) {
  const sections = {};
  for (const [k] of SECTIONS) sections[k] = num(f.sections[k]);
  return {
    interviewDurationMinutes: num(f.interviewDurationMinutes) ?? undefined,
    sections,
    interest: f.interest || undefined,
    remarks: f.remarks.trim() || undefined,
    areasToImprove: f.areasToImprove
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 30),
  };
}
