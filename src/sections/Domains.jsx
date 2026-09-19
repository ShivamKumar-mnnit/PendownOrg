import { Link } from "react-router-dom";
import SectionHeading from "../components/SectionHeading";
import Reveal from "../components/Reveal";
import { StaggerGrid, StaggerItem } from "../components/StaggerGrid";
import { DOMAINS } from "../lib/domains";

export default function Domains() {
  const visible = DOMAINS.filter((d) => d.id !== "other");

  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <Reveal>
        <SectionHeading
          eyebrow="Prep Tracks"
          title="Pick your domain, we'll match the mentor"
          subtitle="You'll choose one of these when you book — it's how we find the right mentor for you."
        />
      </Reveal>

      <StaggerGrid className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map(({ id, label, blurb, icon: Icon }) => (
          <StaggerItem key={id}>
            <Link
              to="/book"
              className="group block h-full rounded-2xl border border-(--color-border) bg-(--color-card) p-6 hover:border-(--color-accent)/40 hover:bg-(--color-card-alt) transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15">
                <Icon className="h-5 w-5 text-(--color-accent)" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-(--color-fg) group-hover:text-(--color-accent) transition-colors">
                {label}
              </h3>
              <p className="mt-2 text-sm text-(--color-fg-muted)">{blurb}</p>
            </Link>
          </StaggerItem>
        ))}
      </StaggerGrid>
    </section>
  );
}
