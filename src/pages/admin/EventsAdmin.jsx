import { useCallback, useState } from "react";
import { Download, ExternalLink, Eye, EyeOff, Pencil, Plus, Star, Trash2, Users } from "lucide-react";
import { adminCreate, adminDelete, adminList, adminUpdate, isPast, listRegistrations } from "../../lib/contentApi";
import { EVENT_CATEGORIES, EVENT_MODES, SAMPLE_EVENTS } from "../../lib/content/defaults";
import { fmtWhen } from "../../lib/eventFormat";
import { Field, Gate, MoveButtons, SectionTop } from "./shared";
import { downloadCsv, fmtDate, move, useAdminData } from "./adminUtils";

const blankEvent = () => ({
  title: "",
  category: "tech-talk",
  mode: "online",
  start: "",
  end: "",
  venue: "",
  summary: "",
  description: "",
  cover: "",
  speakers: [{ name: "", role: "", photo: "" }],
  agenda: [],
  tags: [],
  priceLabel: "Free",
  capacity: 0,
  registration: "form",
  registerUrl: "",
  joinUrl: "",
  recordingUrl: "",
  featured: false,
  published: false,
});

export default function EventsAdmin() {
  const load = useCallback(() => adminList("events"), []);
  const state = useAdminData(load);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [err, setErr] = useState("");
  const items = [...(state.data || [])].sort((a, b) => (b.start || "").localeCompare(a.start || ""));

  async function act(fn) {
    setErr("");
    try {
      await fn();
      state.reload();
    } catch (e) {
      setErr(e.message);
    }
  }

  if (editing)
    return (
      <EventEditor
        initial={editing}
        onCancel={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          state.reload();
        }}
      />
    );
  if (viewing) return <Registrations ev={viewing} onBack={() => setViewing(null)} />;

  return (
    <div>
      <SectionTop title="Tech talks and events" text="Events on the Tech Talks page. Students register on the site; you see the list here.">
        <button type="button" className="btn ghost" onClick={() => act(() => Promise.all(SAMPLE_EVENTS.map((e) => adminCreate("events", { ...blankEvent(), ...e, published: false }))))}>
          Add sample drafts
        </button>
        <button type="button" className="btn" onClick={() => setEditing(blankEvent())}>
          <Plus className="h-4 w-4" /> New event
        </button>
      </SectionTop>
      {err && <p className="note bad">{err}</p>}
      <Gate state={state}>
        {!items.length && (
          <div className="empty">
            <b>No events yet</b>
            <span>Create one, or add sample drafts to see how an event page looks.</span>
          </div>
        )}
        <div className="tlist">
          {items.map((e) => (
            <div className="trow" key={e.id}>
              <div className="tinfo">
                <div className="row" style={{ gap: 8 }}>
                  <span className="tag">{EVENT_CATEGORIES[e.category]}</span>
                  <span className={`tag ${e.published ? "free" : "draft"}`}>{e.published ? "Published" : "Draft"}</span>
                  {isPast(e) && <span className="tag draft">Past</span>}
                  {e.featured && <span className="tag t-olympiad">Featured</span>}
                </div>
                <b>{e.title}</b>
                <small>
                  {fmtWhen(e)} · {EVENT_MODES[e.mode]}
                  {e.capacity ? ` · capacity ${e.capacity}` : ""}
                </small>
              </div>
              <div className="tact">
                <button type="button" className="ib" title="Edit" onClick={() => setEditing(e)}>
                  <Pencil className="h-4 w-4" />
                </button>
                <button type="button" className="ib" title={e.published ? "Unpublish" : "Publish"} onClick={() => act(() => adminUpdate("events", e.id, { ...e, published: !e.published }))}>
                  {e.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button type="button" className="ib" title={e.featured ? "Unfeature" : "Feature on the Tech Talks page"} onClick={() => act(() => adminUpdate("events", e.id, { ...e, featured: !e.featured }))}>
                  <Star className="h-4 w-4" fill={e.featured ? "currentColor" : "none"} />
                </button>
                {e.registration === "form" && (
                  <button type="button" className="ib" title="Registrations" onClick={() => setViewing(e)}>
                    <Users className="h-4 w-4" />
                  </button>
                )}
                <a className="ib" title="View on site" href={`/talks/${e.id}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button type="button" className="ib danger" title="Delete" onClick={() => confirm(`Delete "${e.title}" and its registrations?`) && act(() => adminDelete("events", e.id))}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Gate>
    </div>
  );
}

function EventEditor({ initial, onCancel, onSaved }) {
  const [e, setE] = useState({ ...blankEvent(), ...initial });
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (patch) => setE((x) => ({ ...x, ...patch }));
  const setRow = (key, i, patch) => set({ [key]: e[key].map((r, j) => (j === i ? { ...r, ...patch } : r)) });

  async function save(published) {
    if (!e.title.trim()) return setErr("Give the event a title.");
    if (published && !e.start) return setErr("Set a start date and time before publishing.");
    if (e.registration === "external" && !e.registerUrl) return setErr("Add the external registration link.");
    setErr("");
    setSaving(true);
    try {
      const body = { ...e, published };
      if (e.id) await adminUpdate("events", e.id, body);
      else await adminCreate("events", body);
      onSaved();
    } catch (x) {
      setErr(x.message);
      setSaving(false);
    }
  }

  return (
    <div className="editor">
      <div className="admin-top" style={{ marginTop: 8 }}>
        <div>
          <button type="button" className="linkish" onClick={onCancel}>
            ← All events
          </button>
          <h2 style={{ fontSize: 24, marginTop: 6 }}>{e.id ? "Edit event" : "New event"}</h2>
        </div>
      </div>

      <div className="panel">
        <Field label="Title">
          <input className="inp" value={e.title} onChange={(x) => set({ title: x.target.value })} />
        </Field>
        <div className="three">
          <Field label="Category">
            <select className="inp" value={e.category} onChange={(x) => set({ category: x.target.value })}>
              {Object.entries(EVENT_CATEGORIES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label="Starts">
            <input className="inp" type="datetime-local" value={e.start} onChange={(x) => set({ start: x.target.value })} />
          </Field>
          <Field label="Ends (optional)">
            <input className="inp" type="datetime-local" value={e.end} onChange={(x) => set({ end: x.target.value })} />
          </Field>
        </div>
        <div className="three">
          <Field label="Mode">
            <select className="inp" value={e.mode} onChange={(x) => set({ mode: x.target.value })}>
              {Object.entries(EVENT_MODES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label="Venue (for on campus / hybrid)">
            <input className="inp" value={e.venue} onChange={(x) => set({ venue: x.target.value })} placeholder="e.g. Seminar Hall, MNNIT" />
          </Field>
          <Field label="Entry">
            <input className="inp" value={e.priceLabel} onChange={(x) => set({ priceLabel: x.target.value })} placeholder="Free" />
          </Field>
        </div>
        <Field label="Short summary (shown on the event card)">
          <textarea className="inp" rows={2} value={e.summary} onChange={(x) => set({ summary: x.target.value })} />
        </Field>
        <Field label="Full description" hint='Blank line = new paragraph. "# " for a heading, "- " for a bullet.'>
          <textarea className="inp" rows={5} value={e.description} onChange={(x) => set({ description: x.target.value })} />
        </Field>
        <div className="two">
          <Field label="Cover image link (optional)">
            <input className="inp" value={e.cover} onChange={(x) => set({ cover: x.target.value })} placeholder="https://…" />
          </Field>
          <Field label="Tags (comma separated)">
            <input className="inp" value={e.tags.join(", ")} onChange={(x) => set({ tags: x.target.value.split(",").map((t) => t.trimStart()) })} />
          </Field>
        </div>
      </div>

      <div className="panel">
        <h3 style={{ fontSize: 19 }}>Registration</h3>
        <div className="three">
          <Field label="How students register">
            <select className="inp" value={e.registration} onChange={(x) => set({ registration: x.target.value })}>
              <option value="form">Form on this website</option>
              <option value="external">External link (Google Form, etc.)</option>
              <option value="none">No registration needed</option>
            </select>
          </Field>
          {e.registration === "form" && (
            <Field label="Capacity (0 = unlimited)">
              <input className="inp" type="number" min={0} value={e.capacity} onChange={(x) => set({ capacity: x.target.value })} />
            </Field>
          )}
          {e.registration === "external" && (
            <Field label="Registration link">
              <input className="inp" value={e.registerUrl} onChange={(x) => set({ registerUrl: x.target.value })} placeholder="https://forms.gle/…" />
            </Field>
          )}
          <Field label="Joining link (shown only after registering)">
            <input className="inp" value={e.joinUrl} onChange={(x) => set({ joinUrl: x.target.value })} placeholder="https://meet.google.com/…" />
          </Field>
        </div>
        <Field label="Recording link (for past events)">
          <input className="inp" value={e.recordingUrl} onChange={(x) => set({ recordingUrl: x.target.value })} placeholder="https://youtube.com/…" />
        </Field>
        <div className="checks inline" style={{ marginTop: 14 }}>
          <label>
            <input type="checkbox" checked={e.featured} onChange={(x) => set({ featured: x.target.checked })} /> Feature at the top of the Tech Talks page
          </label>
        </div>
      </div>

      <div className="panel">
        <h3 style={{ fontSize: 19 }}>Speakers</h3>
        {e.speakers.map((s, i) => (
          <div className="optrow" key={i} style={{ marginTop: 8 }}>
            <input className="inp" value={s.name} onChange={(x) => setRow("speakers", i, { name: x.target.value })} placeholder="Name" />
            <input className="inp" value={s.role} onChange={(x) => setRow("speakers", i, { role: x.target.value })} placeholder="Role, company" />
            <input className="inp" value={s.photo} onChange={(x) => setRow("speakers", i, { photo: x.target.value })} placeholder="Photo link (optional)" />
            <button type="button" className="ib danger" title="Remove" onClick={() => set({ speakers: e.speakers.filter((_, j) => j !== i) })}>
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button type="button" className="linkish" onClick={() => set({ speakers: [...e.speakers, { name: "", role: "", photo: "" }] })}>
          + Add speaker
        </button>

        <h3 style={{ fontSize: 19, marginTop: 22 }}>Agenda (optional)</h3>
        {e.agenda.map((a, i) => (
          <div className="optrow" key={i} style={{ marginTop: 8 }}>
            <input className="inp" style={{ width: 120 }} value={a.time} onChange={(x) => setRow("agenda", i, { time: x.target.value })} placeholder="6:00 PM" />
            <input className="inp" value={a.title} onChange={(x) => setRow("agenda", i, { title: x.target.value })} placeholder="What happens" />
            <MoveButtons i={i} count={e.agenda.length} onMove={(i, d) => set({ agenda: move(e.agenda, i, d) })} />
            <button type="button" className="ib danger" title="Remove" onClick={() => set({ agenda: e.agenda.filter((_, j) => j !== i) })}>
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button type="button" className="linkish" onClick={() => set({ agenda: [...e.agenda, { time: "", title: "" }] })}>
          + Add agenda item
        </button>
      </div>

      <div className="savebar">
        {err && <span className="bad">{err}</span>}
        <button type="button" className="btn ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="button" className="btn ghost" onClick={() => save(false)} disabled={saving}>
          Save as draft
        </button>
        <button type="button" className="btn" onClick={() => save(true)} disabled={saving}>
          {saving ? "Saving…" : "Save and publish"}
        </button>
      </div>
    </div>
  );
}

function Registrations({ ev, onBack }) {
  const load = useCallback(() => listRegistrations(ev.id), [ev.id]);
  const state = useAdminData(load);
  const regs = state.data || [];
  return (
    <div>
      <div className="admin-top" style={{ marginTop: 8 }}>
        <div>
          <button type="button" className="linkish" onClick={onBack}>
            ← All events
          </button>
          <h2 style={{ fontSize: 24, marginTop: 6 }}>Registrations: {ev.title}</h2>
          <p className="note">
            {regs.length} registered{ev.capacity ? ` of ${ev.capacity}` : ""}
          </p>
        </div>
        <button
          type="button"
          className="btn ghost"
          disabled={!regs.length}
          onClick={() =>
            downloadCsv([["Name", "Email", "Phone", "College", "Year", "Registered"]].concat(regs.map((r) => [r.name, r.email, r.phone, r.college, r.year, fmtDate(r.createdAt)])), `${ev.id}-registrations.csv`)
          }
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>
      <Gate state={state}>
        {!regs.length ? (
          <div className="empty">
            <b>No registrations yet</b>
            <span>Share the event link to start getting sign-ups.</span>
          </div>
        ) : (
          <div className="tablewrap">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>College</th>
                  <th>Year</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {regs.map((r) => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td>{r.email}</td>
                    <td>{r.phone || "—"}</td>
                    <td>{r.college || "—"}</td>
                    <td>{r.year || "—"}</td>
                    <td>{fmtDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Gate>
    </div>
  );
}
