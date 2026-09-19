import { Link } from "react-router-dom";
import { Video, Users, Code2, FileText, ArrowUpRight } from "lucide-react";
import SectionHeading from "../components/SectionHeading";
import Reveal from "../components/Reveal";
import { StaggerGrid, StaggerItem } from "../components/StaggerGrid";

const OFFERINGS = [
  {
    icon: Video,
    title: "Mock Interviews",
    desc: "Realistic, company-style interview rounds with structured feedback you can actually act on.",
  },
  {
    icon: Users,
    title: "1:1 Mentorship",
    desc: "Ongoing guidance on resumes, projects, and interview strategy from someone who's done it.",
  },
  {
    icon: Code2,
    title: "Domain-Specific Prep",
    desc: "Practice tailored to SDE, Data Science, Product, Consulting, Cybersecurity & more.",
  },
  {
    icon: FileText,
    title: "Resume Review",
    desc: "Share your resume link when you book — your mentor reviews it before your session.",
  },
];

export default function Offerings() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <Reveal>
        <SectionHeading
          eyebrow="What You Get"
          title="Everything you need to walk in prepared"
          subtitle="No subscriptions, no long onboarding — just book a session and show up."
        />
      </Reveal>

      <StaggerGrid className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {OFFERINGS.map(({ icon: Icon, title, desc }) => (
          <StaggerItem key={title}>
            <Link
              to="/book"
              className="group block h-full rounded-2xl border border-(--color-border) bg-(--color-card) p-6 hover:border-(--color-border-strong) transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15">
                  <Icon className="h-5 w-5 text-(--color-accent)" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-(--color-fg-faint) opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-(--color-fg)">{title}</h3>
              <p className="mt-2 text-sm text-(--color-fg-muted)">{desc}</p>
            </Link>
          </StaggerItem>
        ))}
      </StaggerGrid>
    </section>
  );
}
