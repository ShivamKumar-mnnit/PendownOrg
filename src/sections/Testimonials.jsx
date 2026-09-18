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
          <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <Quote className="h-5 w-5 text-indigo-400" />
            <p className="mt-4 text-sm text-zinc-300 italic">"{t.quote}"</p>
            <div className="mt-5 border-t border-white/10 pt-4">
              <p className="text-sm font-semibold text-white">{t.name}</p>
              <p className="text-xs text-zinc-500">{t.meta}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
