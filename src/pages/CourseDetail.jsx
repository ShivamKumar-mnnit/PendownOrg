import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ExternalLink, FileText, Link2, Lock, PlayCircle, X } from "lucide-react";
import { Head, Page } from "../components/ui";
import RichText from "../components/RichText";
import WhatsAppIcon from "../components/WhatsAppIcon";
import { forgetPremium, getContent, lessonTotal, premiumStatus, redeemCode } from "../lib/contentApi";
import { DEFAULT_COURSES, LESSON_TYPES } from "../lib/content/defaults";
import { buildAdminWaLink } from "../lib/whatsapp";
import { usePageSEO } from "../lib/seo";

const TYPE_ICON = { video: PlayCircle, article: FileText, link: Link2, pdf: FileText };

/** YouTube / Vimeo / Google Drive links become an embeddable player URL. */
function embedUrl(url) {
  if (!url) return "";
  let m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  if (m) return `https://www.youtube-nocookie.com/embed/${m[1]}`;
  m = url.match(/vimeo\.com\/(\d+)/);
  if (m) return `https://player.vimeo.com/video/${m[1]}`;
  m = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
  return "";
}

function LessonViewer({ lesson, onClose }) {
  const embed = embedUrl(lesson.url);
  return (
    <div className="panel lesson-view" id="lesson">
      <div className="lv-head">
        <div>
          <span className="eyebrow">{LESSON_TYPES[lesson.type]}</span>
          <h2 style={{ fontSize: 26, marginTop: 6 }}>{lesson.title}</h2>
        </div>
        <button type="button" className="ib" onClick={onClose} title="Close lesson">
          <X className="h-4 w-4" />
        </button>
      </div>
      {embed && (
        <div className="video">
          <iframe src={embed} title={lesson.title} allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
        </div>
      )}
      <RichText text={lesson.body} />
      {lesson.url && !embed && (
        <a className="btn" href={lesson.url} target="_blank" rel="noopener noreferrer" style={{ marginTop: 14 }}>
          <ExternalLink className="h-4 w-4" /> Open {lesson.type === "pdf" ? "notes" : lesson.type === "video" ? "video" : "link"}
        </a>
      )}
      {!lesson.url && !lesson.body && <p className="note">This lesson's content is being prepared.</p>}
    </div>
  );
}

function Unlock({ course, onUnlocked }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const wa = buildAdminWaLink(`Hi Anobyt! I'd like access to the premium course *${course.title}*. Please share the details.`);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const r = await redeemCode(code.trim());
      if (r.scope !== "all" && !r.scope.includes(course.id)) setMsg("This code is valid but doesn't include this course.");
      onUnlocked();
    } catch (err) {
      setMsg(err.message);
    }
    setBusy(false);
  }

  return (
    <div className="panel unlock">
      <div className="ic">
        <Lock className="h-5 w-5" />
      </div>
      <h3>Unlock this course</h3>
      <p className="note" style={{ marginTop: 4 }}>
        Premium lessons open with an access code. Ask us on WhatsApp to get yours, then enter it here once on each device.
      </p>
      <form onSubmit={submit} className="unlock-form">
        <input className="inp" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Access code, e.g. AB-7KQ2M9XP" aria-label="Access code" />
        <button className="btn" disabled={busy || code.trim().length < 4}>
          {busy ? "Checking…" : "Unlock"}
        </button>
      </form>
      {msg && <p className="note bad">{msg}</p>}
      <a
        className="btn ghost"
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        style={{ marginTop: 12, width: "100%" }}
      >
        <WhatsAppIcon className="h-4 w-4" /> Request access on WhatsApp
      </a>
    </div>
  );
}

export default function CourseDetail() {
  const { id } = useParams();
  const fallback = DEFAULT_COURSES.find((c) => c.id === id);
  const [course, setCourse] = useState(fallback ? { ...fallback, unlocked: fallback.tier === "free" } : null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(null);
  const [access, setAccess] = useState(null);
  const [reload, setReload] = useState(0);

  usePageSEO({
    title: course ? course.title : "Course",
    description: course?.summary || "Anobyt learning track.",
    path: `/courses/${id}`,
  });

  useEffect(() => {
    let on = true;
    getContent("courses", id).then(
      (c) => on && setCourse(c),
      (e) => on && !fallback && setError(e.status === 404 ? "This course doesn't exist or isn't published." : e.message),
    );
    premiumStatus().then((s) => on && setAccess(s), () => {});
    return () => {
      on = false;
    };
  }, [id, reload, fallback]);

  if (error)
    return (
      <Page narrow={620}>
        <Head title="Course not found">{error}</Head>
        <Link className="btn" to="/courses">All courses</Link>
      </Page>
    );
  if (!course) return <Page narrow={620}><p className="note">Loading…</p></Page>;

  const lessons = course.modules.flatMap((m) => m.lessons);
  const premium = course.tier === "premium";

  function openLesson(l) {
    if (l.locked) {
      document.getElementById("unlock")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setOpen(l);
    requestAnimationFrame(() => document.getElementById("lesson")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <Page>
      <Link to="/courses" className="linkish back">
        <ArrowLeft className="h-4 w-4" style={{ display: "inline", verticalAlign: -3 }} /> All courses
      </Link>
      <div className="course-hero">
        <div>
          <div className="row" style={{ gap: 8, alignItems: "center" }}>
            <span className={`tag ${premium ? "t-olympiad" : "free"}`}>{premium ? "Premium" : "Free"}</span>
            {course.level && <span className="tag">{course.level}</span>}
            {premium && course.unlocked && (
              <span className="tag free">
                <CheckCircle2 className="h-3 w-3" style={{ display: "inline", verticalAlign: -1 }} /> Unlocked
              </span>
            )}
          </div>
          <h1 className="ptitle">
            <span className="cicon-lg">{course.icon || "📘"}</span> {course.title}
          </h1>
          <p className="lead-p">{course.summary}</p>
          <div className="kpis" style={{ maxWidth: 560 }}>
            <div><b>{lessonTotal(course) || "—"}</b><span>Lessons</span></div>
            <div><b>{course.modules.length || course.outline.length}</b><span>Modules</span></div>
            <div><b>{course.priceLabel || (premium ? "Premium" : "Free")}</b><span>Access</span></div>
          </div>
        </div>
      </div>

      <div className="course-grid">
        <div>
          {open && <LessonViewer lesson={open} onClose={() => setOpen(null)} />}
          {course.description && (
            <div className="panel" style={{ marginBottom: 18 }}>
              <h3 style={{ fontSize: 20, marginBottom: 8 }}>About this course</h3>
              <RichText text={course.description} />
            </div>
          )}
          <h2 style={{ fontSize: 24, margin: "8px 0 14px" }}>Curriculum</h2>
          {course.modules.length > 0 ? (
            course.modules.map((m, i) => (
              <details className="module" key={i} open={i === 0}>
                <summary>
                  <span className="mnum">{String(i + 1).padStart(2, "0")}</span>
                  <b>{m.title || `Module ${i + 1}`}</b>
                  <small>{m.lessons.length} lessons</small>
                </summary>
                <ul>
                  {m.lessons.map((l) => {
                    const Icon = l.locked ? Lock : TYPE_ICON[l.type] || FileText;
                    return (
                      <li key={l.id}>
                        <button type="button" className={`lesson ${l.locked ? "locked" : ""} ${open?.id === l.id ? "on" : ""}`} onClick={() => openLesson(l)}>
                          <Icon className="h-4 w-4" />
                          <span>{l.title}</span>
                          {l.preview && premium && !course.unlocked && <span className="tag free">Free preview</span>}
                          {l.duration && <small>{l.duration}</small>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </details>
            ))
          ) : (
            <div className="panel">
              <ul className="ck" style={{ marginTop: 0 }}>
                {course.outline.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <p className="note">Lessons for this track are being added. Ask us on WhatsApp for the current schedule.</p>
            </div>
          )}
        </div>
        <aside id="unlock">
          {premium && !course.unlocked ? (
            <Unlock course={course} onUnlocked={() => setReload((n) => n + 1)} />
          ) : (
            <div className="panel unlock">
              <div className="ic">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h3>{premium ? "You have access" : "Free for everyone"}</h3>
              <p className="note" style={{ marginTop: 4 }}>
                {lessons.length ? "Pick any lesson from the curriculum to start." : "Lessons will appear here as they are published."}
              </p>
              {premium && access?.active && (
                <button type="button" className="linkish" style={{ marginTop: 10 }} onClick={() => { forgetPremium(); setReload((n) => n + 1); setAccess({ active: false }); }}>
                  Remove access code from this device
                </button>
              )}
            </div>
          )}
          <div className="panel" style={{ marginTop: 16 }}>
            <h3 style={{ fontSize: 18 }}>Want a mentor alongside?</h3>
            <p className="note">Pair this track with 1:1 mentorship and mock interviews.</p>
            <Link className="btn ghost" to="/book?type=mentorship" style={{ marginTop: 10, width: "100%" }}>
              Book a mentor
            </Link>
          </div>
        </aside>
      </div>
    </Page>
  );
}
