import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Copy, Lightbulb, Lock, ScrollText, Sparkles } from "lucide-react";
import { Head, Page } from "../components/ui";
import Solver from "../components/Solver";
import RichText from "../components/RichText";
import Upgrade from "../components/Upgrade";
import { YEAR_NAMES, difficultyClass, formatsOf, fullDescription, samplesOf, useProblem } from "../lib/problemBank";
import { syncSolved } from "../lib/account";
import { usePageSEO } from "../lib/seo";

/** Statement, input and output format, constraints and sample tests. */
export function ProblemStatement({ p }) {
  const f = formatsOf(p);
  const samples = samplesOf(p);
  return (
    <div className="statement">
      <RichText text={fullDescription(p)} />
      {f.input && (
        <>
          <h4>Input format</h4>
          <RichText text={f.input} />
        </>
      )}
      {f.output && (
        <>
          <h4>Output format</h4>
          <RichText text={f.output} />
        </>
      )}
      {f.constraints && (
        <>
          <h4>Constraints</h4>
          <RichText text={f.constraints} />
        </>
      )}
      {samples.map((s, i) => (
        <div key={i} className="sample">
          <h4>Sample test case {i + 1}</h4>
          <div className="sample-io">
            <div>
              <small>Input</small>
              <pre>{s.input || " "}</pre>
            </div>
            <div>
              <small>{p.kind === "stdio" ? "Output" : "Returns"}</small>
              <pre>{s.output || " "}</pre>
            </div>
          </div>
        </div>
      ))}
      {p.kind === "stdio" && p.caseCount > 0 && <p className="note">Submit also runs {p.caseCount} hidden test case{p.caseCount > 1 ? "s" : ""}.</p>}
      {p.kind === "function" && p.tests?.length > 2 && <p className="note">Submit checks all {p.tests.length} test cases.</p>}
    </div>
  );
}

const SOLUTION_NOTE = {
  hide: (y) => `In ${y} you write your own solutions, so the full solution isn't shown. Use the hints and the sample tests, then submit to check your answer.`,
  solved: () => "The full solution opens here once you submit a correct answer.",
  premium: () => "Full solutions for this year are part of premium practice.",
};

function Hints({ p }) {
  const [shown, setShown] = useState(0);
  if (!p.hintCount) return <p className="note">There are no hints for this problem.</p>;
  if (!p.hints.length) return <p className="note">{p.hintMode === "premium" ? "Hints for this year are part of premium practice." : "Hints are switched off for this problem."}</p>;
  return (
    <div className="hints">
      {p.hints.slice(0, shown).map((h, i) => (
        <div key={i} className="hint">
          <b>Hint {i + 1}</b>
          <RichText text={h} />
        </div>
      ))}
      {shown < p.hints.length && (
        <button type="button" className="btn ghost" onClick={() => setShown(shown + 1)}>
          <Lightbulb className="h-4 w-4" /> Show hint {shown + 1} of {p.hints.length}
        </button>
      )}
    </div>
  );
}

function Solution({ p, plan, unlocked }) {
  const [copied, setCopied] = useState(false);
  if (!p.solution)
    return (
      <div>
        <p className="note">{p.hasSolution ? SOLUTION_NOTE[p.solutionMode]?.(YEAR_NAMES[p.year]) || "The solution isn't shown for this problem." : "There's no written solution for this problem yet."}</p>
        {p.hasSolution && p.solutionMode === "premium" && !unlocked && <Upgrade plan={plan} compact title="See full solutions" />}
      </div>
    );
  return (
    <div className="solution">
      <div className="split-head" style={{ margin: "0 0 8px" }}>
        <b>Reference solution (JavaScript)</b>
        <button
          type="button"
          className="ib"
          title="Copy code"
          onClick={() => navigator.clipboard?.writeText(p.solution.code).then(() => setCopied(true))}
        >
          <Copy className="h-4 w-4" />
        </button>
      </div>
      {copied && <small className="note ok">Copied.</small>}
      <pre className="code-block">{p.solution.code}</pre>
      {p.solution.explanation && (
        <>
          <h4>How it works</h4>
          <RichText text={p.solution.explanation} />
        </>
      )}
      <p className="note">Try writing it yourself first. Reading a solution helps most after an honest attempt.</p>
    </div>
  );
}

function Locked({ d }) {
  const p = d.item;
  return (
    <Page>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/problems">Practice</Link>
        <ChevronRight className="h-4 w-4" />
        <Link to={`/problems/year/${p.year}`}>{YEAR_NAMES[p.year]}</Link>
        <ChevronRight className="h-4 w-4" />
        <span>{p.title}</span>
      </nav>
      <div className="locked-problem">
        <div className="locked-card">
          <div className="meta" style={{ justifyContent: "flex-start", gap: 10 }}>
            <span className={`tag ${difficultyClass(p.difficulty)}`}>{p.difficulty}</span>
            <span className="badge prem">
              <Lock className="h-3 w-3" /> PREMIUM
            </span>
            <small>{p.topic}</small>
          </div>
          <h1>{p.title}</h1>
          <p className="teaser">{p.teaser}…</p>
          <div className="locked-fade" aria-hidden="true" />
          <p className="note">
            This is a premium problem. The full statement, test cases, editor{p.year === 1 ? " and solution" : ""} open once you unlock premium practice.
          </p>
          <Link to={`/problems/year/${p.year}`} className="btn ghost">
            <ChevronLeft className="h-4 w-4" /> Back to free {YEAR_NAMES[p.year]} problems
          </Link>
        </div>
        <Upgrade plan={d.plan} title="Unlock this problem and every premium problem" text={d.signedIn ? "Pay once and every premium problem opens on your account straight away." : "Sign in (or create a free account), then pay once. Premium problems open on your account straight away."} />
      </div>
    </Page>
  );
}

export default function Problem() {
  const { id } = useParams();
  const [bump, setBump] = useState(0);
  const { data, error, loading } = useProblem(id, bump);
  const [tab, setTab] = useState("problem");
  const p = data?.item;

  usePageSEO({
    title: p ? p.title : "Problem",
    description: p ? String(p.description || p.teaser || "").slice(0, 150) : "Pick a problem from the list.",
    path: `/problem/${id}`,
  });

  if (!data) {
    if (loading) return <Page narrow={620}><p className="note">Loading the problem…</p></Page>;
    return (
      <Page>
        <Head title="Problem not found">{error && !/not found/i.test(error) ? error : "Pick a problem from the list."}</Head>
        <Link className="btn" to="/problems">
          View problems
        </Link>
      </Page>
    );
  }
  if (data.locked) return <Locked d={data} />;

  async function solvedNow() {
    // Saved progress can open a solution that waits for a correct answer.
    if (p.solutionMode === "solved" && !p.solution) {
      await syncSolved([p.id]);
      setBump((n) => n + 1);
    }
  }

  const tabs = [
    ["problem", "Problem", ScrollText],
    ["hints", `Hints${p.hintCount ? ` (${p.hintCount})` : ""}`, Lightbulb],
    ["solution", "Solution", Sparkles],
  ];

  return (
    <section className="page problem-page">
      <div className="wrap">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link to="/problems">Practice</Link>
          <ChevronRight className="h-4 w-4" />
          <Link to={`/problems/year/${p.year}`}>{YEAR_NAMES[p.year]}</Link>
          <ChevronRight className="h-4 w-4" />
          <Link to={`/problems/year/${p.year}#${p.book || ""}`}>{p.topic}</Link>
        </nav>
        <div className="problem-top">
          <div>
            <h1>{p.title}</h1>
            <div className="meta" style={{ justifyContent: "flex-start", gap: 10 }}>
              <span className={`tag ${difficultyClass(p.difficulty)}`}>{p.difficulty}</span>
              {p.access === "free" ? <span className="badge free">FREE</span> : <span className="badge prem">PREMIUM</span>}
              <small>{p.kind === "stdio" ? "Input / output" : "Function"}</small>
            </div>
          </div>
          <div className="row">
            {data.prev && (
              <Link className="btn ghost" to={`/problem/${data.prev.id}`} title={data.prev.title}>
                <ChevronLeft className="h-4 w-4" /> Previous
              </Link>
            )}
            {data.next && (
              <Link className="btn ghost" to={`/problem/${data.next.id}`} title={data.next.title}>
                Next <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>

        <div className="problem-split">
          <div className="panel problem-left">
            <div className="ptabs" role="tablist">
              {tabs.map(([k, l, Icon]) => (
                <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>
                  <Icon className="h-4 w-4" /> {l}
                  {k === "solution" && !p.solution && <Lock className="h-3 w-3" />}
                </button>
              ))}
            </div>
            {tab === "problem" && <ProblemStatement p={p} />}
            {tab === "hints" && <Hints key={p.id} p={p} />}
            {tab === "solution" && <Solution p={p} plan={data.plan} unlocked={data.unlocked} />}
          </div>
          <div className="panel problem-right">
            <Solver key={p.id} p={p} onSolved={solvedNow} />
          </div>
        </div>
      </div>
    </section>
  );
}
