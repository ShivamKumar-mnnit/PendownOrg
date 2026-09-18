import { Rocket, MessageCircleHeart, SlidersHorizontal, Network, ShieldCheck, HeartHandshake } from "lucide-react";
import SectionHeading from "../components/SectionHeading";

const POINTS = [
  {
    icon: Rocket,
    title: "Built for how students actually prep",
    desc: "No dashboards to log into, no courses to sit through — book, show up, improve.",
  },
  {
    icon: MessageCircleHeart,
    title: "WhatsApp-first, by design",
    desc: "Booking, confirmations, and follow-ups happen where students already are.",
  },
  {
    icon: SlidersHorizontal,
    title: "Sessions that flex to you",
    desc: "Pick your domain and session type — the format adapts, not the other way round.",
  },
  {
    icon: Network,
    title: "A growing mentor network",
    desc: "New mentors across domains, matched to demand as more students book in.",
  },
  {
    icon: ShieldCheck,
    title: "Honest feedback, always",
    desc: "You'll hear what needs work — that's the point of a mock interview.",
  },
  {
    icon: HeartHandshake,
    title: "Campus-first partnerships",
    desc: "Built alongside placement cells, starting with NIT Allahabad, not bolted on after.",
  },
];

export default function Differentiators() {
  return (
    <section className="border-y border-(--color-border) bg-(--color-surface-alt)">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <SectionHeading eyebrow="What Makes Us Different" title="Built different, on purpose" />

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {POINTS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-emerald-400/20">
                <Icon className="h-5 w-5 text-(--color-accent)" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-(--color-fg)">{title}</h3>
                <p className="mt-1.5 text-sm text-(--color-fg-muted)">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
