import { Building2, Cpu, Rocket, FlaskConical, Briefcase, Landmark } from "lucide-react";
import Reveal from "../components/Reveal";
import { StaggerGrid, StaggerItem } from "../components/StaggerGrid";

// Category tiles rather than specific company logos — AlgoMate doesn't
// have verified alumni placements at named companies yet, so this stays
// honest about the *kinds* of roles students prep for. Swap this grid for
// real hiring-partner logos the moment there's confirmed data — the card
// below is deliberately styled to drop real logos into later.
const CATEGORIES = [
  { label: "Product Companies", icon: Building2 },
  { label: "Service & IT Companies", icon: Cpu },
  { label: "Startups", icon: Rocket },
  { label: "Core Tech / R&D", icon: FlaskConical },
  { label: "Consulting Firms", icon: Briefcase },
  { label: "Fintech", icon: Landmark },
];

export default function IndustryReach() {
  return (
    <section className="relative isolate overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
        style={{
          background:
            "radial-gradient(700px circle at 50% 0%, rgba(99,102,241,0.18), transparent 60%), radial-gradient(500px circle at 85% 60%, rgba(236,72,153,0.12), transparent 60%)",
        }}
      />

      <div className="mx-auto max-w-5xl px-5 py-20 text-center">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-widest text-(--color-accent)">Where Mentees Aim</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-(--color-fg)">
            Prep built for <span className="brand-gradient">every kind</span> of tech interview
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-(--color-fg-muted)">
            Every domain you can pick when you book maps to real interview formats —
            not a generic quiz bank.
          </p>
        </Reveal>

        <Reveal as="div" delay={0.15} className="mt-10 rounded-3xl bg-white p-8 sm:p-10 shadow-2xl shadow-indigo-950/10 ring-1 ring-black/5">
          <StaggerGrid className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
            {CATEGORIES.map(({ label, icon: Icon }) => (
              <StaggerItem
                key={label}
                className="flex flex-col items-center justify-center gap-2.5 rounded-2xl px-4 py-6 hover:bg-zinc-50 transition-colors"
              >
                <Icon className="h-6 w-6 text-zinc-500" strokeWidth={1.75} />
                <span className="text-sm font-semibold text-zinc-800 text-center">{label}</span>
              </StaggerItem>
            ))}
          </StaggerGrid>
        </Reveal>
      </div>
    </section>
  );
}
