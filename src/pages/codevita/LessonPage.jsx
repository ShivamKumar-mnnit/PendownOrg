import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Circle, Clock, Crown, Loader2, Lock } from "lucide-react";
import RichText from "../../components/RichText";
import { cvLearnDone, useCv } from "../../lib/codevita/api";
import { usePageSEO } from "../../lib/seo";
import { AccessPill, HomeUpgrade, ProblemCard } from "./HubSections";
import "./codevita.css";

const KIND = { guide: "Preparation guide", topic: "Topic lesson", pattern: "Problem-solving patterns" };

/** /courses/tcs-codevita/learn/:id: one lesson of the crash course. */
export default function LessonPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [bump, setBump] = useState(0);
  const { data, error } = useCv(`/api/cv/learn/${encodeURIComponent(id)}`, bump);
  const [upgrade, setUpgrade] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const l = data?.lesson;
  usePageSEO({
    title: l ? `${l.title} · TCS CodeVita Crash Course` : "TCS CodeVita Crash Course",
    description: l?.summary || "A lesson from the TCS CodeVita Crash Course on Anobyt.",
    path: `/courses/tcs-codevita/learn/${id}`,
  });

  if (error)
    return (
      <section className="page cv-page">
        <div className="wrap cv-lesson-wrap">
          <div className="cv-empty">
            <BookOpen className="h-6 w-6" />
            <p>{error}</p>
            <Link className="btn ghost" to="/courses/tcs-codevita?tab=learn">
              All lessons
            </Link>
          </div>
        </div>
      </section>
    );
  if (!data)
    return (
      <section className="page cv-page">
        <div className="wrap cv-lesson-wrap">
          <p className="note">Loading lesson…</p>
        </div>
      </section>
    );

  const toggleDone = async () => {
    if (!data.signedIn) return nav(`/account?next=${encodeURIComponent(`/courses/tcs-codevita/learn/${id}`)}`);
    setBusy(true);
    setMsg("");
    try {
      await cvLearnDone(l.id, !l.done);
      setBump((n) => n + 1);
    } catch (e) {
      setMsg(e.message);
    }
    setBusy(false);
  };
  const openProblem = (p) => (p.locked ? setUpgrade({ problem: p }) : nav(`/courses/tcs-codevita/solve/${p.id}`));

  return (
    <section className="page cv-page">
      <div className="wrap cv-lesson-wrap">
        <nav className="cv-crumbs" aria-label="Breadcrumb">
          <Link to="/courses/tcs-codevita">CodeVita Crash Course</Link> <span>/</span> <Link to="/courses/tcs-codevita?tab=learn">Learn</Link> <span>/</span> <b>{l.title}</b>
        </nav>

        <header className="cv-lesson-head">
          <div className="cv-lcard-top">
            <span className="cv-pill">{KIND[l.kind] || "Lesson"}</span>
            <AccessPill access={l.access} locked={l.locked} />
            <small>
              <Clock className="h-3.5 w-3.5" /> {l.minutes} min read
            </small>
            {l.done && (
              <span className="cv-pill good">
                <CheckCircle2 className="h-3 w-3" /> Done
              </span>
            )}
          </div>
          <h1>{l.title}</h1>
          <p className="cv-muted cv-lead">{l.summary}</p>
        </header>

        {l.locked ? (
          <div className="cv-lesson-locked">
            <p className="cv-teaser">{l.teaser}…</p>
            <div className="cv-upsell">
              <span>
                <Lock className="h-5 w-5" />
              </span>
              <div>
                <b>This lesson is part of the full crash course</b>
                <p className="cv-muted">Unlock every lesson, problem, editorial and mock test with one payment.</p>
              </div>
              <button type="button" className="btn" onClick={() => setUpgrade({ problem: null })}>
                <Crown className="h-4 w-4" /> Unlock the course
              </button>
            </div>
          </div>
        ) : (
          <>
            <article className="cv-lesson-body">
              <RichText text={l.body} />
            </article>
            <div className="cv-lesson-done">
              <button type="button" className={l.done ? "btn ghost" : "btn"} onClick={toggleDone} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : l.done ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                {!data.signedIn ? "Sign in to mark as done" : l.done ? "Marked as done" : "Mark lesson as done"}
              </button>
              {msg && <span className="note bad">{msg}</span>}
            </div>
          </>
        )}

        {data.practice?.length > 0 && (
          <section className="cv-lgroup">
            <h2>Practise what you just learned</h2>
            <p className="cv-muted">Problems from the bank that use this topic, easiest first.</p>
            <div className="cv-pcards">
              {[...data.practice]
                .sort((a, b) => ["Easy", "Medium", "Hard"].indexOf(a.difficulty) - ["Easy", "Medium", "Hard"].indexOf(b.difficulty))
                .slice(0, 6)
                .map((p) => (
                  <ProblemCard key={p.id} p={p} onOpen={openProblem} />
                ))}
            </div>
          </section>
        )}

        <nav className="cv-lesson-nav" aria-label="Lessons">
          {data.prev ? (
            <Link to={`/courses/tcs-codevita/learn/${data.prev.id}`} className="cv-lesson-step">
              <small>
                <ArrowLeft className="h-3.5 w-3.5" /> Previous
              </small>
              <b>
                {data.prev.locked && <Lock className="h-3.5 w-3.5" />} {data.prev.title}
              </b>
            </Link>
          ) : (
            <span />
          )}
          {data.next ? (
            <Link to={`/courses/tcs-codevita/learn/${data.next.id}`} className="cv-lesson-step next">
              <small>
                Next <ArrowRight className="h-3.5 w-3.5" />
              </small>
              <b>
                {data.next.locked && <Lock className="h-3.5 w-3.5" />} {data.next.title}
              </b>
            </Link>
          ) : (
            <Link to="/courses/tcs-codevita?tab=mocks" className="cv-lesson-step next">
              <small>
                Up next <ArrowRight className="h-3.5 w-3.5" />
              </small>
              <b>Take a mock test</b>
            </Link>
          )}
        </nav>
      </div>
      {upgrade && <HomeUpgrade problem={upgrade.problem} onClose={() => setUpgrade(null)} onDone={() => (setUpgrade(null), setBump((n) => n + 1))} />}
    </section>
  );
}
