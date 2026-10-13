import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Head, Page } from "../components/ui";
import { BOOKS, YEAR_TITLES, difficultyClass } from "../lib/problems";
import { groupByTopic, solvedSet, useProblems } from "../lib/problemBank";
import { getStudent } from "../lib/student";
import { usePageSEO } from "../lib/seo";

const PLATFORMS = [
  ["https://leetcode.com/problemset/", "LeetCode", "Large problem set with company-tagged questions"],
  ["https://www.hackerrank.com/domains", "HackerRank", "Structured tracks by domain and language"],
  ["https://www.hackerearth.com/practice/", "HackerEarth", "Practice problems and hiring challenges"],
];

function Book({ book, done, problems }) {
  const [level, setLevel] = useState("All");
  const [query, setQuery] = useState("");
  const list = problems.filter((p) => p.book === book[0]);
  const q = query.trim().toLowerCase();
  const shown = list
    .map((p, i) => ({ p, n: i + 1 }))
    .filter(({ p }) => (level === "All" || p.difficulty === level) && (p.title + " " + p.topic).toLowerCase().includes(q));

  return (
    <Page>
      <Link to="/problems" className="note back">
        ‹ All books
      </Link>
      <Head title={book[2]}>{list.length} questions, ordered from easy to harder. Solve them in order for the best practice.</Head>
      <input
        className="inp"
        placeholder="Search in this book"
        aria-label="Search problems"
        style={{ maxWidth: 340, marginBottom: 16 }}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="row" style={{ marginBottom: 20 }}>
        {["All", "Easy", "Medium", "Advanced"].map((d) => (
          <button key={d} type="button" className={`chip${d === level ? " on" : ""}`} onClick={() => setLevel(d)}>
            {d}
          </button>
        ))}
      </div>
      <div className="note">{shown.length ? `${shown.length} questions` : "No question found. Try a different search."}</div>
      <div style={{ marginTop: 12 }}>
        {shown.map(({ p, n }) => (
          <Link key={p.id} className="prow" to={`/problem/${p.id}`}>
            <span className="st">{done[p.id] ? "✓" : ""}</span>
            <b>
              Q{n}. {p.title}
            </b>
            <span className={`tag ${difficultyClass(p.difficulty)}`}>{p.difficulty}</span>
          </Link>
        ))}
      </div>
    </Page>
  );
}

export default function Problems() {
  const { bookId } = useParams();
  const book = BOOKS.find((b) => b[0] === bookId);
  const { problems } = useProblems();
  const done = { ...(getStudent()?.done || {}) };
  for (const id of solvedSet()) done[id] = 1;

  usePageSEO({
    title: book ? `${book[2]} problems` : "Practice problems",
    description: "Practice problems grouped into books, year by year, checked automatically in your browser.",
    path: book ? `/problems/${book[0]}` : "/problems",
  });

  if (book) return <Book key={book[0]} book={book} done={done} problems={problems} />;

  return (
    <Page>
      <Head title="Practice problems">
        Questions are grouped into books, year by year. Solve in JavaScript or Python, or in any language for input/output problems. Solved problems count on your dashboard.
      </Head>
      {[1, 2, 3, 4].map((y) => {
        const groups = groupByTopic(problems.filter((p) => p.year === y));
        const total = groups.reduce((n, g) => n + g.items.length, 0);
        return (
          <div key={y}>
            <div className="split-head" style={{ margin: `${y > 1 ? "56px" : "0"} 0 20px` }}>
              <div className="head" style={{ margin: 0 }}>
                <h2 style={{ fontSize: 26 }}>{YEAR_TITLES[y]}</h2>
              </div>
              {total > 0 && (
                <Link className="btn ghost" to={`/problems/year/${y}`}>
                  All {total} on one page
                </Link>
              )}
            </div>
            <div className="cards">
              {groups.map((g, i) => {
                const n = g.items.filter((p) => done[p.id]).length;
                const isBook = BOOKS.some((b) => b[0] === g.key);
                return (
                  <Link key={g.key} className="card" to={isBook ? `/problems/${g.key}` : `/problems/year/${y}#${encodeURIComponent(g.key)}`}>
                    <div className="meta">
                      <span className="tag">{y === 1 ? `Book ${i + 1}` : "Book"}</span>
                      <small>
                        {n} of {g.items.length} solved
                      </small>
                    </div>
                    <h3>{g.title}</h3>
                    <div className="bar2" style={{ margin: "12px 0 0" }}>
                      <b style={{ width: `${g.items.length ? Math.round((n / g.items.length) * 100) : 0}%` }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
      <Head title="Want more practice?" style={{ margin: "56px 0 20px" }}>
        For a wider library, keep practising on these platforms too.
      </Head>
      <div className="more">
        {PLATFORMS.map(([href, name, text]) => (
          <a key={name} href={href} target="_blank" rel="noopener noreferrer">
            <b>{name}</b>
            <span>{text}</span>
          </a>
        ))}
      </div>
    </Page>
  );
}
