import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, MapPin, Mic, PlayCircle, Search, Users } from "lucide-react";
import { Head, Cards, CTA, Page } from "../components/ui";
import WhatsAppIcon from "../components/WhatsAppIcon";
import { isPast, useCollection } from "../lib/contentApi";
import { EVENT_CATEGORIES, EVENT_MODES } from "../lib/content/defaults";
import { fmtDay, fmtWhen } from "../lib/eventFormat";
import { buildAdminWaLink } from "../lib/whatsapp";
import { usePageSEO } from "../lib/seo";

const byStart = (a, b) => (a.start || "9999").localeCompare(b.start || "9999");

function EventCard({ e }) {
  const day = fmtDay(e.start);
  const past = isPast(e);
  return (
    <Link to={`/talks/${e.id}`} className={`ecard ${past ? "past" : ""}`}>
      {e.cover && <div className="ecover" style={{ backgroundImage: `url("${e.cover}")` }} />}
      <div className="ebody">
        <div className="edate">
          {day ? (
            <>
              <b>{day.day}</b>
              <span>{day.month}</span>
            </>
          ) : (
            <span>TBA</span>
          )}
        </div>
        <div className="emain">
          <div className="row" style={{ gap: 6 }}>
            <span className="tag">{EVENT_CATEGORIES[e.category]}</span>
            {e.featured && !past && <span className="tag t-olympiad">Featured</span>}
            {past && e.recordingUrl && <span className="tag free">Recording</span>}
          </div>
          <h3>{e.title}</h3>
          <p>{e.summary}</p>
          <div className="einfo">
            <span>
              <CalendarDays className="h-4 w-4" /> {fmtWhen(e)}
            </span>
            <span>
              <MapPin className="h-4 w-4" /> {EVENT_MODES[e.mode]}
              {e.venue && e.mode !== "online" ? ` · ${e.venue}` : ""}
            </span>
            {e.speakers.length > 0 && (
              <span>
                <Mic className="h-4 w-4" /> {e.speakers.map((s) => s.name).join(", ")}
              </span>
            )}
          </div>
        </div>
        <div className="eside">
          {!past && e.spotsLeft !== null && e.spotsLeft !== undefined && (
            <small className={e.spotsLeft === 0 ? "bad" : ""}>{e.spotsLeft === 0 ? "Full" : `${e.spotsLeft} spots left`}</small>
          )}
          <b>{past ? (e.recordingUrl ? "Watch →" : "Details →") : e.registration === "none" ? "Details →" : "Register →"}</b>
        </div>
      </div>
    </Link>
  );
}

export default function Talks() {
  usePageSEO({
    title: "Tech talks and events",
    description: "Upcoming tech talks, workshops, webinars and mock interview drives from Anobyt mentors, online and on campus.",
    path: "/talks",
  });
  const { items, loaded } = useCollection("events");
  const [cat, setCat] = useState("all");
  const [mode, setMode] = useState("all");
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("upcoming");

  const { upcoming, past, featured } = useMemo(() => {
    const up = items.filter((e) => !isPast(e)).sort(byStart);
    const pa = items.filter(isPast).sort((a, b) => byStart(b, a));
    return { upcoming: up, past: pa, featured: up.find((e) => e.featured) || up[0] };
  }, [items]);

  const usedCats = [...new Set(items.map((e) => e.category))];
  const needle = q.trim().toLowerCase();
  const shown = (tab === "upcoming" ? upcoming : past).filter(
    (e) =>
      (cat === "all" || e.category === cat) &&
      (mode === "all" || e.mode === mode) &&
      (!needle || [e.title, e.summary, ...e.tags, ...e.speakers.map((s) => s.name)].join(" ").toLowerCase().includes(needle)),
  );
  const wa = buildAdminWaLink("Hi Anobyt! Please add me to updates about upcoming tech talks and events.");

  return (
    <>
      <section className="hero mhero">
        <div className="wrap grid">
          <div>
            <span className="eyebrow rise">Tech talks and events</span>
            <h1 className="rise">
              Learn from the <em>industry</em>, live.
            </h1>
            <p className="lead rise" style={{ animationDelay: ".12s" }}>
              Talks, workshops, webinars and mock interview drives with working professionals. Join online, or bring one to your campus.
            </p>
            <div className="row rise" style={{ animationDelay: ".24s" }}>
              <a className="btn" href="#events">
                See events
              </a>
              <Link className="btn ghost" to="/colleges">
                Host one at your college
              </Link>
            </div>
          </div>
          {featured ? (
            <Link to={`/talks/${featured.id}`} className="feature-ev pipe">
              <span className="eyebrow">Next up</span>
              <h3>{featured.title}</h3>
              <p>{featured.summary}</p>
              <div className="einfo">
                <span>
                  <CalendarDays className="h-4 w-4" /> {fmtWhen(featured)}
                </span>
                <span>
                  <MapPin className="h-4 w-4" /> {EVENT_MODES[featured.mode]}
                </span>
                {featured.registered > 0 && (
                  <span>
                    <Users className="h-4 w-4" /> {featured.registered} registered
                  </span>
                )}
              </div>
              <span className="btn" style={{ marginTop: 18 }}>
                {featured.registration === "none" ? "View details" : "Reserve your seat"}
              </span>
            </Link>
          ) : (
            <div className="feature-ev pipe">
              <span className="eyebrow">Stay in the loop</span>
              <h3>New events are announced on WhatsApp</h3>
              <p>Get a message when registrations open for the next talk or workshop.</p>
              <a className="btn" href={wa} target="_blank" rel="noopener noreferrer" style={{ marginTop: 18 }}>
                <WhatsAppIcon className="h-4 w-4" /> Notify me
              </a>
            </div>
          )}
        </div>
      </section>

      <Page>
        <div id="events" className="ev-toolbar">
          <div className="seg" role="tablist" style={{ marginBottom: 0 }}>
            <button type="button" className={tab === "upcoming" ? "on" : ""} onClick={() => setTab("upcoming")}>
              Upcoming ({upcoming.length})
            </button>
            <button type="button" className={tab === "past" ? "on" : ""} onClick={() => setTab("past")}>
              <PlayCircle className="h-4 w-4" /> Past ({past.length})
            </button>
          </div>
          <label className="search">
            <Search className="h-4 w-4" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search events, topics, speakers" aria-label="Search events" />
          </label>
          <select className="inp" value={mode} onChange={(e) => setMode(e.target.value)} aria-label="Mode" style={{ width: "auto" }}>
            <option value="all">Any mode</option>
            {Object.entries(EVENT_MODES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        {usedCats.length > 1 && (
          <div className="chips" style={{ marginTop: 14 }}>
            <button type="button" className={`chip ${cat === "all" ? "on" : ""}`} onClick={() => setCat("all")}>
              All
            </button>
            {usedCats.map((c) => (
              <button key={c} type="button" className={`chip ${cat === c ? "on" : ""}`} onClick={() => setCat(c)}>
                {EVENT_CATEGORIES[c]}
              </button>
            ))}
          </div>
        )}

        <div className="elist">
          {shown.map((e) => (
            <EventCard key={e.id} e={e} />
          ))}
        </div>
        {loaded && !shown.length && (
          <div className="empty" style={{ marginTop: 20 }}>
            <b>{tab === "upcoming" ? "No upcoming events match" : "No past events yet"}</b>
            <span>
              {tab === "upcoming" ? "New events are announced on WhatsApp. " : ""}
              <a href={wa} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-accent)" }}>
                Get notified
              </a>
            </span>
          </div>
        )}

        <div className="sec-gap" />
        <Head eyebrow="For colleges and companies" title="Bring a session to your campus">
          Industry mentors on your campus, online or in person. Pick a format and we plan the rest with your placement cell.
        </Head>
        <Cards
          items={[
            ["🎤", "Tech talk", "An industry mentor presents a technical topic, followed by a student Q&A."],
            ["🧑‍💻", "Mock interview drive", "Run a full batch through 1:1 mock interviews with feedback for every student."],
            ["🏢", "Company-prep class", "A focused class on one company's hiring rounds, topics and tips."],
            ["⚡", "Bootcamp", "A multi-day program on DSA, projects or interview skills."],
            ["🎙️", "Podcast and fireside chat", "A conversation with working professionals about careers and placements."],
            ["🌟", "Career and motivation talk", "A speaker session to help students plan their next two years."],
          ]}
        />
        <Head eyebrow="How it works" title="How we run a campus session" style={{ margin: "72px 0 40px" }} />
        <div className="steps">
          <div>
            <h3>Share your goals</h3>
            <p>Tell us the batch size, year and what students need.</p>
          </div>
          <div>
            <h3>Choose a format</h3>
            <p>We suggest the session type and matching mentors.</p>
          </div>
          <div>
            <h3>Schedule</h3>
            <p>We fix the date, mode and logistics with your placement cell.</p>
          </div>
          <div>
            <h3>Run and follow up</h3>
            <p>We deliver the session and share feedback for students.</p>
          </div>
        </div>
      </Page>
      <CTA title="Plan a session for your campus" text="Tell us your batch size and goals, and we will suggest a format." />
    </>
  );
}
