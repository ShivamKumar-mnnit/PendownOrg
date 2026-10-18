// Coding problems trainers paste in to solve in the code room, stored per trainer on the data
// service (/api/coding-problems, see docs/coding-problems-api.md). Until the server has that
// endpoint (404), they're kept in this browser instead, and can be moved to the account later.
//
// In the app a problem is {id, title, statement, tests: [{id, input, expected}], createdById,
// createdByName, createdAt, updatedAt, local?}. The server calls the tests `testCases` with
// `expectedOutput`.

import { api, download } from "./dataService";

/** The server's Excel file of problems: the trainer's own, or for a super admin everyone's (or one trainer's). */
export const downloadServerExport = (createdBy) => download("/api/coding-problems/export", "coding-problems.xlsx", { createdBy });

const KEY = "anobyt_coding_problems";
const enc = encodeURIComponent;
// 404/405: a server without the endpoint. 403: the endpoint isn't open to this role yet (students,
// until the server allows them). Either way, fall back to this browser.
const missing = (e) => e?.status === 404 || e?.status === 405 || e?.status === 403;

// null until the first call tells us whether the server has the endpoint.
let serverHas = null;
/** True when problems are being kept in this browser because the server has no endpoint yet. */
export const isLocalOnly = () => serverHas === false;

// ---- This browser ----

function readLocal() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v.map((p) => ({ ...p, local: true })) : [];
  } catch {
    return [];
  }
}
function writeLocal(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.map(({ local: _local, ...p }) => p)));
  } catch {
    throw new Error("This browser won't save problems (storage is blocked or full).");
  }
}
export const localProblems = () => readLocal();

// ---- Shape conversion ----

const toTests = (testCases) => (testCases || []).map((t, i) => ({ id: t.id || `t${i}`, input: t.input || "", expected: t.expectedOutput ?? t.expected ?? "" }));
const fromServer = (p) => ({ ...p, tests: toTests(p.testCases ?? p.tests), updatedAt: p.updatedAt ? new Date(p.updatedAt).getTime() : Date.now() });
const toBody = (p) => ({
  title: p.title,
  statement: p.statement,
  difficulty: p.difficulty || undefined,
  tags: p.tags?.length ? p.tags : undefined,
  testCases: (p.tests || []).map((t) => ({ input: t.input || "", expectedOutput: t.expected || "" })),
});

// ---- API with the browser as fallback ----

/** Lists problems: the trainer's own, or for a super admin everyone's (or one trainer's with createdBy). */
export async function listProblems({ q, createdBy } = {}) {
  if (serverHas !== false) {
    try {
      // Page through (100 at a time, at most 20 pages) so the whole list can be shown and exported.
      const all = [];
      for (let page = 0; page < 20; page++) {
        const r = await api("/api/coding-problems", { query: { q, createdBy, page, size: 100 } });
        if (Array.isArray(r)) {
          all.push(...r);
          break;
        }
        all.push(...(r?.items || []));
        if (!r?.totalPages || page + 1 >= r.totalPages) break;
      }
      serverHas = true;
      return all.map(fromServer);
    } catch (e) {
      if (!missing(e)) throw e;
      serverHas = false;
    }
  }
  const needle = (q || "").toLowerCase();
  return readLocal()
    .filter((p) => !needle || `${p.title} ${p.statement}`.toLowerCase().includes(needle))
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export async function getProblem(id) {
  if (id.startsWith("cp_")) return readLocal().find((p) => p.id === id) || null;
  try {
    return fromServer(await api(`/api/coding-problems/${enc(id)}`));
  } catch (e) {
    if (missing(e)) return null;
    throw e;
  }
}

/** Creates or updates a problem and returns it as saved. */
export async function saveProblem(p) {
  if (p.local || (serverHas === false && !p.id)) return saveLocal(p);
  try {
    const r = p.id ? await api(`/api/coding-problems/${enc(p.id)}`, { method: "PUT", body: toBody(p) }) : await api("/api/coding-problems", { method: "POST", body: toBody(p) });
    serverHas = true;
    return fromServer(r);
  } catch (e) {
    if (!missing(e) || p.id) throw e;
    serverHas = false;
    return saveLocal(p);
  }
}

function saveLocal(p) {
  const now = Date.now();
  const all = readLocal();
  const next = { tests: [], ...p, id: p.id || `cp_${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`, createdAt: p.createdAt || now, updatedAt: now, local: true };
  const i = all.findIndex((x) => x.id === next.id);
  if (i >= 0) all[i] = next;
  else all.push(next);
  writeLocal(all);
  return next;
}

export async function deleteProblem(p) {
  if (p.local) return writeLocal(readLocal().filter((x) => x.id !== p.id));
  await api(`/api/coding-problems/${enc(p.id)}`, { method: "DELETE" });
}

/**
 * Moves the problems saved in this browser to the signed-in trainer's account, once the server
 * has the endpoint. Returns how many moved; ones that fail stay in the browser.
 */
export async function moveLocalToServer() {
  let moved = 0;
  let left = readLocal();
  for (const p of readLocal()) {
    await api("/api/coding-problems", { method: "POST", body: toBody(p) });
    left = left.filter((x) => x.id !== p.id);
    writeLocal(left);
    moved++;
  }
  return moved;
}

/** A first line of the statement, used as the title when none is given. */
export function guessTitle(statement) {
  const line = String(statement || "")
    .split("\n")
    .map((l) => l.replace(/^#+\s*/, "").trim())
    .find(Boolean);
  return line ? line.slice(0, 80) : "Untitled problem";
}

/** Downloads the given problems as an Excel file. */
export async function exportProblems(list, { withTrainer = false, fileName } = {}) {
  const XLSX = await import("xlsx");
  const fmt = (ts) => (ts ? new Date(ts).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "");
  const head = ["S.No", ...(withTrainer ? ["Trainer"] : []), "Title", "Problem", "Test cases", "Test case inputs and expected outputs", "Created", "Updated"];
  const rows = list.map((p, n) => [
    n + 1,
    ...(withTrainer ? [p.createdByName || ""] : []),
    p.title || "",
    // Excel cells hold at most 32,767 characters.
    String(p.statement || "").slice(0, 32000),
    p.tests?.length || 0,
    (p.tests || [])
      .map((t, i) => `#${i + 1} input:\n${t.input}\nexpected:\n${t.expected || "(not set)"}`)
      .join("\n\n")
      .slice(0, 32000),
    fmt(p.createdAt),
    fmt(p.updatedAt),
  ]);
  const sheet = XLSX.utils.aoa_to_sheet([head, ...rows]);
  sheet["!cols"] = [6, ...(withTrainer ? [20] : []), 30, 70, 10, 50, 20, 20].map((wch) => ({ wch }));
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Coding problems");
  XLSX.writeFile(book, fileName || `anobyt-coding-problems-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
