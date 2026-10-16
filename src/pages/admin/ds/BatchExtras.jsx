import { useState } from "react";
import { Download, Send, Trash2 } from "lucide-react";
import { adminApi, fmtWhen, pct } from "../../../lib/dataService";
import { Field } from "../shared";
import { Empty, Loading, act, useDs } from "./common";

const CHANNELS = [
  ["EMAIL", "Email"],
  ["WHATSAPP", "WhatsApp"],
];

/** In-app announcements to everyone in the batch, optionally also by email / WhatsApp. */
export function BatchAnnouncements({ batch }) {
  const state = useDs(() => adminApi.announcements(batch.id), [batch.id]);
  const [f, setF] = useState({ subject: "", message: "", channels: ["EMAIL"] });
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(e) {
    e.preventDefault();
    setMsg("");
    const where = f.channels.length ? ` by ${f.channels.map((c) => c.toLowerCase()).join(" and ")}` : " (on their dashboard only)";
    setBusy(true);
    const r = await act(setErr, () => adminApi.announce(batch.id, { subject: f.subject.trim(), message: f.message.trim(), channels: f.channels }), `Send this to all ${batch.studentCount} students${where}?`);
    setBusy(false);
    if (r) {
      setMsg(`Sent to ${r.recipients} student${r.recipients === 1 ? "" : "s"}.`);
      setF({ subject: "", message: "", channels: f.channels });
      state.reload();
    }
  }

  return (
    <div className="two" style={{ gap: 20, alignItems: "start" }}>
      <form className="panel" onSubmit={send}>
        <h3 style={{ fontSize: 19 }}>New announcement</h3>
        <Field label="Subject">
          <input className="inp" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} required maxLength={150} placeholder="Placement drive on Monday" />
        </Field>
        <Field label="Message">
          <textarea className="inp" rows={5} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} required maxLength={2000} />
        </Field>
        <div className="row" style={{ gap: 16, marginTop: 12, fontSize: 14 }}>
          <span className="note" style={{ margin: 0 }}>Also send by</span>
          {CHANNELS.map(([k, l]) => (
            <label key={k} className="row" style={{ gap: 6, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={f.channels.includes(k)}
                onChange={(e) => setF({ ...f, channels: e.target.checked ? [...f.channels, k] : f.channels.filter((c) => c !== k) })}
              />{" "}
              {l}
            </label>
          ))}
        </div>
        <p className="note" style={{ fontSize: 13 }}>Everyone always sees it on their dashboard.</p>
        {err && <p className="note bad">{err}</p>}
        {msg && <p className="note ok">{msg}</p>}
        <button className="btn" style={{ marginTop: 10 }} disabled={busy}>
          <Send className="h-4 w-4" /> {busy ? "Sending…" : "Send"}
        </button>
      </form>
      <div>
        <Loading state={state}>
          {(list) =>
            !list.length ? (
              <Empty>Nothing sent yet.</Empty>
            ) : (
              list.map((a) => (
                <div className="panel" key={a.id} style={{ marginBottom: 12 }}>
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "start" }}>
                    <div>
                      <b>{a.subject}</b>
                      <small className="note" style={{ display: "block", margin: "2px 0 0" }}>
                        {fmtWhen(a.createdAt)} · {a.recipients} recipient{a.recipients === 1 ? "" : "s"} · {a.channels?.length ? a.channels.join(", ").toLowerCase() : "in-app"}
                      </small>
                    </div>
                    <button
                      type="button"
                      className="ib"
                      title="Delete"
                      onClick={async () => (await act(setErr, () => adminApi.deleteAnnouncement(batch.id, a.id), "Delete this announcement from students' dashboards? Emails already sent stay sent.")) !== undefined && state.reload()}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p style={{ margin: "8px 0 0", color: "var(--color-fg-muted)", whiteSpace: "pre-wrap" }}>{a.message}</p>
                </div>
              ))
            )
          }
        </Loading>
      </div>
    </div>
  );
}

/** Weighted MCQ + coding + interview scores per student, with a shortlist cut-off. */
export function BatchScorecard({ batch }) {
  const [opts, setOpts] = useState({ mcqWeight: 1, codingWeight: 1, interviewWeight: 1, minPercent: 60, shortlistedOnly: false });
  const [applied, setApplied] = useState(opts);
  const state = useDs(() => adminApi.scorecard(batch.id, applied), [batch.id, applied]);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setOpts({ ...opts, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  return (
    <div>
      <form
        className="panel"
        style={{ marginBottom: 16 }}
        onSubmit={(e) => {
          e.preventDefault();
          setApplied({ ...opts });
        }}
      >
        <div className="row" style={{ gap: 12, alignItems: "end", flexWrap: "wrap" }}>
          {[
            ["mcqWeight", "MCQ weight"],
            ["codingWeight", "Coding weight"],
            ["interviewWeight", "Interview weight"],
            ["minPercent", "Shortlist at %"],
          ].map(([k, l]) => (
            <div key={k} style={{ width: 130 }}>
              <label className="l" style={{ marginTop: 0 }}>{l}</label>
              <input className="inp" type="number" min="0" step="any" max={k === "minPercent" ? 100 : undefined} value={opts[k]} onChange={set(k)} />
            </div>
          ))}
          <label className="row" style={{ gap: 6, alignItems: "center", fontSize: 14, paddingBottom: 10 }}>
            <input type="checkbox" checked={opts.shortlistedOnly} onChange={set("shortlistedOnly")} /> Shortlisted only
          </label>
          <button className="btn">Apply</button>
          <button type="button" className="btn ghost" onClick={() => act(setErr, () => adminApi.exportScorecard(batch.id, applied))}>
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
        <p className="note" style={{ fontSize: 13, marginBottom: 0 }}>Parts a student has no data for are left out of their overall score. Coding scores arrive from the coding platform.</p>
      </form>
      {err && <p className="note bad">{err}</p>}
      <Loading state={state}>
        {(s) =>
          !s.rows?.length ? (
            <Empty>No scores yet.</Empty>
          ) : (
            <>
              <p className="note">
                {s.students} students · <b className="ok">{s.shortlisted} shortlisted</b> at {pct(s.minPercent)}
              </p>
              <div className="tablewrap">
                <table className="dtable">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Student</th>
                      <th>Domain</th>
                      <th>MCQ</th>
                      <th>Coding</th>
                      <th>Interview</th>
                      <th>Overall</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {s.rows.map((r) => (
                      <tr key={r.studentId}>
                        <td>{r.rank ?? "—"}</td>
                        <td>
                          {r.name}
                          <small className="note" style={{ display: "block", margin: 0 }}>{[r.regNo, r.email, r.phone].filter(Boolean).join(" · ")}</small>
                        </td>
                        <td>{r.domain || "—"}</td>
                        <td title={(r.tests || []).map((t) => `${t.title}: ${pct(t.percentage)}`).join("\n")}>{pct(r.mcqPercent)}</td>
                        <td title={(r.coding || []).map((c) => `${c.assessmentTitle}: ${pct(c.percentage)}`).join("\n")}>{pct(r.codingPercent)}</td>
                        <td>
                          {pct(r.interviewPercent)}
                          {r.interviewsCompleted ? <small className="note" style={{ display: "block", margin: 0 }}>{r.interviewsCompleted} done</small> : null}
                        </td>
                        <td>
                          <b>{pct(r.overallPercent)}</b>
                        </td>
                        <td>{r.shortlisted && <span className="tag free">Shortlisted</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )
        }
      </Loading>
    </div>
  );
}
