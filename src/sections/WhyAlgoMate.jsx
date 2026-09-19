import { Briefcase, Target, Calendar, GraduationCap, Unlock } from "lucide-react";
import Reveal from "../components/Reveal";
import { StaggerGrid, StaggerItem } from "../components/StaggerGrid";
import EarthGlobe from "../components/EarthGlobe";
import StarField from "../components/StarField";

const POINTS = [
  {
    icon: Briefcase,
    title: "Mentors from industry",
    desc: "Get matched with professionals who've actually sat on the other side of the table.",
  },
  {
    icon: Target,
    title: "Feedback you can use",
    desc: "Detailed, honest feedback after every session — not just a pass/fail score.",
  },
  {
    icon: Calendar,
    title: "Slots that work for you",
    desc: "Pick a time, confirm over WhatsApp, and join by Google Meet.",
  },
  {
    icon: GraduationCap,
    title: "Built with campuses in mind",
    desc: "Designed alongside placement cells, starting with NIT Allahabad.",
  },
  {
    icon: Unlock,
    title: "No long commitments",
    desc: "Book a single session or keep going — nothing locks you in.",
  },
];

const LEFT = [POINTS[0], POINTS[1], POINTS[2]];
const RIGHT = [POINTS[3], POINTS[4]];

function Card({ icon: Icon, title, desc }) {
  return (
    <StaggerItem
      hover={false}
      className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15">
        <Icon className="h-5 w-5 text-emerald-400" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="mt-1 text-xs text-slate-400">{desc}</p>
      </div>
    </StaggerItem>
  );
}

// Fixed-dark section (like the Hero) so the space-themed globe reads
// correctly regardless of the site's light/dark toggle — same exception
// pattern, used here because the globe is inherently a dark/space visual.
export default function WhyAlgoMate() {
  return (
    <section className="relative isolate overflow-hidden" style={{ backgroundColor: "#050b14" }}>
      <div
        className="pointer-events-none absolute inset-0 -z-20"
        style={{ background: "radial-gradient(ellipse 70% 60% at 50% 45%, rgba(45,212,191,0.12), transparent 70%)" }}
      />
      <StarField className="-z-10" />

      <div className="relative mx-auto max-w-6xl px-5 py-20">
        <Reveal>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Why AlgoMate</p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-white">Interview prep, minus the friction</h2>
          </div>
        </Reveal>

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-[1fr_auto_1fr]">
          <StaggerGrid className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {LEFT.map((p) => (
              <Card key={p.title} {...p} />
            ))}
          </StaggerGrid>

          <Reveal delay={0.15} className="order-first lg:order-none">
            <EarthGlobe />
          </Reveal>

          <StaggerGrid className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {RIGHT.map((p) => (
              <Card key={p.title} {...p} />
            ))}
          </StaggerGrid>
        </div>
      </div>
    </section>
  );
}
