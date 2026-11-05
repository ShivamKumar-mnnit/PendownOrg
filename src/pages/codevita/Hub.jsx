import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { BookOpen, CheckCircle2, Circle, CircleDot, Crown, Filter, Lock, PlayCircle, Search, Sparkles, Trophy, X } from "lucide-react";
import UpgradeModal from "../../components/codevita/UpgradeModal";
import { CV_LANG_NAMES, DIFFICULTIES, STATUS_TONE } from "../../lib/codevita/common";
import { useCv } from "../../lib/codevita/api";
import { usePageSEO } from "../../lib/seo";
import "./codevita.css";

const dClass = (d) => (d === "Easy" ? "easy" : d === "Medium" ? "med" : "hard");
const when = (ts) => new Date(ts).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

function Ring({ value, total, label }) {
  const pct = total ? value / total : 0;
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="cv-ring">
      <svg viewBox="0 0 80 80" aria-hidden="true">
        <circle cx="40" cy="40" r={r} className="track" />
        <circle cx="40" cy="40" r={r} className="fill" strokeDasharray={`${c * pct} ${c}`} transform="rotate(-90 40 40)" />
      </svg>
      <div>
        <b>{value}</b>
        <small>/ {total}</small>
        <span>{label}</span>
      </div>
    </div>
  );
}

export default function Hub() {
  usePageSEO({
    title: "TCS CodeVita crash course practice",
    description: "CodeVita-style coding problems with a contest-style judge, hidden tests, scorecards and editorials in C++, Java and Python.",
    path: "/codevita",
  });
  const [bump, setBump] = useState(0);
  const home = useCv("/api/cv/home", bump);
  const bank = useCv("/api/cv/problems", bump);
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "bank";
  const [upgrade, setUpgrade] = useState(null);
  const h = home.data;

  const setTab = (t) => {
    const next = new URLSearchParams(params);
    if (t === "bank") next.delete("tab");
    else next.set("tab", t);
    setParams(next, { replace: true });
  };

  return (
    <section className="page cv-page">
      <div className="wrap">
        <header className="cv-hero">
          <div className="cv-hero-main">
            <p className="cv-eyebrow">
              <Trophy className="h-4 w-4" /> TCS CodeVita crash course
            </p>
            <h1>Practise CodeVita-style problems the way the contest runs</h1>
            <p className="cv-muted cv-lead">
              {h?.settings?.intro ||
                "Read the problem, pick C, C++, Java or Python, test on your own input and submit against hidden test cases. Every submission gets a scorecard with time, memory and what to improve."}
            </p>
            <div className="cv-hero-cta">
              {h?.startHere && (
                <Link className="btn" to={`/codevita/solve/${h.startHere.id}`}>
                  <PlayCircle className="h-4 w-4" /> Try a free problem
                </Link>
              )}
              {h && !h.premium && (
                <button type="button" className="btn ghost" onClick={() => setUpgrade({})}>
                  <Crown className="h-4 w-4" /> See premium
                </button>
              )}
              {h?.premium && (
                <span className="cv-pill good">
                  <Crown className="h-3.5 w-3.5" /> Premium active
                </span>
              )}
              {h?.settings?.courseId && (
                <Link className="btn ghost" to={`/courses/${h.settings.courseId}`}>
                  <BookOpen className="h-4 w-4" /> Course lessons
                </Link>
              )}
            </div>
            {h && (
              <div className="cv-stats">
                <span>
                  <b>{h.totals.problems}</b> problems
                </span>
                {DIFFICULTIES.map((d) => (
                  <span key={d} className={dClass(d)}>
                    <b>{h.totals.byDifficulty[d] || 0}</b> {d.toLowerCase()}
                  </span>
                ))}
                <span>
                  <b>{h.totals.topics.length}</b> topics
                </span>
                <span>
                  <b>{h.totals.free}</b> free
                </span>
              </div>
            )}
          </div>
          <aside className="cv-hero-side">
            {h?.me ? (
              <>
                <Ring value={h.me.solved} total={h.totals.problems} label="solved" />
                <div className="cv-side-facts">
                  <div>
                    <small>Practice score</small>
                    <b>{h.me.score}</b>
                  </div>
                  <div>
                    <small>Attempted</small>
                    <b>{h.me.attempted}</b>
                  </div>
                </div>
                {h.me.recent[0] && (
                  <Link className="cv-last" to={`/codevita/report/${h.me.recent[0].id}`}>
                    Last: {h.me.recent[0].title} · <span className={`tone-${STATUS_TONE[h.me.recent[0].status] || "warn"}`}>{h.me.recent[0].status}</span>
                  </Link>
                )}
              </>
            ) : (
              <div className="cv-side-guest">
                <Sparkles className="h-5 w-5" />
                <b>Track your progress</b>
                <p className="cv-muted">Sign in to save submissions, get a scorecard for each one and see which topics need work.</p>
                <Link className="btn ghost" to="/account?next=/codevita">
                  Sign in
                </Link>
              </div>
            )}
          </aside>
        </header>

        {h?.settings?.announcement && <p className="cv-announce">{h.settings.announcement}</p>}

        <div className="cv-tabs" role="tablist">
          {[
            ["bank", "Question bank"],
            ["subs", "My submissions"],
            ["about", "How the contest works"],
          ].map(([k, l]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>
              {l}
            </button>
          ))}
        </div>

        {tab === "bank" && <Bank data={bank.data} error={bank.error} onLocked={(p) => setUpgrade({ problem: p })} />}
        {tab === "subs" && <MySubs signedIn={h?.signedIn} />}
        {tab === "about" && <About />}

        <p className="cv-disclaimer">{h?.disclaimer || "Anobyt practice scores are not official TCS CodeVita results. Anobyt is not affiliated with TCS."}</p>
      </div>
      {upgrade && <UpgradeModal plan={h?.plan} totals={h?.totals} problem={upgrade.problem} onClose={() => setUpgrade(null)} onDone={() => (setUpgrade(null), setBump((n) => n + 1))} />}
    </section>
  );
}

function Bank({ data, error, onLocked }) {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [diff, setDiff] = useState([]);
  const [topic, setTopic] = useState("");
  const [pattern, setPattern] = useState("");
  const [season, setSeason] = useState("");
  const [status, setStatus] = useState("all");
  const [access, setAccess] = useState("all");
  const [sort, setSort] = useState("default");
  const [showFilters, setShowFilters] = useState(false);

  const items = useMemo(() => data?.items || [], [data]);
  const topics = useMemo(() => [...new Set(items.flatMap((p) => p.topics))].sort(), [items]);
  const patterns = useMemo(() => [...new Set(items.flatMap((p) => p.patterns))].sort(), [items]);
  const seasons = useMemo(() => [...new Set(items.map((p) => p.season).filter(Boolean))].sort().reverse(), [items]);

  if (error) return <p className="note bad">{error}</p>;
  if (!data) return <p className="note">Loading the question bank…</p>;

  const s = q.trim().toLowerCase();
  let shown = items.filter(
    (p) =>
      (!s || `${p.title} ${p.topics.join(" ")} ${p.patterns.join(" ")} ${p.summary}`.toLowerCase().includes(s)) &&
      (!diff.length || diff.includes(p.difficulty)) &&
      (!topic || p.topics.includes(topic)) &&
      (!pattern || p.patterns.includes(pattern)) &&
      (!season || p.season === season) &&
      (status === "all" || (status === "solved" ? p.solved : status === "attempted" ? p.attempted && !p.solved : !p.attempted)) &&
      (access === "all" || p.access === access),
  );
  if (sort === "difficulty") shown = [...shown].sort((a, b) => DIFFICULTIES.indexOf(a.difficulty) - DIFFICULTIES.indexOf(b.difficulty));
  if (sort === "popular") shown = [...shown].sort((a, b) => b.solvers - a.solvers);
  const solvedCount = items.filter((p) => p.solved).length;
  const filtersOn = diff.length + (topic ? 1 : 0) + (pattern ? 1 : 0) + (season ? 1 : 0) + (status !== "all") + (access !== "all");
  const clear = () => (setDiff([]), setTopic(""), setPattern(""), setSeason(""), setStatus("all"), setAccess("all"));
  const open = (p) => (p.locked ? onLocked(p) : nav(`/codevita/solve/${p.id}`));

  return (
    <div className="cv-bank">
      <aside className={`cv-filters${showFilters ? " open" : ""}`}>
        <div className="cv-filter-head">
          <b>Filters</b>
          {filtersOn > 0 && (
            <button type="button" className="linkish" onClick={clear}>
              Clear
            </button>
          )}
          <button type="button" className="cv-x only-sm" onClick={() => setShowFilters(false)} aria-label="Close filters">
            <X className="h-4 w-4" />
          </button>
        </div>
        <fieldset>
          <legend>Difficulty</legend>
          {DIFFICULTIES.map((d) => (
            <label key={d} className="cv-check">
              <input type="checkbox" checked={diff.includes(d)} onChange={() => setDiff(diff.includes(d) ? diff.filter((x) => x !== d) : [...diff, d])} />
              <span className={`cv-diff ${dClass(d)}`}>{d}</span>
              <small>{items.filter((p) => p.difficulty === d).length}</small>
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>Status</legend>
          <select className="inp" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All problems</option>
            <option value="todo">Not attempted</option>
            <option value="attempted">Attempted, not solved</option>
            <option value="solved">Solved</option>
          </select>
        </fieldset>
        <fieldset>
          <legend>Access</legend>
          <select className="inp" value={access} onChange={(e) => setAccess(e.target.value)}>
            <option value="all">Free and premium</option>
            <option value="free">Free only</option>
            <option value="premium">Premium only</option>
          </select>
        </fieldset>
        <fieldset>
          <legend>Topic</legend>
          <div className="cv-chips">
            {topics.map((t) => (
              <button key={t} type="button" className={topic === t ? "on" : ""} onClick={() => setTopic(topic === t ? "" : t)}>
                {t}
              </button>
            ))}
          </div>
        </fieldset>
        {patterns.length > 0 && (
          <fieldset>
            <legend>Pattern</legend>
            <select className="inp" value={pattern} onChange={(e) => setPattern(e.target.value)}>
              <option value="">Any pattern</option>
              {patterns.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </fieldset>
        )}
        {seasons.length > 0 && (
          <fieldset>
            <legend>Year</legend>
            <select className="inp" value={season} onChange={(e) => setSeason(e.target.value)}>
              <option value="">Any year</option>
              {seasons.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </fieldset>
        )}
      </aside>

      <div className="cv-list">
        <div className="cv-list-bar">
          <label className="cv-search">
            <Search className="h-4 w-4" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search problems, topics or patterns" aria-label="Search problems" />
          </label>
          <button type="button" className="btn ghost only-sm" onClick={() => setShowFilters(true)}>
            <Filter className="h-4 w-4" /> Filters{filtersOn ? ` (${filtersOn})` : ""}
          </button>
          <select className="inp cv-sort" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
            <option value="default">Recommended order</option>
            <option value="difficulty">Easiest first</option>
            <option value="popular">Most solved</option>
          </select>
          <span className="cv-count">
            {shown.length} shown · {solvedCount} solved
          </span>
        </div>

        <div className="cv-table" role="table" aria-label="Problems">
          <div className="cv-tr cv-head" role="row">
            <span role="columnheader">Status</span>
            <span role="columnheader">Problem</span>
            <span role="columnheader">Difficulty</span>
            <span role="columnheader">Points</span>
            <span role="columnheader">Access</span>
          </div>
          {shown.map((p, i) => (
            <button key={p.id} type="button" className={`cv-tr${p.locked ? " locked" : ""}`} role="row" onClick={() => open(p)}>
              <span className="cv-st" role="cell" title={p.solved ? "Solved" : p.attempted ? "Attempted" : "Not attempted"}>
                {p.solved ? <CheckCircle2 className="h-5 w-5 good" /> : p.attempted ? <CircleDot className="h-5 w-5 warn" /> : <Circle className="h-5 w-5 faint" />}
              </span>
              <span className="cv-ti" role="cell">
                <b>
                  {i + 1}. {p.title}
                </b>
                <small>
                  {p.topics.join(" · ")}
                  {p.season ? ` · ${p.season}` : ""}
                  {p.solvers ? ` · solved by ${p.solvers}` : ""}
                </small>
              </span>
              <span role="cell">
                <span className={`cv-diff ${dClass(p.difficulty)}`}>{p.difficulty}</span>
              </span>
              <span className="cv-pts" role="cell">
                {p.best ? `${p.best}/` : ""}
                {p.points}
              </span>
              <span role="cell">
                {p.access === "free" ? (
                  <span className="cv-pill good">Free</span>
                ) : p.locked ? (
                  <span className="cv-pill gold">
                    <Lock className="h-3 w-3" /> Premium
                  </span>
                ) : (
                  <span className="cv-pill gold-soft">
                    <Crown className="h-3 w-3" /> Premium
                  </span>
                )}
              </span>
            </button>
          ))}
          {!shown.length && <p className="note" style={{ padding: 16 }}>No problems match these filters.</p>}
        </div>
      </div>
    </div>
  );
}

function MySubs({ signedIn }) {
  const subs = useCv(signedIn ? "/api/cv/me" : null);
  if (!signedIn)
    return (
      <div className="cv-empty">
        <p>Sign in to see your submissions and scorecards.</p>
        <Link className="btn" to="/account?next=/codevita?tab=subs">
          Sign in
        </Link>
      </div>
    );
  if (subs.error) return <p className="note bad">{subs.error}</p>;
  if (!subs.data) return <p className="note">Loading…</p>;
  if (!subs.data.subs.length) return <div className="cv-empty"><p>No submissions yet. Pick a free problem and submit to get your first scorecard.</p></div>;
  return (
    <div className="cv-table subs">
      <div className="cv-tr cv-head">
        <span>When</span>
        <span>Problem</span>
        <span>Language</span>
        <span>Result</span>
        <span>Score</span>
      </div>
      {subs.data.subs.map((s) => (
        <Link key={s.id} className="cv-tr" to={`/codevita/report/${s.id}`}>
          <span className="cv-faint">{when(s.at)}</span>
          <span className="cv-ti">
            <b>{s.title}</b>
          </span>
          <span>{CV_LANG_NAMES[s.language]}</span>
          <span className={`tone-${STATUS_TONE[s.status] || "warn"}`}>{s.status}</span>
          <span className="cv-pts">
            {s.score}/{s.maxScore}
          </span>
        </Link>
      ))}
    </div>
  );
}

function About() {
  const steps = [
    ["Read carefully", "CodeVita problems are long and story-based. Underline the input format, the output format and the limits before you think about code."],
    ["Standard input, standard output", "Your program reads from stdin and prints to stdout, exactly in the format asked. Extra spaces at line ends are ignored here; extra words or debug prints are not."],
    ["Hidden test cases", "Passing the samples is not enough. Your code is judged on hidden tests, including the smallest and largest inputs the constraints allow."],
    ["Time and memory limits", "Each problem has a time limit (Java and Python get extra time). A correct but slow solution scores TLE, so check the constraints to see which complexity fits."],
    ["Partial credit", "Here you earn points for every test case you pass, so a solution that handles most cases still counts. Aim for all of them."],
    ["Practise under time", "Turn on the timer in the coding screen to practise against the clock, the way the contest round feels."],
  ];
  return (
    <div className="cv-about">
      {steps.map(([t, d], i) => (
        <div key={t} className="cv-about-card">
          <span>{i + 1}</span>
          <b>{t}</b>
          <p>{d}</p>
        </div>
      ))}
    </div>
  );
}
