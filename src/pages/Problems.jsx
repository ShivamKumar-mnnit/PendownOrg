import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Head, Page } from "../components/ui";
import { BOOKS, YEAR_TITLES, difficultyClass, problemsInBook } from "../lib/problems";
import { getStudent } from "../lib/student";
import { usePageSEO } from "../lib/seo";

const PLATFORMS = [
  ["https://leetcode.com/problemset/", "LeetCode", "Large problem set with company-tagged questions"],
  ["https://www.hackerrank.com/domains", "HackerRank", "Structured tracks by domain and language"],
  ["https://www.hackerearth.com/practice/", "HackerEarth", "Practice problems and hiring challenges"],
];

function Book({ book, done }) {
  const [level, setLevel] = useState("All");
  const [query, setQuery] = useState("");
  const list = problemsInBook(book[0]);
  const q = query.trim().toLowerCase();
  const shown = list
    .map((p, i) => ({ p, n: i + 1 }))
    .filter(({ p }) => (level === "All" || p.d === level) && (p.t + " " + p.tp).toLowerCase().includes(q));

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
              Q{n}. {p.t}
            </b>
            <span className={`tag ${difficultyClass(p.d)}`}>{p.d}</span>
          </Link>
        ))}
      </div>
    </Page>
  );
}

export default function Problems() {
  const { bookId } = useParams();
  const book = BOOKS.find((b) => b[0] === bookId);
  const done = getStudent()?.done || {};

  usePageSEO({
    title: book ? `${book[2]} problems` : "Practice problems",
    description: "Practice problems grouped into books, year by year, checked automatically in your browser.",
    path: book ? `/problems/${book[0]}` : "/problems",
  });

  if (book) return <Book key={book[0]} book={book} done={done} />;

  return (
    <Page>
      <Head title="Practice problems">
        Questions are grouped into books, year by year. Finish a book and you know that topic. Solved problems count on your dashboard.
      </Head>
      {[1, 2, 3, 4].map((y) => (
        <div key={y}>
          <div className="head" style={{ margin: `${y > 1 ? "56px" : "0"} 0 20px` }}>
            <h2 style={{ fontSize: 26 }}>{YEAR_TITLES[y]}</h2>
          </div>
          <div className="cards">
            {BOOKS.filter((b) => b[1] === y).map((b, i) => {
              const list = problemsInBook(b[0]);
              const n = list.filter((p) => done[p.id]).length;
              return (
                <Link key={b[0]} className="card" to={`/problems/${b[0]}`}>
                  <div className="meta">
                    <span className="tag">{y === 1 ? `Book ${i + 1}` : "Book"}</span>
                    <small>
                      {n} of {list.length} solved
                    </small>
                  </div>
                  <h3>{b[2]}</h3>
                  <div className="bar2" style={{ margin: "12px 0 0" }}>
                    <b style={{ width: `${list.length ? Math.round((n / list.length) * 100) : 0}%` }} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
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
