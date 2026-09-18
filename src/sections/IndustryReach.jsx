import SectionHeading from "../components/SectionHeading";

// Category badges rather than specific company logos — PenDown doesn't
// claim confirmed placements at named companies, so this stays honest
// about the *kinds* of roles students prep for.
const CATEGORIES = [
  "Product Companies",
  "Service & IT Companies",
  "Startups",
  "Core Tech / R&D",
  "Consulting Firms",
  "Fintech",
];

export default function IndustryReach() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 text-center">
      <SectionHeading eyebrow="Where Mentees Aim" title="Prep built for every kind of tech interview" />

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        {CATEGORIES.map((c) => (
          <span
            key={c}
            className="rounded-full border border-(--color-border) bg-(--color-card) px-5 py-2 text-sm text-(--color-fg-muted)"
          >
            {c}
          </span>
        ))}
      </div>
    </section>
  );
}
