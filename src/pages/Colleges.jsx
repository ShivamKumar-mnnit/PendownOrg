import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Download, UploadCloud, CheckCircle2, FileSpreadsheet, ExternalLink, ArrowRight,
  Users, CalendarCheck, MessageCircle,
} from "lucide-react";
import WhatsAppIcon from "../components/WhatsAppIcon";
import { buildAdminWaLink, openWhatsApp } from "../lib/whatsapp";

// Headers only — no sample name/phone/etc. filled in, so nothing that looks
// like real (or fake-but-realistic) student data ships in the template.
const TEMPLATE_HEADERS = ["Name", "Phone", "Domain", "Resume Link"];

const EMPTY_FORM = { college: "", contactName: "", contactPhone: "", studentCount: "" };

const HIGHLIGHTS = [
  { icon: Users, text: "Bulk-upload your whole batch at once" },
  { icon: CalendarCheck, text: "We assign mentors & slots per student" },
  { icon: MessageCircle, text: "Every student confirmed on WhatsApp" },
];

const introContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};
const introItem = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

async function downloadTemplate() {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Students");
  XLSX.writeFile(wb, "inobyt-student-template.xlsx");
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
    <AnimatePresence mode="wait">
      {sent ? (
        <motion.section
          key="success"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl px-5 py-24"
        >
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-8 text-center">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15"
            >
              <CheckCircle2 className="h-7 w-7 text-(--color-accent-emerald)" />
            </motion.div>
            <h2 className="mt-5 text-xl font-bold text-(--color-fg)">You're registered!</h2>
            <p className="mt-3 text-sm text-(--color-fg-muted)">
              We've got your batch details for <span className="text-(--color-fg) font-medium">{form.college}</span>.
              We also opened WhatsApp with a summary, addressed to our team — attach{" "}
              <span className="text-(--color-fg) font-medium">{file?.name}</span> in that chat and hit Send
              to complete your registration (a website can't attach files to WhatsApp on its own).
            </p>
            <a
              href={buildAdminWaLink(buildMessage(form, file?.name, preview?.rowCount))}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-white hover:brightness-110 transition-[filter]"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Open WhatsApp &amp; Send
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
                className="text-sm text-(--color-fg-faint) hover:text-(--color-fg) transition-colors"
              >
                Submit another batch
              </button>
            </div>
          </div>
        </motion.section>
      ) : (
        <motion.div key="form" exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          {/* Description first — what this page does and why, before we
              ask a coordinator to fill anything in. */}
          <section className="relative overflow-hidden">
            <div
              className="pointer-events-none absolute inset-0 -z-10 opacity-40"
              style={{
                background:
                  "radial-gradient(500px circle at 15% 0%, rgba(99,102,241,0.2), transparent 60%), radial-gradient(500px circle at 85% 10%, rgba(52,211,153,0.15), transparent 60%)",
              }}
            />
            <motion.div
              initial="hidden"
              animate="visible"
              variants={introContainer}
              className="mx-auto max-w-2xl px-5 pt-16 pb-10 sm:pt-20 text-center"
            >
              <motion.p variants={introItem} className="text-xs font-semibold uppercase tracking-widest text-(--color-accent)">
                For Colleges &amp; Placement Cells
              </motion.p>
              <motion.h1 variants={introItem} className="mt-3 text-3xl sm:text-4xl font-extrabold text-(--color-fg)">
                Onboard your whole batch at once.
              </motion.h1>
              <motion.p variants={introItem} className="mt-4 text-(--color-fg-muted)">
                Bulk-upload your students, and we handle mentor matching, scheduling, and
                WhatsApp confirmations for every one of them — the same way we work with
                NIT Allahabad.
              </motion.p>

              <motion.div variants={introItem} className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                {HIGHLIGHTS.map(({ icon: Icon, text }) => (
                  <span
                    key={text}
                    className="inline-flex items-center gap-2 rounded-full border border-(--color-border) bg-(--color-card) px-4 py-2 text-xs font-medium text-(--color-fg-muted)"
                  >
                    <Icon className="h-3.5 w-3.5 text-(--color-accent-emerald)" />
                    {text}
                  </span>
                ))}
              </motion.div>
            </motion.div>
          </section>

          <motion.section
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-2xl px-5 pb-16 sm:pb-20"
          >
            <div className="rounded-2xl border border-(--color-border) bg-(--color-card) p-6">
              <div className="flex items-start gap-3">
                <FileSpreadsheet className="h-5 w-5 shrink-0 text-(--color-accent) mt-0.5" />
                <div className="text-sm text-(--color-fg-muted)">
                  <p>
                    Use our template so we can match columns correctly — <span className="text-(--color-fg-muted)">Name, Phone, Domain, Resume Link</span>.
                  </p>
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className="mt-3 inline-flex items-center gap-2 rounded-full border border-(--color-border-strong) px-4 py-2 text-xs font-semibold text-(--color-fg) hover:bg-(--color-input) transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download Excel Template
                  </button>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className="mt-6 rounded-2xl border border-(--color-border) bg-(--color-card) p-6 sm:p-8 space-y-5">
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
                    placeholder="70xxxxxxxx"
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
                    errors.file ? "border-rose-500/60" : "border-(--color-border-strong) hover:border-(--color-accent)/50"
                  }`}
                >
                  <UploadCloud className="h-5 w-5 text-(--color-fg-faint)" />
                  <span className="text-(--color-fg-muted)">{file ? file.name : "Click to select a .xlsx, .xls or .csv file"}</span>
                </label>
                <input
                  id="student-file"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFile}
                  className="hidden"
                />
                {preview && (
                  <p className="mt-2 text-xs text-(--color-accent-emerald)">
                    Looks good — found {preview.rowCount} row{preview.rowCount === 1 ? "" : "s"}
                    {preview.names.length ? ` (e.g. ${preview.names.join(", ")}…)` : ""}.
                  </p>
                )}
                {parseError && <p className="mt-2 text-xs text-amber-400">{parseError}</p>}
              </Field>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-(--color-accent-solid) px-6 py-3.5 text-sm font-semibold text-white hover:bg-(--color-accent-solid-hover) transition-colors"
              >
                Confirm &amp; Register
                <ArrowRight className="h-4 w-4" />
              </motion.button>

              <p className="text-center text-xs text-(--color-fg-faint)">
                This also opens WhatsApp with your details ready — you'll attach the file
                and hit Send there to complete your registration.
              </p>
            </form>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, error, hint, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-(--color-fg-muted)">{label}</span>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <span className="mt-1.5 block text-xs text-rose-400">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-(--color-fg-faint)">{hint}</span>
      ) : null}
    </label>
  );
}

function inputClass(error) {
  return `w-full rounded-xl border bg-(--color-input) px-4 py-2.5 text-sm text-(--color-fg) placeholder-(--color-fg-faint) outline-none transition-colors focus:border-(--color-accent) ${
    error ? "border-rose-500/60" : "border-(--color-border)"
  }`;
}
