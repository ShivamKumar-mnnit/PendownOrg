import { useState } from "react";
import { ArrowLeft, KeyRound, Pencil, Plus, Trash2, UserPlus } from "lucide-react";
import { ONBOARDING_STATUS, ROLE_LABELS, TEST_TYPES, adminApi, fmtDay, fmtWhen, listColleges, superApi } from "../../../lib/dataService";
import { Field, SectionTop } from "../shared";
import { Credentials, Empty, Loading, Modal, Pager, act, tagFor, useDs } from "./common";

export function Overview({ onGo }) {
  const state = useDs(() => superApi.stats(), []);
  return (
    <div>
      <SectionTop title="Overview" text="Live numbers from the data service." />
      <Loading state={state}>
        {(s) => (
          <>
            <div className="kpis" style={{ marginTop: 0 }}>
              {[
                [s.students, "Students", "accounts"],
                [s.admins, "Admins (trainers / companies)", "accounts"],
                [s.colleges, "Colleges", "colleges"],
                [s.templates, "Batches", "batches"],
                [s.questions, "Questions", "questions"],
                [s.tests, "Tests", "batches"],
                [s.attempts, "Test attempts", "batches"],
                [s.interviews, "Interviews", "batches"],
              ].map(([n, label, tab]) => (
                <div key={label} role="button" tabIndex={0} onClick={() => onGo(tab)} onKeyDown={(e) => e.key === "Enter" && onGo(tab)} style={{ cursor: "pointer" }}>
                  <b>{n}</b>
                  <span>{label}</span>
                </div>
              ))}
            </div>
            {s.openOnboardingRequests > 0 && (
              <div className="panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <span>
                  <b>{s.openOnboardingRequests}</b> college onboarding request{s.openOnboardingRequests === 1 ? "" : "s"} waiting.
                </span>
                <button type="button" className="btn" onClick={() => onGo("onboarding")}>
                  Review
                </button>
              </div>
            )}
          </>
        )}
      </Loading>
    </div>
  );
}

// ---- College onboarding requests ----

export function Onboarding() {
  const [filters, setFilters] = useState({ status: "", page: 0 });
  const state = useDs(() => superApi.onboarding({ ...filters, size: 20 }), [filters]);
  const [open, setOpen] = useState(null);

  if (open)
    return (
      <OnboardingDetail
        id={open}
        onBack={() => {
          setOpen(null);
          state.reload();
        }}
      />
    );

  return (
    <div>
      <SectionTop title="College onboarding" text="Requests sent from the For Colleges page. Convert one into a batch to create every student's login in one go.">
        <select className="inp" style={{ width: "auto" }} value={filters.status} onChange={(e) => setFilters({ status: e.target.value, page: 0 })} aria-label="Status">
          <option value="">All</option>
          {Object.entries(ONBOARDING_STATUS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </SectionTop>
      <Loading state={state}>
        {(page) =>
          !page.items?.length ? (
            <Empty>No requests{filters.status ? " with this status" : " yet"}.</Empty>
          ) : (
            <>
              <div className="tablewrap">
                <table className="dtable">
                  <thead>
                    <tr>
                      <th>College</th>
                      <th>Contact</th>
                      <th>Students</th>
                      <th>Received</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {page.items.map((r) => (
                      <tr key={r.id}>
                        <td>{r.collegeName}</td>
                        <td style={{ fontSize: 14 }}>
                          {r.contactPerson}
                          <small className="note" style={{ display: "block", margin: 0 }}>{[r.contactPhone, r.contactEmail].filter(Boolean).join(" · ")}</small>
                        </td>
                        <td>
                          {r.studentRows || "—"}
                          {r.approxStudents ? <small className="note" style={{ display: "block", margin: 0 }}>~{r.approxStudents} expected</small> : null}
                        </td>
                        <td style={{ fontSize: 13 }}>{fmtWhen(r.createdAt)}</td>
                        <td>
                          <span className={`tag ${tagFor(r.status)}`}>{ONBOARDING_STATUS[r.status]}</span>
                        </td>
                        <td>
                          <button type="button" className="btn ghost" style={{ padding: "6px 12px" }} onClick={() => setOpen(r.id)}>
                            Open
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pager page={page} onPage={(p) => setFilters({ ...filters, page: p })} />
            </>
          )
        }
      </Loading>
    </div>
  );
}

function OnboardingDetail({ id, onBack }) {
  const state = useDs(() => superApi.onboardingOne(id), [id]);
  const [form, setForm] = useState(null);
  const [convert, setConvert] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const r = state.data?.request;

  return (
    <div>
      <button type="button" className="linkish" onClick={onBack} style={{ display: "inline-flex", gap: 6, alignItems: "center", marginBottom: 10 }}>
        <ArrowLeft className="h-4 w-4" /> All requests
      </button>
      <Loading state={state}>
        {(d) => {
          const f = form || { status: r.status, notes: r.notes || "" };
          return (
            <>
              <div className="admin-top" style={{ marginTop: 0 }}>
                <div>
                  <span className={`tag ${tagFor(r.status)}`}>{ONBOARDING_STATUS[r.status]}</span>
                  <h2 style={{ fontSize: 24, marginTop: 6 }}>{r.collegeName}</h2>
                  <p className="note" style={{ marginTop: 4 }}>
                    {r.contactPerson} · {r.contactPhone}
                    {r.contactEmail ? ` · ${r.contactEmail}` : ""} · received {fmtWhen(r.createdAt)}
                    {r.fileName ? ` · file ${r.fileName}` : " · no file"}
                  </p>
                </div>
                {!r.templateId && (
                  <button type="button" className="btn" onClick={() => setConvert(true)}>
                    <UserPlus className="h-4 w-4" /> Convert to batch
                  </button>
                )}
              </div>
              {r.templateId && <p className="note ok">Converted into a batch. Find it in the Batches tab.</p>}
              {result && <ConvertSummary result={result} />}

              <form
                className="panel"
                style={{ marginBottom: 18 }}
                onSubmit={async (e) => {
                  e.preventDefault();
                  setMsg("");
                  if ((await act(setErr, () => superApi.updateOnboarding(id, f))) !== undefined) {
                    setMsg("Saved.");
                    setForm(null);
                    state.reload();
                  }
                }}
              >
                <div className="row" style={{ gap: 12, alignItems: "end", flexWrap: "wrap" }}>
                  <div style={{ width: 180 }}>
                    <label className="l" style={{ marginTop: 0 }}>Status</label>
                    <select className="inp" value={f.status} onChange={(e) => setForm({ ...f, status: e.target.value })}>
                      {Object.entries(ONBOARDING_STATUS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: "1 1 280px" }}>
                    <label className="l" style={{ marginTop: 0 }}>Notes (private)</label>
                    <input className="inp" value={f.notes} onChange={(e) => setForm({ ...f, notes: e.target.value })} maxLength={5000} placeholder="Called the placement cell" />
                  </div>
                  <button className="btn">Save</button>
                </div>
                {err && <p className="note bad">{err}</p>}
                {msg && <p className="note ok">{msg}</p>}
              </form>

              <h3 style={{ fontSize: 18, marginBottom: 10 }}>Students in the file ({d.students.length})</h3>
              {!d.students.length ? (
                <Empty>The college didn't attach a student list.</Empty>
              ) : (
                <div className="tablewrap">
                  <table className="dtable">
                    <thead>
                      <tr>
                        <th>Row</th>
                        <th>Name</th>
                        <th>Reg no</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Domain</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.students.map((s) => (
                        <tr key={s.row}>
                          <td>{s.row}</td>
                          <td>{s.name}</td>
                          <td>{s.regNo || "—"}</td>
                          <td>{s.email || "—"}</td>
                          <td>{s.phone || "—"}</td>
                          <td>{s.domain || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {convert && (
                <Modal title="Convert into a batch" onClose={() => setConvert(false)} wide={620}>
                  <ConvertForm
                    request={r}
                    onDone={(res) => {
                      setConvert(false);
                      setResult(res);
                      state.reload();
                    }}
                  />
                </Modal>
              )}
            </>
          );
        }}
      </Loading>
    </div>
  );
}

function ConvertForm({ request, onDone }) {
  const admins = useDs(() => superApi.users({ role: "ADMIN", size: 100, active: true }), []);
  const colleges = useDs(() => listColleges(), []);
  const [f, setF] = useState({
    templateName: `${request.collegeName} ${new Date().getFullYear()}`,
    testType: "MOCK_INTERVIEW",
    collegeId: "",
    college: { name: request.collegeName, code: "", city: "" },
    ownerAdminId: "",
    description: "",
  });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function go(e) {
    e.preventDefault();
    setBusy(true);
    const r = await act(setErr, () =>
      superApi.convertOnboarding(request.id, {
        templateName: f.templateName.trim(),
        testType: f.testType,
        collegeId: f.collegeId || undefined,
        college: f.collegeId ? undefined : { name: f.college.name.trim(), code: f.college.code.trim().toUpperCase(), city: f.college.city.trim() || undefined },
        ownerAdminId: f.ownerAdminId || undefined,
        description: f.description.trim() || undefined,
      }),
    );
    setBusy(false);
    if (r) onDone(r);
  }

  return (
    <form onSubmit={go}>
      <div className="two">
        <Field label="Batch name">
          <input className="inp" value={f.templateName} onChange={set("templateName")} required maxLength={150} />
        </Field>
        <Field label="Type">
          <select className="inp" value={f.testType} onChange={set("testType")}>
            {Object.entries(TEST_TYPES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="College">
        <select className="inp" value={f.collegeId} onChange={set("collegeId")}>
          <option value="">Create a new college</option>
          {(colleges.data || []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.code})
            </option>
          ))}
        </select>
      </Field>
      {!f.collegeId && (
        <div className="three">
          <Field label="College name">
            <input className="inp" value={f.college.name} onChange={(e) => setF({ ...f, college: { ...f.college, name: e.target.value } })} required maxLength={200} />
          </Field>
          <Field label="Code (students sign in with it)">
            <input className="inp" value={f.college.code} onChange={(e) => setF({ ...f, college: { ...f.college, code: e.target.value } })} required minLength={2} maxLength={30} placeholder="IIITA" />
          </Field>
          <Field label="City">
            <input className="inp" value={f.college.city} onChange={(e) => setF({ ...f, college: { ...f.college, city: e.target.value } })} maxLength={100} />
          </Field>
        </div>
      )}
      <Field label="Run by" hint="The admin (trainer / company) who will manage this batch. Leave empty to own it yourself.">
        <select className="inp" value={f.ownerAdminId} onChange={set("ownerAdminId")}>
          <option value="">Me</option>
          {(admins.data?.items || []).map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
              {u.organization ? ` · ${u.organization}` : ""}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Description (optional)">
        <input className="inp" value={f.description} onChange={set("description")} maxLength={2000} />
      </Field>
      <p className="note" style={{ fontSize: 13 }}>Every student in the file gets an account (new ones get a temporary password, shown once next) and is added to the batch.</p>
      {err && <p className="note bad">{err}</p>}
      <button className="btn" style={{ marginTop: 12 }} disabled={busy}>
        {busy ? "Creating…" : "Create batch and enrol students"}
      </button>
    </form>
  );
}

function ConvertSummary({ result }) {
  const r = result.importResult;
  return (
    <div className="panel" style={{ marginBottom: 16 }}>
      <b className="ok">Batch created.</b>
      {r && (
        <p className="note" style={{ marginBottom: 0 }}>
          {r.totalRows} rows · {r.accountsCreated} new accounts · {r.enrolled} enrolled{r.failed?.length ? ` · ${r.failed.length} skipped` : ""}
        </p>
      )}
      <Credentials list={r?.credentials} />
    </div>
  );
}

// ---- Accounts (every user) ----

export function Accounts({ me }) {
  const [filters, setFilters] = useState({ role: "", q: "", active: "", page: 0 });
  const state = useDs(() => superApi.users({ ...filters, size: 25 }), [filters]);
  const [edit, setEdit] = useState(null);
  const [creds, setCreds] = useState(null);
  const [err, setErr] = useState("");
  const setF = (k) => (e) => setFilters({ ...filters, [k]: e.target.value, page: 0 });

  return (
    <div>
      <SectionTop title="Accounts" text="Every login on the data service. Create admins for trainers and companies; they run their own batches.">
        <button type="button" className="btn" onClick={() => setEdit({})}>
          <Plus className="h-4 w-4" /> New admin
        </button>
      </SectionTop>
      <div className="row" style={{ gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <input className="inp" style={{ flex: "2 1 220px" }} placeholder="Search name, email, reg no" value={filters.q} onChange={setF("q")} />
        <select className="inp" style={{ flex: "1 1 160px" }} value={filters.role} onChange={setF("role")} aria-label="Role">
          <option value="">All roles</option>
          {Object.entries(ROLE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select className="inp" style={{ flex: "1 1 120px" }} value={filters.active} onChange={setF("active")} aria-label="Active">
          <option value="">Active and inactive</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>
      {err && <p className="note bad">{err}</p>}
      <Credentials list={creds} />
      <Loading state={state}>
        {(page) =>
          !page.items?.length ? (
            <Empty>No accounts match.</Empty>
          ) : (
            <>
              <div className="tablewrap" style={{ marginTop: 12 }}>
                <table className="dtable">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email / reg no</th>
                      <th>Role</th>
                      <th>College / org</th>
                      <th>Last sign-in</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {page.items.map((u) => (
                      <tr key={u.id} style={{ opacity: u.active ? 1 : 0.55 }}>
                        <td>
                          {u.name}
                          {!u.active && <span className="tag adv" style={{ marginLeft: 6 }}>Inactive</span>}
                          {u.mustChangePassword && <span className="tag med" style={{ marginLeft: 6 }}>Temp password</span>}
                        </td>
                        <td style={{ fontSize: 14 }}>
                          {u.email || "—"}
                          {u.regNo && <small className="note" style={{ display: "block", margin: 0 }}>{u.regNo}</small>}
                        </td>
                        <td>{ROLE_LABELS[u.role]?.split(" (")[0]}</td>
                        <td style={{ fontSize: 14 }}>{u.college?.name || u.organization || "—"}</td>
                        <td style={{ fontSize: 13 }}>{u.lastLoginAt ? fmtDay(u.lastLoginAt) : "Never"}</td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          <button type="button" className="ib" title="Edit" onClick={() => setEdit(u)}>
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="ib"
                            title="Reset password"
                            onClick={async () => {
                              const r = await act(setErr, () => superApi.resetPassword(u.id), `Give ${u.name} a new temporary password?`);
                              if (r) setCreds([{ name: u.name, email: u.email, regNo: u.regNo, temporaryPassword: r.temporaryPassword }]);
                            }}
                          >
                            <KeyRound className="h-4 w-4" />
                          </button>
                          {u.id !== me.id && (
                            <button
                              type="button"
                              className="ib"
                              title="Delete"
                              onClick={async () => (await act(setErr, () => superApi.deleteUser(u.id), `Delete ${u.name}? Only accounts with no data can be deleted; otherwise deactivate them.`)) !== undefined && state.reload()}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pager page={page} onPage={(p) => setFilters({ ...filters, page: p })} />
            </>
          )
        }
      </Loading>
      {edit && (
        <Modal title={edit.id ? `Edit ${edit.name}` : "New admin"} onClose={() => setEdit(null)} wide={600}>
          <UserForm
            initial={edit}
            self={edit.id === me.id}
            onSaved={(r) => {
              setEdit(null);
              if (r?.temporaryPassword) setCreds([{ name: r.user.name, email: r.user.email, temporaryPassword: r.temporaryPassword }]);
              state.reload();
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function UserForm({ initial, self, onSaved }) {
  const editing = !!initial.id;
  const [f, setF] = useState({
    name: initial.name || "",
    email: initial.email || "",
    password: "",
    role: initial.role || "ADMIN",
    phone: initial.phone || "",
    organization: initial.organization || "",
    active: initial.active ?? true,
  });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    const r = await act(setErr, () =>
      editing
        ? superApi.updateUser(initial.id, { name: f.name.trim(), role: self ? undefined : f.role, active: self ? undefined : f.active, phone: f.phone.trim(), organization: f.organization.trim() })
        : superApi.createUser({ name: f.name.trim(), email: f.email.trim(), password: f.password || undefined, role: f.role, phone: f.phone.trim() || undefined, organization: f.organization.trim() || undefined }),
    );
    setBusy(false);
    if (r) onSaved(r);
  }

  return (
    <form onSubmit={save}>
      <div className="two">
        <Field label="Name">
          <input className="inp" value={f.name} onChange={set("name")} required maxLength={100} />
        </Field>
        <Field label="Role">
          <select className="inp" value={f.role} onChange={set("role")} disabled={self}>
            {Object.entries(ROLE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>
        {!editing && (
          <>
            <Field label="Email">
              <input className="inp" type="email" value={f.email} onChange={set("email")} required maxLength={200} />
            </Field>
            <Field label="Password" hint="Leave empty to generate a temporary one.">
              <input className="inp" value={f.password} onChange={set("password")} minLength={8} maxLength={100} autoComplete="new-password" />
            </Field>
          </>
        )}
        <Field label="Phone">
          <input className="inp" type="tel" value={f.phone} onChange={set("phone")} maxLength={20} />
        </Field>
        <Field label="Organisation">
          <input className="inp" value={f.organization} onChange={set("organization")} maxLength={150} placeholder="Anobyt Trainers" />
        </Field>
      </div>
      {editing && !self && (
        <label className="row" style={{ gap: 8, alignItems: "center", marginTop: 12 }}>
          <input type="checkbox" checked={f.active} onChange={set("active")} /> Active (unticking signs them out and blocks sign-in)
        </label>
      )}
      {err && <p className="note bad">{err}</p>}
      <button className="btn" style={{ marginTop: 16 }} disabled={busy}>
        {busy ? "Saving…" : editing ? "Save" : "Create account"}
      </button>
    </form>
  );
}

// ---- Colleges ----

export function CollegesAdmin() {
  const [q, setQ] = useState("");
  const state = useDs(() => listColleges(q), [q]);
  const [edit, setEdit] = useState(null);
  const [err, setErr] = useState("");

  return (
    <div>
      <SectionTop title="Colleges" text="The college code is what students type (or pick) on the College ID sign-in.">
        <button type="button" className="btn" onClick={() => setEdit({})}>
          <Plus className="h-4 w-4" /> New college
        </button>
      </SectionTop>
      <input className="inp" style={{ maxWidth: 360, marginBottom: 14 }} placeholder="Search colleges" value={q} onChange={(e) => setQ(e.target.value)} />
      {err && <p className="note bad">{err}</p>}
      <Loading state={state}>
        {(list) =>
          !list.length ? (
            <Empty>No colleges yet.</Empty>
          ) : (
            <div className="tablewrap">
              <table className="dtable">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Code</th>
                    <th>City</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {list.map((c) => (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td>
                        <code className="mono">{c.code}</code>
                      </td>
                      <td>{c.city || "—"}</td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <button type="button" className="ib" title="Edit" onClick={() => setEdit(c)}>
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="ib"
                          title="Delete"
                          onClick={async () => (await act(setErr, () => superApi.deleteCollege(c.id), `Delete ${c.name}? Only possible when no batch or student uses it.`)) !== undefined && state.reload()}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </Loading>
      {edit && (
        <Modal title={edit.id ? `Edit ${edit.name}` : "New college"} onClose={() => setEdit(null)}>
          <CollegeForm
            initial={edit}
            onSaved={() => {
              setEdit(null);
              state.reload();
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function CollegeForm({ initial, onSaved }) {
  const [f, setF] = useState({ name: initial.name || "", code: initial.code || "", city: initial.city || "" });
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function save(e) {
    e.preventDefault();
    const body = { name: f.name.trim(), code: f.code.trim().toUpperCase(), city: f.city.trim() || undefined };
    const r = await act(setErr, () => (initial.id ? adminApi.updateCollege(initial.id, body) : adminApi.createCollege(body)));
    if (r) onSaved(r);
  }
  return (
    <form onSubmit={save}>
      <Field label="Name">
        <input className="inp" value={f.name} onChange={set("name")} required maxLength={200} placeholder="MNNIT Allahabad" />
      </Field>
      <div className="two">
        <Field label="Code" hint="2-30 letters, digits, - or _">
          <input className="inp" value={f.code} onChange={set("code")} required minLength={2} maxLength={30} placeholder="MNNIT" />
        </Field>
        <Field label="City">
          <input className="inp" value={f.city} onChange={set("city")} maxLength={100} placeholder="Prayagraj" />
        </Field>
      </div>
      {err && <p className="note bad">{err}</p>}
      <button className="btn" style={{ marginTop: 14 }}>
        {initial.id ? "Save" : "Create college"}
      </button>
    </form>
  );
}
