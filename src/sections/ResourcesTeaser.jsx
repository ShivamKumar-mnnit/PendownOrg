import { Sparkles } from "lucide-react";
import Reveal from "../components/Reveal";
import { StaggerGrid, StaggerItem } from "../components/StaggerGrid";

// No fabricated blog posts — just the topics we plan to cover, clearly
// framed as upcoming rather than pretending content already exists.
const TOPICS = [
  "System Design Basics",
  "Behavioral Interview Playbook",
  "Resume Dos & Don'ts",
  "DSA Patterns Cheat Sheet",
  "Product Sense Frameworks",
  "Case Interview Structures",
];

export default function ResourcesTeaser() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <Reveal
        as="div"
        className="rounded-3xl border border-(--color-border) bg-(--color-card) p-8 sm:p-12 text-center"
      >
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-(--color-border) bg-(--color-input) px-4 py-1.5 text-xs font-medium text-(--color-fg-muted)">
          <Sparkles className="h-3.5 w-3.5 text-(--color-accent-emerald)" />
          Coming Soon
        </div>
        <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-(--color-fg)">Resources &amp; Prep Guides</h2>
        <p className="mx-auto mt-3 max-w-lg text-(--color-fg-muted)">
          We're putting together short, practical guides on the topics mentors
          get asked about most. Here's what's on the list:
        </p>

        <StaggerGrid className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {TOPICS.map((t) => (
            <StaggerItem
              key={t}
              hover={false}
              className="rounded-full border border-(--color-border) bg-(--color-surface) px-4 py-2 text-sm text-(--color-fg-muted)"
            >
              {t}
            </StaggerItem>
          ))}
        </StaggerGrid>
      </Reveal>
    </section>
  );
}
