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

// Students already emailed from this browser, per batch ({studentId: time}), so a second run
// doesn't reset them again (which would make the password in their first email stop working).
const sentKey = (batchId) => `anobyt_creds_sent:${batchId}`;
function readSent(batchId) {
  try {
    return JSON.parse(localStorage.getItem(sentKey(batchId)) || "{}") || {};
  } catch {
    return {};
  }
}
function markSent(batchId, studentId) {
  try {
    localStorage.setItem(sentKey(batchId), JSON.stringify({ ...readSent(batchId), [studentId]: Date.now() }));
  } catch {
    /* storage blocked: a re-run could include them again */
  }
}

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
  const [f, setF] = useState({ subject: SUBJECT, body: BODY, who: "pending", gap: 1, skipSent: true });
  const [sentBefore, setSentBefore] = useState(() => readSent(batch.id));
  const [students, setStudents] = useState(null);
  const [log, setLog] = useState([]); // {name, regNo, email, password, status, ok}
  const [phase, setPhase] = useState("setup"); // setup | running | stopped | done
  const [err, setErr] = useState("");
  const stop = useRef(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  // "server": the data service's /api/email/student-credentials (its own template and mailbox).
  // "netlify": this site's mail function with the editable subject and body, for servers without it.
  const [mode, setMode] = useState(null);

  useEffect(() => {
    let on = true;
    allStudents(batch.id).then(
      (s) => on && setStudents(s),
      (e) => on && setErr(e.message),
    );
    // An empty list emails nobody; a 404 means the server doesn't have the endpoint.
    emailApi.studentCredentials([]).then(
      () => on && setMode("server"),
      (e) => on && setMode(e.status === 404 || e.status === 405 ? "netlify" : "server"),
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

  const eligible = (students || []).filter((s) => s.active !== false && (f.who === "all" || s.mustChangePassword));
  const alreadySent = eligible.filter((s) => sentBefore[s.id]).length;
  const pool = f.skipSent ? eligible.filter((s) => !sentBefore[s.id]) : eligible;
  const targets = pool.filter((s) => s.email);
  const noEmail = pool.length - targets.length;
  const gapMs = Math.max(0, Number(f.gap) || 0) * 1000;
  const minutes = Math.ceil((targets.length * (gapMs + 1500)) / 60000);
  const sent = log.filter((l) => l.ok).length;

  async function start() {
    setErr("");
    if (mode === "netlify" && !f.body.includes("{password}")) return setErr("Keep {password} in the email body, or students won't get their password.");
    if (!targets.length) return setErr("No students to email.");
    if (f.who === "all" && !confirm("This resets the password of EVERY student in the batch, including those who already chose their own. They'll have to use the emailed password. Continue?")) return;
    if (!confirm(`Reset and email login details to ${targets.length} student${targets.length === 1 ? "" : "s"}? It takes about ${minutes} minute${minutes === 1 ? "" : "s"}. Keep this tab open until it finishes.`)) return;

    // Netlify path: check its mailbox is set up before resetting anyone's password. An empty
    // request is refused with a 400 when it is; any other answer means emails can't go out yet.
    if (mode === "netlify")
      try {
        await emailApi.send("", "", "");
        return setErr("The mail check gave an unexpected answer, so nothing was reset.");
      } catch (e) {
        if (e.status !== 400) {
          const why =
            e.status === 404 || e.status === 405
              ? "the website's mail service isn't deployed here (it runs on the live site, not in local dev)"
              : e.status === 401 || e.status === 403
                ? "only a super admin can send these emails"
                : e.message;
          return setErr(`Can't send emails: ${why}. Nothing was reset.`);
        }
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
          if (mode === "server") {
            const r = await emailApi.studentCredentials([{ name: s.name, email: s.email, regNo: s.regNo || "", password: row.password }]);
            const d = r?.deliveries?.[0];
            if (!(r?.sent >= 1 || d?.status === "SENT")) throw new Error(d?.error || (d?.status ? `the server marked it ${d.status}` : "the server didn't send it"));
          } else {
            const vars = { name: s.name, rollNo: s.regNo || "", password: row.password, college: batch.college?.name || "" };
            await emailApi.send(s.email, fill(f.subject, vars), fill(f.body, vars));
          }
          row.ok = true;
          row.status = "Sent";
          markSent(batch.id, s.id);
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
    setSentBefore(readSent(batch.id));
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
          {alreadySent > 0 && (
            <label className="row" style={{ gap: 6, alignItems: "center", fontSize: 14, marginTop: 10 }}>
              <input type="checkbox" checked={f.skipSent} onChange={(e) => setF({ ...f, skipSent: e.target.checked })} />
              Skip the {alreadySent} student{alreadySent === 1 ? "" : "s"} already emailed from this browser (sending again gives them a new password)
            </label>
          )}
          <p className="note" style={{ fontSize: 13 }}>
            <b>{targets.length}</b> student{targets.length === 1 ? "" : "s"} will get a new temporary password by email
            {noEmail ? `; ${noEmail} skipped (no email address)` : ""}. About {minutes} minute{minutes === 1 ? "" : "s"}.
          </p>
          {mode === null ? (
            <p className="note">Checking how emails will be sent…</p>
          ) : mode === "server" ? (
            <p className="note" style={{ fontSize: 13 }}>
              Emails are sent by the Anobyt server with its login-details template (website, user ID and each student's new password), from the Anobyt mailbox.
            </p>
          ) : (
            <>
              <Field label="Subject">
                <input className="inp" value={f.subject} onChange={set("subject")} maxLength={200} />
              </Field>
              <Field label="Email" hint="{password} becomes each student's new password. You can also use {name}, {rollNo} and {college}.">
                <textarea className="inp" rows={16} value={f.body} onChange={set("body")} />
              </Field>
            </>
          )}
          {err && <p className="note bad">{err}</p>}
          <button type="button" className="btn" style={{ marginTop: 14 }} onClick={start} disabled={!targets.length || !mode}>
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
