import { Link } from "react-router-dom";
import { Code2, BrainCircuit, LineChart, Briefcase } from "lucide-react";
import SectionHeading from "../components/SectionHeading";
import Reveal from "../components/Reveal";
import { StaggerGrid, StaggerItem } from "../components/StaggerGrid";

// Role archetypes, not specific named individuals — mentor pool is matched
// per booking rather than browsable by name for now.
const ARCHETYPES = [
  {
    icon: Code2,
    role: "SDE Mentor",
    blurb: "Working software engineers at product and service companies, focused on coding & system design rounds.",
  },
  {
    icon: BrainCircuit,
    role: "Data / AI Mentor",
    blurb: "Practitioners in ML, data science, and applied AI who run case-style and applied technical rounds.",
  },
  {
    icon: LineChart,
    role: "Product Mentor",
    blurb: "Product folks who cover product sense, metrics, and guesstimate-style interview rounds.",
  },
  {
    icon: Briefcase,
    role: "Consulting Mentor",
    blurb: "Case-interview practitioners who help structure problem-solving under time pressure.",
  },
];

export default function MentorProfiles() {
  return (
    <section className="border-y border-(--color-border) bg-(--color-surface-alt)">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <Reveal>
          <SectionHeading
            eyebrow="Who Mentors You"
            title="Matched to a mentor in your domain"
            subtitle="Every booking is matched to a mentor whose background fits the domain you select — not a random queue."
          />
        </Reveal>

        <StaggerGrid className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ARCHETYPES.map(({ icon: Icon, role, blurb }) => (
            <StaggerItem key={role}>
              <Link
                to="/book"
                className="group block h-full rounded-2xl border border-(--color-border) bg-(--color-surface) p-6 hover:border-(--color-accent)/40 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
                  <Icon className="h-5 w-5 text-(--color-accent-emerald)" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-(--color-fg) group-hover:text-(--color-accent) transition-colors">
                  {role}
                </h3>
                <p className="mt-2 text-sm text-(--color-fg-muted)">{blurb}</p>
              </Link>
            </StaggerItem>
          ))}
        </StaggerGrid>
      </div>
    </section>
  );
}
