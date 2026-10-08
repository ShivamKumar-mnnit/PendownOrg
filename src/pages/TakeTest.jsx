import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Head, Page } from "../components/ui";
import { SAMPLES, decodeTest } from "../lib/practiceTests";
import { addSolved } from "../lib/student";
import { usePageSEO } from "../lib/seo";

function loadTest(params) {
  const sample = params.get("s");
  if (sample) return SAMPLES[sample] || null;
  const data = params.get("d");
  return data ? decodeTest(data) : null;
}

const fmt = (t) => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;

export default function TakeTest() {
  const [params] = useSearchParams();
  const test = useMemo(() => loadTest(params), [params]);

  usePageSEO({
    title: test ? test.t : "Test not found",
    description: "Take the test, then see your score with the correct answers.",
    path: "/take",
    noindex: true,
  });

  if (!test) {
    return (
      <Page>
        <Head title="Test not found">This link is incomplete. Ask your trainer to share the test link again.</Head>
        <Link className="btn" to="/tests">
          Create a test
        </Link>
      </Page>
    );
  }

  return <Runner key={params.toString()} test={test} />;
}

function Runner({ test }) {
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [left, setLeft] = useState(test.m * 60);
  // Mirrors of the latest answers and time, read from the countdown timer.
  const answersRef = useRef({});
  const leftRef = useRef(test.m * 60);
  const doneRef = useRef(false);

  const grade = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    const marks = test.qs.map((x, i) => answersRef.current[i] === x.a);
    const score = marks.filter(Boolean).length;
    setResult({ marks, score, added: addSolved(score) });
  }, [test]);

  useEffect(() => {
    if (!test.m) return;
    const id = setInterval(() => {
      if (doneRef.current) return clearInterval(id);
      leftRef.current -= 1;
      setLeft(leftRef.current);
      if (leftRef.current <= 0) grade();
    }, 1000);
    return () => clearInterval(id);
  }, [test, grade]);

  function choose(i, j) {
    const next = { ...answersRef.current, [i]: j };
    answersRef.current = next;
    setAnswers(next);
  }

  return (
    <Page narrow={760}>
      <Head title={test.t}>
        {test.qs.length} questions{test.m ? ` · ${test.m} minutes` : ""}
      </Head>
      {test.m > 0 && (
        <div className="panel" style={{ marginBottom: 20, padding: "14px 20px" }}>
          <b>Time left: {fmt(Math.max(left, 0))}</b>
        </div>
      )}
      {test.qs.map((x, i) => (
        <div className="q" key={i}>
          <b>
            {i + 1}. {x.q}
          </b>
          {x.o.map((o, j) => (
            <label className="opt" key={j}>
              <input type="radio" name={`t${i}`} checked={answers[i] === j} disabled={!!result} onChange={() => choose(i, j)} /> {o}
            </label>
          ))}
        </div>
      ))}
      <button type="button" className="btn" onClick={grade} disabled={!!result}>
        Submit test
      </button>
      {result && (
        <div className="panel" style={{ marginTop: 20 }}>
          <h3>
            Score: {result.score} / {test.qs.length}
          </h3>
          {test.qs.map((x, i) => (
            <div className="note" key={i}>
              <b>{i + 1}.</b>{" "}
              {result.marks[i] ? (
                <span className="ok">Correct</span>
              ) : (
                <>
                  <span className="bad">Wrong</span> · Answer: {x.o[x.a]}
                </>
              )}
            </div>
          ))}
          {result.added === null ? (
            <div className="note">
              <Link to="/dashboard" style={{ color: "var(--color-accent)" }}>
                Log in on the Dashboard page
              </Link>{" "}
              to count your solved questions.
            </div>
          ) : (
            <div className="note ok">{result.added} added to your dashboard.</div>
          )}
        </div>
      )}
    </Page>
  );
}
