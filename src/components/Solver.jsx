import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CodeMirror from "@uiw/react-codemirror";
import { githubDark, githubLight } from "@uiw/codemirror-theme-github";
import { CheckCircle2, Loader2, Play, RotateCcw, Send, SquareTerminal, XCircle } from "lucide-react";
import { getLanguage, runCode } from "../lib/compiler";
import { LANG_NAMES, judgeAnswer, languagesFor, starterFor } from "../lib/problemBank";
import { TYPED_LANGS } from "../lib/harness";
import { useIsDark } from "../lib/useIsDark";
import RunOutput from "./RunOutput";

const draftKey = (id, lang) => `anobyt_draft:${id}:${lang}`;
function readDraft(id, lang) {
  try {
    return localStorage.getItem(draftKey(id, lang));
  } catch {
    return null;
  }
}
function writeDraft(id, lang, code) {
  try {
    localStorage.setItem(draftKey(id, lang), code);
  } catch {
    /* storage blocked */
  }
}

const show = (v) => (v === undefined ? "undefined" : JSON.stringify(v));

/**
 * Code editor + "Run tests" for one practice problem. Function problems take
 * JavaScript (checked in the browser) or Python; input/output problems take
 * any allowed language and are checked on the server, hidden tests included.
 */
export default function Solver({ p, compact = false, onSolved }) {
  const isDark = useIsDark();
  const langs = languagesFor(p);
  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem("anobyt_lang");
      return langs.includes(saved) ? saved : langs[0];
    } catch {
      return langs[0];
    }
  });
  const [codes, setCodes] = useState({});
  const code = codes[lang] ?? readDraft(p.id, lang) ?? starterFor(p, lang);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState("");
  const [custom, setCustom] = useState(false);
  const [stdin, setStdin] = useState(() => p.samples?.[0]?.input || "");
  const [runOut, setRunOut] = useState(null);
  const extensions = useMemo(() => [getLanguage(lang).extension()], [lang]);

  function setCode(v) {
    setCodes((c) => ({ ...c, [lang]: v }));
    writeDraft(p.id, lang, v);
  }
  function pickLang(l) {
    setLang(l);
    setResult(null);
    setRunOut(null);
    try {
      localStorage.setItem("anobyt_lang", l);
    } catch {
      /* ignore */
    }
  }

  async function runTests(mode) {
    setBusy(mode);
    setResult(null);
    const r = await judgeAnswer(p, lang, code, mode);
    setResult(r);
    setBusy("");
    if (r.ok && mode === "submit") onSolved?.(p.id);
  }

  async function runCustom() {
    setBusy("custom");
    setRunOut(null);
    try {
      setRunOut(await runCode({ language: lang, code, stdin }));
    } catch (e) {
      setRunOut({ status: "ERROR", stdout: "", stderr: "", error: e.message, exitCode: 1 });
    }
    setBusy("");
  }

  const passed = result?.res?.filter((x) => x.pass).length || 0;
  // Java / C / C++ function answers have no main of their own, so they only run through the test harness.
  const typed = p.kind !== "stdio" && TYPED_LANGS.includes(lang);
  const canCustom = !typed;

  return (
    <div className={`solver${compact ? " compact" : ""}`}>
      <div className="solver-top">
        <div className="langs" role="tablist" aria-label="Language">
          {langs.map((l) => (
            <button key={l} type="button" role="tab" aria-selected={l === lang} className={l === lang ? "on" : ""} onClick={() => pickLang(l)}>
              {LANG_NAMES[l]}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="ib"
          title="Reset to starter code"
          onClick={() => {
            setCode(starterFor(p, lang));
            setResult(null);
          }}
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
      <div className="editor-box">
        <CodeMirror value={code} onChange={setCode} extensions={extensions} theme={isDark ? githubDark : githubLight} height={compact ? "240px" : "340px"} basicSetup={{ tabSize: 4 }} />
      </div>
      <div className="row" style={{ marginTop: 12, alignItems: "center" }}>
        <button type="button" className="btn ghost" onClick={() => runTests("run")} disabled={Boolean(busy)} title="Check the sample test cases">
          {busy === "run" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Run code
        </button>
        <button type="button" className="btn" onClick={() => runTests("submit")} disabled={Boolean(busy)} title="Check every test case and save your progress">
          {busy === "submit" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Submit solution
        </button>
        {canCustom && (
          <button type="button" className={`btn ghost${custom ? " on" : ""}`} onClick={() => setCustom(!custom)}>
            <SquareTerminal className="h-4 w-4" /> Custom input
          </button>
        )}
      </div>
      <div className="solver-hint">
        {p.kind === "stdio"
          ? "Read from standard input and print the answer."
          : lang === "javascript"
            ? "Run code checks the samples instantly in your browser. Submit checks every test case."
            : typed
              ? "Fill in the function in the starter code; we call it for each test on our code runner. Don't add a main function."
              : "Your code runs on our code runner. Submit checks every test case."}
      </div>

      {custom && canCustom && (
        <div className="custom-run">
          <label className="l">Input (stdin)</label>
          <textarea className="inp code" rows={3} value={stdin} onChange={(e) => setStdin(e.target.value)} spellCheck={false} placeholder="Type the input your program reads" />
          <button type="button" className="btn ghost" style={{ marginTop: 8 }} onClick={runCustom} disabled={Boolean(busy)}>
            {busy === "custom" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Run with this input
          </button>
          {p.kind !== "stdio" && <p className="note" style={{ fontSize: 13 }}>This runs your file as a program. Call your function and print the result to see it.</p>}
          {runOut && <RunOutput result={runOut} language={lang} />}
        </div>
      )}

      {result && (
        <div className="results" aria-live="polite">
          {result.err ? (
            <div className="verdict bad">
              <XCircle className="h-5 w-5" />
              <div>
                <b>Your code didn't run</b>
                <pre>{result.err}</pre>
              </div>
            </div>
          ) : (
            <>
              <div className={`verdict ${result.ok ? "good" : "bad"}`}>
                {result.ok ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                <div>
                  <b>
                    {result.mode === "run"
                      ? result.ok
                        ? "Sample tests passed. Now submit your solution."
                        : `${passed} of ${result.res.length} sample tests passed`
                      : result.ok
                        ? "Accepted: all tests passed"
                        : `${passed} of ${result.res.length} tests passed`}
                  </b>
                  {result.ok && result.mode !== "run" && (
                    <span>
                      {result.solved === "new" ? " Added to your dashboard." : result.solved === "already" ? " Already counted on your dashboard." : " Marked as solved."}{" "}
                      {result.solved === null && (
                        <Link to="/account" className="linkish">
                          Sign in to save progress
                        </Link>
                      )}
                    </span>
                  )}
                </div>
              </div>
              <div className="cases">
                {result.res.map((x, i) =>
                  x.sample === false ? (
                    <div key={i} className={`case ${x.pass ? "pass" : "fail"}`}>
                      <b>Hidden test {i + 1 - result.res.filter((y) => y.sample).length}</b> {x.pass ? "passed" : "failed"}
                      {!x.pass && x.error && <pre>{x.error}</pre>}
                    </div>
                  ) : (
                    <details key={i} className={`case ${x.pass ? "pass" : "fail"}`} open={!x.pass && i === result.res.findIndex((y) => !y.pass)}>
                      <summary>
                        <b>{x.sample ? "Sample test" : "Test case"} {i + 1}</b> {x.pass ? "passed" : "failed"}
                      </summary>
                      <dl>
                        <dt>Input</dt>
                        <dd>
                          <pre>{result.stdio ? x.a : x.a.map(show).join(", ")}</pre>
                        </dd>
                        <dt>Expected</dt>
                        <dd>
                          <pre>{result.stdio ? x.exp : show(x.exp)}</pre>
                        </dd>
                        {!x.pass && (
                          <>
                            <dt>{x.err || x.error ? "Error" : "Your output"}</dt>
                            <dd>
                              <pre className={x.err || x.error ? "bad" : ""}>{x.err || x.error || (result.stdio ? x.got : show(x.got))}</pre>
                            </dd>
                          </>
                        )}
                      </dl>
                    </details>
                  ),
                )}
              </div>
              {result.printed && (
                <div className="note">
                  Your prints:
                  <pre className="out" style={{ minHeight: 0 }}>{result.printed}</pre>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
