import { UserCheck, Puzzle, Layers, Compass } from "lucide-react";
import SectionHeading from "../components/SectionHeading";
import Reveal from "../components/Reveal";
import { StaggerGrid, StaggerItem } from "../components/StaggerGrid";

const FEATURES = [
  {
    icon: UserCheck,
    title: "Sessions with working engineers",
    desc: "Your mentor is someone currently doing the job — not a script-reading interviewer.",
  },
  {
    icon: Puzzle,
    title: "Real interview formats",
    desc: "Rounds modeled on what companies actually ask — not generic quiz questions.",
  },
  {
    icon: Layers,
    title: "Domain-focused rounds",
    desc: "SDE, Data/AI, Product, Consulting, Cybersecurity — matched to your track, not one-size-fits-all.",
  },
  {
    icon: Compass,
    title: "Guidance beyond the code",
    desc: "Resume framing, story-telling for behavioral rounds, and how to talk about your projects.",
  },
];

export default function SessionStyle() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <Reveal>
        <SectionHeading
          eyebrow="How Sessions Are Run"
          title="Prep that mirrors the real thing"
          subtitle="No filler content — every session is built around what actually happens in an interview room."
        />
      </Reveal>

      <StaggerGrid className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <StaggerItem key={title} className="rounded-2xl border border-(--color-border) bg-(--color-card) p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
              <Icon className="h-5 w-5 text-(--color-accent-emerald)" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-(--color-fg)">{title}</h3>
            <p className="mt-2 text-sm text-(--color-fg-muted)">{desc}</p>
          </StaggerItem>
        ))}
      </StaggerGrid>
    </section>
  );
}
