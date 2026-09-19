import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";
import SectionHeading from "../components/SectionHeading";
import Reveal from "../components/Reveal";

const FAQS = [
  {
    q: "Is AlgoMate free?",
    a: "It depends on your college's partnership or the type of session you book. Message us on WhatsApp and we'll tell you exactly what applies to you before you commit to anything.",
  },
  {
    q: "How do I book a session?",
    a: "Go to the Book a Session page, fill in your name, phone, session type, and domain, and confirm. We'll match you with a mentor and follow up with your slot on WhatsApp.",
  },
  {
    q: "What if I need to reschedule?",
    a: "Just message us on WhatsApp — no forms, no cancellation flow to navigate. We'll find a new slot that works.",
  },
  {
    q: "Do I need prior interview experience?",
    a: "No. Sessions are built around where you're starting from, whether this is your first mock interview or your tenth.",
  },
  {
    q: "How are mentors matched to me?",
    a: "Based on the domain you select when you book — SDE, Data/AI, Product, Consulting, Cybersecurity, and more.",
  },
  {
    q: "Is this only for NIT Allahabad students?",
    a: "NIT Allahabad is our founding campus partner, but any student can book a session directly, and other placement cells can reach out to onboard their batch too.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState(0);

  return (
    <section className="border-y border-(--color-border) bg-(--color-surface-alt)">
      <div className="mx-auto max-w-3xl px-5 py-20">
        <Reveal>
          <SectionHeading eyebrow="Knowledge Base" title="Frequently asked questions" />
        </Reveal>

        <Reveal
          as="div"
          delay={0.1}
          className="mt-10 divide-y divide-(--color-border) rounded-2xl border border-(--color-border) bg-(--color-surface)"
        >
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q}>
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-medium text-(--color-fg)">{item.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-(--color-fg-faint) transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 text-sm text-(--color-fg-muted)">{item.a}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
