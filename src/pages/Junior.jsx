import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import WhatsAppIcon from "../components/WhatsAppIcon";
import { call } from "../lib/testsApi";
import { buildAdminWaLink } from "../lib/whatsapp";
import { usePageSEO } from "../lib/seo";

// Each colour is a hue used for a card's tint, border and sticker.
const C = { pink: "#ff5d8f", orange: "#ff9f1c", yellow: "#f7c600", green: "#2ec27e", teal: "#14b8c4", blue: "#3b82f6", purple: "#8b5cf6", red: "#ef4444" };

// Class bands in the hero, shown as game levels.
const LEVELS = [
  ["🌱", "Level 1", "Classes 6 to 8", "Play, build and get curious", "Block coding, games and puzzles that turn screen time into making things.", ["blocks", "games", "safety", "puzzles"], 1, C.green],
  ["⚡", "Level 2", "Classes 9 and 10", "Write real code for the first time", "Python basics, a first website and a hands-on look at how AI tools work.", ["python", "web", "ai", "safety"], 2, C.blue],
  ["🚀", "Level 3", "Classes 11 and 12", "Build projects and plan a career", "Python and AI projects, plus honest guidance on tech careers and college choices.", ["ai", "python", "web", "careers"], 3, C.purple],
];

// Workshop catalogue: id, emoji, colour, title, classes, what students do.
const WORKSHOPS = [
  ["blocks", "🧱", C.orange, "Coding with blocks", "Classes 6 to 8", "Drag and drop code to make animations and mini games. Loops, conditions and events, no typing needed."],
  ["games", "🎮", C.pink, "Design your own game", "Classes 6 to 9", "From idea to playable game in one session. Plan the rules, characters and scoring, then swap games with friends."],
  ["python", "🐍", C.green, "Python from zero", "Classes 8 to 12", "Variables, loops and functions through small programs: a quiz, a calculator, a password checker."],
  ["web", "🌐", C.blue, "Build your first website", "Classes 8 to 12", "HTML and CSS by hand. Every student leaves with a personal page they designed themselves."],
  ["ai", "🤖", C.purple, "AI and ChatGPT, explained", "Classes 8 to 12", "How AI tools learn, where they go wrong, and how to use them for study without copying."],
  ["safety", "🛡️", C.teal, "Cyber safety and digital smarts", "Classes 6 to 12", "Strong passwords, scams, privacy and kind behaviour online, with real examples students recognise."],
  ["puzzles", "🧩", C.yellow, "Logic, puzzles and Olympiad prep", "Classes 6 to 10", "Pattern and reasoning puzzles that build computational thinking, with practice for school Olympiads."],
  ["careers", "🎓", C.red, "Tech careers and college guidance", "Classes 10 to 12", "What engineers, data scientists and designers really do, and how stream and college choices lead there."],
];

const FORMATS = [
  ["⏱️", "Single workshop", "2 to 3 hours", "One topic for one class or section. A great first event for a school.", 1, C.green],
  ["🎉", "Tech day or bootcamp", "1 to 2 days", "Several workshops back to back, with a showcase or quiz at the end.", 2, C.orange],
  ["🏆", "Term-long coding club", "4 to 12 weeks", "Weekly sessions that build towards a project each student presents.", 3, C.purple],
];

const GETS = [
  ["🏅", "Certificates for every student", "A participation certificate with the student's name, workshop and school.", C.yellow],
  ["📒", "Worksheets and practice", "Take-home activities so the learning carries on after the session.", C.blue],
  ["🧑‍🏫", "Teacher resources", "Slides and notes your computer teachers can reuse in class.", C.green],
  ["🎤", "A quiz or showcase", "Students present what they built and the top performers are celebrated.", C.pink],
];

const STEPS = [
  ["📨", "Send a request", "Tell us your school, classes and the topics you like."],
  ["📞", "Plan it together", "We call you within a day to fix the format, dates and student count."],
  ["🛠️", "Workshop day", "Our trainers run the session in your lab, classroom or online."],
  ["🎁", "Follow-up", "Certificates, worksheets and a short report on how it went."],
];

const FAQ = [
  ["How much does a workshop cost?", "It depends on the format, the number of students and whether it's on campus or online. Send a request and we'll share a clear quote, usually within a day."],
  ["What does the school need to arrange?", "A computer lab or a room with a projector works best. For block coding and AI sessions, one device for every two students is enough. We can also run sessions without a lab."],
  ["Do you come to our school?", "Yes, we run workshops on campus and online. Tell us your city in the form and we'll confirm what works."],
  ["Is it only for students who already code?", "No. Every workshop starts from zero and is pitched for the class level, so complete beginners can follow along."],
  ["Can a workshop fit inside the school timetable?", "Yes. Single workshops fit into two or three periods, and coding clubs can run in a weekly activity slot."],
];

const STICKERS = [
  ["🚀", "6%", "30%"],
  ["⭐", "4%", "46%"],
  ["🤖", "78%", "88%"],
  ["🎮", "62%", "4%"],
  ["🧩", "88%", "40%"],
  ["💡", "30%", "92%"],
];

const CLASSES = ["6", "7", "8", "9", "10", "11", "12"];
const MODES = ["On campus", "Online", "Not sure yet"];
const EMPTY = { school: "", city: "", name: "", role: "", phone: "", email: "", classes: [], students: "", topic: "", mode: MODES[0], when: "", message: "", website: "" };
const GAME_SECONDS = 20;

const byId = Object.fromEntries(WORKSHOPS.map((w) => [w[0], w]));
const scrollToForm = () => document.getElementById("book-workshop")?.scrollIntoView({ behavior: "smooth", block: "start" });
const tint = (c) => ({ "--c": c });

/** Loads the rounded display font for this page only. */
function useJuniorFont() {
  useEffect(() => {
    const id = "jr-font";
    if (document.getElementById(id)) return;
    const l = document.createElement("link");
    l.id = id;
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&display=swap";
    document.head.appendChild(l);
  }, []);
}

function Stars({ n, of = 3 }) {
  return (
    <span className="jr-stars" aria-label={`${n} of ${of} stars`}>
      {Array.from({ length: of }, (_, i) => (
        <span key={i} className={i < n ? "on" : ""}>
          ★
        </span>
      ))}
    </span>
  );
}

/** Hero card: choose a level (class band) to see the workshops "unlocked" for it. */
function LevelPicker() {
  const [active, setActive] = useState(0);
  const [emoji, level, label, headline, text, ids, stars, color] = LEVELS[active];
  return (
    <div className="jr-game-card" style={tint(color)}>
      <div className="jr-game-top">
        <span>🕹️ Choose your level</span>
        <Stars n={stars} />
      </div>
      <div className="jr-levels" role="tablist">
        {LEVELS.map(([e, l, cls, , , , , c], i) => (
          <button key={l} type="button" role="tab" aria-selected={i === active} className={i === active ? "on" : ""} style={tint(c)} onClick={() => setActive(i)}>
            <span className="e">{e}</span>
            <b>{l}</b>
            <small>{cls.replace("Classes ", "Class ")}</small>
          </button>
        ))}
      </div>
      <div className="jr-quest sw" key={active}>
        <small>
          {emoji} {level} · {label}
        </small>
        <h3>{headline}</h3>
        <p>{text}</p>
        <div className="jr-xp" aria-hidden="true">
          <i style={{ width: `${(stars / 3) * 100}%` }} />
        </div>
        <ul>
          {ids.map((id) => {
            const [, e, c, title] = byId[id];
            return (
              <li key={id} style={tint(c)}>
                <span className="e">{e}</span>
                {title}
                <span className="unlock">Unlocked</span>
              </li>
            );
          })}
        </ul>
      </div>
      <button type="button" className="jr-btn jr-wide" onClick={scrollToForm}>
        Book {level} for your school <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/** "Bug hunt": tap the bugs before they hide. A taste of the fun inside the workshops. */
function BugHunt() {
  const [phase, setPhase] = useState("ready"); // ready | play | over
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [time, setTime] = useState(GAME_SECONDS);
  const [bug, setBug] = useState(-1);
  const [pop, setPop] = useState(-1);
  const hopper = useRef(null);

  useEffect(() => {
    if (phase !== "play") return undefined;
    const tick = setInterval(() => setTime((t) => t - 1), 1000);
    const hop = () => {
      setBug((b) => {
        let n = Math.floor(Math.random() * 9);
        if (n === b) n = (n + 1) % 9;
        return n;
      });
      hopper.current = setTimeout(hop, 650 + Math.random() * 350);
    };
    hop();
    return () => {
      clearInterval(tick);
      clearTimeout(hopper.current);
    };
  }, [phase]);

  useEffect(() => {
    if (phase === "play" && time <= 0) {
      setPhase("over");
      setBug(-1);
      setBest((b) => Math.max(b, score));
    }
  }, [time, phase, score]);

  function start() {
    setScore(0);
    setTime(GAME_SECONDS);
    setPhase("play");
  }

  function whack(i) {
    if (phase !== "play" || i !== bug) return;
    setScore((s) => s + 1);
    setPop(i);
    setBug(-1);
    setTimeout(() => setPop(-1), 300);
  }

  return (
    <div className="jr-bughunt">
      <div className="jr-bh-info">
        <span className="jr-sticker-badge" style={tint(C.green)}>
          🐞 Mini game
        </span>
        <h2>Bug hunt!</h2>
        <p>Programmers spend their day squashing bugs. How many can you catch in {GAME_SECONDS} seconds? Tap a bug when it pops up.</p>
        <div className="jr-bh-stats">
          <div>
            <b>{score}</b>
            <span>bugs caught</span>
          </div>
          <div>
            <b>{phase === "play" ? time : GAME_SECONDS}s</b>
            <span>time left</span>
          </div>
          <div>
            <b>{best}</b>
            <span>best score</span>
          </div>
        </div>
        {phase === "over" && (
          <p className="jr-bh-result" role="status">
            {score >= 15 ? "🏆 Bug-hunting legend!" : score >= 8 ? "🎉 Great reflexes, junior developer!" : "😄 Nice try! Have another go."} You caught {score} bug{score === 1 ? "" : "s"}.
          </p>
        )}
        <div className="row">
          {phase !== "play" && (
            <button type="button" className="jr-btn" style={tint(C.green)} onClick={start}>
              {phase === "over" ? "Play again" : "Start the game"} ▶
            </button>
          )}
          {phase === "over" && (
            <button type="button" className="jr-btn ghost" onClick={scrollToForm}>
              Bring the fun to your school
            </button>
          )}
        </div>
      </div>
      <div className="jr-bh-board" aria-label="Bug hunt board">
        {Array.from({ length: 9 }, (_, i) => (
          <button
            key={i}
            type="button"
            className={`jr-hole${bug === i ? " up" : ""}${pop === i ? " pop" : ""}`}
            onClick={() => whack(i)}
            aria-label={bug === i ? "Bug! Tap it" : "Empty"}
            disabled={phase !== "play"}
          >
            <span className="bug">🐞</span>
            <span className="boom">+1</span>
          </button>
        ))}
        {phase === "ready" && (
          <button type="button" className="jr-bh-overlay" onClick={start}>
            <span>▶</span>
            Tap to play
          </button>
        )}
      </div>
    </div>
  );
}

/** Booking form for schools. Requests land in the admin Inbox as "School". */
function BookingForm() {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [state, setState] = useState({ busy: false, done: false, err: "" });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const toggleClass = (c) => setForm((f) => ({ ...f, classes: f.classes.includes(c) ? f.classes.filter((x) => x !== c) : [...f.classes, c].sort((a, b) => a - b) }));

  async function send(e) {
    e.preventDefault();
    const next = {};
    if (!form.school.trim()) next.school = "Enter the school name.";
    if (!form.name.trim()) next.name = "Enter a contact person.";
    if (!form.phone.trim() && !form.email.trim()) next.phone = "Add a phone number or an email.";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = "Enter a valid email or leave it empty.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setState({ busy: true, done: false, err: "" });
    try {
      await call("/api/leads", {
        method: "POST",
        body: {
          kind: "school",
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          website: form.website,
          data: {
            school: form.school.trim(),
            city: form.city.trim(),
            role: form.role.trim(),
            classes: form.classes.length ? form.classes.join(", ") : "Not specified",
            students: form.students,
            topic: form.topic || "Not sure yet",
            mode: form.mode,
            when: form.when.trim(),
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
    const wa = buildAdminWaLink(`Hi Anobyt! I just requested an Anobyt Junior workshop for ${form.school}. Contact: ${form.name}, ${form.phone || form.email}.`);
    return (
      <div className="jr-form jr-done">
        <div className="jr-confetti" aria-hidden="true">
          🎉
        </div>
        <h3>Request received!</h3>
        <p>Thanks, {form.name.split(" ")[0]}. We'll call you within a day to plan the workshop for {form.school}.</p>
        <div className="row" style={{ justifyContent: "center" }}>
          <a className="jr-btn" style={tint(C.green)} href={wa} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon className="h-4 w-4" /> Also ping us on WhatsApp
          </a>
          <button
            type="button"
            className="jr-btn ghost"
            onClick={() => {
              setForm(EMPTY);
              setState({ busy: false, done: false, err: "" });
            }}
          >
            Send another request
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="jr-form" onSubmit={send} noValidate>
      <div className="jr-ticket">🎟️</div>
      <h3>Book your school's tech adventure</h3>
      <p className="note" style={{ marginTop: 0 }}>Takes a minute. No payment needed to enquire.</p>
      <div className="two">
        <Field id="j-school" label="School name" error={errors.school}>
          <input id="j-school" className={`inp${errors.school ? " err" : ""}`} value={form.school} onChange={set("school")} maxLength={200} placeholder="e.g. Delhi Public School" />
        </Field>
        <Field id="j-city" label="City">
          <input id="j-city" className="inp" value={form.city} onChange={set("city")} maxLength={100} placeholder="e.g. Prayagraj" />
        </Field>
      </div>
      <div className="two">
        <Field id="j-name" label="Your name" error={errors.name}>
          <input id="j-name" className={`inp${errors.name ? " err" : ""}`} value={form.name} onChange={set("name")} maxLength={120} autoComplete="name" />
        </Field>
        <Field id="j-role" label="Your role">
          <input id="j-role" className="inp" value={form.role} onChange={set("role")} maxLength={100} placeholder="Principal, teacher, coordinator…" />
        </Field>
      </div>
      <div className="two">
        <Field id="j-phone" label="Phone" error={errors.phone}>
          <input id="j-phone" className={`inp${errors.phone ? " err" : ""}`} type="tel" value={form.phone} onChange={set("phone")} maxLength={20} autoComplete="tel" placeholder="70xxxxxxxx" />
        </Field>
        <Field id="j-email" label="Email" error={errors.email}>
          <input id="j-email" className={`inp${errors.email ? " err" : ""}`} type="email" value={form.email} onChange={set("email")} maxLength={200} autoComplete="email" placeholder="Optional" />
        </Field>
      </div>

      <span className="l">Classes</span>
      <div className="jr-classes" role="group" aria-label="Classes">
        {CLASSES.map((c, i) => (
          <button
            key={c}
            type="button"
            aria-pressed={form.classes.includes(c)}
            className={form.classes.includes(c) ? "on" : ""}
            style={tint(Object.values(C)[i])}
            onClick={() => toggleClass(c)}
          >
            {form.classes.includes(c) && <Check className="h-3.5 w-3.5" />} Class {c}
          </button>
        ))}
      </div>

      <div className="two">
        <Field id="j-topic" label="Workshop topic">
          <select id="j-topic" className="inp" value={form.topic} onChange={set("topic")}>
            <option value="">Not sure yet, suggest one</option>
            {WORKSHOPS.map(([id, e, , title]) => (
              <option key={id} value={title}>
                {e} {title}
              </option>
            ))}
          </select>
        </Field>
        <Field id="j-students" label="Approx. students">
          <input id="j-students" className="inp" type="number" min="1" max="10000" value={form.students} onChange={set("students")} placeholder="e.g. 120" />
        </Field>
      </div>
      <div className="two">
        <Field id="j-mode" label="Where">
          <select id="j-mode" className="inp" value={form.mode} onChange={set("mode")}>
            {MODES.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </Field>
        <Field id="j-when" label="Preferred month or dates">
          <input id="j-when" className="inp" value={form.when} onChange={set("when")} maxLength={100} placeholder="e.g. December, after exams" />
        </Field>
      </div>
      <Field id="j-msg" label="Anything else?">
        <textarea id="j-msg" className="inp" rows={3} value={form.message} onChange={set("message")} maxLength={1000} placeholder="Lab setup, event plans, questions…" />
      </Field>
      <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website} onChange={set("website")} />
      {state.err && <p className="note bad">{state.err}</p>}
      <button className="jr-btn jr-wide" style={{ marginTop: 18, ...tint(C.orange) }} disabled={state.busy}>
        {state.busy ? "Sending…" : "Request a workshop 🚀"}
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

function SecHead({ sticker, color, eyebrow, title, children }) {
  return (
    <div className="jr-head">
      <span className="jr-sticker-badge" style={tint(color)}>
        {sticker} {eyebrow}
      </span>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </div>
  );
}

/** Anobyt Junior: coding, AI and tech workshops for schools, classes 6 to 12. */
export default function Junior() {
  usePageSEO({
    title: "Anobyt Junior | Coding & AI Workshops for Schools (Classes 6 to 12)",
    description:
      "Anobyt Junior runs fun, hands-on coding, AI, game design, web design and cyber safety workshops for schools, for classes 6 to 12. On campus or online, with certificates for every student. Book a workshop.",
    path: "/junior",
  });
  useJuniorFont();
  const wa = buildAdminWaLink("Hi Anobyt! I'd like to know about Anobyt Junior workshops for our school.");
  const strip = ["print(\"Hello, school!\") 👋", "🧱 Block coding", "if score > 10: 🎉", "🌐 My first website", "🤖 AI basics", "🛡️ Cyber safety", "for i in range(5): ⭐", "🎮 Game design", "🧩 Logic puzzles", "🎓 Career talks"];

  return (
    <div className="jr">
      <section className="jr-hero">
        <div className="jr-stickers" aria-hidden="true">
          {STICKERS.map(([e, top, left], i) => (
            <span key={i} style={{ top, left, animationDelay: `${i * 0.6}s` }}>
              {e}
            </span>
          ))}
        </div>
        <div className="wrap jr-hero-grid">
          <div>
            <span className="jr-sticker-badge rise" style={tint(C.orange)}>
              ✨ Anobyt Junior · For schools
            </span>
            <h1 className="rise">
              Tech workshops that make kids <span className="jr-pop">want</span> to <span className="jr-squiggle">build!</span>
            </h1>
            <p className="lead rise" style={{ animationDelay: ".12s" }}>
              Games, robots, websites and AI for classes 6 to 12. Hands-on workshops in your school or online, where every student builds something of their own and leaves wanting more.
            </p>
            <div className="row rise" style={{ animationDelay: ".24s" }}>
              <button type="button" className="jr-btn" style={tint(C.orange)} onClick={scrollToForm}>
                Book a workshop 🎟️
              </button>
              <a className="jr-btn ghost" href={wa} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className="h-4 w-4" /> Talk to us on WhatsApp
              </a>
            </div>
            <div className="jr-chips rise" style={{ animationDelay: ".36s" }}>
              <span style={tint(C.green)}>👶 No coding experience needed</span>
              <span style={tint(C.blue)}>🧪 {WORKSHOPS.length} workshop topics</span>
              <span style={tint(C.pink)}>🏅 Certificate for every student</span>
            </div>
          </div>
          <LevelPicker />
        </div>
        <div className="jr-strip" aria-hidden="true">
          <div>
            {strip.concat(strip).map((t, i) => (
              <span key={i} style={tint(Object.values(C)[i % 8])}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="jr-sec">
        <div className="wrap">
          <div className="jr-split-head">
            <SecHead sticker="🧪" color={C.pink} eyebrow="Workshops" title="Pick a topic, we make it fun for every class">
              Every workshop is hands-on and starts from zero. We tune the depth and examples to the class level.
            </SecHead>
            <button type="button" className="jr-btn ghost" onClick={scrollToForm}>
              Request a topic
            </button>
          </div>
          <div className="jr-grid">
            {WORKSHOPS.map(([id, e, c, title, classes, text]) => (
              <div key={id} className="jr-card" style={tint(c)}>
                <span className="e">{e}</span>
                <span className="pill">{classes}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="jr-sec jr-sec-play">
        <div className="wrap">
          <BugHunt />
        </div>
      </section>

      <section className="jr-sec">
        <div className="wrap">
          <SecHead sticker="🗺️" color={C.blue} eyebrow="Formats" title="Level up from one afternoon to a whole term">
            Start with a single workshop and grow it into a club when students ask for more.
          </SecHead>
          <div className="jr-formats">
            {FORMATS.map(([e, title, time, text, lvl, c]) => (
              <div key={title} className={`jr-format${lvl === 2 ? " best" : ""}`} style={tint(c)}>
                {lvl === 2 && <span className="jr-ribbon">⭐ Most popular</span>}
                <div className="jr-format-top">
                  <span className="e">{e}</span>
                  <span className="lvl">
                    Level {lvl} <Stars n={lvl} />
                  </span>
                </div>
                <h3>{title}</h3>
                <b>{time}</b>
                <p>{text}</p>
              </div>
            ))}
          </div>
          <div className="jr-chips" style={{ marginTop: 22 }}>
            <span style={tint(C.green)}>🏫 On campus in your lab or classroom</span>
            <span style={tint(C.blue)}>💻 Online, live and interactive</span>
            <span style={tint(C.purple)}>👥 One section or the whole school</span>
          </div>
        </div>
      </section>

      <section className="jr-sec jr-sec-tint">
        <div className="wrap jr-why">
          <div>
            <SecHead sticker="🎒" color={C.yellow} eyebrow="Why schools choose us" title="More than a guest lecture">
              Students learn by making things, and your school gets material to build on after we leave.
            </SecHead>
            <ul className="jr-ticks">
              <li>✅ Supports the coding and computational thinking focus of NEP 2020</li>
              <li>✅ Trainers from the team behind Anobyt's college coding platform</li>
              <li>✅ Clear quote up front, no hidden costs</li>
            </ul>
          </div>
          <div className="jr-gets">
            {GETS.map(([e, title, text, c], i) => (
              <div key={title} className="jr-get" style={{ ...tint(c), "--r": `${i % 2 ? 1.2 : -1.2}deg` }}>
                <span className="e">{e}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="jr-sec">
        <div className="wrap">
          <SecHead sticker="🧭" color={C.teal} eyebrow="How it works" title="Your school's journey in four steps" />
          <ol className="jr-map">
            {STEPS.map(([e, t, x], i) => (
              <li key={t} style={tint(Object.values(C)[(i * 2 + 1) % 8])}>
                <span className="e">{e}</span>
                <small>Step {i + 1}</small>
                <h3>{t}</h3>
                <p>{x}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="jr-sec jr-sec-tint" id="book-workshop">
        <div className="wrap jr-book">
          <div>
            <SecHead sticker="🎟️" color={C.orange} eyebrow="Book a workshop" title="Bring Anobyt Junior to your school">
              Share a few details and we'll call you within a day with a plan and a quote.
            </SecHead>
            <div className="jr-ways">
              <a className="jr-way" style={tint(C.green)} href={wa} target="_blank" rel="noopener noreferrer">
                <span className="e">💬</span>
                <span>
                  <b>Chat on WhatsApp</b>
                  <small>The fastest way to reach us</small>
                </span>
              </a>
              <a className="jr-way" style={tint(C.blue)} href="mailto:anobyt@anobyt.in?subject=Anobyt%20Junior%20workshop">
                <span className="e">✉️</span>
                <span>
                  <b>Email us</b>
                  <small>anobyt@anobyt.in</small>
                </span>
              </a>
              <div className="jr-tip">💡 Not sure what to pick? Choose "Not sure yet" and we'll suggest a workshop for your classes.</div>
            </div>
          </div>
          <BookingForm />
        </div>
      </section>

      <section className="jr-sec">
        <div className="wrap">
          <SecHead sticker="❓" color={C.purple} eyebrow="FAQ" title="Questions schools ask us" />
          <div className="jr-faq">
            {FAQ.map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="jr-sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="jr-cta">
            <div className="jr-cta-stickers" aria-hidden="true">
              <span>🚀</span>
              <span>⭐</span>
              <span>🎮</span>
              <span>🤖</span>
            </div>
            <h2>Give your students their first taste of tech</h2>
            <p>One workshop is often all it takes to spark an interest that lasts a lifetime.</p>
            <div className="row" style={{ justifyContent: "center" }}>
              <button type="button" className="jr-btn light" onClick={scrollToForm}>
                Book a workshop 🎟️
              </button>
              <Link className="jr-btn outline-light" to="/about#contact">
                Contact us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
