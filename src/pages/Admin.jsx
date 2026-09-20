import { useEffect, useState } from "react";
import {
  Lock, UploadCloud, Download, Plus, Trash2, Send, RotateCcw, CheckCircle2, Info, History, Award,
} from "lucide-react";
import WhatsAppIcon from "../components/WhatsAppIcon";
import { buildWaLink, openWhatsApp, normalizePhone } from "../lib/whatsapp";
import { ADMIN_PASSCODE } from "../lib/adminConfig";
import { generateCertificate, downloadCertificate } from "../lib/certificate";

const SESSION_KEY = "algomate_admin_ok";
const STORAGE_KEY = "algomate_admin_students";
const LOG_KEY = "algomate_admin_log";

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

function pick(row, keys) {
  for (const k of Object.keys(row)) {
    if (keys.includes(k.trim().toLowerCase())) return String(row[k] ?? "").trim();
  }
  return "";
}

function rowsFromSheet(json) {
  return json.map((r) => ({
    id: newId(),
    name: pick(r, ["name", "full name", "student name"]),
    phone: pick(r, ["phone", "phone number", "mobile", "mobile number", "contact"]),
    domain: pick(r, ["domain", "track", "field"]),
    resume: pick(r, ["resume link", "resume", "resume url"]),
    slot: "",
    mentor: "",
    sent: false,
    completed: false,
  }));
}

function formatSlot(value) {
  if (!value) return "TBD";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function buildConfirmationMessage(row) {
  const lines = [
    `Hi ${row.name || "there"}! Your *${row.domain || "interview"}* session with InoByt is confirmed.`,
    "",
    `Slot: ${formatSlot(row.slot)}`,
  ];
  if (row.mentor) lines.push(`Mentor: ${row.mentor}`);
  lines.push("", "We'll share the Google Meet link closer to your slot. See you then!");
  return lines.join("\n");
}

export default function Admin() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === "1");
  const [passInput, setPassInput] = useState("");
  const [passError, setPassError] = useState("");

  const [rows, setRows] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [fileError, setFileError] = useState("");

  const [log, setLog] = useState(() => {
    try {
      const raw = localStorage.getItem(LOG_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  }, [rows]);

  useEffect(() => {
    localStorage.setItem(LOG_KEY, JSON.stringify(log));
  }, [log]);

  // Private audit trail — every time a confirmation goes out, it's recorded
  // here for you only. The student never sees this; it's just so you have a
  // record of who was notified and when, even though you're the one who
  // triggers the send.
  function logEvent(row) {
    setLog((prev) => [
      { id: newId(), ts: Date.now(), name: row.name || "Unnamed", phone: row.phone, slot: row.slot },
      ...prev,
    ].slice(0, 100));
  }

  function handleUnlock(e) {
    e.preventDefault();
    if (passInput === ADMIN_PASSCODE) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setUnlocked(true);
      setPassError("");
    } else {
      setPassError("Incorrect passcode.");
    }
  }

  async function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileError("");
    try {
      const XLSX = await import("xlsx");
      const buffer = await f.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      const parsed = rowsFromSheet(json).filter((r) => r.name || r.phone);
      if (parsed.length === 0) {
        setFileError("No usable rows found. Make sure the sheet has Name / Phone columns.");
        return;
      }
      setRows((prev) => [...prev, ...parsed]);
    } catch {
      setFileError("Couldn't read that file. Try exporting as .xlsx and re-uploading.");
    }
    e.target.value = "";
  }

  function updateRow(id, field, value) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  function removeRow(id) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      { id: newId(), name: "", phone: "", domain: "", resume: "", slot: "", mentor: "", sent: false, completed: false },
    ]);
  }

  function sendOne(row) {
    const digits = normalizePhone(row.phone);
    if (digits.length < 12) {
      alert("This student's phone number doesn't look valid.");
      return;
    }
    openWhatsApp(buildWaLink(digits, buildConfirmationMessage(row)));
    updateRow(row.id, "sent", true);
    logEvent(row);
  }

  // Issued once a session has actually happened — an InoByt certificate of
  // completion, not a claim of any outside accreditation. Downloads as a
  // PNG so it's easy to share straight into the WhatsApp chat with the
  // student, same as everything else here.
  function issueCertificate(row) {
    const dataUrl = generateCertificate({
      name: row.name,
      domain: row.domain,
      mentor: row.mentor,
    });
    const safeName = (row.name || "student").trim().replace(/\s+/g, "-").toLowerCase();
    downloadCertificate(dataUrl, `inobyt-certificate-${safeName}.png`);
  }

  function sendAll() {
    const pending = rows.filter((r) => !r.sent && r.slot && normalizePhone(r.phone).length >= 12);
    if (pending.length === 0) {
      alert("No pending students with a time slot set.");
      return;
    }
    const ok = confirm(
      `This opens ${pending.length} WhatsApp chat${pending.length === 1 ? "" : "s"} in new tabs, one per student.\n\n` +
        "Your browser may block pop-ups after the first one — if so, allow pop-ups for this site and try again.\n\nContinue?"
    );
    if (!ok) return;
    pending.forEach((row, i) => {
      setTimeout(() => sendOne(row), i * 600);
    });
  }

  async function downloadSheet() {
    const XLSX = await import("xlsx");
    const data = rows.map((r) => ({
      Name: r.name,
      Phone: r.phone,
      Domain: r.domain,
      "Resume Link": r.resume,
      Slot: formatSlot(r.slot),
      Mentor: r.mentor,
      "WhatsApp Sent": r.sent ? "Yes" : "No",
      Completed: r.completed ? "Yes" : "No",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "inobyt-students-updated.xlsx");
  }

  function clearAll() {
    if (!confirm("Remove all students from this list? This can't be undone.")) return;
    setRows([]);
  }

  if (!unlocked) {
    return (
      <section className="mx-auto max-w-sm px-5 py-24 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-(--color-input)">
          <Lock className="h-5 w-5 text-(--color-fg-muted)" />
        </div>
        <h1 className="mt-5 text-xl font-bold text-(--color-fg)">Admin Access</h1>
        <p className="mt-2 text-sm text-(--color-fg-faint)">Enter the passcode to continue.</p>
        <form onSubmit={handleUnlock} className="mt-6 space-y-3">
          <input
            type="password"
            value={passInput}
            onChange={(e) => setPassInput(e.target.value)}
            placeholder="Passcode"
            className="w-full rounded-xl border border-(--color-border) bg-(--color-input) px-4 py-2.5 text-center text-sm text-(--color-fg) outline-none focus:border-(--color-accent)"
            autoFocus
          />
          {passError && <p className="text-xs text-rose-400">{passError}</p>}
          <button
            type="submit"
            className="w-full rounded-full bg-(--color-accent-solid) px-6 py-2.5 text-sm font-semibold text-white hover:bg-(--color-accent-solid-hover) transition-colors"
          >
            Unlock
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-(--color-fg)">Admin — Student Sessions</h1>
          <p className="mt-1 text-sm text-(--color-fg-faint)">
            Upload the Excel sheet you received on WhatsApp, assign slots, and send confirmations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label
            htmlFor="admin-file"
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-(--color-border-strong) px-4 py-2 text-xs font-semibold text-(--color-fg) hover:bg-(--color-input) transition-colors"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            Upload Excel
          </label>
          <input id="admin-file" type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />

          <button
            onClick={addRow}
            className="inline-flex items-center gap-2 rounded-full border border-(--color-border-strong) px-4 py-2 text-xs font-semibold text-(--color-fg) hover:bg-(--color-input) transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Student
          </button>

          <button
            onClick={downloadSheet}
            disabled={rows.length === 0}
            className="inline-flex items-center gap-2 rounded-full border border-(--color-border-strong) px-4 py-2 text-xs font-semibold text-(--color-fg) hover:bg-(--color-input) transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <Download className="h-3.5 w-3.5" />
            Download Sheet
          </button>

          <button
            onClick={clearAll}
            disabled={rows.length === 0}
            className="inline-flex items-center gap-2 rounded-full border border-(--color-border-strong) px-4 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Clear All
          </button>
        </div>
      </div>

      {fileError && <p className="mt-4 text-sm text-amber-400">{fileError}</p>}

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-(--color-border) bg-(--color-card) px-4 py-3 text-xs text-(--color-fg-faint)">
        <Info className="h-4 w-4 shrink-0 text-(--color-fg-faint) mt-0.5" />
        <p>
          Set a slot for each student, then click their WhatsApp button to open a
          pre-filled confirmation — you still tap Send yourself. "Send All" does this
          for every student with a slot set, one tab at a time. Once a session has
          actually happened, tick <span className="text-(--color-fg)">Completed</span> to
          unlock a downloadable certificate of completion you can share with them.
        </p>
      </div>

      {rows.length > 0 && (
        <div className="mt-4">
          <button
            onClick={sendAll}
            className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-xs font-semibold text-white hover:brightness-110 transition-[filter]"
          >
            <WhatsAppIcon className="h-3.5 w-3.5" />
            Send All Pending Confirmations
          </button>
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-(--color-border)">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-(--color-card-alt) text-xs uppercase tracking-wide text-(--color-fg-faint)">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Domain</th>
              <th className="px-4 py-3 font-medium">Resume</th>
              <th className="px-4 py-3 font-medium">Time Slot</th>
              <th className="px-4 py-3 font-medium">Mentor</th>
              <th className="px-4 py-3 font-medium text-center">Status</th>
              <th className="px-4 py-3 font-medium text-center">Completed</th>
              <th className="px-4 py-3 font-medium">Certificate</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--color-border)">
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-(--color-fg-faint)">
                  No students yet — upload an Excel sheet or add one manually.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="align-top">
                <td className="px-4 py-2.5">
                  <input
                    value={row.name}
                    onChange={(e) => updateRow(row.id, "name", e.target.value)}
                    className="w-36 rounded-lg border border-(--color-border) bg-(--color-input) px-2.5 py-1.5 text-(--color-fg) outline-none focus:border-(--color-accent)"
                  />
                </td>
                <td className="px-4 py-2.5">
                  <input
                    value={row.phone}
                    onChange={(e) => updateRow(row.id, "phone", e.target.value)}
                    className="w-32 rounded-lg border border-(--color-border) bg-(--color-input) px-2.5 py-1.5 text-(--color-fg) outline-none focus:border-(--color-accent)"
                  />
                </td>
                <td className="px-4 py-2.5">
                  <input
                    value={row.domain}
                    onChange={(e) => updateRow(row.id, "domain", e.target.value)}
                    className="w-40 rounded-lg border border-(--color-border) bg-(--color-input) px-2.5 py-1.5 text-(--color-fg) outline-none focus:border-(--color-accent)"
                  />
                </td>
                <td className="px-4 py-2.5">
                  {row.resume ? (
                    <a
                      href={row.resume}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-(--color-accent) hover:opacity-75 transition-opacity underline underline-offset-2"
                    >
                      Link
                    </a>
                  ) : (
                    <span className="text-(--color-fg-faint)">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <input
                    type="datetime-local"
                    value={row.slot}
                    onChange={(e) => updateRow(row.id, "slot", e.target.value)}
                    className="rounded-lg border border-(--color-border) bg-(--color-input) px-2.5 py-1.5 text-(--color-fg) outline-none focus:border-(--color-accent)"
                  />
                </td>
                <td className="px-4 py-2.5">
                  <input
                    value={row.mentor}
                    onChange={(e) => updateRow(row.id, "mentor", e.target.value)}
                    placeholder="Mentor name"
                    className="w-32 rounded-lg border border-(--color-border) bg-(--color-input) px-2.5 py-1.5 text-(--color-fg) placeholder-(--color-fg-faint) outline-none focus:border-(--color-accent)"
                  />
                </td>
                <td className="px-4 py-2.5 text-center">
                  {row.sent ? (
                    <span className="inline-flex items-center gap-1 text-xs text-(--color-accent-emerald)">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Sent
                    </span>
                  ) : (
                    <button
                      onClick={() => sendOne(row)}
                      disabled={!row.phone}
                      title={row.slot ? "Send confirmation" : "No slot set yet — will send as TBD"}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110 transition-[filter] disabled:opacity-30"
                    >
                      <Send className="h-3 w-3" />
                      Send
                    </button>
                  )}
                </td>
                <td className="px-4 py-2.5 text-center">
                  <input
                    type="checkbox"
                    checked={row.completed}
                    onChange={(e) => updateRow(row.id, "completed", e.target.checked)}
                    aria-label="Session completed"
                    className="h-4 w-4 accent-(--color-accent-solid)"
                  />
                </td>
                <td className="px-4 py-2.5">
                  <button
                    onClick={() => issueCertificate(row)}
                    disabled={!row.completed || !row.name}
                    title={
                      !row.completed
                        ? "Mark the session completed first"
                        : "Download a certificate of completion for this student"
                    }
                    className="inline-flex items-center gap-1.5 rounded-full border border-(--color-border-strong) px-3 py-1.5 text-xs font-semibold text-(--color-fg) hover:bg-(--color-input) transition-colors disabled:opacity-30"
                  >
                    <Award className="h-3 w-3" />
                    Certificate
                  </button>
                </td>
                <td className="px-4 py-2.5">
                  <button
                    onClick={() => removeRow(row.id)}
                    aria-label="Remove student"
                    className="text-(--color-fg-faint) hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {log.length > 0 && (
        <div className="mt-8">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-(--color-fg)">
            <History className="h-4 w-4 text-(--color-fg-faint)" />
            Activity Log
          </h2>
          <p className="mt-1 text-xs text-(--color-fg-faint)">
            A private record of every confirmation you've sent — only visible here, never to students.
          </p>
          <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-(--color-border)">
            <ul className="divide-y divide-(--color-border)">
              {log.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-4 px-4 py-2.5 text-xs">
                  <span className="text-(--color-fg-muted)">
                    Sent confirmation to <span className="font-medium text-(--color-fg)">{entry.name}</span>
                    {entry.slot ? <span className="text-(--color-fg-faint)"> — slot {formatSlot(entry.slot)}</span> : null}
                  </span>
                  <span className="shrink-0 text-(--color-fg-faint)">
                    {new Date(entry.ts).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
