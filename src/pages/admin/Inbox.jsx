import { useState } from "react";
import { Check, Download, RotateCcw, Trash2, UserPlus } from "lucide-react";
import WhatsAppIcon from "../../components/WhatsAppIcon";
import { deleteLead, listLeads, updateLead } from "../../lib/contentApi";
import { buildWaLink, normalizePhone } from "../../lib/whatsapp";
import { Gate, SectionTop } from "./shared";
import { downloadCsv, fmtDate, useAdminData } from "./adminUtils";

const KINDS = { booking: "Booking", college: "College", premium: "Premium", contact: "Contact" };
const DATA_LABELS = { sessionType: "Session", domain: "Domain", company: "Company", resume: "Resume", college: "College", students: "Students", file: "File", rows: "Rows in file", course: "Course" };

// Same storage the Sessions tab uses, so a booking can be moved straight into it.
const SESSIONS_KEY = "algomate_admin_students";
function addToSessions(lead) {
  let rows = [];
  try {
    rows = JSON.parse(localStorage.getItem(SESSIONS_KEY)) || [];
  } catch {
    rows = [];
  }
  rows.push({
    id: Math.random().toString(36).slice(2, 10),
    name: lead.name,
    phone: lead.phone,
    domain: lead.data.domain || "",
    resume: lead.data.resume || "",
    slot: "",
    mentor: "",
    sent: false,
    completed: false,
  });
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(rows));
}

export default function Inbox() {
  const state = useAdminData(listLeads);
  const [kind, setKind] = useState("all");
  const [status, setStatus] = useState("new");
  const [msg, setMsg] = useState("");
  const leads = state.data || [];
  const shown = leads.filter((l) => (kind === "all" || l.kind === kind) && (status === "all" || l.status === status));
  const newCount = leads.filter((l) => l.status === "new").length;

  async function act(fn) {
    try {
      await fn();
      state.reload();
    } catch (e) {
      setMsg(e.message);
    }
  }

  function exportCsv() {
    downloadCsv(
      [["Date", "Type", "Name", "Phone", "Email", "Details", "Status"]].concat(
        shown.map((l) => [fmtDate(l.createdAt), KINDS[l.kind], l.name, l.phone, l.email, Object.entries(l.data).map(([k, v]) => `${DATA_LABELS[k] || k}: ${v}`).join("; "), l.status]),
      ),
      "anobyt-inbox.csv",
    );
  }

  return (
    <div>
      <SectionTop title={`Inbox${newCount ? ` (${newCount} new)` : ""}`} text="Every booking and college request submitted on the website, saved even if the WhatsApp message was never sent.">
        <button type="button" className="btn ghost" onClick={exportCsv} disabled={!shown.length}>
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </SectionTop>
      <Gate state={state}>
        <div className="row" style={{ marginBottom: 16, gap: 8 }}>
          {[["all", "All"], ...Object.entries(KINDS)].map(([k, v]) => (
            <button key={k} type="button" className={`chip ${kind === k ? "on" : ""}`} onClick={() => setKind(k)}>
              {v}
            </button>
          ))}
          <span style={{ flex: 1 }} />
          <select className="inp" value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: "auto" }} aria-label="Status">
            <option value="new">New</option>
            <option value="done">Handled</option>
            <option value="all">All</option>
          </select>
        </div>
        {msg && <p className="note ok">{msg}</p>}
        {!shown.length && (
          <div className="empty">
            <b>Nothing here</b>
            <span>New bookings and college requests will appear here.</span>
          </div>
        )}
        <div className="tlist">
          {shown.map((l) => {
            const digits = normalizePhone(l.phone);
            return (
              <div className="trow" key={l.id}>
                <div className="tinfo">
                  <div className="row" style={{ gap: 8 }}>
                    <span className="tag">{KINDS[l.kind]}</span>
                    {l.status === "done" && <span className="tag free">Handled</span>}
                    <small>{fmtDate(l.createdAt)}</small>
                  </div>
                  <b>{l.name || "No name"}</b>
                  <small>
                    {[l.phone, l.email].filter(Boolean).join(" · ")}
                    {Object.entries(l.data)
                      .filter(([, v]) => v !== "")
                      .map(([k, v]) => ` · ${DATA_LABELS[k] || k}: ${v}`)
                      .join("")}
                  </small>
                </div>
                <div className="tact">
                  {digits.length >= 12 && (
                    <a className="ib" title="Message on WhatsApp" href={buildWaLink(digits, `Hi ${l.name || "there"}! This is Anobyt.`)} target="_blank" rel="noopener noreferrer">
                      <WhatsAppIcon className="h-4 w-4" />
                    </a>
                  )}
                  {l.kind === "booking" && (
                    <button
                      type="button"
                      className="ib"
                      title="Add to Sessions sheet"
                      onClick={() =>
                        act(async () => {
                          addToSessions(l);
                          await updateLead(l.id, { status: "done" });
                          setMsg(`${l.name} added to the Sessions sheet.`);
                        })
                      }
                    >
                      <UserPlus className="h-4 w-4" />
                    </button>
                  )}
                  <button type="button" className="ib" title={l.status === "new" ? "Mark handled" : "Mark as new"} onClick={() => act(() => updateLead(l.id, { status: l.status === "new" ? "done" : "new" }))}>
                    {l.status === "new" ? <Check className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                  </button>
                  <button type="button" className="ib danger" title="Delete" onClick={() => confirm("Delete this entry?") && act(() => deleteLead(l.id))}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Gate>
    </div>
  );
}
