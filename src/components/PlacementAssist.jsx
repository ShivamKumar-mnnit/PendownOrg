import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Bot, MessageCircle, Building2, CalendarCheck, Users, ChevronLeft, ChevronRight, X, Minus } from "lucide-react";
import { buildAdminWaLink } from "../lib/whatsapp";

const DISMISS_KEY = "anobyt_placement_assist_dismissed";
const AUTO_ADVANCE_MS = 6000;

// "Existing" AI-interview teaser kept as the first slide, plus new ones —
// each CTA points at something the site can actually do today (no fake
// WhatsApp "channel" link, no invented stats — same honesty rule as the
// rest of the site's copy).
const SLIDES = [
  {
    icon: Bot,
    title: "AI Mock Interviews",
    desc: "Practice with an AI interviewer — coming soon.",
    tag: "Coming Soon",
  },
  {
    icon: CalendarCheck,
    title: "Book a Free Mock Interview",
    desc: "1:1 with a real mentor, confirmed on WhatsApp.",
    cta: { label: "Book Now", to: "/book" },
  },
  {
    icon: Building2,
    title: "Company-Wise Prep",
    desc: "See hiring rounds for TCS, Google, Microsoft & more.",
    cta: { label: "Explore", to: "/#company-prep" },
  },
  {
    icon: Users,
    title: "Placement Cell?",
    desc: "Onboard your whole batch at once, mentors included.",
    cta: { label: "Learn More", to: "/colleges" },
  },
  {
    icon: MessageCircle,
    title: "Have a Question?",
    desc: "Message us directly — we usually reply fast.",
    cta: { label: "Chat on WhatsApp", href: buildAdminWaLink("Hi Anobyt! I have a question.") },
  },
];

/** Floating promo carousel stacked above the WhatsApp button — replaces the
 * old single-tooltip AIBotButton. Minimizes to a small badge (click to
 * reopen) or closes outright for the rest of the session. */
export default function PlacementAssist() {
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISS_KEY) === "1");
  const [minimized, setMinimized] = useState(false);
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (dismissed || minimized) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timerRef.current);
  }, [dismissed, minimized]);

  function close() {
    setDismissed(true);
    sessionStorage.setItem(DISMISS_KEY, "1");
  }

  if (dismissed) return null;

  const slide = SLIDES[index];
  const Icon = slide.icon;

  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        aria-label="Open placement assist"
        className="fixed bottom-[5.5rem] right-5 sm:bottom-[5.75rem] sm:right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-emerald-400 text-white shadow-lg shadow-indigo-900/20 hover:scale-105 active:scale-95 transition-transform"
      >
        <Bot className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-[5.5rem] right-5 sm:bottom-[5.75rem] sm:right-6 z-50 w-72">
      <div className="overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-card) shadow-2xl" style={{ backdropFilter: "blur(20px)" }}>
        <div className="flex items-center justify-between border-b border-(--color-border) px-3.5 py-2.5">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-(--color-fg-muted)">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Placement Assist
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMinimized(true)}
              aria-label="Minimize"
              className="flex h-6 w-6 items-center justify-center rounded-full text-(--color-fg-faint) hover:text-(--color-fg) transition-colors"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="flex h-6 w-6 items-center justify-center rounded-full text-(--color-fg-faint) hover:text-(--color-fg) transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="px-3.5 py-3.5"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-(--color-accent)/10">
                <Icon className="h-4.5 w-4.5 text-(--color-accent)" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-(--color-fg)">{slide.title}</p>
                  {slide.tag && (
                    <span className="shrink-0 rounded-full bg-(--color-input) px-2 py-0.5 text-[10px] font-medium text-(--color-fg-faint)">
                      {slide.tag}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-(--color-fg-muted)">{slide.desc}</p>
              </div>
            </div>

            {slide.cta && (
              <div className="mt-3">
                {slide.cta.to ? (
                  <Link
                    to={slide.cta.to}
                    className="inline-flex items-center justify-center w-full rounded-full bg-(--color-accent-solid) px-4 py-2 text-xs font-semibold text-white hover:bg-(--color-accent-solid-hover) transition-colors"
                  >
                    {slide.cta.label}
                  </Link>
                ) : (
                  <a
                    href={slide.cta.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full rounded-full bg-(--color-accent-solid) px-4 py-2 text-xs font-semibold text-white hover:bg-(--color-accent-solid-hover) transition-colors"
                  >
                    {slide.cta.label}
                  </a>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between border-t border-(--color-border) px-3.5 py-2">
          <button
            type="button"
            onClick={() => setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length)}
            aria-label="Previous"
            className="flex h-6 w-6 items-center justify-center rounded-full text-(--color-fg-faint) hover:text-(--color-fg) transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1.5">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-4 bg-(--color-accent)" : "w-1.5 bg-(--color-border-strong)"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % SLIDES.length)}
            aria-label="Next"
            className="flex h-6 w-6 items-center justify-center rounded-full text-(--color-fg-faint) hover:text-(--color-fg) transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
