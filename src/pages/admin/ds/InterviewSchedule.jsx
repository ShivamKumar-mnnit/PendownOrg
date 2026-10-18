import { useMemo, useState } from "react";
import { CalendarRange, Download, RefreshCw } from "lucide-react";
import { INTERVIEW_STATUS, fmtWhen, fromLocalInput, ordinal, superApi, toLocalInput } from "../../../lib/dataService";
import { SectionTop } from "../shared";
import { Empty, Loading, act, useDs } from "./common";
import { loadInterviewRows } from "./interviewUi";

const DAY = 86400e3;
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const PRESETS = [
  ["Today", () => [startOfDay(new Date()), new Date(startOfDay(new Date()).getTime() + DAY)]],
  ["Tomorrow", () => [new Date(startOfDay(new Date()).getTime() + DAY), new Date(startOfDay(new Date()).getTime() + 2 * DAY)]],
  ["Next 7 days", () => [new Date(), new Date(Date.now() + 7 * DAY)]],
  ["This month", () => {
    const n = new Date();
    return [new Date(n.getFullYear(), n.getMonth(), 1), new Date(n.getFullYear(), n.getMonth() + 1, 1)];
  }],
];

/** Every interview, with the trainer's phone looked up from their account (by id, then email). */
async function loadSchedule(me) {
  const [{ rows }, admins] = await Promise.all([
    loadInterviewRows(me, { all: true }),
    superApi.users({ role: "ADMIN", size: 100 }).catch(() => ({ items: [] })),
  ]);
  const byId = new Map();
  const byEmail = new Map();
  for (const u of admins.items || []) {
    byId.set(u.id, u);
    if (u.email) byEmail.set(u.email.toLowerCase(), u);
  }
  return rows.map((i) => {
    const t = byId.get(i.interviewerId) || byEmail.get((i.mentorEmail || "").toLowerCase());
    return { ...i, trainerPhone: t?.phone || "" };
  });
}

/** Interviews scheduled in a time range, exportable to Excel with phone numbers. */
export default function InterviewSchedule({ me }) {
  const [range, setRange] = useState(() => {
    const [a, b] = PRESETS[2][1]();
    return { from: toLocalInput(a.toISOString()), to: toLocalInput(b.toISOString()) };
  });
  const [status, setStatus] = useState("ACTIVE");
  const [err, setErr] = useState("");
  const state = useDs(() => loadSchedule(me), [me.id]);

  const shown = useMemo(() => {
    const from = range.from ? new Date(fromLocalInput(range.from)).getTime() : -Infinity;
    const to = range.to ? new Date(fromLocalInput(range.to)).getTime() : Infinity;
    return (state.data || [])
      .filter((i) => {
        const t = new Date(i.scheduledAt).getTime();
        if (t < from || t > to) return false;
        if (status === "ACTIVE") return i.status === "UPCOMING" || i.status === "IN_PROGRESS";
        return !status || i.status === status;
      })
      .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  }, [state.data, range, status]);

  const preset = (fn) => {
    const [a, b] = fn();
    setRange({ from: toLocalInput(a.toISOString()), to: toLocalInput(b.toISOString()) });
  };

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const sheet = XLSX.utils.aoa_to_sheet([
      ["Student Reg No", "Student Name", "Trainer Name", "Student Phone", "Trainer Phone", "Scheduled Time"],
      ...shown.map((i) => [i.regNo || "", i.studentName || "", i.mentorName || "", i.studentPhone || "", i.trainerPhone || "", fmtWhen(i.scheduledAt)]),
    ]);
    sheet["!cols"] = [16, 26, 22, 16, 16, 22].map((wch) => ({ wch }));
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Interviews");
    const day = (v) => (v ? v.slice(0, 10) : "any");
    XLSX.writeFile(book, `anobyt-interviews-${day(range.from)}-to-${day(range.to)}.xlsx`);
  }

  return (
    <div>
      <SectionTop title="Interview schedule" text="Pick a time range to see every interview scheduled in it, then export the list with phone numbers.">
        <button type="button" className="btn" disabled={!shown.length} onClick={() => act(setErr, exportExcel)}>
          <Download className="h-4 w-4" /> Export to Excel
        </button>
      </SectionTop>

      <div className="row" style={{ gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {PRESETS.map(([label, fn]) => (
          <button key={label} type="button" className="chip" onClick={() => preset(fn)}>
            {label}
          </button>
        ))}
      </div>
      <div className="row" style={{ gap: 10, marginBottom: 12, alignItems: "end", flexWrap: "wrap" }}>
        <label style={{ flex: "1 1 200px" }}>
          <span className="l" style={{ marginTop: 0 }}>From</span>
          <input className="inp" type="datetime-local" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} />
        </label>
        <label style={{ flex: "1 1 200px" }}>
          <span className="l" style={{ marginTop: 0 }}>To</span>
          <input className="inp" type="datetime-local" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} />
        </label>
        <select className="inp" style={{ width: "auto" }} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="ACTIVE">Upcoming and in progress</option>
          <option value="">Any status</option>
          {Object.entries(INTERVIEW_STATUS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button type="button" className="btn ghost" onClick={() => state.reload()}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>
      {err && <p className="note bad">{err}</p>}

      <Loading state={state}>
        {() => (
          <>
            <p className="note" style={{ fontSize: 13 }}>
              <CalendarRange className="h-4 w-4" style={{ display: "inline", verticalAlign: -3 }} /> {shown.length} interview{shown.length === 1 ? "" : "s"} in this range
            </p>
            {!shown.length ? (
              <Empty>No interviews scheduled in this range.</Empty>
            ) : (
              <div className="tablewrap">
                <table className="dtable">
                  <thead>
                    <tr>
                      <th>Student reg no</th>
                      <th>Student name</th>
                      <th>Trainer name</th>
                      <th>Student phone</th>
                      <th>Trainer phone</th>
                      <th>Scheduled time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((i) => (
                      <tr key={i.id}>
                        <td>{i.regNo || "—"}</td>
                        <td>
                          {i.studentName}
                          <small className="note" style={{ display: "block", margin: 0 }}>
                            {[i.studentInterviewNo && `${ordinal(i.studentInterviewNo)} interview`, i.templateName].filter(Boolean).join(" · ")}
                          </small>
                        </td>
                        <td>{i.mentorName || "—"}</td>
                        <td>{i.studentPhone ? <a className="linkish" href={`tel:${i.studentPhone}`}>{i.studentPhone}</a> : "—"}</td>
                        <td>{i.trainerPhone ? <a className="linkish" href={`tel:${i.trainerPhone}`}>{i.trainerPhone}</a> : "—"}</td>
                        <td style={{ whiteSpace: "nowrap" }}>{fmtWhen(i.scheduledAt)}</td>
                        <td>{INTERVIEW_STATUS[i.status] || i.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </Loading>
    </div>
  );
}
