import { Suspense, lazy, useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Award, Bell, CalendarClock, ClipboardList, ExternalLink, FileText, PlayCircle, Plus, Video } from "lucide-react";
import { Head, Page } from "../components/ui";
import { SignInForm } from "../components/AuthForms";
import { YEAR_NAMES, usePractice, useSolved } from "../lib/problemBank";
import { REWARDS } from "../lib/student";
import { useAccount } from "../lib/account";
import { INTERVIEW_STATUS, fmtDay, fmtWhen, isAdminRole, ordinal, pct, studentApi, testWindow } from "../lib/dataService";
import { usePageSEO } from "../lib/seo";

// Coding problems the student pastes in (e.g. from their trainer in an interview) and solves in the code room.
const CodingProblems = lazy(() => import("./admin/ds/CodingProblems"));

/** Loads one student endpoint; `null` while loading, `{error}` on failure. */
function useLoad(fn) {
  const [v, setV] = useState(null);
  useEffect(() => {
    let on = true;
    fn().then(
      (d) => on && setV(d ?? []),
      // 404: a data-service version without this feature yet; show it as empty, not as an error.
      (e) => on && setV(e.status === 404 ? [] : { error: e.message }),
    );
    return () => {
      on = false;
    };
  }, [fn]);
  return v;
}

export default function Dashboard() {
  usePageSEO({ title: "Dashboard", description: "Your tests, interviews, scorecard and practice progress.", path: "/dashboard", noindex: true });
  const { user, loaded } = useAccount();
  const nav = useNavigate();
  const [addCoding, setAddCoding] = useState(0);

  if (!loaded) return <Page narrow={520}><p className="note">Loading…</p></Page>;
  if (!user)
    return (
      <Page narrow={480}>
        <Head title="Student dashboard">Sign in to see your tests, interview slots, scorecard and announcements.</Head>
        <SignInForm onMode={(m) => nav(`/login?mode=${m}&next=/dashboard`)} />
      </Page>
    );

  // Trainers and super admins have their own dashboard.
  if (isAdminRole(user)) return <Navigate to="/trainer" replace />;
  return (
    <Page>
      <div className="admin-top">
        <div>
          <span className="eyebrow">{user.college || "Dashboard"}</span>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 38px)", marginTop: 6 }}>Welcome, {user.name.split(" ")[0]}</h1>
        </div>
        <div className="row">
          <button
            type="button"
            className="btn"
            onClick={() => {
              setAddCoding((n) => n + 1);
              document.getElementById("coding")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            <Plus className="h-4 w-4" /> Add coding problem
          </button>
          <Link className="btn ghost" to="/account">
            Your account
          </Link>
        </div>
      </div>
      <StudentArea
        coding={
          <section id="coding" style={{ marginTop: 40, scrollMarginTop: 90 }}>
            <Suspense fallback={<p className="note">Loading your coding problems…</p>}>
              <CodingProblems me={user} newSignal={addCoding} />
            </Suspense>
          </section>
        }
      />
      <PracticeProgress />
    </Page>
  );
}

function StudentArea({ coding }) {
  const tests = useLoad(studentApi.tests);
  const interviews = useLoad(studentApi.interviews);
  const scorecard = useLoad(studentApi.scorecard);
  const notes = useLoad(studentApi.announcements);
  const attempts = useLoad(studentApi.attempts);
  const reports = useLoad(studentApi.interviewScorecards);

  const list = (v) => (Array.isArray(v) ? v : []);
  // Published interview score cards, by interview: covers rows whose summary hasn't caught up.
  const published = new Map(list(reports).map((c) => [c.interviewId, c]));
  const withReports = Array.isArray(interviews)
    ? interviews.map((i) =>
        !i.scorecard?.published && published.has(i.id) ? { ...i, scorecard: { exists: true, published: true, overallPercent: published.get(i.id).overallPercent } } : i,
      )
    : interviews;
  const upcoming = list(interviews).filter((i) => (i.status === "UPCOMING" || i.status === "IN_PROGRESS") && new Date(i.scheduledAt).getTime() > Date.now() - 2 * 3600e3);
  const openTests = list(tests).filter((t) => testWindow(t).state !== "ended" && (t.attemptsUsed < t.maxAttempts || t.inProgressAttemptId));
  const best = list(scorecard).reduce((m, r) => (r.overallPercent != null && r.overallPercent > (m ?? -1) ? r.overallPercent : m), null);

  return (
    <>
      <div className="kpis">
        <div><b>{tests === null ? "…" : openTests.length}</b><span>Tests open to you</span></div>
        <div><b>{interviews === null ? "…" : upcoming.length}</b><span>Upcoming interviews</span></div>
        <div><b>{attempts === null ? "…" : list(attempts).filter((a) => a.status === "SUBMITTED").length}</b><span>Tests completed</span></div>
        <div><b>{scorecard === null ? "…" : pct(best)}</b><span>Overall score</span></div>
      </div>

      <Announcements data={notes} />

      {coding}

      <Section icon={<ClipboardList className="h-5 w-5" />} title="Your tests">
        <Loaded data={tests} empty="No tests yet. When your college or trainer publishes one, it shows up here. Got a test link? Just open it.">
          {(rows) => (
            <div className="cards">
              {rows.map((t) => (
                <TestCard key={t.id} t={t} />
              ))}
            </div>
          )}
        </Loaded>
      </Section>

      <Section icon={<Video className="h-5 w-5" />} title="Mock interviews">
        <Loaded data={withReports} empty="No interviews scheduled yet. Your slot, mentor and meeting link appear here once they're set.">
          {(rows) => (
            <div className="tablewrap">
              <table className="dtable">
                <thead>
                  <tr>
                    <th>Interview</th>
                    <th>When</th>
                    <th>Interviewer</th>
                    <th>Batch</th>
                    <th>Status</th>
                    <th>Meeting / score card</th>
                  </tr>
                </thead>
                <tbody>
                  {[...rows]
                    .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt))
                    .map((i) => {
                      const live = i.status === "UPCOMING" || i.status === "IN_PROGRESS";
                      return (
                        <tr key={i.id}>
                          <td>{i.studentInterviewNo ? `${ordinal(i.studentInterviewNo)} interview` : "—"}</td>
                          <td>
                            {fmtWhen(i.scheduledAt)}
                            <div className="note" style={{ margin: 0, fontSize: 12 }}>{i.durationMinutes} min</div>
                          </td>
                          <td>{i.mentorName}</td>
                          <td>{i.templateName || "—"}</td>
                          <td>
                            <span className={`tag ${i.status === "DONE" ? "free" : live ? "" : "adv"}`}>{INTERVIEW_STATUS[i.status] || i.status}</span>
                          </td>
                          <td>
                            {live && i.meetingLink ? (
                              <a className="btn" href={i.meetingLink} target="_blank" rel="noopener noreferrer" style={{ padding: "6px 12px" }}>
                                Join <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            ) : live ? (
                              <span className="note" style={{ margin: 0 }}>Link coming soon</span>
                            ) : null}
                            {i.meetingPasscode && live && <div className="note" style={{ margin: "4px 0 0", fontSize: 12 }}>Passcode {i.meetingPasscode}</div>}
                            {i.status === "DONE" &&
                              (i.scorecard?.published ? (
                                <Link className="btn" to={`/interview-report/${i.id}`} style={{ padding: "6px 12px" }}>
                                  <FileText className="h-3.5 w-3.5" /> View score card
                                  {i.scorecard.overallPercent != null && ` · ${pct(i.scorecard.overallPercent)}`}
                                </Link>
                              ) : i.feedback || i.rating != null ? (
                                <div style={{ fontSize: 14 }}>
                                  {i.rating != null && <b>{i.rating}/10 · </b>}
                                  {i.feedback || "No written feedback"}
                                </div>
                              ) : (
                                <span className="note" style={{ margin: 0 }}>Score card coming soon</span>
                              ))}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </Loaded>
      </Section>

      <Section icon={<Award className="h-5 w-5" />} title="Scorecard">
        <Loaded data={scorecard} empty="Your scorecard fills in as you take tests, coding rounds and interviews.">
          {(rows) => (
            <div className="cards">
              {rows.map((r, i) => (
                <div className="card" key={i}>
                  <div className="meta">
                    <span className="tag">{r.domain || "Batch"}</span>
                    {r.shortlisted && <span className="tag free">Shortlisted</span>}
                    {r.rank && <small>Rank #{r.rank}</small>}
                  </div>
                  <h3 style={{ marginTop: 10 }}>{pct(r.overallPercent)} overall</h3>
                  <dl className="kv" style={{ marginTop: 8 }}>
                    <dt>MCQ tests</dt>
                    <dd>{pct(r.mcqPercent)}</dd>
                    <dt>Coding</dt>
                    <dd>{pct(r.codingPercent)}</dd>
                    <dt>Interviews</dt>
                    <dd>
                      {pct(r.interviewPercent)}
                      {r.interviewsCompleted ? ` (${r.interviewsCompleted})` : ""}
                    </dd>
                  </dl>
                  {r.coding?.some((c) => c.reportUrl) && (
                    <p className="note" style={{ fontSize: 13 }}>
                      {r.coding
                        .filter((c) => c.reportUrl)
                        .map((c) => (
                          <a key={c.reportUrl} className="linkish" href={c.reportUrl} target="_blank" rel="noopener noreferrer" style={{ marginRight: 10 }}>
                            {c.assessmentTitle} report
                          </a>
                        ))}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Loaded>
      </Section>

      <Section icon={<CalendarClock className="h-5 w-5" />} title="Your attempts">
        <Loaded data={attempts} empty="Tests you take show up here with your score.">
          {(rows) => (
            <div className="tablewrap">
              <table className="dtable">
                <thead>
                  <tr>
                    <th>Test</th>
                    <th>Attempt</th>
                    <th>Score</th>
                    <th>Date</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((a) => (
                    <tr key={a.attemptId}>
                      <td>{a.testTitle}</td>
                      <td>#{a.attemptNumber}</td>
                      <td>{a.status === "SUBMITTED" ? `${a.score ?? 0} / ${a.maxScore ?? "—"}` : "In progress"}</td>
                      <td>{fmtDay(a.submittedAt || a.startedAt)}</td>
                      <td>
                        {a.status === "SUBMITTED" ? (
                          <Link className="linkish" to={`/results/${a.attemptId}`}>
                            View result
                          </Link>
                        ) : (
                          <Link className="linkish" to={`/exam/${a.testId}`}>
                            Resume
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Loaded>
      </Section>
    </>
  );
}

function TestCard({ t }) {
  const w = testWindow(t);
  const left = t.maxAttempts - t.attemptsUsed;
  const can = w.state === "open" && (t.inProgressAttemptId || left > 0);
  return (
    <div className="card">
      <div className="meta">
        <span className={`tag ${w.state === "open" ? "free" : w.state === "soon" ? "med" : "adv"}`}>{w.state === "open" ? "Open" : w.state === "soon" ? "Upcoming" : "Closed"}</span>
        {t.proctoring && <span className="tag">Proctored</span>}
      </div>
      <h3 style={{ marginTop: 10 }}>{t.title}</h3>
      <p>
        {t.questionCount} questions · {t.durationMinutes} min{t.totalMarks ? ` · ${t.totalMarks} marks` : ""}
      </p>
      <p className="note" style={{ fontSize: 13, margin: "6px 0 0" }}>
        {w.text} · {t.attemptsUsed}/{t.maxAttempts} attempt{t.maxAttempts === 1 ? "" : "s"} used
      </p>
      {can ? (
        <Link className="btn" to={`/exam/${t.id}`} style={{ marginTop: 14 }}>
          <PlayCircle className="h-4 w-4" /> {t.inProgressAttemptId ? "Resume test" : "Start test"}
        </Link>
      ) : (
        <p className="note" style={{ fontSize: 13 }}>{w.state === "open" ? "No attempts left." : ""}</p>
      )}
    </div>
  );
}

function Announcements({ data }) {
  const [all, setAll] = useState(false);
  if (!Array.isArray(data) || !data.length) return null;
  const shown = all ? data : data.slice(0, 3);
  return (
    <div className="panel" style={{ marginBottom: 8 }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <b style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Bell className="h-4 w-4" /> Announcements
        </b>
        {data.length > 3 && (
          <button type="button" className="linkish" onClick={() => setAll(!all)}>
            {all ? "Show fewer" : `Show all ${data.length}`}
          </button>
        )}
      </div>
      {shown.map((a) => (
        <div key={a.id} style={{ borderTop: "1px solid var(--color-border)", marginTop: 12, paddingTop: 12 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <b style={{ fontSize: 15 }}>{a.subject}</b>
            <small className="note" style={{ margin: 0 }}>{fmtWhen(a.createdAt)}</small>
          </div>
          <p style={{ margin: "4px 0 0", color: "var(--color-fg-muted)", whiteSpace: "pre-wrap" }}>{a.message}</p>
        </div>
      ))}
    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <section style={{ marginTop: 40 }}>
      <h2 style={{ fontSize: 22, display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
        {icon} {title}
      </h2>
      {children}
    </section>
  );
}

function Loaded({ data, empty, children }) {
  if (data === null) return <p className="note">Loading…</p>;
  if (data.error) return <p className="note bad">{data.error}</p>;
  if (!data.length)
    return (
      <div className="empty">
        <span>{empty}</span>
      </div>
    );
  return children(data);
}

function PracticeProgress() {
  const { data } = usePractice(true);
  const solved = useSolved();
  const index = data?.index || [];
  const byId = new Map(index.map((p) => [p.id, p]));
  const recent = [...solved]
    .map((id) => byId.get(id))
    .filter(Boolean)
    .slice(-8)
    .reverse();
  const count = solved.size;
  const next = REWARDS.find((r) => r[0] > count);

  return (
    <>
      <Head title="Practice problems" style={{ margin: "56px 0 24px" }}>
        {count} solved{next ? ` · ${next[0] - count} more to unlock ${next[2].toLowerCase()}` : " · every reward unlocked"}
      </Head>
      <div className="cards">
        {[1, 2, 3, 4].map((y) => {
          const all = index.filter((p) => p.year === y);
          const n = all.filter((p) => solved.has(p.id)).length;
          return (
            <Link className="card" key={y} to={`/problems/year/${y}`}>
              <div className="meta">
                <span className="tag">{YEAR_NAMES[y]}</span>
                <small>
                  {n} of {all.length} solved
                </small>
              </div>
              <div className="bar2" style={{ margin: "14px 0 0" }}>
                <b style={{ width: `${all.length ? Math.round((n / all.length) * 100) : 0}%` }} />
              </div>
            </Link>
          );
        })}
      </div>
      {recent.length ? (
        <div className="panel" style={{ marginTop: 18 }}>
          <b>Recently solved</b>
          <ul className="ck">
            {recent.map((p) => (
              <li key={p.id}>
                <Link to={`/problem/${p.id}`} style={{ color: "var(--color-fg)" }}>
                  {p.title}
                </Link>{" "}
                ({p.topic}, {p.difficulty})
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="note" style={{ marginTop: 14 }}>
          Solve a practice problem and it shows up here.{" "}
          <Link to="/problems" style={{ color: "var(--color-accent)" }}>
            Browse problems
          </Link>
        </div>
      )}
      <div className="cards" style={{ marginTop: 24 }}>
        {REWARDS.map(([at, icon, title]) => (
          <div className="card" key={title} style={{ opacity: count >= at ? 1 : 0.55 }}>
            <div className="ic">{icon}</div>
            <h3>{title}</h3>
            <p>{count >= at ? "Unlocked" : `Unlocks at ${at} problems`}</p>
          </div>
        ))}
      </div>
    </>
  );
}
