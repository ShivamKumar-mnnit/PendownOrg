import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, ExternalLink } from "lucide-react";
import WhatsAppIcon from "../components/WhatsAppIcon";
import { DOMAIN_LABELS } from "../lib/domains";
import { buildAdminWaLink, openWhatsApp, normalizePhone } from "../lib/whatsapp";

const SESSION_TYPES = ["Mock Interview", "1:1 Mentorship"];

const EMPTY_FORM = { name: "", phone: "", sessionType: SESSION_TYPES[0], domain: "", resume: "" };

function buildMessage({ name, phone, sessionType, domain, resume }) {
  const lines = [
    `Hi PenDown! I'd like to book a *${sessionType}*.`,
    "",
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Domain: ${domain}`,
  ];
  if (resume.trim()) lines.push(`Resume: ${resume.trim()}`);
  lines.push("", "Please share the next available slot. Thank you!");
  return lines.join("\n");
}

export default function Book() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submittedLink, setSubmittedLink] = useState(null);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = "Enter your full name.";
    const digits = normalizePhone(form.phone);
    if (digits.length !== 12) next.phone = "Enter a valid 10-digit phone number.";
    if (!form.domain) next.domain = "Select a domain.";
    return next;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const message = buildMessage(form);
    const link = buildAdminWaLink(message);
    // Auto-open WhatsApp (addressed to the admin) as part of registering, so
    // the same message the student sees lands on the admin's WhatsApp too.
    // WhatsApp itself still requires one tap on "Send" inside the chat that
    // opens — no website can skip that step — so we also keep the link
    // visible afterward in case the tab was blocked or the tap was missed.
    openWhatsApp(link);
    setSubmittedLink(link);
  }

  function startOver() {
    setForm(EMPTY_FORM);
    setErrors({});
    setSubmittedLink(null);
  }

  if (submittedLink) {
    return (
      <section className="mx-auto max-w-lg px-5 py-24 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
          <CheckCircle2 className="h-7 w-7 text-(--color-accent-emerald)" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-(--color-fg)">You're registered!</h1>
        <p className="mt-3 text-(--color-fg-muted)">
          We've got your details for a <span className="text-(--color-fg) font-medium">{form.sessionType}</span> in{" "}
          <span className="text-(--color-fg) font-medium">{form.domain}</span>. We'll match you with a
          mentor and confirm your slot soon.
        </p>

        <div className="mt-8 rounded-xl border border-(--color-border) bg-(--color-card) p-4 text-left">
          <p className="text-xs text-(--color-fg-faint)">
            We also opened WhatsApp with your details, addressed to our team — if it opened in
            another tab, just tap <span className="text-(--color-fg) font-medium">Send</span> there to
            complete your registration. If it didn't open, use the button below.
          </p>
          <a
            href={submittedLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#25D366]/40 px-4 py-2 text-xs font-semibold text-[#25D366] hover:bg-[#25D366]/10 transition-colors"
          >
            <WhatsAppIcon className="h-3.5 w-3.5" />
            Open WhatsApp &amp; Send
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <div className="mt-6">
          <button onClick={startOver} className="text-sm text-(--color-fg-faint) hover:text-(--color-fg) transition-colors">
            Register another session
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-lg px-5 py-16 sm:py-20">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-(--color-fg)">Book a Session</h1>
        <p className="mt-3 text-(--color-fg-muted)">
          Fill this in to register — we'll match you with a mentor and confirm your
          slot on WhatsApp.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-10 space-y-5">
        <Field label="Full Name" error={errors.name}>
          <input
            type="text"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className={inputClass(errors.name)}
          />
        </Field>

        <Field label="Phone Number" error={errors.phone} hint="We'll contact you on this number via WhatsApp.">
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            className={inputClass(errors.phone)}
          />
        </Field>

        <Field label="Session Type">
          <select
            value={form.sessionType}
            onChange={(e) => update("sessionType", e.target.value)}
            className={inputClass()}
          >
            {SESSION_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>

        <Field label="Domain" error={errors.domain}>
          <select
            value={form.domain}
            onChange={(e) => update("domain", e.target.value)}
            className={inputClass(errors.domain)}
          >
            <option value="">Select a domain</option>
            {DOMAIN_LABELS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </Field>

        <Field label="Resume Link" hint="Optional — Google Drive, LinkedIn, etc.">
          <input
            type="text"
            value={form.resume}
            onChange={(e) => update("resume", e.target.value)}
            placeholder="https://drive.google.com/..."
            className={inputClass()}
          />
        </Field>

        <button
          type="submit"
          className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-(--color-accent-solid) px-6 py-3.5 text-sm font-semibold text-white hover:bg-(--color-accent-solid-hover) transition-colors"
        >
          Confirm &amp; Register
          <ArrowRight className="h-4 w-4" />
        </button>

        <p className="text-center text-xs text-(--color-fg-faint)">
          This also opens WhatsApp with your details ready to send to our team.
        </p>
      </form>

      <p className="mt-10 text-center text-sm text-(--color-fg-faint)">
        Onboarding students in bulk instead?{" "}
        <Link to="/colleges" className="text-(--color-accent) hover:opacity-75 transition-opacity">
          Go to the colleges page →
        </Link>
      </p>
    </section>
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
