// Central place for everything related to the online code compiler.
// Requests go through our own `/api/compile` (a Netlify function in
// production, a Vite dev-middleware locally — see compileHandler.js) rather
// than the hosted compile service directly: that service doesn't send
// CORS headers, so a browser can't call it cross-origin at all.

import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";

export const LANGUAGES = [
  {
    id: "python",
    label: "Python",
    extension: python,
    boilerplate: `print("Hello, world!")\n`,
  },
  {
    id: "javascript",
    label: "JavaScript",
    extension: javascript,
    boilerplate: `console.log("Hello, world!");\n`,
  },
  {
    id: "java",
    label: "Java",
    extension: java,
    boilerplate: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, world!");\n    }\n}\n`,
  },
  {
    id: "c",
    label: "C",
    extension: cpp, // C shares C-family highlighting with C++
    boilerplate: `#include <stdio.h>\n\nint main() {\n    printf("Hello, world!\\n");\n    return 0;\n}\n`,
  },
  {
    id: "cpp",
    label: "C++",
    extension: cpp,
    boilerplate: `#include <iostream>\n\nint main() {\n    std::cout << "Hello, world!" << std::endl;\n    return 0;\n}\n`,
  },
];

export function getLanguage(id) {
  return LANGUAGES.find((l) => l.id === id) || LANGUAGES[0];
}

/**
 * Run code on the code runner (our /api/compile). If the runner can't be
 * reached, JavaScript still runs right here in the browser.
 * @returns {Promise<{status: "SUCCESS"|"ERROR", stdout: string, stderr: string, exitCode: number, executionTimeMs?: number, runner?: string}>}
 */
export async function runCode({ language, code, stdin }) {
  let res;
  try {
    res = await fetch("/api/compile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, code, stdin: stdin || "" }),
    });
  } catch {
    if (language === "javascript") return runJsInBrowser(code, stdin);
    throw new Error("Could not reach the code runner. Check your internet connection and try again.");
  }

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (res.status >= 500 && language === "javascript") return runJsInBrowser(code, stdin);
  if (!data) throw new Error(`The code runner is unavailable right now (${res.status}). Please try again.`);
  if (!res.ok) throw new Error(data.error || `Compile service returned ${res.status}`);
  return data;
}

// Runs JavaScript in a Web Worker: console.log output, stdin through
// require("fs").readFileSync(0), readline, prompt() or input(), and a time limit.
const WORKER_SRC = `
self.onmessage = (e) => {
  const { code, stdin } = e.data;
  let out = "", err = "";
  const show = (x) => (typeof x === "string" ? x : (() => { try { return JSON.stringify(x); } catch { return String(x); } })());
  const fmt = (a) => a.map(show).join(" ");
  const console = { log: (...a) => (out += fmt(a) + "\\n"), info: (...a) => (out += fmt(a) + "\\n"), warn: (...a) => (err += fmt(a) + "\\n"), error: (...a) => (err += fmt(a) + "\\n") };
  const lines = String(stdin || "").split("\\n");
  let li = 0;
  const prompt = () => (li < lines.length ? lines[li++] : null);
  const rl = { handlers: {} };
  const iface = { on(ev, cb) { rl.handlers[ev] = cb; return iface; }, close() {}, question(q, cb) { cb(prompt() || ""); } };
  const mods = { fs: { readFileSync: () => String(stdin || "") }, readline: { createInterface: () => iface } };
  const require = (m) => { if (mods[m]) return mods[m]; throw new Error("The module '" + m + "' isn't available in the browser runner"); };
  const process = { stdout: { write: (s) => { out += String(s); return true; } }, stdin: {}, argv: [], env: {}, exit: () => { throw { __exit: true }; } };
  const t = Date.now();
  try {
    // prompt(), input() and readline() are globals so student code may still declare its own "input" variable.
    self.prompt = self.input = self.readline = prompt;
    new Function("console", "require", "process", code)(console, require, process);
    if (rl.handlers.line) { while (li < lines.length) rl.handlers.line(lines[li++]); }
    if (rl.handlers.close) rl.handlers.close();
    self.postMessage({ status: "SUCCESS", stdout: out, stderr: err, exitCode: 0, executionTimeMs: Date.now() - t, runner: "browser" });
  } catch (x) {
    if (x && x.__exit) self.postMessage({ status: "SUCCESS", stdout: out, stderr: err, exitCode: 0, executionTimeMs: Date.now() - t, runner: "browser" });
    else self.postMessage({ status: "ERROR", stdout: out, stderr: err + (x && x.name ? x.name + ": " + x.message : String(x)), exitCode: 1, executionTimeMs: Date.now() - t, runner: "browser" });
  }
};`;

export function runJsInBrowser(code, stdin, limitMs = 5000) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(new Blob([WORKER_SRC], { type: "text/javascript" }));
    const w = new Worker(url);
    const done = (r) => {
      clearTimeout(timer);
      w.terminate();
      URL.revokeObjectURL(url);
      resolve(r);
    };
    const timer = setTimeout(() => done({ status: "ERROR", stdout: "", stderr: `Time limit exceeded: stopped after ${limitMs / 1000} seconds.`, exitCode: 124, runner: "browser" }), limitMs);
    w.onmessage = (e) => done(e.data);
    w.onerror = (e) => done({ status: "ERROR", stdout: "", stderr: e.message || "Your code crashed.", exitCode: 1, runner: "browser" });
    w.postMessage({ code, stdin: stdin || "" });
  });
}

/**
 * Turns a run result into a plain-language verdict for students:
 * { kind: "ok" | "compile" | "runtime" | "timeout" | "service", title, detail, line }.
 */
export function explainResult(r, language) {
  if (!r) return null;
  if (r.error && !r.stdout && !r.stderr) return { kind: "service", title: "Couldn't run your code", detail: r.error };
  const err = String(r.stderr || "");
  const ok = r.status === "SUCCESS" && (r.exitCode === 0 || r.exitCode === undefined) && !/Traceback|Exception in thread/.test(err);
  if (ok) return { kind: "ok", title: "Ran successfully" };
  const lineOf = (re) => {
    const m = err.match(re);
    return m ? Number(m[1]) : null;
  };
  if (r.exitCode === 124 || r.exitCode === 137 || /time ?limit|timed? ?out|took too long|SIGKILL|Killed/i.test(err) || /Time Limit/i.test(r.verdict || ""))
    return { kind: "timeout", title: "Time limit exceeded", detail: "Your program ran too long. Look for an infinite loop, or a faster approach." };
  const lastLine = err.trim().split("\n").filter(Boolean).pop() || "";
  if (language === "python") {
    if (/SyntaxError|IndentationError|TabError/.test(err)) return { kind: "compile", title: "Syntax error", detail: lastLine, line: lineOf(/line (\d+)/) };
    if (/Traceback/.test(err)) {
      const lines = [...err.matchAll(/line (\d+)/g)];
      return { kind: "runtime", title: "Runtime error", detail: lastLine, line: lines.length ? Number(lines[lines.length - 1][1]) : null };
    }
  }
  if (language === "java") {
    if (/\.java:\d+: error/.test(err) || /error: /.test(err)) return { kind: "compile", title: "Compilation error", detail: (err.match(/error: (.*)/) || [])[1] || lastLine, line: lineOf(/\.java:(\d+):/) };
    if (/Exception in thread|Exception:/.test(err)) return { kind: "runtime", title: "Runtime error", detail: (err.match(/Exception in thread "[^"]*" (.*)/) || [])[1] || lastLine, line: lineOf(/\.java:(\d+)\)/) };
  }
  if (language === "c" || language === "cpp") {
    if (/error:/.test(err) || /Compilation Error/i.test(r.verdict || "")) return { kind: "compile", title: "Compilation error", detail: (err.match(/error: (.*)/) || [])[1] || lastLine, line: lineOf(/:(\d+):\d+: error/) };
    if (r.exitCode === 139 || /Segmentation fault|SIGSEGV/i.test(err + (r.verdict || ""))) return { kind: "runtime", title: "Runtime error: segmentation fault", detail: "Your program read or wrote memory it doesn't own. Check array indexes and pointers." };
    if (r.exitCode === 136 || /SIGFPE|Floating point/i.test(err + (r.verdict || ""))) return { kind: "runtime", title: "Runtime error: division by zero", detail: "An integer was divided by zero." };
  }
  if (language === "javascript") {
    if (/SyntaxError/.test(err)) return { kind: "compile", title: "Syntax error", detail: (err.match(/SyntaxError: (.*)/) || [])[1] || lastLine, line: lineOf(/:(\d+)\n/) };
    if (/(\w*Error): /.test(err)) return { kind: "runtime", title: "Runtime error", detail: (err.match(/(\w*Error: .*)/) || [])[1] || lastLine };
  }
  if (r.exitCode && r.exitCode !== 0 && !err) return { kind: "runtime", title: `Exited with code ${r.exitCode}`, detail: "Your program stopped with an error code. In C/C++, make sure main returns 0." };
  return { kind: "runtime", title: "Error", detail: lastLine || "Something went wrong while running your code." };
}

/** Compares program output with the expected output, ignoring trailing spaces and blank lines. */
export const normalizeOutput = (s) =>
  String(s ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""))
    .join("\n")
    .replace(/\n+$/, "");
