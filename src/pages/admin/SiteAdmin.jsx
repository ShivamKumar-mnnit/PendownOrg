import { useCallback, useState } from "react";
import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { adminCreate, adminDelete, adminList, adminReorder, adminUpdate, getSettings, saveSettings } from "../../lib/contentApi";
import { Field, Gate, MoveButtons, SectionTop } from "./shared";
import { move, useAdminData } from "./adminUtils";

export default function SiteAdmin() {
  return (
    <div>
      <SettingsForm />
      <div style={{ height: 40 }} />
      <FaqAdmin />
    </div>
  );
}

function SettingsForm() {
  const load = useCallback(() => adminList("faqs").then(() => getSettings()), []); // adminList checks the password first
  const state = useAdminData(load);
  return (
    <div>
      <SectionTop title="Site text and announcements" text="The strip at the top of every page, the contact email, and an optional announcement banner." />
      <Gate state={state}>{state.data && <SettingsFields initial={state.data} />}</Gate>
    </div>
  );
}

function SettingsFields({ initial }) {
  const [s, setS] = useState(initial);
  const [msg, setMsg] = useState("");
  const ann = s.announcement;
  const setAnn = (patch) => setS({ ...s, announcement: { ...ann, ...patch } });

  async function save(e) {
    e.preventDefault();
    try {
      await saveSettings(s);
      setMsg("Saved. Refresh the site to see it.");
    } catch (x) {
      setMsg(x.message);
    }
  }

  return (
    <form className="panel" onSubmit={save}>
      <div className="two">
        <Field label="Top strip text">
          <input className="inp" value={s.topbar} onChange={(e) => setS({ ...s, topbar: e.target.value })} />
        </Field>
        <Field label="Contact email">
          <input className="inp" value={s.contactEmail} onChange={(e) => setS({ ...s, contactEmail: e.target.value })} />
        </Field>
      </div>
      <label className="l">Announcement banner</label>
      <div className="checks inline">
        <label>
          <input type="checkbox" checked={ann.active} onChange={(e) => setAnn({ active: e.target.checked })} /> Show the banner on every page
        </label>
      </div>
      <div className="three">
        <Field label="Message">
          <input className="inp" value={ann.text} onChange={(e) => setAnn({ text: e.target.value })} placeholder="e.g. Registrations open for the DSA bootcamp" />
        </Field>
        <Field label="Link (optional)" hint="A page like /talks or a full https:// link.">
          <input className="inp" value={ann.link} onChange={(e) => setAnn({ link: e.target.value })} />
        </Field>
        <Field label="Link text">
          <input className="inp" value={ann.linkLabel} onChange={(e) => setAnn({ linkLabel: e.target.value })} placeholder="Register now" />
        </Field>
      </div>
      <div className="row" style={{ marginTop: 16, alignItems: "center" }}>
        <button className="btn">Save</button>
        {msg && <span className="note" style={{ margin: 0 }}>{msg}</span>}
      </div>
    </form>
  );
}

function FaqAdmin() {
  const load = useCallback(() => adminList("faqs"), []);
  const state = useAdminData(load);
  const [editing, setEditing] = useState(null);
  const [err, setErr] = useState("");
  const items = state.data || [];

  async function act(fn) {
    setErr("");
    try {
      await fn();
      state.reload();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function save(e) {
    e.preventDefault();
    if (!editing.q.trim()) return setErr("Write the question.");
    await act(() => (editing.id ? adminUpdate("faqs", editing.id, editing) : adminCreate("faqs", editing)));
    setEditing(null);
  }

  return (
    <div>
      <SectionTop title="FAQ" text="Questions on the FAQ page.">
        <button type="button" className="btn" onClick={() => setEditing({ q: "", a: "", published: true })}>
          <Plus className="h-4 w-4" /> New question
        </button>
      </SectionTop>
      {err && <p className="note bad">{err}</p>}
      <Gate state={state}>
        {editing && (
          <form className="panel" onSubmit={save} style={{ marginBottom: 16 }}>
            <Field label="Question">
              <input className="inp" value={editing.q} onChange={(e) => setEditing({ ...editing, q: e.target.value })} autoFocus />
            </Field>
            <Field label="Answer">
              <textarea className="inp" rows={4} value={editing.a} onChange={(e) => setEditing({ ...editing, a: e.target.value })} />
            </Field>
            <div className="row" style={{ marginTop: 14 }}>
              <button className="btn">Save</button>
              <button type="button" className="btn ghost" onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
          </form>
        )}
        <div className="tlist">
          {items.map((f, i) => (
            <div className="trow" key={f.id}>
              <div className="tinfo">
                <b style={{ fontSize: 17 }}>{f.q}</b>
                <small>
                  {f.published ? "" : "Hidden · "}
                  {f.a.slice(0, 140)}
                  {f.a.length > 140 ? "…" : ""}
                </small>
              </div>
              <div className="tact">
                <MoveButtons i={i} count={items.length} onMove={(i, d) => act(() => adminReorder("faqs", move(items, i, d).map((x) => x.id)))} />
                <button type="button" className="ib" title="Edit" onClick={() => setEditing(f)}>
                  <Pencil className="h-4 w-4" />
                </button>
                <button type="button" className="ib" title={f.published ? "Hide" : "Show"} onClick={() => act(() => adminUpdate("faqs", f.id, { ...f, published: !f.published }))}>
                  {f.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button type="button" className="ib danger" title="Delete" onClick={() => confirm("Delete this question?") && act(() => adminDelete("faqs", f.id))}>
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
