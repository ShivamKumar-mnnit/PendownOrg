import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Building2, Check, ClipboardCheck, Code2, Crown, Lock, SquareTerminal } from "lucide-react";
import { Head } from "../components/ui";
import { COMPANIES } from "../lib/companyPrep";
import { usePractice } from "../lib/problemBank";
import { FREE_PERKS, MEMBER_PERKS, PRACTICE_PERKS } from "../lib/plans";
import { rupees, validity } from "../lib/account";
import { usePageSEO } from "../lib/seo";

const PIPELINE = [
  ["Aptitude test", "Most IT services drives start here: quant, reasoning and verbal sections, often with a cut-off for each section.", "Percentages, Number series, Reading comprehension"],
  ["Coding round", "Timed problems decide the shortlist, especially at product companies and higher-tier roles.", "Arrays, Strings, Recursion"],
  ["Technical interview", "Interviewers usually start with your resume and projects, then move to core subjects.", "Projects, DBMS, OS, OOP"],
  ["HR interview", "Communication, motivation and joining details settle the final decision.", "Introduction, Strengths, Relocation"],
  ["Offer", "Documents, joining date and pre-joining training come next.", "Offer letter, Verification, Onboarding"],
];

const YEARS = [
  [1, "1st Year", "Programming basics", ["Operators, loops and patterns", "Functions and recursion", "Arrays, strings and linked lists"]],
  [2, "2nd Year", "Data structures", ["Two pointers and hashing", "Stacks and queues", "Sorting and searching"]],
  [3, "3rd Year", "Algorithms", ["Dynamic programming", "Graphs and greedy", "Sliding window"]],
  [4, "4th Year", "Placement ready", ["Interview classics", "Advanced DP and graphs", "Mock interviews"]],
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

const PLATFORM = [
  ["/problems", Code2, "Coding practice", "Year-wise problems with an editor, Run and Submit, and instant results.", "Free + Premium"],
  ["/courses", BookOpen, "Learning modules", "Structured courses. Start with the free modules and unlock the rest.", "Free + Premium"],
  ["/practice", ClipboardCheck, "Assessments", "MCQ, coding and Olympiad tests with instant scores.", "Free"],
  ["/compiler", SquareTerminal, "Online compiler", "Python, Java, C, C++ and JavaScript with input, test cases and clear errors.", "Free"],
  ["/tests", Crown, "Create tests", "Proctored MCQ tests with random question sets, ranks and analytics.", "Colleges"],
  ["/workspace", Building2, "College panel", "Batches, student logins, interviews, scorecards and announcements.", "Colleges"],
];

const FEATURES = [
  ["👩‍💼", "Mentors from industry", "Professionals who have sat on the other side of the table."],
  ["📝", "Feedback you can use", "Detailed, honest notes after every session, not just pass or fail."],
  ["🎥", "Mock interviews", "Company-style rounds with structured feedback."],
  ["🤝", "1:1 mentorship", "Guidance on resumes, projects and strategy."],
  ["🎯", "Domain-specific prep", "SDE, Data Science, Product, Consulting and more."],
  ["📄", "Resume review", "Share your resume link and your mentor reviews it first."],
  ["🗓️", "Slots that fit you", "Pick a time, confirm on WhatsApp, join on Google Meet."],
  ["🔓", "No long commitments", "Pay per session. Nothing locks you in."],
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
          <CountUp to={4} />
          <span>academic years</span>
        </div>
        <div>
          <CountUp to={5} />
          <span>languages</span>
        </div>
        <div>
          <CountUp to={4} />
          <span>domains</span>
        </div>
      </div>
    </div>
  );
}

/** Live problem counts under the hero buttons. */
function HeroFacts() {
  const { data } = usePractice();
  const total = data?.years.reduce((n, y) => n + y.total, 0);
  const free = data?.years.reduce((n, y) => n + y.free, 0);
  return (
    <ul className="hero-facts rise" style={{ animationDelay: ".36s" }}>
      <li>
        <Check className="h-4 w-4" /> {total ? `${total} coding problems for 1st to 4th year` : "Coding problems for 1st to 4th year"}
      </li>
      <li>
        <Check className="h-4 w-4" /> {free ? `${free} free to solve, no payment needed` : "Free problems in every topic"}
      </li>
      <li>
        <Check className="h-4 w-4" /> Run and submit in Python, Java, C, C++ and JavaScript
      </li>
    </ul>
  );
}

/** Free plan next to the two premium plans, with live prices. */
function FreeVsPremium() {
  const { data } = usePractice();
  const plan = data?.plan;
  const cols = [
    ["Free", "₹0", "forever", FREE_PERKS, "/problems", "Start free", false],
    ["Premium practice", plan ? rupees(plan.practice.price) : "", plan ? validity(plan.practice.days) : "", PRACTICE_PERKS, "/premium", "See premium practice", false],
    ["Premium membership", plan ? rupees(plan.allAccess.price) : "", plan ? validity(plan.allAccess.days) : "", MEMBER_PERKS, "/premium", "See membership", true],
  ];
  return (
    <div className="fvp">
      {cols.map(([name, price, per, perks, to, cta, best]) => (
        <div key={name} className={`fvp-col${best ? " best" : ""}`}>
          <div className="meta" style={{ justifyContent: "flex-start", gap: 8 }}>
            {name === "Free" ? <span className="badge free">FREE</span> : <span className="badge prem">{best ? <Crown className="h-3 w-3" /> : <Lock className="h-3 w-3" />} PREMIUM</span>}
          </div>
          <h3>{name}</h3>
          <div className="price">
            {price || "…"} <small>/ {per}</small>
          </div>
          <ul className="ticks">
            {perks.map((p) => (
              <li key={p}>
                <Check className="h-4 w-4" /> {p}
              </li>
            ))}
          </ul>
          <Link className={best ? "btn" : "btn ghost"} to={to}>
            {cta} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ))}
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
            <span className="eyebrow rise">Coding practice · Courses · Assessments · Mock interviews</span>
            <h1 className="rise">
              Practice the interview <em>before</em> it counts.
            </h1>
            <p className="lead rise" style={{ animationDelay: ".12s" }}>
              Year-wise coding practice, learning modules and tests for college students, plus 1:1 mock interviews with working professionals. Start free and upgrade when you want more.
            </p>
            <div className="row rise" style={{ animationDelay: ".24s" }}>
              <Link className="btn" to="/problems">
                Start practising free
              </Link>
              <Link className="btn ghost" to="/book">
                Book a mock interview
              </Link>
            </div>
            <HeroFacts />
          </div>
          <Pipeline />
        </div>
        <div>
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
          <div className="split-head">
            <Head eyebrow="What Anobyt offers" title="One place to learn, code and get tested">
              Coding practice, learning modules, assessments and premium tools, all connected to your account.
            </Head>
            <Link className="btn ghost" to="/premium">
              See premium plans
            </Link>
          </div>
          <div className="plat">
            {PLATFORM.map(([to, Icon, title, text, tag]) => (
              <Link key={to} to={to} className="plat-card">
                <span className="ic">
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <b>{title}</b>
                  <span>{text}</span>
                </span>
                {tag && <em>{tag}</em>}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <Head eyebrow="Practice by year" title="A clear path from first year to placement">Pick your year to see its problems. Every year starts with free problems in every topic.</Head>
          <div className="yrs">
            {YEARS.map(([n, year, title, items]) => (
              <Link key={year} to={`/problems/year/${n}`}>
                <small>{year}</small>
                <h3>{title}</h3>
                <ul>
                  {items.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
                <span className="yrs-go">
                  Open {year} problems <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="sec alt">
        <div className="wrap">
          <div className="split-head">
            <Head eyebrow="Free and premium" title="Start free. Upgrade only when you need more.">
              Everything free is marked FREE, everything paid is marked PREMIUM, and prices are shown before you pay.
            </Head>
            <Link className="btn ghost" to="/premium">
              Compare plans
            </Link>
          </div>
          <FreeVsPremium />
        </div>
      </section>

      <section className="sec">
        <div className="wrap split">
          <div>
            <Head eyebrow="Why Anobyt" title="Interview prep without the friction">
              Real mentors, honest feedback and slots that fit around college. Book one session or keep going.
            </Head>
            <div className="row">
              <Link className="btn" to="/book">
                Book a session
              </Link>
              <Link className="btn ghost" to="/mentors">
                Meet the mentors
              </Link>
            </div>
          </div>
          <div className="feat-grid">
            {FEATURES.map(([icon, title, text]) => (
              <div key={title}>
                <span className="fi">{icon}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec alt">
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
