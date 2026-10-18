import { useEffect, useRef, useState } from "react";
import { Award, CalendarPlus, ClipboardPen, Download, History, Link2, Pencil, Search, Send, Trash2, Video, X, XCircle } from "lucide-react";
import Select from "../../../components/Select";
import { INTERVIEW_STATUS, MEETING_PLATFORMS, adminApi, downloadSheetTemplate, fmtWhen, fromLocalInput, interviewApi, isLegacyInterviews, ordinal, superApi, toLocalInput } from "../../../lib/dataService";
import { downloadCertificate, generateCertificate } from "../../../lib/certificate";
import { createTeamsMeeting, meetingSubject, microsoftToken, teamsConfigured } from "../../../lib/teams";
import { Field } from "../shared";
import { Empty, FilePick, Loading, Modal, RowErrors, act, tagFor, useDs } from "./common";
import { LinkCell, LinksForm, ScorecardEditor, emailMeeting, interviewLabel, saveLinks } from "./interviewUi";

const statusTag = (s) => (s === "DONE" ? "free" : s === "UPCOMING" ? "" : tagFor(s));

/** Mock interviews for a batch: scheduling, Teams links, recordings and score cards. Confirmations are sent by the data service. */
export default function BatchInterviews({ batch }) {
  const [status, setStatus] = useState("");
  const state = useDs(() => adminApi.interviews(batch.id, status), [batch.id, status]);
  const [modal, setModal] = useState(null); // {kind, interview}
  const [confirmBulk, setConfirmBulk] = useState(true);
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
  const closeAnd = (text) => () => {
    setModal(null);
    if (text) setMsg(text);
    state.reload();
  };
  async function emailRow(i) {
    if (!confirm(`Email the meeting link and a calendar invite to ${i.studentName} and ${i.mentorName || "the trainer"}?`)) return;
    setMsg("");
    const r = await act(setErr, () => emailMeeting(i, { meetingLink: i.meetingLink, meetingPlatform: i.meetingPlatform }));
    if (r) (r.ok ? setMsg : setErr)(r.text);
  }

  async function upload(file) {
    setBusy(true);
    // Email only: no server confirmations (they also go by WhatsApp); meeting emails are sent below.
    const r = await act(setErr, () => adminApi.bulkInterviews(batch.id, file, false, false));
    if (r && confirmBulk && r.interviewIds?.length) {
      const created = new Set(r.interviewIds);
      const all = await adminApi.interviews(batch.id).catch(() => []);
      const withLink = all.filter((i) => created.has(i.id) && i.meetingLink);
      let sent = 0;
      const failed = [];
      for (const i of withLink) {
        try {
          if ((await emailMeeting(i, { meetingLink: i.meetingLink, meetingPlatform: i.meetingPlatform })).ok) sent++;
          else failed.push(i.studentName);
        } catch {
          failed.push(i.studentName);
        }
      }
      r.emailNote =
        `Emailed ${sent} of ${withLink.length} interview${withLink.length === 1 ? "" : "s"} with a link.` +
        (failed.length ? ` Not sent for: ${failed.join(", ")}.` : "") +
        (withLink.length < r.interviewIds.length ? " The rest get their email when you add the link." : "");
    }
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

  const noLink = (state.data || []).filter((i) => (i.status === "UPCOMING" || i.status === "IN_PROGRESS") && !i.meetingLink);

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
        {!isLegacyInterviews() && (
          <button type="button" className="btn ghost" onClick={() => act(setErr, () => interviewApi.exportScorecards(batch.id))}>
            <Download className="h-4 w-4" /> Export score cards
          </button>
        )}
        {noLink.length > 0 && (
          <button type="button" className="btn ghost" onClick={() => setModal({ kind: "missing" })}>
            <Link2 className="h-4 w-4" /> Fill missing links ({noLink.length})
          </button>
        )}
      </div>
      <label className="row" style={{ gap: 6, alignItems: "center", fontSize: 13, marginBottom: 12 }}>
        <input type="checkbox" checked={confirmBulk} onChange={(e) => setConfirmBulk(e.target.checked)} /> Bulk upload: send email to the student and trainer (rows with a meeting link)
      </label>
      {err && <p className="note bad">{err}</p>}
      {msg && <p className="note ok">{msg}</p>}
      {bulk && (
        <div className="panel" style={{ marginBottom: 12 }}>
          <b>
            Scheduled {bulk.created} of {bulk.totalRows}.
          </b>
          {bulk.emailNote && <p className="note" style={{ fontSize: 13 }}>{bulk.emailNote}</p>}
          {bulk.created > 0 && <p className="note" style={{ fontSize: 13 }}>Rows without a meeting link are listed under "Fill missing links".</p>}
          <RowErrors rows={bulk.failed} />
          <RowErrors rows={bulk.warnings} title="Scheduled with warnings" />
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
                    <th>No</th>
                    <th>Student</th>
                    <th>When</th>
                    <th>Interviewer</th>
                    <th>Meeting</th>
                    <th>Recording</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {list.map((i) => {
                    const live = i.status === "UPCOMING" || i.status === "IN_PROGRESS";
                    return (
                      <tr key={i.id}>
                        <td>
                          {interviewLabel(i)}
                          {i.studentInterviewNo ? <small className="note" style={{ display: "block", margin: 0 }}>{ordinal(i.studentInterviewNo)}</small> : null}
                        </td>
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
                          <LinkCell href={i.meetingLink} label={MEETING_PLATFORMS[i.meetingPlatform] || (i.zoomMeetingId ? "Zoom" : "Link")} />
                          {i.meetingError && <small className="bad" style={{ display: "block" }}>{i.meetingError}</small>}
                        </td>
                        <td style={{ fontSize: 13 }}>
                          <LinkCell href={i.recordingLink} label="Recording" />
                        </td>
                        <td>
                          <span className={`tag ${statusTag(i.status)}`}>{INTERVIEW_STATUS[i.status] || i.status}</span>
                          {i.scorecard?.exists && (
                            <small style={{ display: "block" }}>
                              {i.scorecard.overallPercent != null ? `${Math.round(i.scorecard.overallPercent * 10) / 10}%` : "Scored"}
                              {i.scorecard.published ? " · published" : ""}
                            </small>
                          )}
                          {!i.scorecard && i.rating != null && <small style={{ display: "block" }}>{i.rating}/10</small>}
                        </td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          <button type="button" className="ib" title="Meeting and recording links" onClick={() => setModal({ kind: "links", interview: i })}>
                            <Link2 className="h-4 w-4" />
                          </button>
                          {live && (
                            <>
                              <button type="button" className="ib" title="Reschedule / edit" onClick={() => setModal({ kind: "edit", interview: i })}>
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button type="button" className="ib" title={i.meetingLink ? "Email the meeting link to the student and trainer" : "Add the meeting link first"} disabled={!i.meetingLink} onClick={() => emailRow(i)}>
                                <Send className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                className="ib"
                                title="Cancel interview"
                                onClick={() => run(() => adminApi.updateInterview(i.id, { status: "CANCELLED" }), `Cancel ${i.studentName}'s interview? The student is told.`)}
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {!isLegacyInterviews() && i.status !== "CANCELLED" && (
                            <button type="button" className="ib" title="Score card" onClick={() => setModal({ kind: "score", interview: i })}>
                              <ClipboardPen className="h-4 w-4" />
                            </button>
                          )}
                          <button type="button" className="ib" title="Outcome and short feedback" onClick={() => setModal({ kind: "feedback", interview: i })}>
                            <Pencil className="h-4 w-4" style={{ opacity: 0.6 }} />
                          </button>
                          {i.status === "DONE" && (
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
                            onClick={() => run(() => adminApi.deleteInterview(i.id, live), `Delete ${i.studentName}'s interview${live ? " and tell the student" : ""}?`)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        }
      </Loading>

      {modal?.kind === "new" && (
        <Modal title="Schedule an interview" onClose={() => setModal(null)} wide={680}>
          <ScheduleForm
            batch={batch}
            onSaved={(r, note) => {
              setModal(null);
              setMsg(note);
              state.reload();
            }}
          />
        </Modal>
      )}
      {modal?.kind === "edit" && (
        <Modal title={`Reschedule ${modal.interview.studentName}`} onClose={() => setModal(null)} wide={680}>
          <ScheduleForm batch={batch} initial={modal.interview} onSaved={(_, note) => closeAnd(note)()} />
        </Modal>
      )}
      {modal?.kind === "links" && (
        <Modal title={`Links for interview ${interviewLabel(modal.interview)}`} onClose={() => setModal(null)} wide={620}>
          <LinksForm interview={modal.interview} onSaved={(_, note) => closeAnd(note)()} />
        </Modal>
      )}
      {modal?.kind === "score" && (
        <Modal title={`Score card: ${modal.interview.studentName}`} onClose={() => setModal(null)} wide={860}>
          <ScorecardEditor interview={modal.interview} onSaved={(_, published) => closeAnd(published ? "Score card saved and published." : "Score card saved.")()} />
        </Modal>
      )}
      {modal?.kind === "missing" && (
        <Modal title="Fill missing meeting links" onClose={closeAnd()} wide={860}>
          <MissingLinks rows={noLink} onChange={() => state.reload()} />
        </Modal>
      )}
      {modal?.kind === "feedback" && (
        <Modal title={`Result for ${modal.interview.studentName}`} onClose={() => setModal(null)}>
          <FeedbackForm interview={modal.interview} onSaved={closeAnd()} />
        </Modal>
      )}
      {modal?.kind === "log" && <DeliveryLog interview={modal.interview} onClose={() => setModal(null)} />}
    </div>
  );
}

/** Trainer accounts for the interviewer picker: {list}, with list null when the server can't list them yet. */
function useTrainers() {
  return useDs(() => loadTrainers(), []);
}

const asList = (r) => (Array.isArray(r) ? r : r?.items || r?.content || []);

/**
 * Trainer accounts: /api/trainers, or (super admins) the account list when that endpoint is
 * missing or failing, e.g. on a server deployed without the trainer-interviews update.
 * Resolves {list, error}: list is null only when neither source worked.
 */
async function loadTrainers() {
  let error = "";
  try {
    return { list: asList(await interviewApi.trainers()), error };
  } catch (e) {
    error = e.status === 404 ? "the server has no trainer list (/api/trainers not found)" : e.message;
  }
  try {
    const [admins, supers] = await Promise.all([superApi.users({ role: "ADMIN", size: 100, active: true }), superApi.users({ role: "SUPERADMIN", size: 100, active: true })]);
    const list = [...asList(admins), ...asList(supers)].map((u) => ({ id: u.id, name: u.name, email: u.email, organization: u.organization }));
    return { list: list.sort((a, b) => (a.name || "").localeCompare(b.name || "")), error: "" };
  } catch {
    return { list: null, error };
  }
}

function ScheduleForm({ batch, initial, onSaved }) {
  const editing = !!initial;
  const [student, setStudent] = useState(null);
  const trainers = useTrainers();
  const trainerList = trainers.data?.list?.length ? trainers.data.list : null;
  const trainersLoading = trainers.data === null && !trainers.error;
  // Why the dropdown is missing, shown under the manual fields.
  const trainerNote = trainersLoading
    ? ""
    : trainers.data?.list?.length === 0
      ? "No trainer accounts yet. Create one in Admin panel > Accounts (role Admin), or type the interviewer here."
      : `Couldn't load the trainer list: ${trainers.data?.error || trainers.error || "unknown error"}. Type the interviewer here for now.`;
  const [f, setF] = useState({
    studentId: "",
    interviewerId: initial?.interviewerId || "",
    mentorName: initial?.mentorName || "",
    mentorEmail: initial?.mentorEmail || "",
    scheduledAt: toLocalInput(initial?.scheduledAt),
    durationMinutes: initial?.durationMinutes || 30,
    studentInterviewNo: initial?.studentInterviewNo || "",
    meetingLink: initial?.meetingLink || "",
    meetingPlatform: initial?.meetingPlatform || "TEAMS",
    sendEmail: true,
    message: "",
  });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const studentName = editing ? initial.studentName : student?.name;
  const trainer = trainerList?.find((t) => t.id === f.interviewerId);

  async function teams() {
    setErr("");
    if (!f.scheduledAt) return setErr("Pick the date and time first.");
    setBusy("teams");
    try {
      const m = await createTeamsMeeting({
        subject: meetingSubject({ interviewNo: initial?.interviewNo, studentName, mentorName: trainer?.name || f.mentorName }),
        startsAt: fromLocalInput(f.scheduledAt),
        minutes: Number(f.durationMinutes) || 30,
      });
      setF((x) => ({ ...x, meetingLink: m.joinUrl, meetingPlatform: "TEAMS" }));
    } catch (e) {
      setErr(e.message);
    }
    setBusy("");
  }

  async function save(e) {
    e.preventDefault();
    if (!editing && !f.studentId) return setErr("Pick a student.");
    if (!f.interviewerId && !f.mentorName.trim()) return setErr("Pick the interviewer.");
    const when = fromLocalInput(f.scheduledAt);
    if (!when) return setErr("Pick a date and time.");
    const common = {
      interviewerId: f.interviewerId || undefined,
      mentorName: (trainer?.name || f.mentorName).trim(),
      mentorEmail: (trainer?.email || f.mentorEmail).trim() || undefined,
      scheduledAt: when,
      durationMinutes: Number(f.durationMinutes),
      studentInterviewNo: f.studentInterviewNo ? Number(f.studentInterviewNo) : undefined,
      meetingPlatform: f.meetingLink.trim() ? f.meetingPlatform : undefined,
      // Email only: the meeting email below replaces the server's email + WhatsApp confirmation.
      sendConfirmation: false,
    };
    const link = f.meetingLink.trim();
    setBusy("save");
    const r = await act(setErr, () =>
      editing
        ? adminApi.updateInterview(initial.id, { ...common, meetingLink: link || undefined })
        : adminApi.scheduleInterview(batch.id, { ...common, studentId: f.studentId, meetingLink: link, createZoomMeeting: false }),
    );
    if (!r) return setBusy("");
    let note = editing ? "Interview updated." : "Interview scheduled.";
    if (f.sendEmail && link) {
      try {
        // The saved interview, with emails filled from the form in case the response leaves them out.
        const saved = { ...initial, ...r };
        saved.studentEmail ||= student?.email;
        saved.studentName ||= student?.name;
        saved.mentorEmail ||= trainer?.email || f.mentorEmail.trim() || undefined;
        saved.mentorName ||= trainer?.name || f.mentorName.trim();
        note += ` ${(await emailMeeting(saved, { meetingLink: link, meetingPlatform: f.meetingPlatform, message: f.message })).text}`;
      } catch (x) {
        note += ` The email failed: ${x.message} Use the send button on the row to try again.`;
      }
    } else if (!link) {
      note += " Add the Teams link from the links button when it's ready; the email goes out then.";
    }
    setBusy("");
    onSaved(r, note);
  }

  return (
    <form onSubmit={save}>
      {!editing && (
        <>
          <Field label="Student">
            <StudentPicker
              batchId={batch.id}
              value={student}
              onChange={(s) => {
                setStudent(s);
                setF((x) => ({ ...x, studentId: s?.id || "" }));
              }}
            />
          </Field>
        </>
      )}
      <div className="two">
        {trainerList ? (
          <Field label="Interviewer (trainer)" hint="The interview shows on this trainer's dashboard.">
            <Select
              value={f.interviewerId}
              onChange={(v) => setF((x) => ({ ...x, interviewerId: v }))}
              placeholder="Choose a trainer…"
              options={trainerList.map((t) => ({ value: t.id, label: t.email ? `${t.name} · ${t.email}` : t.name }))}
            />
          </Field>
        ) : (
          trainersLoading ? (
          <Field label="Interviewer (trainer)">
            <input className="inp" disabled placeholder="Loading trainers…" />
          </Field>
        ) : (
          <Field label="Interviewer name" hint={trainerNote}>
            <input className="inp" value={f.mentorName} onChange={set("mentorName")} required maxLength={100} />
          </Field>
        )
        )}
        {trainerList ? (
          <Field label="Student's interview">
            <Select
              value={String(f.studentInterviewNo)}
              onChange={(v) => setF((x) => ({ ...x, studentInterviewNo: v }))}
              options={[{ value: "", label: "Next one (automatic)" }, ...[1, 2, 3, 4].map((n) => ({ value: String(n), label: `${ordinal(n)} interview` }))]}
            />
          </Field>
        ) : (
          <Field label="Interviewer email" hint="Use the trainer's login email so it shows on their dashboard.">
            <input className="inp" type="email" value={f.mentorEmail} onChange={set("mentorEmail")} maxLength={200} />
          </Field>
        )}
        <Field label="Date and time">
          <input className="inp" type="datetime-local" value={f.scheduledAt} onChange={set("scheduledAt")} required />
        </Field>
        <Field label="Minutes">
          <input className="inp" type="number" min="5" max="480" value={f.durationMinutes} onChange={set("durationMinutes")} required />
        </Field>
      </div>
      <Field label="Teams meeting link" hint="Optional now: you can add it later from the links button or 'Fill missing links'.">
        <div className="row" style={{ gap: 8, flexWrap: "nowrap" }}>
          <input className="inp" type="url" value={f.meetingLink} onChange={set("meetingLink")} maxLength={1000} placeholder="https://teams.microsoft.com/l/meetup-join/…" />
          {teamsConfigured() && (
            <button type="button" className="btn ghost" style={{ flexShrink: 0 }} onClick={teams} disabled={!!busy}>
              <Video className="h-4 w-4" /> {busy === "teams" ? "Creating…" : "Create"}
            </button>
          )}
        </div>
      </Field>
      {f.meetingLink.trim() && (
        <Field label="Platform">
          <select className="inp" value={f.meetingPlatform} onChange={set("meetingPlatform")}>
            {Object.entries(MEETING_PLATFORMS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>
      )}
      <label className="row" style={{ gap: 6, alignItems: "center", marginTop: 12, fontSize: 14 }}>
        <input type="checkbox" checked={f.sendEmail} onChange={set("sendEmail")} disabled={!f.meetingLink.trim()} />
        {editing ? "Email the updated details" : "Send email"} to the student and trainer, with a calendar invite
      </label>
      {!f.meetingLink.trim() && <p className="note" style={{ fontSize: 13, margin: "4px 0 0" }}>The email needs the meeting link. Without one, it's sent when you add the link.</p>}
      {f.sendEmail && f.meetingLink.trim() && (
        <Field label="Note in the email (optional)">
          <input className="inp" value={f.message} onChange={set("message")} maxLength={1000} placeholder="Please join 5 minutes early." />
        </Field>
      )}
      {err && <p className="note bad">{err}</p>}
      <button className="btn" style={{ marginTop: 16 }} disabled={!!busy}>
        {busy === "save" ? "Saving…" : editing ? "Save changes" : f.sendEmail && f.meetingLink.trim() ? "Schedule and send email" : "Schedule interview"}
      </button>
    </form>
  );
}

/**
 * Search the batch and pick one student. The chosen student shows in the bar with an × to
 * change it; arrow keys and Enter work in the list.
 */
function StudentPicker({ batchId, value, onChange }) {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const ref = useRef(null);
  const inputRef = useRef(null);
  const students = useDs(() => adminApi.students(batchId, { q: debounced, size: 50 }), [batchId, debounced]);
  const items = students.data?.items || [];

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => {
    const away = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, []);

  function pick(s) {
    onChange(s);
    setOpen(false);
    setQ("");
  }

  function onKey(e) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setHi((h) => Math.max(0, Math.min(items.length - 1, h + (e.key === "ArrowDown" ? 1 : -1))));
    } else if (e.key === "Enter" && open && items[hi]) {
      e.preventDefault();
      pick(items[hi]);
    } else if (e.key === "Escape" && open) {
      e.stopPropagation();
      setOpen(false);
    }
  }

  if (value)
    return (
      <div className="inp picked">
        <span>
          <b>{value.name}</b>
          {value.regNo && <span className="note"> · {value.regNo}</span>}
          {value.domain && <span className="note"> · {value.domain}</span>}
        </span>
        <button
          type="button"
          className="ib"
          title="Change student"
          aria-label="Change student"
          onClick={() => {
            onChange(null);
            setOpen(true);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );

  return (
    <div ref={ref} className={`picker${open ? " open" : ""}`}>
      <div className="picker-bar">
        <Search className="h-4 w-4" aria-hidden="true" />
        <input
          ref={inputRef}
          className="inp"
          placeholder="Search by name or reg no"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setHi(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          role="combobox"
          aria-expanded={open}
          aria-controls="student-options"
          aria-autocomplete="list"
          autoComplete="off"
        />
      </div>
      {open && (
        <ul id="student-options" role="listbox" className="picker-list">
          {students.data === null ? (
            <li className="note">Loading…</li>
          ) : !items.length ? (
            <li className="note">{debounced ? "No student matches that." : "No students in this batch yet."}</li>
          ) : (
            items.map((s, n) => (
              <li key={s.id}>
                <button type="button" role="option" aria-selected={n === hi} className={n === hi ? "on" : ""} onMouseEnter={() => setHi(n)} onClick={() => pick(s)}>
                  <span>{s.name}</span>
                  <small>{[s.regNo, s.domain].filter(Boolean).join(" · ")}</small>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

/** Upcoming interviews without a meeting link: paste each Teams link, or create them all in Teams. */
function MissingLinks({ rows, onChange }) {
  const [links, setLinks] = useState({});
  const [done, setDone] = useState({});
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");
  const [email, setEmail] = useState(true);
  const left = rows.filter((i) => !done[i.id]);

  /** Saves one link and, when ticked, emails it; done[id] holds what to show in the row. */
  async function saveOne(i, link) {
    await saveLinks(i, { meetingLink: link, meetingPlatform: "TEAMS" });
    let shown = { text: "Saved", ok: true };
    if (email) {
      try {
        const r = await emailMeeting(i, { meetingLink: link, meetingPlatform: "TEAMS" });
        shown = { text: r.ok ? "Saved · emailed" : `Saved · ${r.text}`, ok: r.ok };
      } catch (e) {
        shown = { text: `Saved · email failed: ${e.message}`, ok: false };
      }
    }
    setDone((d) => ({ ...d, [i.id]: shown }));
  }

  async function savePasted() {
    setErr("");
    setBusy("paste");
    const todo = left.filter((i) => (links[i.id] || "").trim());
    for (const i of todo) {
      try {
        await saveOne(i, links[i.id].trim());
      } catch (e) {
        setErr(`${i.studentName}: ${e.message}`);
        break;
      }
    }
    setBusy("");
    onChange();
  }

  async function createAll() {
    setErr("");
    setBusy("teams");
    try {
      const token = await microsoftToken();
      for (const i of left) {
        const m = await createTeamsMeeting({ subject: meetingSubject(i), startsAt: i.scheduledAt, minutes: i.durationMinutes }, token);
        await saveOne(i, m.joinUrl);
      }
    } catch (e) {
      setErr(e.message);
    }
    setBusy("");
    onChange();
  }

  return (
    <div>
      <p className="note" style={{ marginTop: 0, fontSize: 14 }}>
        {teamsConfigured()
          ? "Create a Teams meeting for each interview in one go (you sign in with your Microsoft account once), or paste links yourself."
          : "Create each meeting in Teams, paste its join link here and save. Students see the link on their dashboard."}
      </p>
      <label className="row" style={{ gap: 6, alignItems: "center", fontSize: 14, marginBottom: 12 }}>
        <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} /> Send email to the student and trainer as each link is saved
      </label>
      {teamsConfigured() && left.length > 0 && (
        <button type="button" className="btn" onClick={createAll} disabled={!!busy} style={{ marginBottom: 12 }}>
          <Video className="h-4 w-4" /> {busy === "teams" ? "Creating meetings…" : `Create ${left.length} Teams meeting${left.length === 1 ? "" : "s"}`}
        </button>
      )}
      <div className="tablewrap">
        <table className="dtable">
          <thead>
            <tr>
              <th>Student</th>
              <th>When</th>
              <th>Interviewer</th>
              <th>Teams link</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((i) => (
              <tr key={i.id}>
                <td>
                  {i.studentName}
                  {i.studentInterviewNo ? <small className="note" style={{ display: "block", margin: 0 }}>{ordinal(i.studentInterviewNo)} interview</small> : null}
                </td>
                <td style={{ fontSize: 13 }}>{fmtWhen(i.scheduledAt)}</td>
                <td>{i.mentorName}</td>
                <td style={{ minWidth: 260 }}>
                  {done[i.id] ? (
                    <span className={done[i.id].ok ? "ok" : "bad"} style={{ fontSize: 13 }}>{done[i.id].text}</span>
                  ) : (
                    <input
                      className="inp"
                      type="url"
                      value={links[i.id] || ""}
                      onChange={(e) => setLinks({ ...links, [i.id]: e.target.value })}
                      placeholder="https://teams.microsoft.com/l/meetup-join/…"
                      aria-label={`Teams link for ${i.studentName}`}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {err && <p className="note bad">{err}</p>}
      <button type="button" className="btn" style={{ marginTop: 14 }} disabled={!!busy || !left.some((i) => (links[i.id] || "").trim())} onClick={savePasted}>
        {busy === "paste" ? "Saving…" : "Save pasted links"}
      </button>
    </div>
  );
}

function FeedbackForm({ interview, onSaved }) {
  const [f, setF] = useState({
    status: interview.status === "UPCOMING" || interview.status === "IN_PROGRESS" ? "DONE" : interview.status,
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
            <option value="DONE">Done</option>
            <option value="NO_SHOW">No show</option>
            <option value="CANCELLED">Cancelled</option>
            {interview.status === "UPCOMING" && <option value="UPCOMING">Still upcoming</option>}
          </select>
        </Field>
        <Field label="Rating (1-10)">
          <input className="inp" type="number" min="1" max="10" value={f.rating} onChange={(e) => setF({ ...f, rating: e.target.value })} />
        </Field>
      </div>
      <Field label="Short feedback (the student sees this)">
        <textarea className="inp" rows={4} value={f.feedback} onChange={(e) => setF({ ...f, feedback: e.target.value })} maxLength={10000} placeholder="Strong DSA, work on system design." />
      </Field>
      {!isLegacyInterviews() && <p className="note" style={{ fontSize: 13 }}>For the full section-wise report, use the score card button instead.</p>}
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
