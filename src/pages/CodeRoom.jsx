import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CodeMirror from "@uiw/react-codemirror";
import { githubDark, githubLight } from "@uiw/codemirror-theme-github";
import { ArrowLeft, CheckCircle2, CircleDashed, Loader2, Pencil, Play, Plus, RotateCcw, Trash2, XCircle } from "lucide-react";
import { Head, Page } from "../components/ui";
import RichText from "../components/RichText";
import RunOutput from "../components/RunOutput";
import { Modal } from "./admin/ds/common";
import { ProblemForm } from "./admin/ds/CodingProblems";
import { useAccount } from "../lib/account";
import { isAdminRole } from "../lib/dataService";
import { explainResult, getLanguage, normalizeOutput, runCode } from "../lib/compiler";
import { LANG_NAMES, starterFor } from "../lib/problemBank";
import { getProblem, saveProblem } from "../lib/codingProblems";
import { useIsDark } from "../lib/useIsDark";
import { usePageSEO } from "../lib/seo";

const LANGS = ["python", "cpp", "java", "c", "javascript"];
const STDIO = { kind: "stdio" };
const draftKey = (id, lang) => `anobyt_coderoom:${id}:${lang}`;
const readDraft = (id, lang) => {
  try {
    return localStorage.getItem(draftKey(id, lang));
  } catch {
    return null;
  }
};
const writeDraft = (id, lang, code) => {
  try {
    localStorage.setItem(draftKey(id, lang), code);
  } catch {
    /* storage blocked: the draft lives for this page only */
  }
};
const newId = () => Math.random().toString(36).slice(2, 9);
const withIds = (tests) => (tests || []).map((t) => (t.id ? t : { ...t, id: newId() }));

/**
 * Code room for a pasted coding problem: the problem on the left, the compiler on the right and
 * test cases underneath. A test case with an expected output is checked; without one it just
 * shows what the program printed (custom input).
 */
export default function CodeRoom() {
  usePageSEO({ title: "Code room", description: "Solve a coding problem with your own test cases.", path: "/code-room", noindex: true });
  const { id } = useParams();
  const { user, loaded } = useAccount();
  const [problem, setProblem] = useState(undefined); // undefined while loading, null when not found
  const [loadErr, setLoadErr] = useState("");
  const signedIn = !!user;

  useEffect(() => {
    if (!signedIn) return;
    let on = true;
    getProblem(id).then(
      (p) => on && setProblem(p),
      (e) => on && setLoadErr(e.message),
    );
    return () => {
      on = false;
    };
  }, [id, signedIn]);

  if (!loaded) return <Page narrow={520}><p className="note">Loading…</p></Page>;
  if (!user)
    return (
      <Page narrow={520}>
        <Head title="Code room">Sign in to open your coding problems.</Head>
        <Link className="btn" to={`/login?next=/code-room/${id}`}>
          Sign in
        </Link>
      </Page>
    );
  const back = isAdminRole(user) ? { to: "/admin", label: "Coding problems" } : { to: "/dashboard#coding", label: "Your coding problems" };
  if (loadErr) return <Page narrow={560}><p className="note bad">{loadErr}</p></Page>;
  if (problem === undefined) return <Page narrow={520}><p className="note">Loading the problem…</p></Page>;
  if (!problem)
    return (
      <Page narrow={560}>
        <Head title="Problem not found">It may have been deleted, belong to someone else, or have been saved only in another browser.</Head>
        <Link className="btn" to={back.to}>
          Back to {back.label.toLowerCase()}
        </Link>
      </Page>
    );
  return <Room key={problem.id} problem={problem} onChange={setProblem} back={back} />;
}

function Room({ problem, onChange, back }) {
  const isDark = useIsDark();
  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem("anobyt_lang");
      return LANGS.includes(saved) ? saved : "python";
    } catch {
      return "python";
    }
  });
  const [codes, setCodes] = useState({});
  const code = codes[lang] ?? readDraft(problem.id, lang) ?? starterFor(STDIO, lang);
  const extensions = useMemo(() => [getLanguage(lang).extension()], [lang]);
  const [tests, setTests] = useState(() => withIds(problem.tests));
  const [results, setResults] = useState({}); // test id -> {busy} | {out, verdict}
  const [editing, setEditing] = useState(false);
  const [err, setErr] = useState("");
  const running = Object.values(results).some((r) => r?.busy);
  /** Forgets a test case's last run (after it's edited or deleted). */
  const clearResult = (tid) =>
    setResults((r) => {
      const { [tid]: _gone, ...rest } = r;
      return rest;
    });

  function setCode(v) {
    setCodes((c) => ({ ...c, [lang]: v }));
    writeDraft(problem.id, lang, v);
  }
  function pickLang(l) {
    setLang(l);
    setResults({});
    try {
      localStorage.setItem("anobyt_lang", l);
    } catch {
      /* ignore */
    }
  }

  /** Saves test cases with the problem (in this browser). */
  // Test cases save shortly after the last change, not on every keystroke.
  const [saveState, setSaveState] = useState(""); // "" | "pending" | "saving" | "saved"
  const saveTimer = useRef(null);
  const latest = useRef(problem);
  useEffect(() => {
    latest.current = problem;
  }, [problem]);
  function keepTests(next) {
    setTests(next);
    setSaveState("pending");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaveState("saving");
      try {
        onChange(await saveProblem({ ...latest.current, tests: next.map(({ id, input, expected }) => ({ id, input, expected })) }));
        setErr("");
        setSaveState("saved");
      } catch (x) {
        setErr(`Test cases not saved: ${x.message}`);
        setSaveState("");
      }
    }, 900);
  }
  useEffect(() => () => clearTimeout(saveTimer.current), []);
  const updateTest = (tid, k, v) => {
    keepTests(tests.map((t) => (t.id === tid ? { ...t, [k]: v } : t)));
    clearResult(tid);
  };

  async function runOne(t) {
    setResults((r) => ({ ...r, [t.id]: { busy: true } }));
    let out;
    try {
      out = await runCode({ language: lang, code, stdin: t.input });
    } catch (e) {
      out = { status: "ERROR", stdout: "", stderr: "", error: e.message, exitCode: 1 };
    }
    const ranOk = explainResult(out, lang).kind === "ok";
    const verdict = !ranOk ? "error" : t.expected?.trim() ? (normalizeOutput(out.stdout) === normalizeOutput(t.expected) ? "pass" : "fail") : "ran";
    setResults((r) => ({ ...r, [t.id]: { out, verdict } }));
    return verdict;
  }

  async function runAll() {
    // One after another, so a slow runner isn't flooded and results fill in order.
    for (const t of tests) await runOne(t);
  }

  const checked = tests.filter((t) => ["pass", "fail", "error"].includes(results[t.id]?.verdict) && t.expected?.trim());
  const passed = checked.filter((t) => results[t.id].verdict === "pass").length;

  return (
    <section className="page problem-page">
      <div className="wrap">
        <div className="problem-top">
          <div>
            <Link className="linkish" to={back.to} style={{ fontSize: 14 }}>
              <ArrowLeft className="h-4 w-4" style={{ display: "inline", verticalAlign: -3 }} /> {back.label}
            </Link>
            <h1 style={{ marginTop: 6 }}>{problem.title}</h1>
          </div>
          <button type="button" className="btn ghost" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" /> Edit problem
          </button>
        </div>

        <div className="problem-split">
          <div className="panel problem-left">
            <div className="statement">
              <RichText text={problem.statement} />
            </div>
          </div>
          <div className="panel problem-right">
            <div className="solver">
              <div className="solver-top">
                <div className="langs" role="tablist" aria-label="Language">
                  {LANGS.map((l) => (
                    <button key={l} type="button" role="tab" aria-selected={l === lang} className={l === lang ? "on" : ""} onClick={() => pickLang(l)}>
                      {LANG_NAMES[l]}
                    </button>
                  ))}
                </div>
                <button type="button" className="ib" title="Reset to starter code" onClick={() => confirm("Replace your code with the starter code?") && setCode(starterFor(STDIO, lang))}>
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
              <div className="editor-box">
                <CodeMirror value={code} onChange={setCode} extensions={extensions} theme={isDark ? githubDark : githubLight} height="420px" basicSetup={{ tabSize: 4 }} />
              </div>
              <div className="row" style={{ marginTop: 12, alignItems: "center" }}>
                <button type="button" className="btn" onClick={runAll} disabled={running || !tests.length} title={tests.length ? "Run every test case below" : "Add a test case below first"}>
                  {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Run all test cases
                </button>
                {checked.length > 0 && (
                  <span className={passed === checked.length ? "ok" : "bad"} style={{ fontSize: 14, fontWeight: 600 }}>
                    {passed} of {checked.length} passed
                  </span>
                )}
              </div>
              <div className="solver-hint">Read from standard input and print the answer. Each test case below is fed to your program as its input.</div>
            </div>
          </div>
        </div>

        <div className="panel" style={{ marginTop: 20 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <h3 style={{ fontSize: 19, margin: 0 }}>
              Test cases{" "}
              <small className="note" style={{ fontSize: 13, fontWeight: 400, margin: 0 }}>
                {saveState === "pending" || saveState === "saving" ? "Saving…" : saveState === "saved" ? (problem.local ? "Saved in this browser" : "Saved") : ""}
              </small>
            </h3>
            <button type="button" className="btn ghost" onClick={() => keepTests([...tests, { id: newId(), input: "", expected: "" }])}>
              <Plus className="h-4 w-4" /> Add test case
            </button>
          </div>
          <p className="note" style={{ fontSize: 13 }}>Give an expected output to check the answer, or leave it empty to just see what your program prints (custom input).</p>
          {err && <p className="note bad">{err}</p>}
          {!tests.length && (
            <div className="empty" style={{ padding: 24 }}>
              <span>No test cases yet. Add one and paste an input.</span>
            </div>
          )}
          <div className="tc-list">
            {tests.map((t, n) => {
              const r = results[t.id];
              const Icon = r?.busy ? Loader2 : r?.verdict === "pass" ? CheckCircle2 : r?.verdict === "fail" || r?.verdict === "error" ? XCircle : CircleDashed;
              return (
                <div key={t.id} className={`tc-card${r?.verdict ? ` ${r.verdict}` : ""}`}>
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                    <b className="tc-title">
                      <Icon className={`h-4 w-4${r?.busy ? " animate-spin" : ""}`} /> Test case {n + 1}
                      {r?.verdict === "pass" && <span className="ok"> · passed</span>}
                      {r?.verdict === "fail" && <span className="bad"> · wrong answer</span>}
                      {r?.verdict === "error" && <span className="bad"> · error</span>}
                    </b>
                    <span className="row" style={{ gap: 4 }}>
                      <button type="button" className="btn ghost" style={{ padding: "5px 10px" }} disabled={running} onClick={() => runOne(t)}>
                        <Play className="h-4 w-4" /> Run
                      </button>
                      <button
                        type="button"
                        className="ib"
                        title="Delete test case"
                        onClick={() => {
                          keepTests(tests.filter((x) => x.id !== t.id));
                          clearResult(t.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </span>
                  </div>
                  <div className="tc-grid">
                    <label>
                      <span className="l" style={{ marginTop: 0 }}>Input</span>
                      <textarea className="inp code" rows={3} value={t.input} onChange={(e) => updateTest(t.id, "input", e.target.value)} spellCheck={false} placeholder="What your program reads" />
                    </label>
                    <label>
                      <span className="l" style={{ marginTop: 0 }}>Expected output (optional)</span>
                      <textarea className="inp code" rows={3} value={t.expected} onChange={(e) => updateTest(t.id, "expected", e.target.value)} spellCheck={false} placeholder="Leave empty to just see the output" />
                    </label>
                    <div>
                      <span className="l tc-out-head" style={{ marginTop: 0 }}>
                        Your output
                        {r?.out?.stdout && r.verdict !== "pass" && (
                          <button type="button" className="linkish" style={{ fontSize: 12 }} title="Copy your output into Expected output" onClick={() => {
                              keepTests(tests.map((x) => (x.id === t.id ? { ...x, expected: r.out.stdout.replace(/\s+$/, "") } : x)));
                              setResults((all) => ({ ...all, [t.id]: { ...all[t.id], verdict: "pass" } }));
                            }}
                          >
                            Use as expected
                          </button>
                        )}
                      </span>
                      <pre className={`tc-out${r?.verdict ? ` ${r.verdict}` : ""}`} aria-live="polite">
                        {r?.busy ? (
                          <span className="faint">Running…</span>
                        ) : !r?.out ? (
                          <span className="faint">Run to see your output</span>
                        ) : r.verdict === "error" ? (
                          r.out.stderr || r.out.error || r.out.stdout || "Error"
                        ) : (
                          r.out.stdout || <span className="faint">(no output)</span>
                        )}
                      </pre>
                    </div>
                  </div>
                  {r?.out && <RunOutput result={r.out} language={lang} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {editing && (
        <Modal title="Edit coding problem" onClose={() => setEditing(false)} wide={760}>
          <ProblemForm
            initial={{ ...problem, tests: tests.map(({ id, input, expected }) => ({ id, input, expected })) }}
            onSaved={(p) => {
              setEditing(false);
              onChange(p);
            }}
          />
        </Modal>
      )}
    </section>
  );
}
