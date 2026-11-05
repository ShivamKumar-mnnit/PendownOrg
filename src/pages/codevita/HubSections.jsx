import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, CheckCircle2, Circle, CircleDot, Clock, Crown, Filter, History, Lock, Medal, Search, Timer, Trophy, X } from "lucide-react";
import { CV_LANG_NAMES, DIFFICULTIES, STATUS_TONE } from "../../lib/codevita/common";
import { useCv } from "../../lib/codevita/api";
import UpgradeModal from "../../components/codevita/UpgradeModal";

export const dClass = (d) => (d === "Easy" ? "easy" : d === "Medium" ? "med" : "hard");
export const when = (ts) => new Date(ts).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
export const mins = (m) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ""}` : `${m} min`);

export function AccessPill({ access, locked }) {
  if (access === "free") return <span className="cv-pill good">Free</span>;
  return locked ? (
    <span className="cv-pill gold">
      <Lock className="h-3 w-3" /> Premium
    </span>
  ) : (
    <span className="cv-pill gold-soft">
      <Crown className="h-3 w-3" /> Premium
    </span>
  );
}

// ---------------- Learn ----------------

const GROUPS = [
  ["guide", "Preparation guide", "Start here: how CodeVita works, how it is judged, and how to prepare."],
  ["topic", "Topic-wise preparation", "Every topic CodeVita tests, with techniques, code in C++, Java and Python, and problems to practise."],
  ["pattern", "Problem-solving patterns", "How to recognise the technique a problem needs and pick an approach that fits the limits."],
];

export function LearnSection({ onUpgrade }) {
  const { data, error } = useCv("/api/cv/learn");
  if (error) return <p className="note bad">{error}</p>;
  if (!data) return <p className="note">Loading lessons…</p>;
  const items = data.items;
  const done = items.filter((l) => l.done).length;
  // Patterns sit with the guide when there are only a couple of them.
  return (
    <div className="cv-learn">
      <div className="cv-learn-bar">
        <div className="cv-bar">
          <span style={{ width: `${items.length ? (done / items.length) * 100 : 0}%` }} />
        </div>
        <small>
          {done} of {items.length} lessons done
          {!data.signedIn ? " · sign in to track progress" : ""}
        </small>
      </div>
      {GROUPS.map(([kind, title, blurb]) => {
        const list = items.filter((l) => l.kind === kind);
        if (!list.length) return null;
        return (
          <section key={kind} className="cv-lgroup">
            <h2>{title}</h2>
            <p className="cv-muted">{blurb}</p>
            <div className="cv-lcards">
              {list.map((l) => (
                <Link key={l.id} to={`/codevita/learn/${l.id}`} className={`cv-lcard${l.locked ? " locked" : ""}${l.done ? " done" : ""}`}>
                  <div className="cv-lcard-top">
                    <AccessPill access={l.access} locked={l.locked} />
                    <small>
                      <Clock className="h-3.5 w-3.5" /> {l.minutes} min
                    </small>
                    {l.done && <CheckCircle2 className="h-4 w-4 cv-done-ico" aria-label="Done" />}
                  </div>
                  <b>{l.title}</b>
                  <p>{l.summary}</p>
                  <span className="cv-lcard-go">
                    {l.locked ? "Preview" : l.done ? "Read again" : "Start lesson"} <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
      {!data.premium && (
        <div className="cv-upsell">
          <span>
            <Crown className="h-5 w-5" />
          </span>
          <div>
            <b>Unlock every lesson</b>
            <p className="cv-muted">Topic lessons for graphs, DP, greedy, backtracking and more, plus the full patterns guide.</p>
          </div>
          <button type="button" className="btn" onClick={onUpgrade}>
            See full access
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------- Practise ----------------

export function ProblemCard({ p, onOpen, index }) {
  return (
    <button type="button" className={`cv-pcard${p.locked ? " locked" : ""}`} onClick={() => onOpen(p)}>
      <div className="cv-pcard-top">
        <span className={`cv-diff ${dClass(p.difficulty)}`}>{p.difficulty}</span>
        <AccessPill access={p.access} locked={p.locked} />
        <span className="cv-pcard-st" title={p.solved ? "Solved" : p.attempted ? "Attempted" : "Not attempted"}>
          {p.solved ? <CheckCircle2 className="h-5 w-5 good" /> : p.attempted ? <CircleDot className="h-5 w-5 warn" /> : <Circle className="h-5 w-5 faint" />}
        </span>
      </div>
      <b>
        {index ? `${index}. ` : ""}
        {p.title}
      </b>
      <p>{p.summary}</p>
      <div className="cv-pcard-foot">
        <span className="cv-pcard-topics">{p.topics.slice(0, 2).join(" · ")}</span>
        <span className="cv-pts">
          {p.best ? `${p.best}/` : ""}
          {p.points} pts
        </span>
      </div>
    </button>
  );
}

export function PracticeSection({ onLocked }) {
  const { data, error } = useCv("/api/cv/problems");
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [q, setQ] = useState("");
  const [diff, setDiff] = useState([]);
  const [topic, setTopic] = useState(params.get("topic") || "");
  const [pattern, setPattern] = useState("");
  const [status, setStatus] = useState("all");
  const [access, setAccess] = useState(params.get("access") || "all");
  const [sort, setSort] = useState("default");
  const [showFilters, setShowFilters] = useState(false);

  const items = useMemo(() => data?.items || [], [data]);
  const topics = useMemo(() => [...new Set(items.flatMap((p) => p.topics))].sort(), [items]);
  const patterns = useMemo(() => [...new Set(items.flatMap((p) => p.patterns))].sort(), [items]);

  if (error) return <p className="note bad">{error}</p>;
  if (!data) return <p className="note">Loading the question bank…</p>;

  const s = q.trim().toLowerCase();
  let shown = items.filter(
    (p) =>
      (!s || `${p.title} ${p.topics.join(" ")} ${p.patterns.join(" ")} ${p.summary}`.toLowerCase().includes(s)) &&
      (!diff.length || diff.includes(p.difficulty)) &&
      (!topic || p.topics.includes(topic)) &&
      (!pattern || p.patterns.includes(pattern)) &&
      (status === "all" || (status === "solved" ? p.solved : status === "attempted" ? p.attempted && !p.solved : !p.attempted)) &&
      (access === "all" || p.access === access),
  );
  if (sort === "difficulty") shown = [...shown].sort((a, b) => DIFFICULTIES.indexOf(a.difficulty) - DIFFICULTIES.indexOf(b.difficulty));
  if (sort === "popular") shown = [...shown].sort((a, b) => b.solvers - a.solvers);
  const solvedCount = items.filter((p) => p.solved).length;
  const filtersOn = diff.length + (topic ? 1 : 0) + (pattern ? 1 : 0) + (status !== "all") + (access !== "all");
  const clear = () => (setDiff([]), setTopic(""), setPattern(""), setStatus("all"), setAccess("all"));
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
            {shown.length} shown · {solvedCount} of {items.length} solved
          </span>
        </div>
        <div className="cv-pcards">
          {shown.map((p) => (
            <ProblemCard key={p.id} p={p} onOpen={open} />
          ))}
        </div>
        {!shown.length && <p className="note">No problems match these filters.</p>}
      </div>
    </div>
  );
}

// ---------------- PYQs ----------------

export function PyqSection({ onLocked }) {
  const { data, error } = useCv("/api/cv/problems");
  const nav = useNavigate();
  const [fTopic, setFTopic] = useState("");
  const [fDiff, setFDiff] = useState("");
  if (error) return <p className="note bad">{error}</p>;
  if (!data) return <p className="note">Loading…</p>;
  const allPyqs = data.items.filter((p) => p.source === "pyq");
  const pyqs = allPyqs.filter((p) => (!fTopic || p.topics.includes(fTopic)) && (!fDiff || p.difficulty === fDiff));
  const pyqTopics = [...new Set(allPyqs.flatMap((p) => p.topics))].sort();
  const yearOf = (p) => p.season || "Year not set";
  const years = [...new Set(pyqs.map(yearOf))].sort().reverse();
  const open = (p) => (p.locked ? onLocked(p) : nav(`/codevita/solve/${p.id}`));
  if (!allPyqs.length)
    return (
      <div className="cv-empty cv-pyq-empty">
        <History className="h-6 w-6" />
        <h2>Previous-year questions are on their way</h2>
        <p className="cv-muted">
          We only publish previous-year CodeVita questions we can verify, each tagged with its year, topic and difficulty. Until they are added, every problem in Practise follows the
          CodeVita format and difficulty, with full editorials.
        </p>
        <Link className="btn" to="/codevita?tab=practice">
          Practise CodeVita-style problems
        </Link>
      </div>
    );
  return (
    <div className="cv-pyq">
      <div className="cv-list-bar">
        <select className="inp cv-sort" value={fDiff} onChange={(e) => setFDiff(e.target.value)} aria-label="Difficulty">
          <option value="">All levels</option>
          {DIFFICULTIES.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <select className="inp cv-sort" value={fTopic} onChange={(e) => setFTopic(e.target.value)} aria-label="Topic">
          <option value="">All topics</option>
          {pyqTopics.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <span className="cv-count">
          {pyqs.length} of {allPyqs.length} questions
        </span>
      </div>
      {!pyqs.length && <p className="note">No previous-year questions match these filters.</p>}
      {years.map((y) => {
        const list = pyqs.filter((p) => yearOf(p) === y);
        return (
          <section key={y} className="cv-lgroup">
            <h2>
              CodeVita {y} <small className="cv-muted">· {list.length} questions</small>
            </h2>
            <div className="cv-pcards">
              {list.map((p) => (
                <ProblemCard key={p.id} p={p} onOpen={open} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// ---------------- Mock tests ----------------

export function MocksSection({ onUpgrade }) {
  const { data, error } = useCv("/api/cv/mocks");
  if (error) return <p className="note bad">{error}</p>;
  if (!data) return <p className="note">Loading mock tests…</p>;
  return (
    <div className="cv-mocks">
      <p className="cv-muted cv-section-lead">
        Each mock test is a timed round of several problems. The problems are revealed when you start, editorials stay hidden until the time is up, and you get a report with your score,
        per-problem results and your place on the leaderboard.
      </p>
      <div className="cv-mcards">
        {data.items.map((m) => (
          <div key={m.id} className={`cv-mcard${m.locked ? " locked" : ""}`}>
            <div className="cv-lcard-top">
              <AccessPill access={m.access} locked={m.locked} />
              <small>
                <Timer className="h-3.5 w-3.5" /> {mins(m.minutes)}
              </small>
              {m.state === "active" && <span className="cv-pill warn">In progress</span>}
              {m.state === "finished" && (
                <span className="cv-pill good">
                  Best {m.best}/{m.maxScore}
                </span>
              )}
            </div>
            <b>{m.title}</b>
            <p>{m.summary}</p>
            <div className="cv-mix">
              <span>{m.count} problems</span>
              {DIFFICULTIES.map((d) => (m.mix[d] ? <span key={d} className={`cv-diff ${dClass(d)}`}>{`${m.mix[d]} ${d}`}</span> : null))}
              <span>{m.maxScore} pts</span>
            </div>
            {m.locked ? (
              <button type="button" className="btn ghost" onClick={onUpgrade}>
                <Lock className="h-4 w-4" /> Unlock with full access
              </button>
            ) : (
              <Link className="btn" to={`/codevita/mock/${m.id}`}>
                {m.state === "active" ? "Continue" : m.state === "finished" ? "See report or retake" : "Open"} <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- Performance ----------------

export function PerformanceSection({ signedIn }) {
  const me = useCv(signedIn ? "/api/cv/me" : null);
  const bank = useCv(signedIn ? "/api/cv/problems" : null);
  const mocks = useCv(signedIn ? "/api/cv/mocks" : null);
  const learn = useCv(signedIn ? "/api/cv/learn" : null);
  if (!signedIn)
    return (
      <div className="cv-empty">
        <Trophy className="h-6 w-6" />
        <p>Sign in to see your scorecards, topic mastery and mock-test history.</p>
        <Link className="btn" to="/account?next=/codevita?tab=progress">
          Sign in
        </Link>
      </div>
    );
  const err = me.error || bank.error;
  if (err) return <p className="note bad">{err}</p>;
  if (!me.data || !bank.data) return <p className="note">Loading your performance…</p>;

  const items = bank.data.items;
  const probs = me.data.problems || {};
  const subs = me.data.subs || [];
  const solved = items.filter((p) => probs[p.id]?.solved);
  const acc = subs.length ? Math.round(subs.reduce((n, s) => n + (s.accuracy || 0), 0) / subs.length) : 0;
  const score = Object.values(probs).reduce((n, v) => n + (v.bestScore || 0), 0);
  const maxScore = items.reduce((n, p) => n + p.points, 0);
  const topics = [...new Set(items.flatMap((p) => p.topics))]
    .map((t) => {
      const all = items.filter((p) => p.topics.includes(t));
      const tried = all.filter((p) => probs[p.id]);
      const ok = all.filter((p) => probs[p.id]?.solved);
      return { t, total: all.length, tried: tried.length, solved: ok.length };
    })
    .sort((a, b) => b.tried - a.tried || a.t.localeCompare(b.t));
  const mockDone = (mocks.data?.items || []).filter((m) => m.state === "finished");
  const lessonsDone = (learn.data?.items || []).filter((l) => l.done).length;
  const weak = topics.filter((x) => x.tried && x.solved / x.tried < 0.6).slice(0, 3);

  return (
    <div className="cv-perf">
      <div className="cv-kpis">
        <div>
          <small>Problems solved</small>
          <b>
            {solved.length}
            <em>/{items.length}</em>
          </b>
        </div>
        <div>
          <small>Practice score</small>
          <b>
            {score}
            <em>/{maxScore}</em>
          </b>
        </div>
        <div>
          <small>Average test accuracy</small>
          <b>{acc}%</b>
        </div>
        <div>
          <small>Lessons done</small>
          <b>
            {lessonsDone}
            <em>/{learn.data?.items?.length || 0}</em>
          </b>
        </div>
        <div>
          <small>Mock tests taken</small>
          <b>{mockDone.length}</b>
        </div>
      </div>

      <div className="cv-two">
        <section className="cv-panel">
          <h2>By difficulty</h2>
          {DIFFICULTIES.map((d) => {
            const all = items.filter((p) => p.difficulty === d);
            const ok = all.filter((p) => probs[p.id]?.solved).length;
            return (
              <div key={d} className="cv-meter">
                <span className={`cv-diff ${dClass(d)}`}>{d}</span>
                <div className="cv-bar">
                  <span className={dClass(d)} style={{ width: `${all.length ? (ok / all.length) * 100 : 0}%` }} />
                </div>
                <small>
                  {ok}/{all.length}
                </small>
              </div>
            );
          })}
          {weak.length > 0 && (
            <p className="cv-hint">
              Work on next: {weak.map((w, i) => (
                <span key={w.t}>
                  {i ? ", " : ""}
                  <Link to={`/codevita?tab=practice&topic=${encodeURIComponent(w.t)}`}>{w.t}</Link>
                </span>
              ))}
              . You have solved fewer than 60% of the problems you tried there.
            </p>
          )}
        </section>
        <section className="cv-panel">
          <h2>Topic mastery</h2>
          <div className="cv-topics">
            {topics.map((x) => (
              <div key={x.t} className="cv-meter">
                <Link to={`/codevita?tab=practice&topic=${encodeURIComponent(x.t)}`}>{x.t}</Link>
                <div className="cv-bar">
                  <span style={{ width: `${x.total ? (x.solved / x.total) * 100 : 0}%` }} />
                </div>
                <small>
                  {x.solved}/{x.total}
                </small>
              </div>
            ))}
          </div>
        </section>
      </div>

      {mockDone.length > 0 && (
        <section className="cv-panel">
          <h2>
            <Medal className="h-5 w-5" /> Mock tests
          </h2>
          <div className="cv-table subs mocks">
            {mockDone.map((m) => (
              <Link key={m.id} className="cv-tr" to={`/codevita/mock/${m.id}`}>
                <span className="cv-ti">
                  <b>{m.title}</b>
                  <small>{m.last ? when(m.last.finishedAt) : ""}</small>
                </span>
                <span>
                  {m.last?.solved}/{m.last?.total} solved
                </span>
                <span className="cv-pts">
                  {m.last?.score}/{m.maxScore}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="cv-panel">
        <h2>
          <History className="h-5 w-5" /> Scorecards
        </h2>
        {!subs.length ? (
          <p className="cv-muted">No submissions yet. Pick a free problem and submit to get your first scorecard.</p>
        ) : (
          <div className="cv-table subs">
            <div className="cv-tr cv-head">
              <span>When</span>
              <span>Problem</span>
              <span>Language</span>
              <span>Result</span>
              <span>Score</span>
            </div>
            {subs.slice(0, 50).map((s) => (
              <Link key={s.id} className="cv-tr" to={`/codevita/report/${s.id}`}>
                <span className="cv-faint">{when(s.at)}</span>
                <span className="cv-ti">
                  <b>{s.title}</b>
                  {s.mock && <small>Mock test</small>}
                </span>
                <span>{CV_LANG_NAMES[s.language]}</span>
                <span className={`tone-${STATUS_TONE[s.status] || "warn"}`}>{s.status}</span>
                <span className="cv-pts">
                  {s.score}/{s.maxScore}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/** The upgrade popup for pages outside the hub: loads the plan and course totals itself. */
export function HomeUpgrade({ problem, onClose, onDone }) {
  const { data: h } = useCv("/api/cv/home");
  if (!h) return null;
  return <UpgradeModal plan={h.plan} totals={h.totals} learn={h.learn} mocks={h.mocks} problem={problem} onClose={onClose} onDone={onDone} />;
}
