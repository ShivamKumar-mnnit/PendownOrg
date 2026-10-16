import { useState } from "react";
import { Link } from "react-router-dom";
import { Head, Cards, Page } from "../components/ui";
import WhatsAppIcon from "../components/WhatsAppIcon";
import { buildAdminWaLink } from "../lib/whatsapp";
import { downloadSheetTemplate, submitOnboarding } from "../lib/dataService";
import { usePageSEO } from "../lib/seo";

const TEMPLATE_HEADERS = ["Name", "Reg No", "Email", "Phone", "Domain", "Resume Link"];
const EMPTY_FORM = { college: "", contactName: "", contactPhone: "", contactEmail: "", studentCount: "" };

/** The data service's template, or a headers-only sheet if it can't be reached. */
async function downloadTemplate() {
  try {
    await downloadSheetTemplate("students");
  } catch {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS]), "Students");
    XLSX.writeFile(wb, "students-template.xlsx");
  }
}

export default function Colleges() {
  usePageSEO({
    title: "For Colleges & Placement Cells — Bulk Onboarding",
    description:
      "Bulk-onboard your college's students for tests, mock interviews and mentorship. Upload a student list, we create logins, assign mentors and slots, and confirm every student.",
    path: "/colleges",
  });

  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null); // { rowCount, names }
  const [parseError, setParseError] = useState("");
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [receipt, setReceipt] = useState(null);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleFile(e) {
    const f = e.target.files?.[0];
    setFile(f || null);
    setPreview(null);
    setParseError("");
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      setParseError("That file is over 10 MB. Split it into smaller sheets or remove extra columns.");
      return;
    }
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await f.arrayBuffer(), { type: "array" });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
      const names = rows.slice(0, 3).map((r) => r.Name || r.name || Object.values(r)[0]).filter(Boolean);
      setPreview({ rowCount: rows.length, names });
    } catch {
      setParseError("Couldn't preview that file here. You can still send it; we'll read it on our side.");
    }
  }

  function validate() {
    const next = {};
    if (!form.college.trim()) next.college = "Enter your college name.";
    if (!form.contactName.trim()) next.contactName = "Enter a contact person.";
    if (!form.contactPhone.trim()) next.contactPhone = "Enter a contact phone number.";
    if (form.contactEmail && !/^\S+@\S+\.\S+$/.test(form.contactEmail.trim())) next.contactEmail = "Enter a valid email or leave it empty.";
    if (file && file.size > 10 * 1024 * 1024) next.file = "The file must be under 10 MB.";
    return next;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    setSubmitError("");
    if (Object.keys(next).length > 0) return;
    setBusy(true);
    try {
      const r = await submitOnboarding(
        {
          collegeName: form.college.trim(),
          approxStudents: form.studentCount || preview?.rowCount || "",
          contactPerson: form.contactName.trim(),
          contactPhone: form.contactPhone.trim(),
          contactEmail: form.contactEmail.trim(),
        },
        file,
      );
      setReceipt(r);
    } catch (x) {
      setSubmitError(x.message);
    }
    setBusy(false);
  }

  if (receipt) {
    const wa = buildAdminWaLink(
      `Hi Anobyt! We just sent an onboarding request for ${form.college} (reference ${receipt.id}). Contact: ${form.contactName}, ${form.contactPhone}.`,
    );
    return (
      <Page narrow={620}>
        <Head title="Request received">We've got your batch details for {form.college}.</Head>
        <div className="panel">
          <p style={{ margin: 0, color: "var(--color-fg-muted)" }}>
            {receipt.message || "Our team will reach out shortly."}
            {receipt.studentRows ? (
              <>
                {" "}
                We read <b style={{ color: "var(--color-fg)" }}>{receipt.studentRows}</b> student{receipt.studentRows === 1 ? "" : "s"} from your file.
              </>
            ) : file ? null : " Send the student list whenever it's ready; we'll take it from there."}
          </p>
          <p className="note">Reference: {receipt.id}</p>
          <div className="row" style={{ marginTop: 18 }}>
            <a className="btn ghost" href={wa} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon className="h-4 w-4" />
              Also ping us on WhatsApp
            </a>
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                setReceipt(null);
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
        For placement cells and coordinators. Send us your student list and we create every student's login, match mentors, schedule
        interviews and send the confirmations.
      </Head>
      <Cards
        items={[
          ["📊", "Bulk upload", "Send your student list as an Excel sheet. No manual entry."],
          ["🔑", "Logins for every student", "Students sign in with your college code and their registration number."],
          ["🧑‍🏫", "Tests, interviews and scorecards", "Proctored tests, mock interviews with mentors and a shortlist you can export."],
        ]}
      />

      <div className="tools" style={{ marginTop: 36, alignItems: "start" }}>
        <form className="panel" onSubmit={handleSubmit} noValidate id="bulk-onboard">
          <h3 style={{ fontSize: 20 }}>Bulk onboard students</h3>
          <div className="two">
            <Field label="College name" error={errors.college}>
              <input type="text" value={form.college} onChange={(e) => update("college", e.target.value)} placeholder="e.g. Your College Name" maxLength={200} className={inputClass(errors.college)} />
            </Field>
            <Field label="Approx. number of students" hint="Optional">
              <input type="number" min="1" max="100000" value={form.studentCount} onChange={(e) => update("studentCount", e.target.value)} placeholder="60" className={inputClass()} />
            </Field>
          </div>
          <div className="two">
            <Field label="Contact person" error={errors.contactName}>
              <input type="text" value={form.contactName} onChange={(e) => update("contactName", e.target.value)} placeholder="Placement coordinator name" maxLength={100} className={inputClass(errors.contactName)} />
            </Field>
            <Field label="Contact phone" error={errors.contactPhone}>
              <input type="tel" value={form.contactPhone} onChange={(e) => update("contactPhone", e.target.value)} placeholder="70xxxxxxxx" maxLength={20} className={inputClass(errors.contactPhone)} />
            </Field>
          </div>
          <Field label="Contact email" error={errors.contactEmail} hint="Optional. We'll send a confirmation here.">
            <input type="email" value={form.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} placeholder="placements@college.edu" maxLength={200} className={inputClass(errors.contactEmail)} />
          </Field>

          <Field label="Student list (Excel / CSV)" error={errors.file} hint="Optional now, but it lets us set up logins straight away.">
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

          {submitError && <p className="note bad">{submitError}</p>}
          <div className="row" style={{ marginTop: 22 }}>
            <button type="submit" className="btn" disabled={busy}>
              {busy ? "Sending…" : "Confirm and register"}
            </button>
          </div>
          <div className="note">
            Your file goes straight to the Anobyt team. Already onboarded? Students can{" "}
            <Link className="linkish" to="/login">
              sign in here
            </Link>
            .
          </div>
        </form>

        <div className="panel">
          <h3 style={{ fontSize: 20 }}>Use our template</h3>
          <p style={{ margin: "8px 0 18px", color: "var(--color-fg-muted)" }}>
            So we can match columns correctly: {TEMPLATE_HEADERS.join(", ")}. Each student needs a reg no or an email to log in.
          </p>
          <button type="button" className="btn ghost" onClick={downloadTemplate}>
            Download Excel template
          </button>
          <ul className="ck" style={{ marginTop: 20 }}>
            <li>Fill one row per student and replace the sample row</li>
            <li>Upload it with the form, up to 10 MB</li>
            <li>We share each student's first-time password with you</li>
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
