import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, ChevronDown, Search } from "lucide-react";
import Solver from "../components/Solver";
import { ProblemStatement } from "./Problem";
import { YEAR_TITLES, difficultyClass } from "../lib/problems";
import { groupByTopic, solvedSet, useProblems } from "../lib/problemBank";
import { getStudent } from "../lib/student";
import { useAccount } from "../lib/account";
import { usePageSEO } from "../lib/seo";

/**
 * Every problem of one year on a single page, grouped by topic. A problem
 * opens in place with its statement and an editor, so students can solve
 * one after another without leaving the page.
 */
export default function YearPractice() {
  const year = Math.min(4, Math.max(1, Number(useParams().year) || 1));
  const { problems, loaded } = useProblems();
  const { user } = useAccount();
  const [open, setOpen] = useState(null);
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("All");
  const [unsolved, setUnsolved] = useState(false);
  const [localSolved, setSolved] = useState(() => {
    const s = solvedSet();
    Object.keys(getStudent()?.done || {}).forEach((id) => s.add(id));
    return s;
  });
  // Problems solved on other devices (saved to the account) count too.
  const solved = useMemo(() => new Set([...localSolved, ...(user?.progress?.solved || [])]), [localSolved, user]);

  usePageSEO({
    title: `${YEAR_TITLES[year]}: practice problems`,
    description: `All ${YEAR_TITLES[year]} coding problems on one page. Read, solve and check each one without leaving the page.`,
    path: `/problems/year/${year}`,
  });


  // A link like /problems/year/1#loops scrolls to that topic.
  useEffect(() => {
    if (!loaded || !window.location.hash) return;
    document.getElementById("t-" + decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView({ block: "start" });
  }, [loaded]);

  const all = useMemo(() => problems.filter((p) => p.year === year), [problems, year]);
  const q = query.trim().toLowerCase();
  const groups = useMemo(
    () =>
      groupByTopic(all)
        .map((g) => ({ ...g, all: g.items.length, items: g.items.filter((p) => (level === "All" || p.difficulty === level) && (!unsolved || !solved.has(p.id) || p.id === open) && (!q || (p.title + " " + p.topic).toLowerCase().includes(q))) }))
        .filter((g) => g.items.length),
    [all, level, unsolved, solved, q, open],
  );
  const shown = groups.flatMap((g) => g.items);
  const done = all.filter((p) => solved.has(p.id)).length;

  function toggle(id) {
    setOpen((o) => (o === id ? null : id));
    requestAnimationFrame(() => document.getElementById("p-" + id)?.scrollIntoView({ block: "start", behavior: "smooth" }));
  }
  function goNext(id) {
    const i = shown.findIndex((p) => p.id === id);
    if (shown[i + 1]) toggle(shown[i + 1].id);
  }

  return (
    <section className="page year-page">
      <div className="wrap">
        <div className="year-head">
          <div>
            <Link to="/problems" className="note back">
              ‹ All practice problems
            </Link>
            <h1>{YEAR_TITLES[year]}</h1>
            <p className="lead-p" style={{ marginBottom: 0 }}>
              {all.length} problems on one page. Open any problem to read it and solve it right here.
            </p>
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
              Year {y}
            </Link>
          ))}
        </div>

        <div className="year-grid">
          <aside className="year-side">
            <div className="search">
              <Search className="h-4 w-4" />
              <input className="inp" placeholder="Search problems" aria-label="Search problems" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="row" style={{ gap: 6, margin: "12px 0" }}>
              {["All", "Easy", "Medium", "Advanced"].map((d) => (
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
                <a key={g.key} href={`#t-${g.key}`} onClick={(e) => {
                    e.preventDefault();
                    document.getElementById("t-" + g.key)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}>
                  <span>{g.title}</span>
                  <small>
                    {g.items.filter((p) => solved.has(p.id)).length}/{g.items.length}
                  </small>
                </a>
              ))}
            </nav>
          </aside>

          <div>
            {!shown.length && (
              <div className="empty">
                <b>{loaded ? "Nothing matches" : "Loading problems…"}</b>
                <span>{loaded ? "Try another search or filter." : ""}</span>
              </div>
            )}
            {groups.map((g) => (
              <section key={g.key} id={"t-" + g.key} className="ytopic">
                <h2>
                  {g.title} <small>{g.items.length} problems</small>
                </h2>
                <div className="ylist">
                  {g.items.map((p, i) => {
                    const isOpen = open === p.id;
                    return (
                      <div key={p.id} id={"p-" + p.id} className={`yrow${isOpen ? " open" : ""}`}>
                        <button type="button" className="yrow-h" onClick={() => toggle(p.id)} aria-expanded={isOpen}>
                          <span className={`st${solved.has(p.id) ? " ok" : ""}`}>{solved.has(p.id) ? <CheckCircle2 className="h-4 w-4" /> : i + 1}</span>
                          <b>{p.title}</b>
                          {p.kind === "stdio" && <span className="tag">Any language</span>}
                          <span className={`tag ${difficultyClass(p.difficulty)}`}>{p.difficulty}</span>
                          <ChevronDown className="h-4 w-4 chev" />
                        </button>
                        {isOpen && (
                          <div className="yrow-b">
                            <div className="ystatement">
                              <ProblemStatement p={p} />
                              <Link to={`/problem/${p.id}`} className="linkish" style={{ fontSize: 13 }}>
                                Open on its own page
                              </Link>
                            </div>
                            <div>
                              <Solver p={p} compact onSolved={(id) => setSolved((s) => new Set([...s, id]))} />
                              <button type="button" className="btn ghost" style={{ marginTop: 12 }} onClick={() => goNext(p.id)}>
                                Next problem
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
