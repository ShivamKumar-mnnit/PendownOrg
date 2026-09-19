import { Coffee, Target, MessagesSquare, FileCheck } from "lucide-react";
import SectionHeading from "../components/SectionHeading";
import Reveal from "../components/Reveal";
import { StaggerGrid, StaggerItem } from "../components/StaggerGrid";

const PHASES = [
  {
    icon: Coffee,
    phase: "Phase 1",
    title: "Warm-up & Goal Setting",
    desc: "Your mentor understands your background, target roles, and what you want out of the session.",
  },
  {
    icon: Target,
    phase: "Phase 2",
    title: "Core Round",
    desc: "The main event — a domain-specific technical, case, or product round, run like the real thing.",
  },
  {
    icon: MessagesSquare,
    phase: "Phase 3",
    title: "Behavioral Follow-Up",
    desc: "Practice talking through your projects and experience the way a panel would probe them.",
  },
  {
    icon: FileCheck,
    phase: "Phase 4",
    title: "Structured Feedback",
    desc: "A clear breakdown of what worked, what didn't, and what to fix before your next round.",
  },
];

export default function SessionStructure() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <Reveal>
        <SectionHeading eyebrow="Inside a Session" title="What an AlgoMate session looks like" />
      </Reveal>

      <StaggerGrid className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {PHASES.map(({ icon: Icon, phase, title, desc }, i) => (
          <StaggerItem key={title} hover={false} className="relative">
            {i < PHASES.length - 1 && (
              <div className="hidden lg:block absolute top-5 left-[calc(100%-0.5rem)] w-full h-px bg-(--color-border)" />
            )}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-(--color-border-strong) bg-(--color-surface)">
                <Icon className="h-4.5 w-4.5 text-(--color-accent)" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide text-(--color-fg-faint)">{phase}</span>
            </div>
            <h3 className="mt-4 text-base font-semibold text-(--color-fg)">{title}</h3>
            <p className="mt-2 text-sm text-(--color-fg-muted)">{desc}</p>
          </StaggerItem>
        ))}
      </StaggerGrid>
    </section>
  );
}
