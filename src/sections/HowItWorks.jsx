import { ClipboardList, Users, MessageCircle, Video } from "lucide-react";
import SectionHeading from "../components/SectionHeading";
import Reveal from "../components/Reveal";
import { StaggerGrid, StaggerItem } from "../components/StaggerGrid";

const STEPS = [
  {
    icon: ClipboardList,
    title: "Fill the booking form",
    desc: "Share your name, phone, domain & resume link. Takes under a minute.",
  },
  {
    icon: Users,
    title: "Get matched",
    desc: "We assign a mentor based on your domain and their availability.",
  },
  {
    icon: MessageCircle,
    title: "Confirm on WhatsApp",
    desc: "We message you your slot directly on WhatsApp — no login needed.",
  },
  {
    icon: Video,
    title: "Attend on Google Meet",
    desc: "Show up at your slot and get real, 1:1 interview practice.",
  },
];

export default function HowItWorks() {
  return (
    <section className="border-y border-(--color-border) bg-(--color-surface-alt)">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <Reveal>
          <SectionHeading eyebrow="How It Works" title="From form to feedback in four steps" />
        </Reveal>

        <StaggerGrid className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, desc }, i) => (
            <StaggerItem key={title} hover={false} className="relative">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-emerald-400 text-sm font-bold text-zinc-950">
                  {i + 1}
                </div>
                <Icon className="h-5 w-5 text-(--color-fg-faint)" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-(--color-fg)">{title}</h3>
              <p className="mt-2 text-sm text-(--color-fg-muted)">{desc}</p>
            </StaggerItem>
          ))}
        </StaggerGrid>
      </div>
    </section>
  );
}
