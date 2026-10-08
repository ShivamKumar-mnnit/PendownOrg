import { useState } from "react";
import { Link } from "react-router-dom";
import { Head, Page } from "../components/ui";
import { encodeTest } from "../lib/practiceTests";
import { usePageSEO } from "../lib/seo";

const blankQuestion = () => ({ q: "", o: ["", "", "", ""], a: 0 });

export default function CreateTest() {
  usePageSEO({
    title: "Create tests",
    description: "Create a multiple-choice test for your students and share it as a link. Students take it and see their score instantly.",
    path: "/tests",
  });

  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState("20");
  const [questions, setQuestions] = useState(() => [blankQuestion(), blankQuestion(), blankQuestion()]);
  const [error, setError] = useState("");
  const [share, setShare] = useState(null);
  const [copied, setCopied] = useState(false);

  function updateQuestion(i, patch) {
    setQuestions((qs) => qs.map((q, j) => (j === i ? { ...q, ...patch } : q)));
  }

  function makeTest() {
    const qs = questions
      .map((q) => ({ q: q.q.trim(), o: q.o.map((x) => x.trim()), a: q.a }))
      .filter((q) => q.q && q.o.every(Boolean));
    const t = title.trim();
    if (!t || !qs.length) {
      setError("Add a title and at least one complete question (question plus four options).");
      return;
    }
    setError("");
    const path = `/take?d=${encodeURIComponent(encodeTest({ t, m: Number(minutes) || 0, qs }))}`;
    setShare({ count: qs.length, path, url: window.location.origin + path });
    setCopied(false);
  }

  function copy() {
    navigator.clipboard?.writeText(share.url).then(() => setCopied(true));
  }

  return (
    <Page>
      <Head title="Create a test for your students">
        Add multiple-choice questions, then share the link. Students open it, take the test and see their score.
      </Head>
      <div className="tools">
        <div>
          <div className="panel">
            <label className="l" htmlFor="tt" style={{ marginTop: 0 }}>
              Test title
            </label>
            <input
              id="tt"
              className="inp"
              placeholder="Example: C programming, operators and if-else"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <label className="l" htmlFor="tm">
              Time limit in minutes (0 for no limit)
            </label>
            <input id="tm" className="inp" type="number" min="0" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
          </div>
        </div>
        <div>
          <div className="panel">
            <h3 style={{ fontSize: 18 }}>Your share link</h3>
            {share ? (
              <>
                <b>
                  {share.count} question{share.count > 1 ? "s" : ""} ready.
                </b>
                <div className="linkbox">{share.url}</div>
                <div className="row">
                  <button type="button" className="btn" onClick={copy}>
                    {copied ? "Copied" : "Copy link"}
                  </button>
                  <Link className="btn ghost" to={share.path}>
                    Preview test
                  </Link>
                </div>
              </>
            ) : (
              <div className="note">Your link appears here after you create the test.</div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        {questions.map((q, i) => (
          <div className="q" key={i}>
            <b>Question {i + 1}</b>
            <label className="l" style={{ marginTop: 10 }}>
              Question text
            </label>
            <input className="inp" placeholder="Type the question" value={q.q} onChange={(e) => updateQuestion(i, { q: e.target.value })} />
            <div className="two" style={{ marginTop: 6 }}>
              {q.o.map((o, j) => (
                <div className="opt" key={j}>
                  <input
                    type="radio"
                    name={`c${i}`}
                    checked={q.a === j}
                    onChange={() => updateQuestion(i, { a: j })}
                    aria-label={`Mark option ${"ABCD"[j]} as correct`}
                  />
                  <input
                    className="inp"
                    placeholder={`Option ${"ABCD"[j]}`}
                    value={o}
                    onChange={(e) => updateQuestion(i, { o: q.o.map((x, k) => (k === j ? e.target.value : x)) })}
                  />
                </div>
              ))}
            </div>
            <div className="note">Select the circle next to the correct option.</div>
          </div>
        ))}
      </div>
      <div className="row">
        <button type="button" className="btn ghost" onClick={() => setQuestions((qs) => [...qs, blankQuestion()])}>
          Add question
        </button>
        <button type="button" className="btn" onClick={makeTest}>
          Create test link
        </button>
      </div>
      {error && (
        <div className="note">
          <span className="bad">{error}</span>
        </div>
      )}
    </Page>
  );
}
