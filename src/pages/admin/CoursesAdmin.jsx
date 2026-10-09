import { useCallback, useState } from "react";
import { ExternalLink, Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { adminCreate, adminDelete, adminList, adminReorder, adminUpdate, lessonTotal } from "../../lib/contentApi";
import { LESSON_TYPES } from "../../lib/content/defaults";
import { Field, Gate, MoveButtons, SectionTop } from "./shared";
import { move, useAdminData } from "./adminUtils";

const blankLesson = () => ({ title: "", type: "video", duration: "", url: "", body: "", preview: false });
const blankCourse = () => ({
  title: "",
  tier: "premium",
  level: "",
  icon: "📘",
  cover: "",
  priceLabel: "",
  lessonCount: 0,
  summary: "",
  description: "",
  outline: [],
  modules: [{ title: "Module 1", lessons: [blankLesson()] }],
  published: false,
});

export default function CoursesAdmin() {
  const load = useCallback(() => adminList("courses"), []);
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

  if (editing)
    return (
      <CourseEditor
        initial={editing}
        onCancel={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          state.reload();
        }}
      />
    );

  return (
    <div>
      <SectionTop title="Courses and premium content" text="Free and premium tracks shown on the Courses page. Premium lessons open only with an access code (Premium access tab).">
        <button type="button" className="btn" onClick={() => setEditing(blankCourse())}>
          <Plus className="h-4 w-4" /> New course
        </button>
      </SectionTop>
      {err && <p className="note bad">{err}</p>}
      <Gate state={state}>
        <div className="tlist">
          {items.map((c, i) => (
            <div className="trow" key={c.id}>
              <div className="tinfo">
                <div className="row" style={{ gap: 8 }}>
                  <span className={`tag ${c.tier === "free" ? "free" : "t-olympiad"}`}>{c.tier === "free" ? "Free" : "Premium"}</span>
                  <span className={`tag ${c.published ? "free" : "draft"}`}>{c.published ? "Published" : "Draft"}</span>
                </div>
                <b>
                  {c.icon} {c.title}
                </b>
                <small>
                  {c.modules.length} modules · {c.modules.reduce((n, m) => n + m.lessons.length, 0)} lessons added
                  {lessonTotal(c) ? ` · shows "${lessonTotal(c)} lessons"` : ""} · {c.level || "No level"}
                </small>
              </div>
              <div className="tact">
                <MoveButtons i={i} count={items.length} onMove={(i, d) => act(() => adminReorder("courses", move(items, i, d).map((x) => x.id)))} />
                <button type="button" className="ib" title="Edit" onClick={() => setEditing(c)}>
                  <Pencil className="h-4 w-4" />
                </button>
                <button type="button" className="ib" title={c.published ? "Unpublish" : "Publish"} onClick={() => act(() => adminUpdate("courses", c.id, { ...c, published: !c.published }))}>
                  {c.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <a className="ib" title="View on site" href={`/courses/${c.id}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button type="button" className="ib danger" title="Delete" onClick={() => confirm(`Delete "${c.title}"?`) && act(() => adminDelete("courses", c.id))}>
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

function CourseEditor({ initial, onCancel, onSaved }) {
  const [c, setC] = useState(initial);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (patch) => setC((x) => ({ ...x, ...patch }));
  const setModule = (i, patch) => setC((x) => ({ ...x, modules: x.modules.map((m, j) => (j === i ? { ...m, ...patch } : m)) }));
  const setLesson = (i, k, patch) => setModule(i, { lessons: c.modules[i].lessons.map((l, j) => (j === k ? { ...l, ...patch } : l)) });

  async function save(published) {
    if (!c.title.trim()) return setErr("Give the course a title.");
    setErr("");
    setSaving(true);
    try {
      const body = { ...c, published };
      if (c.id) await adminUpdate("courses", c.id, body);
      else await adminCreate("courses", body);
      onSaved();
    } catch (e) {
      setErr(e.message);
      setSaving(false);
    }
  }

  return (
    <div className="editor">
      <div className="admin-top" style={{ marginTop: 8 }}>
        <div>
          <button type="button" className="linkish" onClick={onCancel}>
            ← All courses
          </button>
          <h2 style={{ fontSize: 24, marginTop: 6 }}>{c.id ? "Edit course" : "New course"}</h2>
        </div>
      </div>

      <div className="panel">
        <div className="two">
          <Field label="Title">
            <input className="inp" value={c.title} onChange={(e) => set({ title: e.target.value })} />
          </Field>
          <Field label="Access">
            <select className="inp" value={c.tier} onChange={(e) => set({ tier: e.target.value })}>
              <option value="free">Free: everyone can open every lesson</option>
              <option value="premium">Premium: lessons need an access code</option>
            </select>
          </Field>
        </div>
        <div className="three">
          <Field label="Icon (emoji)">
            <input className="inp" value={c.icon} onChange={(e) => set({ icon: e.target.value })} />
          </Field>
          <Field label="Level / year">
            <input className="inp" value={c.level} onChange={(e) => set({ level: e.target.value })} placeholder="e.g. 2nd to 3rd year" />
          </Field>
          <Field label="Price label (optional)">
            <input className="inp" value={c.priceLabel} onChange={(e) => set({ priceLabel: e.target.value })} placeholder="e.g. ₹499" />
          </Field>
        </div>
        <Field label="Short summary (shown on the course card)">
          <textarea className="inp" rows={2} value={c.summary} onChange={(e) => set({ summary: e.target.value })} />
        </Field>
        <Field label="Full description" hint='Blank line = new paragraph. Start a line with "# " for a heading or "- " for a bullet.'>
          <textarea className="inp" rows={5} value={c.description} onChange={(e) => set({ description: e.target.value })} />
        </Field>
        <div className="two">
          <Field label="Outline (one topic per line)" hint="Shown as the curriculum until you add modules and lessons.">
            <textarea className="inp" rows={4} value={c.outline.join("\n")} onChange={(e) => set({ outline: e.target.value.split("\n") })} />
          </Field>
          <Field label="Advertised lesson count" hint="Used on the card only when no lessons are added yet.">
            <input className="inp" type="number" min={0} value={c.lessonCount} onChange={(e) => set({ lessonCount: e.target.value })} />
          </Field>
        </div>
      </div>

      {c.modules.map((m, i) => (
        <div className="panel qed" key={i}>
          <div className="qhead">
            <b>Module {i + 1}</b>
            <input className="inp" style={{ flex: 1, minWidth: 200 }} value={m.title} onChange={(e) => setModule(i, { title: e.target.value })} placeholder="Module title" />
            <MoveButtons i={i} count={c.modules.length} onMove={(i, d) => set({ modules: move(c.modules, i, d) })} />
            <button type="button" className="ib danger" title="Remove module" onClick={() => confirm("Remove this module and its lessons?") && set({ modules: c.modules.filter((_, j) => j !== i) })}>
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          {m.lessons.map((l, k) => (
            <div className="lesson-ed" key={k}>
              <div className="qhead">
                <span className="optl">{k + 1}</span>
                <input className="inp" style={{ flex: 1, minWidth: 180 }} value={l.title} onChange={(e) => setLesson(i, k, { title: e.target.value })} placeholder="Lesson title" />
                <select className="inp" style={{ width: "auto" }} value={l.type} onChange={(e) => setLesson(i, k, { type: e.target.value })} aria-label="Lesson type">
                  {Object.entries(LESSON_TYPES).map(([v, t]) => (
                    <option key={v} value={v}>{t}</option>
                  ))}
                </select>
                <input className="inp" style={{ width: 110 }} value={l.duration} onChange={(e) => setLesson(i, k, { duration: e.target.value })} placeholder="e.g. 12 min" aria-label="Duration" />
                <label className="mini">
                  <input type="checkbox" checked={l.preview} onChange={(e) => setLesson(i, k, { preview: e.target.checked })} /> Free preview
                </label>
                <MoveButtons i={k} count={m.lessons.length} onMove={(k, d) => setModule(i, { lessons: move(m.lessons, k, d) })} />
                <button type="button" className="ib danger" title="Remove lesson" onClick={() => setModule(i, { lessons: m.lessons.filter((_, j) => j !== k) })}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <input
                className="inp"
                style={{ marginTop: 8 }}
                value={l.url}
                onChange={(e) => setLesson(i, k, { url: e.target.value })}
                placeholder="Link: YouTube / Vimeo / Google Drive video, PDF or any https:// URL (optional)"
              />
              <textarea className="inp" rows={3} style={{ marginTop: 8 }} value={l.body} onChange={(e) => setLesson(i, k, { body: e.target.value })} placeholder="Notes or article text (optional)" />
            </div>
          ))}
          <button type="button" className="linkish" onClick={() => setModule(i, { lessons: [...m.lessons, blankLesson()] })}>
            + Add lesson
          </button>
        </div>
      ))}
      <div className="addq">
        <button type="button" className="chip" onClick={() => set({ modules: [...c.modules, { title: `Module ${c.modules.length + 1}`, lessons: [blankLesson()] }] })}>
          <Plus className="h-3.5 w-3.5" style={{ display: "inline", verticalAlign: -2 }} /> Add module
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
