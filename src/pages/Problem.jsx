import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Head, Page } from "../components/ui";
import { BOOK_NAMES, difficultyClass, exampleFor, getProblem, judge, problemsInBook, starterCode } from "../lib/problems";
import { markProblemSolved } from "../lib/student";
import { usePageSEO } from "../lib/seo";

function Workspace({ p }) {
  const [code, setCode] = useState(() => starterCode(p));
  const [result, setResult] = useState(null);

  const list = problemsInBook(p.b);
  const next = list[list.indexOf(p) + 1];

  function run() {
    const r = judge(p, code);
    setResult(r.err ? r : { ...r, solved: r.ok ? markProblemSolved(p.id) : undefined });
  }

  return (
    <div className="panel">
      <label className="l" htmlFor="code" style={{ marginTop: 0 }}>
        Your solution (JavaScript)
      </label>
      <textarea
        id="code"
        className="inp code"
        spellCheck={false}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => {
          // Tab indents instead of leaving the editor.
          if (e.key !== "Tab" || e.shiftKey) return;
          e.preventDefault();
          const el = e.currentTarget;
          const { selectionStart: s, selectionEnd: end } = el;
          const v = code.slice(0, s) + "  " + code.slice(end);
          setCode(v);
          requestAnimationFrame(() => el.setSelectionRange(s + 2, s + 2));
        }}
      />
      <div className="row" style={{ marginTop: 14 }}>
        <button type="button" className="btn" onClick={run}>
          Run tests
        </button>
        <button
          type="button"
          className="btn ghost"
          onClick={() => {
            setCode(starterCode(p));
            setResult(null);
          }}
        >
          Reset code
        </button>
        {next && (
          <Link className="btn ghost" to={`/problem/${next.id}`}>
            Next question
          </Link>
        )}
      </div>
      <div style={{ marginTop: 16 }}>
        {result?.err && <span className="bad">{result.err}</span>}
        {result?.res && (
          <>
            <b>
              {result.res.filter((x) => x.pass).length} of {result.res.length} tests passed
            </b>
            {result.res.map((x, i) => (
              <div className="note" key={i}>
                {x.pass ? (
                  <span className="ok">Test {i + 1} passed</span>
                ) : (
                  <>
                    <span className="bad">Test {i + 1} failed</span> Input: {JSON.stringify(x.a)} Expected: {JSON.stringify(x.exp)} Got:{" "}
                    {x.err ? x.err : String(JSON.stringify(x.got))}
                  </>
                )}
              </div>
            ))}
            {result.ok && result.solved === "already" && (
              <div className="note ok">Solved. This problem is already counted on your dashboard.</div>
            )}
            {result.ok && result.solved === "new" && <div className="note ok">Solved. Added to your dashboard.</div>}
            {result.ok && result.solved === null && (
              <div className="note ok">
                All tests passed.{" "}
                <Link to="/dashboard" style={{ color: "var(--color-accent)" }}>
                  Log in
                </Link>{" "}
                to count it on your dashboard.
              </div>
            )}
          </>
        )}
      </div>
      <div className="note">
        Problems are checked in your browser, so solutions are written in JavaScript. To run C, C++, Java or Python, use the{" "}
        <Link to="/compiler" style={{ color: "var(--color-accent)" }}>
          online compiler
        </Link>
        .
      </div>
    </div>
  );
}

export default function Problem() {
  const { id } = useParams();
  const p = getProblem(id);

  usePageSEO({
    title: p ? p.t : "Problem not found",
    description: p ? p.desc : "Pick a problem from the list.",
    path: `/problem/${id}`,
  });

  if (!p) {
    return (
      <Page>
        <Head title="Problem not found">Pick a problem from the list.</Head>
        <Link className="btn" to="/problems">
          View problems
        </Link>
      </Page>
    );
  }

  const desc =
    p.desc +
    (p.ll ? " The list is given by its head node. Each node has val and next (null at the end). Examples show lists as arrays." : "") +
    (p.out ? " Return the head node of the result (null for an empty list)." : "");

  return (
    <Page>
      <Link to={`/problems/${p.b}`} className="note back">
        ‹ {BOOK_NAMES[p.b]}
      </Link>
      <div className="meta" style={{ justifyContent: "flex-start", gap: 12 }}>
        <span className={`tag ${difficultyClass(p.d)}`}>{p.d}</span>
        <small>{p.tp}</small>
      </div>
      <h2 style={{ fontSize: "clamp(26px,4vw,36px)", margin: "10px 0 24px" }}>{p.t}</h2>
      <div className="tools">
        <div className="panel">
          <h3 style={{ fontSize: 18 }}>Problem</h3>
          <p style={{ color: "var(--color-fg-muted)", margin: "10px 0 16px" }}>{desc}</p>
          <b style={{ fontSize: 14 }}>Function</b>
          <pre className="out" style={{ minHeight: 0, margin: "6px 0 16px" }}>
            {p.fn}({p.pa})
          </pre>
          <b style={{ fontSize: 14 }}>Example</b>
          <pre className="out" style={{ minHeight: 0, margin: "6px 0 0" }}>
            {exampleFor(p)}
          </pre>
        </div>
        <Workspace key={p.id} p={p} />
      </div>
    </Page>
  );
}
