import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ClipboardList, Download, LayoutDashboard, Lock, Pencil, Plus, Trash2, Upload, Users } from "lucide-react";
import Buy from "../components/Buy";
import { Head, Page } from "../components/ui";
import {
  addStudent,
  createMyTest,
  deleteMyTest,
  importStudents,
  listStudents,
  myTest,
  myTestResults,
  myTests,
  removeStudent,
  saveStudent,
  updateMyTest,
  useAccount,
  validity,
  rupees,
} from "../lib/account";
import { downloadCsv, fmtDate } from "./admin/adminUtils";
import { usePageSEO } from "../lib/seo";

const TestsAdmin = lazy(() => import("./admin/TestsAdmin"));

// The test builder from the admin panel, pointed at the user's own tests.
// A 401 here means the sign-in expired, which the builder must not mistake
// for a wrong admin password.
const relabel = (p) =>
  p.catch((e) => {
    if (e.status === 401) e.status = 0;
    throw e;
  });
const USER_TESTS = {
  list: () => relabel(myTests().then((d) => d.tests)),
  getFull: (id) => relabel(myTest(id)),
  create: (t) => relabel(createMyTest(t)),
  update: (id, t) => relabel(updateMyTest(id, t)),
  remove: (id) => relabel(deleteMyTest(id)),
  results: (id) => relabel(myTestResults(id)),
};

const TABS = [
  ["overview", "Overview", LayoutDashboard],
  ["students", "Students", Users],
  ["tests", "Tests", ClipboardList],
];

export default function Workspace() {
  usePageSEO({ title: "College panel", description: "Manage students, create tests and follow results on Anobyt.", path: "/workspace", noindex: true });
  const { user, features, loaded } = useAccount();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t[0] === params.get("tab")) ? params.get("tab") : "overview";

  if (!loaded) return <Page narrow={520}><p className="note">Loading…</p></Page>;
  if (!user)
    return (
      <Page narrow={620}>
        <Head eyebrow="College panel" title="Manage students and tests in one place">
          Sign in to open your panel. Colleges, TPOs and teachers can keep student records, create tests and follow every student's progress.
        </Head>
        <div className="row">
          <Link className="btn" to="/account?next=/workspace">
            Sign in
          </Link>
          <Link className="btn ghost" to="/premium">
            See plans
          </Link>
        </div>
      </Page>
    );

  const panel = features?.collegePanel?.has;
  return (
    <section className="page">
      <div className="wrap">
        <div className="admin-top">
          <div>
            <span className="eyebrow">{panel ? "College panel" : "Workspace"}</span>
            <h1 style={{ fontSize: 34, marginTop: 8 }}>{user.collegeName || user.college || user.name}</h1>
          </div>
          <Link className="btn ghost" to="/account">
            Account and purchases
          </Link>
        </div>
        <div className="seg tabs" role="tablist">
          {TABS.map(([id, label, Icon]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? "on" : ""} onClick={() => setParams(id === "overview" ? {} : { tab: id })}>
              <Icon className="h-4 w-4" style={{ display: "inline", verticalAlign: -3, marginRight: 6 }} />
              {label}
            </button>
          ))}
        </div>
        {tab === "overview" && <Overview features={features} go={(t) => setParams({ tab: t })} />}
        {tab === "students" && (features?.studentData?.has ? <Students panel={panel} /> : <Locked id="studentData" features={features} />)}
        {tab === "tests" &&
          (features?.createTests?.has ? (
            <Suspense fallback={<p className="note">Loading…</p>}>
              <TestsAdmin api={USER_TESTS} title="Your tests" intro="Build MCQ, coding and Olympiad tests. Publish a test, copy its link and send it to your students. Only people with the link can take it; results show up here." />
            </Suspense>
          ) : (
            <Locked id="createTests" features={features} />
          ))}
      </div>
    </section>
  );
}

function Locked({ id, features }) {
  const f = features?.[id];
  const panel = features?.collegePanel;
  if (!f?.enabled) return <p className="note">This feature is switched off right now.</p>;
  return (
    <div className="panel unlock" style={{ maxWidth: 620 }}>
      <div className="ic">
        <Lock className="h-5 w-5" />
      </div>
      <h3>{f.title} is a premium feature</h3>
      <p className="note">{f.text}</p>
      <div className="row" style={{ marginTop: 14 }}>
        <Buy item={{ type: "feature", id }} price={f.price} label={`Get ${f.title.toLowerCase()} for ${validity(f.days)}`} />
        {panel?.enabled && panel.paid && !panel.has && (
          <Buy item={{ type: "feature", id: "collegePanel" }} price={panel.price} label="Get the full college panel" className="btn ghost" />
        )}
      </div>
    </div>
  );
}

function Overview({ features, go }) {
  const [stats, setStats] = useState(null);
  const [now] = useState(() => Date.now());
  useEffect(() => {
    let on = true;
    Promise.all([features?.studentData?.has ? listStudents().catch(() => null) : null, features?.createTests?.has ? myTests().catch(() => null) : null]).then(([s, t]) => {
      if (on) setStats({ students: s?.students || null, tests: t?.tests || null });
    });
    return () => {
      on = false;
    };
  }, [features]);

  const st = stats?.students;
  const active = st ? st.filter((s) => s.lastActive && now - s.lastActive < 7 * 864e5).length : 0;
  const solved = st ? st.reduce((n, s) => n + (s.solved || 0), 0) : 0;
  const tools = Object.entries(features || {}).filter(([id]) => id !== "allCourses");

  return (
    <div>
      <div className="kpis">
        <div>
          <b>{st ? st.length : "—"}</b>
          <span>Students</span>
        </div>
        <div>
          <b>{st ? st.filter((s) => s.linked).length : "—"}</b>
          <span>With an Anobyt account</span>
        </div>
        <div>
          <b>{st && features?.collegePanel?.has ? active : "—"}</b>
          <span>Practised this week</span>
        </div>
        <div>
          <b>{st && features?.collegePanel?.has ? solved : "—"}</b>
          <span>Problems solved</span>
        </div>
        <div>
          <b>{stats?.tests ? stats.tests.length : "—"}</b>
          <span>Tests created</span>
        </div>
      </div>
      <div className="plans">
        {tools.map(([id, f]) => (
          <div key={id} className={`plan${f.has ? "" : " dim"}`}>
            <h3>{f.title}</h3>
            <p>{f.text}</p>
            {f.has ? (
              <>
                <span className="owned">{f.paid ? (f.expiresAt ? `Active until ${fmtDate(f.expiresAt).split(",")[0]}` : "Active") : "Free"}</span>
                {id !== "collegePanel" && (
                  <button type="button" className="btn ghost" onClick={() => go(id === "createTests" ? "tests" : "students")}>
                    Open
                  </button>
                )}
              </>
            ) : f.enabled ? (
              <Buy item={{ type: "feature", id }} price={f.price} label={`Get it for ${validity(f.days)}`} />
            ) : (
              <span className="note">Not available</span>
            )}
          </div>
        ))}
      </div>
      {!features?.collegePanel?.has && features?.collegePanel?.enabled && (
        <p className="note" style={{ marginTop: 18 }}>
          The college panel ({rupees(features.collegePanel.price)}) includes student records and test creation, plus each student's practice progress.
        </p>
      )}
    </div>
  );
}

const FIELDS = [
  ["name", "Name"],
  ["email", "Email"],
  ["phone", "Phone"],
  ["roll", "Roll no."],
  ["branch", "Branch"],
  ["year", "Year"],
  ["section", "Section"],
];
const blank = { name: "", email: "", phone: "", roll: "", branch: "", year: "", section: "", notes: "" };

function pickField(row, names) {
  for (const k of Object.keys(row)) if (names.includes(k.trim().toLowerCase())) return String(row[k] ?? "").trim();
  return "";
}

function Students({ panel }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [edit, setEdit] = useState(null);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(
    () =>
      listStudents().then(
        (d) => setData(d.students),
        (e) => setErr(e.message),
      ),
    [],
  );
  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (data || []).filter((x) => !s || Object.values(x).join(" ").toLowerCase().includes(s));
  }, [data, q]);

  async function save(e) {
    e.preventDefault();
    setErr("");
    try {
      if (edit.id) await saveStudent(edit.id, edit);
      else await addStudent(edit);
      setEdit(null);
      load();
    } catch (x) {
      setErr(x.message);
    }
  }

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setMsg("Reading the file…");
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" }).map((r) => ({
        name: pickField(r, ["name", "full name", "student name"]),
        email: pickField(r, ["email", "email id", "mail"]),
        phone: pickField(r, ["phone", "mobile", "phone number", "contact"]),
        roll: pickField(r, ["roll", "roll no", "roll no.", "roll number", "enrollment", "registration no"]),
        branch: pickField(r, ["branch", "department", "dept", "course"]),
        year: pickField(r, ["year", "batch"]),
        section: pickField(r, ["section", "sec"]),
      }));
      const valid = rows.filter((r) => r.name);
      if (!valid.length) return setMsg("No rows with a Name column were found.");
      const r = await importStudents(valid);
      setMsg(`Imported: ${r.added} added, ${r.updated} updated.`);
      load();
    } catch (x) {
      setMsg(x.message || "Couldn't read that file. Save it as .xlsx or .csv and try again.");
    }
  }

  function exportAll() {
    downloadCsv([[...FIELDS.map((f) => f[1]), "Notes", ...(panel ? ["Has account", "Problems solved", "Last active"] : [])], ...(data || []).map((s) => [...FIELDS.map((f) => s[f[0]]), s.notes, ...(panel ? [s.linked ? "Yes" : "No", s.solved || 0, s.lastActive ? fmtDate(s.lastActive) : ""] : [])])], "students.csv");
  }

  return (
    <div>
      <div className="admin-top">
        <div>
          <h2 style={{ fontSize: 24 }}>Students</h2>
          <p className="note" style={{ marginTop: 4 }}>
            {panel ? "Students who sign up on Anobyt with the same email show their practice progress here." : "Add, update and export your student records."}
          </p>
        </div>
        <div className="row">
          <button type="button" className="btn" onClick={() => setEdit({ ...blank })}>
            <Plus className="h-4 w-4" /> Add student
          </button>
          <label className="btn ghost" style={{ cursor: "pointer" }}>
            <Upload className="h-4 w-4" /> Import Excel / CSV
            <input type="file" accept=".xlsx,.xls,.csv" onChange={onFile} hidden />
          </label>
          <button type="button" className="btn ghost" onClick={exportAll} disabled={!data?.length}>
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>
      {msg && <p className="note">{msg}</p>}
      {err && <p className="note bad">{err}</p>}
      {edit && (
        <form className="panel" onSubmit={save} style={{ marginBottom: 18 }}>
          <h3 style={{ fontSize: 19 }}>{edit.id ? "Edit student" : "New student"}</h3>
          <div className="three">
            {FIELDS.map(([k, label]) => (
              <div key={k}>
                <label className="l">{label}</label>
                <input className="inp" value={edit[k]} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} required={k === "name"} type={k === "email" ? "email" : "text"} />
              </div>
            ))}
          </div>
          <label className="l">Notes</label>
          <textarea className="inp" rows={2} value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} />
          <div className="row" style={{ marginTop: 14 }}>
            <button className="btn">Save</button>
            <button type="button" className="btn ghost" onClick={() => setEdit(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}
      {data === null ? (
        <p className="note">Loading…</p>
      ) : !data.length ? (
        <div className="empty">
          <b>No students yet</b>
          <span>Add them one by one or import an Excel sheet with Name, Email, Phone, Roll no., Branch and Year columns.</span>
        </div>
      ) : (
        <>
          <input className="inp" placeholder="Search students" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 340, marginBottom: 12 }} />
          <div className="tablewrap">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Roll no.</th>
                  <th>Branch / year</th>
                  <th>Contact</th>
                  {panel && <th>Practice</th>}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {shown.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <b>{s.name}</b>
                      {s.notes && <small className="note" style={{ display: "block", margin: 0 }}>{s.notes.slice(0, 80)}</small>}
                    </td>
                    <td>{s.roll || "—"}</td>
                    <td>{[s.branch, s.year, s.section].filter(Boolean).join(" · ") || "—"}</td>
                    <td>
                      {s.email || "—"}
                      {s.phone && <small style={{ display: "block", color: "var(--color-fg-muted)" }}>{s.phone}</small>}
                    </td>
                    {panel && (
                      <td>
                        {s.linked ? (
                          <>
                            <b>{s.solved || 0}</b> solved
                            <small style={{ display: "block", color: "var(--color-fg-muted)" }}>{s.lastActive ? `Active ${fmtDate(s.lastActive).split(",")[0]}` : "No activity yet"}</small>
                          </>
                        ) : (
                          <span className="note" style={{ margin: 0 }}>No account yet</span>
                        )}
                      </td>
                    )}
                    <td>
                      <div className="tact" style={{ flexWrap: "nowrap" }}>
                        <button type="button" className="ib" title="Edit" onClick={() => setEdit({ ...blank, ...s })}>
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="ib danger"
                          title="Delete"
                          onClick={() =>
                            confirm(`Delete ${s.name}?`) &&
                            removeStudent(s.id).then(load, (x) => setErr(x.message))
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="note">{shown.length} of {data.length} students</p>
        </>
      )}
    </div>
  );
}
