import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ClipboardPen, Eye, Link2, RefreshCw, Send, Undo2 } from "lucide-react";
import { INTERVIEW_STATUS, fmtWhen, interviewApi, isLegacyInterviews, ordinal } from "../../../lib/dataService";
import { SectionTop } from "../shared";
import { Empty, Loading, Modal, act, useDs } from "./common";
import { LinkCell, LinksForm, ScorecardEditor, changeStatus, countByStatus, interviewLabel, loadInterviewRows } from "./interviewUi";

// What a trainer can move an interview to from the dashboard.
const FLOW = ["UPCOMING", "IN_PROGRESS", "DONE", "NO_SHOW"];

/**
 * Trainer dashboard: the interviews this trainer takes, with links, recording, score card,
 * status and publishing. Super admins can switch to every trainer's interviews.
 */
export default function TrainerInterviews({ me }) {
  const isSuper = me.role === "SUPERADMIN";
  const [all, setAll] = useState(isSuper);
  const [status, setStatus] = useState("");
  const state = useDs(() => loadInterviewRows(me, { all, status }), [me.id, all, status]);
  const [modal, setModal] = useState(null); // {kind, interview}
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busyId, setBusyId] = useState("");

  async function run(id, fn, confirmText, done) {
    setBusyId(id);
    const r = await act(setErr, fn, confirmText);
    setBusyId("");
    if (r !== undefined) {
      setMsg(done || "");
      state.reload();
    }
  }

  const close = () => setModal(null);
  const saved = (text) => () => {
    setModal(null);
    setMsg(text);
    state.reload();
  };

  return (
    <div>
      <SectionTop title={all ? "All interviews" : "My interviews"} text="Join links, recordings and score cards for each interview. Publish a score card to show it on the student's dashboard." />

      <Loading state={state}>
        {({ rows, counts, fallback }) => {
          const c = counts || countByStatus(rows);
          return (
            <>
              <div className="kpis" style={{ marginTop: 0 }}>
                {["UPCOMING", "IN_PROGRESS", "DONE"].map((s) => (
                  <button key={s} type="button" className="kpi-btn" onClick={() => setStatus(status === s ? "" : s)} aria-pressed={status === s}>
                    <b>{c[s] || 0}</b>
                    <span>{INTERVIEW_STATUS[s]}</span>
                  </button>
                ))}
                <div>
                  <b>{rows.filter((i) => i.scorecard?.published).length}</b>
                  <span>Score cards published</span>
                </div>
              </div>

              <div className="row" style={{ gap: 10, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
                <select className="inp" style={{ width: "auto" }} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
                  <option value="">All statuses</option>
                  {Object.entries(INTERVIEW_STATUS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                {isSuper && (
                  <label className="row" style={{ gap: 6, alignItems: "center", fontSize: 14 }}>
                    <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} /> Every trainer
                  </label>
                )}
                <button type="button" className="btn ghost" onClick={() => state.reload()}>
                  <RefreshCw className="h-4 w-4" /> Refresh
                </button>
              </div>
              {(fallback || isLegacyInterviews()) && (
                <p className="note" style={{ fontSize: 13 }}>
                  The data service hasn't got the trainer-interviews update yet: interviews are matched by your email, and "In progress", recording links and score cards
                  switch on once it's deployed.
                </p>
              )}
              {err && <p className="note bad">{err}</p>}
              {msg && <p className="note ok">{msg}</p>}

              {!rows.length ? (
                <Empty>
                  {status ? "No interviews with this status." : all ? "No interviews scheduled yet." : "No interviews assigned to you yet. They show up here once the Anobyt team schedules them with you as the interviewer."}
                </Empty>
              ) : (
                <div className="tablewrap">
                  <table className="dtable">
                    <thead>
                      <tr>
                        <th>Interview No</th>
                        <th>Student's interview</th>
                        <th>Student</th>
                        <th>Interviewer</th>
                        <th>Interview link</th>
                        <th>Recording</th>
                        <th>Score card</th>
                        <th>Status</th>
                        <th>Publish</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((i) => {
                        const sc = i.scorecard || {};
                        const busy = busyId === i.id;
                        return (
                          <tr key={i.id}>
                            <td>
                              <b>{interviewLabel(i)}</b>
                              <small className="note" style={{ display: "block", margin: 0 }}>{fmtWhen(i.scheduledAt)}</small>
                            </td>
                            <td>{ordinal(i.studentInterviewNo)}</td>
                            <td>
                              {i.studentName}
                              <small className="note" style={{ display: "block", margin: 0 }}>{[i.regNo, i.templateName].filter(Boolean).join(" · ")}</small>
                            </td>
                            <td>{i.mentorName}</td>
                            <td style={{ whiteSpace: "nowrap" }}>
                              <LinkCell href={i.meetingLink} label="Join" />
                              <button type="button" className="ib" title="Meeting and recording links" onClick={() => setModal({ kind: "links", interview: i })}>
                                <Link2 className="h-4 w-4" />
                              </button>
                            </td>
                            <td>
                              {i.recordingLink ? (
                                <LinkCell href={i.recordingLink} label="Recording" />
                              ) : i.status === "DONE" ? (
                                <button type="button" className="linkish" onClick={() => setModal({ kind: "links", interview: i })}>
                                  Add
                                </button>
                              ) : (
                                <span className="note" style={{ margin: 0 }}>—</span>
                              )}
                            </td>
                            <td style={{ whiteSpace: "nowrap" }}>
                              {sc.exists ? (
                                <>
                                  <b>{sc.overallPercent != null ? `${Math.round(sc.overallPercent * 10) / 10}%` : "Saved"}</b>{" "}
                                  <button type="button" className="ib" title="Edit score card" onClick={() => setModal({ kind: "score", interview: i })}>
                                    <ClipboardPen className="h-4 w-4" />
                                  </button>
                                  <Link className="ib" title="Preview the report" to={`/interview-report/${i.id}`}>
                                    <Eye className="h-4 w-4" />
                                  </Link>
                                </>
                              ) : (
                                <button type="button" className="btn ghost" style={{ padding: "5px 10px" }} disabled={i.status === "CANCELLED" || isLegacyInterviews()} onClick={() => setModal({ kind: "score", interview: i })}>
                                  <ClipboardPen className="h-4 w-4" /> Fill
                                </button>
                              )}
                            </td>
                            <td>
                              {i.status === "CANCELLED" ? (
                                <span className="tag adv">Cancelled</span>
                              ) : (
                                <select
                                  className="inp"
                                  style={{ width: "auto", padding: "6px 8px", fontSize: 13 }}
                                  value={i.status}
                                  disabled={busy}
                                  aria-label={`Status of interview ${interviewLabel(i)}`}
                                  onChange={(e) => {
                                    const s = e.target.value;
                                    run(i.id, () => changeStatus(i, s), s === "NO_SHOW" ? `Mark ${i.studentName} as a no show?` : null, `${i.studentName}: ${INTERVIEW_STATUS[s]}.`);
                                  }}
                                >
                                  {FLOW.map((s) => (
                                    <option key={s} value={s}>{INTERVIEW_STATUS[s]}</option>
                                  ))}
                                </select>
                              )}
                            </td>
                            <td style={{ whiteSpace: "nowrap" }}>
                              {sc.published ? (
                                <>
                                  <span className="ok" style={{ fontSize: 14 }}>
                                    <CheckCircle2 className="h-4 w-4" style={{ display: "inline", verticalAlign: -3 }} /> Published
                                  </span>
                                  <button
                                    type="button"
                                    className="ib"
                                    title="Unpublish (hide from the student)"
                                    disabled={busy}
                                    onClick={() => run(i.id, () => interviewApi.unpublish(i.id), `Hide ${i.studentName}'s score card from them again?`, "Score card hidden from the student.")}
                                  >
                                    <Undo2 className="h-4 w-4" />
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  className="btn"
                                  style={{ padding: "5px 12px" }}
                                  disabled={busy || !sc.exists || i.status !== "DONE"}
                                  title={!sc.exists ? "Fill the score card first" : i.status !== "DONE" ? "Mark the interview Done first" : "Show it on the student's dashboard"}
                                  onClick={() => run(i.id, () => interviewApi.publish(i.id, true), `Publish ${i.studentName}'s score card? They'll see it on their dashboard and get a message.`, "Score card published to the student.")}
                                >
                                  <Send className="h-4 w-4" /> Publish
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          );
        }}
      </Loading>

      {modal?.kind === "links" && (
        <Modal title={`Links for interview ${interviewLabel(modal.interview)}`} onClose={close} wide={620}>
          <LinksForm interview={modal.interview} onSaved={saved("Links saved.")} />
        </Modal>
      )}
      {modal?.kind === "score" && (
        <Modal title={`Score card: ${modal.interview.studentName}`} onClose={close} wide={860}>
          <ScorecardEditor interview={modal.interview} onSaved={(_, published) => saved(published ? "Score card saved and published." : "Score card saved.")()} />
        </Modal>
      )}
    </div>
  );
}
