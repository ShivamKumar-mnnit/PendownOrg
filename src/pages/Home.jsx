import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Head, Cards } from "../components/ui";
import { COMPANIES, ROUNDS_MAPPED } from "../lib/companyPrep";
import { usePageSEO } from "../lib/seo";

const PIPELINE = [
  ["Aptitude test", "Most IT services drives start here: quant, reasoning and verbal sections, often with a cut-off for each section.", "Percentages, Number series, Reading comprehension"],
  ["Coding round", "Timed problems decide the shortlist, especially at product companies and higher-tier roles.", "Arrays, Strings, Recursion"],
  ["Technical interview", "Interviewers usually start with your resume and projects, then move to core subjects.", "Projects, DBMS, OS, OOP"],
  ["HR interview", "Communication, motivation and joining details settle the final decision.", "Introduction, Strengths, Relocation"],
  ["Offer", "Documents, joining date and pre-joining training come next.", "Offer letter, Verification, Onboarding"],
];

const YEARS = [
  ["Year 1", "Programming basics", ["C / C++ and Python", "Logic and patterns", "Problem solving"]],
  ["Year 2", "DSA and development", ["Data structures", "DBMS and SQL", "LeetCode track"]],
  ["Year 3", "Projects and depth", ["Advanced DSA", "Full stack project", "AI/ML and system design"]],
  ["Final year", "Interview ready", ["Aptitude and mock tests", "Company-specific prep", "Mock interviews"]],
];

const EXPLORE = [
  ["/mentors", "Mentors", "Who you will be matched with"],
  ["/companies", "Companies", "Typical hiring rounds"],
  ["/courses", "Courses", "Free and premium tracks"],
  ["/compiler", "Online compiler", "Run code in your browser"],
  ["/practice", "Tests and assessments", "MCQ, coding and Olympiad tests"],
  ["/tests", "Create tests", "Build tests for your students"],
  ["/dashboard", "Student dashboard", "Track solves, rank and rewards"],
  ["/colleges", "For colleges", "Onboard a whole batch"],
];

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Counts up from 0 to `to` once, easing out. */
function CountUp({ to }) {
  const [n, setN] = useState(() => (reducedMotion() ? to : 0));
  useEffect(() => {
    if (reducedMotion()) return;
    let raf;
    let t0 = null;
    const step = (t) => {
      t0 = t0 ?? t;
      const p = Math.min((t - t0) / 1200, 1);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <b>{n}</b>;
}

/** The interactive "placement pipeline" card in the hero; auto-advances. */
function Pipeline() {
  const [active, setActive] = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    if (reducedMotion()) return;
    timer.current = setInterval(() => setActive((i) => (i + 1) % PIPELINE.length), 3600);
    return () => clearInterval(timer.current);
  }, []);

  const [title, text, topics] = PIPELINE[active];

  return (
    <div className="panel pipe">
      <div className="top">
        <span>Your placement pipeline</span>
        <span>Typical campus drive</span>
      </div>
      <ol className="pl">
        {PIPELINE.map(([name], i) => (
          <li key={name} className={i === active ? "on" : i < active ? "done" : ""} onClick={() => setActive(i)}>
            <i />
            <span>{name}</span>
          </li>
        ))}
      </ol>
      <div className="pinfo sw" key={active}>
        <h3>{title}</h3>
        <p>{text}</p>
        <div className="row">
          {topics.split(", ").map((t) => (
            <span className="chip" key={t}>
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="stats">
        <div>
          <CountUp to={COMPANIES.length} />
          <span>companies</span>
        </div>
        <div>
          <CountUp to={ROUNDS_MAPPED} />
          <span>rounds mapped</span>
        </div>
        <div>
          <CountUp to={4} />
          <span>domains</span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  usePageSEO({
    title: "Anobyt | Mock Interviews & Mentorship for College Students",
    description:
      "Book 1:1 mock interviews and mentorship with industry professionals, matched to your domain (SDE, Data/AI, Product, Consulting) and confirmed over WhatsApp.",
    path: "/",
  });

  return (
    <>
      <section className="hero">
        <div className="wrap grid">
          <div>
            <span className="eyebrow rise">Mock interviews · Mentorship · Assessments</span>
            <h1 className="rise">
              Practice the interview <em>before</em> it counts.
            </h1>
            <p className="lead rise" style={{ animationDelay: ".12s" }}>
              1:1 mock interviews and mentorship with working professionals, matched to your domain and confirmed on WhatsApp.
            </p>
            <div className="row rise" style={{ animationDelay: ".24s" }}>
              <Link className="btn" to="/book">
                Book a mock interview
              </Link>
              <Link className="btn ghost" to="/colleges">
                For colleges
              </Link>
            </div>
            <div className="chips rise" style={{ animationDelay: ".36s" }}>
              {["SDE", "Data / AI", "Product", "Consulting"].map((c) => (
                <span className="chip" key={c}>
                  {c}
                </span>
              ))}
            </div>
          </div>
          <Pipeline />
        </div>
        <div className="wrap">
          <div className="mq" aria-label="Companies covered">
            <div>
              {COMPANIES.concat(COMPANIES).map((c, i) => (
                <span key={i}>{c.name}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="sec alt">
        <div className="wrap">
          <Head eyebrow="Your roadmap" title="A clear path from first year to placement">Know what to work on this year, and what comes next.</Head>
          <div className="yrs">
            {YEARS.map(([year, title, items]) => (
              <div key={year}>
                <small>{year}</small>
                <h3>{title}</h3>
                <ul>
                  {items.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <Head eyebrow="Why Anobyt" title="Why students choose Anobyt">Interview prep without the friction.</Head>
          <Cards
            items={[
              ["👩‍💼", "Mentors from industry", "Matched with professionals who have sat on the other side of the table."],
              ["📝", "Feedback you can use", "Detailed, honest notes after every session, not just pass or fail."],
              ["🗓️", "Slots that fit you", "Pick a time, confirm on WhatsApp, join on Google Meet."],
              ["🔓", "No long commitments", "Book one session or keep going. Nothing locks you in."],
            ]}
          />
        </div>
      </section>

      <section className="sec alt">
        <div className="wrap">
          <Head eyebrow="What we offer" title="Everything you need to walk in prepared">No subscriptions and no long onboarding.</Head>
          <Cards
            items={[
              ["🎥", "Mock interviews", "Company-style rounds with structured feedback."],
              ["🤝", "1:1 mentorship", "Guidance on resumes, projects and strategy."],
              ["🎯", "Domain-specific prep", "SDE, Data Science, Product, Consulting and more."],
              ["📄", "Resume review", "Share your resume link and your mentor reviews it first."],
            ]}
          />
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <Head eyebrow="How it works" title="From booking form to feedback in four steps">Book in a minute, meet your mentor, leave with a plan.</Head>
          <div className="steps">
            <div>
              <h3>Fill the booking form</h3>
              <p>Share your name, phone, domain and preferred slot.</p>
            </div>
            <div>
              <h3>Get matched</h3>
              <p>We assign a mentor based on your domain.</p>
            </div>
            <div>
              <h3>Confirm on WhatsApp</h3>
              <p>We message your slot details directly.</p>
            </div>
            <div>
              <h3>Attend on Google Meet</h3>
              <p>Join a real 1:1 round, then get structured feedback.</p>
            </div>
          </div>

          <Head title="Explore more" style={{ marginTop: 72 }} />
          <div className="more">
            {EXPLORE.map(([to, title, text]) => (
              <Link key={to} to={to}>
                <b>{title}</b>
                <span>{text}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
