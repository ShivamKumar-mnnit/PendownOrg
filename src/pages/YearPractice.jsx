import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, ChevronRight, Lock, Search } from "lucide-react";
import Upgrade from "../components/Upgrade";
import { YEAR_NAMES, difficultyClass, groupByTopic, useSolved, useYear } from "../lib/problemBank";
import { useAccount } from "../lib/account";
import { usePageSEO } from "../lib/seo";

const ACCESS_FILTERS = [
  ["all", "All"],
  ["free", "Free"],
  ["premium", "Premium"],
];

/**
 * One year's problems, grouped by topic. Each row says FREE or PREMIUM up
 * front; premium rows show a lock until the student unlocks practice.
 */
export default function YearPractice() {
  const year = Math.min(4, Math.max(1, Number(useParams().year) || 1));
  const { data, error, loading } = useYear(year);
  const { user } = useAccount();
  const solved = useSolved();
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("All");
  const [kind, setKind] = useState("all");
  const [unsolved, setUnsolved] = useState(false);

  usePageSEO({
    title: `${YEAR_NAMES[year]} coding problems`,
    description: `${YEAR_NAMES[year]} coding practice: free and premium problems by topic, with an online editor that checks your code.`,
    path: `/problems/year/${year}`,
  });

  // A link like /problems/year/1#loops scrolls to that topic.
  useEffect(() => {
    if (!data || !window.location.hash) return;
    document.getElementById("t-" + decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView({ block: "start" });
  }, [data]);

  const all = useMemo(() => data?.problems || [], [data]);
  const q = query.trim().toLowerCase();
  const groups = useMemo(
    () =>
      groupByTopic(all)
        .map((g) => ({
          ...g,
          total: g.items.length,
          free: g.items.filter((p) => p.access === "free").length,
          items: g.items.filter((p) => (level === "All" || p.difficulty === level) && (kind === "all" || p.access === kind) && (!unsolved || !solved.has(p.id)) && (!q || (p.title + " " + p.topic).toLowerCase().includes(q))),
        }))
        .filter((g) => g.items.length),
    [all, level, kind, unsolved, solved, q],
  );
  const shown = groups.reduce((n, g) => n + g.items.length, 0);
  const free = all.filter((p) => p.access === "free").length;
  const done = all.filter((p) => solved.has(p.id)).length;
  const levels = ["All", ...new Set(all.map((p) => p.difficulty))];
  const number = new Map(all.map((p, i) => [p.id, i + 1]));

  return (
    <section className="page year-page">
      <div className="wrap">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link to="/problems">Practice</Link>
          <ChevronRight className="h-4 w-4" />
          <span>{YEAR_NAMES[year]}</span>
        </nav>
        <div className="year-head">
          <div>
            <h1>{YEAR_NAMES[year]} problems</h1>
            <p className="lead-p" style={{ marginBottom: 12 }}>
              {data?.blurb || " "}
            </p>
            {data && (
              <div className="yc-stats">
                <span>
                  <b>{all.length}</b> problems
                </span>
                <span className="badge free">{free} FREE</span>
                {all.length - free > 0 && (
                  <span className="badge prem">
                    <Lock className="h-3 w-3" /> {all.length - free} PREMIUM
                  </span>
                )}
                <span className="yc-rule" style={{ margin: 0 }}>
                  {data.rules.solutionsLabel}
                </span>
              </div>
            )}
          </div>
          <div className="year-score">
            <b>
              {done}
              <small> / {all.length}</small>
            </b>
            <span>solved</span>
            <div className="rprog">
              <div style={{ width: `${all.length ? (done * 100) / all.length : 0}%` }} />
            </div>
            {!user && (
              <Link className="linkish" to="/account" style={{ fontSize: 13 }}>
                Sign in to keep progress on every device
              </Link>
            )}
          </div>
        </div>

        <div className="year-tabs">
          {[1, 2, 3, 4].map((y) => (
            <Link key={y} to={`/problems/year/${y}`} className={y === year ? "on" : ""}>
              {YEAR_NAMES[y]}
            </Link>
          ))}
        </div>

        {data && !data.unlocked && all.length > free && (
          <div className="plan-strip">
            <Lock className="h-5 w-5" />
            <div>
              <b>
                You're on the free plan: {free} of {all.length} problems are open.
              </b>{" "}
              Premium problems show a lock. Pick one to see what premium includes, or{" "}
              <a href="#unlock" className="linkish">
                unlock them all
              </a>
              .
            </div>
          </div>
        )}

        <div className="year-grid">
          <aside className="year-side">
            <div className="search">
              <Search className="h-4 w-4" />
              <input className="inp" placeholder="Search problems" aria-label="Search problems" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="row" style={{ gap: 6, margin: "12px 0 6px" }}>
              {ACCESS_FILTERS.map(([k, l]) => (
                <button key={k} type="button" className={`chip${k === kind ? " on" : ""}`} onClick={() => setKind(k)}>
                  {l}
                </button>
              ))}
            </div>
            <div className="row" style={{ gap: 6, margin: "6px 0 12px" }}>
              {levels.map((d) => (
                <button key={d} type="button" className={`chip${d === level ? " on" : ""}`} onClick={() => setLevel(d)}>
                  {d}
                </button>
              ))}
            </div>
            <label className="mini" style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14 }}>
              <input type="checkbox" checked={unsolved} onChange={(e) => setUnsolved(e.target.checked)} /> Only unsolved
            </label>
            <nav className="toc">
              {groups.map((g) => (
                <a
                  key={g.key}
                  href={`#t-${g.key}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById("t-" + g.key)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  <span>{g.title}</span>
                  <small>
                    {g.free} free / {g.total}
                  </small>
                </a>
              ))}
            </nav>
          </aside>

          <div>
            {error && <p className="note bad">{error}</p>}
            {!shown && (
              <div className="empty">
                <b>{loading ? "Loading problems…" : "Nothing matches"}</b>
                {!loading && <p className="note">Try a different search or filter.</p>}
              </div>
            )}
            {groups.map((g) => (
              <div key={g.key} id={"t-" + g.key} className="topic-block">
                <div className="topic-head">
                  <h2>{g.title}</h2>
                  <small>
                    {g.free} free · {g.total - g.free} premium
                  </small>
                </div>
                <div className="plist">
                  {g.items.map((p) => (
                    <Link key={p.id} to={`/problem/${p.id}`} className={`plist-row${p.locked ? " locked" : ""}`}>
                      <span className="st">{solved.has(p.id) ? <CheckCircle2 className="h-4 w-4" /> : number.get(p.id)}</span>
                      <b>{p.title}</b>
                      <span className={`tag ${difficultyClass(p.difficulty)}`}>{p.difficulty}</span>
                      {p.access === "free" ? (
                        <span className="badge free">FREE</span>
                      ) : (
                        <span className="badge prem">
                          {p.locked && <Lock className="h-3 w-3" />} PREMIUM
                        </span>
                      )}
                      <span className="go">{p.locked ? "Unlock" : "Solve"}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            {data && !data.unlocked && all.length > free && (
              <div id="unlock" style={{ marginTop: 32 }}>
                <Upgrade plan={data.plan} title={`Unlock all ${all.length} ${YEAR_NAMES[year]} problems`} text={`Premium practice opens every premium problem in all four years. ${data.rules.solutionsLabel} for ${YEAR_NAMES[year]}.`} />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
