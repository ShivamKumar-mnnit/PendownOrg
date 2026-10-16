import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, Bookmark, ChevronLeft, ChevronRight, Clock, Maximize, Send, Trophy } from "lucide-react";
import { Head, Page } from "../components/ui";
import { SignInPrompt } from "../components/AuthForms";
import { useAccount } from "../lib/account";
import { QUESTION_TYPES, fmtWhen, pct, studentApi, testWindow } from "../lib/dataService";
import { usePageSEO } from "../lib/seo";

// Server-hosted MCQ / numeric tests (data service). The attempt lives on the
// server: answers autosave as you go, the timer follows the server's clock and
// a refresh or another device resumes the same attempt.

const clock = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
};
const letter = (j) => String.fromCharCode(65 + j);
const answered = (q, a) => (q.type === "NUMERIC" ? a?.numericValue !== undefined && a?.numericValue !== null && a?.numericValue !== "" : a?.selected?.length > 0);

/** /exam/:testId and /t/:slug (share link). */
export default function Exam() {
  const { testId, slug } = useParams();
  const { user, loaded } = useAccount();
  const [view, setView] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(null);
  const nav = useNavigate();

  usePageSEO({ title: view?.title || "Test", description: "Take your Anobyt test.", path: slug ? `/t/${slug}` : `/exam/${testId}`, noindex: true });

  useEffect(() => {
    if (!user || user.mustChangePassword) return;
    let on = true;
    const load = slug ? studentApi.testBySlug(slug) : studentApi.tests().then((all) => all.find((t) => t.id === testId) || Promise.reject(new Error("This test isn't available to you. It may be closed, or not shared with your batch.")));
    load.then(
      (v) => on && setView(v),
      (e) => on && setError(e.message),
    );
    return () => {
      on = false;
    };
  }, [user, slug, testId]);

  if (!loaded) return <Page narrow={620}><p className="note">Loading…</p></Page>;
  if (!user)
    return (
      <Page narrow={520}>
        <Head title="Sign in to take this test">Your answers and score are saved to your account.</Head>
        <SignInPrompt next={slug ? `/t/${slug}` : `/exam/${testId}`} />
      </Page>
    );
  if (error)
    return (
      <Page narrow={620}>
        <Head title="Test unavailable">{error}</Head>
        <Link className="btn" to="/dashboard">
          Back to dashboard
        </Link>
      </Page>
    );
  if (!view) return <Page narrow={620}><p className="note">Loading the test…</p></Page>;
  if (attempt)
    return (
      <Taking
        attempt={attempt}
        onDone={(id) => nav(`/results/${id}`, { replace: true })}
      />
    );
  return <Intro view={view} onStart={setAttempt} />;
}

function Intro({ view, onStart }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const w = testWindow(view);
  const left = view.maxAttempts - view.attemptsUsed;
  const resume = !!view.inProgressAttemptId;

  async function start() {
    setErr("");
    setBusy(true);
    try {
      if (view.proctoring) await document.documentElement.requestFullscreen?.().catch(() => null);
      onStart(await studentApi.start(view.id));
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  }

  return (
    <Page narrow={760}>
      <span className="eyebrow">{view.proctoring ? "Proctored test" : "Test"}</span>
      <h1 className="ptitle">{view.title}</h1>
      {view.description && <p className="lead-p">{view.description}</p>}
      <div className="kpis">
        <div><b>{view.questionCount}</b><span>Questions</span></div>
        <div><b>{view.totalMarks ?? "—"}</b><span>Total marks</span></div>
        <div><b>{view.durationMinutes} min</b><span>Time limit</span></div>
        <div><b>{view.attemptsUsed}/{view.maxAttempts}</b><span>Attempts used</span></div>
      </div>
      <div className="panel">
        <h3 style={{ fontSize: 19 }}>Before you begin</h3>
        <ul className="ck">
          <li>The timer starts when you press Start and the test submits itself when time runs out.</li>
          <li>Your answers save to your account as you go. If the page closes, open the test again to resume.</li>
          {view.passPercentage != null && <li>Pass mark: {pct(view.passPercentage)}.</li>}
          {view.proctoring && (
            <li>
              <b>Proctored:</b> the test runs in full screen. Switching tabs or windows, leaving full screen, copying, pasting or right-clicking is recorded
              {view.maxViolations ? `, and after ${view.maxViolations} warnings the test submits automatically` : ""}.
            </li>
          )}
          {view.showLeaderboard && <li>A leaderboard is shown after you submit.</li>}
          <li>{w.text}.</li>
        </ul>
        {view.instructions && (
          <div className="explain" style={{ whiteSpace: "pre-wrap", marginTop: 14 }}>
            {view.instructions}
          </div>
        )}
        {err && <p className="note bad">{err}</p>}
        {w.state !== "open" ? (
          <p className="note">{w.state === "soon" ? "This test hasn't opened yet." : "This test has closed."}</p>
        ) : !resume && left <= 0 ? (
          <p className="note">You've used all your attempts for this test.</p>
        ) : (
          <button type="button" className="btn" style={{ marginTop: 20 }} onClick={start} disabled={busy}>
            {view.proctoring && <Maximize className="h-4 w-4" />} {busy ? "Starting…" : resume ? "Resume test" : "Start test"}
          </button>
        )}
      </div>
    </Page>
  );
}

function Taking({ attempt, onDone }) {
  const qs = attempt.questions;
  const [answers, setAnswers] = useState(() => Object.fromEntries((attempt.answers || []).map((a) => [a.questionId, { selected: a.selected || [], numericValue: a.numericValue }])));
  const [pos, setPos] = useState(0);
  const [flags, setFlags] = useState([]);
  const [saved, setSaved] = useState("saved"); // saved | dirty | saving | error
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [violations, setViolations] = useState({ count: attempt.violationCount || 0, last: "" });
  const [fullscreen, setFullscreen] = useState(!!document.fullscreenElement);
  // Server clock offset, so a wrong device clock can't stretch the timer.
  const [offset] = useState(() => new Date(attempt.serverTime).getTime() - Date.now());
  const [expiresAt, setExpiresAt] = useState(new Date(attempt.expiresAt).getTime());
  const [now, setNow] = useState(() => Date.now() + offset);
  const dirty = useRef(new Set());
  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  const doneRef = useRef(false);

  const payload = (ids) =>
    ids.map((id) => {
      const a = answersRef.current[id] || {};
      return { questionId: id, selected: a.selected || [], numericValue: a.numericValue === "" || a.numericValue === undefined ? null : Number(a.numericValue) };
    });

  const flush = useCallback(async () => {
    if (!dirty.current.size || doneRef.current) return;
    const ids = [...dirty.current];
    dirty.current.clear();
    setSaved("saving");
    try {
      const r = await studentApi.save(attempt.attemptId, payload(ids));
      if (r?.expiresAt) setExpiresAt(new Date(r.expiresAt).getTime());
      setSaved(dirty.current.size ? "dirty" : "saved");
    } catch {
      ids.forEach((id) => dirty.current.add(id));
      setSaved("error");
    }
  }, [attempt.attemptId]);

  const submit = useCallback(async () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setSubmitting(true);
    setErr("");
    try {
      // Send every answer with the submit, so nothing waiting for autosave is lost.
      const r = await studentApi.submit(attempt.attemptId, payload(qs.map((q) => q.id)));
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => null);
      onDone(r.attemptId || attempt.attemptId);
    } catch (e) {
      // Already submitted (time up on the server, or auto-submitted): show the result.
      if (e.status === 409) return onDone(attempt.attemptId);
      doneRef.current = false;
      setSubmitting(false);
      setErr(`${e.message} Your answers are saved. Try again.`);
    }
  }, [attempt.attemptId, qs, onDone]);

  // Autosave a moment after the last change, and every 20 s as a backstop.
  useEffect(() => {
    if (saved !== "dirty") return;
    const t = setTimeout(flush, 1200);
    return () => clearTimeout(t);
  }, [saved, answers, flush]);
  useEffect(() => {
    const t = setInterval(flush, 20000);
    return () => clearInterval(t);
  }, [flush]);

  // Timer; submits by itself when time is up.
  const submitRef = useRef(submit);
  useEffect(() => {
    submitRef.current = submit;
  }, [submit]);
  useEffect(() => {
    const t = setInterval(() => {
      const n = Date.now() + offset;
      setNow(n);
      if (n >= expiresAt) submitRef.current();
    }, 1000);
    return () => clearInterval(t);
  }, [expiresAt, offset]);

  // Warn before closing the tab with unsaved answers.
  useEffect(() => {
    const h = (e) => {
      if (!doneRef.current && dirty.current.size) {
        flush();
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [flush]);

  // Proctoring: report what the server counts as violations.
  useEffect(() => {
    if (!attempt.proctoring) return;
    let lastAt = 0;
    const report = (type, detail) => {
      if (doneRef.current) return;
      const t = Date.now();
      if (t - lastAt < 1500) return; // one action often fires several events
      lastAt = t;
      studentApi.event(attempt.attemptId, type, detail).then(
        (r) => {
          setViolations({ count: r.violationCount, last: type });
          if (r.autoSubmitted || r.status === "SUBMITTED") {
            doneRef.current = true;
            if (document.fullscreenElement) document.exitFullscreen?.().catch(() => null);
            onDone(attempt.attemptId);
          }
        },
        () => null,
      );
    };
    const onVis = () => document.visibilityState === "hidden" && report("TAB_SWITCH", "visibilitychange: hidden");
    const onBlur = () => setTimeout(() => document.visibilityState === "visible" && !document.hasFocus() && report("WINDOW_BLUR", "window lost focus"), 400);
    const onFs = () => {
      setFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement) report("FULLSCREEN_EXIT", "left full screen");
    };
    const block = (type) => (e) => {
      e.preventDefault();
      report(type, e.type);
    };
    const onCopy = block("COPY");
    const onPaste = block("PASTE");
    const onMenu = block("RIGHT_CLICK");
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFs);
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCopy);
    document.addEventListener("paste", onPaste);
    document.addEventListener("contextmenu", onMenu);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFs);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCopy);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("contextmenu", onMenu);
    };
  }, [attempt.proctoring, attempt.attemptId, onDone]);

  const q = qs[Math.min(pos, qs.length - 1)];
  const a = answers[q.id];
  const done = qs.filter((x) => answered(x, answers[x.id])).length;
  const left = Math.max(0, Math.round((expiresAt - now) / 1000));
  const set = (value) => {
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
    dirty.current.add(q.id);
    setSaved("dirty");
  };
  const go = (p) => setPos(Math.max(0, Math.min(qs.length - 1, p)));
  const flagged = flags.includes(q.id);

  function confirmSubmit() {
    const blank = qs.length - done;
    if (!confirm(blank ? `You have ${blank} unanswered question${blank === 1 ? "" : "s"}. Submit anyway?` : "Submit your test now?")) return;
    submit();
  }

  return (
    <section className="exam">
      <div className="exam-bar">
        <div className="wrap exam-bar-in">
          <div className="exam-title">
            <small>
              {saved === "saving" ? "Saving…" : saved === "error" ? "Not saved, retrying" : saved === "dirty" ? "Unsaved changes" : "All answers saved"}
            </small>
            <b>{attempt.testTitle}</b>
          </div>
          <div className="exam-prog" aria-label={`${done} of ${qs.length} answered`}>
            <span>
              {done}/{qs.length} answered
            </span>
            <div className="bar2" style={{ margin: 0 }}>
              <b style={{ width: `${(done / qs.length) * 100}%` }} />
            </div>
          </div>
          <div className={`timer ${left < 60 ? "low" : left < 300 ? "warn" : ""}`} role="timer">
            <Clock className="h-4 w-4" /> {clock(left)}
          </div>
          <button type="button" className="btn" onClick={confirmSubmit} disabled={submitting}>
            <Send className="h-4 w-4" /> {submitting ? "Submitting…" : "Submit"}
          </button>
        </div>
      </div>

      {attempt.proctoring && (violations.count > 0 || !fullscreen) && (
        <div className="wrap" style={{ marginTop: 14 }}>
          <div className="panel" style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", borderColor: "var(--ab-bad)" }}>
            <AlertTriangle className="h-5 w-5 bad" />
            <span style={{ flex: 1, minWidth: 200 }}>
              {violations.count > 0 && (
                <>
                  Warning {violations.count}
                  {attempt.maxViolations ? ` of ${attempt.maxViolations}` : ""}: stay on this tab and in full screen.{" "}
                </>
              )}
              {!fullscreen && "You're out of full screen."}
            </span>
            {!fullscreen && (
              <button type="button" className="btn ghost" onClick={() => document.documentElement.requestFullscreen?.().catch(() => null)}>
                <Maximize className="h-4 w-4" /> Back to full screen
              </button>
            )}
          </div>
        </div>
      )}

      <div className="wrap exam-grid">
        <aside className="qnav" aria-label="Questions">
          <b>Questions</b>
          <div className="qgrid">
            {qs.map((x, p) => (
              <button
                type="button"
                key={x.id}
                className={[p === pos && "cur", answered(x, answers[x.id]) && "done", flags.includes(x.id) && "flag"].filter(Boolean).join(" ")}
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
          {err && <p className="note bad">{err}</p>}
        </aside>

        <div className="qpane" key={q.id}>
          <div className="qmeta">
            <span>
              Question {pos + 1} of {qs.length}
            </span>
            <span className="tag">{QUESTION_TYPES[q.type]}</span>
            <span className="tag free">+{q.marks}</span>
            {q.negativeMarks > 0 && <span className="tag adv">−{q.negativeMarks}</span>}
            <span style={{ flex: 1 }} />
            <button type="button" className={`chip ${flagged ? "on" : ""}`} onClick={() => setFlags(flagged ? flags.filter((x) => x !== q.id) : [...flags, q.id])}>
              <Bookmark className="h-3.5 w-3.5" style={{ display: "inline", verticalAlign: -2 }} /> {flagged ? "Marked for review" : "Mark for review"}
            </button>
          </div>

          <div className="panel">
            <div className="qtext" style={{ whiteSpace: "pre-wrap" }}>{q.text}</div>
            {q.type === "NUMERIC" ? (
              <div style={{ marginTop: 18, maxWidth: 280 }}>
                <label className="l" htmlFor="num-ans">Your answer</label>
                <input
                  id="num-ans"
                  className="inp"
                  type="number"
                  step="any"
                  value={a?.numericValue ?? ""}
                  onChange={(e) => set({ selected: [], numericValue: e.target.value })}
                />
              </div>
            ) : (
              <div className="choices">
                {q.type === "MULTIPLE" && <p className="note">Select all that apply. No partial marks.</p>}
                {q.options.map((o, j) => {
                  const picked = a?.selected || [];
                  const on = picked.includes(j);
                  return (
                    <label key={j} className={`choice ${on ? "on" : ""}`}>
                      <input
                        type={q.type === "MULTIPLE" ? "checkbox" : "radio"}
                        name={`q-${q.id}`}
                        checked={on}
                        onChange={() => set({ selected: q.type === "MULTIPLE" ? (on ? picked.filter((x) => x !== j) : [...picked, j].sort((m, n) => m - n)) : [j] })}
                      />
                      <span className="optl">{letter(j)}</span>
                      <span className="otext">{o}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="qfoot">
            <button type="button" className="btn ghost" onClick={() => go(pos - 1)} disabled={pos === 0}>
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            {answered(q, a) && (
              <button type="button" className="linkish" onClick={() => set({ selected: [], numericValue: null })}>
                Clear answer
              </button>
            )}
            {pos < qs.length - 1 ? (
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

/** /results/:attemptId, opened right after submitting and from the dashboard. */
export function Result() {
  const { attemptId } = useParams();
  const { user, loaded } = useAccount();
  const [r, setR] = useState(null);
  const [err, setErr] = useState("");
  const [board, setBoard] = useState(null);

  usePageSEO({ title: r?.testTitle ? `${r.testTitle}: result` : "Result", description: "Your test result.", path: `/results/${attemptId}`, noindex: true });

  useEffect(() => {
    if (!user) return;
    let on = true;
    studentApi.attempt(attemptId).then(
      (d) => {
        if (!on) return;
        setR(d);
        studentApi.leaderboard(d.testId).then(
          (b) => on && setBoard(b),
          () => null,
        );
      },
      (e) => on && setErr(e.message),
    );
    return () => {
      on = false;
    };
  }, [attemptId, user]);

  if (!loaded) return <Page narrow={620}><p className="note">Loading…</p></Page>;
  if (!user) return <Page narrow={520}><SignInPrompt next={`/results/${attemptId}`} text="Sign in to see your result." /></Page>;
  if (err)
    return (
      <Page narrow={620}>
        <Head title="Result unavailable">{err}</Head>
        <Link className="btn" to="/dashboard">Back to dashboard</Link>
      </Page>
    );
  if (!r) return <Page narrow={620}><p className="note">Loading your result…</p></Page>;

  const p = Math.max(0, Math.round(r.percentage ?? 0));
  return (
    <Page narrow={860}>
      <span className="eyebrow">Result · attempt {r.attemptNumber}</span>
      <h1 className="ptitle">{r.testTitle}</h1>
      <div className="scorecard">
        <div className="ring" style={{ "--p": p }}>
          <b>{p}%</b>
        </div>
        <div>
          <h2 style={{ fontSize: 30 }}>
            {r.score ?? 0} / {r.maxScore ?? "—"} marks
          </h2>
          <p className="note" style={{ fontSize: 16 }}>
            {r.correctCount ?? 0} correct · {r.attemptedCount ?? 0} attempted · {r.totalQuestions} questions
          </p>
          {r.passed !== null && r.passed !== undefined && <p className={`note ${r.passed ? "ok" : "bad"}`} style={{ fontWeight: 600 }}>{r.passed ? "Passed" : "Not passed this time"}</p>}
          {r.rank && (
            <p className="note">
              Rank {r.rank} of {r.candidates}
              {r.percentile != null ? ` · ${Math.round(r.percentile)}th percentile` : ""}
            </p>
          )}
          {r.autoSubmitReason && <p className="note bad">Submitted automatically: {r.autoSubmitReason}</p>}
          <p className="note" style={{ fontSize: 13 }}>Submitted {fmtWhen(r.submittedAt)}</p>
        </div>
      </div>

      {board && <Leaderboard board={board} />}

      {r.answersRevealed && r.questions?.length ? (
        <>
          <h2 style={{ fontSize: 22, margin: "36px 0 14px" }}>Question breakdown</h2>
          {r.questions.map((q, i) => {
            const skipped = !(q.selected?.length || (q.numericValue !== null && q.numericValue !== undefined));
            const mine = skipped ? "Not answered" : q.type === "NUMERIC" ? String(q.numericValue) : q.selected.map((j) => `${letter(j)}. ${q.options[j]}`).join(", ");
            const right = q.type === "NUMERIC" ? (q.numericAnswer != null ? String(q.numericAnswer) : "") : (q.correctOptions || []).map((j) => `${letter(j)}. ${q.options[j]}`).join(", ");
            return (
              <div className={`q review ${q.correct ? "good" : skipped ? "" : "wrong"}`} key={q.questionId}>
                <div className="qmeta">
                  <b>Q{i + 1}</b>
                  <span className="tag">{QUESTION_TYPES[q.type]}</span>
                  <span style={{ flex: 1 }} />
                  <b className={q.marksAwarded > 0 ? "ok" : q.marksAwarded < 0 ? "bad" : ""}>
                    {q.marksAwarded > 0 ? "+" : ""}
                    {q.marksAwarded ?? 0}
                  </b>
                </div>
                <div className="qtext small" style={{ whiteSpace: "pre-wrap" }}>{q.text}</div>
                <div className="note">Your answer: {mine}</div>
                {!q.correct && right && <div className="note ok">Correct answer: {right}</div>}
                {q.explanation && <div className="explain">{q.explanation}</div>}
              </div>
            );
          })}
        </>
      ) : (
        <p className="note" style={{ marginTop: 24 }}>Answers for this test aren't shown to students.</p>
      )}
      <div className="row" style={{ marginTop: 24 }}>
        <Link className="btn" to="/dashboard">Back to dashboard</Link>
        <Link className="btn ghost" to="/book">Book a mentor session</Link>
      </div>
    </Page>
  );
}

function Leaderboard({ board }) {
  const youInTop = board.top?.some((e) => e.you);
  return (
    <div className="panel" style={{ marginTop: 28, padding: 8 }}>
      <b style={{ display: "flex", gap: 8, alignItems: "center", padding: "10px 14px" }}>
        <Trophy className="h-4 w-4" /> Leaderboard · {board.candidates} candidate{board.candidates === 1 ? "" : "s"}
      </b>
      {[...(board.top || []), ...(!youInTop && board.you ? [board.you] : [])].map((e) => (
        <div
          key={e.studentId + e.rank}
          style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, ...(e.you ? { background: "var(--ab-soft)", fontWeight: 600 } : {}) }}
        >
          <span>
            #{e.rank} {e.studentName}
            {e.you ? " (you)" : ""}
          </span>
          <span>{pct(e.percentage)}</span>
        </div>
      ))}
    </div>
  );
}
