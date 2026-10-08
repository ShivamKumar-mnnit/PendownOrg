import { Link } from "react-router-dom";
import { Head, Page } from "../components/ui";
import { SAMPLES } from "../lib/practiceTests";
import { usePageSEO } from "../lib/seo";

export default function PracticeTests() {
  usePageSEO({
    title: "Practice tests",
    description: "Ready-made practice tests for students. Answer the questions and see your score with the correct answers.",
    path: "/practice",
  });

  return (
    <Page>
      <Head title="Practice tests">
        Ready-made tests for students. Pick one, answer the questions and see your score with the correct answers.
      </Head>
      <div className="cards">
        {Object.entries(SAMPLES).map(([id, t]) => (
          <Link key={id} className="card" to={`/take?s=${id}`}>
            <div className="meta">
              <span className="tag">Practice test</span>
              <small>{t.qs.length} questions</small>
            </div>
            <h3>{t.t}</h3>
            <p>{t.m} minutes. Instant score and answers.</p>
          </Link>
        ))}
      </div>
      <div className="panel" style={{ marginTop: 32 }}>
        <h3 style={{ fontSize: 20 }}>Are you a trainer?</h3>
        <p style={{ color: "var(--color-fg-muted)", margin: "8px 0 18px" }}>
          Create your own test, share the link with your class and let students practice.
        </p>
        <Link className="btn" to="/tests">
          Create a test
        </Link>
      </div>
    </Page>
  );
}
