import { useMemo, useState } from "react";
import { Download, Link2, RefreshCw } from "lucide-react";
import { fmtDay, fmtWhen, interviewApi, ordinal } from "../../../lib/dataService";
import { SectionTop } from "../shared";
import { Empty, Loading, Modal, act, useDs } from "./common";
import { LinkCell, LinksForm, loadInterviewRows } from "./interviewUi";

/** Register rows: the recordings endpoint, or built from the interviews on older servers. */
async function loadRegister(me) {
  try {
    return { rows: await interviewApi.recordings(), fromInterviews: false };
  } catch (e) {
    if (e.status !== 404 && e.status !== 405) throw e;
  }
  const { rows } = await loadInterviewRows(me, { all: true });
  return {
    fromInterviews: true,
    rows: rows
      .filter((i) => i.status !== "CANCELLED")
      .map((i, n) => ({
        sno: n + 1,
        interviewId: i.id,
        interviewNo: i.interviewNo,
        studentInterviewNo: i.studentInterviewNo,
        studentName: i.studentName,
        regNo: i.regNo,
        trainerName: i.mentorName,
        templateName: i.templateName,
        scheduledAt: i.scheduledAt,
        meetingLink: i.meetingLink,
        recordingLink: i.recordingLink,
        _interview: i,
      })),
  };
}

/** Every interview's meeting and recording link in one list, exportable to Excel. */
export default function MeetingLinks({ me }) {
  const state = useDs(() => loadRegister(me), [me.id]);
  const [filter, setFilter] = useState({ q: "", trainer: "", only: "" });
  const [modal, setModal] = useState(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const rows = state.data?.rows;
  const trainers = useMemo(() => [...new Set((rows || []).map((r) => r.trainerName).filter(Boolean))].sort(), [rows]);
  const shown = useMemo(() => {
    const q = filter.q.trim().toLowerCase();
    return (rows || []).filter(
      (r) =>
        (!q || [r.studentName, r.regNo, r.templateName].some((v) => (v || "").toLowerCase().includes(q))) &&
        (!filter.trainer || r.trainerName === filter.trainer) &&
        (filter.only !== "recorded" || r.recordingLink) &&
        (filter.only !== "missing" || !r.recordingLink),
    );
  }, [rows, filter]);

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const sheet = XLSX.utils.aoa_to_sheet([
      ["S.No", "Student Interview No", "Student Name", "Trainer Name", "Recorded Meeting Link", "Meeting Link", "Interview No", "Reg No", "Batch", "Date"],
      ...shown.map((r, n) => [
        n + 1,
        ordinal(r.studentInterviewNo),
        r.studentName || "",
        r.trainerName || "",
        r.recordingLink || "",
        r.meetingLink || "",
        r.interviewNo ?? "",
        r.regNo || "",
        r.templateName || "",
        r.scheduledAt ? fmtDay(r.scheduledAt) : "",
      ]),
    ]);
    sheet["!cols"] = [6, 12, 26, 22, 60, 60, 10, 14, 24, 14].map((wch) => ({ wch }));
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Meeting links");
    XLSX.writeFile(book, `anobyt-meeting-links-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <div>
      <SectionTop title="Meeting links" text="Every interview's meeting and recording link. Filter, then export the list to Excel.">
        <button type="button" className="btn" disabled={!shown.length} onClick={() => act(setErr, exportExcel)} title="The rows shown, with the filters applied">
          <Download className="h-4 w-4" /> Export to Excel
        </button>
        {state.data && !state.data.fromInterviews && (
          <button
            type="button"
            className="btn ghost"
            title="Every interview from the server's register"
            onClick={() => act(setErr, () => interviewApi.exportRecordings({ onlyWithRecording: filter.only === "recorded" || undefined }))}
          >
            <Download className="h-4 w-4" /> Full register
          </button>
        )}
      </SectionTop>
      <div className="row" style={{ gap: 10, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
        <input className="inp" style={{ flex: "1 1 220px" }} placeholder="Search student, reg no or batch" value={filter.q} onChange={(e) => setFilter({ ...filter, q: e.target.value })} />
        <select className="inp" style={{ width: "auto" }} value={filter.trainer} onChange={(e) => setFilter({ ...filter, trainer: e.target.value })} aria-label="Trainer">
          <option value="">All trainers</option>
          {trainers.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select className="inp" style={{ width: "auto" }} value={filter.only} onChange={(e) => setFilter({ ...filter, only: e.target.value })} aria-label="Recording">
          <option value="">With or without recording</option>
          <option value="recorded">Recorded</option>
          <option value="missing">Recording missing</option>
        </select>
        <button type="button" className="btn ghost" onClick={() => state.reload()}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>
      {err && <p className="note bad">{err}</p>}
      {msg && <p className="note ok">{msg}</p>}

      <Loading state={state}>
        {() =>
          !shown.length ? (
            <Empty>{rows?.length ? "Nothing matches these filters." : "No interviews yet. Links appear here as interviews are scheduled."}</Empty>
          ) : (
            <div className="tablewrap">
              <table className="dtable">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Student interview no</th>
                    <th>Student name</th>
                    <th>Trainer name</th>
                    <th>Recorded meeting link</th>
                    <th>Meeting link</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {shown.map((r, n) => (
                    <tr key={r.interviewId || n}>
                      <td>{n + 1}</td>
                      <td>
                        {ordinal(r.studentInterviewNo)}
                        {r.interviewNo ? <small className="note" style={{ display: "block", margin: 0 }}>#{r.interviewNo}</small> : null}
                      </td>
                      <td>
                        {r.studentName}
                        <small className="note" style={{ display: "block", margin: 0 }}>{[r.regNo, r.templateName, fmtWhen(r.scheduledAt)].filter(Boolean).join(" · ")}</small>
                      </td>
                      <td>{r.trainerName || "—"}</td>
                      <td style={{ maxWidth: 260, overflowWrap: "anywhere", fontSize: 13 }}>
                        <LinkCell href={r.recordingLink} label={r.recordingLink} />
                      </td>
                      <td>
                        <LinkCell href={r.meetingLink} label="Join link" />
                      </td>
                      {(
                        <td>
                          <button type="button" className="ib" title="Edit links" onClick={() => setModal(r._interview || asInterview(r))}>
                            <Link2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </Loading>

      {modal && (
        <Modal title={`Links for ${modal.studentName}`} onClose={() => setModal(null)} wide={620}>
          <LinksForm
            interview={modal}
            onSaved={(_, note) => {
              setModal(null);
              setMsg(note || "");
              state.reload();
            }}
          />
        </Modal>
      )}
    </div>
  );
}

/** A recordings-register row in the shape LinksForm expects. */
const asInterview = (r) => ({
  id: r.interviewId,
  interviewNo: r.interviewNo,
  studentName: r.studentName,
  mentorName: r.trainerName,
  scheduledAt: r.scheduledAt,
  durationMinutes: 30,
  meetingLink: r.meetingLink,
  recordingLink: r.recordingLink,
  meetingPlatform: r.meetingPlatform,
});
