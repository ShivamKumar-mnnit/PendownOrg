import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, CheckCircle2, ExternalLink, Users, MessageCircle, FileCheck } from "lucide-react";
import WhatsAppIcon from "../components/WhatsAppIcon";
import Select from "../components/Select";
import { DOMAIN_LABELS } from "../lib/domains";
import { buildAdminWaLink, openWhatsApp, normalizePhone } from "../lib/whatsapp";
import { usePageSEO } from "../lib/seo";

const SESSION_TYPES = ["Mock Interview", "1:1 Mentorship"];

const EMPTY_FORM = { name: "", phone: "", sessionType: SESSION_TYPES[0], domain: "", resume: "" };

const HIGHLIGHTS = [
  { icon: Users, text: "Matched to a mentor in your domain" },
  { icon: MessageCircle, text: "Confirmed on WhatsApp, not email" },
  { icon: FileCheck, text: "Resume reviewed ahead of your session" },
];

const introContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};
const introItem = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

function buildMessage({ name, phone, sessionType, domain, resume }) {
  const lines = [
    `Hi Anobyt! I'd like to book a *${sessionType}*.`,
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
  usePageSEO({
    title: "Book a Mock Interview or Mentorship Session",
    description:
      "Register for a 1:1 mock interview or mentorship session. Tell us your domain and we'll match you with a mentor and confirm your slot on WhatsApp.",
    path: "/book",
  });

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

  return (
    <AnimatePresence mode="wait">
      {submittedLink ? (
        <motion.section
          key="success"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-lg px-5 py-24 text-center"
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15"
          >
            <CheckCircle2 className="h-7 w-7 text-(--color-accent-emerald)" />
          </motion.div>
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
        </motion.section>
      ) : (
        <motion.div key="form" exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          {/* Description / intro — comes before the form on purpose, so
              visitors know what they're signing up for before they're
              asked to fill anything in. */}
          <section className="relative overflow-hidden">
            <div
              className="pointer-events-none absolute inset-0 -z-10 opacity-40"
              style={{
                background:
                  "radial-gradient(500px circle at 20% 0%, rgba(99,102,241,0.2), transparent 60%), radial-gradient(500px circle at 80% 10%, rgba(52,211,153,0.15), transparent 60%)",
              }}
            />
            <motion.div
              initial="hidden"
              animate="visible"
              variants={introContainer}
              className="mx-auto max-w-2xl px-5 pt-16 pb-10 sm:pt-20 text-center"
            >
              <motion.p variants={introItem} className="text-xs font-semibold uppercase tracking-widest text-(--color-accent)">
                Book a Session
              </motion.p>
              <motion.h1 variants={introItem} className="mt-3 text-3xl sm:text-4xl font-extrabold text-(--color-fg)">
                Let's get you ready for the real thing.
              </motion.h1>
              <motion.p variants={introItem} className="mt-4 text-(--color-fg-muted)">
                Tell us who you are and what you're prepping for. We'll match you with a mentor
                in your domain and confirm your slot on WhatsApp — no dashboards, no waiting on email.
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

          {/* The form itself */}
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-lg px-5 pb-16 sm:pb-20"
          >
            <div className="rounded-2xl border border-(--color-border) bg-(--color-card) p-6 sm:p-8">
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
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
                  <Select
                    value={form.sessionType}
                    onChange={(v) => update("sessionType", v)}
                    options={SESSION_TYPES}
                  />
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

                <Field label="Resume Link" hint="Optional — Google Drive, LinkedIn, etc.">
                  <input
                    type="text"
                    value={form.resume}
                    onChange={(e) => update("resume", e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className={inputClass()}
                  />
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
                  This also opens WhatsApp with your details ready to send to our team.
                </p>
              </form>
            </div>

            <p className="mt-8 text-center text-sm text-(--color-fg-faint)">
              Onboarding students in bulk instead?{" "}
              <Link to="/colleges" className="text-(--color-accent) hover:opacity-75 transition-opacity">
                Go to the colleges page →
              </Link>
            </p>
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
