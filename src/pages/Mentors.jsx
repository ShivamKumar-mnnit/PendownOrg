import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, FileText, MessageCircle, Video, Award, ClipboardCheck, UserCheck, Sparkles } from "lucide-react";
import { Head, CTA, Page } from "../components/ui";
import { DOMAINS } from "../lib/domains";
import { usePageSEO } from "../lib/seo";

const FORMATS = [
  {
    id: "mock",
    icon: Video,
    name: "Mock interview",
    tag: "Most booked",
    pitch: "A real interview round, run the way your target company runs it.",
    best: "Students with an interview or campus drive coming up",
    includes: ["Company-style technical or case round", "Resume reviewed before the session", "Written feedback with a score per skill", "What to practice next"],
  },
  {
    id: "mentorship",
    icon: UserCheck,
    name: "1:1 mentorship",
    pitch: "An open conversation with a professional in the field you want to enter.",
    best: "Planning your prep, projects, internships or a switch",
    includes: ["Roadmap for your year and goals", "Project and portfolio guidance", "Honest answers about the role", "Follow-up support on WhatsApp"],
  },
  {
    id: "review",
    icon: FileText,
    name: "Resume and career review",
    pitch: "A focused look at your resume and how you present your work.",
    best: "Before applying or before placement season",
    includes: ["Line-by-line resume feedback", "How to talk about your projects", "Which roles to target", "Action list you can finish in a week"],
  },
];

const JOURNEY = [
  ["Before", CalendarCheck, "Book and get matched", "Fill the form, pick your domain and preferred slot. We match a mentor and confirm on WhatsApp. Your mentor reads your resume first."],
  ["During", Video, "Live on Google Meet", "A focused 1:1 round with your mentor: questions, follow-ups and discussion, just like the real thing."],
  ["After", ClipboardCheck, "Feedback and next steps", "You get structured feedback, what to work on next and a certificate of completion. WhatsApp stays open for questions."],
];

const RUBRIC = [
  ["Problem solving", 4],
  ["Code quality", 3],
  ["Communication", 4],
  ["Fundamentals", 3],
];

const FAQ = [
  ["Who are the mentors?", "Working professionals in the domain you choose: engineers, data scientists, product managers and consultants."],
  ["Can I choose the company style?", "Yes. Mention your target company in the booking form and the round is shaped around it."],
  ["What if I need to reschedule?", "Message us on WhatsApp and we move your slot."],
  ["Do I get anything after the session?", "Written feedback with pointers for next time, and an Anobyt certificate of completion."],
];

export default function Mentors() {
  usePageSEO({
    title: "Mentorship and sessions",
    description:
      "1:1 mock interviews, mentorship and resume reviews with working professionals, matched to your domain: SDE, Data / AI, Product, Consulting and more.",
    path: "/mentors",
  });
  const [domain, setDomain] = useState(DOMAINS[0].id);
  const picked = DOMAINS.find((d) => d.id === domain);

  return (
    <>
      <section className="hero mhero">
        <div className="wrap grid">
          <div>
            <span className="eyebrow rise">Mentorship and sessions</span>
            <h1 className="rise">
              Learn from people who have <em>been there</em>.
            </h1>
            <p className="lead rise" style={{ animationDelay: ".12s" }}>
              Mock interviews, 1:1 mentorship and resume reviews with working professionals, matched to your domain and confirmed on WhatsApp.
            </p>
            <div className="row rise" style={{ animationDelay: ".24s" }}>
              <Link className="btn" to="/book?type=mock">
                Book a mock interview
              </Link>
              <Link className="btn ghost" to="/book?type=mentorship">
                Talk to a mentor
              </Link>
            </div>
            <div className="trust rise" style={{ animationDelay: ".36s" }}>
              <span><Sparkles className="h-4 w-4" /> Matched by domain</span>
              <span><MessageCircle className="h-4 w-4" /> WhatsApp confirmation</span>
              <span><Award className="h-4 w-4" /> Certificate</span>
            </div>
          </div>

          <div className="report pipe" aria-label="Sample feedback report">
            <div className="report-h">
              <div>
                <small>Sample feedback report</small>
                <b>Mock interview · SDE</b>
              </div>
              <span className="tag free">Ready</span>
            </div>
            {RUBRIC.map(([k, v]) => (
              <div className="rb" key={k}>
                <span>{k}</span>
                <div className="dots" aria-label={`${v} out of 5`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <i key={n} className={n <= v ? "on" : ""} />
                  ))}
                </div>
              </div>
            ))}
            <div className="report-note">
              <b>Next steps</b>
              <p>Talk through edge cases before coding. Revise sliding window and BFS. Practice explaining time complexity out loud.</p>
            </div>
          </div>
        </div>
      </section>

      <Page>
        <Head eyebrow="Session formats" title="Choose how you want to prepare">
          Three ways to work with a mentor. Every session is 1:1, live and matched to your domain.
        </Head>
        <div className="formats">
          {FORMATS.map((f) => {
            const Icon = f.icon;
            return (
              <div className={`format ${f.tag ? "feat" : ""}`} key={f.id}>
                {f.tag && <span className="ribbon">{f.tag}</span>}
                <div className="ic">
                  <Icon className="h-5 w-5" />
                </div>
                <h3>{f.name}</h3>
                <p className="pitch">{f.pitch}</p>
                <ul className="ck">
                  {f.includes.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
                <p className="best">
                  <b>Best for:</b> {f.best}
                </p>
                <Link className={`btn ${f.tag ? "" : "ghost"}`} to={`/book?type=${f.id}`}>
                  Book {f.name.toLowerCase()}
                </Link>
              </div>
            );
          })}
        </div>

        <div className="sec-gap" />
        <Head eyebrow="Domains" title="Matched to a mentor in your field">
          Pick a domain to see what your session covers. No random queue.
        </Head>
        <div className="domains">
          <div className="dlist" role="tablist" aria-label="Domains">
            {DOMAINS.map((d) => {
              const Icon = d.icon;
              return (
                <button key={d.id} type="button" role="tab" aria-selected={d.id === domain} className={d.id === domain ? "on" : ""} onClick={() => setDomain(d.id)}>
                  <Icon className="h-4 w-4" />
                  {d.label}
                </button>
              );
            })}
          </div>
          <div className="dpanel panel" key={picked.id}>
            <span className="eyebrow">Your mentor</span>
            <h3>{picked.label}</h3>
            <p>{picked.blurb}</p>
            <div className="row" style={{ marginTop: 18 }}>
              <Link className="btn" to={`/book?type=mock&domain=${encodeURIComponent(picked.label)}`}>
                Book a {picked.id === "other" ? "session" : "mock interview"}
              </Link>
              <Link className="btn ghost" to={`/book?type=mentorship&domain=${encodeURIComponent(picked.label)}`}>
                Ask for mentorship
              </Link>
            </div>
          </div>
        </div>

        <div className="sec-gap" />
        <Head eyebrow="How it works" title="What a session looks like" />
        <div className="journey">
          {JOURNEY.map(([when, Icon, title, text]) => (
            <div key={when}>
              <div className="jdot">
                <Icon className="h-5 w-5" />
              </div>
              <small>{when}</small>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>

        <div className="sec-gap" />
        <div className="two-col">
          <div>
            <Head eyebrow="Questions" title="Before you book" />
            <p className="note" style={{ fontSize: 16 }}>
              Still unsure? <Link to="/faq" style={{ color: "var(--color-accent)" }}>Read the full FAQ</Link> or message us on WhatsApp.
            </p>
          </div>
          <div>
            {FAQ.map(([q, a]) => (
              <details className="faq-item" key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </Page>
      <CTA title="Meet your mentor" text="Pick your domain and book a session. We confirm your slot on WhatsApp." />
    </>
  );
}
