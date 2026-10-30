import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ClipboardCheck, Code2, Mail, MessageCircle, Users } from "lucide-react";
import { Head, Page } from "../components/ui";
import { call } from "../lib/testsApi";
import { useSettings } from "../lib/contentApi";
import { buildAdminWaLink } from "../lib/whatsapp";
import { usePageSEO } from "../lib/seo";

const OFFER = [
  [Code2, "Coding practice by year", "Problems for 1st to 4th year with an editor that runs and checks your code. Every year starts with free problems.", "/problems"],
  [BookOpen, "Learning modules", "Structured courses you can start for free and continue when you are ready.", "/courses"],
  [ClipboardCheck, "Tests and assessments", "MCQ, coding and Olympiad-style tests with instant scores.", "/practice"],
  [Users, "Mock interviews and mentorship", "1:1 sessions with working professionals, matched to your domain.", "/book"],
];

const VALUES = [
  ["Clear about what's free", "Free content is marked FREE, paid content is marked PREMIUM, and prices are shown before you pay."],
  ["Practice over theory", "You learn to code by writing code, so every problem checks your solution straight away."],
  ["Built for Indian campuses", "Year-wise practice that follows the B.Tech syllabus and the way campus placements actually run."],
];

const EMPTY = { name: "", email: "", phone: "", message: "", website: "" };

/** About Anobyt, plus a contact form that lands in the admin Inbox. */
export default function About() {
  usePageSEO({
    title: "About Anobyt and contact us",
    description: "Anobyt helps college students prepare for placements with year-wise coding practice, courses, tests and mock interviews. Contact the Anobyt team.",
    path: "/about",
  });
  const settings = useSettings();
  const email = settings.contactEmail || "anobyt@anobyt.in";
  const [form, setForm] = useState(EMPTY);
  const [state, setState] = useState({ busy: false, done: false, err: "" });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function send(e) {
    e.preventDefault();
    if (!form.name.trim() || (!form.email.trim() && !form.phone.trim()) || !form.message.trim()) {
      setState({ busy: false, done: false, err: "Add your name, an email or phone number, and a message." });
      return;
    }
    setState({ busy: true, done: false, err: "" });
    try {
      await call("/api/leads", {
        method: "POST",
        body: { kind: "contact", name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), website: form.website, data: { message: form.message.trim() } },
      });
      setForm(EMPTY);
      setState({ busy: false, done: true, err: "" });
    } catch (x) {
      setState({ busy: false, done: false, err: x.message || "Couldn't send. Please email us instead." });
    }
  }

  return (
    <Page>
      <Head eyebrow="About us" title="Helping students get placement-ready, one year at a time">
        Anobyt is a placement-preparation platform for college students. We combine year-wise coding practice, learning modules and tests with 1:1 mock interviews, so you always know what to work on next.
      </Head>

      <div className="about-grid">
        {OFFER.map(([Icon, t, x, to]) => (
          <Link key={t} to={to} className="plat-card">
            <span className="ic">
              <Icon className="h-5 w-5" />
            </span>
            <span>
              <b>{t}</b>
              <span>{x}</span>
            </span>
          </Link>
        ))}
      </div>

      <h2 className="about-h">What we stand for</h2>
      <div className="about-values">
        {VALUES.map(([t, x]) => (
          <div key={t} className="panel">
            <h3>{t}</h3>
            <p>{x}</p>
          </div>
        ))}
      </div>

      <h2 className="about-h" id="contact">
        Contact us
      </h2>
      <div className="about-contact">
        <div className="about-ways">
          <a className="fbox" href={buildAdminWaLink("Hi Anobyt! I have a question.")} target="_blank" rel="noopener noreferrer">
            <b>
              <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
            </b>
            <span>The fastest way to reach us</span>
          </a>
          <a className="fbox" href={`mailto:${email}`}>
            <b>
              <Mail className="h-4 w-4" /> Email us
            </b>
            <span>{email}</span>
          </a>
          <Link className="fbox" to="/colleges">
            <b>For colleges and TPOs</b>
            <span>Onboard a whole batch</span>
          </Link>
          <p className="note">
            Common questions are answered in the <Link to="/faq" className="linkish">FAQ</Link>.
          </p>
        </div>
        <form className="panel" onSubmit={send}>
          <h3 style={{ fontSize: 20, marginBottom: 6 }}>Send us a message</h3>
          <p className="note" style={{ marginTop: 0 }}>We usually reply within a day.</p>
          <label className="l" htmlFor="c-name">Name</label>
          <input id="c-name" className="inp" value={form.name} onChange={set("name")} autoComplete="name" />
          <div className="two">
            <div>
              <label className="l" htmlFor="c-email">Email</label>
              <input id="c-email" className="inp" type="email" value={form.email} onChange={set("email")} autoComplete="email" />
            </div>
            <div>
              <label className="l" htmlFor="c-phone">Phone (optional)</label>
              <input id="c-phone" className="inp" type="tel" value={form.phone} onChange={set("phone")} autoComplete="tel" />
            </div>
          </div>
          <label className="l" htmlFor="c-msg">Message</label>
          <textarea id="c-msg" className="inp" rows={5} value={form.message} onChange={set("message")} />
          <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website} onChange={set("website")} />
          {state.err && <p className="note bad">{state.err}</p>}
          {state.done && <p className="note ok">Thanks! Your message reached us. We'll get back to you soon.</p>}
          <button className="btn" style={{ marginTop: 12 }} disabled={state.busy}>
            {state.busy ? "Sending…" : "Send message"}
          </button>
        </form>
      </div>
    </Page>
  );
}
