import { useState } from "react";
import { Award, CalendarPlus, Download, ExternalLink, History, MessageSquareText, Pencil, Send, Trash2, Video, XCircle } from "lucide-react";
import { INTERVIEW_STATUS, adminApi, downloadSheetTemplate, fmtWhen, fromLocalInput, toLocalInput } from "../../../lib/dataService";
import { downloadCertificate, generateCertificate } from "../../../lib/certificate";
import { Field } from "../shared";
import { Empty, FilePick, Loading, Modal, RowErrors, act, tagFor, useDs } from "./common";

/** Mock interviews: Zoom meetings and email / WhatsApp confirmations are handled by the data service. */
export default function BatchInterviews({ batch }) {
  const [status, setStatus] = useState("");
  const state = useDs(() => adminApi.interviews(batch.id, status), [batch.id, status]);
  const [modal, setModal] = useState(null); // {kind, interview}
  const [bulkOpts, setBulkOpts] = useState({ zoom: true, confirm: true });
  const [bulk, setBulk] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const run = async (fn, text, done) => {
    const r = await act(setErr, fn, text);
    if (r !== undefined) {
      if (done) setMsg(done);
      state.reload();
    }
  };

  async function upload(file) {
    setBusy(true);
    const r = await act(setErr, () => adminApi.bulkInterviews(batch.id, file, bulkOpts.zoom, bulkOpts.confirm));
    setBusy(false);
    if (r) {
      setBulk(r);
      state.reload();
    }
  }

  function certificate(i) {
    const url = generateCertificate({
      name: i.studentName || "Student",
      domain: batch.name,
      mentor: i.mentorName,
      dateLabel: new Date(i.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
    });
    downloadCertificate(url, `anobyt-certificate-${(i.studentName || "student").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`);
  }

  return (
    <div>
      <div className="row" style={{ gap: 10, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        <select className="inp" style={{ width: "auto" }} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="">All statuses</option>
          {Object.entries(INTERVIEW_STATUS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button type="button" className="btn" onClick={() => setModal({ kind: "new" })}>
          <CalendarPlus className="h-4 w-4" /> Schedule
        </button>
        <FilePick onFile={upload} busy={busy} label="Bulk schedule" />
        <button type="button" className="btn ghost" onClick={() => act(setErr, () => downloadSheetTemplate("interviews"))}>
          <Download className="h-4 w-4" /> Template
        </button>
        <button type="button" className="btn ghost" onClick={() => act(setErr, () => adminApi.exportInterviews(batch.id))}>
          <Download className="h-4 w-4" /> Export
        </button>
      </div>
      <div className="row" style={{ gap: 16, fontSize: 13, marginBottom: 12 }}>
        <span className="note" style={{ margin: 0 }}>Bulk upload:</span>
        <label className="row" style={{ gap: 6, alignItems: "center" }}>
          <input type="checkbox" checked={bulkOpts.zoom} onChange={(e) => setBulkOpts({ ...bulkOpts, zoom: e.target.checked })} /> create Zoom meetings for rows without a link
        </label>
        <label className="row" style={{ gap: 6, alignItems: "center" }}>
          <input type="checkbox" checked={bulkOpts.confirm} onChange={(e) => setBulkOpts({ ...bulkOpts, confirm: e.target.checked })} /> send confirmations
        </label>
      </div>
      {err && <p className="note bad">{err}</p>}
      {msg && <p className="note ok">{msg}</p>}
      {bulk && (
        <div className="panel" style={{ marginBottom: 12 }}>
          <b>
            Scheduled {bulk.created} of {bulk.totalRows}.
          </b>
          <RowErrors rows={bulk.failed} />
          <RowErrors rows={bulk.warnings} title="Scheduled, but the Zoom meeting couldn't be created" />
          <button type="button" className="linkish" style={{ marginTop: 8 }} onClick={() => setBulk(null)}>
            Dismiss
          </button>
        </div>
      )}

      <Loading state={state}>
        {(list) =>
          !list.length ? (
            <Empty>No interviews {status ? "with this status" : "yet"}. Schedule one per student, or bulk upload the template.</Empty>
          ) : (
            <div className="tablewrap">
              <table className="dtable">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>When</th>
                    <th>Mentor</th>
                    <th>Meeting</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {list.map((i) => (
                    <tr key={i.id}>
                      <td>
                        {i.studentName}
                        <small className="note" style={{ display: "block", margin: 0 }}>{[i.regNo, i.studentEmail].filter(Boolean).join(" · ")}</small>
                      </td>
                      <td style={{ fontSize: 14 }}>
                        {fmtWhen(i.scheduledAt)}
                        <small className="note" style={{ display: "block", margin: 0 }}>{i.durationMinutes} min</small>
                      </td>
                      <td>{i.mentorName}</td>
                      <td style={{ fontSize: 13 }}>
                        {i.meetingLink ? (
                          <a className="linkish" href={i.meetingLink} target="_blank" rel="noopener noreferrer">
                            {i.zoomMeetingId ? "Zoom" : "Link"} <ExternalLink className="h-3 w-3" style={{ display: "inline" }} />
                          </a>
                        ) : (
                          "—"
                        )}
                        {i.meetingError && <small className="bad" style={{ display: "block" }}>{i.meetingError}</small>}
                      </td>
                      <td>
                        <span className={`tag ${tagFor(i.status)}`}>{INTERVIEW_STATUS[i.status]}</span>
                        {i.rating != null && <small style={{ display: "block" }}>{i.rating}/10</small>}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {i.status === "SCHEDULED" && (
                          <>
                            <button type="button" className="ib" title="Reschedule / edit" onClick={() => setModal({ kind: "edit", interview: i })}>
                              <Pencil className="h-4 w-4" />
                            </button>
                            {!i.meetingLink && (
                              <button type="button" className="ib" title="Create Zoom meeting" onClick={() => run(() => adminApi.zoomInterview(i.id, true), null, "Zoom meeting created and the student notified.")}>
                                <Video className="h-4 w-4" />
                              </button>
                            )}
                            <button type="button" className="ib" title="Resend confirmation" onClick={() => run(() => adminApi.resendInterview(i.id), "Send the confirmation again by email and WhatsApp?", "Confirmation sent again.")}>
                              <Send className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className="ib"
                              title="Cancel interview"
                              onClick={() => run(() => adminApi.updateInterview(i.id, { status: "CANCELLED" }), `Cancel ${i.studentName}'s interview? The Zoom meeting is deleted and the student is told.`)}
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button type="button" className="ib" title="Feedback and result" onClick={() => setModal({ kind: "feedback", interview: i })}>
                          <MessageSquareText className="h-4 w-4" />
                        </button>
                        {i.status === "COMPLETED" && (
                          <button type="button" className="ib" title="Download certificate" onClick={() => certificate(i)}>
                            <Award className="h-4 w-4" />
                          </button>
                        )}
                        <button type="button" className="ib" title="Delivery history" onClick={() => setModal({ kind: "log", interview: i })}>
                          <History className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="ib"
                          title="Delete"
                          onClick={() => run(() => adminApi.deleteInterview(i.id, i.status === "SCHEDULED"), `Delete ${i.studentName}'s interview${i.status === "SCHEDULED" ? " and tell the student" : ""}?`)}
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

      {modal?.kind === "new" && (
        <Modal title="Schedule an interview" onClose={() => setModal(null)} wide={640}>
          <ScheduleForm
            batch={batch}
            onSaved={(r) => {
              setModal(null);
              setMsg(r.meetingError ? `Scheduled, but the meeting link failed: ${r.meetingError}` : "Interview scheduled.");
              state.reload();
            }}
          />
        </Modal>
      )}
      {modal?.kind === "edit" && (
        <Modal title={`Reschedule ${modal.interview.studentName}`} onClose={() => setModal(null)} wide={640}>
          <ScheduleForm
            batch={batch}
            initial={modal.interview}
            onSaved={() => {
              setModal(null);
              setMsg("Interview updated.");
              state.reload();
            }}
          />
        </Modal>
      )}
      {modal?.kind === "feedback" && (
        <Modal title={`Result for ${modal.interview.studentName}`} onClose={() => setModal(null)}>
          <FeedbackForm
            interview={modal.interview}
            onSaved={() => {
              setModal(null);
              state.reload();
            }}
          />
        </Modal>
      )}
      {modal?.kind === "log" && <DeliveryLog interview={modal.interview} onClose={() => setModal(null)} />}
    </div>
  );
}

function ScheduleForm({ batch, initial, onSaved }) {
  const editing = !!initial;
  const [q, setQ] = useState("");
  const students = useDs(() => (editing ? Promise.resolve({ items: [] }) : adminApi.students(batch.id, { q, size: 100 })), [batch.id, q, editing]);
  const [f, setF] = useState({
    studentId: "",
    mentorName: initial?.mentorName || "",
    mentorEmail: initial?.mentorEmail || "",
    scheduledAt: toLocalInput(initial?.scheduledAt),
    durationMinutes: initial?.durationMinutes || 30,
    meetingLink: initial?.meetingLink || "",
    createZoomMeeting: true,
    sendConfirmation: true,
  });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  async function save(e) {
    e.preventDefault();
    if (!editing && !f.studentId) return setErr("Pick a student.");
    const when = fromLocalInput(f.scheduledAt);
    if (!when) return setErr("Pick a date and time.");
    const common = {
      mentorName: f.mentorName.trim(),
      mentorEmail: f.mentorEmail.trim() || undefined,
      scheduledAt: when,
      durationMinutes: Number(f.durationMinutes),
      sendConfirmation: f.sendConfirmation,
    };
    setBusy(true);
    const r = await act(setErr, () =>
      editing
        ? adminApi.updateInterview(initial.id, { ...common, meetingLink: f.meetingLink.trim() || undefined })
        : adminApi.scheduleInterview(batch.id, { ...common, studentId: f.studentId, meetingLink: f.meetingLink.trim(), createZoomMeeting: !f.meetingLink.trim() && f.createZoomMeeting }),
    );
    setBusy(false);
    if (r) onSaved(r);
  }

  return (
    <form onSubmit={save}>
      {!editing && (
        <>
          <Field label="Student">
            <input className="inp" placeholder="Search the batch" value={q} onChange={(e) => setQ(e.target.value)} />
          </Field>
          <select className="inp" size={5} style={{ marginTop: 6, height: "auto" }} value={f.studentId} onChange={set("studentId")} aria-label="Student" required>
            {(students.data?.items || []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.regNo ? ` · ${s.regNo}` : ""}
                {s.domain ? ` · ${s.domain}` : ""}
              </option>
            ))}
          </select>
          {students.data && !students.data.items?.length && <p className="note" style={{ fontSize: 13 }}>No students found. Add students to the batch first.</p>}
        </>
      )}
      <div className="two">
        <Field label="Mentor name">
          <input className="inp" value={f.mentorName} onChange={set("mentorName")} required maxLength={100} />
        </Field>
        <Field label="Mentor email (gets the invite)">
          <input className="inp" type="email" value={f.mentorEmail} onChange={set("mentorEmail")} maxLength={200} />
        </Field>
        <Field label="Date and time">
          <input className="inp" type="datetime-local" value={f.scheduledAt} onChange={set("scheduledAt")} required />
        </Field>
        <Field label="Minutes">
          <input className="inp" type="number" min="5" max="480" value={f.durationMinutes} onChange={set("durationMinutes")} required />
        </Field>
      </div>
      <Field label="Meeting link" hint={editing ? "Leave as is to keep the current meeting; rescheduling also moves a Zoom meeting." : "Leave empty to create a Zoom meeting automatically."}>
        <input className="inp" type="url" value={f.meetingLink} onChange={set("meetingLink")} maxLength={1000} placeholder="https://meet.google.com/…" />
      </Field>
      <div className="row" style={{ gap: 18, marginTop: 12, fontSize: 14 }}>
        {!editing && !f.meetingLink.trim() && (
          <label className="row" style={{ gap: 6, alignItems: "center" }}>
            <input type="checkbox" checked={f.createZoomMeeting} onChange={set("createZoomMeeting")} /> Create Zoom meeting
          </label>
        )}
        <label className="row" style={{ gap: 6, alignItems: "center" }}>
          <input type="checkbox" checked={f.sendConfirmation} onChange={set("sendConfirmation")} /> {editing ? "Tell the student about the change" : "Send email + WhatsApp confirmation"}
        </label>
      </div>
      {err && <p className="note bad">{err}</p>}
      <button className="btn" style={{ marginTop: 16 }} disabled={busy}>
        {busy ? "Saving…" : editing ? "Save changes" : "Schedule interview"}
      </button>
    </form>
  );
}

function FeedbackForm({ interview, onSaved }) {
  const [f, setF] = useState({
    status: interview.status === "SCHEDULED" ? "COMPLETED" : interview.status,
    rating: interview.rating ?? "",
    feedback: interview.feedback || "",
  });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    const r = await act(setErr, () =>
      adminApi.updateInterview(interview.id, {
        status: f.status,
        rating: f.rating === "" ? undefined : Number(f.rating),
        feedback: f.feedback.trim() || undefined,
        sendConfirmation: false,
      }),
    );
    setBusy(false);
    if (r) onSaved(r);
  }
  return (
    <form onSubmit={save}>
      <div className="two">
        <Field label="Outcome">
          <select className="inp" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
            <option value="COMPLETED">Completed</option>
            <option value="NO_SHOW">No show</option>
            <option value="CANCELLED">Cancelled</option>
            {interview.status === "SCHEDULED" && <option value="SCHEDULED">Still scheduled</option>}
          </select>
        </Field>
        <Field label="Rating (1-10)">
          <input className="inp" type="number" min="1" max="10" value={f.rating} onChange={(e) => setF({ ...f, rating: e.target.value })} />
        </Field>
      </div>
      <Field label="Feedback (the student sees this)">
        <textarea className="inp" rows={4} value={f.feedback} onChange={(e) => setF({ ...f, feedback: e.target.value })} maxLength={10000} placeholder="Strong DSA, work on system design." />
      </Field>
      {err && <p className="note bad">{err}</p>}
      <button className="btn" style={{ marginTop: 14 }} disabled={busy}>
        {busy ? "Saving…" : "Save result"}
      </button>
    </form>
  );
}

function DeliveryLog({ interview, onClose }) {
  const state = useDs(() => adminApi.interviewLog(interview.id), [interview.id]);
  return (
    <Modal title="Email and WhatsApp delivery" onClose={onClose} wide={680}>
      <Loading state={state}>
        {(rows) =>
          !rows.length ? (
            <Empty>Nothing sent for this interview yet.</Empty>
          ) : (
            <div className="tablewrap">
              <table className="dtable">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Channel</th>
                    <th>To</th>
                    <th>Message</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((n) => (
                    <tr key={n.id}>
                      <td style={{ fontSize: 13 }}>{fmtWhen(n.createdAt)}</td>
                      <td>{n.channel}</td>
                      <td style={{ fontSize: 13 }}>{n.recipient}</td>
                      <td style={{ fontSize: 13 }}>{(n.purpose || "").replace(/_/g, " ").toLowerCase()}</td>
                      <td>
                        <span className={n.status === "SENT" ? "ok" : n.status === "FAILED" ? "bad" : "note"}>{n.status}</span>
                        {n.error && <small className="bad" style={{ display: "block" }}>{n.error}</small>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </Loading>
    </Modal>
  );
}
