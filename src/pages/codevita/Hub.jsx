import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  Circle,
  ClipboardList,
  Code2,
  Crown,
  FileCode2,
  GraduationCap,
  History,
  LayoutGrid,
  ListChecks,
  PlayCircle,
  Sparkles,
  Timer,
  Trophy,
} from "lucide-react";
import UpgradeModal from "../../components/codevita/UpgradeModal";
import { rupees } from "../../lib/account";
import { useCv } from "../../lib/codevita/api";
import { usePageSEO } from "../../lib/seo";
import { LearnSection, MocksSection, PerformanceSection, PracticeSection, PyqSection } from "./HubSections";
import "./codevita.css";

const TABS = [
  ["overview", "Overview", LayoutGrid],
  ["learn", "Learn", BookOpen],
  ["practice", "Practise", Code2],
  ["pyq", "PYQs", History],
  ["mocks", "Mock tests", Timer],
  ["progress", "Performance", BarChart3],
];
// Old links (?tab=bank, ?tab=subs) still land in the right place.
const ALIASES = { bank: "practice", subs: "progress", about: "overview" };

function Ring({ value, total, label }) {
  const pct = total ? Math.min(1, value / total) : 0;
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="cv-ring">
      <svg viewBox="0 0 80 80" aria-hidden="true">
        <circle cx="40" cy="40" r={r} className="track" />
        <circle cx="40" cy="40" r={r} className="fill" strokeDasharray={`${c * pct} ${c}`} transform="rotate(-90 40 40)" />
      </svg>
      <div>
        <b>{Math.round(pct * 100)}%</b>
        <span>{label}</span>
      </div>
    </div>
  );
}

/** /codevita: the TCS CodeVita Crash Course. */
export default function Hub() {
  usePageSEO({
    title: "TCS CodeVita Crash Course",
    description: "A complete TCS CodeVita preparation course: lessons on every topic, CodeVita-style problems with hidden tests, mock tests, solutions in C++, Java and Python, and scorecards.",
    path: "/codevita",
  });
  const [bump, setBump] = useState(0);
  const home = useCv("/api/cv/home", bump);
  const [params, setParams] = useSearchParams();
  const raw = params.get("tab") || "overview";
  const tab = ALIASES[raw] || (TABS.some(([k]) => k === raw) ? raw : "overview");
  const [upgrade, setUpgrade] = useState(null);
  const h = home.data;

  const setTab = (t) => {
    const next = new URLSearchParams(params);
    if (t === "overview") next.delete("tab");
    else next.set("tab", t);
    ["access", "topic"].forEach((k) => next.delete(k));
    setParams(next, { replace: true });
    document.getElementById("cv-sections")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const onUpgrade = (problem) => setUpgrade({ problem });

  if (home.error)
    return (
      <section className="page cv-page">
        <div className="wrap" style={{ maxWidth: 640 }}>
          <div className="cv-empty">
            <Trophy className="h-6 w-6" />
            <p>{home.error}</p>
            <Link className="btn ghost" to="/">
              Back to Anobyt
            </Link>
          </div>
        </div>
      </section>
    );

  const price = h?.offer?.price;
  return (
    <section className="page cv-page">
      <div className="wrap">
        <Hero h={h} price={price} onUpgrade={() => onUpgrade(null)} setTab={setTab} />

        {h?.settings?.announcement && <p className="cv-announce">{h.settings.announcement}</p>}

        <nav className="cv-secnav" id="cv-sections" aria-label="Course sections">
          {TABS.map(([k, l, Icon]) => (
            <button key={k} type="button" aria-current={tab === k ? "page" : undefined} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>
              <Icon className="h-4 w-4" /> {l}
            </button>
          ))}
        </nav>

        {tab === "overview" && <Overview h={h} price={price} setTab={setTab} onUpgrade={() => onUpgrade(null)} />}
        {tab === "learn" && <LearnSection onUpgrade={() => onUpgrade(null)} />}
        {tab === "practice" && <PracticeSection onLocked={onUpgrade} />}
        {tab === "pyq" && <PyqSection onLocked={onUpgrade} />}
        {tab === "mocks" && <MocksSection onUpgrade={() => onUpgrade(null)} />}
        {tab === "progress" && <PerformanceSection signedIn={h?.signedIn} />}

        <p className="cv-disclaimer">{h?.disclaimer || "Anobyt practice scores are not official TCS CodeVita results. Anobyt is not affiliated with TCS."}</p>
      </div>
      {upgrade && <UpgradeModal plan={h?.plan} totals={h?.totals} learn={h?.learn} mocks={h?.mocks} problem={upgrade.problem} onClose={() => setUpgrade(null)} onDone={() => (setUpgrade(null), setBump((n) => n + 1))} />}
    </section>
  );
}

function Hero({ h, price, onUpgrade, setTab }) {
  const lessons = h?.learn?.total || 0;
  return (
    <header className="cv-hero cv-hero2">
      <div className="cv-hero-main">
        <p className="cv-eyebrow">
          <Trophy className="h-4 w-4" /> TCS CodeVita Crash Course
        </p>
        <h1>Prepare for TCS CodeVita with a complete, structured course</h1>
        <p className="cv-muted cv-lead">
          {h?.settings?.intro ||
            "Learn every topic CodeVita tests, practise CodeVita-style problems on a real judge with hidden test cases, sit timed mock tests, and see exactly where to improve after every submission."}
        </p>
        <div className="cv-hero-facts">
          <span>
            <BookOpen className="h-4 w-4" /> <b>{lessons || "—"}</b> lessons
          </span>
          <span>
            <Code2 className="h-4 w-4" /> <b>{h?.totals?.problems ?? "—"}</b> problems
          </span>
          <span>
            <Timer className="h-4 w-4" /> <b>{h?.mocks ?? "—"}</b> mock tests
          </span>
          <span>
            <FileCode2 className="h-4 w-4" /> C++, Java, Python solutions
          </span>
        </div>
        <div className="cv-hero-cta">
          <button type="button" className="btn" onClick={() => setTab("learn")}>
            <GraduationCap className="h-4 w-4" /> Start learning free
          </button>
          {h?.startHere && (
            <Link className="btn ghost" to={`/codevita/solve/${h.startHere.id}`}>
              <PlayCircle className="h-4 w-4" /> Try a free problem
            </Link>
          )}
        </div>
      </div>

      <aside className="cv-hero-side">
        {h?.premium ? (
          <>
            <span className="cv-pill good" style={{ alignSelf: "flex-start" }}>
              <Crown className="h-3.5 w-3.5" /> Full course unlocked
            </span>
            {h.me ? <Progress h={h} /> : null}
          </>
        ) : (
          <div className="cv-buybox">
            <small>Complete TCS CodeVita Crash Course</small>
            <div className="cv-buy-price">
              {price ? rupees(price) : "Free"}
              {price ? <span>one-time</span> : null}
            </div>
            <ul>
              <li>
                <CheckCircle2 className="h-4 w-4" /> All {lessons || ""} lessons and patterns
              </li>
              <li>
                <CheckCircle2 className="h-4 w-4" /> All {h?.totals?.problems || ""} problems with editorials
              </li>
              <li>
                <CheckCircle2 className="h-4 w-4" /> Every mock test with reports
              </li>
              <li>
                <CheckCircle2 className="h-4 w-4" /> Scorecards and progress tracking
              </li>
            </ul>
            <button type="button" className="btn" onClick={onUpgrade}>
              <Crown className="h-4 w-4" /> Get full access{price ? ` · ${rupees(price)}` : ""}
            </button>
            {h?.me ? <Progress h={h} compact /> : <p className="cv-fine">Free: {h?.learn?.free || 0} lessons, {h?.totals?.free || 0} problems and the demo mock test.</p>}
          </div>
        )}
      </aside>
    </header>
  );
}

function Progress({ h, compact }) {
  const totalItems = (h.learn?.total || 0) + (h.totals?.problems || 0);
  const doneItems = (h.learn?.done || 0) + (h.me?.solved || 0);
  if (compact)
    return (
      <p className="cv-fine">
        Your progress: {h.learn?.done || 0} {h.learn?.done === 1 ? "lesson" : "lessons"} done · {h.me.solved} solved
      </p>
    );
  return (
    <>
      <Ring value={doneItems} total={totalItems} label="course complete" />
      <div className="cv-side-facts">
        <div>
          <small>Lessons done</small>
          <b>
            {h.learn?.done || 0}
            <em>/{h.learn?.total || 0}</em>
          </b>
        </div>
        <div>
          <small>Problems solved</small>
          <b>
            {h.me.solved}
            <em>/{h.totals.problems}</em>
          </b>
        </div>
      </div>
    </>
  );
}

function Overview({ h, price, setTab, onUpgrade }) {
  const me = h?.me;
  const steps = [
    { done: (h?.learn?.done || 0) > 0, title: "Read the CodeVita guide", text: "Format, rules, judging and a 4-week plan.", action: () => setTab("learn"), cta: "Open lessons" },
    { done: (me?.attempted || 0) > 0, title: "Solve your first free problem", text: "Write code, run it on your own input and submit.", to: h?.startHere ? `/codevita/solve/${h.startHere.id}` : null, action: () => setTab("practice"), cta: "Practise" },
    { done: false, title: "Take the free demo mock test", text: "Three problems against the clock, with a report at the end.", action: () => setTab("mocks"), cta: "Mock tests" },
    { done: false, title: "Track and fix weak topics", text: "Your performance page shows which topics need work.", action: () => setTab("progress"), cta: "Performance" },
  ];
  const pillars = [
    [BookOpen, "Learn", `${h?.learn?.total || 0} lessons: exam guide, every major topic and the patterns behind CodeVita problems, with code in C++, Java and Python.`, "learn"],
    [Code2, "Practise", `${h?.totals?.problems || 0} CodeVita-style problems with hidden test cases, time and memory limits, and step-by-step editorials.`, "practice"],
    [History, "PYQs", "Previous-year CodeVita questions, organised by year, topic and difficulty as they are added.", "pyq"],
    [Timer, "Mock tests", `${h?.mocks || 0} timed rounds that feel like the real contest, with a report and leaderboard.`, "mocks"],
    [BarChart3, "Performance", "Scorecards for every submission, topic mastery and your mock-test history.", "progress"],
  ];
  return (
    <div className="cv-overview">
      <section className="cv-pillars">
        {pillars.map(([Icon, t, d, k]) => (
          <button key={k} type="button" className="cv-pillar" onClick={() => setTab(k)}>
            <span>
              <Icon className="h-5 w-5" />
            </span>
            <b>{t}</b>
            <p>{d}</p>
          </button>
        ))}
      </section>

      <div className="cv-two">
        <section className="cv-panel">
          <h2>
            <ListChecks className="h-5 w-5" /> Start here
          </h2>
          <ol className="cv-steps">
            {steps.map((s, i) => (
              <li key={s.title} className={s.done ? "done" : ""}>
                {s.done ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                <div>
                  <b>
                    {i + 1}. {s.title}
                  </b>
                  <span>{s.text}</span>
                </div>
                {s.to ? (
                  <Link className="btn ghost sm" to={s.to}>
                    {s.cta}
                  </Link>
                ) : (
                  <button type="button" className="btn ghost sm" onClick={s.action}>
                    {s.cta}
                  </button>
                )}
              </li>
            ))}
          </ol>
        </section>

        <section className="cv-panel">
          <h2>
            <ClipboardList className="h-5 w-5" /> Free and full access
          </h2>
          <table className="cv-compare">
            <thead>
              <tr>
                <th />
                <th>Free</th>
                <th>Full course{price ? ` · ${rupees(price)}` : ""}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Lessons</td>
                <td>{h?.learn?.free ?? "—"} (guide and basics)</td>
                <td>All {h?.learn?.total ?? ""}</td>
              </tr>
              <tr>
                <td>Practice problems</td>
                <td>{h?.totals?.free ?? "—"} with editorials</td>
                <td>All {h?.totals?.problems ?? ""}</td>
              </tr>
              <tr>
                <td>Mock tests</td>
                <td>Demo round</td>
                <td>All {h?.mocks ?? ""}</td>
              </tr>
              <tr>
                <td>Judge, scorecards, progress</td>
                <td>Yes</td>
                <td>Yes</td>
              </tr>
            </tbody>
          </table>
          {h && !h.premium ? (
            <button type="button" className="btn" onClick={onUpgrade} style={{ marginTop: 12 }}>
              <Sparkles className="h-4 w-4" /> Unlock everything{price ? ` for ${rupees(price)}` : ""}
            </button>
          ) : (
            <p className="cv-fine">You have full access. Everything is unlocked.</p>
          )}
        </section>
      </div>
    </div>
  );
}
