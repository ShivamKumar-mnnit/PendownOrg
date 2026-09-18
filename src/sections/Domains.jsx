import { Link } from "react-router-dom";
import SectionHeading from "../components/SectionHeading";
import { DOMAINS } from "../lib/domains";

export default function Domains() {
  const visible = DOMAINS.filter((d) => d.id !== "other");

  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <SectionHeading
        eyebrow="Prep Tracks"
        title="Pick your domain, we'll match the mentor"
        subtitle="You'll choose one of these when you book — it's how we find the right mentor for you."
      />

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map(({ id, label, blurb, icon: Icon }) => (
          <Link
            key={id}
            to="/book"
            className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:border-indigo-400/40 hover:bg-white/[0.05] transition-colors"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15">
              <Icon className="h-5 w-5 text-indigo-400" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-white group-hover:text-indigo-300 transition-colors">
              {label}
            </h3>
            <p className="mt-2 text-sm text-zinc-400">{blurb}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
