import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import { adminDeleteUser, adminSaveUser, adminUser, adminUsers, rupees } from "../../lib/account";
import { adminList } from "../../lib/contentApi";
import { Field, Gate, SectionTop } from "./shared";
import { downloadCsv, fmtDate, useAdminData } from "./adminUtils";

const FEATURE_NAMES = { createTests: "Create tests", studentData: "Student records", collegePanel: "College panel", allCourses: "All premium courses" };

/** Student and college accounts: search, edit, give or take away access, reset passwords. */
export default function UsersAdmin() {
  const load = useCallback(() => Promise.all([adminUsers(), adminList("courses")]).then(([users, courses]) => ({ users, courses })), []);
  const state = useAdminData(load);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("all");
  const [open, setOpen] = useState(null);
  const users = useMemo(() => state.data?.users || [], [state.data]);
  const [now] = useState(() => Date.now());
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return users.filter((u) => (role === "all" || u.role === role) && (!s || [u.name, u.email, u.college, u.collegeName, u.phone].join(" ").toLowerCase().includes(s)));
  }, [users, q, role]);

  if (open) return <UserEditor id={open} courses={state.data?.courses || []} onClose={() => { setOpen(null); state.reload(); }} />;

  return (
    <div>
      <SectionTop title="Purchases and users" text="Purchase records, linked by email to data-service accounts. Open one to change its access. College panel logins are made in the Accounts tab (role Admin).">
        <button
          type="button"
          className="btn ghost"
          disabled={!users.length}
          onClick={() => downloadCsv([["Name", "Email", "Phone", "Role", "College", "Year", "Solved", "Joined"], ...users.map((u) => [u.name, u.email, u.phone, u.role, u.collegeName || u.college, u.year, u.progress?.solved?.length || 0, fmtDate(u.createdAt)])], "users.csv")}
        >
          <Download className="h-4 w-4" /> Export
        </button>
      </SectionTop>
      <Gate state={state}>
        <div className="row" style={{ marginBottom: 12, alignItems: "center" }}>
          <input className="inp" placeholder="Search name, email, college" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 320 }} />
          {[
            ["all", "All"],
            ["student", "Students"],
            ["college", "Colleges"],
          ].map(([k, l]) => (
            <button key={k} type="button" className={`chip${role === k ? " on" : ""}`} onClick={() => setRole(k)}>
              {l}
            </button>
          ))}
          <span className="note" style={{ margin: 0 }}>{shown.length} accounts</span>
        </div>
        {!shown.length ? (
          <div className="empty">
            <b>No accounts yet</b>
            <span>Students appear here once they sign up on /account.</span>
          </div>
        ) : (
          <div className="tablewrap">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Access</th>
                  <th>Solved</th>
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {shown.map((u) => {
                  const live = (u.grants || []).filter((g) => !g.expiresAt || g.expiresAt > now);
                  return (
                    <tr key={u.id}>
                      <td>
                        <b>{u.name}</b>
                        {u.disabled && <span className="bad"> (blocked)</span>}
                        <small style={{ display: "block", color: "var(--color-fg-muted)" }}>
                          {u.email}
                          {u.collegeName || u.college ? ` · ${u.collegeName || u.college}` : ""}
                        </small>
                      </td>
                      <td>{u.role === "college" ? "College" : "Student"}</td>
                      <td>{live.length ? live.map((g) => (g.type === "feature" ? FEATURE_NAMES[g.id] : g.type === "course" ? `Course: ${g.id}` : "1 module")).join(", ") : "—"}</td>
                      <td>{u.progress?.solved?.length || 0}</td>
                      <td>{fmtDate(u.createdAt).split(",")[0]}</td>
                      <td>
                        <button type="button" className="ib" title="Open" onClick={() => setOpen(u.id)}>
                          <Pencil className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Gate>
    </div>
  );
}

function UserEditor({ id, courses, onClose }) {
  const [data, setData] = useState(null);
  const [u, setU] = useState(null);
  const [msg, setMsg] = useState("");
  const [pw, setPw] = useState("");
  const [g, setG] = useState({ type: "feature", id: "allCourses", courseId: "", moduleId: "", days: 365 });
  const [now] = useState(() => Date.now());

  useEffect(() => {
    adminUser(id).then(
      (d) => {
        setData(d);
        setU(d.user);
      },
      (e) => setMsg(e.message),
    );
  }, [id]);

  if (!u) return <p className="note">{msg || "Loading…"}</p>;
  const course = courses.find((c) => c.id === g.courseId);
  const courseTitle = (cid) => courses.find((c) => c.id === cid)?.title || cid;
  const grantLabel = (x) =>
    x.type === "feature" ? FEATURE_NAMES[x.id] : x.type === "course" ? `Course: ${courseTitle(x.id)}` : `Module "${courses.find((c) => c.id === x.courseId)?.modules.find((m) => m.id === x.moduleId)?.title || x.moduleId}" of ${courseTitle(x.courseId)}`;

  function addGrant() {
    const expiresAt = Number(g.days) ? Date.now() + Number(g.days) * 864e5 : 0;
    const grant = g.type === "feature" ? { type: "feature", id: g.id, expiresAt } : g.type === "course" ? { type: "course", id: g.courseId, expiresAt } : { type: "module", courseId: g.courseId, moduleId: g.moduleId, expiresAt };
    if (g.type !== "feature" && !g.courseId) return setMsg("Pick a course.");
    if (g.type === "module" && !g.moduleId) return setMsg("Pick a module.");
    setU({ ...u, grants: [...(u.grants || []), { ...grant, grantedAt: Date.now() }] });
    setMsg("Added. Save to apply.");
  }

  async function save() {
    setMsg("");
    try {
      const next = await adminSaveUser(id, { ...u, password: pw || undefined });
      setU(next);
      setPw("");
      setMsg("Saved.");
    } catch (x) {
      setMsg(x.message);
    }
  }

  return (
    <div className="editor">
      <button type="button" className="linkish" onClick={onClose}>
        ← All users
      </button>
      <h2 style={{ fontSize: 24, margin: "6px 0 16px" }}>{u.name}</h2>
      <div className="panel">
        <div className="three">
          <Field label="Name">
            <input className="inp" value={u.name} onChange={(e) => setU({ ...u, name: e.target.value })} />
          </Field>
          <Field label="Email (sign-in)">
            <input className="inp" value={u.email} disabled />
          </Field>
          <Field label="Phone">
            <input className="inp" value={u.phone || ""} onChange={(e) => setU({ ...u, phone: e.target.value })} />
          </Field>
          <Field label="Account type">
            <select className="inp" value={u.role} onChange={(e) => setU({ ...u, role: e.target.value })}>
              <option value="student">Student</option>
              <option value="college">College</option>
            </select>
          </Field>
          <Field label={u.role === "college" ? "College name" : "College"}>
            <input className="inp" value={u.role === "college" ? u.collegeName || "" : u.college || ""} onChange={(e) => setU(u.role === "college" ? { ...u, collegeName: e.target.value } : { ...u, college: e.target.value })} />
          </Field>
          <Field label="New password (optional)" hint="Signs the user out everywhere.">
            <input className="inp" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Leave empty to keep" />
          </Field>
        </div>
        <label className="mini" style={{ display: "inline-flex", gap: 8, marginTop: 12 }}>
          <input type="checkbox" checked={Boolean(u.disabled)} onChange={(e) => setU({ ...u, disabled: e.target.checked })} /> Block this account
        </label>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 19 }}>Access</h3>
        {!(u.grants || []).length && <p className="note">Nothing yet.</p>}
        <ul className="ck">
          {(u.grants || []).map((x, i) => (
            <li key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <span>
                <b style={{ color: "var(--color-fg)" }}>{grantLabel(x)}</b>
                {x.expiresAt ? ` · until ${fmtDate(x.expiresAt).split(",")[0]}${x.expiresAt < now ? " (expired)" : ""}` : " · no end date"}
                {x.payment ? " · paid" : " · given by admin"}
              </span>
              <button type="button" className="ib danger" title="Take away" onClick={() => setU({ ...u, grants: u.grants.filter((_, j) => j !== i) })}>
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
        <div className="row" style={{ marginTop: 12, alignItems: "flex-end" }}>
          <Field label="Give">
            <select className="inp" value={g.type} onChange={(e) => setG({ ...g, type: e.target.value })}>
              <option value="feature">A feature</option>
              <option value="course">A whole course</option>
              <option value="module">One module</option>
            </select>
          </Field>
          {g.type === "feature" ? (
            <Field label="Feature">
              <select className="inp" value={g.id} onChange={(e) => setG({ ...g, id: e.target.value })}>
                {Object.entries(FEATURE_NAMES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <Field label="Course">
              <select className="inp" value={g.courseId} onChange={(e) => setG({ ...g, courseId: e.target.value, moduleId: "" })}>
                <option value="">Choose</option>
                {courses
                  .filter((c) => c.tier === "premium")
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
              </select>
            </Field>
          )}
          {g.type === "module" && course && (
            <Field label="Module">
              <select className="inp" value={g.moduleId} onChange={(e) => setG({ ...g, moduleId: e.target.value })}>
                <option value="">Choose</option>
                {course.modules.map((m, i) => (
                  <option key={m.id || i} value={m.id}>
                    {i + 1}. {m.title}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="For">
            <select className="inp" value={g.days} onChange={(e) => setG({ ...g, days: e.target.value })}>
              <option value={30}>1 month</option>
              <option value={90}>3 months</option>
              <option value={365}>1 year</option>
              <option value={0}>No end date</option>
            </select>
          </Field>
          <button type="button" className="btn ghost" onClick={addGrant}>
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </div>

      {data?.payments?.length > 0 && (
        <div className="panel" style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 19 }}>Payments</h3>
          <ul className="ck">
            {data.payments.map((p) => (
              <li key={p.id}>
                {fmtDate(p.createdAt)} · {p.title} · {rupees(p.amount)} · {p.status}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="savebar">
        {msg && <span className="note" style={{ margin: 0 }}>{msg}</span>}
        <button
          type="button"
          className="btn ghost danger"
          onClick={async () => {
            if (!confirm(`Delete ${u.name}'s account? Their purchases and student records are removed too.`)) return;
            await adminDeleteUser(id).catch((e) => setMsg(e.message));
            onClose();
          }}
        >
          <Trash2 className="h-4 w-4" /> Delete account
        </button>
        <button type="button" className="btn ghost" onClick={onClose}>
          Back
        </button>
        <button type="button" className="btn" onClick={save}>
          Save
        </button>
      </div>
    </div>
  );
}
