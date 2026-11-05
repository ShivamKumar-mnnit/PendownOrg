import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Award, CheckCircle2, ChevronDown, Clock, Cpu, Lock, Printer, RotateCcw, Target, TrendingUp, XCircle } from "lucide-react";
import Logo from "../../components/Logo";
import { CV_LANG_NAMES, STATUS_TONE, VERDICTS, clock, fmtKb, fmtMs } from "../../lib/codevita/common";
import { useCv } from "../../lib/codevita/api";
import { usePageSEO } from "../../lib/seo";
import "./codevita.css";

const fmtWhen = (ts) => new Date(ts).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" });
const studentId = (uid) => "ANB-" + String(uid || "").replace(/^d/, "").toUpperCase().padStart(5, "0");

/** /codevita/report/:sid: the scorecard for one submission. */
export default function Report() {
  const { sid } = useParams();
  usePageSEO({ title: "Practice scorecard", description: "Your CodeVita practice scorecard.", path: `/codevita/report/${sid}`, noindex: true });
  const { data, error } = useCv(`/api/cv/submissions/${encodeURIComponent(sid)}`);
  const [showCode, setShowCode] = useState(false);

  if (error)
    return (
      <section className="page cv-page">
        <div className="wrap" style={{ maxWidth: 640 }}>
          <p className="note bad">{error}</p>
          <Link className="btn" to={`/account?next=/codevita/report/${sid}`}>
            Sign in
          </Link>
        </div>
      </section>
    );
  if (!data)
    return (
      <section className="page cv-page">
        <div className="wrap">
          <p className="note">Loading the scorecard…</p>
        </div>
      </section>
    );

  const s = data.submission;
  const r = s.result;
  if (!r)
    return (
      <section className="page cv-page">
        <div className="wrap" style={{ maxWidth: 640 }}>
          <p className="note">This submission is still being judged. Open the problem again to finish judging it.</p>
          <Link className="btn" to={`/codevita/solve/${s.pid}`}>
            Back to the problem
          </Link>
        </div>
      </section>
    );
  const tone = STATUS_TONE[r.status] || "warn";
  const pct = r.maxScore ? r.score / r.maxScore : 0;
  const C = 2 * Math.PI * 52;
  const samples = s.cases.filter((c) => c.sample);
  const hidden = s.cases.filter((c) => !c.sample);
  const passedOf = (list) => list.filter((c) => c.verdict === "AC").length;

  return (
    <section className="page cv-page">
      <div className="wrap cv-report-wrap">
        <div className="cv-report-tools cv-noprint">
          <Link to="/codevita?tab=subs" className="linkish">
            <ArrowLeft className="h-4 w-4" /> My submissions
          </Link>
          <div className="row" style={{ gap: 8 }}>
            <Link className="btn ghost" to={`/codevita/solve/${s.pid}`}>
              <RotateCcw className="h-4 w-4" /> Try again
            </Link>
            <button type="button" className="btn" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Print or save PDF
            </button>
          </div>
        </div>

        <article className="cv-report">
          <header className="cv-rep-head">
            <div className="cv-rep-brand">
              <Logo badgeClassName="h-9 w-9" textClassName="text-xl" />
              <div>
                <b>Coding practice scorecard</b>
                <small>CodeVita crash course · Anobyt</small>
              </div>
            </div>
            <div className="cv-rep-id">
              <small>Report ID</small>
              <b>{s.id.toUpperCase()}</b>
            </div>
          </header>

          <div className="cv-rep-banner">Practice assessment on Anobyt. Not an official TCS CodeVita result.</div>

          <dl className="cv-rep-grid">
            <div>
              <dt>Student name</dt>
              <dd>{data.student.name || "—"}</dd>
            </div>
            <div>
              <dt>Student ID</dt>
              <dd>{studentId(data.student.id)}</dd>
            </div>
            <div>
              <dt>Assessment</dt>
              <dd>{s.title}</dd>
            </div>
            <div>
              <dt>Submitted</dt>
              <dd>{fmtWhen(s.finishedAt || s.createdAt)}</dd>
            </div>
            <div>
              <dt>Language</dt>
              <dd>{CV_LANG_NAMES[s.language]}</dd>
            </div>
            <div>
              <dt>Mode</dt>
              <dd>{s.timed ? `Timed practice (${s.timed} min)` : "Practice"}</dd>
            </div>
            <div>
              <dt>Difficulty</dt>
              <dd>{s.difficulty}</dd>
            </div>
            <div>
              <dt>Time on problem</dt>
              <dd>{s.elapsedSec ? clock(s.elapsedSec) : "—"}</dd>
            </div>
          </dl>

          <div className="cv-rep-result">
            <div className="cv-rep-score">
              <svg viewBox="0 0 120 120" aria-hidden="true">
                <circle cx="60" cy="60" r="52" className="track" />
                <circle cx="60" cy="60" r="52" className={`fill tone-${tone}`} strokeDasharray={`${C * pct} ${C}`} transform="rotate(-90 60 60)" />
              </svg>
              <div>
                <b>{r.score}</b>
                <small>of {r.maxScore}</small>
              </div>
            </div>
            <div className="cv-rep-status">
              <span className={`cv-status tone-${tone}`}>
                {r.status === "Accepted" ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />} {r.status}
              </span>
              <div className="cv-rep-kpis">
                <div>
                  <Target className="h-4 w-4" />
                  <small>Test case accuracy</small>
                  <b>{r.accuracy}%</b>
                </div>
                <div>
                  <Award className="h-4 w-4" />
                  <small>Performance level</small>
                  <b>{r.level}</b>
                </div>
                <div>
                  <Clock className="h-4 w-4" />
                  <small>Execution time (max)</small>
                  <b>{fmtMs(r.timeMs)}</b>
                </div>
                <div>
                  <Cpu className="h-4 w-4" />
                  <small>Memory (peak)</small>
                  <b>{fmtKb(r.memoryKb)}</b>
                </div>
              </div>
            </div>
          </div>

          <table className="cv-rep-table">
            <thead>
              <tr>
                <th>Test cases</th>
                <th>Total</th>
                <th>Passed</th>
                <th>Failed</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Sample</td>
                <td>{samples.length}</td>
                <td>{passedOf(samples)}</td>
                <td>{samples.length - passedOf(samples)}</td>
              </tr>
              <tr>
                <td>Hidden</td>
                <td>{hidden.length}</td>
                <td>{passedOf(hidden)}</td>
                <td>{hidden.length - passedOf(hidden)}</td>
              </tr>
              <tr className="total">
                <td>All</td>
                <td>{r.total}</td>
                <td>{r.passed}</td>
                <td>{r.failed}</td>
              </tr>
            </tbody>
          </table>

          <h3 className="cv-rep-h">Test case results</h3>
          <div className="cv-rep-cases">
            {s.cases.map((c, i) => {
              const v = VERDICTS[c.verdict] || VERDICTS.SE;
              return (
                <div key={i} className={`tone-${v.tone}`}>
                  <span>
                    {c.sample ? "Sample" : "Hidden"} #{i + 1}
                  </span>
                  <b>{v.label}</b>
                  <small>
                    {fmtMs(c.timeMs)} · {fmtKb(c.memoryKb)}
                  </small>
                </div>
              );
            })}
          </div>

          <div className="cv-rep-two">
            <section>
              <h3 className="cv-rep-h">
                <TrendingUp className="h-4 w-4" /> Areas to improve
              </h3>
              {r.areas?.length ? (
                <ul className="cv-rep-list">
                  {r.areas.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              ) : (
                <p className="cv-muted">
                  Every test passed{r.attemptNo > 1 ? ` on attempt ${r.attemptNo}` : " on the first attempt"}. Read the editorial to compare your approach with the optimal one, then move up a level.
                </p>
              )}
            </section>
            <section>
              <h3 className="cv-rep-h">Recommended next</h3>
              {data.next?.length ? (
                <ul className="cv-rep-next">
                  {data.next.map((n) => (
                    <li key={n.id}>
                      <Link to={`/codevita/solve/${n.id}`}>
                        {n.locked && <Lock className="h-3.5 w-3.5" />} {n.title}
                      </Link>
                      <small>
                        {n.difficulty} · {n.topics.join(", ")}
                      </small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="cv-muted">
                  Pick your next problem from the <Link to="/codevita">question bank</Link>.
                </p>
              )}
            </section>
          </div>

          <div className="cv-noprint">
            <button type="button" className="cv-code-toggle" onClick={() => setShowCode(!showCode)}>
              <ChevronDown className={`h-4 w-4${showCode ? " up" : ""}`} /> {showCode ? "Hide" : "Show"} submitted code
            </button>
            {showCode && <pre className="cv-pre code">{s.code}</pre>}
          </div>

          <footer className="cv-rep-foot">
            <p>{r.disclaimer}</p>
            <p>
              Score = points for the problem × share of test cases passed. Time and memory are measured on Anobyt's code runner and can differ from other judges.
            </p>
          </footer>
        </article>
      </div>
    </section>
  );
}
