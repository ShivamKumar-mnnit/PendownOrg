import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CalendarClock,
  Check,
  ClipboardList,
  FileCheck2,
  GraduationCap,
  Handshake,
  Languages,
  Layers,
  Newspaper,
  School,
  Settings2,
  ShieldCheck,
  Timer,
  UserCheck,
  Users,
} from "lucide-react";
import WhatsAppIcon from "../components/WhatsAppIcon";
import { call } from "../lib/testsApi";
import { buildAdminWaLink } from "../lib/whatsapp";
import { usePageSEO } from "../lib/seo";
import "./govt-exams.css";

// Exam catalogue: category, title, who it is for, exams covered.
const GOVT_EXAMS = [
  ["SSC", "SSC CGL, CHSL, MTS and GD", "Central government posts through the Staff Selection Commission.", ["CGL", "CHSL", "MTS", "GD Constable", "CPO", "Stenographer"]],
  ["Banking", "Bank and insurance exams", "Clerk, PO and specialist officer roles in public sector banks.", ["IBPS PO", "IBPS Clerk", "SBI PO", "SBI Clerk", "RBI Grade B", "RRB Officer"]],
  ["Railways", "Railway recruitment", "Technical and non-technical posts across Indian Railways.", ["RRB NTPC", "Group D", "ALP", "JE", "Section Controller"]],
  ["UPSC", "UPSC Civil Services and more", "Prelims, Mains and interview preparation for national services.", ["IAS / CSE", "CDS", "CAPF", "EPFO", "ESE"]],
  ["Defence", "Defence entrance exams", "Written exam and physical preparation for the armed forces.", ["NDA", "Agniveer", "AFCAT", "Territorial Army"]],
  ["Police", "Police and security forces", "State police and paramilitary constable and SI exams.", ["State Police", "SI", "Constable", "Fireman", "Jail Warder"]],
  ["Teaching", "Teacher eligibility and recruitment", "Eligibility tests and recruitment exams for school teachers.", ["CTET", "State TET", "TGT", "PGT", "KVS", "NVS"]],
  ["State", "State PSC and subordinate services", "State commission exams such as PPSC, HPSC, UPPSC and their subordinate boards.", ["State PCS", "PSSSB", "UPSSSC PET", "Patwari", "Clerk"]],
  ["Other", "Other central and state exams", "Food, postal, judicial and other department exams.", ["FCI", "Post Office GDS", "NABARD", "Judiciary", "Court Clerk"]],
];

const MODELS = [
  [Settings2, "Set up the cell", "We design it, your team runs it.", ["Interest survey and exam mapping", "Batch plan and timetable", "Syllabus, study plan and test calendar", "Training for your faculty coordinators"]],
  [Users, "Set up and run the cell", "One partner for everything, on your campus.", ["Everything in set up", "Our trainers teach every batch", "Weekly mocks, doubt sessions and mentoring", "Monthly report to management"], true],
  [Handshake, "Outsourced delivery", "We deliver a fixed programme for your students.", ["Online, on campus or hybrid", "Fixed-length programmes by exam", "Test series and current affairs only, if you prefer", "Clear per-student or per-batch pricing"]],
];

const STEPS = [
  ["Interest survey", "We find out which exams your students want and where each student stands today."],
  ["Batch plan", "Students are grouped by exam and level, with a timetable that fits around their classes."],
  ["Teaching", "Trainers cover Quant, Reasoning, English, General Awareness and exam-specific subjects."],
  ["Test and review", "Weekly mocks, doubt sessions and a progress report for every student and for management."],
];

const INCLUDES = [
  [BookOpenCheck, "Full syllabus coverage", "Prelims, Mains, interview and physical or skill tests where the exam has them."],
  [Timer, "Mock tests and analysis", "Timed tests in the real exam pattern, with a score breakdown by topic."],
  [Newspaper, "Current affairs", "Daily and monthly updates with practice questions."],
  [UserCheck, "Mentor support", "Each student has a mentor who tracks attendance, scores and goals."],
  [Languages, "Hindi and English", "Classes and material in the medium your students are comfortable with."],
  [ClipboardList, "Study material", "Notes, formula sheets, previous papers and topic-wise practice sets."],
];

const COLLEGE_GETS = [
  [BarChart3, "Reports for management", "Attendance, mock scores and progress by batch, shared every month."],
  [Layers, "One online panel", "Students take tests in Anobyt's test engine and your coordinators see results in the college panel."],
  [CalendarClock, "Fits your academic calendar", "Classes run in free periods, evenings or weekends, around your exams."],
  [ShieldCheck, "No setup burden", "We handle trainers, content and tests. You provide rooms and a coordinator."],
];

const WEEK = [
  ["Mon", "Quantitative aptitude"],
  ["Tue", "Reasoning"],
  ["Wed", "English and comprehension"],
  ["Thu", "General awareness and current affairs"],
  ["Fri", "Exam-specific subject"],
  ["Sat", "Full mock test and review"],
];

const FAQ = [
  ["How many students can the cell handle?", "Any size. A cell can start with one batch of 40 to 60 students and grow to several hundred across exams. For large groups we run parallel batches by exam and level."],
  ["Which exams should we start with?", "We run a short interest survey first. Most colleges start with SSC, Banking and Railways because their syllabus overlaps, then add UPSC, Defence, Police, Teaching or State exams based on demand."],
  ["Do you teach on campus or online?", "Both. Trainers can come to your campus, teach live online, or a mix of the two. Tests run online so results are tracked in one place."],
  ["Can classes run alongside regular college classes?", "Yes. The timetable is planned around your academic calendar, using free periods, evenings or weekends."],
  ["How is it priced?", "It depends on the model, the number of students, the exams and the mode. Send an enquiry and we share a clear proposal, usually within two working days."],
  ["Can individual students join?", "This programme is set up through colleges and groups. If you are a student, ask your college's career services team to contact us, or send us a message and we will guide you."],
];

const ROLES = ["Director or principal", "Career services or placement cell", "Group or trust management", "Faculty member", "Student", "Other"];
const MODES = ["On campus", "Online", "Hybrid", "Not sure yet"];
const COUNTS = ["Under 100", "100 to 300", "300 to 700", "700 to 1,500", "Over 1,500"];
const EMPTY = { name: "", phone: "", email: "", college: "", city: "", role: ROLES[0], count: "", exams: [], model: "", mode: MODES[0], message: "", website: "" };

const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

function Exams() {
  const [cat, setCat] = useState("All");
  const shown = GOVT_EXAMS.filter(([c]) => cat === "All" || c === cat);
  return (
    <>
      <div className="gx-tabs" role="group" aria-label="Exam category">
        {["All", ...GOVT_EXAMS.map(([c]) => c)].map((c) => (
          <button key={c} type="button" className={`chip${cat === c ? " on" : ""}`} aria-pressed={cat === c} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>
      <div className="gx-exams">
        {shown.map(([c, title, desc, list]) => (
          <article className="card gx-exam" key={c}>
            <span className="tag">{c}</span>
            <h3>{title}</h3>
            <p>{desc}</p>
            <ul>
              {list.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </>
  );
}

/** Enquiry form. Requests land in the admin Inbox as "Govt exams". */
function EnquiryForm() {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [state, setState] = useState({ busy: false, done: false, err: "" });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const toggleExam = (c) => setForm((f) => ({ ...f, exams: f.exams.includes(c) ? f.exams.filter((x) => x !== c) : [...f.exams, c] }));

  async function send(e) {
    e.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = "Enter your name.";
    if (!form.college.trim()) next.college = "Enter the college, university or group name.";
    if (!form.phone.trim() && !form.email.trim()) next.phone = "Add a phone number or an email.";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = "Enter a valid email or leave it empty.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setState({ busy: true, done: false, err: "" });
    try {
      await call("/api/leads", {
        method: "POST",
        body: {
          kind: "govt",
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          website: form.website,
          data: {
            college: form.college.trim(),
            city: form.city.trim(),
            role: form.role,
            students: form.count || "Not specified",
            exams: form.exams.length ? form.exams.join(", ") : "Not sure yet",
            model: form.model || "Not sure yet",
            mode: form.mode,
            message: form.message.trim(),
          },
        },
      });
      setState({ busy: false, done: true, err: "" });
    } catch (x) {
      setState({ busy: false, done: false, err: x.message || "Couldn't send. Please message us on WhatsApp instead." });
    }
  }

  if (state.done) {
    const wa = buildAdminWaLink(`Hi Anobyt! I just sent an enquiry about a Government Exam Preparation Cell for ${form.college}. Contact: ${form.name}, ${form.phone || form.email}.`);
    return (
      <div className="panel gx-form gx-done">
        <span className="gx-done-ic">
          <Check className="h-6 w-6" />
        </span>
        <h3>Enquiry received</h3>
        <p>Thanks, {form.name.split(" ")[0]}. We'll contact you within two working days with a plan for {form.college}.</p>
        <div className="row" style={{ justifyContent: "center" }}>
          <a className="btn" href={wa} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon className="h-4 w-4" /> Also message us on WhatsApp
          </a>
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              setForm(EMPTY);
              setState({ busy: false, done: false, err: "" });
            }}
          >
            Send another enquiry
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="panel gx-form" onSubmit={send} noValidate>
      <h3>Talk to us about a preparation cell</h3>
      <p className="note" style={{ marginTop: 0 }}>Takes a minute. We reply within two working days.</p>
      <div className="two">
        <Field id="g-name" label="Your name" error={errors.name}>
          <input id="g-name" className={`inp${errors.name ? " err" : ""}`} value={form.name} onChange={set("name")} maxLength={120} autoComplete="name" />
        </Field>
        <Field id="g-role" label="Your role">
          <select id="g-role" className="inp" value={form.role} onChange={set("role")}>
            {ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="two">
        <Field id="g-phone" label="Phone" error={errors.phone}>
          <input id="g-phone" className={`inp${errors.phone ? " err" : ""}`} type="tel" value={form.phone} onChange={set("phone")} maxLength={20} autoComplete="tel" placeholder="70xxxxxxxx" />
        </Field>
        <Field id="g-email" label="Email" error={errors.email}>
          <input id="g-email" className={`inp${errors.email ? " err" : ""}`} type="email" value={form.email} onChange={set("email")} maxLength={200} autoComplete="email" placeholder="Optional" />
        </Field>
      </div>
      <div className="two">
        <Field id="g-college" label="College, university or group" error={errors.college}>
          <input id="g-college" className={`inp${errors.college ? " err" : ""}`} value={form.college} onChange={set("college")} maxLength={200} />
        </Field>
        <Field id="g-city" label="City">
          <input id="g-city" className="inp" value={form.city} onChange={set("city")} maxLength={100} placeholder="e.g. Mohali" />
        </Field>
      </div>

      <span className="l">Exams your students are interested in</span>
      <div className="gx-pick" role="group" aria-label="Exams">
        {GOVT_EXAMS.map(([c]) => (
          <button key={c} type="button" className={`chip${form.exams.includes(c) ? " on" : ""}`} aria-pressed={form.exams.includes(c)} onClick={() => toggleExam(c)}>
            {form.exams.includes(c) && <Check className="h-3.5 w-3.5" />} {c}
          </button>
        ))}
      </div>

      <div className="two">
        <Field id="g-count" label="Students interested (approx.)">
          <select id="g-count" className="inp" value={form.count} onChange={set("count")}>
            <option value="">Select</option>
            {COUNTS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field id="g-model" label="How you'd like to work">
          <select id="g-model" className="inp" value={form.model} onChange={set("model")}>
            <option value="">Not sure yet</option>
            {MODELS.map(([, t]) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field id="g-mode" label="Where">
        <select id="g-mode" className="inp" value={form.mode} onChange={set("mode")}>
          {MODES.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </Field>
      <Field id="g-msg" label="Anything else?">
        <textarea id="g-msg" className="inp" rows={3} value={form.message} onChange={set("message")} maxLength={1000} placeholder="Start date, campuses, current setup, questions…" />
      </Field>
      <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website} onChange={set("website")} />
      {state.err && <p className="note bad">{state.err}</p>}
      <button className="btn gx-wide" style={{ marginTop: 18 }} disabled={state.busy}>
        {state.busy ? "Sending…" : "Send enquiry"} {!state.busy && <ArrowRight className="h-4 w-4" />}
      </button>
    </form>
  );
}

function Field({ id, label, error, children }) {
  return (
    <div>
      <label className="l" htmlFor={id}>
        {label}
      </label>
      {children}
      {error && (
        <div className="note">
          <span className="bad">{error}</span>
        </div>
      )}
    </div>
  );
}

function Head({ eyebrow, title, children }) {
  return (
    <div className="head">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </div>
  );
}

/** Government exam preparation: a preparation cell for colleges and groups. */
export default function GovtExams() {
  usePageSEO({
    title: "Government Exam Preparation Cell for Colleges | Anobyt",
    description:
      "Set up a Government Exam Preparation Cell at your college. Anobyt plans, runs or delivers coaching for SSC, Banking, Railways, UPSC, Defence, Police, Teaching and State exams.",
    path: "/government-exams",
  });
  // This page loads on demand, so a link like /government-exams#enquire arrives
  // before the section exists. Jump to it once the page has rendered.
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const t = setTimeout(() => document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: "start" }), 60);
    return () => clearTimeout(t);
  }, [hash]);
  const wa = buildAdminWaLink("Hi Anobyt! I'd like to know about setting up a Government Exam Preparation Cell at our college.");
  const examCount = GOVT_EXAMS.reduce((n, [, , , l]) => n + l.length, 0);

  return (
    <div className="gx">
      <section className="hero gx-hero">
        <div className="wrap grid">
          <div>
            <span className="eyebrow rise">
              New · Government Exam Preparation
            </span>
            <h1 className="rise">
              A government exam <em>preparation cell</em> for your campus
            </h1>
            <p className="lead rise" style={{ animationDelay: ".12s" }}>
              Anobyt sets up and runs structured coaching for SSC, Banking, Railways, UPSC, Defence, Police, Teaching and State exams. Experienced trainers, a fixed timetable and weekly mock tests, on your campus or online.
            </p>
            <div className="row rise" style={{ animationDelay: ".24s" }}>
              <button type="button" className="btn" onClick={() => scrollTo("enquire")}>
                Set up a cell at your college <ArrowRight className="h-4 w-4" />
              </button>
              <button type="button" className="btn ghost" onClick={() => scrollTo("exams")}>
                Browse exams
              </button>
            </div>
            <div className="chips rise" style={{ animationDelay: ".36s", marginTop: 28 }}>
              <span className="chip">Experienced trainers</span>
              <span className="chip">Weekly mock tests</span>
              <span className="chip">Hindi and English medium</span>
              <span className="chip">Campus, online or hybrid</span>
            </div>
          </div>
          <aside className="panel gx-glance rise" style={{ animationDelay: ".2s" }} aria-label="The cell at a glance">
            <div className="top">
              <span>The cell at a glance</span>
              <span className="tag free">For colleges</span>
            </div>
            <div className="stats">
              <div>
                <b>{GOVT_EXAMS.length}</b>
                <span>exam categories</span>
              </div>
              <div>
                <b>{examCount}+</b>
                <span>exams covered</span>
              </div>
              <div>
                <b>3</b>
                <span>ways to partner</span>
              </div>
            </div>
            <h3 className="gx-week-h">A typical week</h3>
            <ul className="gx-week">
              {WEEK.map(([d, s]) => (
                <li key={d}>
                  <b>{d}</b>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <section className="sec gx-for">
        <div className="wrap">
          <div className="gx-callout">
            <span className="ic">
              <School className="h-5 w-5" />
            </span>
            <div>
              <h2>Hundreds of your students want a government job. Give them one place to prepare.</h2>
              <p>
                Career services already handle placements, higher studies and entrepreneurship. Government exams need a different kind of preparation: a long syllabus, a fixed exam
                calendar and a lot of practice. Anobyt brings the trainers, content and test series so your college can offer it without building a coaching institute from scratch.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="sec alt" id="exams">
        <div className="wrap">
          <Head eyebrow="Exams we prepare for" title="Choose your exam">
            Pick a category to see the exams we prepare students for. Batches are formed by exam, so syllabus overlap is used well.
          </Head>
          <Exams />
        </div>
      </section>

      <section className="sec" id="models">
        <div className="wrap">
          <Head eyebrow="For universities, colleges and groups" title="Three ways to work with us">
            Whether you want an experienced partner to set up the cell, run it end to end, or deliver a programme as an outsourced partner.
          </Head>
          <div className="gx-models">
            {MODELS.map(([Icon, title, sub, points, best]) => (
              <div key={title} className={`card gx-model${best ? " best" : ""}`}>
                {best && <span className="gx-badge">Most chosen</span>}
                <span className="ic">
                  <Icon className="h-5 w-5" />
                </span>
                <h3>{title}</h3>
                <p>{sub}</p>
                <ul className="ck">
                  {points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
                <button type="button" className={`btn${best ? "" : " ghost"}`} onClick={() => scrollTo("enquire")}>
                  Discuss this model
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec alt">
        <div className="wrap">
          <Head eyebrow="How it works" title="From interest survey to exam day" />
          <div className="steps">
            {STEPS.map(([t, d]) => (
              <div key={t}>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <Head eyebrow="For students" title="What every batch includes" />
          <div className="gx-grid">
            {INCLUDES.map(([Icon, t, d]) => (
              <div key={t} className="card">
                <span className="ic">
                  <Icon className="h-5 w-5" />
                </span>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec alt">
        <div className="wrap gx-split">
          <Head eyebrow="For the college" title="What your college gets">
            A cell that runs on a plan, with numbers you can show your management and your students' parents.
          </Head>
          <div className="gx-gets">
            {COLLEGE_GETS.map(([Icon, t, d]) => (
              <div key={t}>
                <Icon className="h-5 w-5" />
                <div>
                  <b>{t}</b>
                  <span>{d}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec" id="enquire">
        <div className="wrap gx-book">
          <div>
            <Head eyebrow="Contact Anobyt" title="Start a preparation cell at your college">
              Share a few details and we'll come back with a plan: suggested exams, batch sizes, a timetable and a clear proposal.
            </Head>
            <ul className="gx-promise">
              <li>
                <GraduationCap className="h-5 w-5" /> Free interest survey for your students
              </li>
              <li>
                <FileCheck2 className="h-5 w-5" /> Written proposal within two working days
              </li>
              <li>
                <Users className="h-5 w-5" /> Start with one batch, scale to hundreds
              </li>
            </ul>
            <a className="btn ghost" href={wa} target="_blank" rel="noopener noreferrer" style={{ marginTop: 20 }}>
              <WhatsAppIcon className="h-4 w-4" /> Prefer WhatsApp? Message us
            </a>
          </div>
          <EnquiryForm />
        </div>
      </section>

      <section className="sec alt">
        <div className="wrap" style={{ maxWidth: 860 }}>
          <Head eyebrow="FAQ" title="Questions colleges ask us" />
          {FAQ.map(([q, a]) => (
            <details className="faq-item" key={q}>
              <summary>
                <h3>{q}</h3>
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="cta">
            <h2>Ready to start your Government Exam Preparation Cell?</h2>
            <p>Tell us how many students are interested and which exams they want. We'll handle the rest.</p>
            <button type="button" className="btn" onClick={() => scrollTo("enquire")}>
              Send an enquiry
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
