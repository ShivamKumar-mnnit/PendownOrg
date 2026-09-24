import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import SectionHeading from "../components/SectionHeading";
import Reveal from "../components/Reveal";
import { StaggerGrid, StaggerItem } from "../components/StaggerGrid";
import { COMPANIES } from "../lib/companies";

function CompanyCard({ company }) {
  return (
    <StaggerItem className="flex flex-col rounded-2xl border border-(--color-border) bg-(--color-card) p-6">
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
          style={{ background: `linear-gradient(135deg, ${company.from}, ${company.to})` }}
        >
          {company.initials}
        </span>
        <div>
          <p className="text-sm font-semibold text-(--color-fg)">{company.name}</p>
          <p className="text-xs text-(--color-fg-faint)">{company.category}</p>
        </div>
      </div>

      <ol className="mt-5 space-y-3">
        {company.rounds.map((round, i) => (
          <li key={round.title} className="flex gap-2.5">
            <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-(--color-input) text-[10px] font-semibold text-(--color-fg-muted)">
              {i + 1}
            </span>
            <div>
              <p className="text-xs font-semibold text-(--color-fg)">{round.title}</p>
              <p className="text-xs text-(--color-fg-faint)">{round.desc}</p>
            </div>
          </li>
        ))}
      </ol>

      <Link
        to={`/book?company=${encodeURIComponent(company.name)}`}
        className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-(--color-accent) hover:opacity-75 transition-opacity"
      >
        Get 1:1 guidance for {company.name}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </StaggerItem>
  );
}

export default function CompanyPrep() {
  return (
    <section id="company-prep" className="mx-auto max-w-6xl px-5 py-20">
      <Reveal>
        <SectionHeading
          eyebrow="Company-Wise Prep"
          title="Know how top companies hire"
          subtitle="A general outline of each company's typical hiring rounds — want to go deeper on one? Book a 1:1 session and we'll mock it beforehand."
        />
      </Reveal>

      <Reveal delay={0.08}>
        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-(--color-fg-faint)">
          <CheckCircle2 className="h-3.5 w-3.5 text-(--color-accent-emerald)" />
          Publicly known process outlines — not affiliated with the companies listed, and actual rounds vary by role and year.
        </p>
      </Reveal>

      <StaggerGrid className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {COMPANIES.map((company) => (
          <CompanyCard key={company.id} company={company} />
        ))}
      </StaggerGrid>
    </section>
  );
}
