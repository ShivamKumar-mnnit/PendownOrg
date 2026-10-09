import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Head, Page } from "../components/ui";
import { SAMPLES } from "../lib/practiceTests";
import { TEST_TYPE_LABELS, listPublishedTests } from "../lib/testsApi";
import { usePageSEO } from "../lib/seo";

const FILTERS = [["all", "All"], ...Object.entries(TEST_TYPE_LABELS)];
const TYPE_ICON = { mcq: "📝", coding: "💻", olympiad: "🏅" };

export default function PracticeTests() {
  usePageSEO({
    title: "Tests and assessments",
    description: "MCQ tests, coding assessments and Olympiad-style papers for students, with instant scoring, answers and explanations.",
    path: "/practice",
  });

  const [live, setLive] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let on = true;
    // The ready-made tests below still work if the tests service is down.
    listPublishedTests().then(
      (t) => on && setLive(t),
      () => on && setLive([]),
    );
    return () => {
      on = false;
    };
  }, []);

  const shown = (live || []).filter((t) => filter === "all" || t.type === filter);

  return (
    <Page>
      <span className="eyebrow">Practice and assess</span>
      <Head title="Tests and assessments">
        MCQ tests, coding assessments and Olympiad-style papers. Take one, get scored instantly and learn from the explanations.
      </Head>

      {live === null && <p className="note">Loading tests…</p>}
      {live?.length > 0 && (
        <>
          <div className="chips" style={{ marginTop: 0, marginBottom: 20 }} role="tablist" aria-label="Filter tests">
            {FILTERS.map(([k, v]) => (
              <button key={k} type="button" className={`chip ${filter === k ? "on" : ""}`} onClick={() => setFilter(k)}>
                {v}
              </button>
            ))}
          </div>
          <div className="cards">
            {shown.map((t) => (
              <Link key={t.id} className="card tcard" to={`/assessment/${t.id}`}>
                <div className="meta">
                  <span className={`tag t-${t.type}`}>
                    {TYPE_ICON[t.type]} {TEST_TYPE_LABELS[t.type]}
                  </span>
                  <small>{t.durationMin ? `${t.durationMin} min` : "Untimed"}</small>
                </div>
                <h3>{t.title}</h3>
                <p>{t.description ? t.description.slice(0, 120) + (t.description.length > 120 ? "…" : "") : "Instant score with answers."}</p>
                <div className="tfoot">
                  <span>{t.questionCount} questions</span>
                  <span>{t.totalMarks} marks</span>
                  <b>Start →</b>
                </div>
              </Link>
            ))}
            {!shown.length && <p className="note">No {TEST_TYPE_LABELS[filter]?.toLowerCase()} tests are open right now.</p>}
          </div>
        </>
      )}

      <Head title="Quick practice" style={{ marginTop: live?.length ? 64 : 0 }}>
        Short ready-made quizzes. No sign-up needed.
      </Head>
      <div className="cards">
        {Object.entries(SAMPLES).map(([id, t]) => (
          <Link key={id} className="card tcard" to={`/take?s=${id}`}>
            <div className="meta">
              <span className="tag">Practice quiz</span>
              <small>{t.m} min</small>
            </div>
            <h3>{t.t}</h3>
            <p>Instant score and answers.</p>
            <div className="tfoot">
              <span>{t.qs.length} questions</span>
              <b>Start →</b>
            </div>
          </Link>
        ))}
      </div>
      <div className="panel" style={{ marginTop: 32 }}>
        <h3 style={{ fontSize: 20 }}>Are you a trainer?</h3>
        <p style={{ color: "var(--color-fg-muted)", margin: "8px 0 18px" }}>
          Create a quick test, share the link with your class and let students practice.
        </p>
        <Link className="btn" to="/tests">
          Create a test
        </Link>
      </div>
    </Page>
  );
}
