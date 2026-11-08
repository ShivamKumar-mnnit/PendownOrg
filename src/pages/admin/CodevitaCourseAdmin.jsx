import { useState } from "react";
import { Eye, EyeOff, Loader2, Pencil, Plus, RotateCcw, Save, Trash2, X } from "lucide-react";
import { call } from "../../lib/testsApi";
import RichText from "../../components/RichText";
import { Field, Gate } from "./shared";
import { useAdminData } from "./adminUtils";

// Admin → CodeVita: lessons, mock tests, and the course page / price / launch popup.
const adm = (path, opts = {}) => call(path, { ...opts, admin: true });
const loadLearn = () => adm("/api/cv/admin/learn");
const loadMocks = () => adm("/api/cv/admin/mocks");
const KIND_NAMES = { guide: "Preparation guide", topic: "Topic lesson", pattern: "Patterns" };

// ---------------- Lessons ----------------

export function LessonsAdmin() {
  const state = useAdminData(loadLearn);
  const [editing, setEditing] = useState(null);
  const [err, setErr] = useState("");
  const act = async (fn) => {
    setErr("");
    try {
      await fn();
      state.reload();
    } catch (e) {
      setErr(e.message);
    }
  };
  if (editing) return <LessonEditor initial={editing} onCancel={() => setEditing(null)} onSaved={() => (setEditing(null), state.reload())} />;
  const items = state.data?.items || [];
  return (
    <Gate state={state}>
      <div>
        <div className="row" style={{ justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
          <p className="note" style={{ margin: 0 }}>
            {items.length} lessons: {items.filter((l) => !l.hidden && l.access === "free").length} free, {items.filter((l) => !l.hidden && l.access === "premium").length} premium,{" "}
            {items.filter((l) => l.hidden).length} hidden. Students see them under Learn at /courses/tcs-codevita, in this order.
          </p>
          <button type="button" className="btn" onClick={() => setEditing({ kind: "topic", access: "premium", minutes: 15, order: (items.at(-1)?.order || 0) + 10, topics: [], body: "" })}>
            <Plus className="h-4 w-4" /> New lesson
          </button>
        </div>
        {err && <p className="note bad">{err}</p>}
        <div className="tablewrap">
          <table className="dtable">
            <thead>
              <tr>
                <th>#</th>
                <th>Lesson</th>
                <th>Section</th>
                <th>Access</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((l) => (
                <tr key={l.id} style={l.hidden ? { opacity: 0.55 } : undefined}>
                  <td>{l.order}</td>
                  <td>
                    <b>{l.title}</b>
                    <small style={{ display: "block", color: "var(--color-fg-faint)" }}>
                      {l.id} · {l.minutes} min{l.builtIn ? (l.edited ? " · built-in, edited" : " · built-in") : " · your lesson"}
                      {l.hidden ? " · hidden" : ""}
                    </small>
                  </td>
                  <td>{KIND_NAMES[l.kind]}</td>
                  <td>
                    <select
                      className="inp"
                      style={{ padding: "6px 8px", width: "auto" }}
                      value={l.access}
                      onChange={(e) => act(() => adm(`/api/cv/admin/learn/${l.id}`, { method: "PUT", body: { ...l, access: e.target.value } }))}
                    >
                      <option value="free">Free</option>
                      <option value="premium">Premium</option>
                    </select>
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button type="button" className="btn ghost sm" onClick={() => setEditing(l)} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </button>{" "}
                    {l.hidden ? (
                      <button
                        type="button"
                        className="btn ghost sm"
                        title="Show to students"
                        onClick={() => act(() => (l.builtIn && !l.edited ? adm(`/api/cv/admin/learn/${l.id}/restore`, { method: "POST", body: {} }) : adm(`/api/cv/admin/learn/${l.id}`, { method: "PUT", body: { ...l, hidden: false } })))}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    ) : (
                      <button type="button" className="btn ghost sm" title={l.builtIn ? "Hide from students" : "Delete"} onClick={() => (l.builtIn || window.confirm(`Delete "${l.title}"?`)) && act(() => adm(`/api/cv/admin/learn/${l.id}`, { method: "DELETE" }))}>
                        {l.builtIn ? <EyeOff className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    )}{" "}
                    {l.builtIn && l.edited && (
                      <button type="button" className="btn ghost sm" title="Undo your edits (back to the built-in lesson)" onClick={() => window.confirm("Undo your edits to this lesson?") && act(() => adm(`/api/cv/admin/learn/${l.id}/restore`, { method: "POST", body: {} }))}>
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Gate>
  );
}

function LessonEditor({ initial, onCancel, onSaved }) {
  const isNew = !initial.id;
  const [l, setL] = useState({ ...initial, topics: (initial.topics || []).join(", ") });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [preview, setPreview] = useState(false);
  const set = (k, v) => setL((x) => ({ ...x, [k]: v }));
  async function save() {
    setBusy(true);
    setErr("");
    try {
      const body = { ...l, topics: l.topics.split(",").map((t) => t.trim()).filter(Boolean) };
      if (isNew) await adm("/api/cv/admin/learn", { method: "POST", body });
      else await adm(`/api/cv/admin/learn/${initial.id}`, { method: "PUT", body });
      onSaved();
    } catch (e) {
      setErr(e.message);
    }
    setBusy(false);
  }
  return (
    <div className="panel" style={{ display: "grid", gap: 14 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h3 style={{ margin: 0 }}>{isNew ? "New lesson" : `Edit: ${initial.title}`}</h3>
        <button type="button" className="btn ghost sm" onClick={onCancel}>
          <X className="h-4 w-4" /> Cancel
        </button>
      </div>
      <Field label="Title">
        <input className="inp" value={l.title || ""} onChange={(e) => set("title", e.target.value)} />
      </Field>
      {isNew && (
        <Field label="Id (optional)" hint="Used in the link /courses/tcs-codevita/learn/<id>. Left empty, it is made from the title.">
          <input className="inp" value={l.id || ""} onChange={(e) => set("id", e.target.value)} />
        </Field>
      )}
      <Field label="One-line summary">
        <input className="inp" value={l.summary || ""} onChange={(e) => set("summary", e.target.value)} />
      </Field>
      <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
        <label className="mini">
          Section{" "}
          <select className="inp" style={{ width: "auto" }} value={l.kind} onChange={(e) => set("kind", e.target.value)}>
            {Object.entries(KIND_NAMES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="mini">
          Access{" "}
          <select className="inp" style={{ width: "auto" }} value={l.access} onChange={(e) => set("access", e.target.value)}>
            <option value="free">Free</option>
            <option value="premium">Premium</option>
          </select>
        </label>
        <label className="mini">
          Minutes <input className="inp" type="number" min="1" value={l.minutes} onChange={(e) => set("minutes", e.target.value)} />
        </label>
        <label className="mini">
          Order <input className="inp" type="number" value={l.order} onChange={(e) => set("order", e.target.value)} />
        </label>
      </div>
      <Field label="Topics (comma separated)" hint="Problems with these topics are listed under the lesson as practice, e.g. Graphs, BFS.">
        <input className="inp" value={l.topics} onChange={(e) => set("topics", e.target.value)} />
      </Field>
      <Field label="Lesson text" hint="# and ## for headings, - for bullets, 1. for numbered steps, > for a tip box, ```cpp … ``` for code, `inline code` and **bold**.">
        <div className="row" style={{ gap: 6, marginBottom: 6 }}>
          <button type="button" className={`btn ghost sm${!preview ? " on" : ""}`} onClick={() => setPreview(false)}>
            Write
          </button>
          <button type="button" className={`btn ghost sm${preview ? " on" : ""}`} onClick={() => setPreview(true)}>
            Preview
          </button>
        </div>
        {preview ? (
          <div className="panel" style={{ maxHeight: 520, overflowY: "auto" }}>
            <RichText text={l.body || ""} />
          </div>
        ) : (
          <textarea className="inp" rows={20} style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 13 }} value={l.body || ""} onChange={(e) => set("body", e.target.value)} />
        )}
      </Field>
      <div className="row" style={{ gap: 10 }}>
        <button type="button" className="btn" onClick={save} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save lesson
        </button>
        {err && <span className="note bad">{err}</span>}
      </div>
    </div>
  );
}

// ---------------- Mock tests ----------------

export function MocksAdmin({ bank }) {
  const state = useAdminData(loadMocks);
  return (
    <Gate state={state}>
      {state.data && <MocksEditor key={JSON.stringify(state.data.items)} items={state.data.items} bank={bank} reload={state.reload} />}
    </Gate>
  );
}

function MocksEditor({ items: initial, bank, reload }) {
  const [items, setItems] = useState(() => initial.map((m) => ({ ...m, problems: m.problems.join(", ") })));
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const ids = new Set(bank.map((p) => p.id));
  const set = (i, k, v) => setItems((xs) => xs.map((m, j) => (j === i ? { ...m, [k]: v } : m)));
  const unknown = (m) =>
    m.problems
      .split(",")
      .map((x) => x.trim().toLowerCase())
      .filter((x) => x && !ids.has(x));
  async function save() {
    setBusy(true);
    setMsg("");
    try {
      await adm("/api/cv/admin/mocks", { method: "PUT", body: { items: items.map((m) => ({ ...m, problems: m.problems.split(",").map((x) => x.trim()).filter(Boolean) })) } });
      setMsg("Saved.");
      reload();
    } catch (e) {
      setMsg(e.message);
    }
    setBusy(false);
  }
  async function reset() {
    if (!window.confirm("Put back the built-in mock tests? Your changes to the list are removed. Students' past attempts are kept.")) return;
    await adm("/api/cv/admin/mocks", { method: "DELETE" });
    reload();
  }
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <p className="note" style={{ margin: 0 }}>
        Each mock test is a timed set of problems from the question bank. Use problem ids from the Problems tab. Problems stay hidden until a student starts, and editorials stay hidden while the test is running.
      </p>
      {items.map((m, i) => (
        <div key={i} className="panel" style={{ display: "grid", gap: 10, opacity: m.hidden ? 0.6 : 1 }}>
          <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
            <input className="inp" style={{ flex: "1 1 260px" }} value={m.title} onChange={(e) => set(i, "title", e.target.value)} aria-label="Title" />
            <label className="mini">
              Minutes <input className="inp" type="number" min="5" value={m.minutes} onChange={(e) => set(i, "minutes", e.target.value)} />
            </label>
            <select className="inp" style={{ width: "auto" }} value={m.access} onChange={(e) => set(i, "access", e.target.value)} aria-label="Access">
              <option value="free">Free</option>
              <option value="premium">Premium</option>
            </select>
            <label className="mini">
              <input type="checkbox" checked={m.hidden} onChange={(e) => set(i, "hidden", e.target.checked)} /> Hidden
            </label>
            <button type="button" className="btn ghost sm" title="Remove" onClick={() => setItems((xs) => xs.filter((_, j) => j !== i))}>
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <input className="inp" value={m.summary} onChange={(e) => set(i, "summary", e.target.value)} placeholder="One-line description" aria-label="Summary" />
          <input className="inp" value={m.problems} onChange={(e) => set(i, "problems", e.target.value)} placeholder="Problem ids, comma separated" aria-label="Problem ids" />
          {unknown(m).length > 0 && <p className="note bad" style={{ margin: 0 }}>Not in the question bank: {unknown(m).join(", ")}</p>}
          <small className="mini">
            Id: {m.id || "(made from the title)"} · link /courses/tcs-codevita/mock/{m.id || "…"}
          </small>
        </div>
      ))}
      <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
        <button type="button" className="btn ghost" onClick={() => setItems((xs) => [...xs, { id: "", title: "New mock test", summary: "", minutes: 120, access: "premium", hidden: false, problems: "" }])}>
          <Plus className="h-4 w-4" /> Add mock test
        </button>
        <button type="button" className="btn" onClick={save} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save mock tests
        </button>
        <button type="button" className="btn ghost" onClick={reset}>
          <RotateCcw className="h-4 w-4" /> Reset to built-in
        </button>
        {msg && <span className={`note${msg === "Saved." ? "" : " bad"}`}>{msg}</span>}
      </div>
    </div>
  );
}

// ---------------- Course page, price and popup ----------------

export function CourseAdmin({ data, onSaved }) {
  const [s, setS] = useState(data.settings);
  const [price, setPrice] = useState(data.price || { enabled: true, paid: true, price: 21, days: 365 });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setS((x) => ({ ...x, [k]: v }));
  const setP = (k, v) => setS((x) => ({ ...x, promo: { ...x.promo, [k]: v } }));
  async function save() {
    setBusy(true);
    setMsg("");
    try {
      await adm("/api/cv/admin/settings", { method: "PUT", body: { visible: s.visible, cardTitle: s.cardTitle, cardSummary: s.cardSummary, promo: s.promo } });
      await adm("/api/cv/admin/price", { method: "PUT", body: { enabled: price.enabled, paid: price.paid, price: Number(price.price), days: Number(price.days) } });
      setMsg("Saved. The course page, Courses card and popup use these now.");
      onSaved();
    } catch (e) {
      setMsg(e.message);
    }
    setBusy(false);
  }
  const shown = price.enabled && price.paid ? `₹${price.price}` : "free";
  return (
    <div className="panel" style={{ maxWidth: 760, display: "grid", gap: 14 }}>
      <h3 style={{ margin: 0 }}>Course</h3>
      <label className="cv-check">
        <input type="checkbox" checked={s.visible} onChange={(e) => set("visible", e.target.checked)} /> Show the course to students (when off, /courses/tcs-codevita, the Courses card and the popup are hidden; admins can still open it)
      </label>
      <Field label="Course card title" hint="Shown on the Courses page.">
        <input className="inp" value={s.cardTitle} onChange={(e) => set("cardTitle", e.target.value)} />
      </Field>
      <Field label="Course card description">
        <textarea className="inp" rows={3} value={s.cardSummary} onChange={(e) => set("cardSummary", e.target.value)} />
      </Field>

      <h3 style={{ margin: "8px 0 0" }}>Price</h3>
      <p className="note" style={{ margin: 0 }}>
        One price for the Complete TCS CodeVita Crash Course. Razorpay charges this amount, and every page, the upgrade popup and the launch popup show it. It's the same row as CodeVita in Prices and features.
      </p>
      <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
        <label className="mini">
          Price (₹) <input className="inp" type="number" min="1" value={price.price} onChange={(e) => setPrice({ ...price, price: e.target.value })} />
        </label>
        <label className="mini">
          Access (days) <input className="inp" type="number" min="1" value={price.days} onChange={(e) => setPrice({ ...price, days: e.target.value })} />
        </label>
        <label className="mini">
          <input type="checkbox" checked={price.enabled && price.paid} onChange={(e) => setPrice({ ...price, enabled: true, paid: e.target.checked })} /> On sale
        </label>
      </div>

      <h3 style={{ margin: "8px 0 0" }}>Launch popup</h3>
      <label className="cv-check">
        <input type="checkbox" checked={s.promo.enabled} onChange={(e) => setP("enabled", e.target.checked)} /> Show the popup across the site (once per visit, not on coding, test, account or admin pages, and not to students who already bought the course)
      </label>
      <Field label="Headline">
        <input className="inp" value={s.promo.headline} onChange={(e) => setP("headline", e.target.value)} />
      </Field>
      <Field label="Description">
        <textarea className="inp" rows={3} value={s.promo.text} onChange={(e) => setP("text", e.target.value)} />
      </Field>
      <Field label="Price line" hint={`{price} is replaced by the price above (now ${shown}).`}>
        <input className="inp" value={s.promo.priceText} onChange={(e) => setP("priceText", e.target.value)} />
      </Field>
      <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
        <label className="mini">
          Button <input className="inp" style={{ width: 200 }} value={s.promo.cta} onChange={(e) => setP("cta", e.target.value)} />
        </label>
        <label className="mini">
          Dismiss button <input className="inp" style={{ width: 160 }} value={s.promo.later} onChange={(e) => setP("later", e.target.value)} />
        </label>
        <label className="mini">
          Delay (seconds) <input className="inp" type="number" min="0" max="60" value={s.promo.delaySec} onChange={(e) => setP("delaySec", e.target.value)} />
        </label>
      </div>
      <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
        <button type="button" className="btn" onClick={save} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
        </button>
        {msg && <span className={`note${msg.startsWith("Saved") ? "" : " bad"}`}>{msg}</span>}
      </div>
    </div>
  );
}
