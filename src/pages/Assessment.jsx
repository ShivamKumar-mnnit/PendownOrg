import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CodeMirror from "@uiw/react-codemirror";
import { githubDark, githubLight } from "@uiw/codemirror-theme-github";
import { Bookmark, CheckCircle2, ChevronLeft, ChevronRight, Clock, Play, Send, XCircle } from "lucide-react";
import { Head, Page } from "../components/ui";
import { getLanguage, runCode } from "../lib/compiler";
import { KIND_LABELS, LANG_LABELS, TEST_TYPE_LABELS, getTest, submitTest } from "../lib/testsApi";
import { addSolved } from "../lib/student";
import { useIsDark } from "../lib/useIsDark";
import { usePageSEO } from "../lib/seo";

// An in-progress attempt is saved in this browser, so a refresh or a closed
// tab doesn't lose answers, and the timer keeps counting from the start.
const attemptKey = (id) => `ab_attempt_${id}`;
function loadAttempt(id) {
  try {
    return JSON.parse(localStorage.getItem(attemptKey(id)));
  } catch {
    return null;
  }
}
function saveAttempt(id, a) {
  try {
    if (a) localStorage.setItem(attemptKey(id), JSON.stringify(a));
    else localStorage.removeItem(attemptKey(id));
  } catch {
    /* storage blocked: the attempt just won't survive a reload */
  }
}

const normalize = (s) =>
  String(s ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""))
    .join("\n")
    .replace(/\n+$/, "");
const clock = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
};

function isAnswered(q, a) {
  if (a === undefined || a === null || a === "") return false;
  if (q.kind === "multi") return Array.isArray(a) && a.length > 0;
  if (q.kind === "coding") return typeof a.code === "string" && a.code.trim() !== "" && a.code !== getLanguage(a.language).boilerplate;
  return true;
}

export default function Assessment() {
  const { id } = useParams();
  const [test, setTest] = useState(null);
  const [error, setError] = useState("");

  usePageSEO({
    title: test ? test.title : "Assessment",
    description: "Take an Anobyt assessment: MCQ, coding and Olympiad-style tests with instant evaluation.",
    path: `/assessment/${id}`,
    noindex: true,
  });

  useEffect(() => {
    let live = true;
    getTest(id).then(
      (t) => live && setTest(t),
      (e) => live && setError(e.status === 404 ? "This test doesn't exist or isn't open right now." : e.message),
    );
    return () => {
      live = false;
    };
  }, [id]);

  if (error)
    return (
      <Page narrow={620}>
        <Head title="Test unavailable">{error}</Head>
        <Link className="btn" to="/practice">
          See all tests
        </Link>
      </Page>
    );
  if (!test)
    return (
      <Page narrow={620}>
        <p className="note">Loading the test…</p>
      </Page>
    );
  return <Attempt key={test.id} test={test} />;
}

function Attempt({ test }) {
  const [attempt, setAttempt] = useState(() => loadAttempt(test.id));
  const [result, setResult] = useState(null);

  const update = useCallback(
    (fn) =>
      setAttempt((prev) => {
        const next = fn(prev);
        saveAttempt(test.id, next);
        return next;
      }),
    [test.id],
  );

  if (result) return <ResultView test={test} attempt={result.attempt} result={result.graded} added={result.added} />;
  if (!attempt) return <Intro test={test} onStart={(a) => update(() => a)} />;
  return (
    <Exam
      test={test}
      attempt={attempt}
      update={update}
      onDone={(graded) => {
        const correct = graded.results.filter((r) => r.correct).length;
        setResult({ attempt, graded, added: addSolved(correct) });
        saveAttempt(test.id, null);
      }}
    />
  );
}

function Intro({ test, onStart }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const kinds = [...new Set(test.questions.map((q) => q.kind))];
  const hasNegative = test.questions.some((q) => q.negative > 0);

  function start(e) {
    e.preventDefault();
    const order = test.questions.map((_, i) => i);
    if (test.shuffle) {
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
    }
    onStart({ name: name.trim(), email: email.trim(), startedAt: Date.now(), order, current: 0, answers: {}, flagged: [] });
  }

  return (
    <Page narrow={760}>
      <span className="eyebrow">{TEST_TYPE_LABELS[test.type]}</span>
      <h1 className="ptitle">{test.title}</h1>
      {test.description && <p className="lead-p">{test.description}</p>}
      <div className="kpis">
        <div><b>{test.questions.length}</b><span>Questions</span></div>
        <div><b>{test.totalMarks}</b><span>Total marks</span></div>
        <div><b>{test.durationMin ? `${test.durationMin} min` : "Untimed"}</b><span>Time limit</span></div>
      </div>
      <div className="panel">
        <h3 style={{ fontSize: 19 }}>Before you begin</h3>
        <ul className="ck">
          <li>Question types: {kinds.map((k) => KIND_LABELS[k]).join(", ")}.</li>
          {test.durationMin > 0 && <li>The timer starts when you press Start and the test submits itself when time runs out.</li>}
          {hasNegative ? <li>Wrong answers carry negative marks. Leave a question blank if you are unsure.</li> : <li>There is no negative marking.</li>}
          {kinds.includes("coding") && <li>Coding answers run against hidden test cases. Use "Run samples" to check your code first.</li>}
          <li>Your answers are saved in this browser as you go, so a refresh won't lose them.</li>
        </ul>
        <form onSubmit={start}>
          <div className="two">
            <div>
              <label className="l" htmlFor="a-name">Your name</label>
              <input id="a-name" className="inp" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="l" htmlFor="a-email">Email (optional)</label>
              <input id="a-email" className="inp" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <button className="btn" style={{ marginTop: 20 }} disabled={!name.trim()}>
            Start test
          </button>
        </form>
      </div>
    </Page>
  );
}

function Exam({ test, attempt, update, onDone }) {
  const deadline = test.durationMin ? attempt.startedAt + test.durationMin * 60000 : 0;
  const [now, setNow] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const sentRef = useRef(false);

  const order = attempt.order;
  const pos = Math.min(attempt.current, order.length - 1);
  const qi = order[pos];
  const q = test.questions[qi];
  const answered = order.filter((i) => isAnswered(test.questions[i], attempt.answers[i])).length;

  const submit = useCallback(async () => {
    if (sentRef.current) return;
    sentRef.current = true;
    setSubmitting(true);
    setErr("");
    const answers = {};
    for (const [k, v] of Object.entries(attempt.answers)) answers[k] = v && typeof v === "object" && !Array.isArray(v) ? { language: v.language, code: v.code } : v;
    try {
      const graded = await submitTest(test.id, {
        name: attempt.name,
        email: attempt.email,
        answers,
        timeTakenSec: Math.round((Date.now() - attempt.startedAt) / 1000),
      });
      onDone(graded);
    } catch (e) {
      sentRef.current = false;
      setSubmitting(false);
      setErr(`${e.message} Your answers are still saved here. Try submitting again.`);
    }
  }, [attempt, test.id, onDone]);

  const left = deadline ? Math.max(0, Math.round((deadline - now) / 1000)) : null;
  const submitRef = useRef(submit);
  useEffect(() => {
    submitRef.current = submit;
  }, [submit]);
  useEffect(() => {
    if (!deadline) return;
    // Ticks the clock; when time is up the test submits itself.
    const t = setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= deadline) submitRef.current();
    }, 1000);
    return () => clearInterval(t);
  }, [deadline]);

  const setAnswer = (value) => update((a) => ({ ...a, answers: { ...a.answers, [qi]: value } }));
  const go = (p) => update((a) => ({ ...a, current: Math.max(0, Math.min(order.length - 1, p)) }));
  const flagged = attempt.flagged.includes(qi);
  const toggleFlag = () => update((a) => ({ ...a, flagged: flagged ? a.flagged.filter((x) => x !== qi) : [...a.flagged, qi] }));

  function confirmSubmit() {
    const blank = order.length - answered;
    if (!confirm(blank ? `You have ${blank} unanswered question${blank === 1 ? "" : "s"}. Submit anyway?` : "Submit your test now?")) return;
    submit();
  }

  return (
    <section className="exam">
      <div className="exam-bar">
        <div className="wrap exam-bar-in">
          <div className="exam-title">
            <small>{TEST_TYPE_LABELS[test.type]}</small>
            <b>{test.title}</b>
          </div>
          <div className="exam-prog" aria-label={`${answered} of ${order.length} answered`}>
            <span>
              {answered}/{order.length} answered
            </span>
            <div className="bar2" style={{ margin: 0 }}>
              <b style={{ width: `${(answered / order.length) * 100}%` }} />
            </div>
          </div>
          {left !== null && (
            <div className={`timer ${left < 60 ? "low" : left < 300 ? "warn" : ""}`} role="timer">
              <Clock className="h-4 w-4" /> {clock(left)}
            </div>
          )}
          <button type="button" className="btn" onClick={confirmSubmit} disabled={submitting}>
            <Send className="h-4 w-4" /> {submitting ? "Evaluating…" : "Submit"}
          </button>
        </div>
      </div>

      <div className="wrap exam-grid">
        <aside className="qnav" aria-label="Questions">
          <b>Questions</b>
          <div className="qgrid">
            {order.map((i, p) => (
              <button
                type="button"
                key={i}
                className={[p === pos && "cur", isAnswered(test.questions[i], attempt.answers[i]) && "done", attempt.flagged.includes(i) && "flag"].filter(Boolean).join(" ")}
                onClick={() => go(p)}
                aria-label={`Question ${p + 1}`}
              >
                {p + 1}
              </button>
            ))}
          </div>
          <div className="legend">
            <span><i className="done" /> Answered</span>
            <span><i className="flag" /> For review</span>
            <span><i /> Not answered</span>
          </div>
          {submitting && <p className="note">Running your code and checking answers…</p>}
          {err && <p className="note bad">{err}</p>}
        </aside>

        <div className="qpane" key={qi}>
          <div className="qmeta">
            <span>
              Question {pos + 1} of {order.length}
            </span>
            <span className="tag">{KIND_LABELS[q.kind]}</span>
            <span className="tag free">+{q.marks}</span>
            {q.negative > 0 && <span className="tag adv">−{q.negative}</span>}
            <span style={{ flex: 1 }} />
            <button type="button" className={`chip ${flagged ? "on" : ""}`} onClick={toggleFlag}>
              <Bookmark className="h-3.5 w-3.5" style={{ display: "inline", verticalAlign: -2 }} /> {flagged ? "Marked for review" : "Mark for review"}
            </button>
          </div>

          {q.kind === "coding" ? (
            <CodingQuestion q={q} value={attempt.answers[qi]} onChange={setAnswer} />
          ) : (
            <div className="panel">
              <div className="qtext">{q.text}</div>
              <ChoiceInput q={q} value={attempt.answers[qi]} onChange={setAnswer} />
            </div>
          )}

          <div className="qfoot">
            <button type="button" className="btn ghost" onClick={() => go(pos - 1)} disabled={pos === 0}>
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            {q.kind !== "coding" && isAnswered(q, attempt.answers[qi]) && (
              <button type="button" className="linkish" onClick={() => setAnswer(undefined)}>
                Clear answer
              </button>
            )}
            {pos < order.length - 1 ? (
              <button type="button" className="btn" onClick={() => go(pos + 1)}>
                Next <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button type="button" className="btn" onClick={confirmSubmit} disabled={submitting}>
                Finish and submit
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ChoiceInput({ q, value, onChange }) {
  if (q.kind === "numeric")
    return (
      <div style={{ marginTop: 18, maxWidth: 280 }}>
        <label className="l" htmlFor="num-ans">Your answer</label>
        <input
          id="num-ans"
          className="inp"
          type="number"
          step="any"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? undefined : e.target.value)}
        />
      </div>
    );
  const multi = q.kind === "multi";
  const picked = multi ? (Array.isArray(value) ? value : []) : [value];
  return (
    <div className="choices">
      {multi && <p className="note">Select all that apply.</p>}
      {q.options.map((o, j) => {
        const on = picked.includes(j);
        return (
          <label key={j} className={`choice ${on ? "on" : ""}`}>
            <input
              type={multi ? "checkbox" : "radio"}
              name="choice"
              checked={on}
              onChange={() => onChange(multi ? (on ? picked.filter((x) => x !== j) : [...picked, j].sort()) : j)}
            />
            <span className="optl">{String.fromCharCode(65 + j)}</span>
            <span className="otext">{o}</span>
          </label>
        );
      })}
    </div>
  );
}

function CodingQuestion({ q, value, onChange }) {
  const isDark = useIsDark();
  const language = value?.language && q.languages.includes(value.language) ? value.language : q.languages[0];
  const drafts = value?.drafts || {};
  const code = drafts[language] ?? (value?.language === language ? value.code : undefined) ?? getLanguage(language).boilerplate;
  const [runs, setRuns] = useState(null);
  const [running, setRunning] = useState(false);
  const [custom, setCustom] = useState("");
  const [customOut, setCustomOut] = useState(null);
  const extensions = useMemo(() => [getLanguage(language).extension()], [language]);

  const write = (lang, nextCode) => onChange({ language: lang, code: nextCode, drafts: { ...drafts, [language]: code, [lang]: nextCode } });

  async function runSamples() {
    setRunning(true);
    setRuns(null);
    const out = [];
    for (const s of q.samples) {
      try {
        const r = await runCode({ language, code, stdin: s.input });
        const got = r.stdout ?? "";
        out.push({ ...s, got, err: r.stderr || (r.status === "ERROR" ? "Error" : ""), pass: normalize(got) === normalize(s.output) });
      } catch (e) {
        out.push({ ...s, got: "", err: e.message, pass: false });
      }
    }
    setRuns(out);
    setRunning(false);
  }

  async function runCustom() {
    setRunning(true);
    setCustomOut(null);
    try {
      const r = await runCode({ language, code, stdin: custom });
      setCustomOut((r.stdout || "") + (r.stderr ? `\n${r.stderr}` : "") || "(no output)");
    } catch (e) {
      setCustomOut(e.message);
    }
    setRunning(false);
  }

  return (
    <div className="codeq">
      <div className="panel codeq-statement">
        <div className="qtext">{q.text}</div>
        {q.samples.map((s, j) => (
          <div className="sample" key={j}>
            <b>Sample {j + 1}</b>
            <div className="two">
              <div>
                <small>Input</small>
                <pre>{s.input || "(empty)"}</pre>
              </div>
              <div>
                <small>Output</small>
                <pre>{s.output}</pre>
              </div>
            </div>
          </div>
        ))}
        <p className="note">Your code is also checked against {q.caseCount || q.samples.length} hidden test case{(q.caseCount || q.samples.length) === 1 ? "" : "s"}. Read from standard input and print to standard output.</p>
      </div>
      <div className="panel codeq-editor">
        <div className="edbar">
          <select className="inp" value={language} onChange={(e) => write(e.target.value, drafts[e.target.value] ?? getLanguage(e.target.value).boilerplate)} aria-label="Language" style={{ width: "auto" }}>
            {q.languages.map((l) => (
              <option key={l} value={l}>{LANG_LABELS[l]}</option>
            ))}
          </select>
          <span style={{ flex: 1 }} />
          <button type="button" className="btn ghost" onClick={runSamples} disabled={running || !q.samples.length}>
            <Play className="h-4 w-4" /> {running ? "Running…" : "Run samples"}
          </button>
        </div>
        <div className="cm">
          <CodeMirror value={code} height="360px" extensions={extensions} theme={isDark ? githubDark : githubLight} onChange={(v) => write(language, v)} />
        </div>
        {runs && (
          <div className="runs">
            <b>
              {runs.filter((r) => r.pass).length} of {runs.length} samples passed
            </b>
            {runs.map((r, j) => (
              <div key={j} className={`run ${r.pass ? "pass" : "fail"}`}>
                {r.pass ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                <span>Sample {j + 1}</span>
                {!r.pass && (
                  <pre>
                    {r.err ? r.err : `Expected:\n${r.output}\nGot:\n${r.got || "(no output)"}`}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
        <details className="custom">
          <summary>Run with custom input</summary>
          <textarea className="inp mono" rows={3} value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Input (stdin)" />
          <button type="button" className="btn ghost" style={{ marginTop: 8 }} onClick={runCustom} disabled={running}>
            Run
          </button>
          {customOut !== null && <pre className="out" style={{ marginTop: 10, minHeight: 0 }}>{customOut}</pre>}
        </details>
      </div>
    </div>
  );
}

function ResultView({ test, attempt, result, added }) {
  const pct = result.total ? Math.max(0, Math.round((result.score / result.total) * 100)) : 0;
  const correct = result.results.filter((r) => r.correct).length;
  const wrong = result.results.filter((r) => r.answered && !r.correct).length;
  const skipped = result.results.filter((r) => !r.answered).length;
  const showAnswer = (q, r) => {
    if (r.answer === undefined) return null;
    if (q.kind === "numeric") return String(r.answer);
    return r.answer.map((j) => `${String.fromCharCode(65 + j)}. ${q.options[j]}`).join(", ");
  };
  const mine = (q, a) => {
    if (!isAnswered(q, a)) return "Not answered";
    if (q.kind === "numeric") return String(a);
    if (q.kind === "single") return `${String.fromCharCode(65 + a)}. ${q.options[a]}`;
    if (q.kind === "multi") return a.map((j) => String.fromCharCode(65 + j)).join(", ");
    return LANG_LABELS[a.language];
  };

  return (
    <Page narrow={860}>
      <span className="eyebrow">Result</span>
      <h1 className="ptitle">{test.title}</h1>
      <div className="scorecard">
        <div className="ring" style={{ "--p": pct }}>
          <b>{pct}%</b>
        </div>
        <div>
          <h2 style={{ fontSize: 30 }}>
            {result.score} / {result.total} marks
          </h2>
          <p className="note" style={{ fontSize: 16 }}>
            Thanks, {attempt.name}. {correct} correct · {wrong} wrong · {skipped} not answered
          </p>
          {added === null ? (
            <p className="note">
              <Link to="/dashboard" style={{ color: "var(--color-accent)" }}>Log in on the Dashboard</Link> to track solved questions.
            </p>
          ) : (
            <p className="note ok">{added} added to your dashboard.</p>
          )}
        </div>
      </div>

      <h2 style={{ fontSize: 22, margin: "36px 0 14px" }}>Question breakdown</h2>
      {attempt.order.map((i, p) => {
        const q = test.questions[i];
        const r = result.results[i];
        return (
          <div className={`q review ${r.correct ? "good" : r.answered ? "wrong" : ""}`} key={i}>
            <div className="qmeta">
              <b>Q{p + 1}</b>
              <span className="tag">{KIND_LABELS[q.kind]}</span>
              <span style={{ flex: 1 }} />
              <b className={r.earned > 0 ? "ok" : r.earned < 0 ? "bad" : ""}>
                {r.earned > 0 ? "+" : ""}
                {r.earned} / {r.marks}
              </b>
            </div>
            <div className="qtext small">{q.text}</div>
            <div className="note">Your answer: {mine(q, attempt.answers[i])}</div>
            {q.kind === "coding" && r.answered && (
              <div className="note">
                Test cases passed: <b>{r.casesPassed}</b> of {r.casesTotal}
                {r.error && <pre className="out" style={{ minHeight: 0, marginTop: 8 }}>{r.error}</pre>}
              </div>
            )}
            {showAnswer(q, r) && !r.correct && <div className="note ok">Correct answer: {showAnswer(q, r)}</div>}
            {r.explanation && <div className="explain">{r.explanation}</div>}
          </div>
        );
      })}
      <div className="row" style={{ marginTop: 24 }}>
        <Link className="btn" to="/practice">More tests</Link>
        <Link className="btn ghost" to="/book">Book a mentor session</Link>
      </div>
    </Page>
  );
}
