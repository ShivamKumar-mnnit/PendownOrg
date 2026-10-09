import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Head, Page } from "../components/ui";
import WhatsAppIcon from "../components/WhatsAppIcon";
import Select from "../components/Select";
import { DOMAIN_LABELS } from "../lib/domains";
import { buildAdminWaLink, openWhatsApp, normalizePhone } from "../lib/whatsapp";
import { usePageSEO } from "../lib/seo";

const SESSION_TYPES = ["Mock Interview", "1:1 Mentorship", "Resume & Career Review"];
// Short ids for links such as /book?type=mentorship from the Mentorship page.
const TYPE_IDS = { mock: SESSION_TYPES[0], mentorship: SESSION_TYPES[1], review: SESSION_TYPES[2] };

const EMPTY_FORM = { name: "", phone: "", sessionType: SESSION_TYPES[0], domain: "", company: "", resume: "" };

const HIGHLIGHTS = ["Matched to a mentor in your domain", "Confirmed on WhatsApp, not email", "Resume reviewed ahead of your session"];

function buildMessage({ name, phone, sessionType, domain, company, resume }) {
  const lines = [
    `Hi Anobyt! I'd like to book a *${sessionType}*.`,
    "",
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Domain: ${domain}`,
  ];
  if (company.trim()) lines.push(`Target Company: ${company.trim()}`);
  if (resume.trim()) lines.push(`Resume: ${resume.trim()}`);
  lines.push("", "Please share the next available slot. Thank you!");
  return lines.join("\n");
}

export default function Book() {
  usePageSEO({
    title: "Book a Mock Interview or Mentorship Session",
    description:
      "Register for a 1:1 mock interview or mentorship session. Tell us your domain and we'll match you with a mentor and confirm your slot on WhatsApp.",
    path: "/book",
  });

  const [searchParams] = useSearchParams();
  const prefillCompany = searchParams.get("company") || "";
  const prefillDomain = DOMAIN_LABELS.includes(searchParams.get("domain")) ? searchParams.get("domain") : "";

  const prefillType = TYPE_IDS[searchParams.get("type")] || SESSION_TYPES[0];

  const [form, setForm] = useState(() => ({ ...EMPTY_FORM, sessionType: prefillType, company: prefillCompany, domain: prefillDomain }));
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
      <Page narrow={620}>
        <Head title="You're registered!">
          We've got your details for a {form.sessionType} in {form.domain}. We'll match you with a mentor and confirm your
          slot soon.
        </Head>
        <div className="panel">
          <p style={{ margin: 0, color: "var(--color-fg-muted)" }}>
            We also opened WhatsApp with your details, addressed to our team. If it opened in another tab, just tap{" "}
            <b style={{ color: "var(--color-fg)" }}>Send</b> there to complete your registration. If it didn't open, use the
            button below.
          </p>
          <div className="row" style={{ marginTop: 18 }}>
            <a className="btn" href={submittedLink} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon className="h-4 w-4" />
              Open WhatsApp and send
            </a>
            <button type="button" className="btn ghost" onClick={startOver}>
              Register another session
            </button>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page narrow={760}>
      <Head title={prefillCompany ? `Let's mock your ${prefillCompany} interview` : "Book a session"}>
        Tell us who you are and what you're prepping for. We'll match you with a mentor in your domain and confirm your slot
        on WhatsApp.
      </Head>
      <div className="row" style={{ marginBottom: 24 }}>
        {HIGHLIGHTS.map((text) => (
          <span className="chip" key={text}>
            {text}
          </span>
        ))}
      </div>

      <form className="panel" onSubmit={handleSubmit} noValidate>
        <div className="two">
          <Field label="Full name" error={errors.name}>
            <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)} className={inputClass(errors.name)} />
          </Field>
          <Field label="Phone number" error={errors.phone} hint="We'll contact you on this number via WhatsApp.">
            <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} className={inputClass(errors.phone)} />
          </Field>
        </div>

        <div className="two">
          <Field label="Session type">
            <Select value={form.sessionType} onChange={(v) => update("sessionType", v)} options={SESSION_TYPES} />
          </Field>
          <Field label="Domain" error={errors.domain}>
            <Select
              value={form.domain}
              onChange={(v) => update("domain", v)}
              options={DOMAIN_LABELS}
              placeholder="Select a domain"
              error={errors.domain}
            />
          </Field>
        </div>

        <div className="two">
          <Field label="Target company" hint="Optional. We'll tailor the mock interview to their process.">
            <input
              type="text"
              value={form.company}
              onChange={(e) => update("company", e.target.value)}
              placeholder="e.g. Google, TCS, Deloitte..."
              className={inputClass()}
            />
          </Field>
          <Field label="Resume link" hint="Optional. Google Drive, LinkedIn, etc.">
            <input
              type="text"
              value={form.resume}
              onChange={(e) => update("resume", e.target.value)}
              placeholder="https://drive.google.com/..."
              className={inputClass()}
            />
          </Field>
        </div>

        <div className="row" style={{ marginTop: 22 }}>
          <button type="submit" className="btn">
            Confirm and register
          </button>
        </div>
        <div className="note">This also opens WhatsApp with your details ready to send to our team.</div>
      </form>

      <div className="note" style={{ marginTop: 20 }}>
        Onboarding students in bulk instead?{" "}
        <Link to="/colleges" style={{ color: "var(--color-accent)" }}>
          Go to the colleges page
        </Link>
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
