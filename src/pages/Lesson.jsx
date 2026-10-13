import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, ExternalLink, FileText, Link2, ListTree, Lock, PlayCircle } from "lucide-react";
import Buy from "../components/Buy";
import RichText from "../components/RichText";
import { Page } from "../components/ui";
import { getContent } from "../lib/contentApi";
import { LESSON_TYPES } from "../lib/content/defaults";
import { doneLessons, embedUrl, setLessonDone } from "../lib/lessons";
import { useAccount } from "../lib/account";
import { usePageSEO } from "../lib/seo";

const TYPE_ICON = { video: PlayCircle, article: FileText, link: Link2, pdf: FileText };

/** Distraction-free reader for one lesson, with the course outline alongside. */
export default function Lesson() {
  const { id, lessonId } = useParams();
  const [course, setCourse] = useState(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState(() => doneLessons(id));
  const [reload, setReload] = useState(0);
  const [outline, setOutline] = useState(false);
  const { user } = useAccount();

  useEffect(() => {
    let on = true;
    getContent("courses", id).then(
      (c) => on && setCourse(c),
      (e) => on && setError(e.status === 404 ? "This course doesn't exist or isn't published." : e.message),
    );
    return () => {
      on = false;
    };
  }, [id, reload, user?.id]);

  const flat = course ? course.modules.flatMap((m, mi) => m.lessons.map((l) => ({ ...l, mi }))) : [];
  const idx = flat.findIndex((l) => l.id === lessonId);
  const lesson = flat[idx];
  usePageSEO({ title: lesson ? `${lesson.title} · ${course.title}` : "Lesson", description: course?.summary || "", path: `/courses/${id}/learn/${lessonId}`, noindex: true });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [lessonId]);

  if (error)
    return (
      <Page narrow={620}>
        <p className="note bad">{error}</p>
        <Link className="btn" to="/courses">All courses</Link>
      </Page>
    );
  if (!course) return <Page narrow={620}><p className="note">Loading the lesson…</p></Page>;
  if (!lesson)
    return (
      <Page narrow={620}>
        <p className="note">That lesson isn't in this course any more.</p>
        <Link className="btn" to={`/courses/${id}`}>Back to the course</Link>
      </Page>
    );

  const module = course.modules[lesson.mi];
  const prev = flat[idx - 1];
  const next = flat[idx + 1];
  const embed = embedUrl(lesson.url);
  const isDone = done.has(lesson.id);
  const pct = flat.length ? Math.round((flat.filter((l) => done.has(l.id)).length * 100) / flat.length) : 0;
  const toggle = () => setDone(new Set(setLessonDone(id, lesson.id, !isDone)));
  const finishAndNext = () => {
    if (!isDone) setDone(new Set(setLessonDone(id, lesson.id, true)));
  };

  return (
    <section className="reader">
      <aside className={`reader-side${outline ? " open" : ""}`}>
        <Link to={`/courses/${id}`} className="linkish back" style={{ marginBottom: 10 }}>
          <ArrowLeft className="h-4 w-4" style={{ display: "inline", verticalAlign: -3 }} /> {course.title}
        </Link>
        <div className="rprog">
          <div style={{ width: `${pct}%` }} />
        </div>
        <small className="note" style={{ display: "block", margin: "6px 0 14px" }}>{pct}% complete</small>
        {course.modules.map((m, mi) => (
          <div key={m.id || mi} className="rmod">
            <b>
              {mi + 1}. {m.title || `Module ${mi + 1}`}
            </b>
            {m.lessons.map((l) => {
              const Icon = l.locked ? Lock : done.has(l.id) ? CheckCircle2 : TYPE_ICON[l.type] || Circle;
              return (
                <Link key={l.id} to={`/courses/${id}/learn/${l.id}`} onClick={() => setOutline(false)} className={`rles${l.id === lesson.id ? " on" : ""}${l.locked ? " locked" : ""}${done.has(l.id) ? " done" : ""}`}>
                  <Icon className="h-4 w-4" />
                  <span>{l.title}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </aside>

      <article className="reader-main">
        <button type="button" className="btn ghost reader-toggle" onClick={() => setOutline(!outline)}>
          <ListTree className="h-4 w-4" /> {outline ? "Hide" : "Show"} course outline
        </button>
        <div className="reader-head">
          <span className="eyebrow">
            Module {lesson.mi + 1} · {LESSON_TYPES[lesson.type]}
            {lesson.duration ? ` · ${lesson.duration}` : ""}
          </span>
          <h1>{lesson.title}</h1>
          <p className="note">{module.title}</p>
        </div>

        {lesson.locked ? (
          <div className="panel unlock" style={{ maxWidth: 560 }}>
            <div className="ic">
              <Lock className="h-5 w-5" />
            </div>
            <h3>This lesson is part of a paid module</h3>
            <p className="note">Unlock it to keep going. Your progress stays with your account.</p>
            <div className="row" style={{ marginTop: 14 }}>
              {module.price > 0 && <Buy item={{ type: "module", courseId: course.id, moduleId: module.id }} price={module.price} label="Unlock module" className="btn ghost" onDone={() => setReload((n) => n + 1)} />}
              {course.price > 0 && <Buy item={{ type: "course", id: course.id }} price={course.price} label="Buy full course" onDone={() => setReload((n) => n + 1)} />}
            </div>
            <Link className="linkish" to={`/courses/${id}#unlock`} style={{ marginTop: 12, display: "inline-block" }}>
              Have an access code?
            </Link>
          </div>
        ) : (
          <>
            {embed && (
              <div className="video">
                <iframe src={embed} title={lesson.title} allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
              </div>
            )}
            <RichText text={lesson.body} className="reading" />
            {lesson.url && !embed && (
              <a className="btn" href={lesson.url} target="_blank" rel="noopener noreferrer" style={{ marginTop: 6 }}>
                <ExternalLink className="h-4 w-4" /> Open {lesson.type === "pdf" ? "notes" : lesson.type === "video" ? "video" : "link"}
              </a>
            )}
            {!lesson.url && !lesson.body && <p className="note">This lesson's content is being prepared.</p>}
            <div className="reader-done">
              <button type="button" className={`btn ${isDone ? "ghost" : ""}`} onClick={toggle}>
                <CheckCircle2 className="h-4 w-4" /> {isDone ? "Completed" : "Mark as complete"}
              </button>
            </div>
          </>
        )}

        <nav className="reader-nav">
          {prev ? (
            <Link to={`/courses/${id}/learn/${prev.id}`}>
              <small>
                <ArrowLeft className="h-3.5 w-3.5" /> Previous
              </small>
              <b>{prev.title}</b>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link to={`/courses/${id}/learn/${next.id}`} onClick={finishAndNext} className="nx">
              <small>
                Next <ArrowRight className="h-3.5 w-3.5" />
              </small>
              <b>{next.title}</b>
            </Link>
          ) : (
            <Link to={`/courses/${id}`} onClick={finishAndNext} className="nx">
              <small>Finished</small>
              <b>Back to the course</b>
            </Link>
          )}
        </nav>
      </article>
    </section>
  );
}
