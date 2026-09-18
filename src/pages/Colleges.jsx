import { useState } from "react";
import { Download, UploadCloud, CheckCircle2, FileSpreadsheet, ExternalLink } from "lucide-react";
import WhatsAppIcon from "../components/WhatsAppIcon";
import { buildAdminWaLink, openWhatsApp } from "../lib/whatsapp";

const TEMPLATE_HEADERS = ["Name", "Phone", "Domain", "Resume Link"];
const TEMPLATE_SAMPLE = [
  { Name: "Ananya Sharma", Phone: "9876543210", Domain: "Software Development (SDE)", "Resume Link": "https://drive.google.com/..." },
];

const EMPTY_FORM = { college: "", contactName: "", contactPhone: "", studentCount: "" };

async function downloadTemplate() {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(TEMPLATE_SAMPLE, { header: TEMPLATE_HEADERS });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Students");
  XLSX.writeFile(wb, "pendown-student-template.xlsx");
}

function buildMessage(form, fileName, rowCount) {
  const lines = [
    "Hi PenDown! We'd like to bulk-onboard students for mock interviews / mentorship.",
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

  return (
    <section className="mx-auto max-w-2xl px-5 py-16 sm:py-20">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">For Colleges &amp; Placement Cells</h1>
        <p className="mt-3 text-zinc-400">
          Bulk-onboard your students in one go. We match mentors, schedule sessions,
          and confirm every slot on WhatsApp — the same way we work with NIT Allahabad.
        </p>
      </div>

      <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="h-5 w-5 shrink-0 text-indigo-400 mt-0.5" />
          <div className="text-sm text-zinc-400">
            <p>
              Use our template so we can match columns correctly — <span className="text-zinc-300">Name, Phone, Domain, Resume Link</span>.
            </p>
            <button
              type="button"
              onClick={downloadTemplate}
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white hover:bg-white/5 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Download Excel Template
            </button>
          </div>
        </div>
      </div>

      {sent ? (
        <div className="mt-10 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
            <CheckCircle2 className="h-7 w-7 text-emerald-400" />
          </div>
          <h2 className="mt-5 text-xl font-bold text-white">Almost done — one more step</h2>
          <p className="mt-3 text-sm text-zinc-400">
            We opened WhatsApp with your details filled in. WhatsApp doesn't let
            websites attach files automatically, so please{" "}
            <span className="text-white font-medium">
              attach the Excel file you selected ({file?.name})
            </span>{" "}
            in that chat and hit Send. We'll confirm receipt on WhatsApp shortly.
          </p>
          <a
            href={buildAdminWaLink(buildMessage(form, file?.name, preview?.rowCount))}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-white hover:brightness-110 transition-[filter]"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Reopen WhatsApp
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <div className="mt-5">
            <button
              onClick={() => {
                setSent(false);
                setForm(EMPTY_FORM);
                setFile(null);
                setPreview(null);
              }}
              className="text-sm text-zinc-500 hover:text-white transition-colors"
            >
              Submit another batch
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
          <Field label="College Name" error={errors.college}>
            <input
              type="text"
              value={form.college}
              onChange={(e) => update("college", e.target.value)}
              placeholder="NIT Allahabad"
              className={inputClass(errors.college)}
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Contact Person" error={errors.contactName}>
              <input
                type="text"
                value={form.contactName}
                onChange={(e) => update("contactName", e.target.value)}
                placeholder="Placement Coordinator Name"
                className={inputClass(errors.contactName)}
              />
            </Field>
            <Field label="Contact Phone" error={errors.contactPhone}>
              <input
                type="tel"
                value={form.contactPhone}
                onChange={(e) => update("contactPhone", e.target.value)}
                placeholder="98765 43210"
                className={inputClass(errors.contactPhone)}
              />
            </Field>
          </div>

          <Field label="Approx. Number of Students" hint="Optional">
            <input
              type="number"
              min="0"
              value={form.studentCount}
              onChange={(e) => update("studentCount", e.target.value)}
              placeholder="60"
              className={inputClass()}
            />
          </Field>

          <Field label="Student List (Excel / CSV)" error={errors.file}>
            <label
              htmlFor="student-file"
              className={`flex cursor-pointer items-center gap-3 rounded-xl border border-dashed px-4 py-4 text-sm transition-colors ${
                errors.file ? "border-rose-500/60" : "border-white/15 hover:border-white/30"
              }`}
            >
              <UploadCloud className="h-5 w-5 text-zinc-500" />
              <span className="text-zinc-400">{file ? file.name : "Click to select a .xlsx, .xls or .csv file"}</span>
            </label>
            <input
              id="student-file"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFile}
              className="hidden"
            />
            {preview && (
              <p className="mt-2 text-xs text-emerald-400">
                Looks good — found {preview.rowCount} row{preview.rowCount === 1 ? "" : "s"}
                {preview.names.length ? ` (e.g. ${preview.names.join(", ")}…)` : ""}.
              </p>
            )}
            {parseError && <p className="mt-2 text-xs text-amber-400">{parseError}</p>}
          </Field>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3.5 text-sm font-semibold text-white hover:brightness-110 transition-[filter]"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Send on WhatsApp
          </button>

          <p className="text-center text-xs text-zinc-600">
            This opens WhatsApp with your details filled in — you'll attach the file
            and hit Send yourself, right inside WhatsApp.
          </p>
        </form>
      )}
    </section>
  );
}

function Field({ label, error, hint, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-300">{label}</span>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <span className="mt-1.5 block text-xs text-rose-400">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-zinc-600">{hint}</span>
      ) : null}
    </label>
  );
}

function inputClass(error) {
  return `w-full rounded-xl border bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-indigo-400 ${
    error ? "border-rose-500/60" : "border-white/10"
  }`;
}
