import { lazy, Suspense } from "react";
import { Briefcase, Target, Calendar, GraduationCap, Unlock } from "lucide-react";
import Reveal from "../components/Reveal";
import { StaggerGrid, StaggerItem } from "../components/StaggerGrid";

const PlanetNetwork = lazy(() => import("../components/PlanetNetwork"));

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

// Fixed-dark section (like the Hero) so the space-themed backdrop reads
// correctly regardless of the site's light/dark toggle — same exception
// pattern, used here because the scene is inherently a dark/space visual.
export default function WhyAnobyt() {
  return (
    <section className="relative isolate min-h-[680px] overflow-hidden" style={{ backgroundColor: "#050b14" }}>
      <div className="pointer-events-none absolute inset-0 -z-10">
        <Suspense fallback={null}>
          <PlanetNetwork />
        </Suspense>
      </div>

      <div className="relative mx-auto flex min-h-[680px] max-w-6xl flex-col justify-center px-5 py-20">
        <Reveal>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Why Anobyt</p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-white">Interview prep, minus the friction</h2>
          </div>
        </Reveal>

        {/* Cards sit left/right, leaving the middle open so the network
            scene behind them stays the visual focus, not covered by a
            dedicated center element like the old single-globe layout. */}
        <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:gap-24">
          <StaggerGrid className="grid gap-4">
            {LEFT.map((p) => (
              <Card key={p.title} {...p} />
            ))}
          </StaggerGrid>

          <StaggerGrid className="grid gap-4">
            {RIGHT.map((p) => (
              <Card key={p.title} {...p} />
            ))}
          </StaggerGrid>
        </div>
      </div>
    </section>
  );
}
