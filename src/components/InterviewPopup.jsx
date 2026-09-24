import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { X, Sparkles, CheckCircle2 } from "lucide-react";
import Select from "./Select";
import { DOMAIN_LABELS } from "../lib/domains";
import { buildAdminWaLink, openWhatsApp, normalizePhone } from "../lib/whatsapp";

const SESSION_KEY = "anobyt_demo_popup_seen";
const DELAY_MS = 5000;
// Pages that are already the booking flow itself, or aren't marketing
// pages at all — a lead popup on top of either would just be noise.
const SKIP_ROUTES = ["/book", "/admin", "/compiler"];

const EMPTY_FORM = { name: "", phone: "", domain: "", college: "" };

function buildMessage({ name, phone, domain, college }) {
  const lines = [
    "Hi Anobyt! I'd like to book a *Free 1:1 Mock Interview*.",
    "",
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Domain: ${domain}`,
  ];
  if (college.trim()) lines.push(`College: ${college.trim()}`);
  lines.push("", "Please share the next available slot. Thank you!");
  return lines.join("\n");
}

/**
 * Timed lead-capture popup — appears once per browser session, 5s after
 * landing on a marketing page. Submitting it does exactly what /book does
 * (build a WhatsApp message, open it addressed to the admin): there's no
 * backend here to "notify" any other way, so WhatsApp *is* the
 * notification, same as everywhere else on the site.
 */
export default function InterviewPopup() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (SKIP_ROUTES.includes(pathname)) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const timer = setTimeout(() => {
      if (!sessionStorage.getItem(SESSION_KEY)) setVisible(true);
    }, DELAY_MS);
    return () => clearTimeout(timer);
  }, [pathname]);

  function dismiss() {
    setVisible(false);
    sessionStorage.setItem(SESSION_KEY, "1");
  }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = "Enter your name.";
    if (normalizePhone(form.phone).length !== 12) next.phone = "Enter a valid 10-digit phone number.";
    if (!form.domain) next.domain = "Select a domain.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    openWhatsApp(buildAdminWaLink(buildMessage(form)));
    sessionStorage.setItem(SESSION_KEY, "1");
    setSent(true);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={dismiss}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-card) shadow-2xl"
            style={{ backdropFilter: "blur(20px)" }}
          >
            <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-emerald-400" />

            <button
              type="button"
              onClick={dismiss}
              aria-label="Close"
              className="absolute right-4 top-6 flex h-8 w-8 items-center justify-center rounded-full border border-(--color-border) bg-(--color-card) text-(--color-fg-muted) hover:text-(--color-fg) transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="p-6 sm:p-8">
            {sent ? (
              <div className="py-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
                  <CheckCircle2 className="h-6 w-6 text-(--color-accent-emerald)" />
                </div>
                <h2 className="mt-4 text-lg font-bold text-(--color-fg)">Almost there!</h2>
                <p className="mt-2 text-sm text-(--color-fg-muted)">
                  We opened WhatsApp with your details — tap <span className="font-medium text-(--color-fg)">Send</span> in
                  that chat to confirm your free mock interview slot.
                </p>
              </div>
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-(--color-accent)/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-(--color-accent)">
                  <Sparkles className="h-3 w-3" />
                  Free 1:1 Mock Interview
                </span>
                <h2 className="mt-3 text-xl font-bold text-(--color-fg)">Reserve your free mock interview slot</h2>
                <p className="mt-1.5 text-sm text-(--color-fg-muted)">
                  Tell us a bit about you — we'll match you with a mentor and confirm your slot on WhatsApp.
                </p>

                <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-3.5">
                  <div className="grid gap-3.5 sm:grid-cols-2">
                    <div>
                      <input
                        type="text"
                        placeholder="Full name"
                        value={form.name}
                        onChange={(e) => update("name", e.target.value)}
                        className={inputClass(errors.name)}
                      />
                      {errors.name && <p className="mt-1 text-xs text-rose-400">{errors.name}</p>}
                    </div>

                    <div>
                      <input
                        type="tel"
                        placeholder="WhatsApp phone number"
                        value={form.phone}
                        onChange={(e) => update("phone", e.target.value)}
                        className={inputClass(errors.phone)}
                      />
                      {errors.phone && <p className="mt-1 text-xs text-rose-400">{errors.phone}</p>}
                    </div>
                  </div>

                  <div className="grid gap-3.5 sm:grid-cols-2">
                    <div>
                      <Select
                        value={form.domain}
                        onChange={(v) => update("domain", v)}
                        options={DOMAIN_LABELS}
                        placeholder="Select a domain"
                        error={errors.domain}
                      />
                      {errors.domain && <p className="mt-1 text-xs text-rose-400">{errors.domain}</p>}
                    </div>

                    <input
                      type="text"
                      placeholder="College / Institution (optional)"
                      value={form.college}
                      onChange={(e) => update("college", e.target.value)}
                      className={inputClass()}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-full bg-gradient-to-r from-emerald-400 to-indigo-500 px-6 py-3.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-shadow"
                  >
                    Confirm on WhatsApp
                  </button>
                  <p className="text-center text-[11px] text-(--color-fg-faint)">
                    Opens WhatsApp with your details ready to send to our team.
                  </p>
                </form>
              </>
            )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function inputClass(error) {
  return `w-full rounded-xl border bg-(--color-input) px-4 py-3 text-sm text-(--color-fg) placeholder-(--color-fg-faint) outline-none transition-[border-color,box-shadow] focus:border-(--color-accent) focus:shadow-[0_0_0_4px_rgba(79,70,229,0.15)] ${
    error ? "border-rose-500/60" : "border-(--color-border)"
  }`;
}
