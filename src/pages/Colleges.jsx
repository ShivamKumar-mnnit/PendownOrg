import { useState } from "react";
import { Head, Cards, Page } from "../components/ui";
import WhatsAppIcon from "../components/WhatsAppIcon";
import { buildAdminWaLink, openWhatsApp } from "../lib/whatsapp";
import { usePageSEO } from "../lib/seo";

// Headers only — no sample name/phone/etc. filled in, so nothing that looks
// like real (or fake-but-realistic) student data ships in the template.
const TEMPLATE_HEADERS = ["Name", "Phone", "Domain", "Resume Link"];

const EMPTY_FORM = { college: "", contactName: "", contactPhone: "", studentCount: "" };

async function downloadTemplate() {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Students");
  XLSX.writeFile(wb, "anobyt-student-template.xlsx");
}

function buildMessage(form, fileName, rowCount) {
  const lines = [
    "Hi Anobyt! We'd like to bulk-onboard students for mock interviews / mentorship.",
    "",
    `College: ${form.college}`,
    `Contact Person: ${form.contactName}`,
    `Contact Phone: ${form.contactPhone}`,
  ];
  if (form.studentCount) lines.push(`Approx. Students: ${form.studentCount}`);
  if (fileName) lines.push(`File Ready to Attach: ${fileName}${rowCount ? ` (${rowCount} students)` : ""}`);
  lines.push("", "Attaching our student list Excel sheet in this chat now.");
  return lines.join("\n");
}

export default function Colleges() {
  usePageSEO({
    title: "For Colleges & Placement Cells — Bulk Onboarding",
    description:
      "Bulk-onboard your college's students for mock interviews and mentorship. Upload a student list, we assign mentors and slots, and confirm every student over WhatsApp.",
    path: "/colleges",
  });

  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null); // { rowCount, names }
  const [parseError, setParseError] = useState("");
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleFile(e) {
    const f = e.target.files?.[0];
    setFile(f || null);
    setPreview(null);
    setParseError("");
    if (!f) return;

    try {
      const XLSX = await import("xlsx");
      const buffer = await f.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      const names = rows.slice(0, 3).map((r) => r.Name || r.name || Object.values(r)[0]).filter(Boolean);
      setPreview({ rowCount: rows.length, names });
    } catch {
      setParseError("Couldn't read that file here — that's okay, you can still send it below, we'll open it on our end.");
    }
  }

  function validate() {
    const next = {};
    if (!form.college.trim()) next.college = "Enter your college name.";
    if (!form.contactName.trim()) next.contactName = "Enter a contact person.";
    if (!form.contactPhone.trim()) next.contactPhone = "Enter a contact phone number.";
    if (!file) next.file = "Select the student Excel/CSV file.";
    return next;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const message = buildMessage(form, file?.name, preview?.rowCount);
    openWhatsApp(buildAdminWaLink(message));
    setSent(true);
  }

  if (sent) {
    return (
      <Page narrow={620}>
        <Head title="You're registered!">We've got your batch details for {form.college}.</Head>
        <div className="panel">
          <p style={{ margin: 0, color: "var(--color-fg-muted)" }}>
            We also opened WhatsApp with a summary, addressed to our team. Attach{" "}
            <b style={{ color: "var(--color-fg)" }}>{file?.name}</b> in that chat and hit Send to complete your registration
            (a website can't attach files to WhatsApp on its own).
          </p>
          <div className="row" style={{ marginTop: 18 }}>
            <a className="btn" href={buildAdminWaLink(buildMessage(form, file?.name, preview?.rowCount))} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon className="h-4 w-4" />
              Open WhatsApp and send
            </a>
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                setSent(false);
                setForm(EMPTY_FORM);
                setFile(null);
                setPreview(null);
              }}
            >
              Submit another batch
            </button>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <Head title="Onboard your whole batch at once">
        For placement cells and coordinators. Send us your student list and we handle mentor matching, scheduling and WhatsApp
        confirmations.
      </Head>
      <Cards
        items={[
          ["📊", "Bulk upload", "Send your student list as an Excel sheet. No manual entry."],
          ["🧑‍🏫", "Mentors and slots assigned", "We assign mentors and interview slots for the whole batch."],
          ["💬", "WhatsApp confirmations", "Every student gets their slot confirmed directly."],
        ]}
      />

      <div className="tools" style={{ marginTop: 36, alignItems: "start" }}>
        <form className="panel" onSubmit={handleSubmit} noValidate id="bulk-onboard">
          <h3 style={{ fontSize: 20 }}>Bulk onboard students</h3>
          <div className="two">
            <Field label="College name" error={errors.college}>
              <input
                type="text"
                value={form.college}
                onChange={(e) => update("college", e.target.value)}
                placeholder="e.g. Your College Name"
                className={inputClass(errors.college)}
              />
            </Field>
            <Field label="Approx. number of students" hint="Optional">
              <input
                type="number"
                min="0"
                value={form.studentCount}
                onChange={(e) => update("studentCount", e.target.value)}
                placeholder="60"
                className={inputClass()}
              />
            </Field>
          </div>
          <div className="two">
            <Field label="Contact person" error={errors.contactName}>
              <input
                type="text"
                value={form.contactName}
                onChange={(e) => update("contactName", e.target.value)}
                placeholder="Placement coordinator name"
                className={inputClass(errors.contactName)}
              />
            </Field>
            <Field label="Contact phone" error={errors.contactPhone}>
              <input
                type="tel"
                value={form.contactPhone}
                onChange={(e) => update("contactPhone", e.target.value)}
                placeholder="70xxxxxxxx"
                className={inputClass(errors.contactPhone)}
              />
            </Field>
          </div>

          <Field label="Student list (Excel / CSV)" error={errors.file}>
            <label htmlFor="student-file" className={inputClass(errors.file)} style={{ display: "block", cursor: "pointer", borderStyle: "dashed" }}>
              {file ? file.name : "Click to select a .xlsx, .xls or .csv file"}
            </label>
            <input id="student-file" type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
            {preview && (
              <div className="note ok">
                Looks good, found {preview.rowCount} row{preview.rowCount === 1 ? "" : "s"}
                {preview.names.length ? ` (e.g. ${preview.names.join(", ")}…)` : ""}.
              </div>
            )}
            {parseError && <div className="note">{parseError}</div>}
          </Field>

          <div className="row" style={{ marginTop: 22 }}>
            <button type="submit" className="btn">
              Confirm and register
            </button>
          </div>
          <div className="note">This also opens WhatsApp with your details ready. You'll attach the file and hit Send there to complete your registration.</div>
        </form>

        <div className="panel">
          <h3 style={{ fontSize: 20 }}>Use our template</h3>
          <p style={{ margin: "8px 0 18px", color: "var(--color-fg-muted)" }}>
            So we can match columns correctly: Name, Phone, Domain, Resume Link.
          </p>
          <button type="button" className="btn ghost" onClick={downloadTemplate}>
            Download Excel template
          </button>
          <ul className="ck" style={{ marginTop: 20 }}>
            <li>Fill one row per student</li>
            <li>Send it with the form, then attach it in WhatsApp</li>
            <li>We confirm every student's slot on WhatsApp</li>
          </ul>
        </div>
      </div>
    </Page>
  );
}

function Field({ label, error, hint, children }) {
  return (
    <div>
      <label className="l">{label}</label>
      {children}
      {error ? (
        <div className="note">
          <span className="bad">{error}</span>
        </div>
      ) : hint ? (
        <div className="note" style={{ marginTop: 6 }}>
          {hint}
        </div>
      ) : null}
    </div>
  );
}

function inputClass(error) {
  return `inp${error ? " err" : ""}`;
}
