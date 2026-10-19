import { useEffect, useRef, useState } from "react";
import { Download, Pause, Send } from "lucide-react";
import { adminApi, emailApi } from "../../../lib/dataService";
import { downloadCsv } from "../adminUtils";
import { Field } from "../shared";

const SUBJECT = "Anobyt Dashboard Login Credentials for Mock Interview";
const BODY = `Dear Student,
Please find your login details for the Anobyt Dashboard, which you will use to access your scheduled mock interview.

Dashboard Login Details:

Website: https://anobyt.in/login

User ID: Your Roll Number

Password: {password}

Kindly log in to the dashboard using the credentials provided above and check the details of your scheduled mock interview. Please ensure that you join the interview on time as per the schedule.

If you face any issues accessing your account, please contact the concerned team for assistance.

Best regards,
Team Anobyt`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fill = (tpl, v) => tpl.replace(/\{(name|rollNo|password|college)\}/g, (_, k) => v[k] ?? "");

/** Every student in the batch (the list is paged on the server). */
async function allStudents(batchId) {
  const out = [];
  for (let page = 0; page < 50; page++) {
    const r = await adminApi.students(batchId, { page, size: 100 });
    out.push(...(r?.items || []));
    if (!r?.totalPages || page + 1 >= r.totalPages) break;
  }
  return out;
}

/**
 * Super admin: give each student in the batch a fresh temporary password and email it to them,
 * one student at a time with a gap between emails. The server only shows a password when it is
 * created, so each one is reset first. The log (with the passwords) can be downloaded as a backup.
 */
export default function SendCredentials({ batch, onDone, onRunning }) {
  const [f, setF] = useState({ subject: SUBJECT, body: BODY, who: "pending", gap: 1 });
  const [students, setStudents] = useState(null);
  const [log, setLog] = useState([]); // {name, regNo, email, password, status, ok}
  const [phase, setPhase] = useState("setup"); // setup | running | stopped | done
  const [err, setErr] = useState("");
  const stop = useRef(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    let on = true;
    allStudents(batch.id).then(
      (s) => on && setStudents(s),
      (e) => on && setErr(e.message),
    );
    return () => {
      on = false;
    };
  }, [batch.id]);

  // Closed mid-run (window closed, page left): stop, rather than keep resetting passwords unseen.
  useEffect(
    () => () => {
      stop.current = true;
    },
    [],
  );
  useEffect(() => {
    onRunning?.(phase === "running");
  }, [phase, onRunning]);

  // Closing the tab mid-run would stop the sending: ask first.
  useEffect(() => {
    if (phase !== "running") return;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [phase]);

  const pool = (students || []).filter((s) => s.active !== false && (f.who === "all" || s.mustChangePassword));
  const targets = pool.filter((s) => s.email);
  const noEmail = pool.length - targets.length;
  const gapMs = Math.max(0, Number(f.gap) || 0) * 1000;
  const minutes = Math.ceil((targets.length * (gapMs + 1500)) / 60000);
  const sent = log.filter((l) => l.ok).length;

  async function start() {
    setErr("");
    if (!f.body.includes("{password}")) return setErr("Keep {password} in the email body, or students won't get their password.");
    if (!targets.length) return setErr("No students to email.");
    if (f.who === "all" && !confirm("This resets the password of EVERY student in the batch, including those who already chose their own. They'll have to use the emailed password. Continue?")) return;
    if (!confirm(`Reset and email login details to ${targets.length} student${targets.length === 1 ? "" : "s"}? It takes about ${minutes} minute${minutes === 1 ? "" : "s"}. Keep this tab open until it finishes.`)) return;

    // Check the email endpoint exists before resetting anyone's password.
    try {
      await emailApi.send("", "", "");
    } catch (e) {
      if (e.status === 404 || e.status === 405) return setErr("The data service can't send custom emails yet (POST /api/email/send is missing), so nothing was reset. See docs/student-credentials-email.md.");
      if (e.status === 401 || e.status === 403) return setErr("Only a super admin can send these emails.");
      // 400 (validation) means the endpoint is there.
    }

    stop.current = false;
    setLog([]);
    setPhase("running");
    for (let n = 0; n < targets.length; n++) {
      if (stop.current) break;
      const s = targets[n];
      const row = { name: s.name, regNo: s.regNo || "", email: s.email, password: "", status: "", ok: false };
      try {
        const c = await adminApi.resetStudentPassword(batch.id, s.id);
        row.password = c?.temporaryPassword || "";
        if (!row.password) throw new Error("the server didn't return a password");
        try {
          const vars = { name: s.name, rollNo: s.regNo || "", password: row.password, college: batch.college?.name || "" };
          await emailApi.send(s.email, fill(f.subject, vars), fill(f.body, vars));
          row.ok = true;
          row.status = "Sent";
        } catch (e) {
          row.status = `Password reset, email failed: ${e.message}`;
          if (e.status === 404 || e.status === 401 || e.status === 403) stop.current = true;
        }
      } catch (e) {
        row.status = `Not reset: ${e.message}`;
      }
      setLog((l) => [...l, row]);
      if (n < targets.length - 1 && !stop.current) await sleep(gapMs);
    }
    setPhase(stop.current ? "stopped" : "done");
    onDone?.();
  }

  const downloadLog = () =>
    downloadCsv(
      [["Name", "Roll / Reg no", "Email", "Temporary password", "Status"], ...log.map((l) => [l.name, l.regNo, l.email, l.password, l.status])],
      `login-emails-${batch.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.csv`,
    );

  if (students === null && !err) return <p className="note">Loading the batch's students…</p>;

  return (
    <div>
      {phase === "setup" ? (
        <>
          <div className="two">
            <Field label="Who gets it">
              <select className="inp" value={f.who} onChange={set("who")}>
                <option value="pending">Students who haven't signed in yet</option>
                <option value="all">Every student in the batch (resets everyone)</option>
              </select>
            </Field>
            <Field label="Gap between emails (seconds)">
              <input className="inp" type="number" min="0" max="60" step="0.5" value={f.gap} onChange={set("gap")} />
            </Field>
          </div>
          <p className="note" style={{ fontSize: 13 }}>
            <b>{targets.length}</b> student{targets.length === 1 ? "" : "s"} will get a new temporary password by email
            {noEmail ? `; ${noEmail} skipped (no email address)` : ""}. About {minutes} minute{minutes === 1 ? "" : "s"}.
          </p>
          <Field label="Subject">
            <input className="inp" value={f.subject} onChange={set("subject")} maxLength={200} />
          </Field>
          <Field label="Email" hint="{password} becomes each student's new password. You can also use {name}, {rollNo} and {college}.">
            <textarea className="inp" rows={16} value={f.body} onChange={set("body")} />
          </Field>
          {err && <p className="note bad">{err}</p>}
          <button type="button" className="btn" style={{ marginTop: 14 }} onClick={start} disabled={!targets.length}>
            <Send className="h-4 w-4" /> Reset and email {targets.length} student{targets.length === 1 ? "" : "s"}
          </button>
        </>
      ) : (
        <>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <b>
              {phase === "running" ? "Sending… " : phase === "stopped" ? "Stopped. " : "Done. "}
              {log.length} of {targets.length} processed · {sent} sent
              {log.length - sent ? ` · ${log.length - sent} failed` : ""}
            </b>
            <span className="row" style={{ gap: 8 }}>
              {phase === "running" && (
                <button type="button" className="btn ghost" onClick={() => (stop.current = true)}>
                  <Pause className="h-4 w-4" /> Stop after this one
                </button>
              )}
              <button type="button" className="btn ghost" onClick={downloadLog} disabled={!log.length}>
                <Download className="h-4 w-4" /> Download log
              </button>
            </span>
          </div>
          <div className="track" style={{ height: 8, borderRadius: 99, background: "var(--color-card-alt)", margin: "12px 0", overflow: "hidden" }} aria-hidden="true">
            <div style={{ height: "100%", width: `${targets.length ? (log.length / targets.length) * 100 : 0}%`, background: "var(--color-accent)", transition: "width .3s" }} />
          </div>
          {phase === "running" && <p className="note" style={{ fontSize: 13 }}>Keep this tab open until it finishes. Closing it stops the sending.</p>}
          {phase !== "running" && log.some((l) => !l.ok && l.password) && (
            <p className="note bad" style={{ fontSize: 13 }}>Some passwords were reset but not emailed. Download the log: it has those passwords, so you can share them another way.</p>
          )}
          {err && <p className="note bad">{err}</p>}
          <div className="tablewrap" style={{ maxHeight: 360, overflow: "auto" }}>
            <table className="dtable">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {[...log].reverse().map((l, i) => (
                  <tr key={i}>
                    <td>{log.length - i}</td>
                    <td>
                      {l.name}
                      <small className="note" style={{ display: "block", margin: 0 }}>{l.regNo}</small>
                    </td>
                    <td style={{ fontSize: 13 }}>{l.email}</td>
                    <td className={l.ok ? "ok" : "bad"} style={{ fontSize: 13 }}>{l.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
