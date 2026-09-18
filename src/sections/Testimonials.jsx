import { Quote } from "lucide-react";
import SectionHeading from "../components/SectionHeading";

// Placeholder cards — swap these for real student feedback once you have it.
// Keeping names/quotes generic on purpose so nothing here reads as a real endorsement yet.
const PLACEHOLDERS = [
  { quote: "Add a quote from a student about their mock interview experience.", name: "Student Name", meta: "Branch • College" },
  { quote: "Add a quote about how mentorship helped with their prep.", name: "Student Name", meta: "Branch • College" },
  { quote: "Add a quote about the WhatsApp booking / confirmation experience.", name: "Student Name", meta: "Branch • College" },
];

export default function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <SectionHeading eyebrow="What Students Say" title="Feedback from mentees" subtitle="Sample layout — replace with real testimonials as they come in." />

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PLACEHOLDERS.map((t, i) => (
          <div key={i} className="rounded-2xl border border-(--color-border) bg-(--color-card) p-6">
            <Quote className="h-5 w-5 text-(--color-accent)" />
            <p className="mt-4 text-sm text-(--color-fg-muted) italic">"{t.quote}"</p>
            <div className="mt-5 border-t border-(--color-border) pt-4">
              <p className="text-sm font-semibold text-(--color-fg)">{t.name}</p>
              <p className="text-xs text-(--color-fg-faint)">{t.meta}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
