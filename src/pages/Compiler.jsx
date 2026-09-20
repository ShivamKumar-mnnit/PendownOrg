import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CodeMirror from "@uiw/react-codemirror";
import { githubDark, githubLight } from "@uiw/codemirror-theme-github";
import { motion } from "motion/react";
import { Play, Loader2, Maximize2, Minimize2, ArrowLeft, RotateCcw, Terminal } from "lucide-react";
import Select from "../components/Select";
import { LANGUAGES, getLanguage, runCode } from "../lib/compiler";
import { usePageSEO } from "../lib/seo";

/** Tracks the `.dark` class on <html>, which ThemeToggle owns, so the editor
 *  theme follows the site theme without a separate source of truth. */
function useIsDark() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

const LANGUAGE_OPTIONS = LANGUAGES.map((l) => ({ value: l.id, label: l.label }));

export default function Compiler() {
  usePageSEO({
    title: "Online Code Compiler — Python, JavaScript, Java, C, C++",
    description:
      "Free online compiler and code editor. Write and run Python, JavaScript, Java, C, and C++ code directly in your browser — no signup required.",
    path: "/compiler",
  });

  const isDark = useIsDark();
  const [languageId, setLanguageId] = useState(LANGUAGES[0].id);
  const [codeByLanguage, setCodeByLanguage] = useState(() =>
    Object.fromEntries(LANGUAGES.map((l) => [l.id, l.boilerplate]))
  );
  const [stdin, setStdin] = useState("");
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [maximized, setMaximized] = useState(false);

  const language = getLanguage(languageId);
  const code = codeByLanguage[languageId];
  const editorExtensions = useMemo(() => [language.extension()], [language]);

  function setCode(value) {
    setCodeByLanguage((prev) => ({ ...prev, [languageId]: value }));
  }

  async function handleRun() {
    setRunning(true);
    setResult(null);
    try {
      const data = await runCode({ language: languageId, code, stdin });
      setResult(data);
    } catch (err) {
      setResult({ status: "ERROR", stdout: "", stderr: err.message || "Something went wrong. Please try again.", exitCode: 1 });
    } finally {
      setRunning(false);
    }
  }

  function handleReset() {
    setCode(language.boilerplate);
    setResult(null);
  }

  return (
    <div
      className={
        maximized
          ? "fixed inset-0 z-50 flex flex-col bg-(--color-surface)"
          : "flex flex-1 min-h-150 flex-col"
      }
    >
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-(--color-border) bg-(--color-surface-alt) px-4 py-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-(--color-fg-muted) hover:text-(--color-fg) transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>

          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-(--color-accent)" />
            <span className="text-sm font-semibold text-(--color-fg)">Online Compiler</span>
          </div>

          <div className="w-44">
            <Select value={languageId} onChange={setLanguageId} options={LANGUAGE_OPTIONS} />
          </div>

          <button
            type="button"
            onClick={handleReset}
            title="Reset to starter code"
            className="inline-flex items-center gap-1.5 rounded-full border border-(--color-border) px-3 py-2 text-xs font-medium text-(--color-fg-muted) hover:text-(--color-fg) hover:border-(--color-border-strong) transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMaximized((v) => !v)}
              title={maximized ? "Exit fullscreen" : "Fullscreen"}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-(--color-border) text-(--color-fg-muted) hover:text-(--color-fg) hover:border-(--color-border-strong) transition-colors"
            >
              {maximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Editor + input/output */}
        <div className="flex flex-1 flex-col lg:flex-row min-h-0">
          <div className="flex-2 min-h-0 overflow-auto">
            <CodeMirror
              value={code}
              onChange={setCode}
              extensions={editorExtensions}
              theme={isDark ? githubDark : githubLight}
              height="100%"
              className="h-full text-sm"
            />
          </div>

          <div className="flex-1 flex flex-col min-h-0 border-t lg:border-t-0 lg:border-l border-(--color-border)">
            <div className="flex flex-col min-h-30 border-b border-(--color-border)">
              <p className="px-4 pt-3 text-xs font-semibold uppercase tracking-wide text-(--color-fg-faint)">
                Input (stdin)
              </p>
              <textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                placeholder="Values your program reads from standard input, one per line..."
                spellCheck={false}
                className="flex-1 min-h-20 resize-none bg-transparent px-4 py-2 font-mono text-sm text-(--color-fg) placeholder-(--color-fg-faint) outline-none"
              />
            </div>

            <div className="flex-1 flex flex-col min-h-40 overflow-hidden">
              <p className="px-4 pt-3 text-xs font-semibold uppercase tracking-wide text-(--color-fg-faint)">
                Output
              </p>
              <div className="flex-1 overflow-auto px-4 py-2 font-mono text-sm whitespace-pre-wrap wrap-break-word">
                {!result && !running && (
                  <span className="text-(--color-fg-faint)">Run your code to see the output here.</span>
                )}
                {running && (
                  <span className="inline-flex items-center gap-2 text-(--color-fg-muted)">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running...
                  </span>
                )}
                {result && !running && (
                  <>
                    {result.stdout && <span className="text-(--color-fg)">{result.stdout}</span>}
                    {result.stderr && <span className="text-rose-500">{result.stderr}</span>}
                    {!result.stdout && !result.stderr && (
                      <span className="text-(--color-fg-faint)">Program produced no output.</span>
                    )}
                    <div className="mt-3 flex items-center gap-2 text-xs">
                      <span
                        className={`rounded-full px-2 py-0.5 font-semibold ${
                          result.status === "SUCCESS"
                            ? "bg-(--color-accent-emerald)/15 text-(--color-accent-emerald)"
                            : "bg-rose-500/15 text-rose-500"
                        }`}
                      >
                        {result.status === "SUCCESS" ? "Success" : "Error"}
                      </span>
                      <span className="text-(--color-fg-faint)">Exit code {result.exitCode}</span>
                      {typeof result.executionTimeMs === "number" && (
                        <span className="text-(--color-fg-faint)">{result.executionTimeMs} ms</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Run bar */}
        <div className="border-t border-(--color-border) bg-(--color-surface-alt) px-4 py-3">
          <motion.button
            type="button"
            onClick={handleRun}
            disabled={running}
            whileHover={{ scale: running ? 1 : 1.02 }}
            whileTap={{ scale: running ? 1 : 0.98 }}
            className="mx-auto flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-(--color-accent-solid) px-6 py-2.5 text-sm font-semibold text-white hover:bg-(--color-accent-solid-hover) transition-colors disabled:opacity-60"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {running ? "Running..." : "Run"}
          </motion.button>
        </div>
    </div>
  );
}
