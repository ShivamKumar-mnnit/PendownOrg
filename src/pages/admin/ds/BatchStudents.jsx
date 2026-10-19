import { useState } from "react";
import { useAccount } from "../../../lib/account";
import SendCredentials from "./SendCredentials";
import { Download, KeyRound, Mail, Pencil, Plus, Trash2 } from "lucide-react";
import { adminApi, downloadSheetTemplate, fmtDay } from "../../../lib/dataService";
import { Field } from "../shared";
import { Credentials, Empty, FilePick, Loading, Modal, Pager, RowErrors, act, useDs } from "./common";

const blank = { name: "", regNo: "", email: "", phone: "", domain: "", resumeLink: "" };

export default function BatchStudents({ batch, onChange }) {
  const [filters, setFilters] = useState({ q: "", page: 0 });
  const state = useDs(() => adminApi.students(batch.id, { ...filters, size: 50 }), [batch.id, filters]);
  const [edit, setEdit] = useState(null);
  const [creds, setCreds] = useState(null);
  const [bulk, setBulk] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const code = batch.college?.code;
  const { user } = useAccount();
  const [mailing, setMailing] = useState(false);
  const [sending, setSending] = useState(false);

  const refresh = () => {
    state.reload();
    onChange();
  };

  async function upload(file) {
    setBusy(true);
    const r = await act(setErr, () => adminApi.bulkStudents(batch.id, file));
    setBusy(false);
    if (r) {
      setBulk(r);
      setCreds(r.credentials);
      refresh();
    }
  }

  return (
    <div>
      <div className="row" style={{ gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <input className="inp" style={{ flex: "1 1 220px" }} placeholder="Search name, reg no, email" value={filters.q} onChange={(e) => setFilters({ q: e.target.value, page: 0 })} />
        <button type="button" className="btn" onClick={() => setEdit(blank)}>
          <Plus className="h-4 w-4" /> Add student
        </button>
        <FilePick onFile={upload} busy={busy} label="Bulk upload" />
        <button type="button" className="btn ghost" onClick={() => act(setErr, () => downloadSheetTemplate("students"))}>
          <Download className="h-4 w-4" /> Template
        </button>
        <button type="button" className="btn ghost" onClick={() => act(setErr, () => adminApi.exportStudents(batch.id))}>
          <Download className="h-4 w-4" /> Export
        </button>
        {user?.role === "SUPERADMIN" && (
          <button type="button" className="btn ghost" onClick={() => setMailing(true)}>
            <Mail className="h-4 w-4" /> Email login details
          </button>
        )}
      </div>
      {mailing && (
        <Modal
          title="Email login details to students"
          wide={760}
          onClose={() => {
            if (sending && !confirm("Emails are still being sent. Closing this stops the sending. Close anyway?")) return;
            setMailing(false);
          }}
        >
          <SendCredentials batch={batch} onRunning={setSending} onDone={refresh} />
        </Modal>
      )}
      {err && <p className="note bad">{err}</p>}
      {bulk && (
        <div className="panel" style={{ marginBottom: 12 }}>
          <b>
            {bulk.totalRows} rows read · {bulk.accountsCreated} new account{bulk.accountsCreated === 1 ? "" : "s"} · {bulk.enrolled} enrolled
            {bulk.alreadyEnrolled ? ` · ${bulk.alreadyEnrolled} already in the batch` : ""}
          </b>
          <RowErrors rows={bulk.failed} />
          <button type="button" className="linkish" style={{ marginTop: 8 }} onClick={() => setBulk(null)}>
            Dismiss
          </button>
        </div>
      )}
      <Credentials list={creds} college={code} />

      <Loading state={state}>
        {(page) =>
          !page.items?.length ? (
            <Empty>{filters.q ? "No students match." : "No students yet. Add them one by one or upload the Excel template."}</Empty>
          ) : (
            <>
              <div className="tablewrap" style={{ marginTop: 14 }}>
                <table className="dtable">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Reg no</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Domain</th>
                      <th>Login</th>
                      <th>Added</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {page.items.map((s) => (
                      <tr key={s.id} style={{ opacity: s.active ? 1 : 0.55 }}>
                        <td>
                          {s.name}
                          {s.resumeLink && (
                            <a className="linkish" href={s.resumeLink} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 6, fontSize: 12 }}>
                              resume
                            </a>
                          )}
                        </td>
                        <td>{s.regNo || "—"}</td>
                        <td>{s.email || "—"}</td>
                        <td>{s.phone || "—"}</td>
                        <td>{s.domain || "—"}</td>
                        <td>{!s.active ? <span className="tag adv">Inactive</span> : s.mustChangePassword ? <span className="tag med">Not signed in yet</span> : <span className="tag free">Active</span>}</td>
                        <td>{fmtDay(s.enrolledAt)}</td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          <button type="button" className="ib" title="Edit" onClick={() => setEdit(s)}>
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="ib"
                            title="Reset password"
                            onClick={async () => {
                              const c = await act(setErr, () => adminApi.resetStudentPassword(batch.id, s.id), `Give ${s.name} a new temporary password? Their current password stops working.`);
                              if (c) setCreds([c]);
                            }}
                          >
                            <KeyRound className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="ib"
                            title="Remove from batch"
                            onClick={async () => (await act(setErr, () => adminApi.removeStudent(batch.id, s.id), `Remove ${s.name} from this batch? Their account stays.`)) !== undefined && refresh()}
                          >
                            <Trash2 className="h-4 w-4" />
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

      {edit && (
        <Modal title={edit.id ? `Edit ${edit.name}` : "Add a student"} onClose={() => setEdit(null)} wide={620}>
          <StudentForm
            batch={batch}
            initial={edit}
            onSaved={(r) => {
              setEdit(null);
              if (r?.credential) setCreds([r.credential]);
              refresh();
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function StudentForm({ batch, initial, onSaved }) {
  const [f, setF] = useState({ ...blank, ...Object.fromEntries(Object.keys(blank).map((k) => [k, initial[k] || ""])) });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function save(e) {
    e.preventDefault();
    if (!f.regNo.trim() && !f.email.trim()) return setErr("Add a reg no or an email so the student can sign in.");
    const body = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v.trim() || undefined]));
    setBusy(true);
    const r = await act(setErr, () => (initial.id ? adminApi.updateStudent(batch.id, initial.id, body) : adminApi.addStudent(batch.id, body)));
    setBusy(false);
    if (r) onSaved(r);
  }

  return (
    <form onSubmit={save}>
      <div className="two">
        <Field label="Name">
          <input className="inp" value={f.name} onChange={set("name")} required maxLength={100} />
        </Field>
        <Field label="Reg / roll no">
          <input className="inp" value={f.regNo} onChange={set("regNo")} maxLength={50} />
        </Field>
        <Field label="Email">
          <input className="inp" type="email" value={f.email} onChange={set("email")} maxLength={200} />
        </Field>
        <Field label="Phone">
          <input className="inp" type="tel" value={f.phone} onChange={set("phone")} maxLength={20} />
        </Field>
        <Field label="Domain">
          <input className="inp" value={f.domain} onChange={set("domain")} maxLength={100} placeholder="SDE" />
        </Field>
        <Field label="Resume link">
          <input className="inp" type="url" value={f.resumeLink} onChange={set("resumeLink")} maxLength={1000} />
        </Field>
      </div>
      {!initial.id && (
        <p className="note" style={{ fontSize: 13 }}>
          A new account gets a temporary password, shown once after saving. A student who already has an account is just added to this batch.
        </p>
      )}
      {err && <p className="note bad">{err}</p>}
      <button className="btn" style={{ marginTop: 14 }} disabled={busy}>
        {busy ? "Saving…" : initial.id ? "Save" : "Add student"}
      </button>
    </form>
  );
}
