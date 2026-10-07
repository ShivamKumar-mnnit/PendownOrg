import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { X, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { buildAdminWaLink, openWhatsApp } from "../lib/whatsapp";

const SESSION_KEY = "anobyt_demo_popup_seen";
const DELAY_MS = 5000;
// Pages that are already the booking flow itself, or aren't marketing
// pages at all — a lead popup on top of either would just be noise.
const SKIP_ROUTES = ["/book", "/admin", "/compiler"];

const STAGES = [
  { id: "1st-year", title: "1st Year", subtitle: "Just starting out" },
  { id: "2nd-year", title: "2nd Year", subtitle: "Building the base" },
  { id: "3rd-year", title: "3rd Year", subtitle: "Getting serious" },
  { id: "final-year", title: "Final Year", subtitle: "Placement season" },
  { id: "already-preparing", title: "Already Preparing", subtitle: "Sharpening the edge" },
];

function buildMessage(stage) {
  return [
    "Hi Anobyt! I'd like a placement roadmap.",
    "",
    `Stage: ${stage.title} (${stage.subtitle})`,
    "",
    "Please recommend what I should focus on next. Thank you!",
  ].join("\n");
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
  const [stageId, setStageId] = useState(null);
  const [error, setError] = useState("");
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

  function handleSubmit() {
    const stage = STAGES.find((s) => s.id === stageId);
    if (!stage) {
      setError("Pick a stage to continue.");
      return;
    }
    openWhatsApp(buildAdminWaLink(buildMessage(stage)));
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
            className="relative w-full max-w-lg rounded-2xl border border-(--color-border) bg-(--color-card) shadow-2xl"
            style={{ backdropFilter: "blur(20px)" }}
          >
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
                    We opened WhatsApp with your stage — tap <span className="font-medium text-(--color-fg)">Send</span> in
                    that chat and we'll recommend your roadmap.
                  </p>
                </div>
              ) : (
                <>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-(--color-accent)">
                    <Sparkles className="h-3.5 w-3.5" />
                    Personalize Your Path
                  </span>
                  <h2 className="mt-3 text-xl font-bold text-(--color-fg) sm:text-2xl">
                    Where are you in your placement journey?
                  </h2>
                  <p className="mt-2 text-sm text-(--color-fg-muted)">
                    Pick your stage — we'll recommend a roadmap built for exactly where you are.
                  </p>

                  <div className="mt-5 space-y-2.5">
                    {STAGES.map((stage) => {
                      const selected = stageId === stage.id;
                      return (
                        <button
                          key={stage.id}
                          type="button"
                          onClick={() => {
                            setStageId(stage.id);
                            setError("");
                          }}
                          className={`flex w-full items-center justify-between rounded-2xl border px-5 py-4 text-left transition-colors ${
                            selected
                              ? "border-(--color-accent) bg-(--color-accent)/5"
                              : "border-(--color-border) bg-(--color-input) hover:border-(--color-border-strong)"
                          }`}
                        >
                          <div>
                            <p className="text-sm font-semibold text-(--color-fg)">{stage.title}</p>
                            <p className="text-xs text-(--color-fg-muted)">{stage.subtitle}</p>
                          </div>
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                              selected ? "border-(--color-accent)" : "border-(--color-border-strong)"
                            }`}
                          >
                            {selected && <span className="h-2.5 w-2.5 rounded-full bg-(--color-accent)" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}

                  <div className="mt-6 flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={dismiss}
                      className="text-sm font-medium text-(--color-fg-muted) hover:text-(--color-fg) transition-colors"
                    >
                      Skip for now
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="inline-flex items-center gap-2 rounded-full bg-(--color-accent-solid) px-6 py-3 text-sm font-semibold text-white hover:bg-(--color-accent-solid-hover) transition-colors"
                    >
                      See my roadmap
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
