import { lazy, Suspense, useState } from "react";
import { ArrowLeft, Award, Bell, ClipboardList, Plus, Settings2, Users, Video } from "lucide-react";
import { TEST_TYPES, adminApi, fmtDay, listColleges } from "../../../lib/dataService";
import { Field, SectionTop } from "../shared";
import { Empty, Loading, Modal, Pager, act, useDs } from "./common";

const BatchStudents = lazy(() => import("./BatchStudents"));
const BatchTests = lazy(() => import("./BatchTests"));
const BatchInterviews = lazy(() => import("./BatchInterviews"));
const BatchAnnouncements = lazy(() => import("./BatchExtras").then((m) => ({ default: m.BatchAnnouncements })));
const BatchScorecard = lazy(() => import("./BatchExtras").then((m) => ({ default: m.BatchScorecard })));

const SUBTABS = [
  ["students", "Students", Users, BatchStudents],
  ["tests", "Tests", ClipboardList, BatchTests],
  ["interviews", "Interviews", Video, BatchInterviews],
  ["announce", "Announcements", Bell, BatchAnnouncements],
  ["scorecard", "Scorecard", Award, BatchScorecard],
  ["settings", "Settings", Settings2, null],
];

/**
 * A batch (a "template" on the data service) is one college drive or cohort:
 * its students, tests, interviews, announcements and scorecard.
 */
export default function Batches({ me }) {
  const [filters, setFilters] = useState({ q: "", page: 0, mine: me.role !== "SUPERADMIN" });
  const state = useDs(() => adminApi.templates({ q: filters.q, page: filters.page, size: 20, createdBy: filters.mine ? me.id : undefined }), [filters, me.id]);
  const [open, setOpen] = useState(null);
  const [create, setCreate] = useState(false);

  if (open)
    return (
      <BatchDetail
        id={open}
        onBack={() => {
          setOpen(null);
          state.reload();
        }}
      />
    );

  return (
    <div>
      <SectionTop title="Batches" text="One batch per college drive or cohort. Add students, run tests and mock interviews, then shortlist from the scorecard.">
        <button type="button" className="btn" onClick={() => setCreate(true)}>
          <Plus className="h-4 w-4" /> New batch
        </button>
      </SectionTop>
      <div className="row" style={{ gap: 10, marginBottom: 14, alignItems: "center" }}>
        <input className="inp" style={{ flex: "1 1 240px" }} placeholder="Search batches" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value, page: 0 })} />
        {me.role === "SUPERADMIN" && (
          <label className="row" style={{ gap: 6, alignItems: "center", fontSize: 14 }}>
            <input type="checkbox" checked={filters.mine} onChange={(e) => setFilters({ ...filters, mine: e.target.checked, page: 0 })} /> Only mine
          </label>
        )}
      </div>
      <Loading state={state}>
        {(page) =>
          !page.items?.length ? (
            <Empty>No batches yet. Create one, or convert a college's onboarding request.</Empty>
          ) : (
            <>
              <div className="cards">
                {page.items.map((t) => (
                  <button type="button" className="card" key={t.id} onClick={() => setOpen(t.id)} style={{ textAlign: "left", cursor: "pointer", opacity: t.active ? 1 : 0.6 }}>
                    <div className="meta">
                      <span className="tag">{TEST_TYPES[t.testType] || t.testType}</span>
                      {!t.active && <span className="tag adv">Inactive</span>}
                      <small>{fmtDay(t.createdAt)}</small>
                    </div>
                    <h3 style={{ marginTop: 10 }}>{t.name}</h3>
                    <p>
                      {t.college ? `${t.college.name} (${t.college.code})` : "No college"} · {t.studentCount} student{t.studentCount === 1 ? "" : "s"}
                    </p>
                    {t.description && <p className="note" style={{ fontSize: 13, margin: "6px 0 0" }}>{t.description}</p>}
                  </button>
                ))}
              </div>
              <Pager page={page} onPage={(p) => setFilters({ ...filters, page: p })} />
            </>
          )
        }
      </Loading>
      {create && (
        <Modal title="New batch" onClose={() => setCreate(false)} wide={640}>
          <BatchForm
            onSaved={(t) => {
              setCreate(false);
              setOpen(t.id);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function BatchDetail({ id, onBack }) {
  const state = useDs(() => adminApi.template(id), [id]);
  const [tab, setTab] = useState("students");
  const t = state.data;
  const Panel = SUBTABS.find((s) => s[0] === tab)?.[3];

  return (
    <div>
      <button type="button" className="linkish" onClick={onBack} style={{ display: "inline-flex", gap: 6, alignItems: "center", marginBottom: 10 }}>
        <ArrowLeft className="h-4 w-4" /> All batches
      </button>
      <Loading state={state}>
        {() => (
          <>
            <div className="admin-top" style={{ marginTop: 0 }}>
              <div>
                <span className="eyebrow">{TEST_TYPES[t.testType]}</span>
                <h2 style={{ fontSize: 26, marginTop: 4 }}>{t.name}</h2>
                <p className="note" style={{ marginTop: 4 }}>
                  {t.college ? `${t.college.name} · college code ${t.college.code}` : "No college"} · {t.studentCount} students
                  {t.productId ? ` · product ${t.productId}` : ""}
                </p>
              </div>
            </div>
            <div className="seg tabs" role="tablist" aria-label="Batch sections" style={{ marginBottom: 18 }}>
              {SUBTABS.map(([key, label, Icon]) => (
                <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? "on" : ""} onClick={() => setTab(key)}>
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>
            {tab === "settings" ? (
              <div className="panel" style={{ maxWidth: 680 }}>
                <BatchForm initial={t} onSaved={() => state.reload()} onDeleted={onBack} />
              </div>
            ) : (
              <Suspense fallback={<p className="note">Loading…</p>}>
                <Panel batch={t} onChange={state.reload} />
              </Suspense>
            )}
          </>
        )}
      </Loading>
    </div>
  );
}

function BatchForm({ initial, onSaved, onDeleted }) {
  const editing = !!initial;
  const colleges = useDs(() => listColleges(), []);
  const [f, setF] = useState({
    name: initial?.name || "",
    testType: initial?.testType || "MCQ",
    description: initial?.description || "",
    productId: initial?.productId || "",
    collegeId: initial?.college?.id || "",
    newCollege: { name: "", code: "", city: "" },
    active: initial?.active ?? true,
  });
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const adding = f.collegeId === "__new";

  async function save(e) {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    let collegeId = adding ? undefined : f.collegeId || undefined;
    const college = adding ? { name: f.newCollege.name.trim(), code: f.newCollege.code.trim().toUpperCase(), city: f.newCollege.city.trim() || undefined } : undefined;
    const r = await act(setErr, async () => {
      if (editing) {
        // A batch update takes a college id only, so create the new college first.
        if (adding) collegeId = (await adminApi.createCollege(college)).id;
        return adminApi.updateTemplate(initial.id, { name: f.name.trim(), testType: f.testType, description: f.description.trim(), productId: f.productId.trim(), collegeId, active: f.active });
      }
      return adminApi.createTemplate({ name: f.name.trim(), testType: f.testType, description: f.description.trim() || undefined, productId: f.productId.trim() || undefined, collegeId, college });
    });
    setBusy(false);
    if (r) {
      if (editing) setMsg("Saved.");
      onSaved(r);
    }
  }

  return (
    <form onSubmit={save}>
      <div className="two">
        <Field label="Batch name">
          <input className="inp" value={f.name} onChange={set("name")} required maxLength={150} placeholder="Placement Drive 2026" />
        </Field>
        <Field label="Type">
          <select className="inp" value={f.testType} onChange={set("testType")}>
            {Object.entries(TEST_TYPES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="College" hint="Students of this batch sign in with the college code and their reg no.">
        <select className="inp" value={f.collegeId} onChange={set("collegeId")}>
          <option value="">No college</option>
          {(colleges.data || []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.code})
            </option>
          ))}
          <option value="__new">+ Add a new college</option>
        </select>
      </Field>
      {adding && (
        <div className="three">
          <Field label="College name">
            <input className="inp" value={f.newCollege.name} onChange={(e) => setF({ ...f, newCollege: { ...f.newCollege, name: e.target.value } })} required maxLength={200} />
          </Field>
          <Field label="Code" hint="2-30 letters/digits, e.g. MNNIT">
            <input className="inp" value={f.newCollege.code} onChange={(e) => setF({ ...f, newCollege: { ...f.newCollege, code: e.target.value } })} required minLength={2} maxLength={30} />
          </Field>
          <Field label="City">
            <input className="inp" value={f.newCollege.city} onChange={(e) => setF({ ...f, newCollege: { ...f.newCollege, city: e.target.value } })} maxLength={100} />
          </Field>
        </div>
      )}
      <Field label="Description">
        <textarea className="inp" rows={2} value={f.description} onChange={set("description")} maxLength={2000} placeholder="Aptitude + mock interviews for final years" />
      </Field>
      <div className="two">
        <Field label="Product ID (optional)">
          <input className="inp" value={f.productId} onChange={set("productId")} maxLength={100} />
        </Field>
        {editing && (
          <Field label="Status">
            <label className="row" style={{ gap: 8, alignItems: "center", marginTop: 10 }}>
              <input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Active
            </label>
          </Field>
        )}
      </div>
      {err && <p className="note bad">{err}</p>}
      {msg && <p className="note ok">{msg}</p>}
      <div className="row" style={{ marginTop: 16, justifyContent: "space-between" }}>
        <button className="btn" disabled={busy}>
          {busy ? "Saving…" : editing ? "Save batch" : "Create batch"}
        </button>
        {editing && (
          <button
            type="button"
            className="btn ghost"
            style={{ color: "var(--ab-bad)" }}
            onClick={async () =>
              (await act(setErr, () => adminApi.deleteTemplate(initial.id), `Delete "${initial.name}"? This also removes its enrolments, interviews and announcements. Student accounts stay.`)) !== undefined && onDeleted()
            }
          >
            Delete batch
          </button>
        )}
      </div>
    </form>
  );
}
