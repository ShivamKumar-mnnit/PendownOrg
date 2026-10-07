import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import CodeMirror from "@uiw/react-codemirror";
import { githubDark, githubLight } from "@uiw/codemirror-theme-github";
import { motion } from "motion/react";
import { Play, Loader2, Maximize2, Minimize2, ArrowLeft, RotateCcw, Terminal, SquareTerminal, Square, Code2 } from "lucide-react";
import Select from "../components/Select";
import { LANGUAGES, getLanguage, runCode } from "../lib/compiler";
import { createExecutionSession } from "../lib/interactiveCompiler";
import { usePageSEO } from "../lib/seo";
import { useIsDark } from "../lib/useIsDark";

const LANGUAGE_OPTIONS = LANGUAGES.map((l) => ({ value: l.id, label: l.label }));

export default function Compiler() {
  usePageSEO({
    title: "Online Code Compiler — Python, JavaScript, Java, C, C++",
    description:
      "Free online compiler and code editor. Write and run Python, JavaScript, Java, C, and C++ code directly in your browser — no signup required.",
    path: "/compiler",
  });

  const isDark = useIsDark();
  const [searchParams] = useSearchParams();
  const prefillLang = searchParams.get("lang");
  const [languageId, setLanguageId] = useState(
    LANGUAGES.some((l) => l.id === prefillLang) ? prefillLang : LANGUAGES[0].id
  );
  const [codeByLanguage, setCodeByLanguage] = useState(() =>
    Object.fromEntries(LANGUAGES.map((l) => [l.id, l.boilerplate]))
  );
  const [stdin, setStdin] = useState("");
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [maximized, setMaximized] = useState(false);

  const [interactive, setInteractive] = useState(false);
  const [terminalLines, setTerminalLines] = useState([]);
  const [liveInput, setLiveInput] = useState("");
  const [sessionRunning, setSessionRunning] = useState(false);
  const sessionRef = useRef(null);

  const language = getLanguage(languageId);
  const code = codeByLanguage[languageId];
  const editorExtensions = useMemo(() => [language.extension()], [language]);

  function setCode(value) {
    setCodeByLanguage((prev) => ({ ...prev, [languageId]: value }));
  }

  function stopSession() {
    sessionRef.current?.stop();
    sessionRef.current = null;
    setSessionRunning(false);
  }

  function appendTerminal(type, text) {
    setTerminalLines((prev) => [...prev, { type, text }]);
  }

  function handleToggleInteractive() {
    stopSession();
    setTerminalLines([]);
    setLiveInput("");
    setInteractive((v) => !v);
  }

  function handleStartSession() {
    stopSession();
    setTerminalLines([]);
    setLiveInput("");
    setSessionRunning(true);
    sessionRef.current = createExecutionSession({
      language: languageId,
      code,
      onStdout: (data) => appendTerminal("stdout", data),
      onStderr: (data) => appendTerminal("stderr", data),
      onExit: (msg) => {
        const parts = [];
        if (msg.status) parts.push(msg.status);
        if (typeof msg.exitCode === "number") parts.push(`code ${msg.exitCode}`);
        if (typeof msg.executionTimeMs === "number") parts.push(`${msg.executionTimeMs}ms`);
        appendTerminal("system", `\n[exited${parts.length ? `: ${parts.join(", ")}` : ""}]`);
        sessionRef.current = null;
        setSessionRunning(false);
      },
      onError: (message) => {
        appendTerminal("error", `\n[error: ${message}]`);
        sessionRef.current = null;
        setSessionRunning(false);
      },
    });
  }

  function handleSendLiveInput(e) {
    e.preventDefault();
    if (!sessionRunning) return;
    appendTerminal("input", liveInput);
    sessionRef.current?.sendInput(liveInput);
    setLiveInput("");
  }

  useEffect(() => stopSession, []);

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
    stopSession();
    setTerminalLines([]);
    setCode(language.boilerplate);
    setResult(null);
  }

  return (
    <div
      className={
        maximized
          ? "fixed inset-0 z-50 flex flex-col overflow-y-auto bg-(--color-surface)"
          : "flex flex-1 min-h-150 flex-col overflow-y-auto"
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

          <button
            type="button"
            onClick={handleReset}
            title="Reset to starter code"
            className="inline-flex items-center gap-1.5 rounded-full border border-(--color-border) px-3 py-2 text-xs font-medium text-(--color-fg-muted) hover:text-(--color-fg) hover:border-(--color-border-strong) transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>

          <button
            type="button"
            onClick={handleToggleInteractive}
            title={interactive ? "Switch to single-run mode" : "Switch to interactive (line-by-line) mode"}
            aria-pressed={interactive}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
              interactive
                ? "border-(--color-accent) text-(--color-accent) bg-(--color-accent)/10"
                : "border-(--color-border) text-(--color-fg-muted) hover:text-(--color-fg) hover:border-(--color-border-strong)"
            }`}
          >
            <SquareTerminal className="h-3.5 w-3.5" />
            Terminal
          </button>

          <button
            type="button"
            onClick={interactive ? (sessionRunning ? stopSession : handleStartSession) : handleRun}
            disabled={!interactive && running}
            title={interactive ? (sessionRunning ? "Stop" : "Run") : running ? "Running..." : "Run"}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium transition-colors disabled:opacity-60 ${
              interactive && sessionRunning
                ? "border-rose-500 text-rose-500 hover:bg-rose-500/10"
                : "border-(--color-border) text-(--color-fg-muted) hover:text-(--color-fg) hover:border-(--color-border-strong)"
            }`}
          >
            {interactive ? (
              sessionRunning ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />
            ) : running ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            {interactive ? (sessionRunning ? "Stop" : "Run") : running ? "Running..." : "Run"}
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

        {/* Hero */}
        {!maximized && (
          <div className="border-b border-(--color-border) bg-(--color-surface-alt) px-4 py-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-(--color-accent)">Playground</p>
            <h1 className="mt-2 text-3xl font-extrabold text-(--color-fg) sm:text-4xl">Write it. Run it. Fix it.</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-(--color-fg-muted)">
              A free code runner for quick experiments — no judge, no limits, just output.
            </p>
          </div>
        )}

        {/* Editor + input/output */}
        <div className="flex-1 px-4 py-8">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
            {/* Editor card */}
            <div className="flex flex-col overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface) shadow-sm">
              <div className="flex items-center justify-between gap-2 border-b border-(--color-border) px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-(--color-fg)">
                  <Code2 className="h-4 w-4 text-(--color-accent)" />
                  Editor
                </div>
                <div className="w-40">
                  <Select value={languageId} onChange={setLanguageId} options={LANGUAGE_OPTIONS} />
                </div>
              </div>
              <CodeMirror
                value={code}
                onChange={setCode}
                extensions={editorExtensions}
                theme={isDark ? githubDark : githubLight}
                height={maximized ? "calc(100vh - 160px)" : "520px"}
                className="text-sm"
              />
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-6">
              {interactive ? (
                <div className="flex flex-col overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface) shadow-sm">
                  <div className="flex items-center justify-between gap-2 border-b border-(--color-border) px-4 py-3">
                    <span className="text-sm font-semibold text-(--color-fg)">Terminal</span>
                    <span className="text-xs text-(--color-fg-faint)">Runs line by line, like a real terminal</span>
                  </div>
                  <div className="h-80 overflow-auto bg-black px-4 py-3 font-mono text-sm whitespace-pre-wrap wrap-break-word text-neutral-200">
                    {terminalLines.length === 0 && !sessionRunning && (
                      <span className="text-neutral-500">Run your code to start an interactive session.</span>
                    )}
                    {terminalLines.map((line, i) => {
                      if (line.type === "input") {
                        return (
                          <div key={i} className="text-emerald-400">
                            {"> "}
                            {line.text}
                          </div>
                        );
                      }
                      const className = line.type === "stderr" || line.type === "error" ? "text-rose-400" : line.type === "system" ? "text-neutral-500" : "";
                      return (
                        <span key={i} className={className}>
                          {line.text}
                        </span>
                      );
                    })}
                    {sessionRunning && (
                      <form onSubmit={handleSendLiveInput} className="flex items-center">
                        <span className="text-emerald-400">{"> "}</span>
                        <input
                          type="text"
                          autoFocus
                          value={liveInput}
                          onChange={(e) => setLiveInput(e.target.value)}
                          spellCheck={false}
                          className="flex-1 bg-transparent font-mono text-sm text-neutral-200 outline-none"
                        />
                      </form>
                    )}
                  </div>
                  <div className="p-4">
                    <motion.button
                      type="button"
                      onClick={sessionRunning ? stopSession : handleStartSession}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex w-full items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-colors ${
                        sessionRunning
                          ? "bg-rose-500 hover:bg-rose-600"
                          : "bg-(--color-accent-solid) hover:bg-(--color-accent-solid-hover)"
                      }`}
                    >
                      {sessionRunning ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      {sessionRunning ? "Stop" : "Run"}
                    </motion.button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface) shadow-sm">
                    <div className="px-4 pt-4">
                      <p className="text-sm font-semibold text-(--color-fg)">Custom input (stdin)</p>
                      <p className="mt-1 text-xs text-(--color-fg-faint)">
                        Fed to your program line by line, exactly like the judge does.
                      </p>
                    </div>
                    <textarea
                      value={stdin}
                      onChange={(e) => setStdin(e.target.value)}
                      placeholder={"e.g.\n5\n3 7 1 9 4"}
                      spellCheck={false}
                      className="m-4 h-28 resize-none rounded-lg border border-(--color-border) bg-(--color-surface-alt) px-3 py-2 font-mono text-sm text-(--color-fg) placeholder-(--color-fg-faint) outline-none"
                    />
                    <div className="px-4 pb-4">
                      <motion.button
                        type="button"
                        onClick={handleRun}
                        disabled={running}
                        whileHover={{ scale: running ? 1 : 1.02 }}
                        whileTap={{ scale: running ? 1 : 0.98 }}
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-(--color-accent-solid) px-6 py-2.5 text-sm font-semibold text-white hover:bg-(--color-accent-solid-hover) transition-colors disabled:opacity-60"
                      >
                        {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                        {running ? "Running..." : "Run code"}
                      </motion.button>
                    </div>
                  </div>

                  <div className="flex flex-col overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface) shadow-sm">
                    <p className="px-4 pt-4 text-sm font-semibold text-(--color-fg)">Output</p>
                    <div className="m-4 min-h-45 flex-1 overflow-auto rounded-lg border border-(--color-border) bg-(--color-surface-alt) px-3 py-2 font-mono text-sm whitespace-pre-wrap wrap-break-word">
                      {!result && !running && (
                        <span className="text-(--color-fg-faint)">
                          Run your code to see output here. Nothing is scored — experiment freely.
                        </span>
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
                </>
              )}
            </div>
          </div>
        </div>
    </div>
  );
}
