import { Link } from "react-router-dom";
import { Video, Users, CheckCircle2, ArrowRight } from "lucide-react";
import SectionHeading from "../components/SectionHeading";
import Reveal from "../components/Reveal";
import { StaggerGrid, StaggerItem } from "../components/StaggerGrid";

const TRACKS = [
  {
    icon: Video,
    title: "Mock Interview",
    tagline: "One focused round, real format",
    points: [
      "A single, structured interview round in your domain",
      "Scored the way a real interviewer would score you",
      "Written feedback you can act on immediately",
    ],
  },
  {
    icon: Users,
    title: "1:1 Mentorship",
    tagline: "Ongoing guidance, not a one-off",
    points: [
      "Resume, project, and strategy conversations",
      "Multiple sessions with the same mentor over time",
      "Help beyond interviews — offers, negotiation, next steps",
    ],
  },
];

export default function TwoTracks() {
  return (
    <section className="border-y border-(--color-border) bg-(--color-surface-alt)">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <Reveal>
          <SectionHeading eyebrow="Pick Your Track" title="Two ways to prep with InoByt" />
        </Reveal>

        <StaggerGrid className="mt-12 grid gap-6 sm:grid-cols-2">
          {TRACKS.map(({ icon: Icon, title, tagline, points }) => (
            <StaggerItem key={title}>
              <Link
                to="/book"
                className="group block h-full rounded-2xl border border-(--color-border) bg-(--color-surface) p-8 hover:border-(--color-accent)/40 transition-colors"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-400">
                  <Icon className="h-6 w-6 text-zinc-950" />
                </div>
                <h3 className="mt-5 text-xl font-bold text-(--color-fg)">{title}</h3>
                <p className="mt-1 text-sm text-(--color-fg-faint)">{tagline}</p>

                <ul className="mt-5 space-y-3">
                  {points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-sm text-(--color-fg-muted)">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-(--color-accent-emerald)" />
                      {p}
                    </li>
                  ))}
                </ul>

                <span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-(--color-accent) group-hover:gap-3 transition-all">
                  Book {title}
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </StaggerItem>
          ))}
        </StaggerGrid>
      </div>
    </section>
  );
}
