import { Link } from "react-router-dom";
import { Presentation, Users2, Laptop2 } from "lucide-react";
import SectionHeading from "../components/SectionHeading";
import Reveal from "../components/Reveal";
import { StaggerGrid, StaggerItem } from "../components/StaggerGrid";

const FORMATS = [
  {
    icon: Presentation,
    title: "On-Campus Workshops",
    desc: "DSA and system design sessions run directly at partner campuses.",
  },
  {
    icon: Users2,
    title: "1:1 Mentor Meets",
    desc: "Face-to-face mentor meet-ups for students who want in-person prep, not just video calls.",
  },
  {
    icon: Laptop2,
    title: "Hands-On Tool Sessions",
    desc: "Practical walkthroughs of the tools and workflows mentors actually use on the job.",
  },
];

export default function CampusActivity() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <Reveal>
        <SectionHeading
          eyebrow="On Campus"
          title="Beyond 1:1 calls — activity on the ground"
          subtitle="What we run when we're on campus with a partner college."
        />
      </Reveal>

      <StaggerGrid className="mt-12 grid gap-5 sm:grid-cols-3">
        {FORMATS.map(({ icon: Icon, title, desc }) => (
          <StaggerItem key={title}>
            <Link
              to="/colleges"
              className="group block h-full rounded-2xl border border-(--color-border) bg-(--color-card) p-6 text-center hover:border-(--color-border-strong) transition-colors"
            >
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/15">
                <Icon className="h-5 w-5 text-(--color-accent)" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-(--color-fg) group-hover:text-(--color-accent) transition-colors">
                {title}
              </h3>
              <p className="mt-2 text-sm text-(--color-fg-muted)">{desc}</p>
            </Link>
          </StaggerItem>
        ))}
      </StaggerGrid>
    </section>
  );
}
