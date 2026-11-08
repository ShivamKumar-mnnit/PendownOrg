import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import CodeMirror from "@uiw/react-codemirror";
import { githubDark, githubLight } from "@uiw/codemirror-theme-github";
import {
  AlertTriangle, ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Clock, Code2, Copy, Crown, FileText, History, Loader2, Lock, Maximize2, Minimize2,
  Flag, Play, RotateCcw, Send, Timer, XCircle,
} from "lucide-react";
import Logo from "../../components/Logo";
import ThemeToggle from "../../components/ThemeToggle";
import RichText from "../../components/RichText";
import UpgradeModal from "../../components/codevita/UpgradeModal";
import { useAccount } from "../../lib/account";
import { getLanguage } from "../../lib/editorLanguages";
import { useIsDark } from "../../lib/useIsDark";
import { usePageSEO } from "../../lib/seo";
import { CV_LANGS, CV_LANG_NAMES, STARTERS, STATUS_TONE, VERDICTS, clock, fmtKb, fmtMs } from "../../lib/codevita/common";
import { cvMine, cvRun, submitAndJudge, useCv } from "../../lib/codevita/api";
import "./codevita.css";

const store = {
  get(k) {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k, v) {
    try {
      if (v === null) localStorage.removeItem(k);
      else localStorage.setItem(k, v);
    } catch {
      /* storage blocked: the draft lives for this page only */
    }
  },
};
const draftKey = (id, lang) => `anobyt_cv_draft:${id}:${lang}`;
const dClass = (d) => (d === "Easy" ? "easy" : d === "Medium" ? "med" : "hard");

/** /courses/tcs-codevita/solve/:id: the full-screen coding round. */
export default function Arena() {
  const { id } = useParams();
  const [bump, setBump] = useState(0);
  const { data, error } = useCv(`/api/cv/problems/${encodeURIComponent(id)}`, bump);
  const [params] = useSearchParams();
  const mockId = params.get("mock") || "";
  const mockRes = useCv(mockId ? `/api/cv/mocks/${encodeURIComponent(mockId)}` : null, bump);
  usePageSEO({ title: data?.item?.title ? `${data.item.title} · CodeVita practice` : "CodeVita practice", description: "Solve a CodeVita-style problem.", path: `/courses/tcs-codevita/solve/${id}`, noindex: true });

  if (error)
    return (
      <div className="cv-arena-msg">
        <p>{error}</p>
        <Link className="btn" to="/courses/tcs-codevita">
          Back to the question bank
        </Link>
      </div>
    );
  if (!data || (mockId && mockRes.loading && !mockRes.error))
    return (
      <div className="cv-arena-msg">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading the problem…
      </div>
    );
  if (data.locked) return <LockedProblem d={data} onUnlocked={() => setBump((n) => n + 1)} />;
  // Mock mode only while that test is running and this problem is part of it.
  const md = mockRes.data;
  const live = md?.attempt && !md.attempt.finishedAt && md.attempt.endsAt > md.now && md.problems.some((x) => x.id === data.item.id);
  const mock = live ? { id: mockId, title: md.mock.title, endsAt: md.attempt.endsAt, offset: md.now - Date.now(), problems: md.problems } : null;
  return <Round key={data.item.id + (mock ? ":" + mock.id : "")} d={data} mock={mock} />;
}

function LockedProblem({ d, onUnlocked }) {
  const [open, setOpen] = useState(true);
  const p = d.item;
  return (
    <div className="cv-arena-msg locked">
      <span className={`cv-diff ${dClass(p.difficulty)}`}>{p.difficulty}</span>
      <h1>{p.title}</h1>
      <p className="cv-muted">{p.teaser}…</p>
      <p>
        <Lock className="h-4 w-4" style={{ display: "inline", verticalAlign: -2 }} /> This problem is part of the full crash course.
      </p>
      <div className="row" style={{ justifyContent: "center", gap: 10 }}>
        <button type="button" className="btn" onClick={() => setOpen(true)}>
          <Crown className="h-4 w-4" /> See what premium includes
        </button>
        <Link className="btn ghost" to="/courses/tcs-codevita?access=free">
          Back to free problems
        </Link>
      </div>
      {open && <UpgradeModal plan={d.plan} problem={p} onClose={() => setOpen(false)} onDone={onUnlocked} />}
    </div>
  );
}

function Round({ d, mock }) {
  const p = d.item;
  const { user } = useAccount();
  const isDark = useIsDark();
  const rootRef = useRef(null);

  // ---- Language and code (autosaved per problem and language) ----
  const langs = CV_LANGS;
  const [lang, setLang] = useState(() => (langs.includes(store.get("anobyt_cv_lang")) ? store.get("anobyt_cv_lang") : "cpp"));
  const [codes, setCodes] = useState({});
  const code = codes[lang] ?? store.get(draftKey(p.id, lang)) ?? STARTERS[lang];
  const [saved, setSaved] = useState("");
  const saveTimer = useRef(null);
  const extensions = useMemo(() => [getLanguage(lang).extension()], [lang]);
  function setCode(v) {
    setCodes((c) => ({ ...c, [lang]: v }));
    setSaved("Saving…");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      store.set(draftKey(p.id, lang), v);
      setSaved("Saved");
    }, 500);
  }
  function pickLang(l) {
    setLang(l);
    store.set("anobyt_cv_lang", l);
  }
  function reset() {
    if (!window.confirm?.(`Reset your ${CV_LANG_NAMES[lang]} code to the starter template?`)) return;
    setCodes((c) => ({ ...c, [lang]: STARTERS[lang] }));
    store.set(draftKey(p.id, lang), null);
  }

  // ---- Timer: a stopwatch, or a countdown for timed practice ----
  const timerKey = `anobyt_cv_timer:${p.id}`;
  const [timed, setTimed] = useState(() => {
    try {
      const t = JSON.parse(store.get(timerKey));
      return t && t.endAt > Date.now() ? t : null;
    } catch {
      return null;
    }
  });
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [timeUp, setTimeUp] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = mock ? Math.max(0, Math.round((mock.endsAt - (now + mock.offset)) / 1000)) : timed ? Math.max(0, Math.round((timed.endAt - now) / 1000)) : null;
  useEffect(() => {
    if ((timed || mock) && left === 0 && !timeUp) setTimeUp(true);
  }, [timed, mock, left, timeUp]);
  const elapsedSec = Math.round((now - (timed ? timed.endAt - timed.minutes * 60000 : startedAt)) / 1000);
  function startTimed(minutes) {
    const t = { minutes, endAt: Date.now() + minutes * 60000 };
    setTimed(t);
    setTimeUp(false);
    store.set(timerKey, JSON.stringify(t));
  }
  function stopTimed() {
    setTimed(null);
    setTimeUp(false);
    store.set(timerKey, null);
  }
  const [timerMenu, setTimerMenu] = useState(false);

  // ---- Fullscreen ----
  const [fs, setFs] = useState(false);
  useEffect(() => {
    const on = () => setFs(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);
  const toggleFs = () => (document.fullscreenElement ? document.exitFullscreen?.() : rootRef.current?.requestFullscreen?.())?.catch?.(() => null);

  // ---- Split panes ----
  const [split, setSplit] = useState(() => Number(store.get("anobyt_cv_split")) || 42);
  const [consoleH, setConsoleH] = useState(() => Number(store.get("anobyt_cv_console")) || 34);
  const dragging = useRef(null);
  const onDrag = useCallback((e) => {
    const box = rootRef.current?.querySelector(".cv-panes")?.getBoundingClientRect();
    if (!box || !dragging.current) return;
    if (dragging.current === "x") setSplit(Math.min(70, Math.max(25, ((e.clientX - box.left) / box.width) * 100)));
    else {
      const right = rootRef.current.querySelector(".cv-right").getBoundingClientRect();
      setConsoleH(Math.min(70, Math.max(16, ((right.bottom - e.clientY) / right.height) * 100)));
    }
  }, []);
  useEffect(() => {
    const up = () => {
      if (!dragging.current) return;
      dragging.current = null;
      document.body.classList.remove("cv-dragging");
      store.set("anobyt_cv_split", String(Math.round(split)));
      store.set("anobyt_cv_console", String(Math.round(consoleH)));
    };
    window.addEventListener("pointermove", onDrag);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", onDrag);
      window.removeEventListener("pointerup", up);
    };
  }, [onDrag, split, consoleH]);
  const startDrag = (axis) => (e) => {
    e.preventDefault();
    dragging.current = axis;
    document.body.classList.add("cv-dragging");
  };

  // ---- Run and submit ----
  const [leftTab, setLeftTab] = useState("problem");
  const [mobilePane, setMobilePane] = useState("problem");
  const [conTab, setConTab] = useState("input");
  const [useCustom, setUseCustom] = useState(false);
  const [stdin, setStdin] = useState(p.samples[0]?.input || "");
  const [busy, setBusy] = useState("");
  const [runOut, setRunOut] = useState(null);
  const [sampleOut, setSampleOut] = useState(null);
  const [sub, setSub] = useState(null);
  const [err, setErr] = useState("");
  const [subsBump, setSubsBump] = useState(0);

  async function run() {
    setErr("");
    setBusy("run");
    setMobilePane("code");
    try {
      if (useCustom) {
        const r = await cvRun({ id: p.id, language: lang, code, stdin, mode: "custom" });
        setRunOut({ ...r.result, limitMs: r.limitMs });
        setConTab("output");
      } else {
        const r = await cvRun({ id: p.id, language: lang, code, mode: "samples" });
        setSampleOut(r);
        setConTab("results");
        setSub(null);
      }
    } catch (e) {
      setErr(e.message);
      setConTab(useCustom ? "output" : "results");
    }
    setBusy("");
  }

  async function submit() {
    setErr("");
    if (!user) {
      setErr("signin");
      setConTab("results");
      return;
    }
    setBusy("submit");
    setTimeUp(false);
    setMobilePane("code");
    setConTab("results");
    setSampleOut(null);
    setSub({ pending: true, cases: [] });
    try {
      const done = await submitAndJudge({ id: p.id, language: lang, code, elapsedSec, timedMinutes: mock ? 0 : timed?.minutes || 0, ...(mock ? { mock: mock.id } : {}) }, (s) => setSub(s));
      setSub(done);
      setSubsBump((n) => n + 1);
      if (timed && !mock) stopTimed();
    } catch (e) {
      setErr(e.message);
      setSub(null);
    }
    setBusy("");
  }

  // Ctrl/Cmd+Enter runs, Ctrl/Cmd+Shift+Enter submits (like most judges).
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !busy) {
        e.preventDefault();
        if (e.shiftKey) submit();
        else run();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const leftTabs = [
    ["problem", "Problem", FileText],
    !mock && !p.inMock && ["editorial", "Editorial", Code2],
    ["subs", "Submissions", History],
  ].filter(Boolean);
  // Previous / Next stay inside the mock test while one is running.
  const mi = mock ? mock.problems.findIndex((x) => x.id === p.id) : -1;
  const mockLink = (x) => x && { to: `/courses/tcs-codevita/solve/${x.id}?mock=${encodeURIComponent(mock.id)}`, title: x.title };
  const nav = mock
    ? { prev: mockLink(mock.problems[mi - 1]), next: mockLink(mock.problems[mi + 1]) }
    : { prev: d.prev && { to: `/courses/tcs-codevita/solve/${d.prev.id}`, title: d.prev.title }, next: d.next && { to: `/courses/tcs-codevita/solve/${d.next.id}`, title: d.next.title } };
  const back = mock ? `/courses/tcs-codevita/mock/${encodeURIComponent(mock.id)}` : "/courses/tcs-codevita";

  return (
    <div ref={rootRef} className={`cv-arena${fs ? " is-fs" : ""}`} style={{ "--cv-split": `${split}%`, "--cv-console": `${consoleH}%` }}>
      <header className="cv-topbar">
        <div className="cv-top-left">
          <Link to={back} className="cv-back" title={mock ? "Back to the mock test" : "Back to the course"}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Link to="/" className="cv-brand" aria-label="Anobyt home">
            <Logo showText={false} badgeClassName="h-7 w-7" />
          </Link>
          <div className="cv-top-title">
            <small>{mock ? mock.title : "CodeVita practice"}</small>
            <b title={p.title}>{p.title}</b>
          </div>
          <span className={`cv-diff ${dClass(p.difficulty)} hide-sm`}>{p.difficulty}</span>
        </div>
        <div className="cv-top-right">
          {mock && (
            <nav className="cv-mock-chips hide-sm" aria-label="Mock test problems">
              {mock.problems.map((x, i) => (
                <Link key={x.id} to={`/courses/tcs-codevita/solve/${x.id}?mock=${encodeURIComponent(mock.id)}`} className={`${x.id === p.id ? "on" : ""}${x.status === "Accepted" ? " ok" : ""}`} title={x.title}>
                  {String.fromCharCode(65 + i)}
                </Link>
              ))}
            </nav>
          )}
          {mock ? (
            <Link to={back} className={`cv-timer on${left < 600 ? " low" : ""}`} title="Time left in the mock test">
              <Timer className="h-4 w-4" />
              <span>{clock(left)}</span>
            </Link>
          ) : (
          <div className="cv-timer-wrap">
            <button type="button" className={`cv-timer${timed ? " on" : ""}${left !== null && left < 300 ? " low" : ""}`} onClick={() => setTimerMenu(!timerMenu)} title={timed ? "Timed practice" : "Time on this problem"}>
              {timed ? <Timer className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              <span>{timed ? clock(left) : clock(elapsedSec)}</span>
            </button>
            {timerMenu && (
              <div className="cv-menu" onMouseLeave={() => setTimerMenu(false)}>
                <small>Timed practice</small>
                {[30, 45, 60, 90].map((m) => (
                  <button key={m} type="button" onClick={() => (startTimed(m), setTimerMenu(false))}>
                    {m} minutes
                  </button>
                ))}
                {timed && (
                  <button type="button" className="bad" onClick={() => (stopTimed(), setTimerMenu(false))}>
                    Stop the timer
                  </button>
                )}
              </div>
            )}
          </div>
          )}
          <ThemeToggle className="cv-icon-btn" />
          <button type="button" className="cv-icon-btn hide-sm" onClick={toggleFs} title={fs ? "Exit full screen" : "Full screen"} aria-label={fs ? "Exit full screen" : "Full screen"}>
            {fs ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <div className="cv-mobile-switch" role="tablist">
        {[
          ["problem", "Problem"],
          ["code", "Code"],
        ].map(([k, l]) => (
          <button key={k} type="button" className={mobilePane === k ? "on" : ""} onClick={() => setMobilePane(k)}>
            {l}
          </button>
        ))}
      </div>

      <div className={`cv-panes show-${mobilePane}`}>
        <section className="cv-left">
          <nav className="cv-ltabs" role="tablist">
            {leftTabs.map(([k, l, Icon]) => (
              <button key={k} type="button" role="tab" aria-selected={leftTab === k} className={leftTab === k ? "on" : ""} onClick={() => setLeftTab(k)}>
                <Icon className="h-4 w-4" /> {l}
              </button>
            ))}
          </nav>
          <div className="cv-left-body">
            {leftTab === "problem" && <Statement p={p} />}
            {leftTab === "editorial" && <Editorial p={p} premium={d.premium} />}
            {leftTab === "subs" && <ProblemSubs pid={p.id} signedIn={Boolean(user)} bump={subsBump} />}
          </div>
          <div className="cv-left-foot">
            {nav.prev ? (
              <Link to={nav.prev.to} title={nav.prev.title}>
                <ChevronLeft className="h-4 w-4" /> Previous
              </Link>
            ) : (
              <span />
            )}
            {nav.next && (
              <Link to={nav.next.to} title={nav.next.title}>
                Next <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </section>

        <div className="cv-gutter-x" onPointerDown={startDrag("x")} role="separator" aria-orientation="vertical" aria-label="Resize panels" />

        <section className="cv-right">
          <div className="cv-editor-bar">
            <select className="cv-lang" value={lang} onChange={(e) => pickLang(e.target.value)} aria-label="Language">
              {langs.map((l) => (
                <option key={l} value={l}>
                  {CV_LANG_NAMES[l]}
                </option>
              ))}
            </select>
            <span className="cv-saved">{saved || "Autosave on"}</span>
            <span className="cv-limits hide-sm">
              Time {p.timeLimit}s{lang === "java" || lang === "python" ? " (extra for " + CV_LANG_NAMES[lang] + ")" : ""} · Memory {p.memoryLimit} MB
            </span>
            <button type="button" className="cv-icon-btn" onClick={reset} title="Reset to the starter code" aria-label="Reset code">
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
          <div className="cv-editor">
            <CodeMirror
              value={code}
              height="100%"
              theme={isDark ? githubDark : githubLight}
              extensions={extensions}
              onChange={setCode}
              basicSetup={{ tabSize: 4 }}
              aria-label={`${CV_LANG_NAMES[lang]} code editor`}
            />
          </div>
          <div className="cv-gutter-y" onPointerDown={startDrag("y")} role="separator" aria-orientation="horizontal" aria-label="Resize console" />
          <div className="cv-console">
            <div className="cv-con-tabs">
              {[
                ["input", "Custom input"],
                ["output", "Output"],
                ["results", "Test results"],
              ].map(([k, l]) => (
                <button key={k} type="button" className={conTab === k ? "on" : ""} onClick={() => setConTab(k)}>
                  {l}
                  {k === "results" && sub?.result ? <i className={`dot tone-${STATUS_TONE[sub.result.status]}`} /> : null}
                </button>
              ))}
            </div>
            <div className="cv-con-body">
              {conTab === "input" && (
                <div className="cv-input">
                  <textarea value={stdin} onChange={(e) => setStdin(e.target.value)} spellCheck={false} aria-label="Custom input" placeholder="Type the input your program should read" />
                  <small>Tick "Use custom input" below, then Run, to see what your program prints for this input.</small>
                </div>
              )}
              {conTab === "output" && <CustomOutput r={runOut} err={err} busy={busy === "run" && useCustom} />}
              {conTab === "results" && <Results sampleOut={sampleOut} sub={sub} err={err} busy={busy} />}
            </div>
            <div className="cv-actions">
              <label className="cv-check">
                <input type="checkbox" checked={useCustom} onChange={(e) => (setUseCustom(e.target.checked), e.target.checked && setConTab("input"))} /> Use custom input
              </label>
              <span className="cv-keys hide-sm">Ctrl+Enter to run</span>
              <button type="button" className="btn ghost" onClick={run} disabled={Boolean(busy)}>
                {busy === "run" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Run
              </button>
              <button type="button" className="btn" onClick={submit} disabled={Boolean(busy)}>
                {busy === "submit" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Submit
              </button>
            </div>
          </div>
        </section>
      </div>

      {timeUp && mock && (
        <div className="cv-modal-back">
          <div className="cv-modal small" role="alertdialog" aria-labelledby="cv-tu">
            <Flag className="h-6 w-6" />
            <h2 id="cv-tu">The mock test is over</h2>
            <p className="cv-muted">Time ran out on {mock.title}. Your best submissions are scored and your report is ready. Editorials for these problems are open now.</p>
            <div className="row" style={{ gap: 10, justifyContent: "center" }}>
              <Link className="btn" to={back}>
                <Flag className="h-4 w-4" /> See my report
              </Link>
            </div>
          </div>
        </div>
      )}
      {timeUp && !mock && (
        <div className="cv-modal-back">
          <div className="cv-modal small" role="alertdialog" aria-labelledby="cv-tu">
            <Timer className="h-6 w-6" />
            <h2 id="cv-tu">Time's up</h2>
            <p className="cv-muted">Your {timed?.minutes}-minute session is over. Submit what you have to get your scorecard, or keep going without the timer.</p>
            <div className="row" style={{ gap: 10, justifyContent: "center" }}>
              <button type="button" className="btn" onClick={submit}>
                <Send className="h-4 w-4" /> Submit now
              </button>
              <button type="button" className="btn ghost" onClick={stopTimed}>
                Keep practising
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Statement({ p }) {
  return (
    <article className="cv-statement">
      <h1>{p.title}</h1>
      <div className="cv-meta">
        <span className={`cv-diff ${dClass(p.difficulty)}`}>{p.difficulty}</span>
        <span className={`cv-pill ${p.access === "free" ? "good" : "gold-soft"}`}>{p.access === "free" ? "Free" : "Premium"}</span>
        <span>{p.points} points</span>
        {p.topics.map((t) => (
          <span key={t} className="cv-tag">
            {t}
          </span>
        ))}
      </div>
      <h3>Problem description</h3>
      <RichText text={p.statement} />
      {p.inputFormat && (
        <>
          <h3>Input</h3>
          <RichText text={p.inputFormat} />
        </>
      )}
      {p.outputFormat && (
        <>
          <h3>Output</h3>
          <RichText text={p.outputFormat} />
        </>
      )}
      {p.constraints && (
        <>
          <h3>Constraints</h3>
          <pre className="cv-pre">{p.constraints}</pre>
        </>
      )}
      <h3>Time limit</h3>
      <p>
        {p.timeLimit} second{p.timeLimit === 1 ? "" : "s"} (Java and Python get extra time) · Memory {p.memoryLimit} MB
      </p>
      {p.samples.map((s, i) => (
        <div key={i} className="cv-sample">
          <h3>Example {i + 1}</h3>
          <div className="cv-io">
            <div>
              <small>Input</small>
              <SamplePre text={s.input} />
            </div>
            <div>
              <small>Output</small>
              <SamplePre text={s.output} />
            </div>
          </div>
          {s.explanation && (
            <div className="cv-explain">
              <b>Explanation</b>
              <RichText text={s.explanation} />
            </div>
          )}
        </div>
      ))}
      <p className="cv-note">Submit runs your code on {p.samples.length} sample and {p.caseCount} hidden test cases.</p>
    </article>
  );
}

function SamplePre({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="cv-pre-wrap">
      <pre className="cv-pre">{text}</pre>
      <button
        type="button"
        className="cv-copy"
        title="Copy"
        onClick={() =>
          navigator.clipboard?.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          })
        }
      >
        {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

function Editorial({ p }) {
  const [shown, setShown] = useState(false);
  const [solLang, setSolLang] = useState(p.solutionLangs.includes("cpp") ? "cpp" : p.solutionLangs[0]);
  if (!p.editorial) return <p className="cv-note">The editorial for this problem is part of the full crash course.</p>;
  const e = p.editorial;
  if (!shown)
    return (
      <div className="cv-spoiler">
        <Code2 className="h-6 w-6" />
        <b>Try it yourself first</b>
        <p className="cv-muted">You learn the most from an honest attempt. Use the hints if you're stuck, then open the full editorial.</p>
        {p.hints?.length > 0 && <Hints hints={p.hints} />}
        <button type="button" className="btn ghost" onClick={() => setShown(true)}>
          Show the editorial
        </button>
      </div>
    );
  const sections = [
    ["Key idea", e.idea],
    ["Brute-force approach", e.brute],
    ["Improved approach", e.better],
    ["Optimal approach", e.optimal],
    ["Dry run", e.dryRun],
    ["Common mistakes", e.mistakes],
    ["Edge cases", e.edgeCases],
  ].filter(([, t]) => t);
  return (
    <article className="cv-statement cv-editorial">
      <h1>Editorial</h1>
      {sections.map(([t, body]) => (
        <section key={t}>
          <h3>{t}</h3>
          <RichText text={body} />
        </section>
      ))}
      {(p.complexity?.time || p.complexity?.space) && (
        <section>
          <h3>Complexity</h3>
          <div className="cv-cx">
            <div>
              <small>Time</small>
              <b>{p.complexity.time || "—"}</b>
            </div>
            <div>
              <small>Space</small>
              <b>{p.complexity.space || "—"}</b>
            </div>
          </div>
        </section>
      )}
      {p.solutionLangs.length > 0 && (
        <section>
          <h3>Solutions</h3>
          <div className="cv-sol-tabs">
            {p.solutionLangs.map((l) => (
              <button key={l} type="button" className={solLang === l ? "on" : ""} onClick={() => setSolLang(l)}>
                {CV_LANG_NAMES[l]}
              </button>
            ))}
          </div>
          <RichText text={"```" + CV_LANG_NAMES[solLang] + "\n" + p.solutions[solLang] + "\n```"} />
        </section>
      )}
    </article>
  );
}

function Hints({ hints }) {
  const [n, setN] = useState(0);
  return (
    <div className="cv-hints">
      {hints.slice(0, n).map((h, i) => (
        <p key={i}>
          <b>Hint {i + 1}.</b> {h}
        </p>
      ))}
      {n < hints.length && (
        <button type="button" className="linkish" onClick={() => setN(n + 1)}>
          Show hint {n + 1} of {hints.length}
        </button>
      )}
    </div>
  );
}

function ProblemSubs({ pid, signedIn, bump }) {
  const [state, setState] = useState(null);
  useEffect(() => {
    if (!signedIn) return;
    let on = true;
    cvMine(pid).then(
      (d) => on && setState(d.subs),
      (e) => on && setState(e.message),
    );
    return () => {
      on = false;
    };
  }, [pid, signedIn, bump]);
  if (!signedIn) return <p className="cv-note">Sign in to keep a history of your submissions.</p>;
  if (state === null) return <p className="cv-note">Loading…</p>;
  if (typeof state === "string") return <p className="cv-note bad">{state}</p>;
  if (!state.length) return <p className="cv-note">No submissions yet for this problem.</p>;
  return (
    <div className="cv-subs-mini">
      {state.map((s) => (
        <Link key={s.id} to={`/courses/tcs-codevita/report/${s.id}`}>
          <span className={`tone-${STATUS_TONE[s.status] || "warn"}`}>{s.status}</span>
          <span>{CV_LANG_NAMES[s.language]}</span>
          <span>
            {s.score}/{s.maxScore}
          </span>
          <small>{new Date(s.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</small>
        </Link>
      ))}
    </div>
  );
}

function CustomOutput({ r, err, busy }) {
  if (busy) return <p className="cv-con-note"><Loader2 className="h-4 w-4 animate-spin" /> Running…</p>;
  if (err && !r) return <p className="cv-con-note bad">{err}</p>;
  if (!r) return <p className="cv-con-note">Tick "Use custom input" and press Run to see your program's output here.</p>;
  const v = VERDICTS[r.verdict] || VERDICTS.SE;
  return (
    <div className="cv-out">
      <div className={`cv-verdict tone-${r.verdict === "AC" ? "good" : v.tone}`}>
        <b>{r.verdict === "AC" ? "Ran successfully" : v.label}</b>
        {r.note && <span>{r.note}</span>}
        <small>
          {fmtMs(r.timeMs)} · {fmtKb(r.memoryKb)}
        </small>
      </div>
      <pre className="cv-pre">{r.stdout || "(no output)"}</pre>
      {r.stderr && <pre className="cv-pre err">{r.stderr}</pre>}
      {r.error && <pre className="cv-pre err">{r.error}</pre>}
    </div>
  );
}

function CaseChip({ c, i }) {
  if (!c || c.pending)
    return (
      <span className="cv-case pending" title="Waiting">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> {i + 1}
      </span>
    );
  const v = VERDICTS[c.verdict] || VERDICTS.SE;
  return (
    <span className={`cv-case tone-${v.tone}`} title={`${c.sample ? "Sample" : "Hidden"} test ${i + 1}: ${v.label}${typeof c.timeMs === "number" ? ` · ${fmtMs(c.timeMs)}` : ""}`}>
      {c.verdict === "AC" ? <CheckCircle2 className="h-3.5 w-3.5" /> : c.verdict === "TLE" ? <Clock className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
      {c.sample ? "S" : ""}
      {i + 1} <em>{v.short}</em>
    </span>
  );
}

function Results({ sampleOut, sub, err, busy }) {
  if (err === "signin")
    return (
      <div className="cv-con-note">
        Sign in to submit. Your scorecard and progress are saved to your account.{" "}
        <Link className="linkish" to={`/account?next=${encodeURIComponent(window.location.pathname)}`}>
          Sign in
        </Link>
      </div>
    );
  if (err) return <p className="cv-con-note bad"><AlertTriangle className="h-4 w-4" /> {err}</p>;
  if (busy === "run" && !sub) return <p className="cv-con-note"><Loader2 className="h-4 w-4 animate-spin" /> Running the sample tests…</p>;
  if (sub) {
    const cases = sub.cases || [];
    const judged = cases.filter((c) => !c.pending).length;
    const r = sub.result;
    return (
      <div className="cv-results">
        {r ? (
          <div className={`cv-summary tone-${STATUS_TONE[r.status] || "warn"}`}>
            <div>
              <b>{r.status}</b>
              <span>
                {r.passed}/{r.total} test cases passed · score {r.score}/{r.maxScore} · {fmtMs(r.timeMs)} · {fmtKb(r.memoryKb)}
              </span>
            </div>
            <Link className="btn" to={`/courses/tcs-codevita/report/${sub.id}`}>
              View scorecard
            </Link>
          </div>
        ) : (
          <p className="cv-con-note">
            <Loader2 className="h-4 w-4 animate-spin" /> Judging… {sub.total ? `${judged} of ${sub.total} test cases` : "starting"}
          </p>
        )}
        <div className="cv-cases">
          {cases.map((c, i) => (
            <CaseChip key={i} c={c} i={i} />
          ))}
        </div>
        {cases
          .filter((c) => c.sample && !c.pending && c.verdict !== "AC")
          .slice(0, 1)
          .map((c) => (
            <CaseDiff key={c.i} c={c} />
          ))}
        {cases.find((c) => (c.verdict === "CE" || c.verdict === "RE") && c.stderr) && <pre className="cv-pre err">{cases.find((c) => (c.verdict === "CE" || c.verdict === "RE") && c.stderr).stderr}</pre>}
      </div>
    );
  }
  if (sampleOut)
    return (
      <div className="cv-results">
        <div className={`cv-summary tone-${sampleOut.passed === sampleOut.total ? "good" : "bad"}`}>
          <div>
            <b>{sampleOut.passed === sampleOut.total ? "Sample tests passed" : "Sample tests failed"}</b>
            <span>
              {sampleOut.passed}/{sampleOut.total} samples. Submit to run the hidden tests.
            </span>
          </div>
        </div>
        {sampleOut.results.map((c, i) => (
          <CaseDiff key={i} c={{ ...c, sample: true, got: c.stdout, i }} />
        ))}
      </div>
    );
  return <p className="cv-con-note">Run checks your code on the sample tests. Submit runs every test, including the hidden ones, and gives you a scorecard.</p>;
}

function CaseDiff({ c }) {
  const v = VERDICTS[c.verdict] || VERDICTS.SE;
  return (
    <div className="cv-diffbox">
      <div className={`cv-verdict tone-${v.tone}`}>
        <b>
          Sample {c.i + 1}: {v.label}
        </b>
        {c.note && <span>{c.note}</span>}
        <small>
          {fmtMs(c.timeMs)} · {fmtKb(c.memoryKb)}
        </small>
      </div>
      <div className="cv-io three">
        <div>
          <small>Input</small>
          <pre className="cv-pre">{c.input}</pre>
        </div>
        <div>
          <small>Expected</small>
          <pre className="cv-pre">{c.expected}</pre>
        </div>
        <div>
          <small>Your output</small>
          <pre className="cv-pre">{c.got || "(no output)"}</pre>
        </div>
      </div>
      {c.stderr && <pre className="cv-pre err">{c.stderr}</pre>}
    </div>
  );
}

