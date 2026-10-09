import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, CalendarPlus, CheckCircle2, ExternalLink, MapPin, PlayCircle, Share2, Ticket, Users } from "lucide-react";
import { Head, Page } from "../components/ui";
import RichText from "../components/RichText";
import { eventDate, getContent, isPast, registerForEvent } from "../lib/contentApi";
import { EVENT_CATEGORIES, EVENT_MODES } from "../lib/content/defaults";
import { calendarLink, countdown, fmtWhen } from "../lib/eventFormat";
import { usePageSEO } from "../lib/seo";

const initials = (n) =>
  n
    .split(/\s+/)
    .map((x) => x[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

function Register({ e, onDone }) {
  const [f, setF] = useState({ name: "", email: "", phone: "", college: "", year: "", website: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (ev) => setF((x) => ({ ...x, [k]: ev.target.value }));

  async function submit(ev) {
    ev.preventDefault();
    setBusy(true);
    setErr("");
    try {
      onDone(await registerForEvent(e.id, f));
    } catch (x) {
      setErr(x.message);
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="regform">
      <input className="inp" required placeholder="Full name" value={f.name} onChange={set("name")} aria-label="Full name" />
      <input className="inp" required type="email" placeholder="Email" value={f.email} onChange={set("email")} aria-label="Email" />
      <input className="inp" placeholder="Phone (optional)" value={f.phone} onChange={set("phone")} aria-label="Phone" />
      <div className="two">
        <input className="inp" placeholder="College" value={f.college} onChange={set("college")} aria-label="College" />
        <input className="inp" placeholder="Year" value={f.year} onChange={set("year")} aria-label="Year" />
      </div>
      {/* Hidden from people; bots fill it in and get ignored. */}
      <input className="hp" tabIndex={-1} autoComplete="off" value={f.website} onChange={set("website")} aria-hidden="true" />
      {err && <p className="note bad">{err}</p>}
      <button className="btn" style={{ width: "100%" }} disabled={busy}>
        <Ticket className="h-4 w-4" /> {busy ? "Registering…" : "Register for free"}
      </button>
    </form>
  );
}

export default function EventDetail() {
  const { id } = useParams();
  const [e, setE] = useState(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const [copied, setCopied] = useState(false);

  usePageSEO({
    title: e ? e.title : "Event",
    description: e?.summary || "Anobyt tech talk or event.",
    path: `/talks/${id}`,
  });

  useEffect(() => {
    let on = true;
    getContent("events", id).then(
      (x) => on && setE(x),
      (x) => on && setError(x.status === 404 ? "This event doesn't exist or isn't published yet." : x.message),
    );
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => {
      on = false;
      clearInterval(t);
    };
  }, [id]);

  if (error)
    return (
      <Page narrow={620}>
        <Head title="Event not found">{error}</Head>
        <Link className="btn" to="/talks">All events</Link>
      </Page>
    );
  if (!e) return <Page narrow={620}><p className="note">Loading…</p></Page>;

  const past = isPast(e);
  const start = eventDate(e.start);
  const left = start ? start.getTime() - now : 0;
  const full = e.spotsLeft === 0;

  function share() {
    const url = window.location.href;
    if (navigator.share) navigator.share({ title: e.title, url }).catch(() => {});
    else
      navigator.clipboard?.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      });
  }

  return (
    <Page>
      <Link to="/talks" className="linkish back">
        <ArrowLeft className="h-4 w-4" style={{ display: "inline", verticalAlign: -3 }} /> All events
      </Link>
      {e.cover && <div className="ev-cover" style={{ backgroundImage: `url("${e.cover}")` }} />}
      <div className="row" style={{ gap: 8 }}>
        <span className="tag">{EVENT_CATEGORIES[e.category]}</span>
        <span className="tag free">{EVENT_MODES[e.mode]}</span>
        {past && <span className="tag draft">Ended</span>}
      </div>
      <h1 className="ptitle">{e.title}</h1>
      {e.summary && <p className="lead-p">{e.summary}</p>}

      <div className="course-grid">
        <div>
          <div className="factrow">
            <div>
              <CalendarDays className="h-5 w-5" />
              <span>{fmtWhen(e)}</span>
            </div>
            <div>
              <MapPin className="h-5 w-5" />
              <span>{e.mode === "online" ? "Online" : e.venue || EVENT_MODES[e.mode]}</span>
            </div>
            {e.registration === "form" && (
              <div>
                <Users className="h-5 w-5" />
                <span>
                  {e.registered} registered{e.capacity ? ` of ${e.capacity}` : ""}
                </span>
              </div>
            )}
          </div>

          {e.description && (
            <section className="panel" style={{ marginTop: 18 }}>
              <h3 style={{ fontSize: 20, marginBottom: 8 }}>About this event</h3>
              <RichText text={e.description} />
            </section>
          )}

          {e.agenda.length > 0 && (
            <section className="panel" style={{ marginTop: 18 }}>
              <h3 style={{ fontSize: 20, marginBottom: 12 }}>Agenda</h3>
              <ol className="agenda">
                {e.agenda.map((a, i) => (
                  <li key={i}>
                    <span>{a.time}</span>
                    <b>{a.title}</b>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {e.speakers.length > 0 && (
            <section style={{ marginTop: 28 }}>
              <h3 style={{ fontSize: 20, marginBottom: 12 }}>{e.speakers.length > 1 ? "Speakers" : "Speaker"}</h3>
              <div className="speakers">
                {e.speakers.map((s) => (
                  <div className="speaker" key={s.name}>
                    {s.photo ? <img src={s.photo} alt="" /> : <span className="avatar">{initials(s.name)}</span>}
                    <div>
                      <b>{s.name}</b>
                      <small>{s.role}</small>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {e.tags.length > 0 && (
            <div className="row" style={{ gap: 8, marginTop: 22 }}>
              {e.tags.map((t) => (
                <span className="chip" key={t}>{t}</span>
              ))}
            </div>
          )}
        </div>

        <aside>
          <div className="panel ticket">
            {past ? (
              <>
                <h3>This event has ended</h3>
                {e.recordingUrl ? (
                  <a className="btn" href={e.recordingUrl} target="_blank" rel="noopener noreferrer" style={{ width: "100%", marginTop: 12 }}>
                    <PlayCircle className="h-4 w-4" /> Watch the recording
                  </a>
                ) : (
                  <p className="note">Check upcoming events for the next session.</p>
                )}
              </>
            ) : done ? (
              <>
                <div className="ic" style={{ color: "var(--color-accent-emerald)" }}>
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h3 style={{ marginTop: 12 }}>{done.already ? "You're already registered" : "You're registered!"}</h3>
                <p className="note">
                  {done.joinUrl ? "Save the joining link below." : "We'll share the joining details before the event."}
                </p>
                {done.joinUrl && (
                  <a className="btn" href={done.joinUrl} target="_blank" rel="noopener noreferrer" style={{ width: "100%", marginTop: 10 }}>
                    <ExternalLink className="h-4 w-4" /> Joining link
                  </a>
                )}
              </>
            ) : (
              <>
                {left > 0 && (
                  <div className="countdown">
                    <small>Starts in</small>
                    <b>{countdown(left)}</b>
                  </div>
                )}
                {e.priceLabel && <p className="note" style={{ marginTop: 0 }}>Entry: <b>{e.priceLabel}</b></p>}
                {e.registration === "form" &&
                  (full ? <p className="note bad">This event is full.</p> : <Register e={e} onDone={setDone} />)}
                {e.registration === "external" && e.registerUrl && (
                  <a className="btn" href={e.registerUrl} target="_blank" rel="noopener noreferrer" style={{ width: "100%" }}>
                    <Ticket className="h-4 w-4" /> Register
                  </a>
                )}
                {e.registration === "none" && <p className="note">No registration needed. Just join at the time above.</p>}
                {e.spotsLeft > 0 && e.spotsLeft <= 20 && <p className="note bad">Only {e.spotsLeft} spots left.</p>}
              </>
            )}
            <div className="ticket-actions">
              {!past && start && (
                <a className="linkish" href={calendarLink(e)} target="_blank" rel="noopener noreferrer">
                  <CalendarPlus className="h-4 w-4" style={{ display: "inline", verticalAlign: -3 }} /> Add to calendar
                </a>
              )}
              <button type="button" className="linkish" onClick={share}>
                <Share2 className="h-4 w-4" style={{ display: "inline", verticalAlign: -3 }} /> {copied ? "Link copied" : "Share"}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </Page>
  );
}
