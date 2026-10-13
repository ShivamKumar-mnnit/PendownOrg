import { Link, useParams } from "react-router-dom";
import { Head, Page } from "../components/ui";
import Solver from "../components/Solver";
import RichText from "../components/RichText";
import { BOOK_NAMES, difficultyClass } from "../lib/problems";
import { exampleOf, fullDescription, useProblems } from "../lib/problemBank";
import { usePageSEO } from "../lib/seo";

export function ProblemStatement({ p }) {
  const ex = exampleOf(p);
  return (
    <>
      <RichText text={fullDescription(p)} />
      {p.kind === "function" ? (
        <>
          <b className="plabel">Function</b>
          <pre className="out" style={{ minHeight: 0 }}>
            {p.fn}({p.params})
          </pre>
          {ex && (
            <>
              <b className="plabel">Example</b>
              <pre className="out" style={{ minHeight: 0 }}>
                {ex.call} returns {ex.returns}
              </pre>
            </>
          )}
        </>
      ) : (
        (p.samples || []).map((s, i) => (
          <div key={i} className="two" style={{ gap: 10 }}>
            <div>
              <b className="plabel">Sample input {p.samples.length > 1 ? i + 1 : ""}</b>
              <pre className="out" style={{ minHeight: 0 }}>{s.input || " "}</pre>
            </div>
            <div>
              <b className="plabel">Sample output {p.samples.length > 1 ? i + 1 : ""}</b>
              <pre className="out" style={{ minHeight: 0 }}>{s.output || " "}</pre>
            </div>
          </div>
        ))
      )}
      {p.kind === "stdio" && p.caseCount > 0 && <p className="note">Plus {p.caseCount} hidden test{p.caseCount > 1 ? "s" : ""} when you run tests.</p>}
    </>
  );
}

export default function Problem() {
  const { id } = useParams();
  const { problems, loaded } = useProblems();
  const p = problems.find((x) => x.id === id);

  usePageSEO({
    title: p ? p.title : "Problem",
    description: p ? p.description : "Pick a problem from the list.",
    path: `/problem/${id}`,
  });

  if (!p) {
    if (!loaded) return <Page narrow={620}><p className="note">Loading the problem…</p></Page>;
    return (
      <Page>
        <Head title="Problem not found">Pick a problem from the list.</Head>
        <Link className="btn" to="/problems">
          View problems
        </Link>
      </Page>
    );
  }

  const siblings = problems.filter((x) => (p.book ? x.book === p.book : x.topic === p.topic && x.year === p.year));
  const next = siblings[siblings.indexOf(p) + 1];
  const back = p.book && BOOK_NAMES[p.book] ? [`/problems/${p.book}`, BOOK_NAMES[p.book]] : [`/problems/year/${p.year}`, `Year ${p.year} practice`];

  return (
    <Page>
      <Link to={back[0]} className="note back">
        ‹ {back[1]}
      </Link>
      <div className="meta" style={{ justifyContent: "flex-start", gap: 12 }}>
        <span className={`tag ${difficultyClass(p.difficulty)}`}>{p.difficulty}</span>
        <small>{p.topic}</small>
      </div>
      <h2 style={{ fontSize: "clamp(26px,4vw,36px)", margin: "10px 0 24px" }}>{p.title}</h2>
      <div className="tools problem-tools">
        <div className="panel">
          <h3 style={{ fontSize: 18, marginBottom: 10 }}>Problem</h3>
          <ProblemStatement p={p} />
        </div>
        <div className="panel">
          <Solver key={p.id} p={p} />
          {next && (
            <Link className="btn ghost" to={`/problem/${next.id}`} style={{ marginTop: 14 }}>
              Next question
            </Link>
          )}
        </div>
      </div>
    </Page>
  );
}
