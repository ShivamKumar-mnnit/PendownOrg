import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import CodeMirror from "@uiw/react-codemirror";
import { githubDark, githubLight } from "@uiw/codemirror-theme-github";
import { Play, Loader2, Maximize2, Minimize2, RotateCcw, SquareTerminal, Square } from "lucide-react";
import { Head, Page } from "../components/ui";
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

  const panel = (
    <div className="panel">
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 12 }}>
        <div style={{ width: 240, maxWidth: "100%" }}>
          <label className="l" style={{ marginTop: 0 }}>
            Language
          </label>
          <Select value={languageId} onChange={setLanguageId} options={LANGUAGE_OPTIONS} />
        </div>
        <div className="row" style={{ marginLeft: "auto", gap: 8 }}>
          <button type="button" className="btn ghost" onClick={handleReset} title="Reset to starter code">
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={handleToggleInteractive}
            aria-pressed={interactive}
            title={interactive ? "Switch to single-run mode" : "Switch to interactive (line-by-line) mode"}
            style={interactive ? { borderColor: "var(--color-accent)", color: "var(--color-accent)" } : undefined}
          >
            <SquareTerminal className="h-4 w-4" />
            Terminal
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={() => setMaximized((v) => !v)}
            title={maximized ? "Exit fullscreen" : "Fullscreen"}
            aria-label={maximized ? "Exit fullscreen" : "Fullscreen"}
          >
            {maximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <label className="l">Code</label>
      <div style={{ border: "1px solid var(--color-border)", borderRadius: 10, overflow: "hidden" }}>
        <CodeMirror
          value={code}
          onChange={setCode}
          extensions={editorExtensions}
          theme={isDark ? githubDark : githubLight}
          height={maximized ? "calc(100vh - 420px)" : "360px"}
          className="text-sm"
        />
      </div>

      {interactive ? (
        <>
          <div className="row" style={{ marginTop: 14 }}>
            <button
              type="button"
              className={`btn${sessionRunning ? " danger" : ""}`}
              onClick={sessionRunning ? stopSession : handleStartSession}
            >
              {sessionRunning ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {sessionRunning ? "Stop" : "Run code"}
            </button>
          </div>
          <label className="l">Terminal</label>
          <div className="h-80 overflow-auto rounded-xl bg-black px-4 py-3 font-mono text-sm whitespace-pre-wrap wrap-break-word text-neutral-200">
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
          <div className="note">Runs line by line, like a real terminal. Type input when your program asks for it.</div>
        </>
      ) : (
        <>
          <label className="l" htmlFor="stdin">
            Custom input (stdin)
          </label>
          <textarea
            id="stdin"
            className="inp code"
            style={{ minHeight: 90 }}
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder={"e.g.\n5\n3 7 1 9 4"}
            spellCheck={false}
          />
          <div className="row" style={{ marginTop: 14 }}>
            <button type="button" className="btn" onClick={handleRun} disabled={running}>
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {running ? "Running..." : "Run code"}
            </button>
          </div>
          <label className="l">Output</label>
          <pre className="out">
            {!result && !running && <span style={{ color: "var(--color-fg-faint)" }}>Output appears here.</span>}
            {running && "Running..."}
            {result && !running && (
              <>
                {result.stdout && <span>{result.stdout}</span>}
                {result.stderr && <span className="text-rose-500">{result.stderr}</span>}
                {!result.stdout && !result.stderr && <span style={{ color: "var(--color-fg-faint)" }}>(no output)</span>}
                {"\n"}
                <span className={result.status === "SUCCESS" ? "ok" : "bad"}>{result.status === "SUCCESS" ? "Success" : "Error"}</span>
                <span style={{ color: "var(--color-fg-faint)" }}>
                  {" "}
                  · Exit code {result.exitCode}
                  {typeof result.executionTimeMs === "number" ? ` · ${result.executionTimeMs} ms` : ""}
                </span>
              </>
            )}
          </pre>
        </>
      )}
      <div className="note">Runs on our code-execution server. Supports Python, JavaScript, Java, C and C++.</div>
    </div>
  );

  if (maximized) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-(--color-surface) p-4 sm:p-6">
        {panel}
      </div>
    );
  }

  return (
    <Page>
      <Head title="Online compiler">Write code, run it and see the output. Pick a language to load a starter program.</Head>
      {panel}
    </Page>
  );
}
