import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, FileText, Link2, Lock, PlayCircle } from "lucide-react";
import { Head, Page } from "../components/ui";
import RichText from "../components/RichText";
import Buy from "../components/Buy";
import WhatsAppIcon from "../components/WhatsAppIcon";
import { forgetPremium, getContent, lessonTotal, premiumStatus, redeemCode } from "../lib/contentApi";
import { DEFAULT_COURSES } from "../lib/content/defaults";
import { doneLessons } from "../lib/lessons";
import { rupees, useAccount } from "../lib/account";
import { buildAdminWaLink } from "../lib/whatsapp";
import { usePageSEO } from "../lib/seo";

const TYPE_ICON = { video: PlayCircle, article: FileText, link: Link2, pdf: FileText };

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
      <h3 style={{ fontSize: 18 }}>Have an access code?</h3>
      <p className="note" style={{ marginTop: 4 }}>
        Codes from us or your college unlock the course on this device.
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
        <WhatsAppIcon className="h-4 w-4" /> Ask on WhatsApp
      </a>
    </div>
  );
}

export default function CourseDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const fallback = DEFAULT_COURSES.find((c) => c.id === id);
  const [course, setCourse] = useState(fallback ? { ...fallback, unlocked: fallback.tier === "free" } : null);
  const [error, setError] = useState("");
  const [access, setAccess] = useState(null);
  const [reload, setReload] = useState(0);
  const { user } = useAccount();
  const [done] = useState(() => doneLessons(id));

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
  }, [id, reload, fallback, user?.id]);

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
  const freeCount = course.modules.filter((m) => m.free).length;
  const lockedCount = course.modules.filter((m) => m.unlocked === false).length;
  const firstOpen = lessons.find((l) => !l.locked);
  const doneCount = lessons.filter((l) => done.has(l.id)).length;
  const refresh = () => setReload((n) => n + 1);

  function openLesson(l) {
    if (l.locked) {
      document.getElementById("unlock")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    nav(`/courses/${id}/learn/${l.id}`);
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
          <div className="kpis" style={{ maxWidth: 640 }}>
            <div><b>{lessonTotal(course) || "—"}</b><span>Lessons</span></div>
            <div><b>{course.modules.length || course.outline.length}</b><span>Modules</span></div>
            <div><b>{premium && course.price > 0 ? rupees(course.price) : course.priceLabel || (premium ? "Premium" : "Free")}</b><span>{premium && freeCount ? `${freeCount} module${freeCount > 1 ? "s" : ""} free` : "Access"}</span></div>
            {lessons.length > 0 && <div><b>{Math.round((doneCount * 100) / lessons.length)}%</b><span>Your progress</span></div>}
          </div>
          {firstOpen && (
            <button type="button" className="btn" style={{ marginTop: 22 }} onClick={() => openLesson(lessons.find((l) => !l.locked && !done.has(l.id)) || firstOpen)}>
              <PlayCircle className="h-4 w-4" /> {doneCount ? "Continue learning" : "Start learning"}
            </button>
          )}
        </div>
      </div>

      <div className="course-grid">
        <div>
          {course.description && (
            <div className="panel" style={{ marginBottom: 18 }}>
              <h3 style={{ fontSize: 20, marginBottom: 8 }}>About this course</h3>
              <RichText text={course.description} />
            </div>
          )}
          <h2 style={{ fontSize: 24, margin: "8px 0 14px" }}>Curriculum</h2>
          {course.modules.length > 0 ? (
            course.modules.map((m, i) => (
              <details className="module" key={m.id || i} open={i < 3}>
                <summary>
                  <span className="mnum">{String(i + 1).padStart(2, "0")}</span>
                  <b>{m.title || `Module ${i + 1}`}</b>
                  {premium && (m.free ? <span className="badge free">Free</span> : m.unlocked ? <span className="badge free">Unlocked</span> : <span className="badge lock"><Lock className="h-3 w-3" /> Paid</span>)}
                  <small>{m.lessons.length} lessons</small>
                </summary>
                {premium && m.unlocked === false && (
                  <div className="lockbox" style={{ margin: "0 18px 8px" }}>
                    <p>{m.price > 0 ? `Unlock just this module for ${rupees(m.price)}, or get the full course.` : "Included with the full course."}</p>
                    {m.price > 0 && <Buy item={{ type: "module", courseId: course.id, moduleId: m.id }} price={m.price} label="Unlock module" className="btn ghost" onDone={refresh} />}
                  </div>
                )}
                <ul>
                  {m.lessons.map((l) => {
                    const Icon = l.locked ? Lock : done.has(l.id) ? CheckCircle2 : TYPE_ICON[l.type] || FileText;
                    return (
                      <li key={l.id}>
                        <button type="button" className={`lesson ${l.locked ? "locked" : ""} ${done.has(l.id) ? "done" : ""}`} onClick={() => openLesson(l)}>
                          <Icon className="h-4 w-4" />
                          <span>{l.title}</span>
                          {l.preview && premium && m.unlocked === false && <span className="tag free">Free preview</span>}
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
            <>
              <div className="panel unlock">
                <div className="ic">
                  <Lock className="h-5 w-5" />
                </div>
                <h3>Unlock the full course</h3>
                <p className="note" style={{ marginTop: 4 }}>
                  {freeCount ? `The first ${freeCount === 1 ? "module is" : `${freeCount} modules are`} free. ` : ""}
                  {lockedCount ? `Get all ${course.modules.length} modules, lifetime access.` : "Every module is open to you."}
                </p>
                {course.price > 0 ? (
                  <div style={{ marginTop: 14 }}>
                    <Buy item={{ type: "course", id: course.id }} price={course.price} label="Buy course" className="btn" onDone={refresh} />
                  </div>
                ) : (
                  <p className="note">Ask us on WhatsApp for the price, or use an access code below.</p>
                )}
                {!user && <p className="note" style={{ fontSize: 13 }}>You'll sign in or create a free account first, so your purchase stays with you on every device.</p>}
              </div>
              <div style={{ marginTop: 16 }}>
                <Unlock course={course} onUnlocked={refresh} />
              </div>
            </>
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
                <button type="button" className="linkish" style={{ marginTop: 10 }} onClick={() => { forgetPremium(); refresh(); setAccess({ active: false }); }}>
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
